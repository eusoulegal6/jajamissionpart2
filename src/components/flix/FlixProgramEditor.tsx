import React, { useState, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateFlixProgram,
  useUpdateFlixProgram,
  useDeleteFlixProgram,
  FlixProgram,
} from "@/hooks/useFlixVideos";
import ThumbnailUploader from "./ThumbnailUploader";
import { toast } from "sonner";

interface Props {
  program: FlixProgram | null;
  onClose: () => void;
}

const DIFFICULTIES = ["Iniciante", "Intermediário", "Avançado"];

export default function FlixProgramEditor({ program, onClose }: Props) {
  const [title, setTitle] = useState(program?.title ?? "");
  const [description, setDescription] = useState(program?.description ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(program?.thumbnail_url ?? "");
  const [difficulty, setDifficulty] = useState(program?.difficulty ?? "Iniciante");
  const [sortOrder, setSortOrder] = useState(program?.sort_order ?? 0);
  const [saving, setSaving] = useState(false);

  const createMutation = useCreateFlixProgram();
  const updateMutation = useUpdateFlixProgram();
  const deleteMutation = useDeleteFlixProgram();

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    setSaving(true);
    try {
      if (program) {
        await updateMutation.mutateAsync({
          id: program.id,
          title,
          description: description || null,
          thumbnail_url: thumbnailUrl || null,
          difficulty,
          sort_order: sortOrder,
        });
        toast.success("Programa atualizado!");
      } else {
        await createMutation.mutateAsync({
          title,
          description: description || null,
          video_url: null,
          thumbnail_url: thumbnailUrl || null,
          difficulty,
          sort_order: sortOrder,
          is_active: true,
        });
        toast.success("Programa criado!");
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!program) return;
    if (!confirm("Excluir este programa e todos os episódios?")) return;
    try {
      await deleteMutation.mutateAsync(program.id);
      toast.success("Programa excluído!");
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
            {program ? "Editar programa" : "Novo programa"}
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm text-white/60 mb-1 block">Título *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Friends"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 mb-1 block">Descrição</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sobre o que é este programa..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[80px]"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 mb-1 block">Thumbnail</label>
            <ThumbnailUploader value={thumbnailUrl} onChange={setThumbnailUrl} />
          </div>

          <div>
            <label className="text-sm text-white/60 mb-1 block">Nível</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    difficulty === d
                      ? "bg-white text-black border-white"
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-white/60 mb-1 block">Ordem</label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="bg-white/5 border-white/10 text-white w-24"
            />
          </div>
        </div>

        <div className="p-5 border-t border-white/10 flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-cyan-600 hover:bg-cyan-700 text-white flex-1"
          >
            {saving ? "Salvando..." : program ? "Salvar alterações" : "Criar programa"}
          </Button>
          {program && (
            <Button onClick={handleDelete} variant="destructive" size="sm" className="shrink-0">
              Excluir
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
