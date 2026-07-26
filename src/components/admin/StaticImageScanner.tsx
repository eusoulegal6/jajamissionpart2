import React, { useState } from "react";
import { STATIC_IMAGES } from "@/admin/staticImages";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

type CompressionStatus = "pending" | "compressing" | "done" | "error";

interface ImageState {
  status: CompressionStatus;
  compressedUrl?: string;
  error?: string;
}

const COMPRESS_ENDPOINT =
  "https://mcuquzgpaeoqskesgcnx.supabase.co/functions/v1/compress-image";

const getFullUrl = (url: string): string => {
  if (url.startsWith("/")) {
    return `${window.location.origin}${url}`;
  }
  return url;
};

export function StaticImageScanner() {
  const [imageStates, setImageStates] = useState<Record<string, ImageState>>(
    () =>
      STATIC_IMAGES.reduce(
        (acc, entry) => {
          acc[entry.id] = { status: "pending" };
          return acc;
        },
        {} as Record<string, ImageState>
      )
  );

  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const compressAll = async () => {
    setIsRunning(true);
    const newMapping: Record<string, string> = {};

    for (let i = 0; i < STATIC_IMAGES.length; i++) {
      const entry = STATIC_IMAGES[i];
      setCurrentIndex(i + 1);

      if (imageStates[entry.id]?.status === "done") {
        if (imageStates[entry.id]?.compressedUrl) {
          newMapping[entry.url] = imageStates[entry.id].compressedUrl!;
        }
        continue;
      }

      setImageStates((prev) => ({
        ...prev,
        [entry.id]: { status: "compressing" },
      }));

      try {
        const fullUrl = getFullUrl(entry.url);
        const res = await fetch(COMPRESS_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: fullUrl }),
        });

        const json = await res.json();

        if (res.ok && json.success && json.publicUrl) {
          newMapping[entry.url] = json.publicUrl;
          setImageStates((prev) => ({
            ...prev,
            [entry.id]: { status: "done", compressedUrl: json.publicUrl },
          }));
        } else {
          throw new Error(json.error || "Compression failed");
        }
      } catch (err: any) {
        setImageStates((prev) => ({
          ...prev,
          [entry.id]: { status: "error", error: err?.message || "Unknown error" },
        }));
      }
    }

    setMapping(newMapping);
    setIsRunning(false);
    toast.success("Compression complete!");
  };

  const copyMapping = async () => {
    const json = JSON.stringify(mapping, null, 2);
    await navigator.clipboard.writeText(json);
    toast.success("Mapping JSON copied to clipboard!");
  };

  const doneCount = Object.values(imageStates).filter((s) => s.status === "done").length;
  const errorCount = Object.values(imageStates).filter((s) => s.status === "error").length;
  const progress = (doneCount / STATIC_IMAGES.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={compressAll} disabled={isRunning} className="bg-primary hover:bg-primary/90">
          {isRunning
            ? `Compressing ${currentIndex} of ${STATIC_IMAGES.length}...`
            : "Compress ALL Static Images"}
        </Button>

        <span className="text-sm text-muted-foreground">
          Done: {doneCount} / {STATIC_IMAGES.length} | Errors: {errorCount}
        </span>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="p-3 text-left">Preview</th>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Compressed URL</th>
            </tr>
          </thead>
          <tbody>
            {STATIC_IMAGES.map((entry) => {
              const state = imageStates[entry.id];
              return (
                <tr key={entry.id} className="border-t">
                  <td className="p-3">
                    <img
                      src={state?.compressedUrl || entry.url}
                      alt={entry.description || entry.id}
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-xs">{entry.id}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">
                      {entry.description}
                    </div>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={state?.status || "pending"} />
                    {state?.error && (
                      <div className="text-xs text-destructive mt-1">{state.error}</div>
                    )}
                  </td>
                  <td className="p-3">
                    {state?.compressedUrl ? (
                      <a
                        href={state.compressedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline break-all"
                      >
                        {state.compressedUrl.slice(0, 50)}...
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {Object.keys(mapping).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">URL Mapping JSON</h2>
            <Button onClick={copyMapping} variant="outline" size="sm">
              Copy mapping JSON
            </Button>
          </div>
          <textarea
            readOnly
            value={JSON.stringify(mapping, null, 2)}
            className="w-full h-48 p-3 font-mono text-xs border rounded-lg bg-muted"
          />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: CompressionStatus }) {
  const styles: Record<CompressionStatus, string> = {
    pending: "bg-gray-100 text-gray-600",
    compressing: "bg-yellow-100 text-yellow-700",
    done: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
  };

  const labels: Record<CompressionStatus, string> = {
    pending: "Not started",
    compressing: "Compressing...",
    done: "Done",
    error: "Error",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
