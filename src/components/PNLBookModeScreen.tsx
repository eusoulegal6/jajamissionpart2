import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BookOpen, Play, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useBookProgress } from '@/hooks/useBookProgress';
import LoadingScreen from '@/components/LoadingScreen';

interface PNLBookModeScreenProps {
  onBack: () => void;
}

interface PNLSequenceEntry {
  id: string;
  title: string;
  type: 'pnl-page' | 'db-lesson';
  route?: string; // for PNL pages
  lessonId?: string; // for DB lessons
  difficulty?: string;
  isComplementary: boolean;
  parentTitle?: string;
}

// The PNL lesson structure with their routes and complementary DB lesson IDs
const PNL_LESSONS = [
  {
    id: 'pnl-1',
    title: 'Lesson 1 - Eat & Drink',
    pages: [
      { id: 'pnl-1-p1', title: 'Lesson 1 - Vocabulary', route: '/lessons/food-and-drinks' },
      { id: 'pnl-1-p2', title: 'Lesson 1 - Practice', route: '/lessons/food-and-drinks-2' },
    ],
    complementaryLessonIds: ['Avançado_1764467250203', 'Avançado_1768851427153'],
  },
  {
    id: 'pnl-2',
    title: 'Lesson 2 - Want & Like',
    pages: [
      { id: 'pnl-2-p1', title: 'Lesson 2 - Vocabulary', route: '/lessons/lesson-2' },
      { id: 'pnl-2-p2', title: 'Lesson 2 - Practice', route: '/lessons/lesson-2-2' },
    ],
    complementaryLessonIds: ['Avançado_1764557245707', 'Avançado_1768857326832'],
  },
  {
    id: 'pnl-3',
    title: 'Lesson 3 - Prefer & Love',
    pages: [
      { id: 'pnl-3-p1', title: 'Lesson 3 - Vocabulary', route: '/lessons/lesson-3' },
      { id: 'pnl-3-p2', title: 'Lesson 3 - Practice', route: '/lessons/lesson-3-2' },
    ],
    complementaryLessonIds: ['Avançado_1764985870657', 'Avançado_1768859476702'],
  },
  {
    id: 'pnl-4',
    title: 'Lesson 4 - Speak & Study',
    pages: [
      { id: 'pnl-4-p1', title: 'Lesson 4 - Vocabulary', route: '/lessons/lesson-4' },
      { id: 'pnl-4-p2', title: 'Lesson 4 - Practice', route: '/lessons/lesson-4-2' },
    ],
    complementaryLessonIds: ['Avançado_1768352688539', 'Avançado_1768873122417'],
  },
  {
    id: 'pnl-5',
    title: 'Lesson 5 - Live & Understand',
    pages: [
      { id: 'pnl-5-p1', title: 'Lesson 5 - Vocabulary', route: '/lessons/lesson-5' },
      { id: 'pnl-5-p2', title: 'Lesson 5 - Practice', route: '/lessons/lesson-5-2' },
    ],
    complementaryLessonIds: ['Avançado_1768432281145', 'Avançado_1768874580382'],
  },
  {
    id: 'pnl-6',
    title: 'Lesson 6 - Go & See',
    pages: [
      { id: 'pnl-6-p1', title: 'Lesson 6 - Vocabulary', route: '/lessons/lesson-6' },
      { id: 'pnl-6-p2', title: 'Lesson 6 - Practice', route: '/lessons/lesson-6-2' },
    ],
    complementaryLessonIds: ['Avançado_1768434850023', 'Avançado_1768881224164'],
  },
];

const BOOK_CATEGORY = 'PNL';

const PNLBookModeScreen: React.FC<PNLBookModeScreenProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { progress, loading: progressLoading, saveProgress } = useBookProgress(BOOK_CATEGORY);
  const [sequence, setSequence] = useState<PNLSequenceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buildSequence();
  }, []);

  const buildSequence = async () => {
    setLoading(true);
    try {
      // Collect all complementary lesson IDs
      const allCompIds = PNL_LESSONS.flatMap((l) => l.complementaryLessonIds);

      // Fetch complementary lesson titles from DB
      const { data: compLessons } = await supabase
        .from('lessons')
        .select('id, title, difficulty')
        .in('id', allCompIds);

      const compMap = new Map((compLessons || []).map((l) => [l.id, l]));

      // Build the interleaved sequence
      const fullSequence: PNLSequenceEntry[] = [];

      for (const pnlLesson of PNL_LESSONS) {
        // Add PNL lesson pages
        for (const page of pnlLesson.pages) {
          fullSequence.push({
            id: page.id,
            title: page.title,
            type: 'pnl-page',
            route: page.route,
            isComplementary: false,
          });
        }

        // Add complementary DB lessons
        for (const compId of pnlLesson.complementaryLessonIds) {
          const comp = compMap.get(compId);
          if (comp) {
            fullSequence.push({
              id: comp.id,
              title: comp.title,
              type: 'db-lesson',
              lessonId: comp.id,
              difficulty: comp.difficulty,
              isComplementary: true,
              parentTitle: pnlLesson.title,
            });
          }
        }
      }

      setSequence(fullSequence);
    } catch (error) {
      console.error('Error building PNL sequence:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOrContinue = async () => {
    if (sequence.length === 0) return;

    const sequenceIds = sequence.map((s) => s.id);

    if (progress && progress.current_lesson_id) {
      const idx = sequenceIds.indexOf(progress.current_lesson_id);
      if (idx !== -1) {
        navigateToEntry(sequence[idx], idx, sequenceIds);
        return;
      }
    }

    await saveProgress(sequenceIds, 0, sequenceIds[0], 0);
    navigateToEntry(sequence[0], 0, sequenceIds);
  };

  const navigateToEntry = (entry: PNLSequenceEntry, index: number, sequenceIds: string[]) => {
    const bookModeState = {
      category: BOOK_CATEGORY,
      categoryTitle: 'PNL',
      lessonSequence: sequenceIds,
      currentIndex: index,
      lessonTitles: sequence.map((s) => s.title),
      // Include full entry data so PNL pages know about the sequence
      sequenceEntries: sequence.map((s) => ({
        id: s.id,
        type: s.type,
        route: s.route,
        lessonId: s.lessonId,
        difficulty: s.difficulty,
      })),
    };

    if (entry.type === 'pnl-page' && entry.route) {
      navigate(entry.route, {
        state: {
          returnPath: '/lessons',
          bookMode: bookModeState,
        },
      });
    } else if (entry.type === 'db-lesson' && entry.lessonId) {
      navigate(`/lesson/${entry.lessonId}`, {
        state: {
          returnPath: '/lessons',
          selectedDifficulty: entry.difficulty,
          currentPageIndex: 0,
          bookMode: bookModeState,
        },
      });
    }
  };

  // Book-only progress
  const currentIndex = progress
    ? sequence.findIndex((s) => s.id === progress.current_lesson_id)
    : -1;

  const progressPercentage =
    sequence.length > 0 && currentIndex >= 0
      ? (currentIndex / sequence.length) * 100
      : 0;

  if (loading || progressLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100/60 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-sky-700" />
              <h1 className="text-2xl font-bold text-sky-900">
                Modo Livro - PNL
              </h1>
            </div>
            {currentIndex >= 0 && (
              <p className="text-sm text-sky-700 mt-1">
                Item {currentIndex + 1} de {sequence.length}
              </p>
            )}
          </div>
        </div>

        {/* Progress Card */}
        <Card className="mb-6 border-2 border-sky-200">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Progresso</span>
              <span className="text-sm font-bold text-sky-700">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <Button
              size="lg"
              className="w-full text-lg font-semibold bg-sky-700 hover:bg-sky-800"
              onClick={handleStartOrContinue}
            >
              <Play className="h-5 w-5 mr-2" />
              {progress && currentIndex > 0 ? 'Continuar' : 'Começar'}
            </Button>
          </CardContent>
        </Card>

        {/* Sequence List */}
        <div className="space-y-2">
          {sequence.map((entry, index) => {
            const isBeforeCurrent = currentIndex >= 0 && index < currentIndex;
            const isCurrent = currentIndex >= 0 && index === currentIndex;

            return (
              <Card
                key={`${entry.id}-${index}`}
                className={`transition-all ${
                  isCurrent
                    ? 'border-2 border-sky-500 shadow-md bg-sky-50'
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
                        ? 'bg-sky-600 text-white'
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
                        isCurrent ? 'text-sky-700' : ''
                      }`}
                    >
                      {entry.title}
                    </h4>
                    {entry.isComplementary && (
                      <p className="text-xs text-muted-foreground">Complementar</p>
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

export default PNLBookModeScreen;
