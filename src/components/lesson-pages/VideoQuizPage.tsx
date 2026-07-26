import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Play, Pause, Volume2, CheckCircle2, XCircle, Trophy, Star, Sparkles, Loader2, PenTool, RotateCcw, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { hasIPhoneUnsupportedVideoExtension, isIOSLikeDevice, sanitizeVideoUrl } from "@/utils/videoCompatibility";

interface VideoQuizQuestion {
  id: string;
  timestamp_seconds: number;
  question: string;
  correct_answers: string[];
  visible: boolean;
}

interface VideoQuizPageData {
  type: "videoQuiz";
  title: string;
  videoUrl: string;
  questions: VideoQuizQuestion[];
}

interface VideoQuizPageProps {
  pageData: VideoQuizPageData;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  lessonId: string;
  onQuizCompletionChange?: (completed: boolean) => void;
  lessonData?: any;
  selectedDifficulty?: string;
  currentPageIndex?: number;
  returnPath?: string;
  savedState?: any;
}

const VideoQuizPage: React.FC<VideoQuizPageProps> = ({
  pageData,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  lessonId,
  onQuizCompletionChange,
  lessonData,
  selectedDifficulty,
  currentPageIndex,
  returnPath,
  savedState,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { learningLanguage } = useLanguage();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [showQuestion, setShowQuestion] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<{
    correct: boolean;
    feedback: string;
    confidence: number;
  } | null>(null);
  const [allQuestionsCompleted, setAllQuestionsCompleted] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string>("");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showWrongAnimation, setShowWrongAnimation] = useState(false);
  const [inputMode, setInputMode] = useState<'audio' | 'text'>('audio');
  const [writtenAnswer, setWrittenAnswer] = useState<string>("");
  const [wrongAttempts, setWrongAttempts] = useState<Map<number, number>>(new Map());
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  const {
    recordingState,
    isTranscribing,
    handleMicButtonClick,
    stopRecording,
    cancelAudio,
    sendAudio,
  } = useAudioRecording("videoQuiz", learningLanguage);

  const {
    isPlaying: isTTSPlaying,
    isLoadingAudio,
    handleSpeakMessage,
  } = useTextToSpeech();

  const isRecording = recordingState.status === 'recording';
  const videoSrc = sanitizeVideoUrl(pageData.videoUrl);
  const useNativeVideoControls = isIOSLikeDevice();
  const hasUnsupportedIPhoneFormat = useNativeVideoControls && hasIPhoneUnsupportedVideoExtension(videoSrc);

  // Sort all questions by timestamp (including both visible and non-visible)
  const sortedQuestions = [...pageData.questions]
    .sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);

  // Restore state when returning from SpecialistHelp
  useEffect(() => {
    console.log('VideoQuizPage - savedState received:', savedState);
    if (savedState) {
      console.log('VideoQuizPage - Restoring video quiz state:', savedState);
      
      // Restore answered questions immediately
      if (savedState.answeredQuestions) {
        setAnsweredQuestions(new Set(savedState.answeredQuestions));
      }
      
      // Restore other state
      if (savedState.currentQuestionIndex !== undefined) {
        setCurrentQuestionIndex(savedState.currentQuestionIndex);
      }
      if (savedState.showQuestion !== undefined) {
        setShowQuestion(savedState.showQuestion);
      }
      if (savedState.lastEvaluation !== undefined) {
        setLastEvaluation(savedState.lastEvaluation);
      }
      if (savedState.transcribedText !== undefined) {
        setTranscribedText(savedState.transcribedText);
      }
      if (savedState.writtenAnswer !== undefined) {
        setWrittenAnswer(savedState.writtenAnswer);
      }
      if (savedState.inputMode !== undefined) {
        setInputMode(savedState.inputMode);
      }
      if (savedState.wrongAttempts) {
        setWrongAttempts(new Map(Object.entries(savedState.wrongAttempts).map(([k, v]) => [parseInt(k), v as number])));
      }
      if (savedState.showCorrectAnswer !== undefined) {
        setShowCorrectAnswer(savedState.showCorrectAnswer);
      }
    }
  }, [savedState]);

  // Restore video position after metadata loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !savedState) return;

    const handleLoadedMetadata = () => {
      if (savedState.videoCurrentTime !== undefined) {
        console.log('Restoring video time to:', savedState.videoCurrentTime);
        video.currentTime = savedState.videoCurrentTime;
        setCurrentTime(savedState.videoCurrentTime);
      }
    };

    if (video.readyState >= 1) {
      // Metadata already loaded
      handleLoadedMetadata();
    } else {
      // Wait for metadata to load
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, [savedState]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Check if we've reached a question timestamp (both visible and non-visible)
      const nextQuestion = sortedQuestions.find(
        (q, index) => 
          q.timestamp_seconds <= video.currentTime + 0.5 && 
          q.timestamp_seconds >= video.currentTime - 0.5 &&
          !answeredQuestions.has(index)
      );

      if (nextQuestion) {
        const questionIndex = sortedQuestions.findIndex(q => q.id === nextQuestion.id);
        video.pause();
        setIsPlaying(false);
        setCurrentQuestionIndex(questionIndex);
        setShowQuestion(true);
        setLastEvaluation(null);
        setTranscribedText("");
        setWrittenAnswer("");
        setInputMode('audio'); // Reset to audio mode for new questions
        setShowCorrectAnswer(false);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [sortedQuestions, answeredQuestions]);

  useEffect(() => {
    // Check if all questions are completed
    const isCompleted = answeredQuestions.size === sortedQuestions.length && sortedQuestions.length > 0;
    setAllQuestionsCompleted(isCompleted);
    
    // Report completion status to parent
    if (onQuizCompletionChange) {
      onQuizCompletionChange(isCompleted);
    }
  }, [answeredQuestions, sortedQuestions.length, onQuizCompletionChange]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video || showQuestion) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(error => console.error('Error playing video:', error));
    }
    setIsPlaying(!isPlaying);
  };

  const seekVideo = (seconds: number) => {
    const video = videoRef.current;
    if (!video || showQuestion) return;

    const newTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration));
    video.currentTime = newTime;
  };

  const handleSubmitAnswer = async () => {
    const userAnswer = inputMode === 'audio' ? transcribedText : writtenAnswer;
    
    if (!userAnswer?.trim()) {
      toast({
        title: "No answer provided",
        description: `Please ${inputMode === 'audio' ? 'record' : 'write'} your answer first.`,
        variant: "destructive",
      });
      return;
    }

    setIsEvaluating(true);

    try {
      const currentQuestion = sortedQuestions[currentQuestionIndex];
      
      const response = await supabase.functions.invoke('evaluate-quiz-answer', {
        body: {
          userAnswer: userAnswer,
          lessonId: lessonId,
          timestampSeconds: currentQuestion.timestamp_seconds,
          question: currentQuestion.question,
          correctAnswers: currentQuestion.correct_answers,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const evaluation = response.data;
      setLastEvaluation(evaluation);

      if (evaluation.correct) {
        // Mark question as answered
        setAnsweredQuestions(prev => new Set([...prev, currentQuestionIndex]));
        
        // Show success animation
        setShowSuccessAnimation(true);
        
        // Auto-continue after success animation
        setTimeout(() => {
          setShowSuccessAnimation(false);
          setShowQuestion(false);
          const video = videoRef.current;
          if (video) {
            video.play()
              .then(() => setIsPlaying(true))
              .catch(error => console.error('Error resuming video:', error));
          }
        }, 2000);
      } else {
        // Increment wrong attempts for this question
        const newAttempts = new Map(wrongAttempts);
        const currentAttempts = newAttempts.get(currentQuestionIndex) || 0;
        newAttempts.set(currentQuestionIndex, currentAttempts + 1);
        setWrongAttempts(newAttempts);
        
        // Show wrong answer animation
        setShowWrongAnimation(true);
        
        // Auto-hide wrong animation and reset for retry
        setTimeout(() => {
          setShowWrongAnimation(false);
          setLastEvaluation(null);
          setTranscribedText("");
          setWrittenAnswer("");
        }, 2000);
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
      toast({
        title: "Error",
        description: "Failed to evaluate your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSkipQuestion = () => {
    setShowQuestion(false);
    const video = videoRef.current;
    if (video) {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(error => console.error('Error resuming video:', error));
    }
  };

  const handleRecordAnswer = async () => {
    if (isRecording) {
      // Stop recording first and let the audio processing happen
      stopRecording();
    } else {
      setTranscribedText(""); // Clear previous transcription
      handleMicButtonClick();
    }
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === 'audio' ? 'text' : 'audio');
    setTranscribedText("");
    setWrittenAnswer("");
    setLastEvaluation(null);
  };

  const handleShowAnswer = () => {
    setShowCorrectAnswer(true);
  };

  const handleContinueAfterAnswer = () => {
    // Mark question as answered to prevent it from triggering again
    setAnsweredQuestions(prev => new Set([...prev, currentQuestionIndex]));
    setShowQuestion(false);
    setShowCorrectAnswer(false);
    const video = videoRef.current;
    if (video) {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(error => console.error('Error resuming video:', error));
    }
  };

  const handleAskSpecialist = () => {
    // Preserve all video quiz state for restoration when returning
    const videoQuizState = {
      videoCurrentTime: videoRef.current?.currentTime || 0,
      answeredQuestions: Array.from(answeredQuestions),
      currentQuestionIndex,
      showQuestion,
      lastEvaluation,
      transcribedText,
      writtenAnswer,
      inputMode,
      wrongAttempts: Object.fromEntries(wrongAttempts),
      showCorrectAnswer,
    };

    console.log('VideoQuizPage - Saving state before navigation:', videoQuizState);

    navigate("/specialist-help", {
      state: {
        returnPath: "/lesson-runner",
        returnState: {
          lesson: lessonData,
          selectedDifficulty,
          lessonId,
          currentPageIndex,
          videoQuizState, // Store the video quiz state
          returnPath
        }
      }
    });
  };

  // Handle the transcription when recording state changes to preview
  useEffect(() => {
    const handleAudioReady = async () => {
      if (recordingState.status === 'preview' && recordingState.recordedAudio) {
        try {
          const result = await sendAudio();
          if (result.transcribedText) {
            setTranscribedText(result.transcribedText);
          }
        } catch (error) {
          console.error('Error sending audio:', error);
          toast({
            title: "Error",
            description: "Failed to transcribe audio. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    handleAudioReady();
  }, [recordingState.status, recordingState.recordedAudio]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Video Controls - Moved to top */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <Button
            onClick={togglePlayPause}
            disabled={showQuestion}
            variant="secondary"
            size="sm"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <Button
            onClick={() => seekVideo(-1)}
            disabled={showQuestion}
            variant="outline"
            size="sm"
            title="Rewind 1 second"
          >
            <RotateCcw className="w-3 h-3" />
            1s
          </Button>
          
          <Button
            onClick={() => seekVideo(-10)}
            disabled={showQuestion}
            variant="outline"
            size="sm"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-4 h-4" />
            10s
          </Button>
          
          <div className="flex-1 space-y-1">
            <div className="w-full bg-muted rounded-full h-1">
              <div 
                className="bg-primary h-1 rounded-full transition-all duration-200"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-foreground text-xs">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <Button
            onClick={handleAskSpecialist}
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-900"
            title="Ask a specialist"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        {hasUnsupportedIPhoneFormat ? (
          <div className="aspect-video flex items-center justify-center p-6 text-center text-white">
            Este formato de vídeo não é compatível com iPhone. Use MP4/H.264.
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full aspect-video"
            controls={useNativeVideoControls}
            preload="metadata"
            playsInline
            webkit-playsinline="true"
            x5-playsinline="true"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}
      </div>


      {/* Success Animation - Discrete Corner Notification */}
      {showSuccessAnimation && (
        <div className="fixed top-4 right-4 z-50 animate-scale-in">
          <Card className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 border-green-400 shadow-lg max-w-sm">
            <div className="flex items-center space-x-3 text-white">
              <div className="relative">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-4 h-4 animate-pulse text-yellow-300" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Correct!</h3>
                <p className="text-green-100 text-sm">Great job!</p>
              </div>
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <Star 
                    key={i} 
                    className="w-4 h-4 text-yellow-300 animate-pulse" 
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Wrong Answer Animation - Discrete Corner Notification */}
      {showWrongAnimation && (
        <div className="fixed top-4 right-4 z-50 animate-scale-in">
          <Card className="p-4 bg-gradient-to-r from-red-500 to-red-600 border-red-400 shadow-lg max-w-sm">
            <div className="flex items-center space-x-3 text-white">
              <div className="relative">
                <XCircle className="w-8 h-8 animate-bounce" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Try Again!</h3>
                <p className="text-red-100 text-sm">Give it another shot</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Question Modal */}
      {showQuestion && !showSuccessAnimation && !showWrongAnimation && (
        <Card className="p-6 border-2 border-primary">
          <div className="space-y-4">
            <div className="text-center">
              {/* Only show question text if it's marked as visible */}
              {sortedQuestions[currentQuestionIndex]?.visible !== false && (
                <div className="flex items-center justify-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">
                    {sortedQuestions[currentQuestionIndex]?.question}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSpeakMessage(currentQuestionIndex, sortedQuestions[currentQuestionIndex]?.question || '')}
                    disabled={isLoadingAudio[currentQuestionIndex]}
                    className="flex items-center justify-center w-8 h-8 p-0"
                  >
                    {isLoadingAudio[currentQuestionIndex] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isTTSPlaying[currentQuestionIndex] ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Show Correct Answer Section */}
            {showCorrectAnswer ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Correct Answer:</h4>
                  <div className="space-y-1">
                    {sortedQuestions[currentQuestionIndex]?.correct_answers.map((answer, index) => (
                      <p key={index} className="text-green-700">
                        • {answer}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={handleContinueAfterAnswer}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Continue Video
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Audio Recording Section */}
                {inputMode === 'audio' && (
                  <div className="space-y-4 mt-6">
                    <div className="text-center">
                      <Button
                        onClick={handleRecordAnswer}
                        disabled={isEvaluating || isTranscribing}
                        className={`w-32 h-32 rounded-full ${
                          isRecording 
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                            : isTranscribing
                            ? 'bg-muted hover:bg-muted cursor-not-allowed'
                            : 'bg-primary hover:bg-primary/90'
                        }`}
                      >
                        {isTranscribing ? (
                          <Loader2 className="w-16 h-16 animate-spin" />
                        ) : isRecording ? (
                          <MicOff className="w-16 h-16" />
                        ) : (
                          <Mic className="w-16 h-16" />
                        )}
                      </Button>
                      {(isTranscribing || isRecording) && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {isTranscribing 
                            ? 'Transcribing audio...' 
                            : 'Recording... Click to stop'}
                        </p>
                      )}
                    </div>

                    {transcribedText && (
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Your answer:</p>
                        <p className="text-foreground">{transcribedText}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Text Input Section */}
                {inputMode === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <Textarea
                        value={writtenAnswer}
                        onChange={(e) => setWrittenAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        className="min-h-[100px]"
                        disabled={isEvaluating}
                      />
                    </div>
                  </div>
                )}

                {lastEvaluation?.correct && lastEvaluation.feedback && (
                  <div className="p-3 rounded-lg flex items-start space-x-2 bg-green-50 border border-green-200">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <p className="text-sm text-green-800">
                      {lastEvaluation.feedback}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-center space-x-3">
                  {((inputMode === 'audio' && transcribedText) || (inputMode === 'text' && writtenAnswer.trim())) && (
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={isEvaluating}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isEvaluating ? 'Evaluating...' : 'Submit Answer'}
                    </Button>
                  )}
                  
                  {/* Show Answer Button after 2 wrong attempts */}
                  {(wrongAttempts.get(currentQuestionIndex) || 0) >= 2 && (
                    <Button
                      onClick={handleShowAnswer}
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      Show Answer
                    </Button>
                  )}
                </div>

                {/* Small discrete toggle button at bottom */}
                <div className="flex justify-center pt-2">
                  <Button
                    onClick={toggleInputMode}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {inputMode === 'audio' ? (
                      <>
                        <PenTool className="w-3 h-3 mr-1" />
                        Write instead
                      </>
                    ) : (
                      <>
                        <Mic className="w-3 h-3 mr-1" />
                        Audio instead
                      </>
                    )}
                  </Button>
                </div>

                {/* Wrong attempts indicator */}
                {(wrongAttempts.get(currentQuestionIndex) || 0) > 0 && (
                  <div className="text-center text-sm text-muted-foreground">
                    Wrong attempts: {wrongAttempts.get(currentQuestionIndex)} / 2
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      )}

      {/* Progress Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Progress: {answeredQuestions.size} of {sortedQuestions.length} questions answered
          </div>
          
          {allQuestionsCompleted && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">All questions completed!</span>
            </div>
          )}
        </div>
      </Card>

    </div>
  );
};

export default VideoQuizPage;