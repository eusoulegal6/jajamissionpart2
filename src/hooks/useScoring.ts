import { useState } from 'react';

export interface ScoreData {
  correct: number;
  total: number;
  percentage: number;
}

export interface QuestionResult {
  questionIndex: number;
  isCorrect: boolean;
  pageIndex: number;
  pageType: string;
}

export const useScoring = () => {
  const [results, setResults] = useState<QuestionResult[]>([]);
  
  const addResult = (questionIndex: number, isCorrect: boolean, pageIndex: number, pageType: string) => {
    console.log('📊 useScoring - Adding result:', {
      questionIndex,
      isCorrect,
      pageIndex,
      pageType
    });
    
    setResults(prev => {
      // Check if we already have a result for this question on this page
      const existingIndex = prev.findIndex(
        r => r.questionIndex === questionIndex && r.pageIndex === pageIndex
      );
      
      const newResult: QuestionResult = {
        questionIndex,
        isCorrect,
        pageIndex,
        pageType
      };
      
      if (existingIndex >= 0) {
        // Update existing result
        const updated = [...prev];
        updated[existingIndex] = newResult;
        console.log('📊 useScoring - Updated existing result, new results:', updated);
        return updated;
      } else {
        // Add new result
        const newResults = [...prev, newResult];
        console.log('📊 useScoring - Added new result, new results:', newResults);
        return newResults;
      }
    });
  };
  
  const getScore = (): ScoreData => {
    const total = results.length;
    const correct = results.filter(r => r.isCorrect).length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    return { correct, total, percentage };
  };
  
  const resetScore = () => {
    setResults([]);
  };
  
  const getScoreForPageType = (pageType: string): ScoreData => {
    const filteredResults = results.filter(r => r.pageType === pageType);
    const total = filteredResults.length;
    const correct = filteredResults.filter(r => r.isCorrect).length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    return { correct, total, percentage };
  };

  return {
    addResult,
    getScore,
    resetScore,
    getScoreForPageType,
    results
  };
};