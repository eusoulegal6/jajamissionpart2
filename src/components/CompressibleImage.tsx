import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface CompressibleImageProps {
  src: string;
  alt?: string;
  className?: string;
}

export const CompressibleImage: React.FC<CompressibleImageProps> = ({
  src,
  alt,
  className,
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    inputSize?: number;
    outputSize?: number;
    ratio?: number;
  }>({});

  const isAlreadyCompressed = currentSrc.includes("/compressed-images/");

  const handleCompress = async () => {
    if (isAlreadyCompressed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        "https://mcuquzgpaeoqskesgcnx.supabase.co/functions/v1/compress-image",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: currentSrc }),
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success || !json.publicUrl) {
        throw new Error(json.error || "Compression failed");
      }

      setCurrentSrc(json.publicUrl);
      setStats({
        inputSize: json.tinify?.inputSize,
        outputSize: json.tinify?.outputSize,
        ratio: json.tinify?.ratio,
      });
    } catch (err: any) {
      setError(err?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const savedPercent =
    stats.inputSize && stats.outputSize
      ? Math.round((1 - stats.outputSize / stats.inputSize) * 100)
      : null;

  return (
    <div className="flex flex-col items-start gap-2">
      <img src={currentSrc} alt={alt} className={className} />
      <div className="flex flex-col gap-1 text-xs">
        <Button
          type="button"
          onClick={handleCompress}
          disabled={loading || isAlreadyCompressed}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          {isAlreadyCompressed
            ? "Already compressed"
            : loading
            ? "Compressing..."
            : "Compress image"}
        </Button>

        {savedPercent !== null && (
          <span className="text-green-600">
            Saved {savedPercent}% ({formatBytes(stats.inputSize!)} →{" "}
            {formatBytes(stats.outputSize!)})
          </span>
        )}

        {error && <span className="text-destructive">Error: {error}</span>}
      </div>
    </div>
  );
};
