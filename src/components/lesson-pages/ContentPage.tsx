import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import LessonNavigation from "./LessonNavigation";

import { useLanguage } from "@/contexts/LanguageContext";
import { getDisplayImageUrl } from "@/utils/imageOptimization";
import OptimizedImg from "@/components/common/OptimizedImg";

interface AudioContext {
  playAudio: (audioUrl: string, pageIndex: number) => void;
  pauseAudio: () => void;
  isAudioPlaying: (audioUrl: string) => boolean;
}

interface ContentPageProps {
  imageUrl: string;
  audioUrl: string;
  pageIndex: number;
  audioContext?: AudioContext;
  onNext?: () => void;
  onPrevious?: () => void;
  isFirstPage: boolean;
  isLastPage: boolean;
  pageNumber: number;
  totalPages: number;
  onComplete?: () => void;
  hasCompletedLesson: boolean;
  isAuthenticated: boolean;
  lessonData?: any;
  selectedDifficulty?: string;
  returnPath?: string;
  pnlConsultationLessonId?: string;
}

const ContentPage: React.FC<ContentPageProps> = ({ 
  imageUrl, 
  audioUrl, 
  pageIndex, 
  audioContext,
  onNext,
  onPrevious,
  isFirstPage,
  isLastPage,
  pageNumber,
  totalPages,
  onComplete,
  hasCompletedLesson,
  isAuthenticated,
  lessonData,
  selectedDifficulty,
  returnPath,
  pnlConsultationLessonId
}) => {
  const { tLesson } = useLanguage();
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const isPlaying = audioContext?.isAudioPlaying(audioUrl) || false;

  const handleImageClick = (imageUrl: string) => {
    // Remove width parameter for full resolution
    const fullResUrl = imageUrl.replace(/\?w=\d+/, '');
    window.open(fullResUrl, '_blank');
  };

  const handleAudioToggle = () => {
    if (!audioContext) return;
    
    if (isPlaying) {
      audioContext.pauseAudio();
    } else {
      audioContext.playAudio(audioUrl, pageIndex);
    }
  };

  return (
    <div className="flex flex-col h-full">
      
      <div className="flex-1 flex flex-col items-center justify-center p-4 pb-24">
        <div className="w-full max-w-2xl mx-auto">
          {/* Image */}
          <div className="mb-6">
            <OptimizedImg
              src={imageUrl}
              alt="Lesson content"
              className="w-full h-auto object-contain rounded-lg shadow-lg cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => handleImageClick(imageUrl)}
            />
          </div>

          {/* Audio Controls */}
          {audioContext && audioUrl && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={handleAudioToggle}
                className="flex items-center gap-2"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
                {isPlaying ? tLesson('pause_audio') : tLesson('play_audio')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <LessonNavigation
        onNext={onNext}
        onPrevious={onPrevious}
        isFirstPage={isFirstPage}
        isLastPage={isLastPage}
        pageNumber={pageNumber}
        totalPages={totalPages}
        onComplete={onComplete}
        hasCompletedLesson={hasCompletedLesson}
        isAuthenticated={isAuthenticated}
        lessonData={lessonData}
        selectedDifficulty={selectedDifficulty}
        currentPageIndex={pageIndex}
        returnPath={returnPath}
        onHighlightModeChange={setIsHighlightMode}
        pnlConsultationLessonId={pnlConsultationLessonId}
      />
    </div>
  );
};

export default ContentPage;
