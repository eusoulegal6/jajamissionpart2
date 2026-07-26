import React, { useEffect } from "react";
import LessonRunner from "./LessonRunner";
import { ScoringProvider, useScoringContext } from "@/contexts/ScoringContext";
import { ScoreDisplay } from "@/components/ui/score-display";
import { useLocation } from "react-router-dom";

// Inner component that uses the scoring context
const LessonRunnerContent: React.FC = () => {
  const { getScore, resetScore, getScoreForPageType } = useScoringContext();
  const location = useLocation();
  
  // Check if this is a TOEFL listening lesson specifically
  const isToeflListeningLesson = location.pathname.includes('/lesson-runner') && 
    location.state?.returnPath?.includes('/toefl/') && 
    location.state?.returnPath?.includes('listening');
  
  // Reset score when lesson starts (only once per lesson)
  useEffect(() => {
    console.log('🔄 Resetting score for lesson:', location.state?.lessonId);
    resetScore();
  }, [location.state?.lessonId]); // Removed resetScore from dependencies to prevent loops
  
  const totalScore = getScore();
  const multipleChoiceScore = getScoreForPageType('multipleChoice');
  const audioMultipleChoiceScore = getScoreForPageType('audioMultipleChoice');
  
  // Calculate total number of multiple choice questions in the lesson
  const lesson = location.state?.lesson || [];
  const totalQuestions = lesson.filter((page: any) => 
    page.type === 'multipleChoice' || page.type === 'audioMultipleChoice'
  ).length;
  
  // Create custom score that shows progress out of total questions
  const progressScore = {
    correct: totalScore.correct,
    total: totalQuestions,
    percentage: totalQuestions > 0 ? Math.round((totalScore.correct / totalQuestions) * 100) : 0
  };
  
  // Debug logging
  console.log('🎯 Scoring Debug:', {
    pathname: location.pathname,
    returnPath: location.state?.returnPath,
    isToeflListeningLesson,
    totalScore: totalScore.total
  });
  
  return (
    <div className="relative h-screen">
      {/* Main lesson content */}
      <LessonRunner />
    </div>
  );
};

// Main wrapper component with ScoringProvider
const LessonRunnerWithScoring: React.FC = () => {
  return (
    <ScoringProvider>
      <LessonRunnerContent />
    </ScoringProvider>
  );
};

export default LessonRunnerWithScoring;