import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FlixProgram {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  difficulty: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlixEpisode {
  id: string;
  program_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  episode_number: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Programs ──

export function useFlixPrograms(difficulty?: string) {
  return useQuery({
    queryKey: ["flix-programs", difficulty],
    queryFn: async () => {
      let query = supabase
        .from("flix_videos" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (difficulty && difficulty !== "Todos") {
        query = query.eq("difficulty", difficulty);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as FlixProgram[];
    },
  });
}

export function useFlixProgram(id: string | undefined) {
  return useQuery({
    queryKey: ["flix-program", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flix_videos" as any)
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as FlixProgram;
    },
  });
}

export function useCreateFlixProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<FlixProgram, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("flix_videos" as any)
        .insert(p as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as FlixProgram;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["flix-programs"] }),
  });
}

export function useUpdateFlixProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: Partial<FlixProgram> & { id: string }) => {
      const { data, error } = await supabase
        .from("flix_videos" as any)
        .update(u as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as FlixProgram;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["flix-programs"] });
      qc.invalidateQueries({ queryKey: ["flix-program", v.id] });
    },
  });
}

export function useDeleteFlixProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("flix_videos" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["flix-programs"] }),
  });
}

// ── Episodes ──

export function useFlixEpisodes(programId: string | undefined) {
  return useQuery({
    queryKey: ["flix-episodes", programId],
    enabled: !!programId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flix_episodes" as any)
        .select("*")
        .eq("program_id", programId!)
        .eq("is_active", true)
        .order("episode_number", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as FlixEpisode[];
    },
  });
}

export function useCreateFlixEpisode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: Omit<FlixEpisode, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("flix_episodes" as any)
        .insert(e as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as FlixEpisode;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["flix-episodes", v.program_id] }),
  });
}

export function useUpdateFlixEpisode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: Partial<FlixEpisode> & { id: string }) => {
      const { data, error } = await supabase
        .from("flix_episodes" as any)
        .update(u as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as FlixEpisode;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["flix-episodes", (d as any).program_id] }),
  });
}

export function useDeleteFlixEpisode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, programId }: { id: string; programId: string }) => {
      const { error } = await supabase.from("flix_episodes" as any).delete().eq("id", id);
      if (error) throw error;
      return programId;
    },
    onSuccess: (programId) => qc.invalidateQueries({ queryKey: ["flix-episodes", programId] }),
  });
}
