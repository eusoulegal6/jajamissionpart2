import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Play, Pause, Volume2, RotateCcw, SkipForward, Check } from "lucide-react";
import { useChatApi } from "@/hooks/use-chat-api";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useDetailedCorrection } from "@/hooks/useDetailedCorrection";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTeacherMode } from "@/contexts/TeacherModeContext";
import { toast } from "@/hooks/use-toast";
import DetailedCorrectionModal from "./DetailedCorrectionModal";
import { supabase } from "@/integrations/supabase/client";

interface AIFeedbackWithParametersEssayPageProps {
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

const AIFeedbackWithParametersEssayPage: React.FC<AIFeedbackWithParametersEssayPageProps> = ({
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
  const { isTeacherMode, isFontLarge } = useTeacherMode();
  const { language } = useLanguage();
  const { 
    isPlaying, 
    handleSpeakMessage,
    stopAllAudio
  } = useTextToSpeech();
  
  const [userAnswer, setUserAnswer] = useState("");
  const [grammarFeedback, setGrammarFeedback] = useState("");
  const [parametersFeedback, setParametersFeedback] = useState("");
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const [isLoadingParameters, setIsLoadingParameters] = useState(false);
  const [isPlayingCorrectedAudio, setIsPlayingCorrectedAudio] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Questions and parameters state
  const [teacherQuestions, setTeacherQuestions] = useState<string[]>([]);
  const questions = isTeacherMode && teacherQuestions.length > 0 ? teacherQuestions : (propQuestions || []);
  const evaluationParameters = propParameters || [];
  
  // Refs
  const correctedAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeQuestionRunRef = useRef(0);
  
  // Detailed correction state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [correctedText, setCorrectedText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const { getDetailedCorrection, isLoading: isLoadingDetailedCorrection } = useDetailedCorrection();

  const currentQuestion = questions[questionIndex] || "No question available";
  const correctedVersion = grammarFeedback.match(/Versão\s+Corrigida\s*[:\s]*\n?\s*(.+)/i)?.[1]?.trim() || 
                          grammarFeedback.match(/Versão corrigida[:\s]*["']?([^"'\n]+)["']?/i)?.[1] || 
                          grammarFeedback.match(/Correção[:\s]*["']?([^"'\n]+)["']?/i)?.[1] || 
                          grammarFeedback.match(/Forma correta[:\s]*["']?([^"'\n]+)["']?/i)?.[1] || null;

  // Clear teacher-loaded questions when the lesson-provided questions change
  useEffect(() => {
    setTeacherQuestions([]);
  }, [propQuestions]);

  // Enhanced effect to reset state whenever the question changes
  useEffect(() => {
    console.log('AIFeedbackWithParametersEssayPage - Question changed to index:', questionIndex);
    if (questions.length > 0 && questionIndex >= questions.length) {
      setQuestionIndex(0);
      return;
    }
    activeQuestionRunRef.current += 1;
    
    // Reset all question-specific state
    setUserAnswer("");
    setGrammarFeedback("");
    setParametersFeedback("");
    setIsGettingFeedback(false);
    setIsLoadingParameters(false);
    setIsPlayingCorrectedAudio(false);
    setHasSubmitted(false);
    
    // Stop any playing audio
    if (correctedAudioRef.current) {
      correctedAudioRef.current.pause();
      correctedAudioRef.current.currentTime = 0;
    }
    stopAllAudio();
    
    if (isTeacherMode) {
      console.log('Teacher mode - loading question data for index:', questionIndex);
      
      // Load questions from database in teacher mode
      const loadQuestionsFromDatabase = async () => {
        try {
          const { data, error } = await supabase
            .from('perguntas_facil')
            .select('question')
            .limit(10);
          
          if (error) throw error;
          
          const dbQuestions = data?.map(item => item.question) || [];
          if (dbQuestions.length > 0) {
            console.log('Loaded questions from database:', dbQuestions);
              setTeacherQuestions(dbQuestions);
          }
        } catch (error) {
          console.error('Error loading questions:', error);
        }
      };

      loadQuestionsFromDatabase();
    }
  }, [lessonId, questionIndex, currentQuestion, questions.length]);

  useEffect(() => {
    return () => {
      activeQuestionRunRef.current += 1;
      if (correctedAudioRef.current) {
        correctedAudioRef.current.pause();
        correctedAudioRef.current.currentTime = 0;
      }
      stopAllAudio();
    };
  }, []);

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
      
      const response = await fetch('/supabase/functions/v1/speak-elevenlabs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: correctedText,
          slow: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate slow speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audioElement = new Audio(audioUrl);
      audioElement.onended = () => {
        setIsPlayingCorrectedAudio(false);
        URL.revokeObjectURL(audioUrl);
        correctedAudioRef.current = null;
      };
      
      audioElement.onerror = () => {
        console.error('Error playing slow corrected audio');
        setIsPlayingCorrectedAudio(false);
        URL.revokeObjectURL(audioUrl);
        correctedAudioRef.current = null;
      };

      correctedAudioRef.current = audioElement;
      await audioElement.play();
    } catch (error) {
      console.error('Error playing slow corrected audio:', error);
      setIsPlayingCorrectedAudio(false);
    }
  };

  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
      toast({
        title: "Por favor, digite uma resposta antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingFeedback(true);
    setGrammarFeedback("");
    setParametersFeedback("");
    const requestRunId = activeQuestionRunRef.current;

    try {
      // Grammar feedback
      const grammarPrompt = `
        Analyze the following English response and provide a brief grammar overview with a score:

        Question: "${currentQuestion}"
        User's answer: "${userAnswer}"

        Please provide:
        1. A brief overall grammar assessment (not detailed corrections). Do not correct punctuation marks (commas, periods, question marks, etc.) or capitalization errors. Focus only on grammar, vocabulary, and sentence structure.
        2. A grammar score from 0-100
        3. General areas for improvement
        4. A corrected version of the answer (do not correct punctuation or capitalization)

        Response format:
        **Grammar Score:** [score]/100

        **Overall Assessment:**
        [brief assessment here]

        **Corrected Version:** [corrected version here]
      `;

      console.log('Sending grammar analysis request...');
      const grammarResponse = await sendMessage(grammarPrompt, "");
      console.log('Grammar response received:', grammarResponse);
      if (activeQuestionRunRef.current !== requestRunId) return;
      setGrammarFeedback(grammarResponse);

      // Parameters feedback
      if (evaluationParameters.length > 0) {
        setIsLoadingParameters(true);
        
        const parametersPrompt = `
          Avalie a seguinte resposta com base nos critérios específicos fornecidos:

          Pergunta: "${currentQuestion}"
          Resposta do usuário: "${userAnswer}"
          
          Critérios de avaliação:
          ${evaluationParameters.map((param, index) => `${index + 1}. ${param}`).join('\n')}

          Por favor, avalie a resposta considerando cada critério individualmente e forneça feedback específico para cada um.
        `;

        console.log('Sending parameters analysis request...');
        const parametersResponse = await sendMessage(parametersPrompt, "");
        console.log('Parameters response received:', parametersResponse);
          if (activeQuestionRunRef.current !== requestRunId) return;
        setParametersFeedback(parametersResponse);
        setIsLoadingParameters(false);
      }

      setHasSubmitted(true);
    } catch (error) {
      console.error('Error getting feedback:', error);
      if (activeQuestionRunRef.current !== requestRunId) return;
      toast({
        title: "Erro ao obter feedback",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      if (activeQuestionRunRef.current === requestRunId) {
        setIsGettingFeedback(false);
      }
    }
  };

  const handleDetailedCorrection = async () => {
    if (userAnswer.trim() && correctedVersion) {
      setOriginalText(userAnswer);
      const correction = await getDetailedCorrection(userAnswer, correctedVersion, currentQuestion, difficulty);
      if (correction) {
        setCorrectedText(correction);
        setIsModalOpen(true);
      }
    }
  };

  const handleNextQuestion = () => {
    activeQuestionRunRef.current += 1;
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else if (onNext) {
      onNext();
    } else if (onFinish) {
      onFinish();
    }
  };

  const handlePreviousQuestion = () => {
    activeQuestionRunRef.current += 1;
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
    }
  };

  const handleRetry = () => {
    activeQuestionRunRef.current += 1;
    setUserAnswer("");
    setGrammarFeedback("");
    setParametersFeedback("");
    setHasSubmitted(false);
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="p-6">
          <p>Carregando perguntas...</p>
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
              AI Feedback com Parâmetros - Essay
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
                  placeholder="Digite sua resposta aqui..."
                  className="min-h-[300px] max-h-[500px] resize-y"
                  disabled={isGettingFeedback}
                />
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleSubmit}
                  disabled={isGettingFeedback || !userAnswer.trim()}
                  className="px-8 py-2"
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
                  <h3 className="text-lg font-semibold mb-4">Grammar Analysis:</h3>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">
                      {grammarFeedback}
                    </pre>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch('/supabase/functions/v1/translate-word', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ 
                              text: grammarFeedback,
                              targetLanguage: 'Portuguese'
                            }),
                          });
                          
                          if (response.ok) {
                            const result = await response.text();
                            setGrammarFeedback(result);
                          }
                        } catch (error) {
                          console.error('Translation error:', error);
                        }
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Traduzir para Português
                    </Button>
                    
                    {userAnswer.trim() && (
                      <Button
                        onClick={handleDetailedCorrection}
                        variant="outline"
                        size="sm"
                      >
                        Ver Correção Detalhada
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {isLoadingParameters && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Análise por Parâmetros:</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600">Analisando com base nos parâmetros...</p>
                  </div>
                </div>
              )}

              {parametersFeedback && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Análise por Parâmetros:</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">
                      {parametersFeedback}
                    </pre>
                  </div>
                </div>
              )}

              {hasSubmitted && (
                <div className="flex justify-center gap-4 mt-6">
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Tentar Novamente
                  </Button>
                  
                  {questionIndex < questions.length - 1 ? (
                    <Button
                      onClick={handleNextQuestion}
                      className="flex items-center gap-2"
                    >
                      Próxima Pergunta
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextQuestion}
                      disabled={isGettingFeedback || isLoadingParameters}
                      className="flex items-center gap-2"
                    >
                      {isLastLessonPage ? (
                        <>
                          <Check className="h-4 w-4" />
                          Finalizar
                        </>
                      ) : (
                        <>
                          Próxima Página
                          <SkipForward className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          )}

          {!isTeacherMode && questions.length > 1 && (
            <div className="flex justify-between">
              <Button
                onClick={handlePreviousQuestion}
                disabled={questionIndex === 0}
                variant="outline"
              >
                Pergunta Anterior
              </Button>
              <Button
                onClick={handleNextQuestion}
                disabled={questionIndex === questions.length - 1}
                variant="outline"
              >
                Próxima Pergunta
              </Button>
            </div>
          )}
        </div>

        <DetailedCorrectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          correctedText={correctedText}
          originalText={originalText}
          cleanCorrectedVersion={correctedVersion}
        />
      </div>
    </div>
  );
};

export default AIFeedbackWithParametersEssayPage;