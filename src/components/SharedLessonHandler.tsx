
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { parseSharedLessonParams } from "@/utils/shareUtils";
import { supabase } from "@/integrations/supabase/client";
import Index from "@/pages/Index";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const SharedLessonHandler: React.FC = () => {
  const navigate = useNavigate();
  const { lessonId: urlLessonId } = useParams<{ lessonId: string }>();
  const location = useLocation();
  const [isLoadingSharedLesson, setIsLoadingSharedLesson] = useState(false);
  const [sharedLessonError, setSharedLessonError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a lessonId from URL path params
    if (urlLessonId) {
      console.log('SharedLessonHandler - Loading from path params:', urlLessonId);
      const searchParams = new URLSearchParams(location.search);
      const difficulty = searchParams.get('difficulty') || 'Fácil';
      const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
      loadSharedLesson(urlLessonId, difficulty, page - 1); // Convert to 0-based index
      return;
    }

    // Fallback to query params (old method)
    const { lessonId, difficulty, pageIndex } = parseSharedLessonParams();
    
    console.log('SharedLessonHandler - Parsed query params:', { lessonId, difficulty, pageIndex });
    console.log('SharedLessonHandler - URL search params:', window.location.search);
    
    if (lessonId && difficulty) {
      console.log('SharedLessonHandler - Loading shared lesson from query...');
      loadSharedLesson(lessonId, difficulty, pageIndex);
    } else {
      console.log('SharedLessonHandler - Missing required params, rendering normal Index');
    }
  }, [urlLessonId, location.search]);

  const loadSharedLesson = async (lessonId: string, difficulty: string, pageIndex: number) => {
    setIsLoadingSharedLesson(true);
    setSharedLessonError(null);

    try {
      console.log('SharedLessonHandler - Fetching lesson with ID:', lessonId);
      const { data: lessonData, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .maybeSingle();

      console.log('SharedLessonHandler - Supabase response:', { lessonData, error });

      if (error || !lessonData) {
        console.error('SharedLessonHandler - Lesson not found or error:', error);
        setSharedLessonError("Lição não encontrada");
        return;
      }

      // Navigate to URL-based lesson runner route
      const target = `/lesson/${lessonId}?difficulty=${encodeURIComponent(difficulty)}&page=${pageIndex + 1}`;
      navigate(target, {
        replace: true
      });
    } catch (error) {
      console.error("Error loading shared lesson:", error);
      setSharedLessonError("Erro ao carregar a lição compartilhada");
    } finally {
      setIsLoadingSharedLesson(false);
    }
  };

  if (isLoadingSharedLesson) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Carregando lição compartilhada...</p>
      </div>
    );
  }

  if (sharedLessonError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro</h1>
        <p className="text-gray-600 mb-4">{sharedLessonError}</p>
        <Button onClick={() => window.location.href = "/"}>
          Ir para página inicial
        </Button>
      </div>
    );
  }

  // If no shared lesson parameters, render the normal Index page
  return <Index />;
};

export default SharedLessonHandler;
