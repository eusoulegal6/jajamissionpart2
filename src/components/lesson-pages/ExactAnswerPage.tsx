import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle } from 'lucide-react';
import { useTeacherMode } from '@/contexts/TeacherModeContext';
import { getDisplayImageUrl } from '@/utils/imageOptimization';

interface ExactAnswerPageProps {
  question: string;
  imageUrl?: string;
  correctAnswers: string[];
  explanation?: string;
}

const ExactAnswerPage: React.FC<ExactAnswerPageProps> = ({
  question,
  imageUrl,
  correctAnswers,
  explanation
}) => {
  const { isFontLarge, isTeacherMode } = useTeacherMode();
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);

  const normalizeAnswer = (answer: string) => {
    return answer.toLowerCase().trim().replace(/[^\w\s]/g, '');
  };

  const checkAnswer = () => {
    const normalizedUserAnswer = normalizeAnswer(userAnswer);
    return correctAnswers.some(correct => 
      normalizeAnswer(correct) === normalizedUserAnswer
    );
  };

  const handleSubmit = () => {
    if (userAnswer.trim()) {
      setShowResult(true);
    }
  };

  const handleReset = () => {
    setUserAnswer('');
    setShowResult(false);
  };

  const isCorrect = showResult && checkAnswer();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6">
            <h2 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isTeacherMode && isFontLarge ? 'text-3xl sm:text-4xl' : ''
            }`}>{question}</h2>
            
            {imageUrl && (
              <div className="mb-6">
                <img 
                  src={getDisplayImageUrl(imageUrl)} 
                  alt="Question" 
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            )}

            <div className="space-y-4">
              <Input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Digite sua resposta aqui..."
                disabled={showResult}
                className={showResult ? (
                  isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                ) : ''}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !showResult && userAnswer.trim()) {
                    handleSubmit();
                  }
                }}
              />

              {!showResult && (
                <div className="flex justify-center">
                  <Button 
                    onClick={handleSubmit}
                    disabled={!userAnswer.trim()}
                    className="px-8"
                  >
                    Responder
                  </Button>
                </div>
              )}

              {showResult && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        isCorrect ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {isCorrect ? 'Correto!' : 'Incorreto'}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-700 mb-2">Respostas aceitas:</p>
                        <ul className="text-sm space-y-1">
                          {correctAnswers.filter(a => a.trim()).map((answer, index) => (
                            <li key={index} className="text-gray-600">• {answer}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {explanation && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Explicação:</h4>
                      <p className="text-sm text-blue-700">{explanation}</p>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <Button 
                      onClick={handleReset}
                      variant="outline"
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExactAnswerPage;