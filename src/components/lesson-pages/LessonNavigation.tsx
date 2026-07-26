
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle, HelpCircle, Home, Speech, Loader2, BookOpen } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import TextSelectionMode from "../TextSelectionMode";
import TextHighlightMode from "./TextHighlightMode";
import SpecialistQuestionModal from "../SpecialistQuestionModal";
import WordDefinitionModal from "../WordDefinitionModal";
import { useLessonAudio } from "@/hooks/use-lesson-audio";
import { useLanguage } from "@/contexts/LanguageContext";
import { validateContentPath } from "@/utils/contentNavigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { buildLessonPageContext } from "@/types/lessonContext";
import PNLConsultationPopup from "./PNLConsultationPopup";

interface LessonNavigationProps {
  onNext?: () => void;
  onPrevious?: () => void;
  isFirstPage: boolean;
  isLastPage: boolean;
  pageNumber: number;
  totalPages: number;
  onComplete?: () => void;
  hasCompletedLesson: boolean;
  isAuthenticated: boolean;
  lessonData?: any;
  selectedDifficulty?: string;
  currentPageIndex?: number;
  aiFeedbackQuestionIndex?: number;
  trueFalseWithTextQuestionIndex?: number;
  listeningStates?: {[pageIndex: number]: { currentQuestionIndex: number; totalQuestions: number; isActivityCompleted: boolean; }};
  multipleChoiceWithTextStates?: any;
  returnPath?: string;
  trueFalseQuizStates?: any;
  hideSpecialistHelp?: boolean;
  lessonId?: string;
  canProceed?: boolean;
  onHighlightModeChange?: (isActive: boolean) => void;
  customAskSpecialist?: () => void;
  pnlConsultationLessonId?: string;
  position?: 'top' | 'bottom';
  onHomeClick?: () => void;
}

const LessonNavigation: React.FC<LessonNavigationProps> = ({
  onNext,
  onPrevious,
  isFirstPage,
  isLastPage,
  pageNumber,
  totalPages,
  onComplete,
  hasCompletedLesson,
  isAuthenticated,
  lessonData,
  selectedDifficulty,
  currentPageIndex,
  aiFeedbackQuestionIndex,
  trueFalseWithTextQuestionIndex,
  listeningStates,
  multipleChoiceWithTextStates,
  returnPath,
  trueFalseQuizStates,
  hideSpecialistHelp = false,
  lessonId,
  canProceed = true,
  onHighlightModeChange,
  customAskSpecialist,
  pnlConsultationLessonId,
  position = 'bottom',
  onHomeClick,
}) => {
  const navigate = useNavigate();
  const [isTextSelectionActive, setIsTextSelectionActive] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [isPnlConsultationOpen, setIsPnlConsultationOpen] = useState(false);
  const { stopAudio } = useLessonAudio();
  const { tLesson, t } = useLanguage();
  const [showHelpHint, setShowHelpHint] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const location = useLocation();
  const cursoCompletoCategory = (location.state as any)?.cursoCompletoCategory;

  // Listen for audio loading state changes from TextHighlightMode
  useEffect(() => {
    const handleLoadingChange = (event: CustomEvent) => {
      setIsAudioLoading(event.detail?.loading ?? false);
    };
    
    window.addEventListener('highlight:loading', handleLoadingChange as EventListener);
    return () => window.removeEventListener('highlight:loading', handleLoadingChange as EventListener);
  }, []);

  useEffect(() => {
    setIsTextSelectionActive(false);
  }, [currentPageIndex]);

  useEffect(() => {
    if (isFirstPage && !hideSpecialistHelp) {
      setShowHelpHint(true);
      const timer = setTimeout(() => {
        setShowHelpHint(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isFirstPage, hideSpecialistHelp]);

  const handleAssistantClick = () => {
    console.log('🔍 Help button clicked - Debug info:', {
      isTextSelectionActive,
      currentPageIndex,
      lessonData,
      currentPage: lessonData?.[currentPageIndex],
      pageType: lessonData?.[currentPageIndex]?.type,
      hasText: lessonData?.[currentPageIndex]?.text,
      hasContentText: lessonData?.[currentPageIndex]?.content?.text,
      hasQuestion: lessonData?.[currentPageIndex]?.question,
      hasContentQuestion: lessonData?.[currentPageIndex]?.content?.question,
    });
    
    if (isTextSelectionActive) {
      setIsTextSelectionActive(false);
      return;
    }
    stopAudio();
    const currentPage = lessonData?.[currentPageIndex];
    
    const hasTextContent = currentPage?.text ||
                           currentPage?.content?.text ||
                           currentPage?.question ||
                           currentPage?.content?.question ||
                           currentPage?.questions ||
                           currentPage?.type === "article" || 
                           currentPage?.type === "ttsArticle" ||
                           currentPage?.type === "multipleChoice" ||
                           currentPage?.type === "exactAnswer" ||
                           currentPage?.type === "audioMultipleChoice" ||
                           currentPage?.type === "trueFalse" ||
                           currentPage?.type === "trueFalseWithText" ||
                           currentPage?.type === "multipleChoiceWithText";
    
    console.log('📋 Has text content:', hasTextContent);
    
    if (hasTextContent) {
      console.log('✅ Opening question modal');
      // Show modal to ask user what they want to do
      setIsQuestionModalOpen(true);
    } else {
      console.log('❌ No text content - going to specialist');
      navigateToSpecialist();
    }
  };

  const handleWordQuestionSelected = () => {
    setIsQuestionModalOpen(false);
    setIsTextSelectionActive(true);
  };

  const handleOtherQuestionSelected = () => {
    setIsQuestionModalOpen(false);
    
    // If a custom specialist handler is provided (e.g., for perguntas mode), use it
    if (customAskSpecialist) {
      customAskSpecialist();
      return;
    }
    
    // Build lesson context for the current page
    const currentPage = lessonData?.[currentPageIndex || 0];
    
    // Determine the focused question index based on page type
    let focusedQuestionIdx: number | undefined;
    
    if (currentPage) {
      const pageType = currentPage.type;
      
      switch (pageType) {
        case 'aiFeedback':
        case 'aiFeedbackWithParameters':
        case 'aiFeedbackWithParametersEssay':
        case 'recommendedVocabulary':
          focusedQuestionIdx = aiFeedbackQuestionIndex;
          console.log('📍 AI Feedback page - question index:', focusedQuestionIdx);
          break;
          
        case 'trueFalseWithText':
        case 'multipleChoiceWithText':
          if (pageType === 'trueFalseWithText') {
            // Default to 0 if not set
            focusedQuestionIdx = trueFalseWithTextQuestionIndex ?? 0;
            console.log('📍 TrueFalseWithText page - question index:', focusedQuestionIdx);
          } else {
            // Default to 0 if state not initialized
            focusedQuestionIdx = multipleChoiceWithTextStates?.[currentPageIndex || 0]?.currentQuestionIndex ?? 0;
            console.log('📍 MultipleChoiceWithText page - question index:', focusedQuestionIdx);
          }
          break;
          
        case 'listening':
        case 'listeningVideo':
          // Default to 0 if state not initialized
          focusedQuestionIdx = listeningStates?.[currentPageIndex || 0]?.currentQuestionIndex ?? 0;
          console.log('📍 Listening page - question index:', focusedQuestionIdx);
          break;
          
        case 'trueFalse':
          // Default to 0 if state not initialized yet
          focusedQuestionIdx = trueFalseQuizStates?.[currentPageIndex || 0]?.currentQuestionIndex ?? 0;
          console.log('📍 TrueFalse page - question index:', focusedQuestionIdx);
          break;
          
        default:
          focusedQuestionIdx = undefined;
          console.log('📍 Page type has no question index:', pageType);
          break;
      }
    }
    
    const lessonContext = currentPage ? buildLessonPageContext(
      lessonData || [],
      currentPage,
      currentPageIndex || 0,
      lessonId || routeLessonId,
      lessonData?.title,
      focusedQuestionIdx
    ) : undefined;
    
    console.log('🎯 Final lesson context:', lessonContext);
    
    navigateToSpecialist(undefined, lessonContext);
  };

  const navigateToSpecialist = (selectedWord?: string, lessonContext?: any) => {
    stopAudio();
    // Use the proper lessonId from props, route, with fallbacks and normalization
    const finalLessonIdCandidate: any = lessonId || routeLessonId || lessonData?.id || lessonData?.lessonId;
    const finalLessonId: string | undefined = typeof finalLessonIdCandidate === 'string'
      ? finalLessonIdCandidate
      : finalLessonIdCandidate?.value || finalLessonIdCandidate?.id || undefined;
    
    // CRITICAL DEBUG: Log all values being passed to specialist help
    console.log('🚀🚀🚀 NAVIGATING TO SPECIALIST - VALUES:', {
      currentPageIndex,
      'currentPageIndex ?? 0': currentPageIndex ?? 0,
      aiFeedbackQuestionIndex,
      trueFalseWithTextQuestionIndex,
      finalLessonId,
      lessonId,
      routeLessonId
    });
    
    const navigationState: any = {
      returnToLesson: true,
      lessonData: {
        lesson: lessonData,
        selectedDifficulty: selectedDifficulty,
        lessonId: finalLessonId, // Use the resolved and normalized lesson ID
        currentPageIndex: currentPageIndex ?? 0, // Ensure this is always a number
        aiFeedbackQuestionIndex: aiFeedbackQuestionIndex ?? 0, // Ensure this is always a number
        trueFalseWithTextQuestionIndex: trueFalseWithTextQuestionIndex ?? 0, // Ensure this is always a number
        listeningStates: listeningStates,
        returnPath: returnPath,
        trueFalseQuizStates: trueFalseQuizStates,
        multipleChoiceWithTextStates: multipleChoiceWithTextStates,
      }
    };
    if (selectedWord) {
      navigationState.initialMessage = `"${selectedWord}"\n\nPor favor me explique o significado desta palavra, com exemplos de uso.`;
    }
    if (lessonContext) {
      navigationState.lessonContext = lessonContext;
    }
    console.log('LessonNavigation - navigating to specialist with state:', navigationState);
    navigate("/specialist-help", { state: navigationState });
  };

  const handleWordSelectionConfirm = (selectedWord: string) => {
    setIsTextSelectionActive(false);
    setSelectedWord(selectedWord);
    setIsWordModalOpen(true);
  };

  const handleTextSelectionCancel = () => {
    setIsTextSelectionActive(false);
  };

  const handleAudioForSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || '';
    
    if (!text) {
      toast({
        title: "Selecione uma parte do texto e clique novamente para ouvir",
        variant: "default"
      });
      return;
    }
    
    // Trigger audio generation
    window.dispatchEvent(new CustomEvent('highlight:play', { detail: { text } }));
  };

  const handleBackToContent = () => {
    console.log('LessonNavigation - handleBackToContent called with returnPath:', returnPath);
    stopAudio();
    
    if (returnPath === '/') {
      // Returning to content mode on Index page
      navigate('/', { 
        state: { returnToContentMode: true },
        replace: true 
      });
    } else if (returnPath && validateContentPath(returnPath)) {
      // Returning to specific content path
      navigate(returnPath, { replace: true });
    } else {
      // Fallback to Index page in content mode
      navigate('/', { 
        state: { returnToContentMode: true },
        replace: true 
      });
    }
  };

  const handleBackToLessons = () => {
    console.log('LessonNavigation - handleBackToLessons called');
    stopAudio();
    navigate("/complete-lessons", { 
      state: { selectedDifficulty },
      replace: true
    });
  };

  const handleBackToTOEFL = () => {
    console.log('LessonNavigation - handleBackToTOEFL called');
    stopAudio();
    navigate("/toefl", { replace: true });
  };

  const isContentContext = returnPath === '/' || (returnPath && returnPath.startsWith('/content/'));
  const isTOEFLContext = returnPath && returnPath.startsWith('/toefl/');
  
  // Derive effective lessonId from props or route params
  const { lessonId: routeLessonId } = useParams<{ lessonId: string }>();
  const effectiveLessonId = lessonId || routeLessonId || '';
  
  let backButtonText, backButtonHandler;
  
  // Check if returnPath is /curso-completo (Curso Completo menu)
  // Presence of cursoCompletoCategory in state also implies Curso Completo context,
  // even if returnPath was lost or never set — prevents falling back to /complete-lessons.
  const isCursoCompletoContext = returnPath === '/curso-completo' || !!cursoCompletoCategory;
  // Check if returnPath is /lessons (PNL menu)
  // Curso Completo context takes priority to avoid mis-routing review lessons to PNL.
  const isPNLContext = !isCursoCompletoContext && returnPath === '/lessons';
  
  if (isPNLContext) {
    backButtonText = 'Voltar às Lições';
    backButtonHandler = () => {
      stopAudio();
      navigate('/lessons', { replace: true });
    };
  } else if (isCursoCompletoContext) {
    backButtonText = 'Voltar ao Curso';
    backButtonHandler = () => {
      stopAudio();
      navigate('/', { 
        state: { currentMode: 'curso-completo', cursoCompletoCategory },
        replace: true 
      });
    };
  } else if (isTOEFLContext) {
    backButtonText = 'Back to TOEFL';
    backButtonHandler = handleBackToTOEFL;
  } else if (isContentContext) {
    backButtonText = 'Voltar ao Conteúdo';
    backButtonHandler = handleBackToContent;
  } else {
    backButtonText = tLesson('back');
    backButtonHandler = handleBackToLessons;
  }

  // Allow custom onHomeClick to override the home button behavior
  if (onHomeClick) {
    backButtonHandler = () => {
      stopAudio();
      onHomeClick();
    };
  }

  // Debug logging
  console.log('LessonNavigation - Navigation context:', {
    returnPath,
    lessonId,
    isCursoCompletoContext,
    isContentContext,
    isTOEFLContext,
    backButtonText,
  });

  return (
    <>
      <SpecialistQuestionModal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        onWordQuestion={handleWordQuestionSelected}
        onOtherQuestion={handleOtherQuestionSelected}
      />
      <WordDefinitionModal
        word={selectedWord}
        isOpen={isWordModalOpen}
        onClose={() => {
          setIsWordModalOpen(false);
          setSelectedWord(null);
        }}
      />
      <TextSelectionMode
        isActive={isTextSelectionActive}
        onCancel={handleTextSelectionCancel}
        onConfirm={handleWordSelectionConfirm}
      />
      <TextHighlightMode />
      {pnlConsultationLessonId && (
        <PNLConsultationPopup
          isOpen={isPnlConsultationOpen}
          onClose={() => setIsPnlConsultationOpen(false)}
          lessonId={pnlConsultationLessonId}
        />
      )}
      
      <div
        data-no-word-click
        className={`fixed left-0 right-0 bg-white p-3 z-20 ${
          position === 'top'
            ? 'top-0 border-b border-gray-200'
            : 'bottom-0 border-t border-gray-200'
        }`}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {isFirstPage ? (
            <Button
              variant="outline"
              onClick={backButtonHandler}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {backButtonText}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={onPrevious}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {tLesson('previous')}
            </Button>
          )}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={backButtonHandler}
              className="flex items-center justify-center text-gray-600 hover:text-gray-700 hover:bg-gray-50 p-2"
            >
              <Home className="h-5 w-5" />
            </Button>
            {pnlConsultationLessonId && (
              <Button
                variant="ghost"
                onClick={() => setIsPnlConsultationOpen(true)}
                title="Consulta PNL"
                className="flex items-center justify-center p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                <BookOpen className="h-5 w-5" />
              </Button>
            )}
            {!hideSpecialistHelp && (
              <Button
                
                variant="ghost"
                onClick={handleAssistantClick}
                title="Ask a specialist"
                className={`flex items-center justify-center p-2 ${
                  isTextSelectionActive
                    ? "text-blue-700 bg-blue-100 hover:bg-blue-200"
                    : showHelpHint
                      ? "text-blue-700 bg-blue-100"
                      : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                }`}
              >
                <img src="/lovable-uploads/8fb056c5-eff7-4a39-a6a5-a715bf7d5bbe.png" alt="Pergunte ao professor" className="h-7 w-7" />
              </Button>
            )}
            {!isMobile && (
              <Button
                variant="ghost"
                onClick={handleAudioForSelection}
                disabled={isAudioLoading}
                title="Play selected text"
                className="flex items-center justify-center p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
              >
                {isAudioLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Speech className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
          {isLastPage ? (
            <Button
              onClick={onComplete}
              disabled={!isAuthenticated || !onComplete}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4" />
              {hasCompletedLesson ? tLesson('completed') : tLesson('complete')}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!canProceed}
              className="flex items-center gap-2"
            >
              {tLesson('next')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default LessonNavigation;
