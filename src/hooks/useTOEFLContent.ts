import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Custom ordering function for TOEFL items - respects database order_index first
const orderTOEFLItems = (items: any[]) => {
  if (!items || items.length === 0) return items;
  
  // Sort by order_index first, then by title for items with same order_index
  return items.sort((a, b) => {
    if (a.order_index !== b.order_index) {
      return (a.order_index || 0) - (b.order_index || 0);
    }
    return (a.title || '').localeCompare(b.title || '');
  });
};

export const useTOEFLCategories = () => {
  return useQuery({
    queryKey: ['toefl_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('toefl_categories')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export const useTOEFLChapters = (categoryId: string) => {
  return useQuery({
    queryKey: ['toefl_chapters', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('toefl_chapters')
        .select('*')
        .eq('category_id', categoryId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!categoryId,
  });
};

export const useTOEFLItemsByCategory = (categoryId: string) => {
  return useQuery({
    queryKey: ['toefl_items_by_category', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('toefl_items')
        .select('*')
        .eq('category_id', categoryId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return orderTOEFLItems(data);
    },
    enabled: !!categoryId,
  });
};

export const useTOEFLItems = (chapterId: string) => {
  return useQuery({
    queryKey: ['toefl_items', chapterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('toefl_items')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return orderTOEFLItems(data);
    },
    enabled: !!chapterId,
  });
};