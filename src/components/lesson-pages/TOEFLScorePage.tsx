import React from 'react';
import { CheckCircle, XCircle, Target } from 'lucide-react';
import { useScoringContext } from '@/contexts/ScoringContext';

interface TOEFLScorePageProps {
  totalQuestions: number;
}

export const TOEFLScorePage: React.FC<TOEFLScorePageProps> = ({ totalQuestions }) => {
  const { getScore } = useScoringContext();
  const score = getScore();
  const wrong = score.total - score.correct;
  const percentage = totalQuestions > 0 ? Math.round((score.correct / totalQuestions) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">TOEFL Listening Complete!</h1>
          <p className="text-gray-600">Here's how you performed:</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center gap-6 mb-4">
            {/* Correct answers */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-700">{score.correct}</span>
              </div>
              <span className="text-sm text-gray-600">Correct</span>
            </div>
            
            {/* Wrong answers */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-2xl font-bold text-red-700">{wrong}</span>
              </div>
              <span className="text-sm text-gray-600">Wrong</span>
            </div>
            
            {/* Total questions */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-gray-700">{totalQuestions}</span>
              </div>
              <span className="text-sm text-gray-600">Total</span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-1">{percentage}%</div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          You answered {score.correct} out of {totalQuestions} questions correctly
        </div>
      </div>
    </div>
  );
};