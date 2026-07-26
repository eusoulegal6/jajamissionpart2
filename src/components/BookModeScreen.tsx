import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BookOpen, Play, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useBookProgress } from '@/hooks/useBookProgress';
import LoadingScreen from '@/components/LoadingScreen';

interface BookModeScreenProps {
  category: string;
  categoryTitle: string;
  categoryColor: string;
  onBack: () => void;
}

interface LessonEntry {
  id: string;
  title: string;
  difficulty: string;
  isComplementary: boolean;
  parentLessonTitle?: string;
}

// IDs of lessons that are only accessible via PNL complementary lessons
const PNL_COMPLEMENTARY_LESSON_IDS = [
  "Avançado_1764467250203", "Avançado_1764557245707", "Avançado_1764985870657",
  "Avançado_1768352688539", "Avançado_1768432281145", "Avançado_1768434850023",
  "Avançado_1768851427153", "Avançado_1768857326832", "Avançado_1768859476702",
  "Avançado_1768873122417", "Avançado_1768881224164", "Avançado_1768874580382",
];

const BookModeScreen: React.FC<BookModeScreenProps> = ({
  category,
  categoryTitle,
  categoryColor,
  onBack,
}) => {
  const navigate = useNavigate();
  const { progress, loading: progressLoading, saveProgress } = useBookProgress(category);
  const [lessonSequence, setLessonSequence] = useState<LessonEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buildLessonSequence();
  }, [category]);

  const buildLessonSequence = async () => {
    setLoading(true);
    try {
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('difficulty', category)
        .order('title');

      if (error) throw error;

      const filteredLessons = (lessons || []).filter(
        (l) => !PNL_COMPLEMENTARY_LESSON_IDS.includes(l.id)
      );

      const sortedLessons = filteredLessons.sort((a, b) => {
        const numA = parseInt(a.title.match(/Lesson (\d+)/)?.[1] || '999');
        const numB = parseInt(b.title.match(/Lesson (\d+)/)?.[1] || '999');
        return numA - numB;
      });

      const complementaryIds: string[] = [];
      for (const lesson of sortedLessons) {
        const compIds: string[] = (lesson.content as any)?.complementaryLessonIds || [];
        if (compIds.length > 0) {
          complementaryIds.push(...compIds);
        }
      }

      if (complementaryIds.length > 0) {
        const { data: compLessons } = await supabase
          .from('lessons')
          .select('id, title, difficulty')
          .in('id', complementaryIds);

        const compMap = new Map(
          (compLessons || []).map((l) => [l.id, l])
        );

        const fullSequence: LessonEntry[] = [];
        for (const lesson of sortedLessons) {
          fullSequence.push({
            id: lesson.id,
            title: lesson.title,
            difficulty: lesson.difficulty,
            isComplementary: false,
          });

          const compIds: string[] = (lesson.content as any)?.complementaryLessonIds || [];
          for (const compId of compIds) {
            const comp = compMap.get(compId);
            if (comp) {
              fullSequence.push({
                id: comp.id,
                title: comp.title,
                difficulty: comp.difficulty,
                isComplementary: true,
                parentLessonTitle: lesson.title,
              });
            }
          }
        }

        setLessonSequence(fullSequence);
      } else {
        const sequence: LessonEntry[] = sortedLessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          difficulty: lesson.difficulty,
          isComplementary: false,
        }));
        setLessonSequence(sequence);
      }
    } catch (error) {
      console.error('Error building lesson sequence:', error);
      setLessonSequence([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOrContinue = async () => {
    if (lessonSequence.length === 0) return;

    const sequenceIds = lessonSequence.map((l) => l.id);

    if (progress && progress.current_lesson_id) {
      const idx = sequenceIds.indexOf(progress.current_lesson_id);
      if (idx !== -1) {
        const entry = lessonSequence[idx];
        navigateToLesson(entry, idx, sequenceIds, progress.current_page_index);
        return;
      }
    }

    await saveProgress(sequenceIds, 0, sequenceIds[0], 0);
    navigateToLesson(lessonSequence[0], 0, sequenceIds, 0);
  };


  const navigateToLesson = (
    entry: LessonEntry,
    index: number,
    sequenceIds: string[],
    pageIndex: number
  ) => {
    navigate(`/lesson/${entry.id}`, {
      state: {
        returnPath: '/curso-completo',
        selectedDifficulty: entry.difficulty,
        currentPageIndex: pageIndex,
        bookMode: {
          category,
          categoryTitle,
          lessonSequence: sequenceIds,
          currentIndex: index,
          lessonTitles: lessonSequence.map((l) => l.title),
        },
      },
    });
  };

  // Book-only progress: based solely on the saved position in the book
  const currentIndex = progress
    ? lessonSequence.findIndex((l) => l.id === progress.current_lesson_id)
    : -1;

  // Progress = how far through the book sequence we are (index-based)
  const progressPercentage =
    lessonSequence.length > 0 && currentIndex >= 0
      ? (currentIndex / lessonSequence.length) * 100
      : 0;

  if (loading || progressLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Modo Livro - {categoryTitle}
              </h1>
            </div>
            {currentIndex >= 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Lição {currentIndex + 1} de {lessonSequence.length}
              </p>
            )}
          </div>
        </div>

        {/* Progress Card */}
        <Card className="mb-6 border-2 border-primary/20">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Progresso</span>
              <span className="text-sm font-bold text-primary">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <Button
              size="lg"
              className="w-full text-lg font-semibold"
              onClick={handleStartOrContinue}
            >
              <Play className="h-5 w-5 mr-2" />
              {progress && currentIndex > 0 ? 'Continuar' : 'Começar'}
            </Button>
          </CardContent>
        </Card>

        {/* Lesson Sequence */}
        <div className="space-y-2">
          {lessonSequence.map((entry, index) => {
            const isBeforeCurrent = currentIndex >= 0 && index < currentIndex;
            const isCurrent = currentIndex >= 0 && index === currentIndex;

            return (
              <Card
                key={`${entry.id}-${index}`}
                className={`transition-all ${
                  isCurrent
                    ? 'border-2 border-primary shadow-md bg-primary/5'
                    : isBeforeCurrent
                    ? 'bg-green-50/50 border-green-200/50'
                    : entry.isComplementary
                    ? 'ml-6 border-muted'
                    : 'border-border'
                }`}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isBeforeCurrent
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? `${categoryColor} text-white`
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isBeforeCurrent ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-medium text-sm truncate ${
                        isCurrent ? 'text-primary' : ''
                      }`}
                    >
                      {entry.title}
                    </h4>
                    {entry.isComplementary && (
                      <p className="text-xs text-muted-foreground">
                        Complementar
                      </p>
                    )}
                  </div>

                  
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BookModeScreen;
