import React, { createContext, useContext } from 'react';
import { useScoring as useScoringHook, ScoreData, QuestionResult } from '@/hooks/useScoring';

interface ScoringContextType {
  addResult: (questionIndex: number, isCorrect: boolean, pageIndex: number, pageType: string) => void;
  getScore: () => ScoreData;
  resetScore: () => void;
  getScoreForPageType: (pageType: string) => ScoreData;
  results: QuestionResult[];
}

const ScoringContext = createContext<ScoringContextType | undefined>(undefined);

export const ScoringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scoring = useScoringHook();
  
  return (
    <ScoringContext.Provider value={scoring}>
      {children}
    </ScoringContext.Provider>
  );
};

export const useScoringContext = (): ScoringContextType => {
  const context = useContext(ScoringContext);
  if (context === undefined) {
    throw new Error('useScoringContext must be used within a ScoringProvider');
  }
  return context;
};