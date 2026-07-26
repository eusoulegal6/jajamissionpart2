
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export const useContentCategories = () => {
  const { language } = useLanguage();

  return useQuery({
    queryKey: ['content_categories', language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_categories')
        .select('*')
        .eq('language', language)
        .order('order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export const useContentChapters = (categoryId: string) => {
    const { language } = useLanguage();

    return useQuery({
        queryKey: ['content_chapters', categoryId, language],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('content_chapters')
                .select(`*`)
                .eq('category_id', categoryId)
                .eq('language', language)
                .order('order', { ascending: true });
            if (error) throw error;
            return data;
        },
        enabled: !!categoryId,
    });
};

export const useContentItems = (chapterId: string) => {
    return useQuery({
        queryKey: ['content_items', chapterId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('content_items')
                .select('*')
                .eq('chapter_id', chapterId)
                .order('order', { ascending: true });
            if (error) throw error;
            return data;
        },
        enabled: !!chapterId,
    });
};
