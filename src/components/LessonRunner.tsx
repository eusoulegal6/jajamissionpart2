import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, Edit, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePhoneAuth } from "@/contexts/PhoneAuthContext";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { useTOEFLProgress } from "@/hooks/useTOEFLProgress";
import { useLessonAudio } from "@/hooks/use-lesson-audio";
import { toast } from "@/hooks/use-toast";
import { useTeacherMode } from "@/contexts/TeacherModeContext";
import SaveProgressModal from "@/components/teacher/SaveProgressModal";
import { validateContentPath } from "@/utils/contentNavigation";
import { LessonCredits, LessonFlashcard } from "@/types/lesson";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import InlinePageEditor from "./InlinePageEditor";
import ContentPage from "./lesson-pages/ContentPage";
import ArticlePage from "./lesson-pages/ArticlePage";
import TTSArticlePage from "./lesson-pages/TTSArticlePage";
import VideoPage from "./lesson-pages/VideoPage";
import VideoQuizPage from "./lesson-pages/VideoQuizPage";
import TrueFalseQuiz from "./chat/TrueFalseQuiz";
import AIFeedbackPage from "./chat/AIFeedbackPage";
import AIFeedbackWithParametersPage from "./chat/AIFeedbackWithParametersPage";
import AIFeedbackWithParametersEssayPage from "./chat/AIFeedbackWithParametersEssayPage";
import ListeningPage from "./chat/ListeningPage";
import ListeningVideoPage from "./chat/ListeningVideoPage";
import TranslationPage from "./chat/TranslationPage";
import MultipleChoicePage from "./lesson-pages/MultipleChoicePage";
import ExactAnswerPage from "./lesson-pages/ExactAnswerPage";
import RecommendedVocabularyPage from "./lesson-pages/RecommendedVocabularyPage";
import TrueFalseWithTextPage from "./lesson-pages/TrueFalseWithTextPage";
import MultipleChoiceWithTextPage from "./lesson-pages/MultipleChoiceWithTextPage";
import AudioMultipleChoicePage from "./lesson-pages/AudioMultipleChoicePage";
import EssayPage from "./lesson-pages/EssayPage";
import LessonNavigation from "./lesson-pages/LessonNavigation";
import CreditsPage from "./lesson-pages/CreditsPage";
import { TOEFLScorePage } from "./lesson-pages/TOEFLScorePage";
import SuggestedWordsPage from "./lesson-pages/SuggestedWordsPage";
import SlideshowPage from "./lesson-pages/SlideshowPage";
import FlashcardsAcquiredModal from "./lesson-pages/FlashcardsAcquiredModal";
import { PDFPage } from "./lesson-pages/PDFPage";
import PNLSlidesPage, { PNLSlidesPageRef } from "./lesson-pages/PNLSlidesPage";
import PronunciationSlidesPage, { PronunciationSlidesPageRef } from "./lesson-pages/PronunciationSlidesPage";
import CustomPronunciationSlidesPage, { CustomPronunciationSlidesPageRef } from "./lesson-pages/CustomPronunciationSlidesPage";
import AudioSlidesPage, { AudioSlidesPageRef } from "./lesson-pages/AudioSlidesPage";
import { useImagePreloader } from "@/hooks/useImagePreloader";

const LessonRunner: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lessonId: urlLessonId } = useParams<{ lessonId: string }>();
  const { isAuthenticated, user: phoneUser } = usePhoneAuth();
  const [canProceed, setCanProceed] = useState(true);
  const { markLessonComplete, isLessonComplete } = useLessonProgress();
  const { markTOEFLItemComplete, isTOEFLItemComplete } = useTOEFLProgress();
  const { playAudio, pauseAudio, stopAudio, isAudioPlaying } = useLessonAudio();
  
  // Extract URL query parameters for shared lessons
  const urlSearchParams = new URLSearchParams(location.search);
  const urlDifficulty = urlSearchParams.get('difficulty');
  const urlPage = urlSearchParams.get('page');
  const urlLessonParam = urlSearchParams.get('lesson');
  
  const { lesson: initialLesson, selectedDifficulty: stateDifficulty, lessonId: initialLessonId, returnPath: initialReturnPath, isTOEFLLesson, pnlConsultationLessonId: statePnlConsultationLessonId, bookMode: bookModeState, cursoCompletoCategory: stateCursoCompletoCategory } = location.state || {};
  const cursoCompletoCategory: string | undefined = stateCursoCompletoCategory;
  
  // Extract the lessonId properly from URL path params or location state
  const lessonId = urlLessonId || urlLessonParam || initialLessonId;
  
  // Use URL difficulty if available, otherwise fall back to state
  const selectedDifficulty = urlDifficulty || stateDifficulty;
  
  // Debug logging for lessonId extraction
  console.log('🔍 LessonRunner - lessonId extraction:', {
    urlLessonId,
    initialLessonId,
    finalLessonId: lessonId,
    pathname: location.pathname
  });
  
  // Extract pages from lesson data and normalize content structure
  const extractLessonPages = (lessonData: any) => {
    if (!lessonData) return [];
    
    let pages: any[] = [];
    // 1) Direct array passed
    if (Array.isArray(lessonData)) {
      pages = lessonData;
    }
    // 2) pages at top-level
    else if (lessonData.pages && Array.isArray(lessonData.pages)) {
      pages = lessonData.pages;
    }
    // 3) content is the pages array (common in DB)
    else if (Array.isArray(lessonData.content)) {
      pages = lessonData.content;
    }
    // 4) content.pages (heal nested structure)
    else if (lessonData.content && Array.isArray(lessonData.content.pages)) {
      pages = lessonData.content.pages;
    }
    // 5) content is a single page object (content_items structure)
    else if (lessonData.content && typeof lessonData.content === 'object' && !Array.isArray(lessonData.content)) {
      pages = [lessonData.content];
    } else {
      return [];
    }

    // Heal unwanted extra nesting like pages[0].pages
    if (Array.isArray(pages) && pages.length === 1 && Array.isArray((pages[0] as any)?.pages)) {
      pages = (pages[0] as any).pages;
    }
    
    // Normalize content structure for all page types
    return pages.map((page: any) => {
      if (!page.content) return page;
      
      // Flatten nested content properties for compatibility
      const normalizedPage = { ...page };
      
      // Handle common content properties that might be nested
      // Prioritize top-level properties over nested content properties
      if (page.text !== undefined) {
        normalizedPage.text = page.text; // Use top-level text first
      } else if (page.content.text !== undefined) {
        normalizedPage.text = page.content.text; // Fallback to nested text
      }
      if (page.content.imageUrl !== undefined) {
        normalizedPage.imageUrl = page.content.imageUrl;
      }
      if (page.content.audioUrl !== undefined) {
        normalizedPage.audioUrl = page.content.audioUrl;
      }
      if (page.content.displayText !== undefined) {
        normalizedPage.displayText = page.content.displayText;
      }
      if (page.content.audioText !== undefined) {
        normalizedPage.audioText = page.content.audioText;
      }
      if (page.content.videoUrl !== undefined) {
        normalizedPage.videoUrl = page.content.videoUrl;
      }
      if (page.content.questions !== undefined) {
        normalizedPage.questions = page.content.questions;
      }
      if (page.content.evaluationParameters !== undefined) {
        normalizedPage.evaluationParameters = page.content.evaluationParameters;
      }
      
      return normalizedPage;
    });
  };

  // Extract lesson title from lesson data
  const extractLessonTitle = (lessonData: any, fallbackLessonId?: string): string => {
    if (!lessonData && !fallbackLessonId) return 'Lição';
    
    // Try different possible title properties
    if (lessonData?.title) return lessonData.title;
    if (lessonData?.content?.title) return lessonData.content.title;
    if (lessonData?.description) return lessonData.description;
    
    // Use lesson ID as title if available
    if (fallbackLessonId) {
      // Convert kebab-case to title case (e.g., "food-lesson-002" -> "Food Lesson 002")
      return fallbackLessonId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    return 'Lição';
  };

  // Extract credits from lesson data
  const extractLessonCredits = (lessonData: any): LessonCredits | undefined => {
    console.log('🔍 Extracting credits from lessonData:', lessonData);
    if (!lessonData) {
      console.log('❌ No lessonData provided');
      return undefined;
    }
    
    // Top-level credits
    if (lessonData.credits && lessonData.credits.enabled) {
      console.log('✅ Found enabled credits (top-level):', lessonData.credits);
      return lessonData.credits;
    }
    
    // Credits inside content object
    if (lessonData.content?.credits && lessonData.content.credits.enabled) {
      console.log('✅ Found enabled credits (content):', lessonData.content.credits);
      return lessonData.content.credits;
    }
    
    console.log('❌ No enabled credits found');
    return undefined;
  };

  // Extract flashcards from lesson data
  const extractLessonFlashcards = (lessonData: any): LessonFlashcard[] => {
    if (!lessonData) return [];
    
    // Top-level flashcards
    if (lessonData.flashcards && Array.isArray(lessonData.flashcards)) {
      return lessonData.flashcards;
    }
    
    // Flashcards inside content object
    if (lessonData.content?.flashcards && Array.isArray(lessonData.content.flashcards)) {
      return lessonData.content.flashcards;
    }
    
    return [];
  };

  // Extract PNL consultation lesson ID from lesson data
  const extractPnlConsultationLessonId = (lessonData: any): string | undefined => {
    if (!lessonData) return undefined;
    
    // Top-level pnlConsultationLessonId
    if (lessonData.pnlConsultationLessonId) {
      return lessonData.pnlConsultationLessonId;
    }
    
    // Inside content object
    if (lessonData.content?.pnlConsultationLessonId) {
      return lessonData.content.pnlConsultationLessonId;
    }
    
    return undefined;
  };
  
  const [lesson, setLesson] = useState<any[]>([]);
  const [lessonCredits, setLessonCredits] = useState<any>(undefined);
  const [lessonFlashcards, setLessonFlashcards] = useState<LessonFlashcard[]>([]);
  const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
  const [pnlConsultationLessonId, setPnlConsultationLessonId] = useState<string | undefined>(undefined);
  
  // Preload all images from lesson pages in background for faster navigation
  useImagePreloader(lesson);
  
  // Initialize currentPageIndex from URL or state
  const initialPageIndex = urlPage ? Math.max(0, parseInt(urlPage) - 1) : (location.state?.currentPageIndex || 0);
  const [currentPageIndex, setCurrentPageIndex] = useState(initialPageIndex);
  const [hasCompletedLesson, setHasCompletedLesson] = useState(false);
  const [aiFeedbackQuestionIndex, setAiFeedbackQuestionIndex] = useState(0);
  const [trueFalseWithTextQuestionIndex, setTrueFalseWithTextQuestionIndex] = useState(0);
  const [returnPath, setReturnPath] = useState(initialReturnPath || "/complete-lessons");
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showCredits, setShowCredits] = useState<boolean>(false);
  const [creditsDismissedThisView, setCreditsDismissedThisView] = useState<boolean>(false);
  
  // Teacher mode states
  const { isTeacherMode, isSaveProgressOpen, setIsSaveProgressOpen } = useTeacherMode();
  
  // Editor mode states
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [editorModeActive, setEditorModeActive] = useState(false);
  const [keySequence, setKeySequence] = useState("");

  // True/False quiz state management
  const [trueFalseQuizStates, setTrueFalseQuizStates] = useState<{
    [pageIndex: number]: {
      currentQuestionIndex: number;
      userAnswers: (boolean | null)[];
      showResults: boolean[];
    }
  }>({});

  // Video quiz completion state management
  const [videoQuizCompletionStates, setVideoQuizCompletionStates] = useState<{[key: number]: boolean}>({});
  
  // Video quiz state management for preservation during navigation
  const [videoQuizStates, setVideoQuizStates] = useState<{[key: number]: any}>({});

  // Multiple Choice with Text quiz state management
  const [multipleChoiceWithTextStates, setMultipleChoiceWithTextStates] = useState<{
    [pageIndex: number]: {
      currentQuestionIndex: number;
      answers: { [key: string]: number | null };
      showResults: { [key: string]: boolean };
      isCompleted: boolean;
    }
  }>({});

  // Listening page cross-component coordination
  const [listeningNextSignals, setListeningNextSignals] = useState<{[pageIndex: number]: number}>({});
  const [listeningStates, setListeningStates] = useState<{[pageIndex: number]: { currentQuestionIndex: number; totalQuestions: number; isActivityCompleted: boolean; }}>({});

  // Multiple Choice with Text cross-component coordination
  const [mcwtNextSignals, setMcwtNextSignals] = useState<{[pageIndex: number]: number}>({});

  // PNL Slides state tracking
  const [pnlSlidesStates, setPnlSlidesStates] = useState<{[pageIndex: number]: { currentSlideIndex: number; totalSlides: number; isComplete: boolean; }}>({});
  const pnlSlidesRef = useRef<PNLSlidesPageRef>(null);
  
  // Pronunciation Slides state tracking
  const [pronunciationSlidesStates, setPronunciationSlidesStates] = useState<{[pageIndex: number]: { currentSlideIndex: number; totalSlides: number; isComplete: boolean; }}>({});
  const pronunciationSlidesRef = useRef<PronunciationSlidesPageRef>(null);
  
  // Custom Pronunciation Slides state tracking
  const [customPronunciationSlidesStates, setCustomPronunciationSlidesStates] = useState<{[pageIndex: number]: { currentSlideIndex: number; totalSlides: number; isComplete: boolean; }}>({});
  const customPronunciationSlidesRef = useRef<CustomPronunciationSlidesPageRef>(null);
  
  // Audio Slides state tracking
  const [audioSlidesStates, setAudioSlidesStates] = useState<{[pageIndex: number]: { currentSlideIndex: number; totalSlides: number; isComplete: boolean; }}>({});
  const audioSlidesRef = useRef<AudioSlidesPageRef>(null);

  // Memoized handler to avoid render loops in MultipleChoiceWithTextPage
  const handleMCWTStateChange = useCallback((state: {
    currentQuestionIndex: number;
    answers: { [key: string]: number | null };
    showResults: { [key: string]: boolean };
    isCompleted: boolean;
  }) => {
    setMultipleChoiceWithTextStates(prev => {
      const prevState = prev[currentPageIndex];
      const isSame = prevState &&
        prevState.currentQuestionIndex === state.currentQuestionIndex &&
        JSON.stringify(prevState.answers) === JSON.stringify(state.answers) &&
        JSON.stringify(prevState.showResults) === JSON.stringify(state.showResults) &&
        prevState.isCompleted === state.isCompleted;
      if (isSame) return prev;
      return { ...prev, [currentPageIndex]: state };
    });
  }, [currentPageIndex]);

  // Enhanced logging for debugging
  console.log('🚀 LessonRunner - Initialization state:', {
    lessonId,
    selectedDifficulty,
    hasLesson: !!lesson,
    lessonLength: Array.isArray(lesson) ? lesson.length : 0,
    currentPageIndex,
    returnPath,
    initialReturnPath,
    locationState: location.state
  });

  console.log('🔍 LessonRunner - Current lesson content preview:', 
    Array.isArray(lesson) && lesson[0] ? {
      firstPageType: lesson[0].type,
      firstPageTitle: lesson[0].title,
      firstPageText: lesson[0].text?.substring(0, 100) + '...'
    } : 'No lesson data'
  );

  // This effect will capture the returnPath from the location state
  // whenever it's available and persist it in our component's state.
  useEffect(() => {
    if (location.state?.returnPath) {
      console.log('LessonRunner - Setting returnPath from location state:', location.state.returnPath);
      setReturnPath(location.state.returnPath);
    } else {
      console.log('LessonRunner - No returnPath in location state, using default:', returnPath);
    }
  }, [location.state?.returnPath]);

  // Reset all state when lessonId changes (critical for book mode transitions)
  const prevLessonIdRef = useRef(lessonId);
  const isCompletingRef = useRef(false);
  useEffect(() => {
    if (lessonId && lessonId !== prevLessonIdRef.current) {
      console.log('📖 LessonRunner - Lesson changed, resetting state:', prevLessonIdRef.current, '->', lessonId);
      prevLessonIdRef.current = lessonId;
      const newPageIndex = location.state?.currentPageIndex || 0;
      setCurrentPageIndex(newPageIndex);
      setHasCompletedLesson(false);
      setAiFeedbackQuestionIndex(0);
      setTrueFalseWithTextQuestionIndex(0);
      setCanProceed(true);
      setShowCredits(false);
      setCreditsDismissedThisView(false);
      setIsDataLoaded(false);
      setTrueFalseQuizStates({});
      setVideoQuizCompletionStates({});
      setVideoQuizStates({});
      setMultipleChoiceWithTextStates({});
      setListeningNextSignals({});
      setListeningStates({});
      setMcwtNextSignals({});
      setPnlSlidesStates({});
      setPronunciationSlidesStates({});
      setCustomPronunciationSlidesStates({});
      setAudioSlidesStates({});
    }
  }, [lessonId, location.state?.currentPageIndex]);

  // Get language context and query client
  const { learningLanguage } = useLanguage();
  const queryClient = useQueryClient();
  
  // Create a React Query hook for lesson data fetching
  const { data: lessonData, isLoading: lessonDataLoading, error: lessonError, refetch } = useQuery({
    queryKey: ['lesson_data', lessonId],
    queryFn: async () => {
      console.log('🔍 React Query: queryFn called for lessonId:', lessonId);
      console.log('🔍 React Query: Learning language:', learningLanguage);
      if (!lessonId) return null;
      
      let foundData = null;
      let sourceTable = '';
      
      // First try content_items if it looks like a UUID (contains dashes and has UUID format)
      if (typeof lessonId === 'string' && lessonId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // Try toefl_items first
        const toeflResult = await supabase
          .from('toefl_items')
          .select('*')
          .eq('id', lessonId)
          .maybeSingle();
        
        if (!toeflResult.error && toeflResult.data) {
          foundData = toeflResult.data;
          sourceTable = 'toefl_items';
          console.log('✅ Found lesson in toefl_items:', foundData);
        } else {
          // Try content_items
          const contentResult = await supabase
            .from('content_items')
            .select('*')
            .eq('id', lessonId)
            .maybeSingle();
          
          if (!contentResult.error && contentResult.data) {
            foundData = contentResult.data;
            sourceTable = 'content_items';
            console.log('✅ Found lesson in content_items:', foundData);
          }
        }
      }
      
      // If not found in UUID tables or not a UUID, try regular lesson tables
      if (!foundData) {
        // Try regular lesson tables based on language
        const tableName = learningLanguage === 'es' ? 'lessons_spanish' : 'lessons';
        
        console.log(`🔍 Querying ${tableName} for lesson ID: ${lessonId}`);
        const result = await supabase
          .from(tableName as 'lessons' | 'lessons_spanish')
          .select('*')
          .eq('id', lessonId)
          .maybeSingle();
        
        console.log(`🔍 ${tableName} query result:`, { data: result.data, error: result.error });
        
        if (!result.error && result.data) {
          foundData = result.data;
          sourceTable = tableName;
          console.log(`✅ Found lesson in ${tableName}:`, foundData);
        }
      }
      
      if (!foundData) {
        console.log('❌ Lesson not found in any table');
        throw new Error('Lesson not found');
      }
      
      console.log(`🔍 Lesson found in table: ${sourceTable}`);
      console.log('📄 Lesson data:', foundData);
      
      return foundData;
    },
    enabled: !!lessonId,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0, // Force fresh queries
    gcTime: 0, // Don't cache (renamed from cacheTime in v5)
  });

  // Debug React Query state
  useEffect(() => {
    console.log('🔍 React Query Debug Info:', {
      lessonId: lessonId,
      enabled: !!lessonId,
      lessonData: lessonData,
      lessonDataLoading: lessonDataLoading,
      lessonError: lessonError,
      learningLanguage: learningLanguage
    });
  }, [lessonId, lessonData, lessonDataLoading, lessonError, learningLanguage]);

  // Cheat code detection for editor mode
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.match(/^[a-zA-Z0-9]$/)) {
        setKeySequence(prev => {
          const newSequence = (prev + event.key.toLowerCase()).slice(-7); // Keep last 7 characters
          console.log("🎹 Key sequence:", newSequence);
          
          // Check for editor mode cheat code "abcdefg"
          if (newSequence === "abcdefg") {
            console.log("✏️ EDITOR MODE TOGGLED!");
            setEditorModeActive(prev => !prev);
            setKeySequence(""); // Reset sequence
            toast({
              title: editorModeActive ? "Editor mode disabled" : "✏️ Editor mode enabled",
              description: editorModeActive ? "Edit button hidden" : "Click the edit button to modify pages",
            });
            return "";
          }
          
          return newSequence;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [editorModeActive]);

  // Set up real-time subscription for lesson updates
  useEffect(() => {
    if (!lessonId || typeof lessonId !== 'string' || !lessonId.includes('-')) {
      return; // Only set up real-time for UUID-based lessons (TOEFL/content items)
    }

    console.log('🔄 Setting up real-time subscription for lesson:', lessonId);

    const channel = supabase
      .channel('lesson-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'toefl_items',
          filter: `id=eq.${lessonId}`
        },
        (payload) => {
          console.log('🔄 Real-time update received for TOEFL lesson:', payload);
          console.log('🔄 Payload details:', JSON.stringify(payload, null, 2));
          
          // Invalidate and force refetch the lesson data
          console.log('🔄 Invalidating queries and refetching...');
          queryClient.invalidateQueries({ queryKey: ['lesson_data', lessonId] });
          queryClient.invalidateQueries({ queryKey: ['lesson_data'] });
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'content_items',
          filter: `id=eq.${lessonId}`
        },
        (payload) => {
          console.log('🔄 Real-time update received for content lesson:', payload);
          // Invalidate and force refetch the lesson data
          queryClient.invalidateQueries({ queryKey: ['lesson_data', lessonId] });
          refetch();
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [lessonId, refetch]);

  // Load lesson data - prioritize fresh database data for UUID-based lessons
  useEffect(() => {
    console.log('🔄 LessonRunner - loadLessonData effect triggered');
    console.log('🔍 Available lessonId:', lessonId);
    console.log('🔍 Available initialLesson:', initialLesson);
    console.log('🔍 React Query lessonData:', lessonData);
    console.log('🔍 React Query loading:', lessonDataLoading);
    
    // For all lessons, try to get fresh data from React Query first
    if (lessonData) {
      console.log('✅ Using fresh lesson data from React Query');
      console.log('🔍 Raw lessonData:', JSON.stringify(lessonData, null, 2));
      
      const freshPages = extractLessonPages(lessonData);
      const freshCredits = extractLessonCredits(lessonData);
      const freshFlashcards = extractLessonFlashcards(lessonData);
      const freshPnlConsultationLessonId = extractPnlConsultationLessonId(lessonData) || statePnlConsultationLessonId;
      
      console.log('📊 Extracted pages:', freshPages.length, 'pages');
      console.log('📝 First page content:', JSON.stringify(freshPages[0], null, 2));
      console.log('💳 Extracted credits:', freshCredits);
      console.log('🎴 Extracted flashcards:', freshFlashcards);
      console.log('📖 PNL Consultation:', freshPnlConsultationLessonId, '(from state:', statePnlConsultationLessonId, ')');
      
      setLesson(freshPages);
      setLessonCredits(freshCredits);
      setLessonFlashcards(freshFlashcards);
      setPnlConsultationLessonId(freshPnlConsultationLessonId);
      setIsDataLoaded(true);
      return;
    }
    
    if (lessonDataLoading) {
      console.log('⏳ Still loading data from React Query...');
      return;
    }
    
    // If React Query failed to find data, check location state as fallback
    if (!lessonDataLoading && !lessonData) {
      console.log('❌ No lesson data found in database, checking location state fallback...');
    }
    
    // For non-UUID lessons or fallback, use location state if available
    if (initialLesson && Array.isArray(initialLesson) && initialLesson.length > 0) {
      console.log('✅ Using lesson data from location state');
      const pages = extractLessonPages(initialLesson);
      const credits = extractLessonCredits(initialLesson);
      const flashcards = extractLessonFlashcards(initialLesson);
      const pnlId = extractPnlConsultationLessonId(initialLesson) || statePnlConsultationLessonId;
      
      setLesson(pages);
      setLessonCredits(credits);
      setLessonFlashcards(flashcards);
      setPnlConsultationLessonId(pnlId);
      setIsDataLoaded(true);
      return;
    }

    // If no data available, mark as loaded
    console.log('❌ No lesson data available');
    setIsDataLoaded(true);
  }, [lessonData, lessonDataLoading, initialLesson, lessonId]);

  // Show/hide credits based on current page index
  useEffect(() => {
    if (!isDataLoaded || !lessonCredits?.enabled) {
      setShowCredits(false);
      return;
    }

    if (currentPageIndex === 0) {
      // On page 0: show credits if not dismissed yet
      if (!creditsDismissedThisView) {
        setShowCredits(true);
      }
    } else {
      // Not on page 0: hide credits and reset dismissed flag for next visit to page 0
      setShowCredits(false);
      setCreditsDismissedThisView(false);
    }
  }, [currentPageIndex, isDataLoaded, lessonCredits?.enabled, creditsDismissedThisView]);

  // Add score page for TOEFL listening lessons
  useEffect(() => {
    if (lesson.length > 0) {
      const isToeflListeningLesson = location.pathname.includes('/lesson-runner') && 
        initialReturnPath?.includes('/toefl/') && 
        initialReturnPath?.includes('listening');
      
      if (isToeflListeningLesson) {
        // Check if score page is already added
        const hasScorePage = lesson.some(page => page.type === 'toeflScore');
        if (!hasScorePage) {
          // Count multiple choice questions
          const totalQuestions = lesson.filter(page => 
            page.type === 'multipleChoice' || page.type === 'audioMultipleChoice'
          ).length;
          
          // Add score page at the end
          const scorePageData = {
            type: 'toeflScore',
            totalQuestions: totalQuestions,
            title: 'TOEFL Listening Results'
          };
          
          setLesson(prevLesson => [...prevLesson, scorePageData]);
        }
      }
    }
  }, [lesson.length, location.pathname, initialReturnPath]);

  // Check if lesson is already completed
  useEffect(() => {
    if (!lessonId || !isAuthenticated) return;

    let completed = false;
    if (isTOEFLLesson) {
      completed = isTOEFLItemComplete(lessonId);
    } else if (selectedDifficulty) {
      completed = isLessonComplete(lessonId, selectedDifficulty);
    }

    // Only update state if it actually changes to avoid re-renders
    setHasCompletedLesson(prev => (prev !== completed ? completed : prev));
  }, [lessonId, selectedDifficulty, isAuthenticated, isTOEFLLesson]);

  // This effect handles restoring state from navigation (e.g., returning from specialist help)
  // and then clears that state from `location.state` to prevent it from being reapplied on
  // subsequent navigations within the lesson, which was causing the loop.
  useEffect(() => {
    const pageIndexFromState = location.state?.currentPageIndex;
    const feedbackIndexFromState = location.state?.aiFeedbackQuestionIndex;
    const trueFalseWithTextIndexFromState = location.state?.trueFalseWithTextQuestionIndex;
    const listeningStatesFromState = location.state?.listeningStates;
    const trueFalseStatesFromState = location.state?.trueFalseQuizStates;
    const videoQuizStateFromState = location.state?.videoQuizState;
    const multipleChoiceWithTextStatesFromState = location.state?.multipleChoiceWithTextStates;

    if (pageIndexFromState !== undefined || feedbackIndexFromState !== undefined || trueFalseWithTextIndexFromState !== undefined || listeningStatesFromState || trueFalseStatesFromState || videoQuizStateFromState || multipleChoiceWithTextStatesFromState) {
      if (pageIndexFromState !== undefined) {
        setCurrentPageIndex(pageIndexFromState);
      }
      if (feedbackIndexFromState !== undefined) {
        setAiFeedbackQuestionIndex(feedbackIndexFromState);
      }
      if (trueFalseWithTextIndexFromState !== undefined) {
        setTrueFalseWithTextQuestionIndex(trueFalseWithTextIndexFromState);
      }
      if (listeningStatesFromState) {
        setListeningStates(listeningStatesFromState);
      }
      if (trueFalseStatesFromState) {
        setTrueFalseQuizStates(trueFalseStatesFromState);
      }
      if (videoQuizStateFromState) {
        setVideoQuizStates(prev => ({
          ...prev,
          [pageIndexFromState || currentPageIndex]: videoQuizStateFromState
        }));
      }
      if (multipleChoiceWithTextStatesFromState) {
        setMultipleChoiceWithTextStates(multipleChoiceWithTextStatesFromState);
      }
      
      const { 
        currentPageIndex: _p, 
        aiFeedbackQuestionIndex: _f, 
        trueFalseWithTextQuestionIndex: _tw,
        listeningStates: _l,
        trueFalseQuizStates: _t, 
        videoQuizState: _v, 
        multipleChoiceWithTextStates: _m, 
        ...restState 
      } = location.state;
      navigate(location.pathname, { state: restState, replace: true });
    }
  }, [location.state, location.pathname, navigate]);

  if (!lesson || (Array.isArray(lesson) && lesson.length === 0) || !isDataLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {!isDataLoaded ? "Carregando lição..." : "Lição não encontrada"}
        </h1>
        {isDataLoaded && (
          <Button onClick={() => navigate(returnPath || "/complete-lessons")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para lições
          </Button>
        )}
      </div>
    );
  }

  // The lesson data from the database stores pages directly in the content field
  const pages = lesson || [];
  const currentPage = pages[currentPageIndex];


  // Reset scroll positions for window and internal scroll containers after page change
  const resetScrollPositions = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        console.log('🔝 resetScrollPositions executed');
        try {
          window.scrollTo(0, 0);
        } catch {}
        const scope = document.querySelector('.h-screen.bg-gray-50') || document.body;
        const containers = (scope as HTMLElement).querySelectorAll('.overflow-y-auto, .overflow-auto, .overflow-y-scroll');
        containers.forEach((el) => {
          (el as HTMLElement).scrollTop = 0;
        });
      });
    });
  };

  const handleNext = () => {
    // Check if current page has multiple items that need to be advanced through
    const pageHasMoreItems = checkCurrentPageHasMoreItems();
    
    if (pageHasMoreItems) {
      // Advance to next item within the same page
      advanceToNextItemInPage();
    } else if (currentPageIndex < pages.length - 1) {
      // Stop any playing audio before changing pages
      stopAudio();
      setAiFeedbackQuestionIndex(0);
      setTrueFalseWithTextQuestionIndex(0);
      const nextPageIdx = currentPageIndex + 1;
      setCurrentPageIndex(nextPageIdx);
      resetScrollPositions();
      
      // Save book progress on page change
      if (bookModeState?.lessonSequence && lessonId) {
        try {
          const savedSession = localStorage.getItem('phone_auth_session');
          if (savedSession) {
            const parsedSession = JSON.parse(savedSession);
            supabase.from('book_mode_progress').upsert({
              phone_number: parsedSession.phone_number,
              category: bookModeState.category,
              current_lesson_id: lessonId,
              current_page_index: nextPageIdx,
              lesson_sequence: bookModeState.lessonSequence,
              total_lessons: bookModeState.lessonSequence.length,
              current_lesson_index: bookModeState.currentIndex,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'phone_number,category' }).then(() => {});
          }
        } catch (e) { /* silent */ }
      }
    } else {
      handleComplete();
    }
  };

  const moveToNextPageOrComplete = () => {
    if (currentPageIndex < pages.length - 1) {
      stopAudio();
      setAiFeedbackQuestionIndex(0);
      setTrueFalseWithTextQuestionIndex(0);
      setCurrentPageIndex(currentPageIndex + 1);
      resetScrollPositions();
    } else {
      handleComplete();
    }
  };
  
  // Check if on the last page but still has items to complete
  const isOnLastPageWithMoreItems = (): boolean => {
    return currentPageIndex === pages.length - 1 && checkCurrentPageHasMoreItems();
  };

  // Check if current page type has multiple items and if there are more items to show
  const checkCurrentPageHasMoreItems = (): boolean => {
    if (!currentPage) return false;

    const pageType = currentPage.type;

    switch (pageType) {
      case 'multipleChoiceWithText': {
        const state = multipleChoiceWithTextStates[currentPageIndex];
        const questions = currentPage.content?.questions || currentPage.questions || [];
        const currentIndex = state?.currentQuestionIndex || 0;
        // Allow skipping like the in-page "Skip" button
        return currentIndex < questions.length - 1 && !state?.isCompleted;
      }
      case 'listening':
      case 'listeningVideo': {
        const st = listeningStates[currentPageIndex];
        if (!st) return false;
        return !st.isActivityCompleted && st.currentQuestionIndex < st.totalQuestions;
      }
      case 'aiFeedback':
      case 'aiFeedbackWithParameters':
      case 'aiFeedbackWithParametersEssay':
      case 'recommendedVocabulary': {
        const questions = currentPage.content?.questions || currentPage.questions || [];
        return aiFeedbackQuestionIndex < questions.length - 1;
      }
      case 'trueFalse': {
        const state = trueFalseQuizStates[currentPageIndex];
        let questions = [] as any[];
        if (currentPage.questions && Array.isArray(currentPage.questions)) {
          questions = currentPage.questions;
        } else if (currentPage.statement || currentPage.content?.statement) {
          questions = [{}]; // Single question
        }
        const currentIndex = state?.currentQuestionIndex || 0;
        // Allow skipping regardless of answered state
        return currentIndex < questions.length - 1;
      }
      case 'trueFalseWithText': {
        const questions = currentPage.content?.questions || currentPage.questions || [];
        return trueFalseWithTextQuestionIndex < questions.length - 1;
      }
      case 'pnlSlides': {
        // Use the ref to check if slideshow is complete
        if (pnlSlidesRef.current) {
          return !pnlSlidesRef.current.isComplete();
        }
        // Fallback to state
        const state = pnlSlidesStates[currentPageIndex];
        if (!state) return true; // Assume more items if no state yet
        return !state.isComplete && state.currentSlideIndex < state.totalSlides - 1;
      }
      case 'pronunciationSlides': {
        // Check if slideshow has more slides - canProceed only affects button disabled state, not which button to show
        if (pronunciationSlidesRef.current) {
          return !pronunciationSlidesRef.current.isComplete();
        }
        // Fallback to state
        const state = pronunciationSlidesStates[currentPageIndex];
        if (!state) return true;
        return !state.isComplete;
      }
      case 'customPronunciationSlides': {
        // Check if slideshow has more slides - canProceed only affects button disabled state, not which button to show
        if (customPronunciationSlidesRef.current) {
          return !customPronunciationSlidesRef.current.isComplete();
        }
        // Fallback to state
        const state = customPronunciationSlidesStates[currentPageIndex];
        if (!state) return true;
        return !state.isComplete;
      }
      case 'audioSlides': {
        // Check if slideshow has more slides
        if (audioSlidesRef.current) {
          return !audioSlidesRef.current.isComplete();
        }
        // Fallback to state
        const state = audioSlidesStates[currentPageIndex];
        if (!state) return true;
        return !state.isComplete;
      }
      default:
        return false;
    }
  };

  // Advance to the next item within the current page
  const advanceToNextItemInPage = () => {
    if (!currentPage) return;

    const pageType = currentPage.type;

    switch (pageType) {
      case 'multipleChoiceWithText': {
        setMcwtNextSignals(prev => ({
          ...prev,
          [currentPageIndex]: (prev[currentPageIndex] || 0) + 1,
        }));
        break;
      }
      case 'aiFeedback':
      case 'aiFeedbackWithParameters':
      case 'aiFeedbackWithParametersEssay':
      case 'recommendedVocabulary': {
        const questions = currentPage.content?.questions || currentPage.questions || [];
        setAiFeedbackQuestionIndex(prev => Math.min(prev + 1, Math.max(questions.length - 1, 0)));
        break;
      }
      case 'trueFalse': {
        const state = getTrueFalseQuizState(currentPageIndex);
        updateTrueFalseQuizState(currentPageIndex, {
          currentQuestionIndex: state.currentQuestionIndex + 1
        });
        break;
      }
      case 'trueFalseWithText': {
        setTrueFalseWithTextQuestionIndex(trueFalseWithTextQuestionIndex + 1);
        break;
      }
      case 'listening':
      case 'listeningVideo': {
        const st = listeningStates[currentPageIndex];
        if (st && st.currentQuestionIndex >= st.totalQuestions - 1) {
          moveToNextPageOrComplete();
        } else {
          setListeningNextSignals(prev => ({
            ...prev,
            [currentPageIndex]: (prev[currentPageIndex] || 0) + 1,
          }));
        }
        break;
      }
      case 'pnlSlides': {
        // Use the ref to advance to next slide
        if (pnlSlidesRef.current) {
          const shouldProceed = pnlSlidesRef.current.handleExternalNext();
          if (shouldProceed) {
            // Slideshow is complete - immediately proceed to next page or complete
            setPnlSlidesStates(prev => ({
              ...prev,
              [currentPageIndex]: { ...prev[currentPageIndex], isComplete: true }
            }));
            
            // Navigate immediately instead of waiting for another click
            if (currentPageIndex < pages.length - 1) {
              stopAudio();
              setAiFeedbackQuestionIndex(0);
              setTrueFalseWithTextQuestionIndex(0);
              setCurrentPageIndex(currentPageIndex + 1);
              resetScrollPositions();
            } else {
              handleComplete();
            }
          }
        }
        break;
      }
      case 'pronunciationSlides': {
        // Only advance if user has recorded (canProceed is true)
        if (!canProceed) return;
        
        // Use the ref to advance to next slide
        if (pronunciationSlidesRef.current) {
          const shouldProceed = pronunciationSlidesRef.current.handleExternalNext();
          if (shouldProceed) {
            // Slideshow is complete - immediately proceed to next page or complete
            setPronunciationSlidesStates(prev => ({
              ...prev,
              [currentPageIndex]: { ...prev[currentPageIndex], isComplete: true }
            }));
            
            // Navigate immediately instead of waiting for another click
            if (currentPageIndex < pages.length - 1) {
              stopAudio();
              setAiFeedbackQuestionIndex(0);
              setTrueFalseWithTextQuestionIndex(0);
              setCurrentPageIndex(currentPageIndex + 1);
              resetScrollPositions();
            } else {
              handleComplete();
            }
          }
        }
        break;
      }
      case 'customPronunciationSlides': {
        // Only advance if user has recorded (canProceed is true)
        if (!canProceed) return;
        
        // Use the ref to advance to next slide
        if (customPronunciationSlidesRef.current) {
          const shouldProceed = customPronunciationSlidesRef.current.handleExternalNext();
          if (shouldProceed) {
            setCustomPronunciationSlidesStates(prev => ({
              ...prev,
              [currentPageIndex]: { ...prev[currentPageIndex], isComplete: true }
            }));
            
            if (currentPageIndex < pages.length - 1) {
              stopAudio();
              setAiFeedbackQuestionIndex(0);
              setTrueFalseWithTextQuestionIndex(0);
              setCurrentPageIndex(currentPageIndex + 1);
              resetScrollPositions();
            } else {
              handleComplete();
            }
          }
        }
        break;
      }
      case 'audioSlides': {
        // Use the ref to advance to next slide
        if (audioSlidesRef.current) {
          const shouldProceed = audioSlidesRef.current.handleExternalNext();
          if (shouldProceed) {
            setAudioSlidesStates(prev => ({
              ...prev,
              [currentPageIndex]: { ...prev[currentPageIndex], isComplete: true }
            }));
            
            if (currentPageIndex < pages.length - 1) {
              stopAudio();
              setAiFeedbackQuestionIndex(0);
              setTrueFalseWithTextQuestionIndex(0);
              setCurrentPageIndex(currentPageIndex + 1);
              resetScrollPositions();
            } else {
              handleComplete();
            }
          }
        }
        break;
      }
    }
  };

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      // Stop any playing audio before changing pages
      stopAudio();
      setAiFeedbackQuestionIndex(0);
      setTrueFalseWithTextQuestionIndex(0);
      setCurrentPageIndex(currentPageIndex - 1);
      resetScrollPositions();
    }
  };

  const handleComplete = async () => {
    // Guard against double-clicks / re-entry that can leave the user stuck
    if (isCompletingRef.current) {
      console.log('handleComplete already in progress, ignoring duplicate call');
      return;
    }
    isCompletingRef.current = true;
    // Always release the guard after a short window so legitimate retries still work
    setTimeout(() => { isCompletingRef.current = false; }, 4000);

    if (!isAuthenticated) {
      toast({
        title: "Erro",
        description: "Faça login para concluir a lição.",
        variant: "destructive",
      });
      return;
    }

    if (!lessonId) {
      // No lessonId — can't mark complete, but don't trap the user: navigate back
      console.warn('handleComplete called without lessonId, navigating back via returnPath:', returnPath);
      if (returnPath === '/curso-completo' || cursoCompletoCategory) {
        navigate('/', { state: { showCursoCompleto: true, cursoCompletoCategory }, replace: true });
      } else if (returnPath === '/') {
        navigate('/', { state: { returnToContentMode: true }, replace: true });
      } else if (returnPath && validateContentPath(returnPath)) {
        navigate(returnPath, { replace: true });
      } else {
        navigate(returnPath || "/complete-lessons", { state: { selectedDifficulty }, replace: true });
      }
      return;
    }

    if (hasCompletedLesson) {
      if (returnPath === '/curso-completo' || cursoCompletoCategory) {
        navigate('/', { state: { showCursoCompleto: true, cursoCompletoCategory }, replace: true });
      } else if (returnPath === '/') {
        navigate('/', { state: { returnToContentMode: true }, replace: true });
      } else if (returnPath && validateContentPath(returnPath)) {
        navigate(returnPath, { replace: true });
      } else {
        navigate(returnPath || "/complete-lessons", { 
          state: { selectedDifficulty },
          replace: true
        });
      }
      return;
    }

    let success = false;
      
    if (isTOEFLLesson) {
      // Handle TOEFL lesson completion
      success = await markTOEFLItemComplete(lessonId);
    } else {
      // Handle regular lesson completion, falling back to the menu difficulty if route state is missing
      const completionDifficulty = selectedDifficulty || "Fácil";
      const isContentLesson = returnPath === '/' || (returnPath && validateContentPath(returnPath));
      success = await markLessonComplete(lessonId, completionDifficulty, isContentLesson);
    }
      
      if (success) {
        setHasCompletedLesson(true);
        
        // Save flashcards to user_flashcards if any exist
        if (lessonFlashcards.length > 0) {
          try {
            const { data: { user: supabaseUser } } = await supabase.auth.getUser();
            if (supabaseUser) {
              // Helper to generate and upload audio for a word
              const generateAudioUrl = async (word: string): Promise<string | null> => {
                try {
                  const { data: audioData, error: audioError } = await supabase.functions.invoke('speak-elevenlabs', {
                    body: { text: word.trim() },
                  });
                  if (audioError) throw audioError;

                  const binaryString = atob(audioData.audioContent);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                  const audioBlob = new Blob([bytes], { type: 'audio/mp3' });

                  const safe = word.toLowerCase().replace(/[^a-z0-9]/gi, '_');
                  const fileName = `${supabaseUser.id}/${safe}_${Date.now()}.mp3`;
                  const { error: uploadError } = await supabase.storage
                    .from('flashcard-audio')
                    .upload(fileName, audioBlob, { contentType: 'audio/mp3', upsert: false });
                  if (uploadError) throw uploadError;

                  const { data: { publicUrl } } = supabase.storage
                    .from('flashcard-audio')
                    .getPublicUrl(fileName);
                  return publicUrl;
                } catch (e) {
                  console.error('Audio generation/upload failed for', word, e);
                  return null;
                }
              };

              // Generate audio for each flashcard word in parallel
              const flashcardsToInsert = await Promise.all(
                lessonFlashcards.map(async (card) => ({
                  user_id: supabaseUser.id,
                  front_text: card.front,
                  back_text: card.back,
                  audio_url: await generateAudioUrl(card.front),
                }))
              );

              console.log('Attempting to save flashcards with user_id:', supabaseUser.id, flashcardsToInsert);
              const { data: savedData, error: flashcardsError } = await supabase
                .from('user_flashcards')
                .insert(flashcardsToInsert)
                .select();
              
              if (flashcardsError) {
                console.error('Error saving flashcards:', flashcardsError);
                toast({
                  title: 'Erro ao salvar flashcards',
                  description: 'Não foi possível salvar os flashcards. Tente novamente.',
                  variant: 'destructive',
                });
              } else {
                console.log('Flashcards saved successfully!', savedData);
                setShowFlashcardsModal(true);
                return;
              }
            } else {
              console.warn('No Supabase user found; user must be logged in to save flashcards.');
            }
          } catch (error) {
            console.error('Error saving flashcards:', error);
            toast({
              title: 'Erro ao salvar flashcards',
              description: 'Ocorreu um erro inesperado.',
              variant: 'destructive',
            });
          }
        }
        
        toast({
          title: "Parabéns! 🎉",
          description: "Lição concluída com sucesso!",
        });
        
        // Book mode: auto-advance to next lesson in sequence
        if (bookModeState && bookModeState.lessonSequence) {
          const { lessonSequence, currentIndex, category, categoryTitle, lessonTitles } = bookModeState;
          const nextIndex = currentIndex + 1;
          
          if (nextIndex < lessonSequence.length) {
            // Save progress and navigate to next lesson
            const nextLessonId = lessonSequence[nextIndex];
            
            // Save book progress
            try {
              const savedSession = localStorage.getItem('phone_auth_session');
              if (savedSession) {
                const parsedSession = JSON.parse(savedSession);
                await supabase
                  .from('book_mode_progress')
                  .upsert({
                    phone_number: parsedSession.phone_number,
                    category,
                    current_lesson_id: nextLessonId,
                    current_page_index: 0,
                    lesson_sequence: lessonSequence,
                    total_lessons: lessonSequence.length,
                    current_lesson_index: nextIndex,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'phone_number,category' });
              }
            } catch (e) {
              console.error('Error saving book progress:', e);
            }
            
            toast({
              title: `Próxima lição 📖`,
              description: lessonTitles?.[nextIndex] || `Lição ${nextIndex + 1}`,
            });
            
            setTimeout(() => {
              navigate(`/lesson/${nextLessonId}`, {
                state: {
                  returnPath: '/curso-completo',
                  selectedDifficulty: selectedDifficulty,
                  currentPageIndex: 0,
                  cursoCompletoCategory,
                  bookMode: {
                    ...bookModeState,
                    currentIndex: nextIndex,
                  },
                },
                replace: true,
              });
            }, 1500);
            return;
          } else {
            // Book completed!
            toast({
              title: "Livro Concluído! 🏆",
              description: `Você completou o ${categoryTitle || category}!`,
            });
          }
        }
        
        // Automatically redirect back to the appropriate location after completion
        setTimeout(() => {
          if (returnPath === '/curso-completo' || cursoCompletoCategory) {
            navigate('/', { 
              state: { showCursoCompleto: true, cursoCompletoCategory },
              replace: true 
            });
          } else if (returnPath === '/') {
            navigate('/', { 
              state: { returnToContentMode: true },
              replace: true 
            });
          } else if (returnPath && validateContentPath(returnPath)) {
            navigate(returnPath, { replace: true });
          } else if (returnPath && returnPath.startsWith('/content/')) {
            console.warn('Invalid content path on completion, falling back to Index content mode:', returnPath);
            navigate('/', { 
              state: { returnToContentMode: true },
              replace: true 
            });
          } else {
            navigate(returnPath || "/complete-lessons", { 
              state: { selectedDifficulty },
              replace: true
            });
          }
        }, 2000);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível marcar a lição como concluída.",
          variant: "destructive",
        });
      }
  };

  const handleFlashcardsModalClose = () => {
    setShowFlashcardsModal(false);
    
    toast({
      title: "Parabéns! 🎉",
      description: "Lição concluída com sucesso!",
    });
    
    // Redirect after closing modal
    setTimeout(() => {
      if (returnPath === '/curso-completo' || cursoCompletoCategory) {
        navigate('/', { 
          state: { showCursoCompleto: true, cursoCompletoCategory },
          replace: true 
        });
      } else if (returnPath === '/') {
        navigate('/', { 
          state: { returnToContentMode: true },
          replace: true 
        });
      } else if (returnPath && validateContentPath(returnPath)) {
        navigate(returnPath, { replace: true });
      } else if (returnPath && returnPath.startsWith('/content/')) {
        console.warn('Invalid content path on completion, falling back to Index content mode:', returnPath);
        navigate('/', { 
          state: { returnToContentMode: true },
          replace: true 
        });
      } else {
        navigate(returnPath || "/complete-lessons", { 
          state: { selectedDifficulty },
          replace: true
        });
      }
    }, 1000);
  };

  const handleCreditsComplete = () => {
    setCreditsDismissedThisView(true);
    setShowCredits(false);
  };


  const handleBackToLessons = () => {
    // Stop any playing audio before leaving lesson
    stopAudio();
    
    // If returnPath is root, we're returning to content mode on Index page
    if (returnPath === '/lessons') {
      // Return to PNL lessons page
      navigate('/lessons', { replace: true });
    } else if (returnPath === '/curso-completo' || cursoCompletoCategory) {
      navigate('/', { 
        state: { currentMode: 'curso-completo', cursoCompletoCategory },
        replace: true 
      });
    } else if (returnPath === '/') {
      navigate('/', { 
        state: { returnToContentMode: true },
        replace: true 
      });
    } else if (returnPath && validateContentPath(returnPath)) {
      navigate(returnPath, { replace: true });
    } else if (returnPath && returnPath.startsWith('/content/')) {
      // Invalid content path, fallback to Index page in content mode
      console.warn('Invalid content path, falling back to Index content mode:', returnPath);
      navigate('/', { 
        state: { returnToContentMode: true },
        replace: true 
      });
    } else {
      navigate(returnPath || "/complete-lessons", { 
        state: { selectedDifficulty },
        replace: true
      });
    }
  };

  // Create audio context object to pass to page components
  const audioContext = {
    playAudio,
    pauseAudio,
    isAudioPlaying
  };

  const handleAudioGenerated = (pageIndex: number, newAudioUrl: string) => {
    setLesson(currentPages => {
      if (!Array.isArray(currentPages) || !currentPages[pageIndex]) {
        return currentPages;
      }
      const newPages = [...currentPages];
      newPages[pageIndex] = { ...newPages[pageIndex], audioUrl: newAudioUrl };
      return newPages;
    });
  };

  const handleImageGenerated = (pageIndex: number, newImageUrl: string) => {
    setLesson(currentPages => {
      if (!Array.isArray(currentPages) || !currentPages[pageIndex]) {
        return currentPages;
      }
      const newPages = [...currentPages];
      newPages[pageIndex] = { ...newPages[pageIndex], imageUrl: newImageUrl };
      return newPages;
    });
  };

  // 

  // True/False quiz state handlers
  const getTrueFalseQuizState = (pageIndex: number) => {
    return trueFalseQuizStates[pageIndex] || {
      currentQuestionIndex: 0,
      userAnswers: [],
      showResults: []
    };
  };

  const updateTrueFalseQuizState = (pageIndex: number, updates: Partial<typeof trueFalseQuizStates[0]>) => {
    setTrueFalseQuizStates(prev => ({
      ...prev,
      [pageIndex]: {
        ...getTrueFalseQuizState(pageIndex),
        ...updates
      }
    }));
  };

  const renderPage = () => {
    if (!currentPage) return null;

    const isVideoQuizCompleted = currentPage.type === 'videoQuiz' ? (videoQuizCompletionStates[currentPageIndex] || false) : true;
    
    // For slideshow pages, use the canProceed state, otherwise use default logic
    const canGoNext = (currentPage.type === 'slideshow' || currentPage.type === 'pronunciationSlides')
      ? canProceed && (currentPageIndex < pages.length - 1)
      : (currentPageIndex < pages.length - 1) && isVideoQuizCompleted;
    
    const commonProps = {
      onNext: handleNext,
      onPrevious: handlePrevious,
      isFirstPage: currentPageIndex === 0,
      isLastPage: currentPageIndex === pages.length - 1 && !isOnLastPageWithMoreItems(),
      pageNumber: currentPageIndex + 1,
      totalPages: pages.length,
      onComplete: handleComplete,
      hasCompletedLesson: hasCompletedLesson,
      isAuthenticated: isAuthenticated,
      pageIndex: currentPageIndex,
      audioContext: audioContext,
      lessonData: lesson,
      selectedDifficulty: selectedDifficulty,
      currentPageIndex: currentPageIndex,
      aiFeedbackQuestionIndex: aiFeedbackQuestionIndex,
      trueFalseWithTextQuestionIndex: trueFalseWithTextQuestionIndex,
      listeningStates: listeningStates,
      multipleChoiceWithTextStates: multipleChoiceWithTextStates,
      returnPath: returnPath,
      lessonId,
      onAudioGenerated: handleAudioGenerated,
      onImageGenerated: handleImageGenerated,
      trueFalseQuizStates: trueFalseQuizStates,
      canGoNext: canGoNext,
      canProceed: canProceed, // Add canProceed to commonProps for LessonNavigation
      pnlConsultationLessonId: pnlConsultationLessonId,
      hideSpecialistHelp: !!pnlConsultationLessonId,
    };

    // Debug logging for LessonNavigation props
    console.log('LessonRunner - commonProps for LessonNavigation:', {
      returnPath,
      currentPageIndex,
      isFirstPage: currentPageIndex === 0,
      selectedDifficulty,
      canProceed,
      pageType: currentPage.type,
      pnlConsultationLessonId: pnlConsultationLessonId
    });

    switch (currentPage.type) {
      case "content":
        return <ContentPage key={`content-${currentPageIndex}`} {...commonProps} {...currentPage} />;
      case "article":
        return <ArticlePage key={`article-${currentPageIndex}`} {...commonProps} {...currentPage} text={currentPage.content?.text || currentPage.text} videoUrl={currentPage.videoUrl || currentPage.content?.videoUrl} slideMode={currentPage.content?.slideMode || currentPage.slideMode || false} />;
      case "ttsArticle":
        return <TTSArticlePage key={`tts-${currentPageIndex}`} {...commonProps} {...currentPage} videoUrl={currentPage.videoUrl || currentPage.content?.videoUrl} />;
      case "video":
        return <VideoPage key={`video-${currentPageIndex}`} {...commonProps} {...currentPage} />;
      case "videoQuiz":
        return (
          <div className="flex flex-col h-full">
            <VideoQuizPage 
              {...commonProps} 
              pageData={currentPage} 
              lessonId={lessonId}
              canGoPrevious={currentPageIndex > 0}
              lessonData={lesson}
              selectedDifficulty={selectedDifficulty}
              currentPageIndex={currentPageIndex}
              returnPath={returnPath}
              savedState={videoQuizStates[currentPageIndex]}
              onQuizCompletionChange={(completed) => {
                setVideoQuizCompletionStates(prev => ({
                  ...prev,
                  [currentPageIndex]: completed
                }));
              }}
            />
            <LessonNavigation {...commonProps} hideSpecialistHelp={true} />
          </div>
        );
      case "trueFalse":
        const quizState = getTrueFalseQuizState(currentPageIndex);
        
        console.log('Full currentPage data:', currentPage);
        console.log('currentPage.questions:', currentPage.questions);
        console.log('currentPage.content:', currentPage.content);
        
        // Transform the single question data structure to match TrueFalseQuiz expectations
        let trueFalseQuestions = [];
        
        if (currentPage.questions && Array.isArray(currentPage.questions) && currentPage.questions.length > 0) {
          // New format with questions array
          trueFalseQuestions = currentPage.questions;
          console.log('Using questions array format');
        } else if (currentPage.statement || currentPage.content?.statement || currentPage.title) {
          // Current format with statement property or title as fallback
          const statement = currentPage.statement || currentPage.content?.statement || currentPage.title;
          const isTrue = currentPage.isTrue ?? currentPage.content?.isTrue ?? true;
          const explanation = currentPage.explanation || currentPage.content?.explanation;
          
          trueFalseQuestions = [{
            text: statement,
            correctAnswer: isTrue,
            explanation: explanation
          }];
          console.log('Using statement/title format with data:', {statement, isTrue, explanation});
        } else if (currentPage.content && currentPage.content.question) {
          // Legacy format with single question in content
          trueFalseQuestions = [{
            text: currentPage.content.question,
            correctAnswer: currentPage.content.isTrue,
            explanation: currentPage.content.explanation
          }];
          console.log('Using legacy content format');
        } else {
          console.log('No valid data format found for trueFalse question');
        }
        
        console.log('TrueFalse questions after transformation:', trueFalseQuestions);
        
        return (
          <div className="flex flex-col h-full">
            <TrueFalseQuiz
              questions={trueFalseQuestions}
              currentQuestionIndex={quizState.currentQuestionIndex}
              onQuestionIndexChange={(index) => updateTrueFalseQuizState(currentPageIndex, { currentQuestionIndex: index })}
              userAnswers={quizState.userAnswers}
              onUserAnswersChange={(answers) => updateTrueFalseQuizState(currentPageIndex, { userAnswers: answers })}
              showResults={quizState.showResults}
              onShowResultsChange={(results) => updateTrueFalseQuizState(currentPageIndex, { showResults: results })}
            />
            <LessonNavigation {...commonProps} />
          </div>
        );
      case "aiFeedback":
        // AIFeedbackPage renders its own LessonNavigation internally
        return (
          <AIFeedbackPage 
            key={`ai-feedback-${lessonId || 'lesson'}-${currentPageIndex}-${aiFeedbackQuestionIndex}`}
            isEmbedded
            questions={currentPage.content?.questions || currentPage.questions}
            topic={currentPage.content?.topic || currentPage.topic}
            instructions={currentPage.content?.instructions || currentPage.instructions}
            questionIndex={aiFeedbackQuestionIndex}
            setQuestionIndex={setAiFeedbackQuestionIndex}
            onComplete={handleNext}
            lessonData={lesson}
            selectedDifficulty={selectedDifficulty}
            lessonId={lessonId}
            currentPageIndex={currentPageIndex}
            onPreviousPage={currentPageIndex > 0 ? handlePrevious : undefined}
            pnlConsultationLessonId={pnlConsultationLessonId}
            isLastLessonPage={currentPageIndex === pages.length - 1}
          />
        );
      case "aiFeedbackWithParameters":
        return (
          <AIFeedbackWithParametersPage 
            key={`ai-feedback-parameters-${lessonId || 'lesson'}-${currentPageIndex}-${aiFeedbackQuestionIndex}`}
            isEmbedded
            questions={currentPage.content?.questions || currentPage.questions}
            evaluationParameters={currentPage.content?.evaluationParameters || currentPage.evaluationParameters}
            topic={currentPage.content?.topic || currentPage.topic}
            lessonId={lessonId}
            onBack={handleBackToLessons}
            questionIndex={aiFeedbackQuestionIndex}
            setQuestionIndex={setAiFeedbackQuestionIndex}
            onFinish={handleNext}
            difficulty={selectedDifficulty}
            isLastLessonPage={currentPageIndex === pages.length - 1}
          />
        );
      case "aiFeedbackWithParametersEssay":
        return (
          <AIFeedbackWithParametersEssayPage 
            key={`ai-feedback-essay-${lessonId || 'lesson'}-${currentPageIndex}-${aiFeedbackQuestionIndex}`}
            isEmbedded
            questions={currentPage.content?.questions || currentPage.questions}
            evaluationParameters={currentPage.content?.evaluationParameters || currentPage.evaluationParameters}
            topic={currentPage.content?.topic || currentPage.topic}
            lessonId={lessonId}
            onBack={handleBackToLessons}
            questionIndex={aiFeedbackQuestionIndex}
            setQuestionIndex={setAiFeedbackQuestionIndex}
            onFinish={handleNext}
            difficulty={selectedDifficulty}
            isLastLessonPage={currentPageIndex === pages.length - 1}
          />
        );
      case "listening":
        console.log('LessonRunner - Rendering ListeningPage with enhanced props:', { 
          lessonId, 
          selectedDifficulty,
          questionsCount: (currentPage.content?.questions || currentPage.questions || []).length || 0
        });
        return (
          <div className="flex flex-col h-full">
            <ListeningPage 
              questions={currentPage.content?.questions || currentPage.questions}
              lessonId={lessonId}
              selectedDifficulty={selectedDifficulty}
              learningLanguage={undefined}
              nextSignal={listeningNextSignals[currentPageIndex] || 0}
              onStateChange={(st) => setListeningStates(prev => ({ ...prev, [currentPageIndex]: st }))}
              onComplete={moveToNextPageOrComplete}
              presetAudioUrl={currentPage.content?.audioUrl || currentPage.audioUrl}
            />
            <LessonNavigation {...commonProps} />
          </div>
        );
      case "listeningVideo":
        console.log('LessonRunner - Rendering ListeningVideoPage:', { 
          lessonId, 
          videoUrl: currentPage.content?.videoUrl || currentPage.videoUrl,
          questionsCount: (currentPage.content?.questions || currentPage.questions || []).length || 0
        });
        return (
          <div className="flex flex-col h-full">
            <ListeningVideoPage 
              videoUrl={currentPage.content?.videoUrl || currentPage.videoUrl}
              questions={currentPage.content?.questions || currentPage.questions}
              lessonId={lessonId}
              selectedDifficulty={selectedDifficulty}
              learningLanguage={undefined}
              nextSignal={listeningNextSignals[currentPageIndex] || 0}
              onStateChange={(st) => setListeningStates(prev => ({ ...prev, [currentPageIndex]: st }))}
              onComplete={moveToNextPageOrComplete}
            />
            <LessonNavigation {...commonProps} />
          </div>
        );
      case "translation":
        return (
          <div className="flex flex-col h-full">
            <TranslationPage questions={currentPage.questions} />
            <LessonNavigation {...commonProps} />
          </div>
        );
      case "multipleChoice":
        return (
          <div className="flex flex-col h-full">
            <MultipleChoicePage
              question={currentPage.content?.question || currentPage.question || ''}
              imageUrl={currentPage.content?.imageUrl || currentPage.imageUrl}
              options={currentPage.content?.options || currentPage.options || []}
              correctAnswer={currentPage.content?.correctAnswer ?? currentPage.correctAnswer ?? 0}
              explanation={currentPage.content?.explanation || currentPage.explanation}
              pageIndex={currentPageIndex}
              questionIndex={0}
            />
            <LessonNavigation {...commonProps} />
          </div>
        );
      case "exactAnswer":
        return (
          <div className="flex flex-col h-full">
            <ExactAnswerPage
              question={currentPage.content?.question || ''}
              imageUrl={currentPage.content?.imageUrl}
              correctAnswers={currentPage.content?.correctAnswers || []}
              explanation={currentPage.content?.explanation}
            />
            <LessonNavigation {...commonProps} />
          </div>
        );
      case "recommendedVocabulary":
        return (
          <div className="flex flex-col h-full">
            <RecommendedVocabularyPage 
              key={`recommended-vocabulary-${lessonId || 'lesson'}-${currentPageIndex}-${aiFeedbackQuestionIndex}`}
              questions={currentPage.content?.questions || []}
              topic={currentPage.content?.topic}
              recommendedWords={currentPage.content?.recommendedWords || []}
              questionIndex={aiFeedbackQuestionIndex}
              setQuestionIndex={setAiFeedbackQuestionIndex}
              onComplete={handleNext}
              isEmbedded={true}
              lessonData={lesson}
              selectedDifficulty={selectedDifficulty}
              lessonId={lessonId}
              currentPageIndex={currentPageIndex}
            />
            <LessonNavigation {...commonProps} />
          </div>
        );
      case "trueFalseWithText": {
        const trueFalseQuestions = currentPage.content?.questions || currentPage.questions || [];
        return (
          <div className="flex flex-col h-full">
            <TrueFalseWithTextPage
              title={currentPage.content?.title || currentPage.title}
              text={currentPage.content?.text || currentPage.text || ''}
              questions={trueFalseQuestions}
              questionIndex={trueFalseWithTextQuestionIndex}
              setQuestionIndex={setTrueFalseWithTextQuestionIndex}
              onComplete={handleNext}
              isEmbedded={true}
            />
            <LessonNavigation {...commonProps} />
          </div>
        );
      }
      case "audioMultipleChoice":
        return (
          <div className="flex flex-col h-full">
            <AudioMultipleChoicePage
              question={currentPage.content?.question || ''}
              audioUrl={currentPage.content?.audioUrl || ''}
              options={currentPage.content?.options || []}
              correctAnswer={currentPage.content?.correctAnswer || 0}
              explanation={currentPage.content?.explanation}
              pageIndex={currentPageIndex}
              questionIndex={0}
            />
            <LessonNavigation {...commonProps} />
          </div>
        );
      case "essay":
        return (
          <div className="flex flex-col h-full">
            <EssayPage
              topic={currentPage.content?.topic || ''}
              instructions={currentPage.content?.instructions}
              onComplete={handleNext}
              isEmbedded={true}
              lessonData={lesson}
              selectedDifficulty={selectedDifficulty}
              lessonId={lessonId}
              currentPageIndex={currentPageIndex}
            />
            <LessonNavigation {...commonProps} />
          </div>
        );
      case "multipleChoiceWithText": {
        const multipleChoiceState = multipleChoiceWithTextStates[currentPageIndex];
        const multipleChoiceQuestions = currentPage.content?.questions || currentPage.questions || [];
        return (
          <div className="flex flex-col h-full">
            <MultipleChoiceWithTextPage
              title={currentPage.content?.title || currentPage.title}
              text={currentPage.content?.text || currentPage.text || ''}
              questions={multipleChoiceQuestions}
              onComplete={handleNext}
              isEmbedded={true}
              initialState={multipleChoiceState}
              onStateChange={handleMCWTStateChange}
              nextSignal={mcwtNextSignals[currentPageIndex] || 0}
            />
            <LessonNavigation {...commonProps} />
          </div>
        );
      }
      case "toeflScore":
        return (
          <div className="flex flex-col h-full">
            <TOEFLScorePage totalQuestions={currentPage.totalQuestions || 0} />
            <LessonNavigation {...commonProps} />
          </div>
        );
      case "suggestedWords":
        return (
          <div className="flex flex-col h-full">
            <SuggestedWordsPage
              title={currentPage.title}
              description={currentPage.description}
              suggestedWords={currentPage.suggestedWords || currentPage.content?.suggestedWords || []}
              {...commonProps}
            />
          </div>
        );
      case "slideshow":
        // Use wrapped handler for slideshow that advances slides or pages
        const slideshowProps = {
          ...commonProps,
          onNext: () => {
            const wrappedHandler = (window as any).__slideshowNextHandler;
            if (wrappedHandler) {
              wrappedHandler();
            } else {
              handleNext();
            }
          }
        };
        return (
          <div className="flex flex-col h-full">
            <SlideshowPage
              pageData={{
                type: "slideshow",
                title: currentPage.title,
                slideshowId: currentPage.content?.slideshowId || currentPage.slideshowId
              }}
              onComplete={handleNext}
              canProceed={canProceed}
              onCanProceedChange={setCanProceed}
            />
            <LessonNavigation {...slideshowProps} />
          </div>
        );
      case "pdf":
        return (
          <div className="flex flex-col h-full">
            <PDFPage
              pdfUrl={currentPage.content?.pdfUrl || currentPage.pdfUrl}
              title={currentPage.content?.title || currentPage.title}
            />
            <LessonNavigation {...commonProps} />
          </div>
        );
      case "pnlSlides":
        console.log('📊 Rendering PNLSlidesPage with data:', currentPage.content);
        return (
          <div className="flex flex-col h-full">
            <div className="pb-16 flex-1 overflow-y-auto">
              <PNLSlidesPage
                ref={pnlSlidesRef}
                pageData={{
                  type: "pnlSlides",
                  title: currentPage.title,
                  lessonId: currentPage.content?.lessonId || currentPage.lessonId,
                  category: currentPage.content?.category || currentPage.category
                }}
                canProceed={canProceed}
                onCanProceedChange={setCanProceed}
              />
            </div>
            <LessonNavigation {...commonProps} position="bottom" />
          </div>
        );
      case "pronunciationSlides":
        console.log('🎤 Rendering PronunciationSlidesPage with data:', currentPage.content);
        return (
          <div className="flex flex-col h-full">
            <PronunciationSlidesPage
              ref={pronunciationSlidesRef}
              pageData={{
                type: "pronunciationSlides",
                title: currentPage.title,
                lessonId: currentPage.content?.lessonId || currentPage.lessonId,
                category: currentPage.content?.category || currentPage.category
              }}
              canProceed={canProceed}
              onCanProceedChange={setCanProceed}
            />
            <LessonNavigation {...commonProps} />
          </div>
        );
      case "customPronunciationSlides":
        console.log('🎤 Rendering CustomPronunciationSlidesPage with data:', currentPage.content);
        return (
          <div className="flex flex-col h-full">
            <CustomPronunciationSlidesPage
              ref={customPronunciationSlidesRef}
              pageData={{
                type: "customPronunciationSlides",
                title: currentPage.title,
                slides: currentPage.content?.slides || []
              }}
              canProceed={canProceed}
              onCanProceedChange={setCanProceed}
            />
            <LessonNavigation {...commonProps} />
          </div>
        );
      case "audioSlides":
        console.log('🔊 Rendering AudioSlidesPage with data:', currentPage.content);
        return (
          <div className="flex flex-col h-full">
            <AudioSlidesPage
              ref={audioSlidesRef}
              pageData={{
                type: "audioSlides",
                title: currentPage.title,
                slides: currentPage.content?.slides || (currentPage as any).slides || []
              }}
              canProceed={canProceed}
              onCanProceedChange={setCanProceed}
            />
            <LessonNavigation {...commonProps} />
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Tipo de página não suportado: {currentPage.type}
            </h1>
            <Button onClick={handleBackToLessons}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para lições
            </Button>
          </div>
        );
    }
  };

  // Show credits if enabled and requested
  if (showCredits && lessonCredits?.enabled) {
    return (
      <CreditsPage
        narrator={lessonCredits?.narrator || ''}
        onContinue={handleCreditsComplete}
      />
    );
  }

  return (
    <div className="relative">
      {/* Fixed overlay for top controls - ALWAYS stays fixed to viewport */}
      <div className="fixed top-0 left-0 right-0 w-full h-full pointer-events-none z-[10000]">
        {/* Top-left: Home/Back-to-lessons button */}
        <div className="absolute top-4 left-4 pointer-events-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              // Detect Curso Completo lessons by ID prefix as a fallback when state was lost
              const cursoPrefixes = ['Iniciante_', 'Intermediário_', 'Intermediario_', 'Avançado_', 'Avancado_', 'Business_'];
              const isCursoLessonById = !!lessonId && cursoPrefixes.some(p => lessonId.startsWith(p));
              const derivedCategory =
                cursoCompletoCategory ||
                (isCursoLessonById ? (lessonId!.split('_')[0]) : undefined);
              if (returnPath === "/curso-completo" || cursoCompletoCategory || isCursoLessonById) {
                navigate("/", { state: { showCursoCompleto: true, cursoCompletoCategory: derivedCategory } });
              } else if (returnPath === "/complete-lessons") {
                navigate("/complete-lessons", { state: { selectedDifficulty } });
              } else if (returnPath && returnPath !== "/curso-completo") {
                navigate(returnPath, { state: { selectedDifficulty } });
              } else {
                navigate("/");
              }
            }}
            className="bg-white shadow-xl h-11 w-11 rounded-full border-2 border-gray-300 hover:bg-white hover:scale-105 transition-all"
            title="Voltar"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-6 w-6 text-gray-800" />

          </Button>
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
          {/* Edit Page button - only show when editor mode is active */}
          {lessonId && editorModeActive && !isEditorMode && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsEditorMode(true)}
              className="bg-white shadow-lg h-8 w-8 border border-gray-200 hover:bg-gray-50"
              title="Edit this page"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
           {/* Completion indicator */}
           {hasCompletedLesson && (
             <div className="bg-green-100 text-green-800 px-3 py-2 rounded-full flex items-center gap-2 shadow-lg">
               <CheckCircle className="h-4 w-4" />
               <span className="text-sm font-medium">Concluída</span>
             </div>
           )}
        </div>
      </div>


      {/* Main lesson content */}
      <div className="h-screen bg-gray-50" {...(isTOEFLLesson ? { 'data-no-word-click': '' } : { 'data-word-clickable': '' })}>
        {renderPage()}
      </div>
      
      {/* Inline Page Editor */}
      {isEditorMode && lessonId && currentPage && (
        <InlinePageEditor
          lessonId={lessonId}
          currentPage={currentPage}
          pageIndex={currentPageIndex}
          onClose={() => setIsEditorMode(false)}
          onSave={() => {
            // Refetch lesson data to get updated content with correct query key
            queryClient.invalidateQueries({ queryKey: ['lesson_data', lessonId] });
            queryClient.invalidateQueries({ queryKey: ['lesson_data'] });
            // Force refetch
            refetch();
            setIsEditorMode(false);
          }}
        />
      )}

      {/* Teacher Mode - Save Progress Modal */}
      <SaveProgressModal
        isOpen={isSaveProgressOpen}
        onClose={() => setIsSaveProgressOpen(false)}
        lessonId={lessonId || ''}
        lessonTitle={extractLessonTitle(initialLesson, lessonId)}
        currentPage={currentPageIndex + 1}
        totalPages={lesson.length}
        difficulty={selectedDifficulty || 'Medium'}
      />

      {/* Flashcards Acquired Modal */}
      <FlashcardsAcquiredModal
        isOpen={showFlashcardsModal}
        onClose={handleFlashcardsModalClose}
        flashcards={lessonFlashcards}
      />
    </div>
  );
};

export default LessonRunner;
