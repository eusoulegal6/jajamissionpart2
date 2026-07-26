import React from "react";

/**
 * Bunny Stream URL detection + embed normalization.
 *
 * Supported input formats:
 *  - https://iframe.mediadelivery.net/embed/<libraryId>/<videoGuid>?...
 *  - https://iframe.mediadelivery.net/play/<libraryId>/<videoGuid>?...
 *  - https://video.bunnycdn.com/play/<libraryId>/<videoGuid>
 *  - Direct iframe URLs that already point to mediadelivery.net
 *
 * This is purely additive: when a URL does NOT match Bunny Stream,
 * callers fall back to their existing <video>/YouTube logic.
 */
export const isBunnyStreamUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes("iframe.mediadelivery.net") ||
    u.includes("mediadelivery.net/embed/") ||
    u.includes("mediadelivery.net/play/") ||
    u.includes("video.bunnycdn.com/play/") ||
    u.includes("video.bunnycdn.com/embed/")
  );
};

export const getBunnyEmbedUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    // Normalize host + ensure /embed/ path
    let path = parsed.pathname.replace("/play/", "/embed/");
    if (!path.includes("/embed/")) {
      // Already /embed/ or unknown — leave as-is
    }
    const host = "iframe.mediadelivery.net";

    // Default query params for a nicer player experience
    const params = new URLSearchParams(parsed.search);
    if (!params.has("autoplay")) params.set("autoplay", "false");
    if (!params.has("preload")) params.set("preload", "true");
    if (!params.has("responsive")) params.set("responsive", "true");

    return `https://${host}${path}?${params.toString()}`;
  } catch {
    return url;
  }
};

interface BunnyStreamPlayerProps {
  videoUrl: string;
  title?: string;
  className?: string;
  /** When true, wrap in an aspect-video container. Default true. */
  aspectVideo?: boolean;
}

const BunnyStreamPlayer: React.FC<BunnyStreamPlayerProps> = ({
  videoUrl,
  title,
  className,
  aspectVideo = true,
}) => {
  const src = getBunnyEmbedUrl(videoUrl);

  return (
    <div
      className={`relative w-full bg-black rounded-lg overflow-hidden ${
        aspectVideo ? "aspect-video" : ""
      } ${className ?? ""}`}
    >
      <iframe
        src={src}
        title={title || "Bunny Stream video"}
        loading="lazy"
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
      />
    </div>
  );
};

export default BunnyStreamPlayer;
