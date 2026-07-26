import { useEffect, useMemo, useRef, useState } from "react";
import { getCachedTtsUrl } from "@/lib/ttsCached";

type UrlMap = Record<string, string>;

const CACHE_KEY = "vocabulary_audio_cache_v6"; // Force reload with debug logs
const CACHE_VERSION = 6;

// Load cached URLs from localStorage
function loadFromLocalStorage(): UrlMap {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.version === CACHE_VERSION && parsed.urls) {
        return parsed.urls;
      }
    }
  } catch (err) {
    console.warn("Failed to load audio cache from localStorage:", err);
  }
  return {};
}

// Save URLs to localStorage
function saveToLocalStorage(urls: UrlMap) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version: CACHE_VERSION, urls })
    );
  } catch (err) {
    console.warn("Failed to save audio cache to localStorage:", err);
  }
}

// Process requests in batches to avoid hitting ElevenLabs concurrent request limits
async function processBatched<T>(
  items: T[],
  processor: (item: T) => Promise<any>,
  batchSize: number = 3,
  delayMs: number = 500
): Promise<any[]> {
  const results: any[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    // Add delay between batches (except after the last one)
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

export function useVocabularyAudio(allEnglishTexts: string[]) {
  const [urlMap, setUrlMap] = useState<UrlMap>(() => loadFromLocalStorage());
  const [isPreloading, setIsPreloading] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const preloadedRef = useRef(false);

  const uniqueTexts = useMemo(
    () =>
      Array.from(
        new Set(
          (allEnglishTexts || [])
            .map((t) => t?.trim())
            .filter((t) => t && t.length > 0)
        )
      ),
    [allEnglishTexts]
  );

  // Pre-generate all audios in batches to avoid rate limits
  useEffect(() => {
    if (!uniqueTexts.length || preloadedRef.current) return;
    
    // Get cached URLs from localStorage
    const cachedUrls = loadFromLocalStorage();
    
    // Filter out texts that are already cached
    const textsToFetch = uniqueTexts.filter((text) => !cachedUrls[text]);
    
    // If all texts are cached, just update state and skip fetching
    if (textsToFetch.length === 0) {
      setUrlMap((prev) => ({ ...prev, ...cachedUrls }));
      preloadedRef.current = true;
      return;
    }
    
    preloadedRef.current = true;
    setIsPreloading(true);

    (async () => {
      try {
        const entries = await processBatched(
          textsToFetch,
          async (text) => {
            try {
              const url = await getCachedTtsUrl(text);
              return [text, url] as [string, string | null];
            } catch (err) {
              console.error(`Failed to get audio for "${text}":`, err);
              return [text, null] as [string, string | null];
            }
          },
          3, // batch size (stay under 5 concurrent limit)
          600 // delay between batches in ms
        );

        const validEntries = entries.filter(
          ([, url]: [string, string | null]) => typeof url === "string" && url
        ) as [string, string][];

        const newUrls = Object.fromEntries(validEntries);
        const mergedUrls = { ...cachedUrls, ...newUrls };

        // Save to localStorage for future visits
        saveToLocalStorage(mergedUrls);

        setUrlMap((prev) => ({
          ...prev,
          ...mergedUrls,
        }));
      } catch (err) {
        console.error("Error preloading vocabulary audio:", err);
      } finally {
        setIsPreloading(false);
      }
    })();
  }, [uniqueTexts.join("|")]);

  const play = async (text: string) => {
    const key = text?.trim();
    if (!key) return;

    // Stop current audio if any
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }

    let url = urlMap[key];
    if (!url) {
      // fallback: get or create the URL on demand
      try {
        url = (await getCachedTtsUrl(key)) ?? "";
        if (!url) return;
        
        // Save to state and localStorage
        setUrlMap((prev) => {
          const updated = { ...prev, [key]: url };
          saveToLocalStorage(updated);
          return updated;
        });
      } catch (err) {
        console.error(`Failed to get audio on demand for "${key}":`, err);
        return;
      }
    }

    const audio = new Audio(url);
    currentAudioRef.current = audio;
    
    audio.play().catch((err) => {
      console.error("Error playing audio:", err);
    });
  };

  return { play, urlMap, isPreloading };
}
