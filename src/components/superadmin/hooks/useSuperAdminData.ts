import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PeriodFilter } from '../SuperAdminDashboard';

function getDateRange(period: PeriodFilter): { from: string | null; to: string | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today':
      return { from: today.toISOString(), to: null };
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday.toISOString(), to: today.toISOString() };
    }
    case '7days': {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      return { from: d.toISOString(), to: null };
    }
    case '30days': {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      return { from: d.toISOString(), to: null };
    }
    case 'all':
      return { from: null, to: null };
  }
}

export function useUserSessions(period: PeriodFilter) {
  const { from, to } = getDateRange(period);
  return useQuery({
    queryKey: ['superadmin', 'user_sessions', period],
    queryFn: async () => {
      let q = supabase.from('user_sessions').select('*').order('last_login', { ascending: false });
      if (from) q = q.gte('last_login', from);
      if (to) q = q.lt('last_login', to);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllUserSessions() {
  return useQuery({
    queryKey: ['superadmin', 'all_user_sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .order('last_login', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useLessonProgress(period: PeriodFilter) {
  const { from, to } = getDateRange(period);
  return useQuery({
    queryKey: ['superadmin', 'lesson_progress', period],
    queryFn: async () => {
      let q = supabase.from('lesson_progress').select('*').order('completed_at', { ascending: false });
      if (from) q = q.gte('completed_at', from);
      if (to) q = q.lt('completed_at', to);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUserFlashcards(period: PeriodFilter) {
  const { from, to } = getDateRange(period);
  return useQuery({
    queryKey: ['superadmin', 'user_flashcards', period],
    queryFn: async () => {
      let q = supabase.from('user_flashcards').select('*').order('created_at', { ascending: false });
      if (from) q = q.gte('created_at', from);
      if (to) q = q.lt('created_at', to);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useKoeFlashcards(period: PeriodFilter) {
  const { from, to } = getDateRange(period);
  return useQuery({
    queryKey: ['superadmin', 'koe_flashcards', period],
    queryFn: async () => {
      let q = supabase.from('koe_user_flashcards').select('*').order('acquired_at', { ascending: false });
      if (from) q = q.gte('acquired_at', from);
      if (to) q = q.lt('acquired_at', to);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUserPoints(period: PeriodFilter) {
  const { from, to } = getDateRange(period);
  return useQuery({
    queryKey: ['superadmin', 'user_points', period],
    queryFn: async () => {
      let q = supabase.from('user_points').select('*').order('awarded_at', { ascending: false });
      if (from) q = q.gte('awarded_at', from);
      if (to) q = q.lt('awarded_at', to);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useContentProgress(period: PeriodFilter) {
  const { from, to } = getDateRange(period);
  return useQuery({
    queryKey: ['superadmin', 'content_progress', period],
    queryFn: async () => {
      let q = supabase.from('content_progress').select('*').order('completed_at', { ascending: false });
      if (from) q = q.gte('completed_at', from);
      if (to) q = q.lt('completed_at', to);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useBookProgress(period: PeriodFilter) {
  const { from, to } = getDateRange(period);
  return useQuery({
    queryKey: ['superadmin', 'book_progress', period],
    queryFn: async () => {
      let q = supabase.from('book_mode_progress').select('*').order('updated_at', { ascending: false });
      if (from) q = q.gte('updated_at', from);
      if (to) q = q.lt('updated_at', to);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useGeniusUsers() {
  return useQuery({
    queryKey: ['superadmin', 'genius_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('genius')
        .select('*')
        .order('last_login', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export { getDateRange };
