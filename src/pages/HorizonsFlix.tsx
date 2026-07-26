import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Film, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFlixPrograms, FlixProgram } from "@/hooks/useFlixVideos";
import { useKraken } from "@/contexts/KrakenContext";
import FlixProgramEditor from "@/components/flix/FlixProgramEditor";
import { parseThumbnail } from "@/components/flix/ThumbnailUploader";
import horizonsFlixIcon from "@/assets/horizons-flix-icon.png";

const DIFFICULTIES = ["Todos", "Iniciante", "Intermediário", "Avançado"] as const;

const difficultyColor: Record<string, string> = {
  Iniciante: "bg-emerald-100 text-emerald-700 border-emerald-300",
  Intermediário: "bg-amber-100 text-amber-700 border-amber-300",
  Avançado: "bg-red-100 text-red-700 border-red-300",
};

export default function HorizonsFlix() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("Todos");
  const { data: programs = [], isLoading } = useFlixPrograms(filter);
  const { isKrakenReleased, releaseKraken } = useKraken();
  const [editingProgram, setEditingProgram] = useState<FlixProgram | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Listen for "abcdefg" cheat code to activate admin mode
  useEffect(() => {
    let buffer = "";
    const handler = (e: KeyboardEvent) => {
      buffer = (buffer + e.key).slice(-7);
      if (buffer === "abcdefg") {
        console.log("🐙 Kraken released on Horizons Flix!");
        releaseKraken();
        buffer = "";
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [releaseKraken]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <img src={horizonsFlixIcon} alt="Horizons Flix" className="h-8 w-8 object-contain" />
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Horizons Flix
            </h1>
          </div>
          {isKrakenReleased && (
            <Button
              onClick={() => { setEditingProgram(null); setShowEditor(true); }}
              className="ml-auto bg-purple-600 hover:bg-purple-700 text-white text-sm"
              size="sm"
            >
              + Novo programa
            </Button>
          )}
        </div>
      </header>

      {/* Difficulty Filters */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <div className="flex gap-2 flex-wrap">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                filter === d
                  ? "bg-white text-black border-white"
                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Programs Grid */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl bg-white/5 animate-pulse aspect-[16/10]" />
            ))}
          </div>
        ) : programs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <Tv className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">Nenhum programa disponível</p>
            <p className="text-sm mt-1">
              {filter !== "Todos"
                ? `Nenhum programa encontrado para "${filter}"`
                : "Os programas serão adicionados em breve!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {programs.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onClick={() => navigate(`/horizons-flix/${program.id}`)}
                onEdit={
                  isKrakenReleased
                    ? () => { setEditingProgram(program); setShowEditor(true); }
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </main>

      {/* Program Editor Modal */}
      {showEditor && (
        <FlixProgramEditor
          program={editingProgram}
          onClose={() => { setShowEditor(false); setEditingProgram(null); }}
        />
      )}
    </div>
  );
}

function ProgramCard({
  program,
  onClick,
  onEdit,
}: {
  program: FlixProgram;
  onClick: () => void;
  onEdit?: () => void;
}) {
  const thumb = parseThumbnail(program.thumbnail_url);
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl overflow-hidden bg-white/5 border border-white/5 hover:border-white/15 transition-all hover:scale-[1.02] hover:shadow-2xl"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] bg-black">
        {thumb.url ? (
          <img
            src={thumb.url}
            alt={program.title}
            className="w-full h-full object-cover"
            style={{ objectPosition: thumb.position }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900/40 to-purple-900/40">
            <Film className="w-12 h-12 text-white/20" />
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Difficulty badge on image */}
        <span
          className={`absolute top-3 right-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            difficultyColor[program.difficulty] ?? "bg-white/10 text-white/60 border-white/20"
          }`}
        >
          {program.difficulty}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white text-base leading-tight line-clamp-2 mb-1">
          {program.title}
        </h3>
        {program.description && (
          <p className="text-white/50 text-xs line-clamp-2">{program.description}</p>
        )}
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            ✏️ Editar programa
          </button>
        )}
      </div>
    </div>
  );
}
