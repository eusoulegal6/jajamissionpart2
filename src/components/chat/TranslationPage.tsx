import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader, Mic, Play, Pause, Loader2, Eye, SkipForward } from "lucide-react";
import { useChatApi } from "@/hooks/use-chat-api";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useLanguage } from "@/contexts/LanguageContext";
import { RecordingIndicator, StopRecordingButton, AudioPreview } from "@/components/ui/input";

interface TranslationQuestion {
  original: string;
  correctTranslation: string;
}

interface TranslationPageProps {
  questions?: TranslationQuestion[];
}

const TranslationPage: React.FC<TranslationPageProps> = ({ questions: propQuestions }) => {
  const { t } = useLanguage();
  const defaultQuestions: TranslationQuestion[] = [
    { 
      original: "Eu gosto de estudar inglês.", 
      correctTranslation: "I like to study English."
    },
    { 
      original: "Ela trabalha em um hospital.", 
      correctTranslation: "She works at a hospital."
    }
  ];

  const questions = propQuestions || defaultQuestions;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userTranslation, setUserTranslation] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const [isActivityCompleted, setIsActivityCompleted] = useState(false);
  const [showOriginalText, setShowOriginalText] = useState(false);
  const [userRecordedAudio, setUserRecordedAudio] = useState<Blob | null>(null);
  const [isUserAudioPlaying, setIsUserAudioPlaying] = useState(false);
  const [userAudioElement, setUserAudioElement] = useState<HTMLAudioElement | null>(null);
  
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
    sendAudio,
  } = useAudioRecording("translation");

  const { isPlaying: ttsIsPlaying, isLoadingAudio, handleSpeakMessage } = useTextToSpeech();

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const isCurrentlyPlaying = ttsIsPlaying[currentQuestionIndex];
  const isCurrentlyLoading = isLoadingAudio[currentQuestionIndex];

  // Audio index for correct translation playback
  const correctAudioIndex = currentQuestionIndex + 1000;
  const isCorrectAudioPlaying = ttsIsPlaying[correctAudioIndex];
  const isCorrectAudioLoading = isLoadingAudio[correctAudioIndex];

  const handleAudioToggle = () => {
    handleSpeakMessage(currentQuestionIndex, currentQuestion.original);
  };

  const handleSkipQuestion = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserTranslation("");
      setFeedback(null);
      setShowOriginalText(false);
      setUserRecordedAudio(null);
      setIsUserAudioPlaying(false);
      // Clean up audio when skipping
      if (userAudioElement) {
        userAudioElement.pause();
        userAudioElement.src = '';
        setUserAudioElement(null);
      }
    }
    // On last question, do nothing - just stay on the review
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

  const handlePlayCorrectTranslation = () => {
    handleSpeakMessage(correctAudioIndex, currentQuestion.correctTranslation);
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
        setUserTranslation(transcribedText);
        // Store the recorded audio for later playback
        if (recordedAudio) {
          setUserRecordedAudio(recordedAudio);
          console.log("Stored user recorded audio");
        }
        // Auto-submit the transcription for feedback
        console.log("Auto-submitting translation for feedback:", transcribedText);
        await submitTranslation(transcribedText, recordedAudio);
      }
    } catch (error) {
      console.error("Error with voice input:", error);
    }
  };

  const submitTranslation = async (translation: string, recordedAudio?: Blob | null) => {
    if (!translation.trim()) return;
    
    console.log("Submitting translation for feedback:", translation);
    console.log("Has recorded audio:", !!recordedAudio);
    
    setIsGettingFeedback(true);
    
    const systemPrompt = `You are an English teacher evaluating a student's English translation of a Portuguese sentence.

Compare the student's translation with the correct translation provided below. Focus on accuracy and meaning rather than exact word matching.

Instructions:
1. Rate the student's translation on a scale from 1 to 10, based on how accurately it conveys the meaning compared to the correct translation.
2. When evaluating, do not penalize for minor punctuation or capitalization differences.
3. Focus on meaning accuracy, grammar correctness, and natural English expression.
4. Be brief and objective. Do not explain, encourage, or provide teaching points.

Format your response as:
Score: X/10
Correct translation: [show the correct translation]

Portuguese sentence: ${currentQuestion.original}
Correct English translation: ${currentQuestion.correctTranslation}
Student's translation: ${translation}`;

    try {
      const response = await sendMessage(
        `Please evaluate this translation from Portuguese to English: "${translation}" for the sentence "${currentQuestion.original}"`,
        systemPrompt
      );
      
      if (response) {
        setFeedback(response);
      }
    } catch (error) {
      console.error("Error getting translation feedback:", error);
      setFeedback("Sorry, I couldn't provide feedback at this time. Please try again.");
    } finally {
      setIsGettingFeedback(false);
    }
  };

  const handleSubmitTranslation = async () => {
    await submitTranslation(userTranslation, userRecordedAudio);
  };

  const handleNextQuestion = () => {
    // Clean up audio before moving to next question
    if (userAudioElement) {
      userAudioElement.pause();
      userAudioElement.src = '';
      setUserAudioElement(null);
    }

    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserTranslation("");
      setFeedback(null);
      setShowOriginalText(false);
      setUserRecordedAudio(null);
      setIsUserAudioPlaying(false);
    }
    // On last question, do nothing - just stay on the review
  };

  const resetActivity = () => {
    // Clean up audio when resetting
    if (userAudioElement) {
      userAudioElement.pause();
      userAudioElement.src = '';
      setUserAudioElement(null);
    }

    setCurrentQuestionIndex(0);
    setUserTranslation("");
    setFeedback(null);
    setIsActivityCompleted(false);
    setShowOriginalText(false);
    setUserRecordedAudio(null);
    setIsUserAudioPlaying(false);
  };


  console.log("Render state:", {
    feedback: !!feedback,
    userRecordedAudio: !!userRecordedAudio,
    showAudioComparison: userRecordedAudio && feedback
  });

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        <div className="flex justify-center">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 w-full">
                <CardTitle className="text-center md:text-left">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </CardTitle>
                {!feedback && (
                  <Button
                    onClick={handleSkipQuestion}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 rounded shadow-none border-gray-300"
                    disabled={isGettingFeedback || recordingState.status === 'recording'}
                  >
                    <SkipForward className="h-4 w-4" />
                    {t('skip')}
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Audio Controls and Portuguese Sentence */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">Listen to the Portuguese audio and translate it to English:</p>
                
                {/* Audio Control */}
                <div className="mb-6 flex justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleAudioToggle}
                    disabled={isCurrentlyLoading}
                    className="flex items-center gap-3 px-6 py-3 text-base font-medium border-2 hover:bg-gray-50 transition-colors"
                  >
                    {isCurrentlyLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isCurrentlyPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                    {isCurrentlyLoading 
                      ? "Loading Audio..." 
                      : isCurrentlyPlaying 
                      ? "Pause Audio" 
                      : t('play_audio')}
                  </Button>
                </div>

                {/* Eye button and hidden Portuguese text */}
                <div className="mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOriginalText(!showOriginalText)}
                    className="mb-3 text-gray-600 hover:text-gray-900"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showOriginalText ? "Hide" : "Show"} Portuguese Text
                  </Button>
                  
                  {showOriginalText && (
                    <p className="text-lg font-medium p-4 bg-blue-50 rounded-lg border border-blue-200">
                      {currentQuestion.original}
                    </p>
                  )}
                </div>
              </div>

              {/* Translation Input */}
              <div className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={userTranslation}
                    onChange={(e) => setUserTranslation(e.target.value)}
                    placeholder="Write your English translation here..."
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
                    isPlaying={isPlaying}
                    onPlay={playAudio}
                    onSend={handleVoiceInput}
                    onDelete={cancelAudio}
                    isTranscribing={isTranscribing}
                  />
                )}
                
                {!feedback && (
                  <Button
                    onClick={handleSubmitTranslation}
                    disabled={!userTranslation.trim() || isGettingFeedback}
                    className="w-full"
                  >
                    {isGettingFeedback ? (
                      <div className="flex items-center gap-2">
                        <Loader className="h-4 w-4 animate-spin" />
                        Getting Feedback...
                      </div>
                    ) : (
                      t('answer_button')
                    )}
                  </Button>
                )}
              </div>

              {/* AI Feedback */}
              {feedback && (
                <div className="space-y-4">
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-green-800">Translation Feedback</CardTitle>
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

                      {/* Correct translation section */}
                      <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                          <CardTitle className="text-lg text-green-800">Como um nativo falaria:</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-center">
                            <Button
                              onClick={handlePlayCorrectTranslation}
                              variant="outline"
                              className="flex items-center gap-2"
                              disabled={isCorrectAudioLoading}
                            >
                              {isCorrectAudioLoading ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : isCorrectAudioPlaying ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                              {isCorrectAudioLoading 
                                ? "Loading..." 
                                : isCorrectAudioPlaying 
                                ? "Pause Correct Audio" 
                                : "Play Correct Audio"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {!isLastQuestion && (
                    <Button onClick={handleNextQuestion} className="w-full">
                      Next Translation
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TranslationPage;
