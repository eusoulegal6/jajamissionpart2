import React, { useState, useEffect, ImgHTMLAttributes } from "react";
import { getDisplayImageUrl } from "@/utils/imageOptimization";
import { getOptimizedUrl, isOptimizableUrl } from "@/lib/imageOptimization";

interface OptimizedImgProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | null | undefined;
}

/**
 * A drop-in replacement for <img> that automatically uses optimized versions
 * from the image_optimizations table when available.
 * 
 * - Shows the original/display URL immediately
 * - Looks up the optimized version in the background
 * - Swaps to optimized URL when found
 * - Falls back gracefully on any error
 */
const OptimizedImg: React.FC<OptimizedImgProps> = ({ src, alt, ...rest }) => {
  // Compute the base display URL (using existing utility)
  const displayUrl = getDisplayImageUrl(src);
  
  // State for the final URL to render
  const [renderUrl, setRenderUrl] = useState<string>(displayUrl);

  useEffect(() => {
    // Reset to display URL when src changes
    setRenderUrl(displayUrl);

    // Skip optimization lookup for non-optimizable URLs
    if (!isOptimizableUrl(src)) {
      return;
    }

    let cancelled = false;

    const lookupOptimized = async () => {
      try {
        const optimized = await getOptimizedUrl(src!);
        if (!cancelled && optimized) {
          setRenderUrl(optimized);
        }
      } catch (err) {
        // Silently ignore errors, keep original URL
        console.warn("[OptimizedImg] Lookup error:", err);
      }
    };

    lookupOptimized();

    return () => {
      cancelled = true;
    };
  }, [src, displayUrl]);

  // Don't render anything if no src
  if (!displayUrl) {
    return null;
  }

  return (
    <img
      src={renderUrl}
      alt={alt || ""}
      {...rest}
    />
  );
};

export default OptimizedImg;
