import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, ArrowRight, RotateCcw, Check, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { renderHighlightedText } from '@/utils/textHighlightingUtils';
import { usePrevious } from '@/hooks/usePrevious';
import { ScrollHintIndicator } from '@/components/ui/scroll-hint-indicator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTeacherMode } from '@/contexts/TeacherModeContext';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface MultipleChoiceWithTextPageProps {
  title?: string;
  text: string;
  questions: Question[];
  onComplete?: () => void;
  isEmbedded?: boolean;
  initialState?: {
    currentQuestionIndex?: number;
    answers?: { [key: string]: number | null };
    showResults?: { [key: string]: boolean };
    isCompleted?: boolean;
  };
  onStateChange?: (state: {
    currentQuestionIndex: number;
    answers: { [key: string]: number | null };
    showResults: { [key: string]: boolean };
    isCompleted: boolean;
  }) => void;
  nextSignal?: number;
}

const MultipleChoiceWithTextPage: React.FC<MultipleChoiceWithTextPageProps> = ({
  title,
  text,
  questions = [],
  onComplete,
  isEmbedded = false,
  initialState,
  onStateChange,
  nextSignal,
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { isFontLarge, isTeacherMode } = useTeacherMode();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialState?.currentQuestionIndex || 0);
  const [answers, setAnswers] = useState<{ [key: string]: number | null }>(initialState?.answers || {});
  const [showResults, setShowResults] = useState<{ [key: string]: boolean }>(initialState?.showResults || {});
  const [isCompleted, setIsCompleted] = useState(initialState?.isCompleted || false);

  const currentQuestion = questions[currentQuestionIndex];
  const hasAnswered = currentQuestion && answers[currentQuestion.id] !== undefined;
  const isCorrect = hasAnswered && answers[currentQuestion.id] === currentQuestion.correctAnswer;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  useEffect(() => {
    // Reset state when questions change
    if (!initialState) {
      setCurrentQuestionIndex(0);
      setAnswers({});
      setShowResults({});
      setIsCompleted(false);
    }
  }, [questions, initialState]);

  // Force reset when text content changes (new page)
  useEffect(() => {
    if (!initialState) {
      setCurrentQuestionIndex(0);
      setAnswers({});
      setShowResults({});
      setIsCompleted(false);
    }
  }, [text, initialState]);

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        currentQuestionIndex,
        answers,
        showResults,
        isCompleted
      });
    }
  }, [currentQuestionIndex, answers, showResults, isCompleted, onStateChange]);

  // Respond to external "next" signals (from LessonNavigation)
  const previousNextSignal = usePrevious(nextSignal);
  useEffect(() => {
    if (nextSignal === undefined) return;
    if (previousNextSignal === undefined) return; // Skip initial render
    if (nextSignal === previousNextSignal) return; // No change
    if (isCompleted) return;
    if (isLastQuestion) {
      setIsCompleted(true);
    } else {
      setCurrentQuestionIndex((prev) => Math.min(prev + 1, questions.length - 1));
    }
  }, [nextSignal, previousNextSignal]);

  const handleAnswer = (optionIndex: number) => {
    if (!currentQuestion) return;
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionIndex
    }));
    
    setShowResults(prev => ({
      ...prev,
      [currentQuestion.id]: true
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setIsCompleted(true);
      // Don't auto-complete, let the navigation button handle it
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const resetExercise = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults({});
    setIsCompleted(false);
  };

  const getScore = () => {
    const totalAnswered = Object.keys(answers).length;
    const correctAnswers = questions.filter(q => 
      answers[q.id] === q.correctAnswer
    ).length;
    return { correct: correctAnswers, total: totalAnswered };
  };

  const containerClasses = `flex flex-col ${isEmbedded ? 'h-full' : 'min-h-screen'} bg-gray-50`;

  if (isCompleted) {
    const { correct, total } = getScore();
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    return (
      <div className={containerClasses}>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="text-center p-6">
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('exercise_completed')}
                </h2>
                <p className="text-gray-600 mb-4">
                  {t('your_score')}: {correct}/{total} ({percentage}%)
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={resetExercise}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t('try_again')}
                </Button>
                {onComplete && (
                  <Button 
                    onClick={onComplete}
                    className="w-full"
                  >
                    {t('continue')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className={containerClasses}>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="text-center p-6">
              <p className="text-gray-600">
                {t('no_questions_available')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {isMobile && <ScrollHintIndicator />}
      <div className="flex-1 p-4 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-sm">
                Question {currentQuestionIndex + 1} {t('of')} {questions.length}
              </Badge>
              {/* Score Display - Hidden on mobile */}
              <div className="hidden lg:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 font-medium">
                    {questions.filter(q => answers[q.id] === q.correctAnswer).length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-red-700 font-medium">
                    {Object.keys(answers).filter(qId => {
                      const question = questions.find(q => q.id === qId);
                      return question && answers[qId] !== question.correctAnswer;
                    }).length}
                  </span>
                </div>
                <div className="text-gray-600">
                  / {questions.length}
                </div>
              </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 min-h-[500px] lg:h-[calc(100vh-140px)]">
          {/* Text Reading Area */}
          <Card className="flex flex-col h-full min-h-[400px] lg:min-h-0 border-2 border-gray-200">
            <CardHeader className="pb-3 flex-shrink-0 bg-gray-50 border-b">
              <CardTitle className="text-lg">
                {title || t('reading_text')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-lg max-w-none h-full">
                {text.split('\n').map((paragraph, index) => (
                  <p key={index} className={`mb-4 text-gray-700 leading-relaxed text-lg lg:text-xl ${
                    isTeacherMode && isFontLarge ? 'text-xl lg:text-2xl' : ''
                  }`}>
                    {renderHighlightedText(paragraph)}
                  </p>
                ))}
                {/* Extra padding at bottom for comfortable scrolling */}
                <div className="h-20"></div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Score Display - Between text and questions */}
          <div className="lg:hidden p-3 bg-white rounded-lg shadow-sm border mb-4">
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-700 font-medium">
                  {questions.filter(q => answers[q.id] === q.correctAnswer).length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <X className="h-4 w-4 text-red-600" />
                <span className="text-red-700 font-medium">
                  {Object.keys(answers).filter(qId => {
                    const question = questions.find(q => q.id === qId);
                    return question && answers[qId] !== question.correctAnswer;
                  }).length}
                </span>
              </div>
              <div className="text-gray-600">
                / {questions.length}
              </div>
            </div>
          </div>

          {/* Question Area */}
          <Card className="flex flex-col h-full">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl lg:text-2xl">
                  Question {currentQuestionIndex + 1}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* Progress indicators */}
                  {questions.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index < currentQuestionIndex 
                          ? 'bg-green-500' 
                          : index === currentQuestionIndex 
                            ? 'bg-blue-500' 
                            : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6 pb-20">
                  {/* Question */}
                  <div>
                    <p className={`text-lg lg:text-2xl font-medium text-gray-900 mb-4 ${
                      isTeacherMode && isFontLarge ? 'text-2xl lg:text-3xl' : ''
                    }`}>
                      {currentQuestion.question}
                    </p>
                  </div>

                  {/* Answer Options */}
                  {!hasAnswered ? (
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                          <Button
                          key={index}
                          onClick={() => handleAnswer(index)}
                          variant="outline"
                          size="lg"
                          className="w-full h-auto p-4 text-left justify-start hover:bg-blue-50 hover:border-blue-300"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className={`text-gray-900 break-words whitespace-normal ${
                              isTeacherMode && isFontLarge ? 'text-xl lg:text-2xl' : 'text-base lg:text-lg'
                            }`}>{option}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    /* Results */
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg border-2 ${
                        isCorrect 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className={`h-5 w-5 ${
                            isCorrect ? 'text-green-600' : 'text-red-600'
                          }`} />
                          <span className={`font-medium ${
                            isCorrect ? 'text-green-800' : 'text-gray-800'
                          }`}>
                            {isCorrect ? t('correct') : t('incorrect')}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {currentQuestion.options.map((option, index) => (
                            <div
                              key={index}
                              className={`flex items-center gap-3 p-2 rounded ${
                                index === currentQuestion.correctAnswer
                                  ? 'bg-green-100 border border-green-300'
                                  : index === answers[currentQuestion.id]
                                    ? 'bg-red-100 border border-red-300'
                                    : 'bg-white border border-gray-200'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                                index === currentQuestion.correctAnswer
                                  ? 'bg-green-100 border-green-500 text-green-700'
                                  : index === answers[currentQuestion.id]
                                    ? 'bg-red-100 border-red-500 text-red-700'
                                    : 'border-gray-300 text-gray-500'
                              }`}>
                                {String.fromCharCode(65 + index)}
                              </div>
                              <span className={`${
                                index === currentQuestion.correctAnswer
                                  ? 'text-green-800 font-medium'
                                  : index === answers[currentQuestion.id]
                                    ? 'text-red-800'
                                    : 'text-gray-700'
                              }`}>
                                {option}
                              </span>
                              {index === currentQuestion.correctAnswer && (
                                <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Explanation */}
                      {currentQuestion.explanation && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2 text-lg">
                            {t('explanation')}:
                          </h4>
                          <div className="text-blue-800 text-base space-y-2">
                            {currentQuestion.explanation.split('\n').map((paragraph, index) => (
                              <p key={index} className="leading-relaxed">
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Next Button */}
                      <Button
                        onClick={handleNext}
                        className="w-full flex items-center justify-center gap-2"
                        size="lg"
                      >
                        {isLastQuestion ? t('finish') : t('next_question')}
                        {!isLastQuestion && <ArrowRight className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MultipleChoiceWithTextPage;