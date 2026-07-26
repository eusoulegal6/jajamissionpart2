import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AudioSlide {
  english: string;
  translation: string;
  audioUrl?: string;
  imageUrl?: string;
  /** Authoring-only: prompt used to generate the slide image. Never rendered to students. */
  _imagePrompt?: string;
}

export interface AudioSlidesPageData {
  type: 'audioSlides';
  title: string;
  slides: AudioSlide[];
}

interface AudioSlidesPageProps {
  pageData: AudioSlidesPageData;
  onComplete?: () => void;
  canProceed?: boolean;
  onCanProceedChange?: (canProceed: boolean) => void;
}

export interface AudioSlidesPageRef {
  handleExternalNext: () => boolean;
  handleExternalPrevious: () => boolean;
  isFirstSlide: () => boolean;
  isComplete: () => boolean;
}

const AudioSlidesPage = forwardRef<AudioSlidesPageRef, AudioSlidesPageProps>(({
  pageData,
  onComplete,
  canProceed,
  onCanProceedChange,
}, ref) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasCompletedSlideshow, setHasCompletedSlideshow] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const slides = pageData.slides || [];
  const totalItems = slides.length;
  const currentSlide = slides[currentIndex];

  // Show loading briefly when slide changes
  useEffect(() => {
    if (currentIndex > 0) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === totalItems - 1;

  useImperativeHandle(ref, () => ({
    handleExternalNext: () => {
      if (hasCompletedSlideshow) {
        return true;
      }
      
      if (isLastSlide) {
        setHasCompletedSlideshow(true);
        return true;
      } else {
        setCurrentIndex(prev => prev + 1);
        return false;
      }
    },
    handleExternalPrevious: () => {
      if (isFirstSlide) {
        return true;
      } else {
        setCurrentIndex(prev => prev - 1);
        return false;
      }
    },
    isFirstSlide: () => isFirstSlide,
    isComplete: () => hasCompletedSlideshow,
  }), [currentIndex, isFirstSlide, isLastSlide, hasCompletedSlideshow]);

  useEffect(() => {
    if (onCanProceedChange) {
      onCanProceedChange(true);
    }
  }, [onCanProceedChange]);

  const handlePlayAudio = async () => {
    if (!currentSlide || isPlayingAudio || !currentSlide.audioUrl) return;
    
    setIsPlayingAudio(true);
    try {
      const audio = new Audio(currentSlide.audioUrl);
      await audio.play();
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
      });
    } finally {
      setIsPlayingAudio(false);
    }
  };

  // Auto-play audio when slide changes
  useEffect(() => {
    if (currentSlide?.audioUrl) {
      const timer = setTimeout(() => {
        handlePlayAudio();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  if (!slides || slides.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md p-6 text-center bg-white rounded-2xl shadow-lg">
          <p className="text-muted-foreground">
            No slides configured for this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[80vh] p-4 sm:p-6">
      {/* Loading overlay during slide transition */}
      {isTransitioning && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {/* Main content - English word with translation and audio */}
      <div className="flex-1 flex items-center justify-center">
        <div key={currentIndex} className="w-full max-w-2xl p-6 md:p-10 rounded-2xl shadow-lg bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-200 animate-slide-in-fade">
          <div className="flex flex-col items-center text-center gap-5">
            {/* Optional image */}
            {currentSlide.imageUrl && (
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden shadow-md border border-blue-100 flex-shrink-0">
                <img
                  src={currentSlide.imageUrl}
                  alt={currentSlide.english}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* English word/phrase */}
            <h3 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight break-words">
              {currentSlide.english}
            </h3>
            
            {/* Portuguese translation */}
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground font-medium break-words">
              {currentSlide.translation}
            </p>
            
            {/* Audio button */}
            {currentSlide.audioUrl && (
              <Button
                variant="ghost"
                size="lg"
                onClick={handlePlayAudio}
                disabled={isPlayingAudio}
                className={cn(
                  "mt-2 w-18 h-18 md:w-22 md:h-22 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105",
                  isPlayingAudio && "animate-pulse ring-4 ring-blue-300"
                )}
              >
                {isPlayingAudio ? (
                  <Loader2 className="h-8 w-8 md:h-10 md:w-10 animate-spin" />
                ) : (
                  <Volume2 className="h-8 w-8 md:h-10 md:w-10" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 max-w-2xl mx-auto w-full">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / totalItems) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
});

AudioSlidesPage.displayName = 'AudioSlidesPage';

export default AudioSlidesPage;
