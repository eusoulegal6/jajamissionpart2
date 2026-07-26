import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, Film, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useFlixProgram,
  useFlixEpisodes,
  useCreateFlixEpisode,
  useUpdateFlixEpisode,
  useDeleteFlixEpisode,
  FlixEpisode,
} from "@/hooks/useFlixVideos";
import { useKraken } from "@/contexts/KrakenContext";
import { parseThumbnail } from "@/components/flix/ThumbnailUploader";
import horizonsFlixIcon from "@/assets/horizons-flix-icon.png";
import { toast } from "sonner";

const difficultyColor: Record<string, string> = {
  Iniciante: "bg-emerald-100 text-emerald-700 border-emerald-300",
  Intermediário: "bg-amber-100 text-amber-700 border-amber-300",
  Avançado: "bg-red-100 text-red-700 border-red-300",
};

export default function FlixProgramDetail() {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { isKrakenReleased, releaseKraken } = useKraken();
  const { data: program, isLoading: loadingProgram } = useFlixProgram(programId);
  const { data: episodes = [], isLoading: loadingEpisodes } = useFlixEpisodes(programId);
  const [playingEpisodeId, setPlayingEpisodeId] = useState<string | null>(null);
  const [editingEpisode, setEditingEpisode] = useState<FlixEpisode | null>(null);
  const [showEpisodeForm, setShowEpisodeForm] = useState(false);

  // Cheat code listener
  useEffect(() => {
    let buffer = "";
    const handler = (e: KeyboardEvent) => {
      buffer = (buffer + e.key).slice(-7);
      if (buffer === "abcdefg") {
        releaseKraken();
        buffer = "";
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [releaseKraken]);

  if (loadingProgram) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center">
        <p className="text-lg mb-4">Programa não encontrado</p>
        <Button onClick={() => navigate("/horizons-flix")} variant="ghost" className="text-white">
          Voltar
        </Button>
      </div>
    );
  }

  const heroThumb = parseThumbnail(program.thumbnail_url);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/horizons-flix")}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <img src={horizonsFlixIcon} alt="" className="h-6 w-6 object-contain" />
            <span className="text-sm text-white/50 font-medium">Horizons Flix</span>
          </div>
        </div>
      </header>

      {/* Program Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-80 shrink-0 rounded-xl overflow-hidden aspect-[16/10] bg-black">
            {heroThumb.url ? (
              <img
                src={heroThumb.url}
                alt={program.title}
                className="w-full h-full object-cover"
                style={{ objectPosition: heroThumb.position }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900/40 to-purple-900/40">
                <Film className="w-16 h-16 text-white/20" />
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl md:text-3xl font-bold">{program.title}</h1>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  difficultyColor[program.difficulty] ?? "bg-white/10 text-white/60 border-white/20"
                }`}
              >
                {program.difficulty}
              </span>
            </div>
            {program.description && (
              <p className="text-white/60 text-sm leading-relaxed max-w-xl">{program.description}</p>
            )}
            <p className="text-white/30 text-xs mt-3">
              {episodes.length} episódio{episodes.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      <div className="max-w-5xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white/90">Episódios</h2>
          {isKrakenReleased && (
            <Button
              onClick={() => { setEditingEpisode(null); setShowEpisodeForm(true); }}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Adicionar episódio
            </Button>
          )}
        </div>

        {loadingEpisodes ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Film className="w-12 h-12 mx-auto mb-3" />
            <p>Nenhum episódio adicionado ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {episodes.map((ep) => (
              <EpisodeRow
                key={ep.id}
                episode={ep}
                isPlaying={playingEpisodeId === ep.id}
                onPlay={() => setPlayingEpisodeId(ep.id)}
                onEdit={
                  isKrakenReleased
                    ? () => { setEditingEpisode(ep); setShowEpisodeForm(true); }
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {playingEpisodeId && (
        <VideoPlayerOverlay
          episode={episodes.find((e) => e.id === playingEpisodeId)!}
          onClose={() => setPlayingEpisodeId(null)}
        />
      )}

      {showEpisodeForm && programId && (
        <EpisodeEditor
          programId={programId}
          episode={editingEpisode}
          nextEpisodeNumber={episodes.length + 1}
          onClose={() => { setShowEpisodeForm(false); setEditingEpisode(null); }}
        />
      )}
    </div>
  );
}

// ── Episode Row ──

function EpisodeRow({
  episode,
  isPlaying,
  onPlay,
  onEdit,
}: {
  episode: FlixEpisode;
  isPlaying: boolean;
  onPlay: () => void;
  onEdit?: () => void;
}) {
  return (
    <div
      onClick={onPlay}
      className={`group flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all border ${
        isPlaying
          ? "bg-cyan-500/10 border-cyan-500/30"
          : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
      }`}
    >
      {/* Episode number */}
      <span className="w-7 text-center text-white/25 font-bold text-sm tabular-nums shrink-0">
        {episode.episode_number}
      </span>

      {/* Play icon */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
        isPlaying ? "bg-cyan-500 text-white" : "bg-white/8 text-white/40 group-hover:bg-white/15 group-hover:text-white/70"
      }`}>
        <Play className="w-4 h-4 fill-current ml-0.5" />
      </div>

      {/* Title */}
      <h3 className="flex-1 text-sm font-medium text-white/90 truncate">{episode.title}</h3>

      {onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-2 text-white/20 hover:text-purple-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Vimeo helpers ──

function extractVimeoId(url: string): string | null {
  // Matches vimeo.com/123456789, vimeo.com/video/123456789, player.vimeo.com/video/123456789
  const match = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/);
  return match ? match[1] : null;
}

function isVimeoUrl(url: string): boolean {
  return /vimeo\.com/i.test(url);
}

// ── Video Player Overlay ──

function VideoPlayerOverlay({ episode, onClose }: { episode: FlixEpisode; onClose: () => void }) {
  const vimeoId = useMemo(() => extractVimeoId(episode.video_url), [episode.video_url]);
  const isVimeo = isVimeoUrl(episode.video_url);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-black/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
            <Play className="w-3.5 h-3.5 text-cyan-400 fill-current ml-0.5" />
          </div>
          <div className="min-w-0">
            <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium">
              Episódio {episode.episode_number}
            </p>
            <h3 className="text-white font-semibold text-sm truncate">{episode.title}</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0 ml-3"
        >
          <span className="text-white text-lg leading-none">✕</span>
        </button>
      </div>

      {/* Video area */}
      <div className="flex-1 flex items-center justify-center px-2 sm:px-6 pb-4">
        {isVimeo && vimeoId ? (
          <div className="w-full max-w-5xl aspect-video rounded-xl overflow-hidden shadow-2xl shadow-black/50">
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0&dnt=1&responsive=1`}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
              allowFullScreen
              title={episode.title}
            />
          </div>
        ) : (
          <video
            src={episode.video_url}
            controls
            autoPlay
            preload="metadata"
            playsInline
            webkit-playsinline="true"
            x5-playsinline="true"
            className="max-w-full max-h-full rounded-xl shadow-2xl shadow-black/50"
          />
        )}
      </div>
    </div>
  );
}

// ── Episode Editor ──

function EpisodeEditor({
  programId,
  episode,
  nextEpisodeNumber,
  onClose,
}: {
  programId: string;
  episode: FlixEpisode | null;
  nextEpisodeNumber: number;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(episode?.title ?? "");
  const [videoUrl, setVideoUrl] = useState(episode?.video_url ?? "");
  const [episodeNumber, setEpisodeNumber] = useState(episode?.episode_number ?? nextEpisodeNumber);
  const [saving, setSaving] = useState(false);

  const createMutation = useCreateFlixEpisode();
  const updateMutation = useUpdateFlixEpisode();
  const deleteMutation = useDeleteFlixEpisode();

  const handleSave = async () => {
    if (!title.trim() || !videoUrl.trim()) {
      toast.error("Título e URL do vídeo são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      if (episode) {
        await updateMutation.mutateAsync({
          id: episode.id,
          title,
          video_url: videoUrl,
          episode_number: episodeNumber,
        });
        toast.success("Episódio atualizado!");
      } else {
        await createMutation.mutateAsync({
          program_id: programId,
          title,
          description: null,
          video_url: videoUrl,
          thumbnail_url: null,
          episode_number: episodeNumber,
          is_active: true,
        });
        toast.success("Episódio criado!");
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!episode) return;
    if (!confirm("Excluir este episódio?")) return;
    try {
      await deleteMutation.mutateAsync({ id: episode.id, programId });
      toast.success("Episódio excluído!");
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao excluir");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">
            {episode ? "Editar episódio" : "Novo episódio"}
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white text-lg">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-3">
            <div className="w-20">
              <label className="text-sm text-white/60 mb-1 block">Ep. Nº</label>
              <Input
                type="number"
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-white/60 mb-1 block">Título *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: The One Where Ross Got High"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-white/60 mb-1 block">URL do vídeo *</label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="p-5 border-t border-white/10 flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-cyan-600 hover:bg-cyan-700 text-white flex-1"
          >
            {saving ? "Salvando..." : episode ? "Salvar" : "Criar episódio"}
          </Button>
          {episode && (
            <Button onClick={handleDelete} variant="destructive" size="sm" className="shrink-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
