import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  content: any;
  cached_audio_urls?: any;
}

interface ContentItem {
  id: string;
  title: string;
  content: any;
  chapter_id: string;
  order?: number;
  cached_audio_urls?: any;
}

export const useLessonEditor = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessons();
    fetchContentItems();
  }, []);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*');

      if (error) {
        console.error('Error fetching lessons:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as lições.",
          variant: "destructive",
        });
      } else {
        setLessons(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching lessons:', error);
    }
  };

  const fetchContentItems = async () => {
    try {
      const { data, error } = await supabase
        .from('content_items')
        .select('*');

      if (error) {
        console.error('Error fetching content items:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os itens de conteúdo.",
          variant: "destructive",
        });
      } else {
        setContentItems(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching content items:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteLesson = async (lessonId: string, tableName: 'lessons' | 'lessons_spanish' = 'lessons') => {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', lessonId);

      if (error) {
        console.error('Error deleting lesson:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir a lição.",
          variant: "destructive",
        });
        return false;
      } else {
        setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
        toast({
          title: "Sucesso",
          description: "Lição excluída com sucesso.",
        });
        return true;
      }
    } catch (error) {
      console.error('Unexpected error deleting lesson:', error);
      return false;
    }
  };

  const deleteContentItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting content item:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o item de conteúdo.",
          variant: "destructive",
        });
        return false;
      } else {
        setContentItems(prev => prev.filter(item => item.id !== itemId));
        toast({
          title: "Sucesso",
          description: "Item de conteúdo excluído com sucesso.",
        });
        return true;
      }
    } catch (error) {
      console.error('Unexpected error deleting content item:', error);
      return false;
    }
  };

  const updateLesson = async (lessonId: string, updates: Partial<Lesson>) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update(updates)
        .eq('id', lessonId);

      if (error) {
        console.error('Error updating lesson:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a lição.",
          variant: "destructive",
        });
        return false;
      } else {
        await fetchLessons(); // Refresh the list
        toast({
          title: "Sucesso",
          description: "Lição atualizada com sucesso.",
        });
        return true;
      }
    } catch (error) {
      console.error('Unexpected error updating lesson:', error);
      return false;
    }
  };

  const updateContentItem = async (itemId: string, updates: Partial<ContentItem>) => {
    try {
      const { error } = await supabase
        .from('content_items')
        .update(updates)
        .eq('id', itemId);

      if (error) {
        console.error('Error updating content item:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o item de conteúdo.",
          variant: "destructive",
        });
        return false;
      } else {
        await fetchContentItems(); // Refresh the list
        toast({
          title: "Sucesso",
          description: "Item de conteúdo atualizado com sucesso.",
        });
        return true;
      }
    } catch (error) {
      console.error('Unexpected error updating content item:', error);
      return false;
    }
  };

  return {
    lessons,
    contentItems,
    loading,
    deleteLesson,
    deleteContentItem,
    updateLesson,
    updateContentItem,
    refreshLessons: fetchLessons,
    refreshContentItems: fetchContentItems
  };
};