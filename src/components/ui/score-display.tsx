import React from 'react';
import { CheckCircle, XCircle, Target } from 'lucide-react';
import { ScoreData } from '@/hooks/useScoring';

interface ScoreDisplayProps {
  score: ScoreData;
  title?: string;
  className?: string;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ 
  score, 
  className = ""
}) => {
  const wrong = score.total - score.correct;
  
  return (
    <div className={`bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-md ${className}`}>
      <div className="flex items-center gap-3 text-sm font-medium">
        {/* Correct answers */}
        <div className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-700">{score.correct}</span>
        </div>
        
        {/* Wrong answers */}
        <div className="flex items-center gap-1">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-700">{wrong}</span>
        </div>
        
        {/* Total questions */}
        <div className="flex items-center gap-1">
          <Target className="h-4 w-4 text-blue-600" />
          <span className="text-gray-700">{score.total}</span>
        </div>
      </div>
    </div>
  );
};