import { useEffect, useRef } from "react";
import { getDisplayImageUrl } from "@/utils/imageOptimization";

/**
 * Extracts all image URLs from lesson pages (any page type that may contain images).
 */
function extractImageUrls(pages: any[]): string[] {
  const urls: string[] = [];

  for (const page of pages) {
    // Direct imageUrl (content, multipleChoice, exactAnswer, audioMultipleChoice, etc.)
    if (page.imageUrl) urls.push(page.imageUrl);
    if (page.content?.imageUrl) urls.push(page.content.imageUrl);

    // TTS Article
    if (page.type === "ttsArticle" && page.imageUrl) urls.push(page.imageUrl);

    // Custom pronunciation slides
    if (page.type === "customPronunciationSlides" && Array.isArray(page.slides)) {
      // no images typically, but safe guard
    }

    // Audio slides — no images

    // Slideshow pages are handled by SlideshowPage's own preloader, skip them
  }

  // Deduplicate
  return [...new Set(urls.filter(Boolean))];
}

/**
 * Preloads all images from a lesson's pages in the background using the browser Image cache.
 * Processes up to `concurrency` images at a time, in page order (nearest pages first).
 */
export function useImagePreloader(pages: any[] | null, concurrency = 4) {
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;

    if (!pages || pages.length === 0) return;

    const urls = extractImageUrls(pages).map(getDisplayImageUrl).filter(Boolean);

    if (urls.length === 0) return;

    console.log(`🖼️ Preloading ${urls.length} lesson images in background`);

    let current = 0;

    function loadNext() {
      if (abortRef.current || current >= urls.length) return;
      const url = urls[current++];
      const img = new Image();
      img.onload = loadNext;
      img.onerror = loadNext;
      img.src = url;
    }

    // Kick off `concurrency` parallel chains
    for (let i = 0; i < Math.min(concurrency, urls.length); i++) {
      loadNext();
    }

    return () => {
      abortRef.current = true;
    };
  }, [pages, concurrency]);
}
