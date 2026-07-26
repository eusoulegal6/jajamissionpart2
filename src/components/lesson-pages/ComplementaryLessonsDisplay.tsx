import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight, CheckCircle, Pencil, GraduationCap, RotateCcw, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useKraken } from '@/contexts/KrakenContext';

interface ComplementaryLessonsDisplayProps {
  lessonIds: string[];
  currentLessonId?: string;
  pnlLessonKey?: string; // The PNL lesson key (e.g., 'lesson-1') for consultation
  returnPath?: string; // Override the return path (defaults to '/lessons' for PNL)
  cursoCompletoCategory?: string | null; // Restore curso completo category on return
  showLessonTitles?: boolean; // Show actual lesson title instead of generic "Lesson"/"Review"
}


interface LessonInfo {
  id: string;
  title: string;
  description?: string;
  difficulty?: string;
}

// Mapping from Review lesson IDs to their corresponding PNL lesson keys
const REVIEW_TO_PNL_MAPPING: Record<string, string> = {
  'Avançado_1768851427153': 'lesson-1', // Review 1
  'Avançado_1768857326832': 'lesson-2', // Review 2
  'Avançado_1768859476702': 'lesson-3', // Review 3
  'Avançado_1768873122417': 'lesson-4', // Review 4
  'Avançado_1768874580382': 'lesson-5', // Review 5
  'Avançado_1768881224164': 'lesson-6', // Review 6
};

const ComplementaryLessonsDisplay: React.FC<ComplementaryLessonsDisplayProps> = ({
  lessonIds,
  currentLessonId,
  pnlLessonKey,
  returnPath: returnPathProp,
  cursoCompletoCategory,
  showLessonTitles = false,
}) => {
  const [lessons, setLessons] = useState<LessonInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { isLessonComplete } = useLessonProgress();
  const { learningLanguage } = useLanguage();
  const { isKrakenReleased } = useKraken();

  useEffect(() => {
    fetchLessons();
  }, [lessonIds, learningLanguage]);

  const fetchLessons = async () => {
    if (!lessonIds || lessonIds.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Try fetching from all possible tables
      const results: LessonInfo[] = [];
      
      // Fetch from lessons table
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('id, title, description, difficulty')
        .in('id', lessonIds);
      
      if (lessonsData) results.push(...lessonsData);

      // Fetch from book_lessons table
      const { data: bookLessonsData } = await supabase
        .from('book_lessons')
        .select('id, title, description, difficulty')
        .in('id', lessonIds);
      
      if (bookLessonsData) results.push(...bookLessonsData);

      // Fetch from content_items table
      const { data: contentData } = await supabase
        .from('content_items')
        .select('id, title')
        .in('id', lessonIds);
      
      if (contentData) results.push(...contentData);

      // Fetch from toefl_items table
      const { data: toeflData } = await supabase
        .from('toefl_items')
        .select('id, title')
        .in('id', lessonIds);
      
      if (toeflData) results.push(...toeflData);

      // Remove duplicates and filter out current lesson
      const uniqueLessons = results
        .filter((lesson, index, self) => 
          index === self.findIndex(l => l.id === lesson.id) &&
          lesson.id !== currentLessonId
        );

      setLessons(uniqueLessons);
    } catch (error) {
      console.error('Error fetching complementary lessons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonClick = (lesson: LessonInfo) => {
    // Determine PNL consultation lesson ID for Review lessons
    // First check the mapping, then fall back to the parent pnlLessonKey
    const pnlConsultationId = REVIEW_TO_PNL_MAPPING[lesson.id] || pnlLessonKey;
    
    const effectiveReturnPath = returnPathProp || '/lessons';
    
    navigate(`/lesson/${lesson.id}`, {
      state: {
        selectedDifficulty: lesson.difficulty,
        returnPath: effectiveReturnPath,
        ...(effectiveReturnPath === '/lessons' ? { pnlConsultationLessonId: pnlConsultationId } : {}),
        ...(effectiveReturnPath === '/curso-completo' && cursoCompletoCategory ? { cursoCompletoCategory } : {}),
      }
    });
  };

  const handleEditLesson = (e: React.MouseEvent, lesson: LessonInfo) => {
    e.stopPropagation();
    // Navigate to the lesson editor
    navigate(`/lesson-editor/${lesson.id}`, {
      state: {
        returnPath: '/lessons'
      }
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 mt-1">
        {[1, 2].map((i) => (
          <div key={i} className="h-10 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (lessons.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
      {lessons.map((lesson) => {
        const isReview = lesson.id in REVIEW_TO_PNL_MAPPING;
        const isCompleted = lesson.difficulty ? isLessonComplete(lesson.id, lesson.difficulty) : false;
        const Icon = isReview ? RotateCcw : GraduationCap;
        const label = showLessonTitles ? lesson.title : (isReview ? 'Review' : 'Lesson');

        const theme = isReview
          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-300/50'
          : 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sky-300/50';

        return (
          <div
            key={lesson.id}
            role="button"
            onClick={() => handleLessonClick(lesson)}
            className={`group relative cursor-pointer rounded-xl px-2.5 py-2.5 transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-1.5 shadow-md min-w-0 ${theme}`}
          >
            <Icon className="h-4 w-4 lg:h-5 lg:w-5 shrink-0" />
            <span className="font-bold text-sm flex-1 tracking-wide truncate">{label}</span>
            {isCompleted ? (
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-white shadow-sm shrink-0">
                <CheckCircle className="h-4 w-4 text-green-600" strokeWidth={2.5} fill="white" />
              </div>
            ) : (
              <ArrowRight className="h-4 w-4 opacity-80 group-hover:translate-x-0.5 transition-all shrink-0" />
            )}
            {isKrakenReleased && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute -top-1.5 -right-1.5 h-5 w-5 p-0 bg-white border shadow-sm hover:bg-white"
                onClick={(e) => handleEditLesson(e, lesson)}
                title="Editar lição"
              >
                <Pencil className="h-2.5 w-2.5 text-foreground" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ComplementaryLessonsDisplay;
