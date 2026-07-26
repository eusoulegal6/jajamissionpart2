import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mic, Play, Pause, Volume2, RotateCcw, SkipForward, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useChatApi } from "@/hooks/use-chat-api";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useDetailedCorrection } from "@/hooks/useDetailedCorrection";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTeacherMode } from "@/contexts/TeacherModeContext";
import { toast } from "@/hooks/use-toast";
import DetailedCorrectionModal from "./DetailedCorrectionModal";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

interface AIFeedbackWithParametersPageProps {
  questions?: string[];
  evaluationParameters?: string[];
  topic?: string;
  onBack?: () => void;
  onNext?: () => void;
  questionIndex: number;
  setQuestionIndex: (index: number) => void;
  isEmbedded?: boolean;
  lessonId?: string;
  onFinish?: () => void;
  difficulty?: string;
  isLastLessonPage?: boolean;
}

const AIFeedbackWithParametersPage: React.FC<AIFeedbackWithParametersPageProps> = ({
  questions: propQuestions,
  evaluationParameters: propParameters,
  topic,
  onBack,
  onNext,
  questionIndex,
  setQuestionIndex,
  isEmbedded,
  lessonId,
  onFinish,
  difficulty,
  isLastLessonPage = true,
}) => {
  const { sendMessage } = useChatApi();
  const { 
    recordingState, 
    isPlaying, 
    showStopButton, 
    isTranscribing, 
    handleMicButtonClick, 
    stopRecording, 
    playAudio, 
    cancelAudio, 
    sendAudio 
  } = useAudioRecording();
  const { handleSpeakMessage } = useTextToSpeech();
  const { getDetailedCorrection, isLoading: isDetailedCorrectionLoading } = useDetailedCorrection();
  const { learningLanguage, t } = useLanguage();
  const { isTeacherMode, isFontLarge } = useTeacherMode();

  const [userAnswer, setUserAnswer] = useState("");
  const [grammarFeedback, setGrammarFeedback] = useState("");
  const [parametersFeedback, setParametersFeedback] = useState("");
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const [userRecordedAudio, setUserRecordedAudio] = useState<Blob | null>(null);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const [isPlayingCorrectedAudio, setIsPlayingCorrectedAudio] = useState(false);
  const [feedbackInPortuguese, setFeedbackInPortuguese] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [parametersInPortuguese, setParametersInPortuguese] = useState("");
  const [isTranslatingParameters, setIsTranslatingParameters] = useState(false);
  const [isLoadingParameters, setIsLoadingParameters] = useState(false);
  const [showDetailedCorrection, setShowDetailedCorrection] = useState(false);
  const [detailedCorrection, setDetailedCorrection] = useState("");
  const [isActivityCompleted, setIsActivityCompleted] = useState(false);
  
  // Pronunciation evaluation state
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationResult | null>(null);
  const [isEvaluatingPronunciation, setIsEvaluatingPronunciation] = useState(false);
  const [showPronunciationMistakes, setShowPronunciationMistakes] = useState(false);
  const [pronunciationMistakesSlideIndex, setPronunciationMistakesSlideIndex] = useState(0);
  const [isPlayingMistakeAudio, setIsPlayingMistakeAudio] = useState(false);

  const userAudioRef = useRef<HTMLAudioElement | null>(null);
  const correctedAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeQuestionRunRef = useRef(0);

  const questions = propQuestions || [];
  const evaluationParameters = propParameters || [];
  const currentQuestion = questions[questionIndex];

  // Helper function to determine if should show Portuguese only for beginner/intermediate levels
  const shouldShowPortugueseOnly = (difficulty?: string): boolean => {
    if (!difficulty) return false;
    const beginnerLevels = ['Fácil', 'Médio', 'Iniciante', 'Intermediário'];
    return beginnerLevels.includes(difficulty);
  };

  // Helper function to determine if should show English placeholder for advanced levels
  const shouldShowEnglishPlaceholder = (diff?: string): boolean => {
    if (!diff) return false;
    const advancedLevels = ['Curso intermediário', 'Curso avançado', 'Médio', 'Difícil'];
    return advancedLevels.includes(diff);
  };

  const getPlaceholderText = () => {
    if (shouldShowEnglishPlaceholder(difficulty)) {
      return "Write your answer here or use the microphone...";
    }
    return "Escreva sua resposta aqui ou use o microfone...";
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
  const formatFeedbackText = (text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentSection: { title: string; content: string[] } | null = null;
    let sectionKey = 0;
    
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
      'Corrected Version': { colorKey: 'orange', emoji: '✨' },
      'Versão Corrigida': { colorKey: 'orange', emoji: '✨' },
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

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      // Strip markdown ** wrappers so **Versão Corrigida:** still matches as a header
      const headerCandidate = trimmedLine.replace(/\*\*/g, '').trim();
      
      // Skip score line as we'll display it separately
      if (headerCandidate.match(/^Score[:\s]+\d+\/\d+/i) || headerCandidate.match(/^Pontuação[:\s]+\d+\/\d+/i)) {
        return;
      }
      
      // Check if it's a section header (case-insensitive, ignoring **bold**)
      const lowerCandidate = headerCandidate.toLowerCase();
      const isHeader = Object.keys(sectionPatterns).some(pattern => {
        const p = pattern.toLowerCase();
        return lowerCandidate === p ||
          lowerCandidate === p + ':' ||
          lowerCandidate.startsWith(p + ' ') ||
          lowerCandidate.startsWith(p + ':');
      });
      
      if (isHeader && headerCandidate.length > 0) {
        // Save previous section
        if (currentSection && currentSection.content.length > 0) {
          const style = getSectionStyle(currentSection.title);
          elements.push(
            <div key={`section-${sectionKey}`} className="mb-4">
              <div className={`flex items-start gap-3 p-4 rounded-lg border ${style.container}`}>
                <span className="text-2xl flex-shrink-0 mt-1">{style.emoji}</span>
                <div className="flex-1">
                  <h4 className={`text-base font-bold mb-2 font-['Merriweather'] ${style.title}`}>
                    {currentSection.title}
                  </h4>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {currentSection.content.join('\n').trim()}
                  </div>
                </div>
              </div>
            </div>
          );
          sectionKey++;
        }
        
        // Start new section
        currentSection = {
          title: headerCandidate.replace(/:$/, '').trim(),
          content: []
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
      const style = getSectionStyle(currentSection.title);
      elements.push(
        <div key={`section-${sectionKey}`} className="mb-4">
          <div className={`flex items-start gap-3 p-4 rounded-lg border ${style.container}`}>
            <span className="text-2xl flex-shrink-0 mt-1">{style.emoji}</span>
            <div className="flex-1">
              <h4 className={`text-base font-bold mb-2 font-['Merriweather'] ${style.title}`}>
                {currentSection.title}
              </h4>
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {currentSection.content.join('\n').trim()}
              </div>
            </div>
          </div>
        </div>
      );
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
                  out of {scoreMatch[2]}
                </div>
              </div>
            </div>
          </div>
        )}
        {elements}
      </div>
    );
  };

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
      new RegExp(`(?:3\\.?\\s*)?Corrected\\s+Version[:\\s]+([\\s\\S]+?)${endPattern}`, 'i'),
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

  const correctedVersion = grammarFeedback ? extractCorrectedVersion(grammarFeedback) : null;

  // Enhanced cleanup function for user audio
  const cleanupUserAudio = () => {
    console.log('AIFeedbackWithParametersPage - Cleaning up user audio');
    if (userAudioRef.current) {
      userAudioRef.current.pause();
      userAudioRef.current.currentTime = 0;
      userAudioRef.current = null;
    }
    setIsPlayingUserAudio(false);
  };

  const resetQuestionState = () => {
    activeQuestionRunRef.current += 1;

    setUserAnswer("");
    setGrammarFeedback("");
    setParametersFeedback("");
    setIsGettingFeedback(false);
    setUserRecordedAudio(null);
    setFeedbackInPortuguese("");
    setParametersInPortuguese("");
    setIsTranslating(false);
    setIsTranslatingParameters(false);
    setDetailedCorrection("");
    setShowDetailedCorrection(false);
    setIsLoadingParameters(false);
    setIsActivityCompleted(false);
    
    // Reset pronunciation state
    setPronunciationResult(null);
    setIsEvaluatingPronunciation(false);
    setShowPronunciationMistakes(false);
    setPronunciationMistakesSlideIndex(0);
    
    // Clean up any playing/preview audio
    cleanupUserAudio();
    try { cancelAudio(); } catch (e) { /* no-op */ }
    
    setIsPlayingCorrectedAudio(false);
    if (correctedAudioRef.current) {
      correctedAudioRef.current.pause();
      correctedAudioRef.current.currentTime = 0;
    }
  };

  // Enhanced effect to reset state whenever the question changes
  useEffect(() => {
    console.log('AIFeedbackWithParametersPage - Question changed to index:', questionIndex);
    if (questions.length > 0 && questionIndex >= questions.length) {
      setQuestionIndex(0);
      return;
    }
    resetQuestionState();
  }, [lessonId, questionIndex, currentQuestion, questions.length]);

  useEffect(() => {
    return () => {
      console.log('AIFeedbackWithParametersPage - Component unmounting, cleaning up audio');
      activeQuestionRunRef.current += 1;
      cleanupUserAudio();
      try { cancelAudio(); } catch (e) { /* no-op */ }
    };
  }, []);

  const handlePlayUserAudio = () => {
    if (!userRecordedAudio) return;

    if (isPlayingUserAudio) {
      if (userAudioRef.current) {
        userAudioRef.current.pause();
        userAudioRef.current.currentTime = 0;
      }
      setIsPlayingUserAudio(false);
      return;
    }

    try {
      if (userAudioRef.current) {
        userAudioRef.current.pause();
      }

      const audioUrl = URL.createObjectURL(userRecordedAudio);
      const audioElement = new Audio(audioUrl);
      audioElement.playbackRate = 1.0;
      
      audioElement.onended = () => {
        setIsPlayingUserAudio(false);
        URL.revokeObjectURL(audioUrl);
        userAudioRef.current = null;
      };

      audioElement.onerror = () => {
        console.error('Error playing user audio');
        setIsPlayingUserAudio(false);
        URL.revokeObjectURL(audioUrl);
        userAudioRef.current = null;
      };

      userAudioRef.current = audioElement;
      setIsPlayingUserAudio(true);
      audioElement.play();
    } catch (error) {
      console.error('Error setting up user audio playback:', error);
      setIsPlayingUserAudio(false);
    }
  };

  const handlePlayUserAudioSlow = () => {
    if (!userRecordedAudio) return;

    try {
      if (userAudioRef.current) {
        userAudioRef.current.pause();
      }

      const audioUrl = URL.createObjectURL(userRecordedAudio);
      const audioElement = new Audio(audioUrl);
      audioElement.playbackRate = 0.75;
      
      audioElement.onended = () => {
        setIsPlayingUserAudio(false);
        URL.revokeObjectURL(audioUrl);
        userAudioRef.current = null;
      };

      audioElement.onerror = () => {
        console.error('Error playing user audio slow');
        setIsPlayingUserAudio(false);
        URL.revokeObjectURL(audioUrl);
        userAudioRef.current = null;
      };

      userAudioRef.current = audioElement;
      setIsPlayingUserAudio(true);
      audioElement.play();
    } catch (error) {
      console.error('Error setting up slow user audio playback:', error);
      setIsPlayingUserAudio(false);
    }
  };

  const handlePlayCorrectedAudio = async (correctedText: string) => {
    if (isPlayingCorrectedAudio) {
      if (correctedAudioRef.current) {
        correctedAudioRef.current.pause();
        correctedAudioRef.current.currentTime = 0;
      }
      setIsPlayingCorrectedAudio(false);
      return;
    }

    try {
      setIsPlayingCorrectedAudio(true);
      await handleSpeakMessage(0, correctedText);
      setIsPlayingCorrectedAudio(false);
    } catch (error) {
      console.error('Error playing corrected audio:', error);
      setIsPlayingCorrectedAudio(false);
    }
  };

  const handlePlayCorrectedAudioSlow = async (correctedText: string) => {
    if (isPlayingCorrectedAudio) {
      if (correctedAudioRef.current) {
        correctedAudioRef.current.pause();
        correctedAudioRef.current.currentTime = 0;
      }
      setIsPlayingCorrectedAudio(false);
      return;
    }

    try {
      setIsPlayingCorrectedAudio(true);
      const response = await supabase.functions.invoke('speak-elevenlabs', {
        body: {
          text: correctedText,
          voice_id: learningLanguage === 'es' ? 'pNInz6obpgDQGcFmaJgB' : 'ErXwobaYiN019PkySvjV',
          speed: 0.8
        }
      });

      if (response.data?.audio_url) {
        const audio = new Audio(response.data.audio_url);
        correctedAudioRef.current = audio;
        
        audio.onended = () => {
          setIsPlayingCorrectedAudio(false);
          correctedAudioRef.current = null;
        };

        await audio.play();
      }
    } catch (error) {
      console.error('Error playing slow corrected audio:', error);
      handlePlayCorrectedAudio(correctedText);
    }
  };

  const handleStartRecording = async () => {
    console.log("Starting recording process");
    try {
      await handleMicButtonClick();
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a gravação. Verifique suas permissões.",
        variant: "destructive",
      });
    }
  };

  const handleSendRecording = async () => {
    console.log("Sending recorded audio for transcription");
    const requestRunId = activeQuestionRunRef.current;
    try {
      const result = await sendAudio();
      const { recordedAudio, transcribedText } = result;
      console.log("Voice input result:", { 
        hasRecordedAudio: !!recordedAudio, 
        transcribedText: transcribedText 
      });
      if (activeQuestionRunRef.current !== requestRunId) return;
      
      if (transcribedText) {
        setUserAnswer(transcribedText);
        if (recordedAudio) {
          setUserRecordedAudio(recordedAudio);
          console.log("Stored user recorded audio");
        }
        console.log("Auto-submitting answer for feedback:", transcribedText);
        await submitAnswer(transcribedText, recordedAudio);
      } else {
        console.log("No transcribed text received");
        toast({
          title: "Erro",
          description: "Não foi possível transcrever o áudio. Tente gravar novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error with voice input:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro durante a transcrição. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const submitAnswer = async (answer: string, recordedAudio?: Blob | null) => {
    if (!answer.trim()) return;
    const requestRunId = activeQuestionRunRef.current;
    const requestQuestion = currentQuestion;
    
    console.log("Submitting answer for feedback:", answer);
    console.log("Has recorded audio:", !!recordedAudio);
    
    setIsGettingFeedback(true);

    try {
      // First API call: Grammar feedback (without relevance section)
      const grammarPromptEnglish = `You are an English teacher evaluating a student's written answer for grammar and language quality only.

Please provide your response in three clearly labeled sections. Use clean formatting with each section title on its own line followed by a paragraph break. Do not use markdown, bullet points, or asterisks.

1. Score
Write the score in the format: Score: X/10 (e.g., Score: 7/10)

SCORING GUIDELINES - Be generous with scores:
- 10/10: Only for perfect answers with no errors
- 8-9/10: Good answers with minor errors
- 6-7/10: Decent answers that communicate the idea despite some errors
- 4-5/10: Answers with significant errors but still understandable
- 1-3/10: Very problematic answers that are hard to understand

Most reasonable attempts should score 6 or above. Don't be overly strict.

2. Grammar and structure
Give a general evaluation of the quality of the text regarding grammar and structure. Do not correct punctuation marks (commas, periods, question marks, etc.) or capitalization errors. Focus only on grammar, vocabulary, and sentence structure. You don't need to point out specific mistakes but just mention that there were some, if there were and give a general evaluation. In the end remind the reader that he can check his grammar mistakes in detail(if there were) by clicking the button "Correção Detalhada"

3. Corrected Version
Write the student's answer with corrections applied ONLY if there are grammar mistakes or if the content is unclear or difficult to understand or not related to the context. Do not correct punctuation or capitalization. If some words seem to not fit the question or context at all it is possible that it was suppose to be another word with similar sound, so you can replace with that one. The goal is strict correction only, not style improvement. If there are no corrections, just write down the exact phrase the student said but always write down the phrase after "Corrected Version."

Keep each section short and clear. Do not include suggestions, praise, or extra explanations.

Question: ${currentQuestion}
Student Answer: ${answer}`;

      const grammarPromptSpanish = `Eres un profesor de español que evalúa la respuesta escrita de un estudiante solo para gramática y calidad del idioma. Toda tu respuesta debe estar en español.

Proporciona tu respuesta en tres secciones claramente etiquetadas. Utiliza un formato limpio con cada título de sección en su propia línea seguido de un salto de párrafo. No uses markdown, viñetas o asteriscos.

1. Puntuación
Escribe la puntuación en el formato: Puntuación: X/10 (ej., Puntuación: 7/10)

GUÍA DE PUNTUACIÓN - Sé generoso con las puntuaciones:
- 10/10: Solo para respuestas perfectas sin errores
- 8-9/10: Buenas respuestas con errores menores
- 6-7/10: Respuestas decentes que comunican la idea a pesar de algunos errores
- 4-5/10: Respuestas con errores significativos pero aún comprensibles
- 1-3/10: Respuestas muy problemáticas difíciles de entender

La mayoría de los intentos razonables deben puntuar 6 o más. No seas demasiado estricto.

2. Análisis gramatical
Señala cualquier error gramatical o de ortografía en la respuesta del estudiante. Al analizar la gramática, ignora los signos de puntuación (comas, puntos, signos de interrogación, signos de exclamación) y los errores de mayúsculas. Céntrate únicamente en la estructura gramatical, la elección de palabras y la construcción de frases.

3. Versión corregida
Escribe la respuesta del estudiante con las correcciones aplicadas SÓLO si hay errores gramaticales o si el contenido es poco claro, difícil de entender o no está relacionado con el contexto. Si algunas palabras no parecen encajar en absoluto con la pregunta o el contexto, es posible que debieran ser otra palabra con un sonido similar, así que puedes reemplazarla por esa. El objetivo es una corrección estricta únicamente, no mejora de estilo. Si no hay correcciones, simplemente escribe la frase exacta que dijo el estudiante, pero siempre escribe la frase después de "Versión corregida".

Mantén cada sección corta y clara. No incluyas sugerencias, elogios o explicaciones adicionales.

Pregunta: ${currentQuestion}
Respuesta del estudiante: ${answer}`;

      const grammarSystemPrompt = learningLanguage === 'es' ? grammarPromptSpanish : grammarPromptEnglish;

      // Get grammar feedback
      const grammarResponse = await sendMessage(
        `Please provide grammar feedback on this answer: "${answer}"`,
        grammarSystemPrompt
      );
      
      if (grammarResponse) {
        console.log("Received grammar feedback from AI:", grammarResponse);
        if (activeQuestionRunRef.current !== requestRunId) return;
        setGrammarFeedback(grammarResponse);
        
        // Auto-translate to Portuguese for beginner/intermediate levels
        if (shouldShowPortugueseOnly(difficulty)) {
          // Extract the corrected version to preserve it in English
          const correctedVersionMatch = grammarResponse.match(/3\.\s*Corrected Version:?\s*(.+?)$/s);
          const correctedVersionText = correctedVersionMatch ? correctedVersionMatch[0] : '';
          
          // Get everything except the corrected version for translation
          const feedbackWithoutCorrected = grammarResponse.replace(/3\.\s*Corrected Version:?\s*.+$/s, '').trim();
          
          const translatePrompt = `Translate the following English teacher feedback to Portuguese (Brazilian). 

Instructions:
- Translate all text naturally to Portuguese
- Keep the section numbers and titles in the structure
- Preserve the structure and formatting

Feedback to translate:
${feedbackWithoutCorrected}`;
          
          try {
            const portugueseResponse = await sendMessage(
              translatePrompt,
              "You are a translator specializing in educational content."
            );
            
            if (portugueseResponse && correctedVersionText) {
              if (activeQuestionRunRef.current !== requestRunId) return;
              // Append the original (untranslated) corrected version in English
              setFeedbackInPortuguese(`${portugueseResponse}\n\n${correctedVersionText}`);
            } else if (portugueseResponse) {
              if (activeQuestionRunRef.current !== requestRunId) return;
              setFeedbackInPortuguese(portugueseResponse);
            }
          } catch (error) {
            console.error("Error auto-translating feedback:", error);
          }
        }
      }

      // Second API call: Custom parameters feedback (only if parameters exist)
      if (evaluationParameters.length > 0) {
        if (activeQuestionRunRef.current !== requestRunId) return;
        console.log("Making custom parameters API call with:", evaluationParameters);
        setIsLoadingParameters(true);
        
        try {
          const customSystemPrompt = evaluationParameters.join('\n\n');
          const parametersSystemPrompt = `${customSystemPrompt}

Question: ${currentQuestion}
Student Answer: ${answer}`;

          console.log("Custom system prompt:", parametersSystemPrompt);

          const parametersResponse = await sendMessage(
            `Please evaluate this answer according to the custom parameters: "${answer}"`,
            parametersSystemPrompt
          );
          
          console.log("Raw parameters response:", parametersResponse);
          console.log("Parameters response type:", typeof parametersResponse);
          
          if (parametersResponse) {
            if (activeQuestionRunRef.current !== requestRunId) return;
            console.log("Setting parametersFeedback with:", parametersResponse);
            // Ensure we handle the response properly - it might be an object or string
            let formattedResponse = '';
            
            if (typeof parametersResponse === 'object' && parametersResponse !== null) {
              formattedResponse = JSON.stringify(parametersResponse, null, 2);
            } else if (typeof parametersResponse === 'string') {
              // Use the string response directly, no need to parse and reformat
              formattedResponse = parametersResponse;
            } else {
              // Fallback to string conversion
              formattedResponse = String(parametersResponse);
            }
            
            setParametersFeedback(formattedResponse);
            console.log("parametersFeedback set successfully");
            
            // Auto-translate parameters to Portuguese for beginner/intermediate levels
            if (shouldShowPortugueseOnly(difficulty)) {
              try {
                const portugueseParams = await sendMessage(
                  `Please translate this feedback to Portuguese: ${formattedResponse}`,
                  "You are a translator. Translate the given text to Portuguese while preserving the structure and formatting."
                );
                
                if (portugueseParams) {
                  if (activeQuestionRunRef.current !== requestRunId) return;
                  setParametersInPortuguese(portugueseParams);
                }
              } catch (error) {
                console.error("Error auto-translating parameters:", error);
              }
            }
          } else {
            console.log("No parameters response received");
          }
        } catch (error) {
          console.error("Error in custom parameters API call:", error);
          if (activeQuestionRunRef.current !== requestRunId) return;
          setParametersFeedback(`Error processing custom parameters evaluation. Raw response: ${JSON.stringify(error, null, 2)}`);
        } finally {
          if (activeQuestionRunRef.current === requestRunId) {
            setIsLoadingParameters(false);
          }
        }
      } else {
        console.log("No evaluation parameters to process");
      }

    } catch (error) {
      console.error("Error getting feedback:", error);
      if (activeQuestionRunRef.current !== requestRunId) return;
      setGrammarFeedback(t('feedback_error'));
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
      await handleSpeakMessage(0, word);
    } catch (error) {
      console.error('Error playing word audio:', error);
    } finally {
      setIsPlayingMistakeAudio(false);
    }
  };

  const translateParametersToPortuguese = async () => {
    if (!parametersFeedback || isTranslatingParameters) return;
    
    setIsTranslatingParameters(true);
    try {
      const response = await sendMessage(
        `Please translate this feedback to Portuguese: ${parametersFeedback}`,
        "You are a translator. Translate the given text to Portuguese while preserving the structure and formatting."
      );
      
      if (response) {
        setParametersInPortuguese(response);
      }
    } catch (error) {
      console.error("Error translating parameters feedback:", error);
    } finally {
      setIsTranslatingParameters(false);
    }
  };

  const handleDetailedCorrection = async () => {
    if (!userAnswer.trim() || !correctedVersion) return;
    
    const correction = await getDetailedCorrection(userAnswer, correctedVersion, currentQuestion, difficulty);
    if (correction) {
      setDetailedCorrection(correction);
      setShowDetailedCorrection(true);
    }
  };

  const handleSubmitAnswer = () => {
    submitAnswer(userAnswer);
  };

  const handleSkipQuestion = () => {
    resetQuestionState();
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else if (onFinish) {
      onFinish();
    } else if (onNext) {
      onNext();
    }
  };

  const handleNextQuestion = () => {
    resetQuestionState();
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else if (onFinish) {
      onFinish();
    } else if (onNext) {
      onNext();
    }
  };

  const resetActivity = () => {
    setQuestionIndex(0);
    resetQuestionState();
  };


  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl mx-auto">
          <div className="p-8 text-center">
            <p className="text-gray-600">{t('no_questions_available')}</p>
            {onBack && (
              <Button onClick={onBack} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div data-no-word-click className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {!isEmbedded && onBack && (
          <Button
            onClick={onBack}
            variant="ghost"
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              AI Feedback com Parâmetros
            </h1>
            {!isTeacherMode && (
              <div className="text-sm text-gray-600">
                Pergunta {questionIndex + 1} de {questions.length}
              </div>
            )}
          </div>
          {topic && (
            <p className="text-gray-600">Tópico: {topic}</p>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start space-x-3 mb-6">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                AI
              </div>
              <div className="flex-1">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className={`text-gray-800 ${
                    isTeacherMode && isFontLarge ? 'text-2xl' : ''
                  }`}>{currentQuestion}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sua resposta:
                </label>
                <Textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder={getPlaceholderText()}
                  className="min-h-[120px]"
                  disabled={isGettingFeedback}
                />
              </div>

              <div className="flex gap-2">
                {recordingState.status === 'idle' && (
                  <Button 
                    onClick={handleStartRecording}
                    className="flex items-center gap-2"
                    disabled={isGettingFeedback}
                  >
                    <Mic className="w-4 h-4" />
                    Gravar Resposta
                  </Button>
                )}
                
                {recordingState.status === 'recording' && (
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={stopRecording}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      Parar Gravação
                    </Button>
                    <span className="text-sm text-muted-foreground">Gravando...</span>
                  </div>
                )}
                
                {recordingState.status === 'preview' && recordingState.recordedAudio && (
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={playAudio}
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={isPlaying}
                    >
                      <Play className="w-4 h-4" />
                      {isPlaying ? 'Reproduzindo...' : 'Ouvir Gravação'}
                    </Button>
                    <Button 
                      onClick={handleSendRecording}
                      className="flex items-center gap-2"
                      disabled={isTranscribing}
                    >
                      <Check className="w-4 h-4" />
                      {isTranscribing ? 'Transcrevendo...' : 'Enviar Resposta'}
                    </Button>
                    <Button 
                      onClick={cancelAudio}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Cancelar
                    </Button>
                  </div>
                )}
                  
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswer.trim() || isGettingFeedback}
                  size="sm"
                >
                  {isGettingFeedback ? "Enviando..." : "Enviar Resposta"}
                </Button>
              </div>
            </div>
          </Card>

          {(grammarFeedback || parametersFeedback || isLoadingParameters) && (
            <Card className="p-6 pb-16 md:pb-6">
              {grammarFeedback && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Análise Gramatical:</h3>
                  
                  {/* Show only Portuguese for beginner/intermediate, show English otherwise */}
                  {shouldShowPortugueseOnly(difficulty) ? (
                    // Portuguese only version
                    <>
                      {feedbackInPortuguese ? (
                        <div className="rounded-lg">
                          {formatFeedbackText(feedbackInPortuguese)}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                            <span className="text-sm text-gray-600">Preparando explicação em português...</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // English with optional Portuguese button (current behavior)
                    <div className="rounded-lg">
                      {formatFeedbackText(grammarFeedback)}
                    </div>
                  )}
                  
                  {/* Audio comparison section - only show when there's recorded audio and grammar feedback */}
                  {userRecordedAudio && (
                    <div className="space-y-4 mb-6">
                      {/* What you said section */}
                      <Card className="border-0 bg-orange-50 px-3 md:px-6 py-3 md:py-4 shadow-none rounded-lg">
                        <div className="p-0 mb-2">
                          <h4 className="text-base text-orange-900 font-semibold">O que você disse</h4>
                        </div>
                        <div className="p-0 flex justify-center gap-2">
                          <Button
                            onClick={handlePlayUserAudio}
                            variant="outline"
                            className="flex items-center gap-2"
                            disabled={!userRecordedAudio}
                          >
                            {isPlayingUserAudio ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            {isPlayingUserAudio ? 'Pausar' : 'Ouvir sua resposta'}
                          </Button>
                          <Button
                            onClick={handlePlayUserAudioSlow}
                            variant="outline"
                            size="icon"
                            className="flex items-center"
                            disabled={!userRecordedAudio}
                            title="Reproduzir mais devagar"
                          >
                            🐢
                          </Button>
                        </div>
                      </Card>

                      {/* Corrected version section */}
                      {correctedVersion && (
                        <Card className="border-0 bg-green-50 px-3 md:px-6 py-3 md:py-4 shadow-none rounded-lg">
                          <div className="p-0 mb-2">
                            <h4 className="text-base text-green-900 font-semibold">Como um nativo falaria</h4>
                          </div>
                          <div className="p-0 flex justify-center gap-2">
                            <Button
                              onClick={() => handlePlayCorrectedAudio(correctedVersion)}
                              variant="outline"
                              className="flex items-center gap-2"
                              disabled={isPlayingCorrectedAudio}
                            >
                              {isPlayingCorrectedAudio ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                              {isPlayingCorrectedAudio ? 'Pausar nativo' : 'Ouvir nativo'}
                            </Button>
                            <Button
                              onClick={() => handlePlayCorrectedAudioSlow(correctedVersion)}
                              variant="outline"
                              size="icon"
                              className="flex items-center"
                              disabled={isPlayingCorrectedAudio}
                              title="Reproduzir mais devagar"
                            >
                              🐢
                            </Button>
                          </div>
                        </Card>
                      )}

                      {/* Debug info for corrected version extraction */}
                      {!correctedVersion && (
                        <div className="text-xs text-gray-500 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          Debug: No corrected version extracted from feedback. This might indicate that the AI did not provide a corrected version in the expected format.
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Correção Detalhada button positioned after grammar analysis */}
                  {userAnswer.trim() && (
                    <Button
                      onClick={handleDetailedCorrection}
                      variant="outline"
                      size="sm"
                      disabled={isDetailedCorrectionLoading}
                      className="mb-4"
                    >
                      {isDetailedCorrectionLoading ? "Analisando..." : "Correção Detalhada"}
                    </Button>
                  )}
                  
                  {/* Pronunciation evaluation section - only show when there's recorded audio */}
                  {userRecordedAudio && (
                    <div className="mt-4">
                      {isEvaluatingPronunciation ? (
                        <Card className="border-0 bg-purple-50 px-3 md:px-6 py-3 md:py-4 shadow-none rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                            <span className="text-sm text-purple-600">Avaliando pronúncia...</span>
                          </div>
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
                          <div className="p-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">🗣️</span>
                                <h4 className={`text-base font-semibold ${
                                  getMispronouncedWords().length > 0 ? 'text-red-900' : 'text-green-900'
                                }`}>
                                  Pronúncia
                                </h4>
                              </div>
                              <div className={`text-sm font-medium ${
                                getMispronouncedWords().length > 0 ? 'text-red-700' : 'text-green-700'
                              }`}>
                                {getMispronouncedWords().length > 0 ? (
                                  <span>{getMispronouncedWords().length} erro{getMispronouncedWords().length !== 1 ? 's' : ''} • Clique para ver</span>
                                ) : (
                                  <span>✓ Nenhum erro</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Show loading indicator for parameters */}
              {isLoadingParameters && !parametersFeedback && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">Correção de acordo com os parâmetros:</h3>
                  <div className="bg-blue-50 rounded-lg p-4 mb-4 border-2 border-blue-200">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-600">Processando avaliação customizada...</span>
                    </div>
                  </div>
                </div>
              )}
              
              {parametersFeedback && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">Correção de acordo com os parâmetros:</h3>
                  
                  {/* Show only Portuguese for beginner/intermediate */}
                  {shouldShowPortugueseOnly(difficulty) ? (
                    <>
                      {parametersInPortuguese ? (
                        <div className="rounded-lg mb-4 max-h-96 overflow-y-auto">
                          {formatFeedbackText(parametersInPortuguese)}
                        </div>
                      ) : (
                        <div className="bg-blue-50 rounded-lg p-4 mb-4 border-2 border-blue-200">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-blue-600">Preparando explicação em português...</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // English with optional translation button (current behavior)
                    <>
                      <div className="rounded-lg mb-4 max-h-96 overflow-y-auto">
                        {formatFeedbackText(parametersFeedback)}
                      </div>
                      
                      {/* Translate Parameters button positioned after parameters analysis */}
                      {learningLanguage !== 'pt' as any && (
                        <Button
                          onClick={translateParametersToPortuguese}
                          variant="outline"
                          size="sm"
                          disabled={isTranslatingParameters}
                          className="mb-4"
                        >
                          {isTranslatingParameters ? "Traduzindo..." : "Traduzir para Português"}
                        </Button>
                      )}
                      
                      {parametersInPortuguese && (
                        <div className="rounded-lg mt-4">
                          <h4 className="font-semibold mb-3 text-blue-900">Em Português:</h4>
                          {formatFeedbackText(parametersInPortuguese)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </Card>
          )}

          {parametersInPortuguese && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Correção de acordo com os parâmetros (Português):</h3>
              <div className="rounded-lg">
                {formatFeedbackText(parametersInPortuguese)}
              </div>
            </Card>
          )}

          {!isTeacherMode && (
            <div className="flex gap-4 justify-end">
              <Button
                onClick={handleSkipQuestion}
                variant="outline"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Pular Pergunta
              </Button>
              
              {(grammarFeedback || parametersFeedback) && questionIndex < questions.length - 1 && (
                <Button onClick={handleNextQuestion}>
                  Próxima Pergunta
                  <SkipForward className="h-4 w-4 ml-2" />
                </Button>
              )}

              {questionIndex === questions.length - 1 && (onFinish || onNext) && (
                <Button onClick={handleNextQuestion} disabled={isGettingFeedback || isLoadingParameters}>
                  {isLastLessonPage ? 'Concluir' : 'Próxima Página'}
                  <SkipForward className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <DetailedCorrectionModal
        isOpen={showDetailedCorrection}
        onClose={() => setShowDetailedCorrection(false)}
        correctedText={detailedCorrection}
        originalText={userAnswer}
        cleanCorrectedVersion={correctedVersion}
      />

      {/* Pronunciation Mistakes Modal */}
      <Dialog open={showPronunciationMistakes} onOpenChange={setShowPronunciationMistakes}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Palavras com erro de pronúncia</DialogTitle>
          </DialogHeader>
          
          {getMispronouncedWords().length > 0 && (
            <div className="space-y-6">
              {/* Slide indicator */}
              <div className="text-center text-sm text-gray-500">
                {pronunciationMistakesSlideIndex + 1} de {getMispronouncedWords().length}
              </div>
              
              {/* Word display */}
              <div className="text-center py-8">
                <p className="text-4xl font-bold text-gray-900 mb-4">
                  {getMispronouncedWords()[pronunciationMistakesSlideIndex]?.word}
                </p>
                <Button
                  onClick={() => handlePlayMistakeWord(getMispronouncedWords()[pronunciationMistakesSlideIndex]?.word)}
                  variant="outline"
                  className="flex items-center gap-2 mx-auto"
                  disabled={isPlayingMistakeAudio}
                >
                  <Volume2 className="h-4 w-4" />
                  {isPlayingMistakeAudio ? 'Reproduzindo...' : 'Ouvir pronúncia correta'}
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
                  Anterior
                </Button>
                
                <Button
                  onClick={() => setPronunciationMistakesSlideIndex(prev => 
                    Math.min(getMispronouncedWords().length - 1, prev + 1)
                  )}
                  variant="outline"
                  disabled={pronunciationMistakesSlideIndex === getMispronouncedWords().length - 1}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIFeedbackWithParametersPage;