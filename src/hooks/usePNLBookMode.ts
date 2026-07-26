import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BookModeSequenceEntry {
  id: string;
  type: 'pnl-page' | 'db-lesson';
  route?: string;
  lessonId?: string;
  difficulty?: string;
}

/**
 * Hook for PNL lesson pages to support book mode auto-advance.
 * Returns { isBookMode, bookModeNavigation } where bookModeNavigation
 * contains the props needed for the "Next" button in book mode.
 */
export function usePNLBookMode() {
  const location = useLocation();
  const navigate = useNavigate();
  const bookMode = (location.state as any)?.bookMode;

  const isBookMode = !!bookMode?.sequenceEntries;

  const advanceToNext = async () => {
    if (!bookMode) return;

    const { lessonSequence, currentIndex, categoryTitle, lessonTitles, sequenceEntries } = bookMode;
    const nextIndex = currentIndex + 1;

    if (nextIndex >= lessonSequence.length) {
      toast({
        title: 'Livro Concluído! 🏆',
        description: `Você completou o ${categoryTitle || 'PNL'}!`,
      });
      navigate('/lessons', { replace: true });
      return;
    }

    // Save progress
    try {
      const savedSession = localStorage.getItem('phone_auth_session');
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession);
        await supabase.from('book_mode_progress').upsert({
          phone_number: parsedSession.phone_number,
          category: bookMode.category,
          current_lesson_id: lessonSequence[nextIndex],
          current_page_index: 0,
          lesson_sequence: lessonSequence,
          total_lessons: lessonSequence.length,
          current_lesson_index: nextIndex,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'phone_number,category' });
      }
    } catch (e) {
      console.error('Error saving PNL book progress:', e);
    }

    toast({
      title: 'Próxima lição 📖',
      description: lessonTitles?.[nextIndex] || `Item ${nextIndex + 1}`,
    });

    const nextEntry: BookModeSequenceEntry = sequenceEntries[nextIndex];
    const nextBookMode = { ...bookMode, currentIndex: nextIndex };

    if (nextEntry.type === 'pnl-page' && nextEntry.route) {
      navigate(nextEntry.route, {
        state: { returnPath: '/lessons', bookMode: nextBookMode },
        replace: true,
      });
    } else if (nextEntry.type === 'db-lesson' && nextEntry.lessonId) {
      navigate(`/lesson/${nextEntry.lessonId}`, {
        state: {
          returnPath: '/lessons',
          selectedDifficulty: nextEntry.difficulty,
          currentPageIndex: 0,
          bookMode: nextBookMode,
        },
        replace: true,
      });
    }
  };

  return { isBookMode, advanceToNext, bookMode };
}
