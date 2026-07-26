import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePhoneAuth } from '@/contexts/PhoneAuthContext';

export interface BookProgress {
  id?: string;
  phone_number: string;
  category: string;
  current_lesson_id: string;
  current_page_index: number;
  lesson_sequence: string[];
  total_lessons: number;
  current_lesson_index: number;
  updated_at?: string;
}

export const useBookProgress = (category: string) => {
  const { user } = usePhoneAuth();
  const [progress, setProgress] = useState<BookProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user || !category) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('book_mode_progress')
        .select('*')
        .eq('phone_number', user.phone_number)
        .eq('category', category)
        .maybeSingle();

      if (error) {
        console.error('Error fetching book progress:', error);
      } else if (data) {
        setProgress({
          ...data,
          lesson_sequence: (data.lesson_sequence as any) || [],
        });
      } else {
        setProgress(null);
      }
    } catch (error) {
      console.error('Unexpected error fetching book progress:', error);
    }

    setLoading(false);
  }, [user, category]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const saveProgress = async (
    lessonSequence: string[],
    currentLessonIndex: number,
    currentLessonId: string,
    currentPageIndex: number
  ) => {
    if (!user) return false;

    try {
      const payload = {
        phone_number: user.phone_number,
        category,
        current_lesson_id: currentLessonId,
        current_page_index: currentPageIndex,
        lesson_sequence: lessonSequence as any,
        total_lessons: lessonSequence.length,
        current_lesson_index: currentLessonIndex,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('book_mode_progress')
        .upsert(payload, { onConflict: 'phone_number,category' });

      if (error) {
        console.error('Error saving book progress:', error);
        return false;
      }

      setProgress(prev => ({
        ...(prev || { phone_number: user.phone_number }),
        ...payload,
      }));

      return true;
    } catch (error) {
      console.error('Unexpected error saving book progress:', error);
      return false;
    }
  };

  const getProgressPercentage = (): number => {
    if (!progress || progress.total_lessons === 0) return 0;
    // Current lesson index + fraction of pages completed
    return (progress.current_lesson_index / progress.total_lessons) * 100;
  };

  return {
    progress,
    loading,
    saveProgress,
    getProgressPercentage,
    refreshProgress: fetchProgress,
  };
};
