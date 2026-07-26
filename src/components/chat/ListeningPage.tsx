
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader, Volume2, VolumeX, Mic, Play, Pause, HelpCircle, RefreshCw, SkipForward, Turtle } from "lucide-react";
import { useChatApi } from "@/hooks/use-chat-api";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { RecordingIndicator, StopRecordingButton, AudioPreview } from "@/components/ui/input";
import { useLanguage, LearningLanguage } from "@/contexts/LanguageContext";
import { getCachedAudioUrl, generateAndCacheListeningAudio } from "@/utils/listeningUtils";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ListeningQuestion {
  originalText: string;
}

interface ListeningPageProps {
  questions?: ListeningQuestion[];
  learningLanguage?: LearningLanguage;
  lessonId?: string;
  selectedDifficulty?: string;
  nextSignal?: number;
  onStateChange?: (state: { currentQuestionIndex: number; totalQuestions: number; isActivityCompleted: boolean; }) => void;
  onComplete?: () => void;
  presetAudioUrl?: string;
}

const ListeningPage: React.FC<ListeningPageProps> = ({ 
  questions: propQuestions, 
  learningLanguage: propLearningLanguage,
  lessonId: propLessonId,
  selectedDifficulty: propSelectedDifficulty = "medium",
  nextSignal = 0,
  onStateChange,
  onComplete,
  presetAudioUrl
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { learningLanguage: contextLearningLanguage } = useLanguage();
  const learningLanguage = propLearningLanguage || contextLearningLanguage;

  // Improved lessonId extraction with proper validation
  const extractLessonId = (): string | null => {
    // Priority order: props > location state > fallback
    const possibleIds = [
      propLessonId,
      location.state?.lessonId,
      location.state?.lessonData?.lessonId,
      location.state?.listeningState?.lessonId
    ];

    for (const id of possibleIds) {
      if (id && typeof id === 'string' && id !== 'undefined' && id !== 'null' && id.length > 0) {
        console.log('ListeningPage - Valid lessonId found:', id);
        return id;
      }
    }
    
    console.warn('ListeningPage - No valid lessonId found in any source');
    return null;
  };

  const lessonId = extractLessonId();
  const selectedDifficulty = propSelectedDifficulty || location.state?.selectedDifficulty || location.state?.listeningState?.selectedDifficulty || "medium";

  console.log('ListeningPage - Initialization:', {
    propLessonId,
    propSelectedDifficulty,
    stateFromNavigation: location.state,
    finalLessonId: lessonId,
    finalSelectedDifficulty: selectedDifficulty,
    isValidLessonId: !!lessonId
  });

  const defaultQuestionsEn: ListeningQuestion[] = [
    {
      originalText: "I like to play soccer on the weekends."
    },
    {
      originalText: "She is studying English every day."
    }
  ];

  const defaultQuestionsEs: ListeningQuestion[] = [
    {
      originalText: "Me gusta jugar al fútbol los fines de semana."
    },
    {
      originalText: "Ella está estudiando español todos los días."
    }
  ];

  const defaultQuestions = learningLanguage === 'es' ? defaultQuestionsEs : defaultQuestionsEn;
  const questions = propQuestions || location.state?.questions || location.state?.listeningState?.questions || defaultQuestions;

  // Restore state from navigation if available
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    location.state?.currentQuestionIndex || location.state?.listeningState?.currentQuestionIndex || 0
  );
  const [userTranscription, setUserTranscription] = useState(
    location.state?.userTranscription || location.state?.listeningState?.userTranscription || ""
  );
  const [feedback, setFeedback] = useState<string | null>(
    location.state?.feedback || location.state?.listeningState?.feedback || null
  );
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const [isActivityCompleted, setIsActivityCompleted] = useState(
    location.state?.isActivityCompleted || location.state?.listeningState?.isActivityCompleted || false
  );
  const [userRecordedAudio, setUserRecordedAudio] = useState<Blob | null>(null);
  const [isUserAudioPlaying, setIsUserAudioPlaying] = useState(false);
  const [userAudioElement, setUserAudioElement] = useState<HTMLAudioElement | null>(null);
  
  // Enhanced audio state management - restore from navigation state
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(
    location.state?.listeningState?.currentAudioUrl || null
  );
  const [currentAudioElement, setCurrentAudioElement] = useState<HTMLAudioElement | null>(null);
  const [slowAudioElement, setSlowAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isSlowAudioPlaying, setIsSlowAudioPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioLoadingProgress, setAudioLoadingProgress] = useState<string>('');
  
  const { sendMessage } = useChatApi();
  const { toast } = useToast();
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
  } = useAudioRecording("listening", learningLanguage);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Setup audio elements when we have an audio URL
  useEffect(() => {
    if (currentAudioUrl) {
      // Setup regular audio element
      if (!currentAudioElement) {
        console.log('ListeningPage - Setting up regular audio element');
        const audio = new Audio(currentAudioUrl);
        
        audio.addEventListener('ended', () => {
          console.log('ListeningPage - Audio playback ended');
          setIsAudioPlaying(false);
        });
        
        audio.addEventListener('pause', () => {
          console.log('ListeningPage - Audio paused');
          setIsAudioPlaying(false);
        });
        
        audio.addEventListener('play', () => {
          console.log('ListeningPage - Audio started playing');
          setIsAudioPlaying(true);
          // Stop slow audio if playing
          if (slowAudioElement && isSlowAudioPlaying) {
            slowAudioElement.pause();
            setIsSlowAudioPlaying(false);
          }
        });

        setCurrentAudioElement(audio);
      }

      // Setup slow audio element
      if (!slowAudioElement) {
        console.log('ListeningPage - Setting up slow audio element');
        const slowAudio = new Audio(currentAudioUrl);
        slowAudio.playbackRate = 0.3;
        
        slowAudio.addEventListener('ended', () => {
          console.log('ListeningPage - Slow audio playback ended');
          setIsSlowAudioPlaying(false);
        });
        
        slowAudio.addEventListener('pause', () => {
          console.log('ListeningPage - Slow audio paused');
          setIsSlowAudioPlaying(false);
        });
        
        slowAudio.addEventListener('play', () => {
          console.log('ListeningPage - Slow audio started playing');
          setIsSlowAudioPlaying(true);
          // Stop regular audio if playing
          if (currentAudioElement && isAudioPlaying) {
            currentAudioElement.pause();
            setIsAudioPlaying(false);
          }
        });

        setSlowAudioElement(slowAudio);
      }
    }
  }, [currentAudioUrl, currentAudioElement, slowAudioElement, isAudioPlaying, isSlowAudioPlaying]);

  // If a preset audio URL is provided (from editor), initialize players immediately
  useEffect(() => {
    if (presetAudioUrl && !currentAudioUrl) {
      console.log('ListeningPage - Using presetAudioUrl from content');
      setCurrentAudioUrl(presetAudioUrl);
      const audio = new Audio(presetAudioUrl);
      const slow = new Audio(presetAudioUrl);
      slow.playbackRate = 0.3;
      setCurrentAudioElement(audio);
      setSlowAudioElement(slow);
    }
  }, [presetAudioUrl, currentAudioUrl]);

  // Report state changes to parent
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        currentQuestionIndex,
        totalQuestions: questions.length,
        isActivityCompleted
      });
    }
  }, [currentQuestionIndex, questions.length, isActivityCompleted, onStateChange]);

  // Listen for external next signals from navigation button
  useEffect(() => {
    if (nextSignal > 0) {
      handleSkipQuestion();
    }
  }, [nextSignal]);

  const handleAskSpecialist = () => {
    // Preserve current listening state with improved data including audio URL
    const listeningState = {
      lessonId,
      selectedDifficulty,
      questions,
      currentQuestionIndex,
      userTranscription,
      feedback,
      isActivityCompleted,
      currentAudioUrl, // Preserve the current audio URL
    };

    console.log('ListeningPage - Saving listening state for specialist (with audio URL):', listeningState);

    navigate('/specialist-help', {
      state: {
        returnPath: '/listening',
        listeningState
      }
    });
  };

  const handleLoadAudio = async () => {
    console.log('ListeningPage - handleLoadAudio called with:', { lessonId, selectedDifficulty });
    
    const question = questions[currentQuestionIndex];
    if (!question) {
      console.error('ListeningPage - No current question available');
      return;
    }

    // Validate text before attempting generation
    const textToSpeak = (question as any)?.originalText?.trim();
    if (!textToSpeak) {
      console.warn('ListeningPage - Missing originalText for current question');
      return;
    }

    console.log('ListeningPage - Loading audio for current question:', currentQuestionIndex);
    setIsLoadingAudio(true);
    setAudioLoadingProgress('Preparando...');

    // Stop any currently playing audio
    if (currentAudioElement && !currentAudioElement.paused) {
      currentAudioElement.pause();
    }

    try {
      let audioUrl: string | null = null;

      // Only try to get cached audio if we have a valid lessonId
      if (lessonId) {
        console.log('ListeningPage - Checking for cached audio with lessonId:', lessonId);
        setAudioLoadingProgress('Verificando cache...');
        audioUrl = await getCachedAudioUrl(lessonId, currentQuestionIndex, selectedDifficulty);
      } else {
        console.log('ListeningPage - No valid lessonId, skipping cache check');
      }
      
      // If no cached audio, generate new one
      if (!audioUrl) {
        console.log('ListeningPage - No cached audio found, generating new audio...');
        setAudioLoadingProgress('Gerando áudio...');
        
        if (lessonId) {
          // Use caching if we have a valid lessonId
          audioUrl = await generateAndCacheListeningAudio(
            lessonId,
            currentQuestionIndex,
            selectedDifficulty,
            textToSpeak
          );
        } else {
          // Generate audio without caching for invalid lessonId
          console.log('ListeningPage - Generating audio without caching due to invalid lessonId');
          setAudioLoadingProgress('Gerando áudio (sem cache)...');
          const { data, error } = await supabase.functions.invoke('speak-elevenlabs', {
            body: { text: textToSpeak }
          });
          
          if (error) {
            throw new Error(`Falha ao gerar áudio: ${error.message || 'Erro desconhecido'}`);
          }
          
          if (!data || !data.audioContent) {
            throw new Error('Resposta inválida do serviço de áudio');
          }

          // Convert base64 to blob and create object URL
          const base64ToAudioBlob = (base64: string): Blob => {
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            return new Blob([bytes], { type: 'audio/mpeg' });
          };

          const audioBlob = base64ToAudioBlob(data.audioContent);
          audioUrl = URL.createObjectURL(audioBlob);
        }
      } else {
        console.log('ListeningPage - Using cached audio URL:', audioUrl);
      }

      if (audioUrl) {
        console.log('ListeningPage - Audio URL obtained:', audioUrl);
        setCurrentAudioUrl(audioUrl);
        setAudioLoadingProgress('Carregando áudio...');
        
        // Create new audio element
        const audio = new Audio(audioUrl);
        
        audio.addEventListener('ended', () => {
          console.log('ListeningPage - Audio playback ended');
          setIsAudioPlaying(false);
        });
        
        audio.addEventListener('pause', () => {
          console.log('ListeningPage - Audio paused');
          setIsAudioPlaying(false);
        });
        
        audio.addEventListener('play', () => {
          console.log('ListeningPage - Audio started playing');
          setIsAudioPlaying(true);
        });

        audio.addEventListener('loadstart', () => {
          console.log('ListeningPage - Audio load started');
        });

        audio.addEventListener('canplaythrough', () => {
          console.log('ListeningPage - Audio can play through, ready for user interaction');
        });

        audio.addEventListener('error', (e) => {
          console.error('ListeningPage - Audio error:', e, audio.error);
          setIsAudioPlaying(false);
        });

        // Set the audio element immediately so the controls appear
        setCurrentAudioElement(audio);
        
        // Also set up slow audio
        const slowAudio = new Audio(audioUrl);
        slowAudio.playbackRate = 0.3;
        
        slowAudio.addEventListener('ended', () => {
          console.log('ListeningPage - Slow audio playback ended');
          setIsSlowAudioPlaying(false);
        });
        
        slowAudio.addEventListener('pause', () => {
          console.log('ListeningPage - Slow audio paused');
          setIsSlowAudioPlaying(false);
        });
        
        slowAudio.addEventListener('play', () => {
          console.log('ListeningPage - Slow audio started playing');
          setIsSlowAudioPlaying(true);
        });

        setSlowAudioElement(slowAudio);

        // Start loading the audio
        audio.load();
        slowAudio.load();
      }
    } catch (error: any) {
      console.error('ListeningPage - Error loading audio:', error);
      toast({
        title: "Erro ao carregar áudio",
        description: error.message || "Não foi possível gerar o áudio. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAudio(false);
      setAudioLoadingProgress('');
    }
  };

  const handlePlayAudio = () => {
    if (!currentAudioUrl) return;

    let audio = currentAudioElement;
    if (!audio) {
      console.log('ListeningPage - Initializing regular audio element lazily');
      audio = new Audio(currentAudioUrl);
      audio.addEventListener('ended', () => setIsAudioPlaying(false));
      audio.addEventListener('pause', () => setIsAudioPlaying(false));
      audio.addEventListener('play', () => setIsAudioPlaying(true));
      setCurrentAudioElement(audio);
    }

    if (isAudioPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  };

  const handleSlowAudioToggle = () => {
    if (!currentAudioUrl || !slowAudioElement) return;
    
    console.log('ListeningPage - Slow audio toggle requested');
    
    if (isSlowAudioPlaying) {
      console.log('Pausing slow audio');
      slowAudioElement.pause();
      setIsSlowAudioPlaying(false);
    } else {
      // Stop regular audio if playing
      if (currentAudioElement && isAudioPlaying) {
        currentAudioElement.pause();
        setIsAudioPlaying(false);
      }
      // Ensure playback rate is set to slow before playing
      slowAudioElement.playbackRate = 0.3;
      console.log('Playing slow audio at rate:', slowAudioElement.playbackRate);
      slowAudioElement.play().catch(error => {
        console.error('Error playing slow audio:', error);
      });
    }
  };

  const handlePlayUserAudio = () => {
    if (!userRecordedAudio) {
      console.log("No user recorded audio available");
      return;
    }

    if (isUserAudioPlaying && userAudioElement) {
      // Pause the currently playing audio
      console.log("Pausing user recorded audio");
      userAudioElement.pause();
      setIsUserAudioPlaying(false);
      return;
    }

    // Stop any existing audio before starting new one
    if (userAudioElement) {
      userAudioElement.pause();
      userAudioElement.src = '';
      setUserAudioElement(null);
    }

    console.log("Playing user recorded audio");
    const audio = new Audio(URL.createObjectURL(userRecordedAudio));
    
    audio.onended = () => {
      console.log("User audio playback ended");
      setIsUserAudioPlaying(false);
      setUserAudioElement(null);
    };
    
    audio.onerror = () => {
      console.error("Error playing user audio");
      setIsUserAudioPlaying(false);
      setUserAudioElement(null);
    };
    
    // Store the audio element reference
    setUserAudioElement(audio);
    setIsUserAudioPlaying(true);
    
    audio.play().catch(error => {
      console.error("Failed to play user audio:", error);
      setIsUserAudioPlaying(false);
      setUserAudioElement(null);
    });
  };

  const handleVoiceInput = async () => {
    console.log("Starting voice input process");
    try {
      const { recordedAudio, transcribedText } = await sendAudio();
      console.log("Voice input result:", { 
        hasRecordedAudio: !!recordedAudio, 
        transcribedText: transcribedText 
      });
      
      if (transcribedText) {
        setUserTranscription(transcribedText);
        // Store the recorded audio for later playback
        if (recordedAudio) {
          setUserRecordedAudio(recordedAudio);
          console.log("Stored user recorded audio");
        }
        // Auto-submit the transcription
        console.log("Auto-submitting transcription:", transcribedText);
        await submitTranscription(transcribedText, recordedAudio);
      }
    } catch (error) {
      console.error("Error with voice input:", error);
    }
  };

  const submitTranscription = async (transcription: string, recordedAudio?: Blob | null) => {
    if (!transcription.trim()) return;
    
    console.log("Submitting transcription:", transcription);
    console.log("Has recorded audio:", !!recordedAudio);
    
    setIsGettingFeedback(true);
    
    const teacherLanguage = learningLanguage === 'es' ? 'Spanish' : 'English';
    const systemPrompt = `You are a ${teacherLanguage} teacher evaluating the student's transcription of a listening activity.

Please return ONLY the following:

1. Score: Give a score from 0 to 10 based on how accurately the student transcribed the sentence.
2. Original sentence: Show the correct sentence that the audio said.

Keep it short. Do not include any corrections, suggestions, grammar explanations, or encouragement. Only return:

Score: X/10
Original sentence: [full correct sentence here]

The goal is to keep the feedback minimal and objective.`;

    try {
      const response = await sendMessage(
        `Please evaluate this listening transcription. Original: "${currentQuestion.originalText}" Student wrote: "${transcription}"`,
        systemPrompt
      );
      
      if (response) {
        console.log("Received feedback:", response);
        setFeedback(response);
      }
    } catch (error) {
      console.error("Error getting feedback:", error);
      setFeedback("Sorry, I couldn't provide feedback at this time. Please try again.");
    } finally {
      setIsGettingFeedback(false);
    }
  };

  const handleSubmitTranscription = async () => {
    await submitTranscription(userTranscription, userRecordedAudio);
  };

  const handleNextQuestion = () => {
    // Clean up audio before moving to next question
    if (userAudioElement) {
      userAudioElement.pause();
      userAudioElement.src = '';
      setUserAudioElement(null);
    }

    if (currentAudioElement) {
      currentAudioElement.pause();
      currentAudioElement.src = '';
      setCurrentAudioElement(null);
    }

    if (slowAudioElement) {
      slowAudioElement.pause();
      slowAudioElement.src = '';
      setSlowAudioElement(null);
    }

    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserTranscription("");
      setFeedback(null);
      setUserRecordedAudio(null);
      setIsUserAudioPlaying(false);
      setCurrentAudioUrl(null);
      setIsAudioPlaying(false);
      setIsSlowAudioPlaying(false);
    } else {
      setIsActivityCompleted(true);
      onComplete?.();
    }
  };

  const handleSkipQuestion = () => {
    console.log('Skipping current question');
    // Clean up audio before moving to next question
    if (userAudioElement) {
      userAudioElement.pause();
      userAudioElement.src = '';
      setUserAudioElement(null);
    }

    if (currentAudioElement) {
      currentAudioElement.pause();
      currentAudioElement.src = '';
      setCurrentAudioElement(null);
    }

    if (slowAudioElement) {
      slowAudioElement.pause();
      slowAudioElement.src = '';
      setSlowAudioElement(null);
    }

    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserTranscription("");
      setFeedback(null);
      setUserRecordedAudio(null);
      setIsUserAudioPlaying(false);
      setCurrentAudioUrl(null);
      setIsAudioPlaying(false);
      setIsSlowAudioPlaying(false);
    }
    // On last question, do nothing - just stay on the review
  };

  const resetActivity = () => {
    // Clean up all audio when resetting
    if (userAudioElement) {
      userAudioElement.pause();
      userAudioElement.src = '';
      setUserAudioElement(null);
    }

    if (currentAudioElement) {
      currentAudioElement.pause();
      currentAudioElement.src = '';
      setCurrentAudioElement(null);
    }

    if (slowAudioElement) {
      slowAudioElement.pause();
      slowAudioElement.src = '';
      setSlowAudioElement(null);
    }

    setCurrentQuestionIndex(0);
    setUserTranscription("");
    setFeedback(null);
    setIsActivityCompleted(false);
    setUserRecordedAudio(null);
    setIsUserAudioPlaying(false);
    setCurrentAudioUrl(null);
    setIsAudioPlaying(false);
    setIsSlowAudioPlaying(false);
  };


  console.log("ListeningPage render state:", {
    currentQuestionIndex,
    hasCurrentAudioUrl: !!currentAudioUrl,
    isLoadingAudio,
    isAudioPlaying,
    lessonId,
    selectedDifficulty,
    audioLoadingProgress
  });

  // Enhanced button disable logic
  const isLoadAudioDisabled = isGettingFeedback || isLoadingAudio;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">
          Listening Task {currentQuestionIndex + 1} of {questions.length}
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        <div className="flex items-center justify-center min-h-full">
          <div className="w-full max-w-2xl">
            <Card>
              <CardContent className="space-y-6 pt-6">
                {/* Instructions */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Listen to the audio and write what you hear in the text area below.
                  </p>
                </div>

                {/* Audio Controls */}
                <div className="flex justify-center gap-3">
                  {/* Load Audio Button - only show if no audio URL or if we need to reload */}
                  {!currentAudioUrl && (
                    <Button
                      onClick={handleLoadAudio}
                      variant="outline"
                      size="lg"
                      className="flex items-center gap-2"
                      disabled={isLoadAudioDisabled}
                    >
                      {isLoadingAudio ? (
                        <>
                          <Loader className="h-5 w-5 animate-spin" />
                          <span className="text-sm">{audioLoadingProgress || "Carregando..."}</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-5 w-5" />
                          Start
                        </>
                      )}
                    </Button>
                  )}

                  {/* Play/Pause Button - show when audio is loaded */}
                  {currentAudioUrl && currentAudioElement && (
                    <Button
                      onClick={handlePlayAudio}
                      variant="outline"
                      size="lg"
                      className="flex items-center gap-2"
                      disabled={isGettingFeedback}
                    >
                      {isAudioPlaying ? (
                        <VolumeX className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                      {isAudioPlaying ? "Stop Audio" : "Play Audio"}
                    </Button>
                  )}

                  {/* Turtle Button for Slow Audio - show when audio is loaded */}
                  {currentAudioUrl && slowAudioElement && (
                    <Button
                      onClick={handleSlowAudioToggle}
                      variant="outline"
                      size="lg"
                      className="flex items-center gap-2"
                      disabled={isGettingFeedback}
                      title="Play at slower speed"
                    >
                      {isSlowAudioPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Turtle className="h-5 w-5" />
                      )}
                      {isSlowAudioPlaying ? "Stop Slow Audio" : "Play Slow"}
                    </Button>
                  )}

                </div>

                {/* Transcription Input */}
                <div className="space-y-4">
                  <div className="relative">
                    <Textarea
                      value={userTranscription}
                      onChange={(e) => setUserTranscription(e.target.value)}
                      placeholder="Type what you hear here..."
                      className="min-h-[120px] pr-12"
                      disabled={isGettingFeedback || feedback !== null || recordingState.status === 'recording'}
                    />
                    <Button
                      onClick={handleMicButtonClick}
                      variant="outline"
                      size="icon"
                      className="absolute bottom-3 right-3"
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
                  
                  {!feedback && (
                    <div className="space-y-3">
                      <Button
                        onClick={handleSubmitTranscription}
                        disabled={!userTranscription.trim() || isGettingFeedback}
                        className="w-full"
                      >
                        {isGettingFeedback ? (
                          <div className="flex items-center gap-2">
                            <Loader className="h-4 w-4 animate-spin" />
                            Getting Feedback...
                          </div>
                        ) : (
                          "Submit Transcription"
                        )}
                      </Button>
                      
                      <Button
                        onClick={handleSkipQuestion}
                        variant="outline"
                        disabled={isGettingFeedback || recordingState.status === 'recording'}
                        className="w-full flex items-center gap-2"
                      >
                        <SkipForward className="h-4 w-4" />
                        {isLastQuestion ? "Complete Activity" : "Skip to Next Task"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* AI Feedback */}
                {feedback && (
                  <div className="space-y-4" data-no-word-click>
                    <Card className="border-purple-200 bg-purple-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-purple-800">Listening Feedback</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-gray-700 whitespace-pre-wrap">
                          {feedback}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Audio comparison sections - show when user has recorded audio and feedback */}
                    {userRecordedAudio && feedback && (
                      <div className="space-y-4">
                        {/* What you said section */}
                        <Card className="border-orange-200 bg-orange-50">
                          <CardHeader>
                            <CardTitle className="text-lg text-orange-800">O que você falou:</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-center">
                              <Button
                                onClick={handlePlayUserAudio}
                                variant="outline"
                                className="flex items-center gap-2"
                                disabled={!userRecordedAudio}
                              >
                                {isUserAudioPlaying ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                                {isUserAudioPlaying ? "Pause Your Audio" : "Play Your Audio"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Original version section */}
                        <Card className="border-green-200 bg-green-50">
                          <CardHeader>
                            <CardTitle className="text-lg text-green-800">Versão original:</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-center">
                              <Button
                                onClick={handlePlayAudio}
                                variant="outline"
                                className="flex items-center gap-2"
                                disabled={!currentAudioUrl || !currentAudioElement}
                              >
                                {isAudioPlaying ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                                {isAudioPlaying ? "Pause Original Audio" : "Play Original Audio"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    <Button onClick={handleNextQuestion} className="w-full">
                      {isLastQuestion ? "Complete Activity" : "Next Listening Task"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListeningPage;
