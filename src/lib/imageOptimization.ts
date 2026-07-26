import { supabase } from "@/integrations/supabase/client";
import { getDisplayImageUrl } from "@/utils/imageOptimization";

// In-memory cache: original URL -> optimized URL
const optimizedCache = new Map<string, string>();

// Dedupe in-flight requests
const inFlight = new Map<string, Promise<string | null>>();

/**
 * Check if a URL should be looked up in the optimization table.
 * Excludes local URLs, data URIs, and already-optimized URLs.
 */
export function isOptimizableUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  
  // Skip local/static assets
  if (url.startsWith("/")) return false;
  if (url.startsWith("data:")) return false;
  if (url.startsWith("blob:")) return false;
  
  // Skip already optimized URLs (from compressed-images bucket)
  if (url.includes("/compressed-images/")) return false;
  if (url.includes("/tinified/")) return false;
  
  // Only optimize Supabase storage URLs
  if (!url.includes(".supabase.co/storage/v1/object/public/")) return false;
  
  return true;
}

/**
 * Get the optimized URL for a given original URL.
 * Returns the optimized URL if found and status is 'done', otherwise null.
 * Results are cached in memory.
 */
export async function getOptimizedUrl(originalUrl: string): Promise<string | null> {
  if (!isOptimizableUrl(originalUrl)) {
    return null;
  }

  // Check cache first
  if (optimizedCache.has(originalUrl)) {
    return optimizedCache.get(originalUrl)!;
  }

  // Check for in-flight request to dedupe
  if (inFlight.has(originalUrl)) {
    return inFlight.get(originalUrl)!;
  }

  // Create the lookup promise
  const lookupPromise = (async (): Promise<string | null> => {
    try {
      // Build candidate URLs to check (raw and display-transformed)
      const displayUrl = getDisplayImageUrl(originalUrl);
      const candidates = [originalUrl];
      if (displayUrl !== originalUrl) {
        candidates.push(displayUrl);
      }

      // Query the optimization table
      const { data, error } = await supabase
        .from("image_optimizations")
        .select("original_url, optimized_url, status")
        .in("original_url", candidates)
        .eq("status", "done")
        .limit(1);

      if (error) {
        console.warn("[imageOptimization] Query error:", error.message);
        return null;
      }

      if (data && data.length > 0 && data[0].optimized_url) {
        const optimizedUrl = data[0].optimized_url;
        
        // Cache both candidates to avoid future lookups
        optimizedCache.set(originalUrl, optimizedUrl);
        if (displayUrl !== originalUrl) {
          optimizedCache.set(displayUrl, optimizedUrl);
        }
        
        return optimizedUrl;
      }

      return null;
    } catch (err) {
      console.warn("[imageOptimization] Lookup failed:", err);
      return null;
    } finally {
      // Clean up in-flight tracker
      inFlight.delete(originalUrl);
    }
  })();

  inFlight.set(originalUrl, lookupPromise);
  return lookupPromise;
}

/**
 * Prefetch optimized URLs for a batch of URLs.
 * Useful for slideshows to load all optimized versions at once.
 */
export async function prefetchOptimizedUrls(urls: string[]): Promise<void> {
  // Filter to only optimizable URLs that aren't already cached
  const urlsToFetch = urls.filter(
    (url) => isOptimizableUrl(url) && !optimizedCache.has(url)
  );

  if (urlsToFetch.length === 0) return;

  try {
    // Build all candidate URLs (original + display versions)
    const allCandidates: string[] = [];
    const urlToDisplayMap = new Map<string, string>();
    
    for (const url of urlsToFetch) {
      allCandidates.push(url);
      const displayUrl = getDisplayImageUrl(url);
      if (displayUrl !== url) {
        allCandidates.push(displayUrl);
        urlToDisplayMap.set(url, displayUrl);
      }
    }

    // Batch query
    const { data, error } = await supabase
      .from("image_optimizations")
      .select("original_url, optimized_url, status")
      .in("original_url", allCandidates)
      .eq("status", "done");

    if (error) {
      console.warn("[imageOptimization] Prefetch query error:", error.message);
      return;
    }

    if (data) {
      // Build a lookup map from the results
      const resultMap = new Map<string, string>();
      for (const row of data) {
        if (row.optimized_url) {
          resultMap.set(row.original_url, row.optimized_url);
        }
      }

      // Populate cache for all original URLs
      for (const url of urlsToFetch) {
        const displayUrl = urlToDisplayMap.get(url);
        
        // Check if original or display URL has a match
        const optimized = resultMap.get(url) || (displayUrl ? resultMap.get(displayUrl) : null);
        
        if (optimized) {
          optimizedCache.set(url, optimized);
          if (displayUrl) {
            optimizedCache.set(displayUrl, optimized);
          }
        }
      }
    }
  } catch (err) {
    console.warn("[imageOptimization] Prefetch failed:", err);
  }
}

/**
 * Clear the in-memory cache (useful for testing or refresh).
 */
export function clearOptimizedCache(): void {
  optimizedCache.clear();
  inFlight.clear();
}
