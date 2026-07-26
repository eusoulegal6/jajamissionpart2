import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { renderHighlightedText } from '@/utils/textHighlightingUtils';
import { ScrollHintIndicator } from '@/components/ui/scroll-hint-indicator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTeacherMode } from '@/contexts/TeacherModeContext';

interface Question {
  id: string;
  question: string;
  answer: boolean;
  explanation?: string;
}

interface TrueFalseWithTextPageProps {
  title?: string;
  text: string;
  questions: Question[];
  questionIndex: number;
  setQuestionIndex: (index: number) => void;
  onComplete?: () => void;
  isEmbedded?: boolean;
}

const TrueFalseWithTextPage: React.FC<TrueFalseWithTextPageProps> = ({
  title,
  text,
  questions = [],
  questionIndex,
  setQuestionIndex,
  onComplete,
  isEmbedded = false
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { isFontLarge, isTeacherMode } = useTeacherMode();
  const [answers, setAnswers] = useState<{ [key: string]: boolean | null }>({});
  const [showResults, setShowResults] = useState<{ [key: string]: boolean }>({});
  const resultRef = useRef<HTMLDivElement | null>(null);

  const currentQuestion = questions[questionIndex];
  const hasAnswered = currentQuestion && answers[currentQuestion.id] !== undefined;
  const isCorrect = hasAnswered && answers[currentQuestion.id] === currentQuestion.answer;
  const isLastQuestion = questionIndex === questions.length - 1;

  useEffect(() => {
    // Reset answer state when question changes
    setAnswers({});
    setShowResults({});
  }, [questions]);

  // Auto-scroll to explanation once results render for the current question
  useEffect(() => {
    if (currentQuestion && showResults[currentQuestion.id]) {
      const id = window.requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return () => window.cancelAnimationFrame(id);
    }
  }, [showResults, currentQuestion]);

  const handleAnswer = (answer: boolean) => {
    if (!currentQuestion) return;
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
    
    setShowResults(prev => ({
      ...prev,
      [currentQuestion.id]: true
    }));
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setQuestionIndex(questionIndex + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const resetExercise = () => {
    setQuestionIndex(0);
    setAnswers({});
    setShowResults({});
  };

  const getScore = () => {
    const totalAnswered = Object.keys(answers).length;
    const correctAnswers = questions.filter(q => 
      answers[q.id] === q.answer
    ).length;
    return { correct: correctAnswers, total: totalAnswered };
  };

  const containerClasses = `flex flex-col ${isEmbedded ? 'h-full' : 'min-h-screen'} bg-gray-50`;


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
        {title && (
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {title}
            </h1>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 h-auto lg:h-[calc(100vh-140px)]">
          {/* Text Reading Area */}
          <Card className="flex flex-col overflow-hidden h-full">
            <CardContent className="p-6 overflow-hidden flex flex-col flex-1 h-full">
              <ScrollArea className="h-full min-h-[400px] lg:min-h-[calc(100vh-220px)] pr-4">
                <div className="prose prose-lg max-w-none">
                  {text.split('\n').map((paragraph, index) => (
                    <p key={index} className={`mb-4 text-gray-700 leading-relaxed text-lg lg:text-xl ${
                      isTeacherMode && isFontLarge ? 'text-xl md:text-2xl' : ''
                    }`}>
                      {renderHighlightedText(paragraph)}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Question Area */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl lg:text-2xl">
                  Question {questionIndex + 1}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* Progress indicators */}
                  {questions.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index < questionIndex 
                          ? 'bg-green-500' 
                          : index === questionIndex 
                            ? 'bg-blue-500' 
                            : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Question */}
                <div>
                  <p className={`text-xl lg:text-2xl font-medium text-gray-900 mb-4 ${
                    isTeacherMode && isFontLarge ? 'text-2xl md:text-3xl' : ''
                  }`}>
                    {currentQuestion.question}
                  </p>
                </div>

                {/* Answer Buttons */}
                {!hasAnswered ? (
                  <div className="flex gap-8 justify-center">
                    <Button
                      onClick={() => handleAnswer(true)}
                      variant="outline"
                      size="lg"
                      className="h-14 px-6 text-base font-medium bg-green-50 border-2 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400"
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                      True
                    </Button>
                    <Button
                      onClick={() => handleAnswer(false)}
                      variant="outline"
                      size="lg"
                      className="h-14 px-6 text-base font-medium bg-red-50 border-2 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
                    >
                      <XCircle className="h-5 w-5 mr-2 text-red-600" />
                      False
                    </Button>
                  </div>
                ) : (
                  /* Results */
                  <div className="space-y-4" ref={resultRef}>
                    <div className={`p-4 rounded-lg border-2 ${
                      isCorrect 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className={`font-medium ${
                          isCorrect ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {isCorrect ? t('correct') : t('incorrect')}
                        </span>
                      </div>
                      
                      <p className={`text-base ${
                        isCorrect ? 'text-green-700' : 'text-red-700'
                      }`}>
                        Your Answer: {answers[currentQuestion.id] ? 'True' : 'False'}
                      </p>
                      <p className={`text-base ${
                        isCorrect ? 'text-green-700' : 'text-red-700'
                      }`}>
                        Correct Answer: {currentQuestion.answer ? 'True' : 'False'}
                      </p>
                    </div>

                    {/* Explanation */}
                    {currentQuestion.explanation && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2 text-lg">
                          Explanation:
                        </h4>
                        <p className="text-blue-800 text-base">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    )}

                    {/* Next/Complete Button */}
                    {!isLastQuestion ? (
                      <Button
                        onClick={handleNext}
                        className="w-full flex items-center justify-center gap-2"
                        size="lg"
                      >
                        Next Question
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={onComplete}
                        className="w-full flex items-center justify-center gap-2"
                        size="lg"
                      >
                        Continue to Next Page
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrueFalseWithTextPage;