
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader, Volume2, VolumeX, Mic, Play, Pause } from "lucide-react";
import { useChatApi } from "@/hooks/use-chat-api";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { RecordingIndicator, StopRecordingButton, AudioPreview } from "@/components/ui/input";
import { useLanguage, LearningLanguage } from "@/contexts/LanguageContext";

interface ListeningQuestion {
  audio: string;
  correct: string;
  hint: string;
}

interface TranslationQuestion {
  question: string;
  sampleAnswer: string;
  hint: string;
}

type Question = ListeningQuestion | TranslationQuestion;

interface TestExerciseProps {
  questions?: Question[];
  exerciseType: "listening" | "translation";
  onBack?: () => void;
  onComplete?: () => void;
  learningLanguage?: LearningLanguage;
}

const TestExercise: React.FC<TestExerciseProps> = ({
  questions: propQuestions,
  exerciseType,
  onBack,
  onComplete,
  learningLanguage: propLearningLanguage
}) => {
  const { learningLanguage: contextLearningLanguage } = useLanguage();
  const learningLanguage = propLearningLanguage || contextLearningLanguage;

  const defaultListeningQuestionsEn: ListeningQuestion[] = [
    {
      audio: "I like to play soccer on the weekends.",
      correct: "I like to play soccer on the weekends.",
      hint: "Listen carefully to the pronunciation of 'weekends'"
    },
    {
      audio: "She is studying English every day.",
      correct: "She is studying English every day.", 
      hint: "Pay attention to the present continuous tense"
    }
  ];

  const defaultListeningQuestionsEs: ListeningQuestion[] = [
    {
      audio: "Me gusta jugar al fútbol los fines de semana.",
      correct: "Me gusta jugar al fútbol los fines de semana.",
      hint: "Escucha con atención la pronunciación de 'fines de semana'"
    },
    {
      audio: "Ella está estudiando español todos los días.",
      correct: "Ella está estudiando español todos los días.", 
      hint: "Presta atención al tiempo presente continuo"
    }
  ];

  const defaultTranslationQuestionsEn: TranslationQuestion[] = [
    {
      question: "Como você está?",
      sampleAnswer: "How are you?",
      hint: "This is a common greeting in English"
    },
    {
      question: "Eu gosto de comer pizza.",
      sampleAnswer: "I like to eat pizza.",
      hint: "Remember the structure: I like + to + verb"
    }
  ];

  const defaultTranslationQuestionsEs: TranslationQuestion[] = [
    {
      question: "Como você está?",
      sampleAnswer: "¿Cómo estás?",
      hint: "Este es un saludo común en español"
    },
    {
      question: "Eu gosto de comer pizza.",
      sampleAnswer: "Me gusta comer pizza.",
      hint: "Recuerda la estructura: Me gusta + verbo"
    }
  ];

  const defaultListeningQuestions = learningLanguage === 'es' ? defaultListeningQuestionsEs : defaultListeningQuestionsEn;
  const defaultTranslationQuestions = learningLanguage === 'es' ? defaultTranslationQuestionsEs : defaultTranslationQuestionsEn;

  const questions = propQuestions || (exerciseType === "listening" ? defaultListeningQuestions : defaultTranslationQuestions);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const [isActivityCompleted, setIsActivityCompleted] = useState(false);
  const [userRecordedAudio, setUserRecordedAudio] = useState<Blob | null>(null);
  const [isUserAudioPlaying, setIsUserAudioPlaying] = useState(false);
  const [userAudioElement, setUserAudioElement] = useState<HTMLAudioElement | null>(null);
  
  const { sendMessage } = useChatApi();
  const { isPlaying, isLoadingAudio, handleSpeakMessage } = useTextToSpeech();
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
  } = useAudioRecording(exerciseType, learningLanguage);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const isListeningQuestion = (q: Question): q is ListeningQuestion => {
    return 'audio' in q && 'correct' in q;
  };

  const isTranslationQuestion = (q: Question): q is TranslationQuestion => {
    return 'question' in q && 'sampleAnswer' in q;
  };

  // Enhanced cleanup function for user audio
  const cleanupUserAudio = () => {
    console.log('TestExercise - Cleaning up user audio');
    if (userAudioElement) {
      userAudioElement.pause();
      userAudioElement.src = '';
      setUserAudioElement(null);
    }
    setIsUserAudioPlaying(false);
  };

  const handlePlayAudio = () => {
    if (isListeningQuestion(currentQuestion)) {
      console.log('Playing question audio for index:', currentQuestionIndex);
      handleSpeakMessage(currentQuestionIndex, currentQuestion.audio);
    }
  };

  const handlePlayUserAudio = () => {
    if (!userRecordedAudio) {
      console.log("No user recorded audio available");
      return;
    }

    if (isUserAudioPlaying && userAudioElement) {
      console.log("Pausing user recorded audio");
      userAudioElement.pause();
      setIsUserAudioPlaying(false);
      return;
    }

    // Clean up existing audio before starting new one
    cleanupUserAudio();

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
        setUserAnswer(transcribedText);
        if (recordedAudio) {
          setUserRecordedAudio(recordedAudio);
          console.log("Stored user recorded audio");
        }
        console.log("Auto-submitting answer:", transcribedText);
        await submitAnswer(transcribedText, recordedAudio);
      }
    } catch (error) {
      console.error("Error with voice input:", error);
    }
  };

  const submitAnswer = async (answer: string, recordedAudio?: Blob | null) => {
    if (!answer.trim()) return;
    
    console.log("Submitting answer:", answer);
    console.log("Has recorded audio:", !!recordedAudio);
    
    setIsGettingFeedback(true);
    
    let systemPrompt = "";
    let userPrompt = "";

    const teacherLanguage = learningLanguage === 'es' ? 'Spanish' : 'English';

    if (exerciseType === "listening" && isListeningQuestion(currentQuestion)) {
      systemPrompt = `You are a ${teacherLanguage} teacher evaluating the student's transcription of a listening activity.

Please return ONLY the following:

1. Score: Give a score from 0 to 10 based on how accurately the student transcribed the sentence.
2. Original sentence: Show the correct sentence that the audio said.

Keep it short. Do not include any corrections, suggestions, grammar explanations, or encouragement. Only return:

Score: X/10
Original sentence: [full correct sentence here]

The goal is to keep the feedback minimal and objective.`;
      
      userPrompt = `Please evaluate this listening transcription. Original: "${currentQuestion.correct}" Student wrote: "${answer}"`;
    } else if (exerciseType === "translation" && isTranslationQuestion(currentQuestion)) {
      systemPrompt = `You are a ${teacherLanguage} teacher evaluating the student's translation.

Please return ONLY the following:

1. Score: Give a score from 0 to 10 based on how accurate the translation is.
2. Sample answer: Show a good translation.

Keep it short. Do not include lengthy explanations. Only return:

Score: X/10
Sample answer: [correct translation here]

The goal is to keep the feedback minimal and objective.`;
      
      userPrompt = `Please evaluate this translation. Portuguese: "${currentQuestion.question}" Student translated to ${teacherLanguage}: "${answer}" Sample answer: "${currentQuestion.sampleAnswer}"`;
    }

    try {
      const response = await sendMessage(userPrompt, systemPrompt);
      
      if (response) {
        console.log("Received feedback:", response);
        setFeedback(response);
      }
    } catch (error) {
      console.error("Error getting feedback:", error);
      setFeedback("Sorry, I couldn't provide feedback at this time. Please try again.");
      toast({
        title: "Error",
        description: "Failed to get feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGettingFeedback(false);
    }
  };

  const handleSubmitAnswer = async () => {
    await submitAnswer(userAnswer, userRecordedAudio);
  };

  const handleNextQuestion = () => {
    console.log('Moving to next question, cleaning up audio');
    // Clean up audio when moving to next question
    cleanupUserAudio();

    if (isLastQuestion) {
      setIsActivityCompleted(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer("");
      setFeedback(null);
      setUserRecordedAudio(null);
    }
  };

  const resetActivity = () => {
    console.log('Resetting activity, cleaning up all audio');
    // Clean up audio when resetting
    cleanupUserAudio();

    setCurrentQuestionIndex(0);
    setUserAnswer("");
    setFeedback(null);
    setIsActivityCompleted(false);
    setUserRecordedAudio(null);
  };

  if (isActivityCompleted) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
          <div className="flex items-center justify-center min-h-full">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-green-600">
                  🎉 {exerciseType === "listening" ? "Listening" : "Translation"} activity complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-lg mb-6">
                  Great job completing all the {exerciseType} tasks!
                </p>
                <Button onClick={resetActivity} className="w-full">
                  Start Again
                </Button>
                {onComplete && (
                  <Button variant="outline" onClick={onComplete} className="w-full">
                    Voltar
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const currentAudioLoading = isLoadingAudio[currentQuestionIndex];
  const currentAudioPlaying = isPlaying[currentQuestionIndex];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-center flex-grow">
                  {exerciseType === "listening" ? "Listening" : "Translation"} Task {currentQuestionIndex + 1} of {questions.length}
                </CardTitle>
                {onBack && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onBack}
                    className="ml-2"
                    tabIndex={-1}
                  >
                    Voltar
                  </Button>
                )}
              </CardHeader>
              
              <CardContent className="space-y-6">
                {exerciseType === "listening" && isListeningQuestion(currentQuestion) && (
                  <>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-4">
                        Listen to the audio and write what you hear in the text area below.
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <Button
                        onClick={handlePlayAudio}
                        variant="outline"
                        size="lg"
                        className="flex items-center gap-2"
                        disabled={isGettingFeedback || currentAudioLoading}
                      >
                        {currentAudioLoading ? (
                          <Loader className="h-5 w-5 animate-spin" />
                        ) : currentAudioPlaying ? (
                          <VolumeX className="h-5 w-5" />
                        ) : (
                          <Volume2 className="h-5 w-5" />
                        )}
                        {currentAudioLoading 
                          ? "Loading Audio..." 
                          : currentAudioPlaying 
                          ? "Stop Audio" 
                          : "Play Audio"
                        }
                      </Button>
                    </div>
                  </>
                )}

                {exerciseType === "translation" && isTranslationQuestion(currentQuestion) && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Translate the following sentence to English:
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-lg font-medium text-blue-800">
                        {currentQuestion.question}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="relative">
                    <Textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder={exerciseType === "listening" ? "Type what you hear here..." : "Type your translation here..."}
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
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={!userAnswer.trim() || isGettingFeedback}
                      className="w-full"
                    >
                      {isGettingFeedback ? (
                        <div className="flex items-center gap-2">
                          <Loader className="h-4 w-4 animate-spin" />
                          Getting Feedback...
                        </div>
                      ) : (
                        `Submit ${exerciseType === "listening" ? "Transcription" : "Translation"}`
                      )}
                    </Button>
                  )}
                </div>

                {feedback && (
                  <div className="space-y-4" data-no-word-click>
                    <Card className="border-purple-200 bg-purple-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-purple-800">
                          {exerciseType === "listening" ? "Listening" : "Translation"} Feedback
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-gray-700 whitespace-pre-wrap">
                          {feedback}
                        </div>
                      </CardContent>
                    </Card>

                    {userRecordedAudio && feedback && exerciseType === "listening" && isListeningQuestion(currentQuestion) && (
                      <div className="space-y-4">
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
                                disabled={currentAudioLoading}
                              >
                                {currentAudioLoading ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : currentAudioPlaying ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                                {currentAudioLoading 
                                  ? "Loading..." 
                                  : currentAudioPlaying 
                                  ? "Pause Original Audio" 
                                  : "Play Original Audio"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    <Button onClick={handleNextQuestion} className="w-full">
                      {isLastQuestion ? "Complete Activity" : `Next ${exerciseType === "listening" ? "Listening" : "Translation"} Task`}
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

export default TestExercise;
