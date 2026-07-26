
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { useLessonAudio } from "@/hooks/use-lesson-audio";
import { getDisplayImageUrl } from "@/utils/imageOptimization";

interface LessonPage {
  type: "content";
  imageUrl: string;
  audioUrl: string;
}

const lessonPages: LessonPage[] = [
  {
    type: "content",
    imageUrl: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800",
    audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
  },
  {
    type: "content",
    imageUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800",
    audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
  }
];

const FullLessons: React.FC = () => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const { playAudio, pauseAudio, stopAudio, isAudioPlaying } = useLessonAudio();

  const currentPage = lessonPages[currentPageIndex];
  const totalPages = lessonPages.length;
  const isPlaying = isAudioPlaying(currentPage.audioUrl);

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      stopAudio();
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentPageIndex < totalPages - 1) {
      stopAudio();
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    const fullResUrl = imageUrl.replace(/\?w=\d+/, '');
    window.open(fullResUrl, '_blank');
  };

  const handleAudioToggle = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio(currentPage.audioUrl, currentPageIndex);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <h1 className="text-xl font-semibold text-center">Full Lesson</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl mx-auto flex flex-col justify-center h-full">
          {/* Image */}
          <div className="mb-6">
            <img
              src={getDisplayImageUrl(currentPage.imageUrl)}
              alt={`Lesson page ${currentPageIndex + 1}`}
              className="w-full rounded-lg shadow-lg cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => handleImageClick(currentPage.imageUrl)}
            />
          </div>

          {/* Audio Controls */}
          <div className="flex justify-center mb-8">
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
              {isPlaying ? "Pause Audio" : "Play Audio"}
            </Button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentPageIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="text-sm text-gray-600 font-medium">
              Page {currentPageIndex + 1} of {totalPages}
            </div>

            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentPageIndex === totalPages - 1}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullLessons;
