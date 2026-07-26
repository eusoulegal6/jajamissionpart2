import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader, Mic, SkipForward, Play, Pause, HelpCircle } from "lucide-react";
import { useChatApi } from "@/hooks/use-chat-api";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { RecordingIndicator, StopRecordingButton, AudioPreview } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTeacherMode } from "@/contexts/TeacherModeContext";
import DetailedCorrectionModal from "../chat/DetailedCorrectionModal";
import { useDetailedCorrection } from "@/hooks/useDetailedCorrection";
import { supabase } from "@/integrations/supabase/client";

interface RecommendedVocabularyPageProps {
  questions?: string[];
  topic?: string;
  recommendedWords?: string[];
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
}

const RecommendedVocabularyPage: React.FC<RecommendedVocabularyPageProps> = ({
  questions: propQuestions,
  topic,
  recommendedWords = [],
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
}) => {
  const { t, learningLanguage, tLesson } = useLanguage();
  const { isTeacherMode } = useTeacherMode();
  const defaultQuestions = [
    "What do you like to do on weekends?",
    "Describe your favorite food."
  ];

  const questions = propQuestions || defaultQuestions;
  const currentQuestion = questions[questionIndex];

  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [portugueseFeedback, setPortugueseFeedback] = useState<string | null>(null);
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const [isTranslatingFeedback, setIsTranslatingFeedback] = useState(false);
  const [isActivityCompleted, setIsActivityCompleted] = useState(false);
  const [userRecordedAudio, setUserRecordedAudio] = useState<Blob | null>(null);
  const [isUserAudioPlaying, setIsUserAudioPlaying] = useState(false);
  const [userAudioElement, setUserAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isDetailedCorrectionOpen, setIsDetailedCorrectionOpen] = useState(false);
  const [detailedCorrectionText, setDetailedCorrectionText] = useState<string | null>(null);
  const [showAIInterface, setShowAIInterface] = useState(!isTeacherMode);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  
  const { sendMessage } = useChatApi();
  const { isPlaying, isLoadingAudio, handleSpeakMessage } = useTextToSpeech();
  const { getDetailedCorrection, isLoading: isLoadingDetailedCorrection } = useDetailedCorrection();
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
    console.log('RecommendedVocabularyPage - Cleaning up user audio');
    if (userAudioElement) {
      userAudioElement.pause();
      userAudioElement.src = '';
      setUserAudioElement(null);
    }
    setIsUserAudioPlaying(false);
  };

  // Enhanced effect to reset state whenever the question changes
  useEffect(() => {
    console.log('RecommendedVocabularyPage - Question changed to index:', questionIndex);
    
    // Reset all question-specific state
    setUserAnswer("");
    setFeedback(null);
    setPortugueseFeedback(null);
    setUserRecordedAudio(null);
    setUsedWords([]);
    
    // Clean up user audio
    cleanupUserAudio();
    
    // Reset detailed correction state
    setDetailedCorrectionText(null);
    setIsDetailedCorrectionOpen(false);
    
  }, [questionIndex]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log('RecommendedVocabularyPage - Component unmounting, cleaning up audio');
      cleanupUserAudio();
    };
  }, []);

  // Function to check which recommended words were used
  const checkUsedWords = (answer: string): string[] => {
    const answerLower = answer.toLowerCase();
    const wordsUsed = recommendedWords.filter(word => 
      answerLower.includes(word.toLowerCase())
    );
    return wordsUsed;
  };

  // Extract corrected version from AI feedback
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
      new RegExp(`Versión\\s+[Cc]orregida\\s*\\n\\s*([\\s\\S]+?)${endPattern}`, 'i'),
      new RegExp(`Versión\\s+[Cc]orregida[:\\s]+([\\s\\S]+?)${endPattern}`, 'i'),
      // English: "Corrected Version" patterns
      new RegExp(`Corrected\\s+Version\\s*\\n\\s*([\\s\\S]+?)${endPattern}`, 'i'),
      new RegExp(`(?:4\\.?\\s*)?Corrected\\s+Version[:\\s]+([\\s\\S]+?)${endPattern}`, 'i'),
    ];
    
    for (const pattern of patterns) {
      const match = feedback.match(pattern);
      if (match && match[1]) {
        const correctedText = match[1].trim();
        if (correctedText.length > 5) {
          console.log("Extracted corrected version:", correctedText);
          return correctedText;
        }
      }
    }
    
    console.log("No corrected version found in feedback");
    return null;
  };

  // Get corrected version from feedback
  const correctedVersion = (portugueseFeedback || feedback) 
    ? extractCorrectedVersion(portugueseFeedback || feedback || '') 
    : null;

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

  const handlePlayCorrectedAudio = (correctedText: string) => {
    const correctedAudioIndex = questionIndex + 1000;
    console.log('Playing corrected audio for index:', correctedAudioIndex);
    handleSpeakMessage(correctedAudioIndex, correctedText);
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
        console.log("Auto-submitting answer for feedback:", transcribedText);
        await submitAnswer(transcribedText, recordedAudio);
      }
    } catch (error) {
      console.error("Error with voice input:", error);
    }
  };

  const submitAnswer = async (answer: string, recordedAudio?: Blob | null) => {
    if (!answer.trim()) return;
    
    console.log("Submitting answer for feedback:", answer);
    console.log("Has recorded audio:", !!recordedAudio);
    
    setIsGettingFeedback(true);
    
    // Check which recommended words were used
    const wordsUsed = checkUsedWords(answer);
    setUsedWords(wordsUsed);

    const englishPrompt = `You are an English teacher evaluating a student's written answer to a question. The student was provided with recommended vocabulary to try to use in their response.

Please provide your response in five clearly labeled sections. Use clean formatting with each section title on its own line followed by a paragraph break. Do not use markdown, bullet points, or asterisks.

1. Score
Write the score in the format: Score: X/10 (e.g., Score: 7/10)

2. Relevance
Briefly check if the student's answer properly addresses the question being asked.

3. Grammar and structure
Give a general evaluation of the quality of the text regarding grammar and structure. Do not correct punctuation marks (commas, periods, question marks, etc.) or capitalization errors. Focus only on grammar, vocabulary, and sentence structure. You don't need to point out specific mistakes but just mention that there were some, if there were and give a general evaluation. In the end remind the reader that he can check his grammar mistakes in detail(if there were) by clicking the button "Correção Detalhada"

4. Corrected Version
Write the student's answer with corrections applied ONLY if there are grammar mistakes or if the content is unclear or difficult to understand or not related to the context. Do not correct punctuation or capitalization. If some words seem to not fit the question or context at all it is possible that it was suppose to be another word with similar sound, so you can replace with that one. The goal is strict correction only, not style improvement. If there are no corrections, just write down the exact phrase the student said but always write down the phrase after "Corrected Version."

5. Vocabulary Usage
Analyze the student's use of the recommended vocabulary words. Comment on:
- Which recommended words they successfully used (if any)
- How appropriately they used them in context
- Suggestions for incorporating more of the recommended vocabulary

Keep each section short and clear. Do not include suggestions, praise, or extra explanations beyond what's requested.

Recommended vocabulary: ${recommendedWords.join(', ')}
Question: ${currentQuestion}
Student Answer: ${answer}`;

    const spanishPrompt = `Eres un profesor de español que evalúa la respuesta escrita de un estudiante a una pregunta. El estudiante recibió vocabulario recomendado para intentar usar en su respuesta. Toda tu respuesta debe estar en español.

Proporciona tu respuesta en cinco secciones claramente etiquetadas. Utiliza un formato limpio con cada título de sección en su propia línea seguido de un salto de párrafo. No uses markdown, viñetas o asteriscos.

1. Puntuación
Escribe la puntuación en el formato: Puntuación: X/10 (ej., Puntuación: 7/10)

2. Relevancia
Comprueba brevemente si la respuesta del estudiante aborda adecuadamente la pregunta formulada.

3. Análisis gramatical
Señala cualquier error gramatical o de ortografía en la respuesta del estudiante. Al analizar la gramática, ignora los signos de puntuación (comas, puntos, signos de interrogación, signos de exclamación) y los errores de mayúsculas. Céntrate únicamente en la estructura gramatical, la elección de palabras y la construcción de frases.

4. Versión corregida
Escribe la respuesta del estudiante con las correcciones aplicadas SÓLO si hay errores gramaticales o si el contenido es poco claro, difícil de entender o no está relacionado con el contexto. Si algunas palabras no parecen encajar en absoluto con la pregunta o el contexto, es posible que debieran ser otra palabra con un sonido similar, así que puedes reemplazarla por esa. El objetivo es una corrección estricta únicamente, no una mejora de estilo. Si no hay correcciones, simplemente escribe la frase exacta que dijo el estudiante, pero siempre escribe la frase después de "Versión corregida".

5. Uso del vocabulario
Analiza el uso del vocabulario recomendado por parte del estudiante. Comenta sobre:
- Qué palabras recomendadas usaron exitosamente (si las hay)
- Qué tan apropiadamente las usaron en contexto
- Sugerencias para incorporar más del vocabulario recomendado

Mantén cada sección corta y clara. No incluyas sugerencias, elogios o explicaciones adicionales más allá de lo solicitado.

Vocabulario recomendado: ${recommendedWords.join(', ')}
Pregunta: ${currentQuestion}
Respuesta del estudiante: ${answer}`;

    const systemPrompt = learningLanguage === 'es' ? spanishPrompt : englishPrompt;

    try {
      const response = await sendMessage(
        `Please provide feedback on this answer: "${answer}"`,
        systemPrompt
      );
      
      if (response) {
        console.log("Received feedback from AI:", response);
        setFeedback(response);
      }
    } catch (error) {
      console.error("Error getting feedback:", error);
      setFeedback(t('feedback_error'));
    } finally {
      setIsGettingFeedback(false);
    }
  };

  const translateToPortuguese = async () => {
    if (!feedback) return;
    
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
        setPortugueseFeedback(response);
      }
    } catch (error) {
      console.error("Error translating feedback:", error);
      setPortugueseFeedback("Erro ao traduzir feedback");
    } finally {
      setIsTranslatingFeedback(false);
    }
  };

  const handleDetailedCorrection = async () => {
    if (!userAnswer.trim()) return;
    
    const correctionResult = await getDetailedCorrection(userAnswer, currentQuestion, selectedDifficulty);
    if (correctionResult) {
      setDetailedCorrectionText(correctionResult);
      setIsDetailedCorrectionOpen(true);
    }
  };

  const handleSubmitAnswer = async () => {
    await submitAnswer(userAnswer, userRecordedAudio);
  };

  const handleSkipQuestion = () => {
    console.log('Skipping question, cleaning up audio');
    cleanupUserAudio();
    
    if (isLastQuestion) {
      setIsActivityCompleted(true);
    } else {
      setQuestionIndex(questionIndex + 1);
    }
  };

  const handleNextQuestion = () => {
    console.log('Moving to next question, cleaning up audio');
    cleanupUserAudio();
    
    if (isLastQuestion) {
      setIsActivityCompleted(true);
    } else {
      setQuestionIndex(questionIndex + 1);
    }
  };

  const resetActivity = () => {
    console.log('Resetting activity, cleaning up all audio');
    cleanupUserAudio();

    setQuestionIndex(0);
    setUserAnswer("");
    setFeedback(null);
    setIsActivityCompleted(false);
    setUserRecordedAudio(null);
    setDetailedCorrectionText(null);
    setIsDetailedCorrectionOpen(false);
    setUsedWords([]);
  };

  const containerClasses = `flex flex-col bg-white ${isEmbedded ? 'h-full' : 'min-h-screen'}`;

  if (isActivityCompleted) {
    return (
      <div className={containerClasses}>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="text-center p-6">
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('activity_completed')}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t('great_job_practicing_vocabulary')}
                </p>
              </div>
              
              <div className="space-y-3">
                {onComplete && (
                  <Button 
                    onClick={onComplete}
                    className="w-full"
                  >
                    {t('continue')}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={resetActivity}
                  className="w-full"
                >
                  {t('practice_again')}
                </Button>
                {onBack && (
                  <Button 
                    variant="ghost" 
                    onClick={onBack}
                    className="w-full"
                  >
                    {t('back')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">
              {topic ? `${t('vocabulary_practice')}: ${topic}` : t('vocabulary_practice')}
            </h1>
            <div className="text-sm text-gray-500">
              {t('question')} {questionIndex + 1} {t('of')} {questions.length}
            </div>
          </div>
          
          {/* Recommended Vocabulary Display */}
          {recommendedWords.length > 0 && (
            <Card className="mb-4 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h3 className="font-medium text-blue-800 mb-2">
                  {t('try_to_use_this_vocabulary')}:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recommendedWords.map((word, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        usedWords.includes(word)
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      {word}
                      {usedWords.includes(word) && (
                        <span className="ml-1">✓</span>
                      )}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2">
                  {currentQuestion}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSpeakMessage(questionIndex, currentQuestion)}
                  disabled={typeof isPlaying === 'object' ? isPlaying[questionIndex] : isPlaying || isLoadingAudio}
                  className="flex items-center gap-2"
                >
                  {(typeof isPlaying === 'object' ? isPlaying[questionIndex] : isPlaying) ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {t('listen')}
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipQuestion}
                className="flex items-center gap-2 text-gray-500"
              >
                <SkipForward className="h-4 w-4" />
                {t('skip')}
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {!showAIInterface ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  {t('teacher_mode_answer_prompt')}
                </p>
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setShowAIInterface(true)}
                  >
                    {t('enable_ai_feedback')}
                  </Button>
                  <Button onClick={handleNextQuestion}>
                    {isLastQuestion ? t('complete') : t('next_question')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <Textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder={t('type_your_answer')}
                    className="min-h-[100px] resize-none"
                    disabled={isGettingFeedback}
                  />
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {recordingState.status === 'idle' && (
                        <Button
                          variant="outline"
                          onClick={handleMicButtonClick}
                          className="flex items-center gap-2"
                          disabled={isTranscribing}
                        >
                          <Mic className="h-4 w-4" />
                          {t('voice_input')}
                        </Button>
                      )}

                      {recordingState.status === 'recording' && (
                        <>
                          <RecordingIndicator />
                          <StopRecordingButton onClick={stopRecording} />
                        </>
                      )}

                      {recordingState.status === 'preview' && (
                        <AudioPreview 
                          onPlay={playAudio}
                          onDelete={cancelAudio}
                          onSend={handleVoiceInput}
                          isPlaying={isVoiceInputPlaying}
                        />
                      )}
                    </div>

                    {userRecordedAudio && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePlayUserAudio}
                        className="flex items-center gap-2"
                      >
                        {isUserAudioPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        {t('your_audio')}
                      </Button>
                    )}

                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={!userAnswer.trim() || isGettingFeedback}
                      className="flex items-center gap-2"
                    >
                      {isGettingFeedback ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : null}
                      {t('get_feedback')}
                    </Button>
                  </div>
                </div>

                {feedback && (
                  <Card className="mt-6 bg-gray-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{t('ai_feedback')}</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={translateToPortuguese}
                            disabled={isTranslatingFeedback}
                            className="flex items-center gap-2"
                          >
                            {isTranslatingFeedback ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : null}
                            🇧🇷 PT
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDetailedCorrection}
                            disabled={isLoadingDetailedCorrection}
                            className="flex items-center gap-2"
                          >
                            {isLoadingDetailedCorrection ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <HelpCircle className="h-4 w-4" />
                            )}
                            {t('detailed_correction')}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="whitespace-pre-wrap">
                          {portugueseFeedback || feedback}
                        </div>
                        
                        {/* Vocabulary Usage Display */}
                        {usedWords.length > 0 && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="font-medium text-green-800 mb-2">
                              {t('vocabulary_words_used')}:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {usedWords.map((word, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium"
                                >
                                  {word} ✓
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Corrected Version Audio */}
                        {(() => {
                          const correctedVersion = extractCorrectedVersion(portugueseFeedback || feedback);
                          if (correctedVersion) {
                            return (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePlayCorrectedAudio(correctedVersion)}
                                  className="flex items-center gap-2"
                                >
                                  <Play className="h-4 w-4" />
                                  {t('listen_correction')}
                                </Button>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        <div className="flex justify-end">
                          <Button
                            onClick={handleNextQuestion}
                            className="flex items-center gap-2"
                          >
                            {isLastQuestion ? t('complete') : t('next_question')}
                            {!isLastQuestion && <SkipForward className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <DetailedCorrectionModal
        isOpen={isDetailedCorrectionOpen}
        onClose={() => setIsDetailedCorrectionOpen(false)}
        originalText={userAnswer}
        correctedText={detailedCorrectionText || ""}
        cleanCorrectedVersion={correctedVersion}
      />
    </div>
  );
};

export default RecommendedVocabularyPage;