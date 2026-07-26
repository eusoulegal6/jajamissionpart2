
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTeacherMode } from "@/contexts/TeacherModeContext";

interface Question {
  text: string;
  correctAnswer: boolean;
  explanation: string;
}

interface TrueFalseQuizProps {
  questions?: Question[];
  // Add props for state management
  currentQuestionIndex?: number;
  onQuestionIndexChange?: (index: number) => void;
  userAnswers?: (boolean | null)[];
  onUserAnswersChange?: (answers: (boolean | null)[]) => void;
  showResults?: boolean[];
  onShowResultsChange?: (results: boolean[]) => void;
}

const TrueFalseQuiz: React.FC<TrueFalseQuizProps> = ({ 
  questions: propQuestions,
  currentQuestionIndex: propCurrentQuestionIndex,
  onQuestionIndexChange,
  userAnswers: propUserAnswers,
  onUserAnswersChange,
  showResults: propShowResults,
  onShowResultsChange
}) => {
  // Safe hook usage with error handling
  let t, tLesson;
  let isFontLarge = false;
  let isTeacherMode = false;
  
  try {
    const teacherModeContext = useTeacherMode();
    isFontLarge = teacherModeContext.isFontLarge;
    isTeacherMode = teacherModeContext.isTeacherMode;
  } catch (error) {
    console.warn('TeacherModeContext not available');
  }
  
  try {
    const languageContext = useLanguage();
    t = languageContext.t;
    tLesson = languageContext.tLesson;
  } catch (error) {
    console.warn('LanguageContext not available, using fallback translations');
    // Fallback functions when LanguageContext is not available
    t = (key: string) => {
      const fallbacks: Record<string, string> = {
        'quiz_complete': 'Quiz Complete!',
        'you_completed_quiz': 'You completed this quiz!',
        'take_quiz_again': 'Take Quiz Again',
        'complete_quiz': 'Complete Quiz',
        'next_question_quiz': 'Next Question'
      };
      return fallbacks[key] || key;
    };
    tLesson = (key: string) => {
      const fallbacks: Record<string, string> = {
        'question': 'Question',
        'true': 'True',
        'false': 'False',
        'correct': 'Correct!',
        'incorrect': 'Incorrect',
        'correct_answer': 'Correct Answer',
        'explanation': 'Explanation'
      };
      return fallbacks[key] || key;
    };
  }
  
  const defaultQuestions: Question[] = [
    {
      text: "The sun is a planet.",
      correctAnswer: false,
      explanation: "The sun is a star, not a planet."
    },
    {
      text: "Water boils at 100°C.",
      correctAnswer: true,
      explanation: "That's the boiling point at sea level."
    }
  ];

  const questions = propQuestions || defaultQuestions;

  // Use prop values if provided, otherwise use local state
  const [localCurrentQuestionIndex, setLocalCurrentQuestionIndex] = useState(0);
  const [localUserAnswers, setLocalUserAnswers] = useState<(boolean | null)[]>(() => 
    new Array(questions.length).fill(null)
  );
  const [localShowResults, setLocalShowResults] = useState<boolean[]>(() => 
    new Array(questions.length).fill(false)
  );
  
  // Add immediate answer tracking to fix timing issue
  const [currentQuestionAnswer, setCurrentQuestionAnswer] = useState<boolean | null>(null);

  // Determine which values to use
  const currentQuestionIndex = propCurrentQuestionIndex !== undefined ? propCurrentQuestionIndex : localCurrentQuestionIndex;
  const userAnswers = propUserAnswers || localUserAnswers;
  const showResults = propShowResults || localShowResults;

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const userAnswer = userAnswers[currentQuestionIndex];
  const showResult = showResults[currentQuestionIndex];

  // Safety check: if no questions or currentQuestion is undefined, show error
  if (!questions.length || !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <h2 className="text-xl font-bold text-red-600 mb-4">No Questions Available</h2>
        <p className="text-gray-600 mb-4">This quiz has no questions to display.</p>
      </div>
    );
  }

  // Update local state when props change (for restoration from navigation)
  useEffect(() => {
    if (propCurrentQuestionIndex !== undefined) {
      setLocalCurrentQuestionIndex(propCurrentQuestionIndex);
    }
    if (propUserAnswers) {
      setLocalUserAnswers(propUserAnswers);
    }
    if (propShowResults) {
      setLocalShowResults(propShowResults);
    }
  }, [propCurrentQuestionIndex, propUserAnswers, propShowResults]);

  // Initialize arrays when questions change
  useEffect(() => {
    if (!propUserAnswers) {
      setLocalUserAnswers(new Array(questions.length).fill(null));
    }
    if (!propShowResults) {
      setLocalShowResults(new Array(questions.length).fill(false));
    }
  }, [questions.length, propUserAnswers, propShowResults]);

  // Reset current question answer when question changes
  useEffect(() => {
    setCurrentQuestionAnswer(null);
  }, [currentQuestionIndex]);

  const handleAnswer = (answer: boolean) => {
    // Immediately set the current question answer for display
    setCurrentQuestionAnswer(answer);
    
    const newUserAnswers = [...userAnswers];
    const newShowResults = [...showResults];
    
    newUserAnswers[currentQuestionIndex] = answer;
    newShowResults[currentQuestionIndex] = true;
    
    // Debug logging
    console.log('TrueFalseQuiz - Answer submitted:', {
      userAnswer: answer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect: answer === currentQuestion.correctAnswer,
      questionIndex: currentQuestionIndex
    });
    
    if (propUserAnswers && onUserAnswersChange) {
      onUserAnswersChange(newUserAnswers);
    } else {
      setLocalUserAnswers(newUserAnswers);
    }
    
    if (propShowResults && onShowResultsChange) {
      onShowResultsChange(newShowResults);
    } else {
      setLocalShowResults(newShowResults);
    }
  };

  const handleNextQuestion = () => {
    if (!isLastQuestion) {
      const newIndex = currentQuestionIndex + 1;
      if (onQuestionIndexChange) {
        onQuestionIndexChange(newIndex);
      } else {
        setLocalCurrentQuestionIndex(newIndex);
      }
    }
    // On last question, do nothing - just stay on the review
  };

  const resetQuiz = () => {
    const newIndex = 0;
    const newUserAnswers = new Array(questions.length).fill(null);
    const newShowResults = new Array(questions.length).fill(false);
    
    if (onQuestionIndexChange) {
      onQuestionIndexChange(newIndex);
    } else {
      setLocalCurrentQuestionIndex(newIndex);
    }
    
    if (onUserAnswersChange) {
      onUserAnswersChange(newUserAnswers);
    } else {
      setLocalUserAnswers(newUserAnswers);
    }
    
    if (onShowResultsChange) {
      onShowResultsChange(newShowResults);
    } else {
      setLocalShowResults(newShowResults);
    }
    
    setCurrentQuestionAnswer(null);
  };

  // Use the immediate answer for correctness check when available, otherwise fall back to stored answer
  const answerForCorrectness = currentQuestionAnswer !== null ? currentQuestionAnswer : userAnswer;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ScrollArea className="flex-1">
        {/* Main Content */}
        <div className="flex items-center justify-center p-4 min-h-full pb-24">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-center">
                {tLesson('question')} {currentQuestionIndex + 1} of {questions.length}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Question */}
              <div className="text-center">
                <p className={`text-lg font-medium mb-6 ${
                  isTeacherMode && isFontLarge ? 'text-3xl sm:text-4xl' : ''
                }`}>{currentQuestion.text}</p>
              </div>

              {/* Answer Buttons - Now using tLesson for learning language */}
              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleAnswer(true)}
                  disabled={showResult}
                  className="min-w-[120px]"
                >
                  {tLesson('true')}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleAnswer(false)}
                  disabled={showResult}
                  className="min-w-[120px]"
                >
                  {tLesson('false')}
                </Button>
              </div>

              {/* Result and Explanation */}
              {showResult && (
                <div className="text-center space-y-6">
                  {/* User Answer Result */}
                  <div className="p-4 rounded-lg border-2 bg-white">
                    <div className="text-xl font-bold mb-2">
                      {answerForCorrectness === currentQuestion.correctAnswer ? (
                        <span className="text-green-600 flex items-center justify-center gap-2">
                          <Check className="h-6 w-6" />
                          {tLesson('correct')}
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center justify-center gap-2">
                          <X className="h-6 w-6" />
                          {tLesson('incorrect')}
                        </span>
                      )}
                    </div>
                    
                    {/* Correct Answer Display */}
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm font-medium text-blue-800 mb-1">{tLesson('correct_answer')}</p>
                      <div className="flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-700">
                          {currentQuestion.correctAnswer ? tLesson('true') : tLesson('false')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Explanation */}
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">{tLesson('explanation')}</h3>
                    <p className={`text-gray-700 leading-relaxed ${
                      isTeacherMode && isFontLarge ? 'text-xl' : ''
                    }`}>{currentQuestion.explanation}</p>
                  </div>

                  {!isLastQuestion && (
                    <Button onClick={handleNextQuestion} className="w-full">
                      {t('next_question_quiz')}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default TrueFalseQuiz;
