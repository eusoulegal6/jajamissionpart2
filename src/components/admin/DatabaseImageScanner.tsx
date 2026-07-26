import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface DatabaseImage {
  id: string;
  table: string;
  recordId: string;
  pageIndex: number;
  field: string;
  imageUrl: string;
  status: "pending" | "compressing" | "done" | "skipped" | "error";
  compressedUrl?: string;
  error?: string;
}

const COMPRESS_ENDPOINT =
  "https://mcuquzgpaeoqskesgcnx.supabase.co/functions/v1/compress-image";

export function DatabaseImageScanner() {
  const [images, setImages] = useState<DatabaseImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({ done: 0, skipped: 0, errors: 0 });

  const scanDatabaseImages = async () => {
    setIsLoading(true);
    const allImages: DatabaseImage[] = [];

    try {
      // Scan lessons table (array format)
      const { data: lessonsArray } = await supabase
        .from("lessons")
        .select("id, content")
        .not("content", "is", null);

      if (lessonsArray) {
        for (const lesson of lessonsArray) {
          const content = lesson.content as any;
          if (Array.isArray(content)) {
            content.forEach((page: any, idx: number) => {
              if (page?.imageUrl) {
                const { status, error } = getInitialStatus(page.imageUrl);
                allImages.push({
                  id: `lessons-${lesson.id}-${idx}-imageUrl`,
                  table: "lessons",
                  recordId: lesson.id,
                  pageIndex: idx,
                  field: "imageUrl",
                  imageUrl: page.imageUrl,
                  status,
                  error,
                });
              }
              if (page?.image) {
                const { status, error } = getInitialStatus(page.image);
                allImages.push({
                  id: `lessons-${lesson.id}-${idx}-image`,
                  table: "lessons",
                  recordId: lesson.id,
                  pageIndex: idx,
                  field: "image",
                  imageUrl: page.image,
                  status,
                  error,
                });
              }
            });
          } else if (content?.pages && Array.isArray(content.pages)) {
            content.pages.forEach((page: any, idx: number) => {
              if (page?.imageUrl) {
                const { status, error } = getInitialStatus(page.imageUrl);
                allImages.push({
                  id: `lessons-${lesson.id}-${idx}-imageUrl`,
                  table: "lessons",
                  recordId: lesson.id,
                  pageIndex: idx,
                  field: "imageUrl",
                  imageUrl: page.imageUrl,
                  status,
                  error,
                });
              }
              if (page?.image) {
                const { status, error } = getInitialStatus(page.image);
                allImages.push({
                  id: `lessons-${lesson.id}-${idx}-image`,
                  table: "lessons",
                  recordId: lesson.id,
                  pageIndex: idx,
                  field: "image",
                  imageUrl: page.image,
                  status,
                  error,
                });
              }
            });
          }
        }
      }

      // Scan book_lessons table
      const { data: bookLessons } = await supabase
        .from("book_lessons")
        .select("id, content")
        .not("content", "is", null);

      if (bookLessons) {
        for (const lesson of bookLessons) {
          const content = lesson.content as any;
          if (Array.isArray(content)) {
            content.forEach((page: any, idx: number) => {
              if (page?.imageUrl) {
                const { status, error } = getInitialStatus(page.imageUrl);
                allImages.push({
                  id: `book_lessons-${lesson.id}-${idx}-imageUrl`,
                  table: "book_lessons",
                  recordId: lesson.id,
                  pageIndex: idx,
                  field: "imageUrl",
                  imageUrl: page.imageUrl,
                  status,
                  error,
                });
              }
              if (page?.image) {
                const { status, error } = getInitialStatus(page.image);
                allImages.push({
                  id: `book_lessons-${lesson.id}-${idx}-image`,
                  table: "book_lessons",
                  recordId: lesson.id,
                  pageIndex: idx,
                  field: "image",
                  imageUrl: page.image,
                  status,
                  error,
                });
              }
            });
          } else if (content?.pages && Array.isArray(content.pages)) {
            content.pages.forEach((page: any, idx: number) => {
              if (page?.imageUrl) {
                const { status, error } = getInitialStatus(page.imageUrl);
                allImages.push({
                  id: `book_lessons-${lesson.id}-${idx}-imageUrl`,
                  table: "book_lessons",
                  recordId: lesson.id,
                  pageIndex: idx,
                  field: "imageUrl",
                  imageUrl: page.imageUrl,
                  status,
                  error,
                });
              }
              if (page?.image) {
                const { status, error } = getInitialStatus(page.image);
                allImages.push({
                  id: `book_lessons-${lesson.id}-${idx}-image`,
                  table: "book_lessons",
                  recordId: lesson.id,
                  pageIndex: idx,
                  field: "image",
                  imageUrl: page.image,
                  status,
                  error,
                });
              }
            });
          }
        }
      }

      // Scan content_items table
      const { data: contentItems } = await supabase
        .from("content_items")
        .select("id, content")
        .not("content", "is", null);

      if (contentItems) {
        for (const item of contentItems) {
          const content = item.content as any;
          if (content?.pages && Array.isArray(content.pages)) {
            content.pages.forEach((page: any, idx: number) => {
              if (page?.imageUrl) {
                const { status, error } = getInitialStatus(page.imageUrl);
                allImages.push({
                  id: `content_items-${item.id}-${idx}-imageUrl`,
                  table: "content_items",
                  recordId: item.id,
                  pageIndex: idx,
                  field: "imageUrl",
                  imageUrl: page.imageUrl,
                  status,
                  error,
                });
              }
              if (page?.image) {
                const { status, error } = getInitialStatus(page.image);
                allImages.push({
                  id: `content_items-${item.id}-${idx}-image`,
                  table: "content_items",
                  recordId: item.id,
                  pageIndex: idx,
                  field: "image",
                  imageUrl: page.image,
                  status,
                  error,
                });
              }
            });
          }
        }
      }

      // Scan toefl_items table
      const { data: toeflItems } = await supabase
        .from("toefl_items")
        .select("id, content")
        .not("content", "is", null);

      if (toeflItems) {
        for (const item of toeflItems) {
          const content = item.content as any;
          if (content?.pages && Array.isArray(content.pages)) {
            content.pages.forEach((page: any, idx: number) => {
              if (page?.imageUrl) {
                const { status, error } = getInitialStatus(page.imageUrl);
                allImages.push({
                  id: `toefl_items-${item.id}-${idx}-imageUrl`,
                  table: "toefl_items",
                  recordId: item.id,
                  pageIndex: idx,
                  field: "imageUrl",
                  imageUrl: page.imageUrl,
                  status,
                  error,
                });
              }
              if (page?.image) {
                const { status, error } = getInitialStatus(page.image);
                allImages.push({
                  id: `toefl_items-${item.id}-${idx}-image`,
                  table: "toefl_items",
                  recordId: item.id,
                  pageIndex: idx,
                  field: "image",
                  imageUrl: page.image,
                  status,
                  error,
                });
              }
            });
          }
        }
      }

      setImages(allImages);
      const skippedCount = allImages.filter((img) => img.status === "skipped").length;
      const externalCount = allImages.filter((img) => img.error === "External URL (not Supabase storage)").length;
      const alreadyCompressedCount = skippedCount - externalCount;
      setStats({ done: 0, skipped: skippedCount, errors: 0 });
      toast.success(
        `Found ${allImages.length} images: ${allImages.length - skippedCount} pending, ${alreadyCompressedCount} already compressed, ${externalCount} external (skipped)`
      );
    } catch (error) {
      console.error("Error scanning database:", error);
      toast.error("Failed to scan database");
    } finally {
      setIsLoading(false);
    }
  };

  const isAlreadyCompressed = (url: string) => {
    return url.includes("/compressed-images/") || url.includes("compressed-images");
  };

  // Check if URL is from Supabase storage (can be compressed server-side)
  const isSupabaseStorageUrl = (url: string) => {
    return url.includes(".supabase.co/storage/");
  };

  // Determine the initial status for an image
  const getInitialStatus = (url: string): { status: DatabaseImage["status"]; error?: string } => {
    if (isAlreadyCompressed(url)) {
      return { status: "skipped", error: "Already compressed" };
    }
    if (!isSupabaseStorageUrl(url)) {
      return { status: "skipped", error: "External URL (not Supabase storage)" };
    }
    return { status: "pending" };
  };

  const compressAllImages = async () => {
    setIsCompressing(true);
    let doneCount = stats.skipped;
    let errorCount = 0;

    const pendingImages = images.filter((img) => img.status === "pending");

    for (let i = 0; i < pendingImages.length; i++) {
      const img = pendingImages[i];
      setCurrentIndex(i + 1);

      // Update status to compressing
      setImages((prev) =>
        prev.map((item) =>
          item.id === img.id ? { ...item, status: "compressing" } : item
        )
      );

      try {
        const res = await fetch(COMPRESS_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: img.imageUrl }),
        });

        const json = await res.json();

        if (res.ok && json.success && json.publicUrl) {
          // Update the database with the new URL
          const success = await updateDatabaseImage(
            img.table,
            img.recordId,
            img.pageIndex,
            img.field,
            json.publicUrl
          );

          if (success) {
            setImages((prev) =>
              prev.map((item) =>
                item.id === img.id
                  ? { ...item, status: "done", compressedUrl: json.publicUrl }
                  : item
              )
            );
            doneCount++;
          } else {
            throw new Error("Failed to update database");
          }
        } else {
          throw new Error(json.error || "Compression failed");
        }
      } catch (err: any) {
        setImages((prev) =>
          prev.map((item) =>
            item.id === img.id
              ? { ...item, status: "error", error: err?.message || "Unknown error" }
              : item
          )
        );
        errorCount++;
      }

      setStats({ done: doneCount, skipped: stats.skipped, errors: errorCount });
    }

    setIsCompressing(false);
    toast.success(`Compression complete! ${doneCount} done, ${errorCount} errors`);
  };

  const updateDatabaseImage = async (
    table: string,
    recordId: string,
    pageIndex: number,
    field: string,
    newUrl: string
  ): Promise<boolean> => {
    try {
      // Fetch the current content based on table type
      let data: { content: any } | null = null;
      let fetchError: any = null;

      if (table === "lessons") {
        const result = await supabase
          .from("lessons")
          .select("content")
          .eq("id", recordId)
          .single();
        data = result.data;
        fetchError = result.error;
      } else if (table === "book_lessons") {
        const result = await supabase
          .from("book_lessons")
          .select("content")
          .eq("id", recordId)
          .single();
        data = result.data;
        fetchError = result.error;
      } else if (table === "content_items") {
        const result = await supabase
          .from("content_items")
          .select("content")
          .eq("id", recordId)
          .single();
        data = result.data;
        fetchError = result.error;
      } else if (table === "toefl_items") {
        const result = await supabase
          .from("toefl_items")
          .select("content")
          .eq("id", recordId)
          .single();
        data = result.data;
        fetchError = result.error;
      }

      if (fetchError || !data) {
        console.error("Failed to fetch record:", fetchError);
        return false;
      }

      const content = data.content as any;
      let updatedContent: any;

      // Handle array format (lessons)
      if (Array.isArray(content)) {
        updatedContent = [...content];
        if (updatedContent[pageIndex]) {
          updatedContent[pageIndex] = {
            ...updatedContent[pageIndex],
            [field]: newUrl,
          };
        }
      }
      // Handle object with pages array format
      else if (content?.pages && Array.isArray(content.pages)) {
        updatedContent = {
          ...content,
          pages: content.pages.map((page: any, idx: number) =>
            idx === pageIndex ? { ...page, [field]: newUrl } : page
          ),
        };
      } else {
        console.error("Unknown content format");
        return false;
      }

      // Update the record based on table type
      let updateError: any = null;
      
      if (table === "lessons") {
        const result = await supabase
          .from("lessons")
          .update({ content: updatedContent })
          .eq("id", recordId);
        updateError = result.error;
      } else if (table === "book_lessons") {
        const result = await supabase
          .from("book_lessons")
          .update({ content: updatedContent })
          .eq("id", recordId);
        updateError = result.error;
      } else if (table === "content_items") {
        const result = await supabase
          .from("content_items")
          .update({ content: updatedContent })
          .eq("id", recordId);
        updateError = result.error;
      } else if (table === "toefl_items") {
        const result = await supabase
          .from("toefl_items")
          .update({ content: updatedContent })
          .eq("id", recordId);
        updateError = result.error;
      }

      if (updateError) {
        console.error("Failed to update record:", updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error updating database:", error);
      return false;
    }
  };

  const pendingCount = images.filter((img) => img.status === "pending").length;
  const progress = images.length > 0 
    ? ((stats.done + stats.errors) / images.length) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={scanDatabaseImages} disabled={isLoading || isCompressing}>
          {isLoading ? "Scanning..." : "Scan Database"}
        </Button>

        {images.length > 0 && (
          <Button
            onClick={compressAllImages}
            disabled={isCompressing || pendingCount === 0}
            className="bg-primary hover:bg-primary/90"
          >
            {isCompressing
              ? `Compressing ${currentIndex} of ${pendingCount}...`
              : `Compress ${pendingCount} Images`}
          </Button>
        )}
      </div>

      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total: {images.length}</span>
            <span>Done: {stats.done} | Skipped: {stats.skipped} | Errors: {stats.errors}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {images.length > 0 && (
        <div className="border rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="p-3 text-left">Preview</th>
                <th className="p-3 text-left">Table</th>
                <th className="p-3 text-left">Record ID</th>
                <th className="p-3 text-left">Page</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {images.map((img) => (
                <tr key={img.id} className="border-t">
                  <td className="p-3">
                    <img
                      src={img.compressedUrl || img.imageUrl}
                      alt=""
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </td>
                  <td className="p-3 font-mono text-xs">{img.table}</td>
                  <td className="p-3 font-mono text-xs truncate max-w-[150px]">
                    {img.recordId}
                  </td>
                  <td className="p-3">{img.pageIndex}</td>
                  <td className="p-3">
                    <StatusBadge status={img.status} error={img.error} />
                    {img.status === "error" && img.error && (
                      <div className="text-xs text-destructive mt-1">{img.error}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, error }: { status: DatabaseImage["status"]; error?: string }) {
  const styles: Record<DatabaseImage["status"], string> = {
    pending: "bg-gray-100 text-gray-600",
    compressing: "bg-yellow-100 text-yellow-700",
    done: "bg-green-100 text-green-700",
    skipped: "bg-blue-100 text-blue-700",
    error: "bg-red-100 text-red-700",
  };

  // Show specific label based on error reason
  const getLabel = () => {
    if (status === "skipped") {
      if (error === "External URL (not Supabase storage)") return "External URL";
      if (error === "Already compressed") return "Already compressed";
      return "Skipped";
    }
    const labels: Record<DatabaseImage["status"], string> = {
      pending: "Pending",
      compressing: "Compressing...",
      done: "Done",
      skipped: "Skipped",
      error: "Error",
    };
    return labels[status];
  };

  // Use orange for external URLs to distinguish them
  const getStyle = () => {
    if (status === "skipped" && error === "External URL (not Supabase storage)") {
      return "bg-orange-100 text-orange-700";
    }
    return styles[status];
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${getStyle()}`}>
      {getLabel()}
    </span>
  );
}
