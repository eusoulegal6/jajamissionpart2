import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader, Mic, Play, Pause, HelpCircle, RefreshCw, SkipForward, Video } from "lucide-react";
import { useChatApi } from "@/hooks/use-chat-api";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { RecordingIndicator, StopRecordingButton, AudioPreview } from "@/components/ui/input";
import { useLanguage, LearningLanguage } from "@/contexts/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { hasIPhoneUnsupportedVideoExtension, isIOSLikeDevice, sanitizeVideoUrl } from "@/utils/videoCompatibility";

interface ListeningVideoQuestion {
  originalText: string;
}

interface ListeningVideoPageProps {
  videoUrl?: string;
  questions?: ListeningVideoQuestion[];
  learningLanguage?: LearningLanguage;
  lessonId?: string;
  selectedDifficulty?: string;
  nextSignal?: number;
  onStateChange?: (state: { currentQuestionIndex: number; totalQuestions: number; isActivityCompleted: boolean; }) => void;
  onComplete?: () => void;
}

const ListeningVideoPage: React.FC<ListeningVideoPageProps> = ({ 
  videoUrl: propVideoUrl,
  questions: propQuestions, 
  learningLanguage: propLearningLanguage,
  lessonId: propLessonId,
  selectedDifficulty: propSelectedDifficulty = "medium",
  nextSignal = 0,
  onStateChange,
  onComplete,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { learningLanguage: contextLearningLanguage } = useLanguage();
  const learningLanguage = propLearningLanguage || contextLearningLanguage;
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const lessonId = propLessonId || location.state?.lessonId;
  const selectedDifficulty = propSelectedDifficulty || location.state?.selectedDifficulty || "medium";
  const videoUrl = propVideoUrl || location.state?.videoUrl || '';

  const defaultQuestions: ListeningVideoQuestion[] = [
    { originalText: "Example transcription text." }
  ];

  const questions = propQuestions || location.state?.questions || defaultQuestions;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    location.state?.currentQuestionIndex || 0
  );
  const [userTranscription, setUserTranscription] = useState(
    location.state?.userTranscription || ""
  );
  const [feedback, setFeedback] = useState<string | null>(
    location.state?.feedback || null
  );
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const [isActivityCompleted, setIsActivityCompleted] = useState(
    location.state?.isActivityCompleted || false
  );
  const [userRecordedAudio, setUserRecordedAudio] = useState<Blob | null>(null);
  const [isUserAudioPlaying, setIsUserAudioPlaying] = useState(false);
  const [userAudioElement, setUserAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
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
  const sanitizedVideoUrl = sanitizeVideoUrl(videoUrl);
  const isIPhoneVideo = isIOSLikeDevice();
  const hasUnsupportedIPhoneFormat = isIPhoneVideo && hasIPhoneUnsupportedVideoExtension(sanitizedVideoUrl);

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

  // Check if it's a YouTube URL
  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Convert YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = '';
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(new URL(url).search);
      videoId = urlParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1` : url;
  };

  const handlePlayVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => console.error('Failed to play video:', error));
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleAskSpecialist = () => {
    const listeningState = {
      lessonId,
      selectedDifficulty,
      questions,
      currentQuestionIndex,
      userTranscription,
      feedback,
      isActivityCompleted,
      videoUrl,
    };

    navigate('/specialist-help', {
      state: {
        returnPath: '/listening-video',
        listeningState
      }
    });
  };

  const handlePlayUserAudio = () => {
    if (!userRecordedAudio) return;

    if (isUserAudioPlaying && userAudioElement) {
      userAudioElement.pause();
      setIsUserAudioPlaying(false);
      return;
    }

    if (userAudioElement) {
      userAudioElement.pause();
      userAudioElement.src = '';
      setUserAudioElement(null);
    }

    const audio = new Audio(URL.createObjectURL(userRecordedAudio));
    
    audio.onended = () => {
      setIsUserAudioPlaying(false);
      setUserAudioElement(null);
    };
    
    audio.onerror = () => {
      setIsUserAudioPlaying(false);
      setUserAudioElement(null);
    };
    
    setUserAudioElement(audio);
    setIsUserAudioPlaying(true);
    
    audio.play().catch(error => {
      console.error("Failed to play user audio:", error);
      setIsUserAudioPlaying(false);
      setUserAudioElement(null);
    });
  };

  const handleVoiceInput = async () => {
    try {
      const { recordedAudio, transcribedText } = await sendAudio();
      
      if (transcribedText) {
        setUserTranscription(transcribedText);
        if (recordedAudio) {
          setUserRecordedAudio(recordedAudio);
        }
        await submitTranscription(transcribedText, recordedAudio);
      }
    } catch (error) {
      console.error("Error with voice input:", error);
    }
  };

  const submitTranscription = async (transcription: string, recordedAudio?: Blob | null) => {
    if (!transcription.trim()) return;
    
    setIsGettingFeedback(true);
    
    const teacherLanguage = learningLanguage === 'es' ? 'Spanish' : 'English';
    const systemPrompt = `You are a ${teacherLanguage} teacher evaluating the student's transcription of a video listening activity.

Please return ONLY the following:

1. Score: Give a score from 0 to 10 based on how accurately the student transcribed the sentence.
2. Original sentence: Show the correct sentence from the video.

Keep it short. Do not include any corrections, suggestions, grammar explanations, or encouragement. Only return:

Score: X/10
Original sentence: [full correct sentence here]

The goal is to keep the feedback minimal and objective.`;

    try {
      const response = await sendMessage(
        `Please evaluate this video listening transcription. Original: "${currentQuestion.originalText}" Student wrote: "${transcription}"`,
        systemPrompt
      );
      
      if (response) {
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
    if (userAudioElement) {
      userAudioElement.pause();
      userAudioElement.src = '';
      setUserAudioElement(null);
    }

    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserTranscription("");
      setFeedback(null);
      setUserRecordedAudio(null);
      setIsUserAudioPlaying(false);
    } else {
      setIsActivityCompleted(true);
      onComplete?.();
    }
  };

  const handleSkipQuestion = () => {
    if (userAudioElement) {
      userAudioElement.pause();
      userAudioElement.src = '';
      setUserAudioElement(null);
    }

    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserTranscription("");
      setFeedback(null);
      setUserRecordedAudio(null);
      setIsUserAudioPlaying(false);
    }
  };

  const resetActivity = () => {
    if (userAudioElement) {
      userAudioElement.pause();
      userAudioElement.src = '';
      setUserAudioElement(null);
    }

    setCurrentQuestionIndex(0);
    setUserTranscription("");
    setFeedback(null);
    setIsActivityCompleted(false);
    setUserRecordedAudio(null);
    setIsUserAudioPlaying(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Listening Task {currentQuestionIndex + 1} of {questions.length}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Video Player */}
          <Card>
            <CardContent className="p-4">
              {videoUrl ? (
                <AspectRatio ratio={16 / 9}>
                  {isYouTubeUrl(videoUrl) ? (
                    <iframe
                      ref={iframeRef}
                      src={getYouTubeEmbedUrl(sanitizedVideoUrl)}
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : hasUnsupportedIPhoneFormat ? (
                    <div className="w-full h-full rounded-lg bg-black flex items-center justify-center p-4 text-center text-white">
                      Este formato de vídeo não é compatível com iPhone. Use MP4/H.264.
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      src={sanitizedVideoUrl}
                      className="w-full h-full rounded-lg bg-black"
                      controls
                      preload="metadata"
                      playsInline
                      webkit-playsinline="true"
                      x5-playsinline="true"
                      onPlay={() => setIsVideoPlaying(true)}
                      onPause={() => setIsVideoPlaying(false)}
                      onEnded={() => setIsVideoPlaying(false)}
                    />
                  )}
                </AspectRatio>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">No video URL provided</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transcription Area */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                What did you hear?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type what you heard in the video..."
                value={userTranscription}
                onChange={(e) => setUserTranscription(e.target.value)}
                className="min-h-[100px]"
                disabled={isGettingFeedback}
              />

              <div className="flex flex-wrap gap-2">
                {/* Voice Input Button */}
                {recordingState.status === 'recording' ? (
                  <div className="flex items-center gap-2">
                    <RecordingIndicator />
                    <StopRecordingButton onClick={stopRecording} />
                  </div>
                ) : showStopButton ? (
                  <AudioPreview 
                    onPlay={playAudio} 
                    onDelete={cancelAudio} 
                    onSend={handleVoiceInput}
                    isPlaying={isVoiceInputPlaying}
                    isTranscribing={isTranscribing}
                  />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMicButtonClick}
                    disabled={isGettingFeedback}
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Voice Input
                  </Button>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitTranscription}
                  disabled={!userTranscription.trim() || isGettingFeedback}
                >
                  {isGettingFeedback ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Check My Answer"
                  )}
                </Button>

                {/* Play User Recording */}
                {userRecordedAudio && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePlayUserAudio}
                  >
                    {isUserAudioPlaying ? (
                      <Pause className="h-4 w-4 mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    My Recording
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Feedback */}
          {feedback && (
            <Card className="border-primary/20 bg-primary/5" data-no-word-click>
              <CardHeader>
                <CardTitle className="text-lg">Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm">{feedback}</div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {!isLastQuestion && (
                    <Button onClick={handleNextQuestion}>
                      Next Question
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAskSpecialist}
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Ask Specialist
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkipQuestion}
              disabled={isLastQuestion}
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip Question
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetActivity}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart Activity
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListeningVideoPage;
