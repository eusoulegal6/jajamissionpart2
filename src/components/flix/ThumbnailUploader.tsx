import React, { useState, useRef, useCallback } from "react";
import { Upload, Loader2, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Stores object-position as a URL hash: #pos=X,Y (percentages 0-100).
 * parseThumbnail() splits url and position for display.
 */
export function parseThumbnail(raw: string | null): { url: string; position: string } {
  if (!raw) return { url: "", position: "50% 50%" };
  const hashIdx = raw.indexOf("#pos=");
  if (hashIdx === -1) return { url: raw, position: "50% 50%" };
  const url = raw.slice(0, hashIdx);
  const coords = raw.slice(hashIdx + 5).split(",");
  const x = Number(coords[0]) || 50;
  const y = Number(coords[1]) || 50;
  return { url, position: `${x}% ${y}%` };
}

export function buildThumbnailUrl(url: string, posX: number, posY: number): string {
  if (!url) return "";
  if (Math.round(posX) === 50 && Math.round(posY) === 50) return url;
  return `${url}#pos=${Math.round(posX)},${Math.round(posY)}`;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  aspectRatio?: string;
}

export default function ThumbnailUploader({ value, onChange, aspectRatio = "16/10" }: Props) {
  const { url, position } = parseThumbnail(value);
  const [posX, setPosX] = useState(() => {
    const parts = position.split(" ");
    return parseFloat(parts[0]) || 50;
  });
  const [posY, setPosY] = useState(() => {
    const parts = position.split(" ");
    return parseFloat(parts[1]) || 50;
  });
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  const uploadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são permitidas");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `flix/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("uploads").getPublicUrl(path);
      const newUrl = pub.publicUrl;
      setPosX(50);
      setPosY(50);
      onChange(newUrl);
      toast.success("Imagem enviada!");
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadImage(file);
  }, [uploadImage]);

  // Drag-the-image-to-reposition: calculates delta as % of container
  const handlePointerMove = useCallback((e: PointerEvent) => {
    const s = dragStartRef.current;
    if (!s || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Invert: dragging right means the focal point moves left
    const dx = ((e.clientX - s.startX) / rect.width) * -100;
    const dy = ((e.clientY - s.startY) / rect.height) * -100;
    setPosX(Math.max(0, Math.min(100, s.startPosX + dx)));
    setPosY(Math.max(0, Math.min(100, s.startPosY + dy)));
  }, []);

  const handlePointerUp = useCallback(() => {
    if (dragStartRef.current) {
      dragStartRef.current = null;
      onChange(buildThumbnailUrl(url, posX, posY));
    }
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }, [url, posX, posY, onChange, handlePointerMove]);

  const startDrag = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragStartRef.current = { startX: e.clientX, startY: e.clientY, startPosX: posX, startPosY: posY };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }, [posX, posY, handlePointerMove, handlePointerUp]);

  const commitPosition = useCallback(() => {
    onChange(buildThumbnailUrl(url, posX, posY));
    setAdjusting(false);
  }, [url, posX, posY, onChange]);

  if (!url) {
    return (
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadImage(file);
          }}
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{ aspectRatio }}
          className={`
            flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
            cursor-pointer transition-all
            ${dragOver
              ? "border-cyan-400 bg-cyan-400/10"
              : "border-white/15 bg-white/5 hover:border-white/30"
            }
          `}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-white/30" />
              <p className="text-sm text-white/40 text-center px-4">
                Clique ou arraste uma imagem aqui
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadImage(file);
        }}
      />

      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden border border-white/10"
        style={{ aspectRatio }}
      >
        <img
          src={url}
          alt="Thumbnail"
          className="w-full h-full object-cover select-none"
          style={{ objectPosition: `${posX}% ${posY}%` }}
          draggable={false}
        />

        {adjusting ? (
          <>
            {/* Full overlay — drag to reposition */}
            <div
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              onPointerDown={startDrag}
              style={{ touchAction: "none" }}
            />
            {/* Hint + confirm bar */}
            <div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none">
              <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                Arraste a imagem para reposicionar
              </span>
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex gap-2">
              <Button
                size="sm"
                onClick={commitPosition}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs flex-1"
              >
                ✓ Confirmar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setAdjusting(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setAdjusting(true)}
              className="text-xs gap-1"
            >
              <Move className="w-3.5 h-3.5" />
              Ajustar posição
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs"
            >
              Trocar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => { onChange(""); setPosX(50); setPosY(50); }}
              className="text-xs"
            >
              Remover
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
