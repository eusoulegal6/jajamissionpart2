
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader, Mic, SkipForward, Play, Pause, HelpCircle, Languages, Volume2, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { useChatApi } from "@/hooks/use-chat-api";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { RecordingIndicator, StopRecordingButton, AudioPreview } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTeacherMode } from "@/contexts/TeacherModeContext";
import DetailedCorrectionModal from "./DetailedCorrectionModal";
import { useDetailedCorrection } from "@/hooks/useDetailedCorrection";
import { supabase } from "@/integrations/supabase/client";
import LessonNavigation from "@/components/lesson-pages/LessonNavigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCachedTtsUrl } from "@/lib/ttsCached";

type MispronouncedWord = {
  word: string;
  score: number;
  issue: string;
  tip: string;
};

type ExampleCorrection = {
  original: string;
  corrected: string;
  tip: string;
};

type PronunciationResult = {
  transcript: string;
  overallScore: number;
  pronunciation: number;
  fluency: number;
  intonation: number;
  clarity: number;
  levelEstimate: string;
  issues: string[];
  tips: string[];
  mispronouncedWords: MispronouncedWord[];
  exampleCorrections: ExampleCorrection[];
};

interface AIFeedbackPageProps {
  questions?: string[];
  topic?: string;
  instructions?: string;
  onBack?: () => void;
  questionIndex: number;
  setQuestionIndex: (index: number) => void;
  onComplete?: () => void;
  isEmbedded?: boolean;
  lessonData?: any;
  selectedDifficulty?: string;
  lessonId?: string;
  currentPageIndex?: number;
  handleAskSpecialist?: () => void;
  onPreviousPage?: () => void;
  pnlConsultationLessonId?: string;
  onHomeClick?: () => void;
  isLastLessonPage?: boolean;
}

const AIFeedbackPage: React.FC<AIFeedbackPageProps> = ({
  questions: propQuestions,
  topic,
  instructions,
  onBack,
  questionIndex,
  setQuestionIndex,
  onComplete,
  isEmbedded = false,
  lessonData,
  selectedDifficulty,
  lessonId,
  currentPageIndex,
  handleAskSpecialist,
  onPreviousPage,
  pnlConsultationLessonId,
  onHomeClick,
  isLastLessonPage = true,
}) => {
  const navigate = useNavigate();
  const { t, learningLanguage, tLesson } = useLanguage();
  const { isTeacherMode, isFontLarge } = useTeacherMode();
  const defaultQuestions = [
    "What do you like to do on weekends?",
    "Describe your favorite food."
  ];

  const questions = propQuestions || defaultQuestions;
  const currentQuestion = questions[questionIndex] ?? questions[0] ?? "";
  const activeQuestionRunRef = useRef(0);

  // Question audio playback
  const questionAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isQuestionAudioLoading, setIsQuestionAudioLoading] = useState(false);
  const [isQuestionAudioPlaying, setIsQuestionAudioPlaying] = useState(false);

  useEffect(() => {
    // Stop any playing question audio when the question changes
    if (questionAudioRef.current) {
      questionAudioRef.current.pause();
      questionAudioRef.current = null;
    }
    setIsQuestionAudioPlaying(false);
  }, [questionIndex]);

  const handlePlayQuestionAudio = async () => {
    if (!currentQuestion) return;
    if (isQuestionAudioPlaying && questionAudioRef.current) {
      questionAudioRef.current.pause();
      questionAudioRef.current = null;
      setIsQuestionAudioPlaying(false);
      return;
    }
    try {
      setIsQuestionAudioLoading(true);
      const url = await getCachedTtsUrl(currentQuestion);
      if (!url) throw new Error("No audio URL");
      const audio = new Audio(url);
      questionAudioRef.current = audio;
      audio.onplay = () => setIsQuestionAudioPlaying(true);
      audio.onended = () => {
        setIsQuestionAudioPlaying(false);
        questionAudioRef.current = null;
      };
      audio.onerror = () => {
        setIsQuestionAudioPlaying(false);
        questionAudioRef.current = null;
      };
      await audio.play();
    } catch (err) {
      console.error("Failed to play question audio:", err);
      setIsQuestionAudioPlaying(false);
    } finally {
      setIsQuestionAudioLoading(false);
    }
  };

  // Helper function to determine if should show Portuguese only for beginner/intermediate levels
  const shouldShowPortugueseOnly = (difficulty?: string): boolean => {
    if (!difficulty) return false;
    const beginnerLevels = ['Fácil', 'Médio', 'Iniciante', 'Intermediário'];
    return beginnerLevels.includes(difficulty);
  };

  // Helper function to determine if should show English placeholder for advanced levels
  const shouldShowEnglishPlaceholder = (difficulty?: string): boolean => {
    if (!difficulty) return false;
    const advancedLevels = ['Curso intermediário', 'Curso avançado', 'Médio', 'Difícil'];
    return advancedLevels.includes(difficulty);
  };

  const getPlaceholderText = () => {
    if (shouldShowEnglishPlaceholder(selectedDifficulty)) {
      return "Write your answer here or use the microphone...";
    }
    return t('write_your_answer_or_use_mic');
  };

  // Check if a section is grammar-related
  const isGrammarSection = (title: string) => {
    const grammarPatterns = ['grammar', 'gramática', 'análisis gramatical', 'gramática e estrutura'];
    return grammarPatterns.some(pattern => title.toLowerCase().includes(pattern));
  };

  // Render the Grammar section as a clickable card with error count
  const renderGrammarSection = (useLargeFont: boolean = false) => {
    return (
      <div 
        key="grammar-section" 
        className="mb-4 cursor-pointer transition-transform hover:scale-[1.02]"
        onClick={() => setIsDetailedCorrectionOpen(true)}
      >
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50/50 border border-green-100 hover:bg-green-100/50 hover:border-green-200">
          <span className="text-2xl flex-shrink-0">✍️</span>
          <div className="flex-1 flex items-center justify-between">
            <h4 className={`text-base font-bold text-green-900 font-['Merriweather'] ${useLargeFont ? 'text-xl' : ''}`}>
              {t('gramatica_estrutura')}
            </h4>
            <div className="flex items-center gap-2">
              {isLoadingErrorCount ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{t('analisando')}</span>
                </div>
              ) : errorCount !== null ? (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  errorCount === 0 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  <span className="font-bold text-sm">
                    {errorCount === 0 ? t('perfeito') : `${errorCount} ${errorCount === 1 ? t('erro') : t('erros')}`}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">—</span>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Static style mapping for Tailwind (dynamic classes don't get compiled)
  const sectionStyles: Record<string, { container: string; title: string; emoji: string }> = {
    blue: {
      container: 'bg-blue-50/50 border-blue-100',
      title: 'text-blue-900',
      emoji: '📊'
    },
    purple: {
      container: 'bg-purple-50/50 border-purple-100',
      title: 'text-purple-900',
      emoji: '🎯'
    },
    green: {
      container: 'bg-green-50/50 border-green-100',
      title: 'text-green-900',
      emoji: '✍️'
    },
    orange: {
      container: 'bg-orange-50/50 border-orange-100',
      title: 'text-orange-900',
      emoji: '✨'
    },
    indigo: {
      container: 'bg-indigo-50/50 border-indigo-100',
      title: 'text-indigo-900',
      emoji: '📚'
    },
    pink: {
      container: 'bg-pink-50/50 border-pink-100',
      title: 'text-pink-900',
      emoji: '🗣️'
    },
    teal: {
      container: 'bg-teal-50/50 border-teal-100',
      title: 'text-teal-900',
      emoji: '💬'
    },
    amber: {
      container: 'bg-amber-50/50 border-amber-100',
      title: 'text-amber-900',
      emoji: '💡'
    },
    gray: {
      container: 'bg-gray-50/50 border-gray-100',
      title: 'text-gray-900',
      emoji: '📝'
    }
  };

  // Format feedback text with beautiful, styled sections
  const formatFeedbackText = (text: string, useLargeFont: boolean = false) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentSection: { title: string; content: string[] } | null = null;
    let sectionKey = 0;
    let grammarSectionRendered = false;
    
    // Extract score if present
    let scoreMatch = text.match(/(?:Score|Pontuação)[:\s]+(\d+)\/(\d+)/i);
    
    // Common section patterns with color keys
    const sectionPatterns: Record<string, { colorKey: string; emoji: string }> = {
      'Score': { colorKey: 'blue', emoji: '📊' },
      'Pontuação': { colorKey: 'blue', emoji: '📊' },
      'Relevance': { colorKey: 'purple', emoji: '🎯' },
      'Relevância': { colorKey: 'purple', emoji: '🎯' },
      'Grammar and structure': { colorKey: 'green', emoji: '✍️' },
      'Gramática e estrutura': { colorKey: 'green', emoji: '✍️' },
      'Análise gramatical': { colorKey: 'green', emoji: '✍️' },
      'Análise Gramatical': { colorKey: 'green', emoji: '✍️' },
      'Corrected Version': { colorKey: 'orange', emoji: '✨' },
      'Versão Corrigida': { colorKey: 'orange', emoji: '✨' },
      'Versão corrigida': { colorKey: 'orange', emoji: '✨' },
      'Explicação': { colorKey: 'amber', emoji: '💡' },
      'Gramática': { colorKey: 'green', emoji: '✍️' },
      'Vocabulary': { colorKey: 'indigo', emoji: '📚' },
      'Vocabulário': { colorKey: 'indigo', emoji: '📚' },
      'Pronunciation': { colorKey: 'pink', emoji: '🗣️' },
      'Pronúncia': { colorKey: 'pink', emoji: '🗣️' },
      'Fluency': { colorKey: 'teal', emoji: '💬' },
      'Fluência': { colorKey: 'teal', emoji: '💬' },
      'Conteúdo': { colorKey: 'purple', emoji: '📄' },
      'Content': { colorKey: 'purple', emoji: '📄' },
    };

    const getSectionStyle = (title: string) => {
      for (const [pattern, config] of Object.entries(sectionPatterns)) {
        if (title.toLowerCase().includes(pattern.toLowerCase())) {
          return { 
            ...sectionStyles[config.colorKey], 
            emoji: config.emoji 
          };
        }
      }
      return sectionStyles.gray;
    };

    const pushSection = (section: { title: string; content: string[] }) => {
      // If it's a grammar section, render the special clickable version
      if (isGrammarSection(section.title)) {
        if (!grammarSectionRendered) {
          elements.push(renderGrammarSection(useLargeFont));
          grammarSectionRendered = true;
        }
        return;
      }

      const style = getSectionStyle(section.title);
      const bodyText = section.content.join('\n').trim();
      const isCorrectedSection = /corrigid|corrected/i.test(section.title);
      // Strip leading quote/asterisks and surrounding quotes from corrected text for playback
      const cleanedCorrectedText = isCorrectedSection
        ? bodyText.replace(/\*\*/g, '').replace(/^["“'']+|["”'']+$/g, '').trim()
        : '';
      elements.push(
        <div key={`section-${sectionKey}`} className="mb-4">
          <div className={`flex items-start gap-3 p-4 rounded-lg border ${style.container}`}>
            <span className="text-2xl flex-shrink-0 mt-1">{style.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h4 className={`text-base font-bold font-['Merriweather'] ${style.title}`}>
                  {section.title}
                </h4>
                {isCorrectedSection && cleanedCorrectedText && (
                  <button
                    type="button"
                    onClick={() => handlePlayCorrectedAudio(cleanedCorrectedText)}
                    className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition"
                    aria-label="Ouvir versão corrigida"
                    title="Ouvir versão corrigida"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className={`text-gray-700 leading-relaxed whitespace-pre-wrap ${
                useLargeFont ? 'text-xl' : ''
              }`}>
                {bodyText}
              </div>
            </div>
          </div>
        </div>
      );
      sectionKey++;
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      // Strip markdown bold/italic markers when comparing as header
      const headerCandidate = trimmedLine.replace(/^\*+\s*/, '').replace(/\s*\*+\s*:?\s*$/, (m) => m.includes(':') ? ':' : '').replace(/\*\*/g, '').trim();
      
      // Skip score line as we'll display it separately
      if (trimmedLine.match(/^\*{0,2}Score[:\s]+\d+\/\d+/i) || trimmedLine.match(/^\*{0,2}Pontuação[:\s]+\d+\/\d+/i)) {
        return;
      }
      
      // Check if it's a section header (allow surrounding **bold** markdown)
      const isHeader = Object.keys(sectionPatterns).some(pattern => {
        const lower = headerCandidate.toLowerCase();
        const pLower = pattern.toLowerCase();
        return lower === pLower || 
          lower === pLower + ':' ||
          lower.startsWith(pLower + ' ') ||
          lower.startsWith(pLower + ':');
      });
      
      if (isHeader && headerCandidate.length > 0) {
        // Save previous section
        if (currentSection && currentSection.content.length > 0) {
          pushSection(currentSection);
        }

        // Start new section — if the header line contains inline content after a colon,
        // capture it so single-line headers like "Corrected Version: I am fine." still render.
        const colonIdx = headerCandidate.indexOf(':');
        let title = headerCandidate;
        const initialContent: string[] = [];
        if (colonIdx >= 0) {
          title = headerCandidate.slice(0, colonIdx).trim();
          const inline = headerCandidate.slice(colonIdx + 1).trim();
          if (inline.length > 0) initialContent.push(inline);
        }
        currentSection = {
          title: title.replace(/:$/, '').trim(),
          content: initialContent,
        };
      } else if (currentSection && trimmedLine.length > 0) {
        currentSection.content.push(line);
      } else if (!currentSection && trimmedLine.length > 0) {
        // Content before any header
        elements.push(
          <div key={`intro-${sectionKey}`} className="mb-4 text-gray-700 leading-relaxed">
            {trimmedLine}
          </div>
        );
        sectionKey++;
      }
    });

    // Push final section
    if (currentSection && currentSection.content.length > 0) {
      pushSection(currentSection);
    }

    return (
      <div className="space-y-3">
        {/* Display score prominently if present */}
        {scoreMatch && (
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <div className="text-center">
                <div className="text-3xl font-bold text-white font-['Merriweather']">
                  {scoreMatch[1]}
                </div>
                <div className="text-xs text-blue-100 font-semibold">
                  {t('out_of')} {scoreMatch[2]}
                </div>
              </div>
            </div>
          </div>
        )}
        {elements}
      </div>
    );
  };

  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [portugueseFeedback, setPortugueseFeedback] = useState<string | null>(null);
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const [isTranslatingFeedback, setIsTranslatingFeedback] = useState(false);
  const [isActivityCompleted, setIsActivityCompleted] = useState(false);
  const [userRecordedAudio, setUserRecordedAudio] = useState<Blob | null>(null);
  const [isUserAudioPlaying, setIsUserAudioPlaying] = useState(false);
  const [userAudioElement, setUserAudioElement] = useState<HTMLAudioElement | null>(null);
  const userAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const [isDetailedCorrectionOpen, setIsDetailedCorrectionOpen] = useState(false);
  const [detailedCorrectionText, setDetailedCorrectionText] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState<number | null>(null);
  const [isLoadingErrorCount, setIsLoadingErrorCount] = useState(false);
  const [showAIInterface, setShowAIInterface] = useState(!isTeacherMode);
  
  // Pronunciation evaluation state
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationResult | null>(null);
  const [isEvaluatingPronunciation, setIsEvaluatingPronunciation] = useState(false);
  const [showPronunciationMistakes, setShowPronunciationMistakes] = useState(false);
  const [pronunciationMistakesSlideIndex, setPronunciationMistakesSlideIndex] = useState(0);
  const [isPlayingMistakeAudio, setIsPlayingMistakeAudio] = useState(false);
  
  const portugueseFeedbackRef = useRef<HTMLDivElement>(null);
  
  const { sendMessage } = useChatApi();
  const { isPlaying, isLoadingAudio, handleSpeakMessage } = useTextToSpeech();
  const { getDetailedCorrection } = useDetailedCorrection();
  const {
    recordingState,
    isPlaying: isVoiceInputPlaying,
    showStopButton,
    isTranscribing,
    handleMicButtonClick,
    stopRecording,
    playAudio,
    cancelAudio,
    sendAudio,
  } = useAudioRecording("feedback");

  const isLastQuestion = questionIndex === questions.length - 1;

  // Enhanced cleanup function for user audio
  const cleanupUserAudio = () => {
    console.log('AIFeedbackPage - Cleaning up user audio');
    const audio = userAudioElementRef.current || userAudioElement;
    if (audio) {
      audio.pause();
      audio.src = '';
      userAudioElementRef.current = null;
      setUserAudioElement(null);
    }
    setIsUserAudioPlaying(false);
  };

  const resetQuestionState = () => {
    // Invalidate any pending AI/transcription/pronunciation work from the previous question/page.
    activeQuestionRunRef.current += 1;

    setUserAnswer("");
    setFeedback(null);
    setPortugueseFeedback(null);
    setUserRecordedAudio(null);
    setIsGettingFeedback(false);
    setIsTranslatingFeedback(false);
    setIsActivityCompleted(false);

    // Clean up user audio + any recording/preview state from the previous question
    cleanupUserAudio();
    try { cancelAudio(); } catch (e) { /* no-op */ }

    // Reset detailed correction state
    setDetailedCorrectionText(null);
    setIsDetailedCorrectionOpen(false);
    setErrorCount(null);
    setIsLoadingErrorCount(false);

    // Reset pronunciation state
    setPronunciationResult(null);
    setIsEvaluatingPronunciation(false);
    setShowPronunciationMistakes(false);
    setPronunciationMistakesSlideIndex(0);
  };

  // Enhanced effect to reset state whenever the question or containing lesson page changes
  useEffect(() => {
    console.log('AIFeedbackPage - Question/page changed:', { questionIndex, currentPageIndex, currentQuestion });

    if (questions.length > 0 && questionIndex >= questions.length) {
      setQuestionIndex(0);
      return;
    }

    resetQuestionState();
  }, [lessonId, currentPageIndex, questionIndex, currentQuestion, questions.length]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log('AIFeedbackPage - Component unmounting, cleaning up audio');
      activeQuestionRunRef.current += 1;
      cleanupUserAudio();
      try { cancelAudio(); } catch (e) { /* no-op */ }
    };
  }, []);

  // Scroll to Portuguese feedback when it appears
  useEffect(() => {
    if (portugueseFeedback && portugueseFeedbackRef.current) {
      setTimeout(() => {
        portugueseFeedbackRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [portugueseFeedback]);

  // Count errors from detailed correction text
  const countErrorsFromDetailedCorrection = (text: string): number => {
    // Pattern: "original"(corrected) :explanation:
    const pattern = /"([^"]+)"\(([^)]+)\)\s*:([^:]+):/g;
    let count = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const [, original, corrected] = match;
      // Filter out corrections that are only punctuation or capitalization
      const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
      if (normalize(original.trim()) !== normalize(corrected.trim())) {
        count++;
      }
    }

    return count;
  };

  // Auto-load detailed correction when feedback is received
  useEffect(() => {
    const loadDetailedCorrection = async () => {
      if (!feedback || !userAnswer.trim()) return;
      
      const corrected = extractCorrectedVersion(feedback);
      if (!corrected) {
        setErrorCount(0);
        return;
      }

      setIsLoadingErrorCount(true);
      try {
        const correctionResult = await getDetailedCorrection(userAnswer, corrected, currentQuestion, selectedDifficulty);
        if (correctionResult) {
          setDetailedCorrectionText(correctionResult);
          const count = countErrorsFromDetailedCorrection(correctionResult);
          setErrorCount(count);
        } else {
          setErrorCount(0);
        }
      } catch (error) {
        console.error("Error loading detailed correction:", error);
        setErrorCount(0);
      } finally {
        setIsLoadingErrorCount(false);
      }
    };

    loadDetailedCorrection();
  }, [feedback, userAnswer, currentQuestion, selectedDifficulty]);

  // Extract corrected version from AI feedback with improved regex patterns
  const extractCorrectedVersion = (feedback: string): string | null => {
    console.log("Extracting corrected version from feedback:", feedback);
    
    // Section headers that indicate end of corrected version
    const sectionHeaders = [
      'Score', 'Relevance', 'Grammar', 'Vocabulary', 'Pronunciation', 'Fluency',
      'Explicação', 'Gramática', 'Vocabulário', 'Pronúncia', 'Fluidez',
      'Puntuación', 'Relevancia', 'Gramática', 'Vocabulario', 'Pronunciación'
    ];
    const endPattern = `(?=\\n(?:${sectionHeaders.join('|')})[:\\s]|$)`;
    
    // Multiple patterns to match different feedback formats - capture everything until next section
    const patterns = [
      // Portuguese: "Versão Corrigida" patterns
      new RegExp(`Versão\\s+Corrigida\\s*\\n\\s*([\\s\\S]+?)${endPattern}`, 'i'),
      new RegExp(`Versão\\s+Corrigida[:\\s]+([\\s\\S]+?)${endPattern}`, 'i'),
      // Spanish: "Versión Corregida" patterns
      new RegExp(`Versión\\s+Corregida\\s*\\n\\s*([\\s\\S]+?)${endPattern}`, 'i'),
      new RegExp(`Versión\\s+Corregida[:\\s]+([\\s\\S]+?)${endPattern}`, 'i'),
      // English: "Corrected Version" patterns
      new RegExp(`Corrected\\s+Version\\s*\\n\\s*([\\s\\S]+?)${endPattern}`, 'i'),
      new RegExp(`(?:4\\.?\\s*)?Corrected\\s+Version[:\\s]+([\\s\\S]+?)${endPattern}`, 'i'),
    ];
    
    for (const pattern of patterns) {
      const match = feedback.match(pattern);
      if (match && match[1]) {
        const correctedText = match[1].trim();
        // Filter out very short matches that might be false positives
        if (correctedText.length > 5) {
          console.log("Extracted corrected version:", correctedText);
          return correctedText;
        }
      }
    }
    
    console.log("No corrected version found in feedback");
    return null;
  };

  const handlePlayUserAudio = () => {
    if (!userRecordedAudio) {
      console.log("No user recorded audio available");
      return;
    }

    const activeAudio = userAudioElementRef.current || userAudioElement;
    if (isUserAudioPlaying && activeAudio) {
      // Pause the currently playing audio
      console.log("Pausing user recorded audio");
      activeAudio.pause();
      setIsUserAudioPlaying(false);
      return;
    }

    // Stop any existing audio before starting new one
    cleanupUserAudio();

    console.log("Playing user recorded audio");
    const audio = new Audio(URL.createObjectURL(userRecordedAudio));
    
    audio.onended = () => {
      console.log("User audio playback ended");
      setIsUserAudioPlaying(false);
      userAudioElementRef.current = null;
      setUserAudioElement(null);
    };
    
    audio.onerror = () => {
      console.error("Error playing user audio");
      setIsUserAudioPlaying(false);
      userAudioElementRef.current = null;
      setUserAudioElement(null);
    };
    
    // Store the audio element reference
    userAudioElementRef.current = audio;
    setUserAudioElement(audio);
    setIsUserAudioPlaying(true);
    
    audio.play().catch(error => {
      console.error("Failed to play user audio:", error);
      setIsUserAudioPlaying(false);
      setUserAudioElement(null);
    });
  };

  const handlePlayUserAudioSlow = () => {
    if (!userRecordedAudio) {
      console.log("No user recorded audio available");
      return;
    }

    const activeAudio = userAudioElementRef.current || userAudioElement;
    if (isUserAudioPlaying && activeAudio) {
      // Pause the currently playing audio
      console.log("Pausing user recorded audio");
      activeAudio.pause();
      setIsUserAudioPlaying(false);
      return;
    }

    // Stop any existing audio before starting new one
    cleanupUserAudio();

    console.log("Playing user recorded audio (slow)");
    const audio = new Audio(URL.createObjectURL(userRecordedAudio));
    audio.playbackRate = 0.7; // 30% slower
    
    audio.onended = () => {
      console.log("User audio playback ended");
      setIsUserAudioPlaying(false);
      userAudioElementRef.current = null;
      setUserAudioElement(null);
    };
    
    audio.onerror = () => {
      console.error("Error playing user audio");
      setIsUserAudioPlaying(false);
      userAudioElementRef.current = null;
      setUserAudioElement(null);
    };
    
    // Store the audio element reference
    userAudioElementRef.current = audio;
    setUserAudioElement(audio);
    setIsUserAudioPlaying(true);
    
    audio.play().catch(error => {
      console.error("Failed to play user audio:", error);
      setIsUserAudioPlaying(false);
      setUserAudioElement(null);
    });
  };

  const handlePlayCorrectedAudio = (correctedText: string) => {
    // Use a unique index for the corrected version audio
    const correctedAudioIndex = questionIndex + 1000;
    console.log('Playing corrected audio for index:', correctedAudioIndex);
    handleSpeakMessage(correctedAudioIndex, correctedText);
  };

  const handlePlayCorrectedAudioSlow = async (correctedText: string) => {
    try {
      // Generate TTS audio for slow playback using the same Supabase function
      const { data, error } = await supabase.functions.invoke('speak-elevenlabs', {
        body: { text: correctedText }
      });
      
      if (error || !data?.audioContent) {
        console.error('Error generating slow audio:', error);
        return;
      }

      // Convert base64 to blob and play with slow rate
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.playbackRate = 0.6; // 40% slower
      
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('Error playing slow corrected audio:', error);
      // Fallback to regular TTS
      handlePlayCorrectedAudio(correctedText);
    }
  };

  const handleVoiceInput = async () => {
    console.log("Starting voice input process");
    const requestRunId = activeQuestionRunRef.current;
    try {
      const { recordedAudio, transcribedText } = await sendAudio();
      console.log("Voice input result:", { 
        hasRecordedAudio: !!recordedAudio, 
        transcribedText: transcribedText 
      });
      if (activeQuestionRunRef.current !== requestRunId) return;
      
      if (transcribedText) {
        setUserAnswer(transcribedText);
        // Store the recorded audio for later playback
        if (recordedAudio) {
          setUserRecordedAudio(recordedAudio);
          console.log("Stored user recorded audio");
        }
        // Auto-submit the transcription for feedback
        console.log("Auto-submitting answer for feedback:", transcribedText);
        await submitAnswer(transcribedText, recordedAudio);
      }
    } catch (error) {
      console.error("Error with voice input:", error);
    }
  };

  const submitAnswer = async (answer: string, recordedAudio?: Blob | null) => {
    if (!answer.trim()) return;
    const requestRunId = activeQuestionRunRef.current;
    const requestQuestion = currentQuestion;
    
    console.log("Submitting answer for feedback:", answer);
    console.log("Has recorded audio:", !!recordedAudio);
    
    setIsGettingFeedback(true);
    
    const englishPrompt = `You are an English teacher evaluating a student's written answer to a question.

Please provide your response in four clearly labeled sections. Use clean formatting with each section title on its own line followed by a paragraph break. Do not use markdown, bullet points, or asterisks.

1. Score
Write the score in the format: Score: X/10 (e.g., Score: 7/10)

CRITICAL RELEVANCE GATE — evaluate this FIRST:
- If the student's answer does NOT actually address the question (e.g. question is "How are you?" and the answer is "My name is Aline"), the score MUST be between 1/10 and 3/10, no matter how grammatically correct the sentence is. A well-formed sentence that answers a different question is NOT a valid answer.
- Only apply the generous scoring below if the answer is genuinely on-topic and responds to what was asked.

SCORING GUIDELINES (only for on-topic answers) - Be generous:
- 10/10: Only for perfect answers with no errors and excellent content
- 8-9/10: Good answers with minor errors or slightly incomplete content
- 6-7/10: Decent answers that communicate the idea despite some errors
- 4-5/10: Answers with significant errors but still understandable
- 1-3/10: Very problematic, off-topic, or unrelated answers

Most reasonable on-topic attempts should score 6 or above. Don't be overly strict on grammar, but DO be strict on relevance.

2. Relevance
Check whether the student's answer actually responds to the question that was asked. If it doesn't (wrong topic, answers a different question, unrelated statement), clearly state that the answer does not address the question and explain briefly what kind of answer the question expects. Only mark as relevant when the answer truly responds to what was asked — a simple, direct on-topic answer is fine, but an off-topic sentence is NOT relevant even if it is grammatically correct.

3. Grammar and structure
Give a general evaluation of the quality of the text regarding grammar and structure. You don't need to point out specific mistakes but just mention that there were some, if there were and give a general evaluation. In the end remind the reader that he can check his grammar mistakes in detail(if there were) by clicking the button "Correção Detalhada"

4. Corrected Version
Write the student's answer with corrections applied ONLY if there are grammar mistakes or if the content is unclear or difficult to understand or not related to the context. If some words seem to not fit the question or context at all it is possible that it was suppose to be another word with similar sound, so you can replace with that one. The goal is strict correction only, not style improvement. If there are no corrections, just write down the exact phrase the student said but always write down the phrase after "Corrected Version."

Keep each section short and clear. Do not include suggestions, praise, or extra explanations.

Question: ${currentQuestion}
Student Answer: ${answer}`;

    const spanishPrompt = `Eres un profesor de español que evalúa la respuesta escrita de un estudiante a una pregunta. Toda tu respuesta debe estar en español.

Proporciona tu respuesta en cuatro secciones claramente etiquetadas. Utiliza un formato limpio con cada título de sección en su propia línea seguido de un salto de párrafo. No uses markdown, viñetas o asteriscos.

1. Puntuación
Escribe la puntuación en el formato: Puntuación: X/10 (ej., Puntuación: 7/10)

FILTRO CRÍTICO DE RELEVANCIA — evalúalo PRIMERO:
- Si la respuesta del estudiante NO aborda realmente la pregunta (por ejemplo, la pregunta es "¿Cómo estás?" y la respuesta es "Me llamo Aline"), la puntuación DEBE estar entre 1/10 y 3/10, sin importar lo gramaticalmente correcta que sea la frase. Una frase bien formada que responde a otra pregunta NO es una respuesta válida.
- Aplica las pautas generosas de abajo solo si la respuesta está genuinamente relacionada con el tema y responde a lo que se preguntó.

GUÍA DE PUNTUACIÓN (solo para respuestas relevantes) - Sé generoso:
- 10/10: Solo para respuestas perfectas sin errores y con excelente contenido
- 8-9/10: Buenas respuestas con errores menores o contenido ligeramente incompleto
- 6-7/10: Respuestas decentes que comunican la idea a pesar de algunos errores
- 4-5/10: Respuestas con errores significativos pero aún comprensibles
- 1-3/10: Respuestas muy problemáticas, fuera de tema o no relacionadas

La mayoría de los intentos razonables y relevantes deben puntuar 6 o más. No seas demasiado estricto con la gramática, pero SÍ sé estricto con la relevancia.

2. Relevancia
Verifica si la respuesta del estudiante realmente responde a la pregunta. Si no lo hace (tema equivocado, responde a otra pregunta, frase no relacionada), indica claramente que la respuesta no aborda la pregunta y explica brevemente qué tipo de respuesta se espera. Solo marca como relevante cuando la respuesta verdaderamente responde a lo que se preguntó — una respuesta simple y directa está bien, pero una frase fuera de tema NO es relevante aunque sea gramaticalmente correcta.

3. Análisis gramatical
Señala cualquier error gramatical o de ortografía en la respuesta del estudiante. Al analizar la gramática, ignora los signos de puntuación (comas, puntos, signos de interrogación, signos de exclamación) y los errores de mayúsculas. Céntrate únicamente en la estructura gramatical, la elección de palabras y la construcción de frases.

4. Versión corregida
Escribe la respuesta del estudiante con las correcciones aplicadas SÓLO si hay errores gramaticales o si el contenido es poco claro, difícil de entender o no está relacionado con el contexto. Si algunas palabras no parecen encajar en absoluto con la pregunta o el contexto, es posible que debieran ser otra palabra con un sonido similar, así que puedes reemplazarla por esa. El objetivo es una corrección estricta únicamente, no mejora de estilo. Si no hay correcciones, simplemente escribe la frase exacta que dijo el estudiante, pero siempre escribe la frase después de "Versión corregida".

Mantén cada sección corta y clara. No incluyas sugerencias, elogios o explicaciones adicionales.

Pregunta: ${currentQuestion}
Respuesta del estudiante: ${answer}`;

    const systemPrompt = learningLanguage === 'es' ? spanishPrompt : englishPrompt;

    try {
      const userMessage = learningLanguage === 'es'
        ? `Pregunta: "${currentQuestion}"\nRespuesta del estudiante: "${answer}"\n\nEvalúa PRIMERO si la respuesta aborda realmente la pregunta antes de puntuar.`
        : `Question: "${currentQuestion}"\nStudent's answer: "${answer}"\n\nEvaluate FIRST whether the answer actually addresses the question before scoring.`;
      const response = await sendMessage(
        userMessage,
        systemPrompt
      );
      
      if (response) {
        console.log("Received feedback from AI:", response);
          if (activeQuestionRunRef.current !== requestRunId) return;
          setFeedback(response);
        
        // Auto-translate to Portuguese for beginner/intermediate levels
        if (shouldShowPortugueseOnly(selectedDifficulty)) {
          const translatePrompt = `Translate the following English teacher feedback to Portuguese. 
          
IMPORTANT INSTRUCTIONS:
- Translate all explanatory text and comments to Portuguese
- Keep ALL English terms, phrases, and corrected versions in English - DO NOT translate them
- Preserve the structure and formatting
- Only translate the explanations, not the examples

Feedback to translate:
${response}`;
          
          try {
            const portugueseResponse = await sendMessage(
              translatePrompt,
              "You are a translator specializing in educational content."
            );
            
            if (portugueseResponse) {
              if (activeQuestionRunRef.current !== requestRunId) return;
              setPortugueseFeedback(portugueseResponse);
            }
          } catch (error) {
            console.error("Error auto-translating feedback:", error);
          }
        }
      } else {
        // Fallback: AI returned nothing. Still surface feedback so the
        // Next/Concluir button renders and the user isn't stuck.
        console.warn("AI returned empty feedback, using fallback");
        if (activeQuestionRunRef.current !== requestRunId) return;
        setFeedback(t('feedback_error') || 'Não foi possível obter feedback agora. Você pode seguir para a próxima pergunta.');
      }
    } catch (error) {
      console.error("Error getting feedback:", error);
      if (activeQuestionRunRef.current !== requestRunId) return;
      setFeedback(t('feedback_error') || 'Erro ao obter feedback. Você pode seguir para a próxima pergunta.');
    } finally {
      if (activeQuestionRunRef.current === requestRunId) {
        setIsGettingFeedback(false);
      }
    }

    
    // Run pronunciation evaluation separately (in parallel, doesn't block feedback display)
    if (recordedAudio && activeQuestionRunRef.current === requestRunId) {
      evaluatePronunciation(answer, recordedAudio, requestRunId, requestQuestion);
    }
  };

  // Separate function for pronunciation evaluation - runs independently using free-pronunciation-check
  const evaluatePronunciation = async (transcribedText: string, audioBlob: Blob, requestRunId: number, questionContext: string) => {
    console.log("Starting pronunciation evaluation (running independently)");
    setIsEvaluatingPronunciation(true);
    try {
      const audioBase64 = await blobToBase64(audioBlob);
      
      const { data: pronData, error: pronError } = await supabase.functions.invoke("free-pronunciation-check", {
        body: {
          audioBase64,
          mimeType: "audio/webm",
          context: questionContext, // Pass the submitted question as context for better analysis
        },
      });

      if (activeQuestionRunRef.current !== requestRunId) return;

      if (pronError) {
        console.error("Error from pronunciation API:", pronError);
      } else if (pronData) {
        console.log("Pronunciation evaluation result:", pronData);
        setPronunciationResult(pronData as PronunciationResult);
      }
    } catch (pronErr) {
      console.error("Error evaluating pronunciation:", pronErr);
    } finally {
      if (activeQuestionRunRef.current === requestRunId) {
        setIsEvaluatingPronunciation(false);
      }
    }
  };

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Get mispronounced words (score < 50) from free-pronunciation-check response
  const getMispronouncedWords = (): MispronouncedWord[] => {
    if (!pronunciationResult?.mispronouncedWords) return [];
    return pronunciationResult.mispronouncedWords.filter(w => w.score < 50);
  };

  // Play TTS for a word
  const handlePlayMistakeWord = async (word: string) => {
    if (isPlayingMistakeAudio) return;
    
    setIsPlayingMistakeAudio(true);
    try {
      await handleSpeakMessage(9999, word);
    } catch (error) {
      console.error('Error playing word audio:', error);
    } finally {
      setIsPlayingMistakeAudio(false);
    }
  };

  const translateToPortuguese = async () => {
    if (!feedback) return;
    const requestRunId = activeQuestionRunRef.current;
    
    setIsTranslatingFeedback(true);
    
    const translatePrompt = `Translate the following English teacher feedback to Portuguese. 

IMPORTANT INSTRUCTIONS:
- Translate all explanatory text and comments to Portuguese
- Keep ALL English terms, phrases, and corrected versions in English - DO NOT translate them
- The goal is to teach English in Portuguese, so English examples must remain in English
- Maintain the same structure and format
- Keep section numbers and titles

Example format:
If the original says: "The word 'beautiful' should be 'beautifully' here"
Translate to: "A palavra 'beautiful' deveria ser 'beautifully' aqui"

Feedback to translate:
${feedback}`;

    try {
      const response = await sendMessage(
        "Please translate this feedback to Portuguese",
        translatePrompt
      );
      
      if (response) {
        console.log("Received Portuguese translation:", response);
        if (activeQuestionRunRef.current !== requestRunId) return;
        setPortugueseFeedback(response);
      }
    } catch (error) {
      console.error("Error translating feedback:", error);
      if (activeQuestionRunRef.current !== requestRunId) return;
      setPortugueseFeedback("Erro ao traduzir feedback");
    } finally {
      if (activeQuestionRunRef.current === requestRunId) {
        setIsTranslatingFeedback(false);
      }
    }
  };

  const handleSubmitAnswer = async () => {
    await submitAnswer(userAnswer, userRecordedAudio);
  };

  const handleSkipQuestion = () => {
    console.log('Skipping question, cleaning up audio');
    resetQuestionState();
    
    if (!isLastQuestion) {
      setQuestionIndex(questionIndex + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handleNextQuestion = () => {
    console.log('Moving to next question, cleaning up audio');
    resetQuestionState();
    
    if (!isLastQuestion) {
      setQuestionIndex(questionIndex + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handlePreviousQuestion = () => {
    console.log('Moving to previous question, cleaning up audio');
    resetQuestionState();
    
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
    }
  };

  const completeActivity = () => {
    resetQuestionState();
    if (onComplete) onComplete();
    else navigate('/');
  };

  const handleBottomNext = () => {
    if (isGettingFeedback) return;
    if (!feedback) {
      if (userAnswer.trim()) {
        handleSubmitAnswer();
      } else {
        handleSkipQuestion();
      }
      return;
    }
    handleNextQuestion();
  };

  const handleBottomComplete = () => {
    if (isGettingFeedback) return;
    if (!feedback && userAnswer.trim()) {
      handleSubmitAnswer();
      return;
    }
    completeActivity();
  };

  const resetActivity = () => {
    console.log('Resetting activity, cleaning up all audio');
    // Clean up audio when resetting
    cleanupUserAudio();

    setQuestionIndex(0);
    setUserAnswer("");
    setFeedback(null);
    setIsActivityCompleted(false);
    setUserRecordedAudio(null);
    setDetailedCorrectionText(null);
    setIsDetailedCorrectionOpen(false);
  };

  const containerClasses = `flex flex-col bg-white ${isEmbedded ? 'h-full' : 'min-h-screen'}`;


  // Get corrected version from feedback if available
  const correctedVersion = feedback ? extractCorrectedVersion(feedback) : null;
  const correctedAudioIndex = questionIndex + 1000;
  const isCorrectedAudioPlaying = isPlaying[correctedAudioIndex];
  const isCorrectedAudioLoading = isLoadingAudio[correctedAudioIndex];

  // Determine the section title based on topic or learning language
  const getSectionTitle = () => {
    if (topic) {
      return topic;
    }
    return learningLanguage === 'es' ? t('spanish_questions') : t('english_questions');
  };

  return (
    <div data-no-word-click className={containerClasses}>
      {/* Back button for in-activity */}
      {onBack && (
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {t('voltar')}
          </Button>
        </div>
      )}
      {/* Main Content */}
      <div
        className="
          flex-1
          w-full
          p-4 md:p-8
          pb-32
          overflow-auto
          md:overflow-visible
          md:flex md:justify-center md:items-start
        "
      >
        <div
          className="
            w-full max-w-2xl flex flex-col flex-1
            md:justify-start
            pb-8
          "
        >
          <Card className="bg-white border-0 shadow-xl rounded-xl w-full py-8 md:py-12 px-3 md:px-8 flex flex-col items-center">
            <CardHeader className="w-full p-0 mb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 w-full">
                <div>
                  {/* Main Section Title */}
                  <span className="block text-[1.13rem] md:text-lg font-semibold text-gray-500 tracking-wide uppercase mb-2">
                    {getSectionTitle()}
                  </span>
                  {/* Progress */}
                  <span className="block text-[1.2rem] md:text-2xl font-bold text-black leading-snug">
                    {t('question_x_of_y', { questionIndex: String(questionIndex + 1), questionCount: String(questions.length) })}
                  </span>
                </div>
                {!feedback && (
                  <Button
                    onClick={handleSkipQuestion}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 rounded shadow-none border-gray-300 mt-2 md:mt-0"
                    disabled={recordingState.status === 'recording'}
                  >
                    <SkipForward className="h-4 w-4" />
                    {tLesson('skip')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 w-full p-0">
              {/* Question */}
              <div className="w-full">
                <div className="bg-indigo-50 rounded-lg px-5 md:px-7 py-5 mb-2 shadow-none border border-indigo-100">
                  <div className="flex items-center justify-center gap-3">
                    <p data-word-clickable className={`text-xl md:text-2xl font-bold text-gray-900 text-center ${
                      isTeacherMode && isFontLarge ? 'text-3xl md:text-4xl' : ''
                    }`}>{currentQuestion}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handlePlayQuestionAudio}
                      disabled={isQuestionAudioLoading}
                      aria-label="Ouvir pergunta"
                      className="shrink-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
                    >
                      {isQuestionAudioLoading ? (
                        <Loader className="h-5 w-5 animate-spin" />
                      ) : (
                        <Volume2 className={`h-5 w-5 ${isQuestionAudioPlaying ? 'animate-pulse' : ''}`} />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Answer Input - Teacher Mode or Normal Mode */}
              <div className="w-full">
                {isTeacherMode && !showAIInterface ? (
                  /* Teacher Mode - Only show Ativar I.A button */
                  <div className="text-center py-8">
                    <Button
                      onClick={() => setShowAIInterface(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg text-lg"
                    >
                      {t('ativar_ia')}
                    </Button>
                  </div>
                ) : (
                  /* Normal Mode or Teacher Mode with AI activated */
                  <>
                    {/* textarea + mic */}
                    <div className="relative w-full mb-2">
                      <Textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder={getPlaceholderText()}
                        className="min-h-[120px] pr-12 bg-gray-50 border border-gray-200 text-[1rem] font-medium rounded-xl shadow-none focus-visible:ring-0"
                        disabled={isGettingFeedback || feedback !== null || recordingState.status === 'recording'}
                        autoGrow
                        maxHeight={250}
                      />
                      <Button
                        onClick={handleMicButtonClick}
                        variant="outline"
                        size="icon"
                        className="absolute bottom-3 right-3 shadow-none"
                        disabled={isGettingFeedback || feedback !== null || isTranscribing}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Voice Recording UI */}
                    {recordingState.status === 'recording' && (
                      <div className="space-y-3">
                        <RecordingIndicator />
                        {showStopButton && <StopRecordingButton onClick={stopRecording} />}
                      </div>
                    )}
                    {recordingState.status === 'preview' && (
                      <AudioPreview
                        isPlaying={isVoiceInputPlaying}
                        onPlay={playAudio}
                        onSend={handleVoiceInput}
                        onDelete={cancelAudio}
                        isTranscribing={isTranscribing}
                      />
                    )}
                    {/* submit button */}
                    {!feedback && (
                      <Button
                        onClick={handleSubmitAnswer}
                        disabled={!userAnswer.trim() || isGettingFeedback}
                        className="w-full mt-4 bg-[#18a84e] hover:bg-[#13913f] text-white font-semibold text-[1.13rem] rounded-lg py-3"
                      >
                        {isGettingFeedback ? (
                          <div className="flex items-center gap-2">
                            <Loader className="h-4 w-4 animate-spin" />
                            {t('analyzing_answer')}
                          </div>
                        ) : (
                          tLesson('answer')
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>
              {/* AI Feedback */}
              {feedback && (
                <div className="space-y-4">
                  {shouldShowPortugueseOnly(selectedDifficulty) ? (
                    // Portuguese only version for beginner/intermediate
                    <>
                      {portugueseFeedback ? (
                        <Card className="border-0 bg-blue-50 px-3 md:px-6 py-3 md:py-4 shadow-none rounded-lg">
                          <CardContent className="p-0">
                            {formatFeedbackText(portugueseFeedback, isTeacherMode && isFontLarge)}
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="border-0 bg-gray-50 px-3 md:px-6 py-3 md:py-4 shadow-none rounded-lg">
                          <CardContent className="p-0">
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                              <span className="text-sm text-gray-600">{t('preparando_portugues')}</span>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    // English with optional Portuguese button for advanced levels
                    <>
                      <Card className="border-0 bg-indigo-50 px-3 md:px-6 py-3 md:py-4 shadow-none rounded-lg">
                        <CardHeader className="p-0 mb-2">
                          <CardTitle className="text-lg text-indigo-900 font-semibold flex items-center gap-2">
                            {t('teachers_feedback')}
                            {!portugueseFeedback && (
                              <Button
                                onClick={translateToPortuguese}
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-auto py-1 px-2"
                                disabled={isTranslatingFeedback}
                              >
                                {isTranslatingFeedback ? (
                                  <Loader className="h-3 w-3 animate-spin" />
                                ) : (
                                  <HelpCircle className="h-3 w-3" />
                                )}
                                <span className="text-xs">{isTranslatingFeedback ? t('traduzindo') : t('explicar_portugues')}</span>
                              </Button>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          {formatFeedbackText(feedback, isTeacherMode && isFontLarge)}
                        </CardContent>
                      </Card>

                      {/* Portuguese Feedback - show when translated */}
                      {portugueseFeedback && (
                        <Card ref={portugueseFeedbackRef} className="border-0 bg-blue-50 px-3 md:px-6 py-3 md:py-4 shadow-none rounded-lg">
                          <CardHeader className="p-0 mb-2">
                            <CardTitle className="text-lg text-blue-900 font-semibold">{t('explicacao_portugues')}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            {formatFeedbackText(portugueseFeedback, isTeacherMode && isFontLarge)}
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}

                  {/* Audio comparisons, other UI - unchanged */}
                  {userRecordedAudio && (
                    <div className="space-y-4">
                      {/* What you said section */}
                      <Card className="border-0 bg-orange-50 px-3 md:px-6 py-3 md:py-4 shadow-none rounded-lg">
                        <CardHeader className="p-0 mb-2">
                          <CardTitle className="text-base text-orange-900 font-semibold">{t('what_you_said')}</CardTitle>
                        </CardHeader>
                         <CardContent className="p-0 flex justify-center">
                           <Button
                             onClick={handlePlayUserAudio}
                             size="icon"
                             disabled={!userRecordedAudio}
                             title={isUserAudioPlaying ? t('pause_audio') : t('listen_to_your_answer')}
                             className="bg-orange-500 hover:bg-orange-600 text-white rounded-full h-10 w-10 shadow-md"
                           >
                             {isUserAudioPlaying ? (
                               <Pause className="h-5 w-5" />
                             ) : (
                               <Play className="h-5 w-5" />
                             )}
                           </Button>
                         </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Corrected version (native speaker) — only when user recorded audio */}
                  {userRecordedAudio && correctedVersion && (
                    <Card className="border-0 bg-green-50 px-3 md:px-6 py-3 md:py-4 shadow-none rounded-lg">
                      <CardHeader className="p-0 mb-2">
                        <CardTitle className="text-base text-green-900 font-semibold">{t('how_native_speaker_says')}</CardTitle>
                      </CardHeader>
                       <CardContent className="p-0 flex flex-col items-center gap-2">
                         <p className="text-green-900 text-center text-base">{correctedVersion}</p>
                         <div className="flex justify-center gap-3">
                           <Button
                             onClick={() => handlePlayCorrectedAudio(correctedVersion)}
                             size="icon"
                             disabled={isCorrectedAudioLoading}
                             title={isCorrectedAudioLoading ? t('loading') : isCorrectedAudioPlaying ? t('pause_native') : t('listen_to_native')}
                             className="bg-green-500 hover:bg-green-600 text-white rounded-full h-10 w-10 shadow-md"
                           >
                             {isCorrectedAudioLoading ? (
                               <Loader className="h-5 w-5 animate-spin" />
                             ) : isCorrectedAudioPlaying ? (
                               <Pause className="h-5 w-5" />
                             ) : (
                               <Play className="h-5 w-5" />
                             )}
                           </Button>
                           <Button
                             onClick={() => handlePlayCorrectedAudioSlow(correctedVersion)}
                             size="icon"
                             disabled={isCorrectedAudioLoading}
                             title={t('reproduzir_devagar')}
                             className="bg-green-400 hover:bg-green-500 text-white rounded-full h-10 w-10 shadow-md"
                           >
                             🐢
                           </Button>
                         </div>
                       </CardContent>
                    </Card>
                  )}

                  {/* Pronunciation evaluation section (only when audio recorded) */}
                  {userRecordedAudio && (
                    isEvaluatingPronunciation ? (
                       <Card className="border-0 bg-purple-50 px-3 md:px-6 py-3 md:py-4 shadow-none rounded-lg">
                         <CardContent className="p-0">
                           <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                              <span className="text-sm text-purple-600">{t('avaliando_pronuncia')}</span>
                           </div>
                         </CardContent>
                       </Card>
                     ) : pronunciationResult && (
                       <Card 
                         className={`border-0 px-3 md:px-6 py-3 md:py-4 shadow-none rounded-lg cursor-pointer transition-colors ${
                           getMispronouncedWords().length > 0 
                             ? 'bg-red-50 hover:bg-red-100' 
                             : 'bg-green-50 hover:bg-green-100'
                         }`}
                         onClick={() => {
                           if (getMispronouncedWords().length > 0) {
                             setPronunciationMistakesSlideIndex(0);
                             setShowPronunciationMistakes(true);
                           }
                         }}
                       >
                         <CardContent className="p-0">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               <span className="text-xl">🗣️</span>
                                <span className={`text-base font-semibold ${
                                  getMispronouncedWords().length > 0 ? 'text-red-900' : 'text-green-900'
                                }`}>
                                  {t('pronuncia_label')}
                                </span>
                              </div>
                              <div className={`text-sm font-medium ${
                                getMispronouncedWords().length > 0 ? 'text-red-700' : 'text-green-700'
                              }`}>
                                {getMispronouncedWords().length > 0 ? (
                                  <span>{getMispronouncedWords().length} {getMispronouncedWords().length !== 1 ? t('erros') : t('erro')} • {t('clique_ver')}</span>
                                ) : (
                                  <span>{t('nenhum_erro')}</span>
                               )}
                             </div>
                           </div>
                         </CardContent>
                       </Card>
                     )
                  )}

                  {!isLastQuestion ? (
                    <Button onClick={handleNextQuestion} className="w-full mt-4 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-lg py-3 text-lg">
                      {t('next_question')}
                    </Button>
                  ) : isLastLessonPage ? (
                    <Button
                      onClick={completeActivity}
                      className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg py-3 text-lg flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-5 w-5" />
                      {t('complete') || 'Concluir'}
                    </Button>
                  ) : (
                    <Button
                      onClick={completeActivity}
                      className="w-full mt-4 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-lg py-3 text-lg"
                    >
                      {tLesson('next') || 'Próximo'}
                    </Button>
                  )}

                </div>
              )}
            </CardContent>
           </Card>
         </div>
       </div>
       
       {/* Detailed Correction Modal */}
       <DetailedCorrectionModal
         isOpen={isDetailedCorrectionOpen}
         onClose={() => setIsDetailedCorrectionOpen(false)}
         correctedText={detailedCorrectionText || ""}
         originalText={userAnswer}
         cleanCorrectedVersion={correctedVersion}
       />
       
       {/* Pronunciation Mistakes Modal */}
       <Dialog open={showPronunciationMistakes} onOpenChange={setShowPronunciationMistakes}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle className="text-center">{t('palavras_erro_pronuncia')}</DialogTitle>
           </DialogHeader>
           
            {getMispronouncedWords().length > 0 && (
              <div className="space-y-6">
                 {/* Word display */}
                <div className="flex items-center justify-center gap-4 py-8">
                  <p className="text-5xl font-bold text-gray-900">
                    {getMispronouncedWords()[pronunciationMistakesSlideIndex]?.word}
                  </p>
                  <Button
                    onClick={() => handlePlayMistakeWord(getMispronouncedWords()[pronunciationMistakesSlideIndex]?.word)}
                    variant="ghost"
                    size="icon"
                    className="h-14 w-14 rounded-full hover:bg-gray-100"
                    disabled={isPlayingMistakeAudio}
                  >
                    <Volume2 className={`h-8 w-8 ${isPlayingMistakeAudio ? 'text-primary animate-pulse' : 'text-gray-600'}`} />
                  </Button>
                </div>
               
               {/* Navigation */}
                <div className="flex justify-between items-center">
                  <Button
                    onClick={() => setPronunciationMistakesSlideIndex(prev => Math.max(0, prev - 1))}
                    variant="outline"
                    disabled={pronunciationMistakesSlideIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <Button
                    onClick={() => setPronunciationMistakesSlideIndex(prev => 
                      Math.min(getMispronouncedWords().length - 1, prev + 1)
                    )}
                    variant="outline"
                    disabled={pronunciationMistakesSlideIndex === getMispronouncedWords().length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
             </div>
           )}
         </DialogContent>
       </Dialog>
       
        {/* Bottom Navigation */}
        <LessonNavigation
          onNext={
            !isLastQuestion
              ? handleBottomNext
              : !isLastLessonPage
                ? handleBottomComplete
                : undefined
          }
          onPrevious={questionIndex > 0 ? handlePreviousQuestion : (onPreviousPage || undefined)}
          isFirstPage={questionIndex === 0 && !onPreviousPage}
          isLastPage={isLastQuestion && isLastLessonPage}
          pageNumber={questionIndex + 1}
          totalPages={questions.length}
          onComplete={isLastQuestion && isLastLessonPage ? handleBottomComplete : undefined}
          hasCompletedLesson={false}
          isAuthenticated={true}
          lessonData={lessonData || questions.map(q => ({ question: q, type: 'aiFeedback' }))}
          selectedDifficulty={selectedDifficulty}
          currentPageIndex={currentPageIndex ?? questionIndex}
          aiFeedbackQuestionIndex={questionIndex}
          hideSpecialistHelp={false}
          canProceed={!isGettingFeedback}
          lessonId={lessonId}
          customAskSpecialist={handleAskSpecialist}
          pnlConsultationLessonId={pnlConsultationLessonId}
          onHomeClick={onHomeClick}
        />
     </div>
   );
 };
 
 export default AIFeedbackPage;
