
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePhoneAuth } from '@/contexts/PhoneAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface LessonProgress {
  lesson_id: string;
  difficulty: string;
  completed_at: string;
}

interface UserProgress {
  phone_number: string;
  progress_percentage: number;
  updated_at: string;
}

export const useLessonProgress = () => {
  const { user } = usePhoneAuth();
  const { learningLanguage } = useLanguage();
  const [completedLessons, setCompletedLessons] = useState<LessonProgress[]>([]);
  const [progressPercentage, setProgressPercentage] = useState<{en: number, es: number}>({ en: 0, es: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgress();
      fetchUserProgress();
    } else {
      setCompletedLessons([]);
      setProgressPercentage({ en: 0, es: 0 });
      setLoading(false);
    }
  }, [user]);

  const fetchProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id, difficulty, completed_at')
        .eq('phone_number', user.phone_number);

      if (error) {
        console.error('Error fetching lesson progress:', error);
      } else {
        setCompletedLessons(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching progress:', error);
    }

    setLoading(false);
  };

  const fetchUserProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('language, progress_percentage')
        .eq('phone_number', user.phone_number);

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user progress:', error);
      } else {
        // Initialize progress for both languages if data exists
        if (data && data.length > 0) {
          const englishProgress = data.find(p => p.language === 'en')?.progress_percentage || 0;
          const spanishProgress = data.find(p => p.language === 'es')?.progress_percentage || 0;
          setProgressPercentage({ en: englishProgress, es: spanishProgress });
        } else {
          setProgressPercentage({ en: 0, es: 0 });
        }
      }
    } catch (error) {
      console.error('Unexpected error fetching user progress:', error);
    }
  };

  const markLessonComplete = async (lessonId: string, difficulty: string, isContentLesson = false) => {
    if (!user) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert({
          phone_number: user.phone_number,
          lesson_id: lessonId,
          difficulty: difficulty,
          completed_at: new Date().toISOString()
        }, { onConflict: 'phone_number,lesson_id,difficulty' });

      if (error) {
        console.error('Error marking lesson complete:', error);
        return false;
      }

      // Update local state
      setCompletedLessons(prev => {
        const filtered = prev.filter(p => !(p.lesson_id === lessonId && p.difficulty === difficulty));
        const updated = [...filtered, { lesson_id: lessonId, difficulty: difficulty, completed_at: new Date().toISOString() }];
        return updated;
      });

      // Only increment progress for regular lessons (not content lessons)
      if (!isContentLesson) {
        await incrementProgress(lessonId);
      }

      return true;
    } catch (error) {
      console.error('Unexpected error marking lesson complete:', error);
      return false;
    }
  };

  const incrementProgress = async (lessonId: string) => {
    if (!user) {
      return;
    }

    // Use the current learning language from context
    const language = learningLanguage;
    
    const currentProgress = progressPercentage[language] || 0;
    const newProgress = Math.min(100, currentProgress + 1);
    
    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          phone_number: user.phone_number,
          user_id: user.id,
          language: language,
          progress_percentage: newProgress,
          updated_at: new Date().toISOString()
        }, { onConflict: 'phone_number,language' });

      if (error) {
        console.error('Error updating progress:', error);
      } else {
        setProgressPercentage(prev => {
          const updated = {
            ...prev,
            [language]: newProgress
          };
          return updated;
        });
        console.log(`Progress updated for ${language}:`, newProgress);
      }
    } catch (error) {
      console.error('Unexpected error updating progress:', error);
    }
  };

  const isLessonComplete = (lessonId: string, difficulty: string) => {
    return completedLessons.some(p => p.lesson_id === lessonId && p.difficulty === difficulty);
  };

  const getCompletionStats = (difficulty: string) => {
    const completed = completedLessons.filter(p => p.difficulty === difficulty).length;
    return { completed };
  };

  return {
    completedLessons,
    progressPercentage,
    loading,
    markLessonComplete,
    isLessonComplete,
    getCompletionStats,
    refreshProgress: fetchProgress
  };
};
