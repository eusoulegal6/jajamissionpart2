import React, { useState, useMemo, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, ChevronLeft, Loader2, CheckCircle } from 'lucide-react';
import { PNL_LESSONS, PNL_CATEGORY_LABELS, PNLCategory, PNLItem } from '@/data/pnlLessons';
import { useVocabularyAudio } from '@/hooks/useVocabularyAudio';
import { cn } from '@/lib/utils';
import PNLInstructionPopup from './PNLInstructionPopup';

export interface PNLSlidesPageData {
  type: 'pnlSlides';
  title: string;
  lessonId: string;
  category: PNLCategory;
}

interface PNLSlidesPageProps {
  pageData: PNLSlidesPageData;
  onComplete?: () => void;
  canProceed?: boolean;
  onCanProceedChange?: (canProceed: boolean) => void;
}

export interface PNLSlidesPageRef {
  handleExternalNext: () => boolean;
  handleExternalPrevious: () => boolean;
  isFirstSlide: () => boolean;
  isComplete: () => boolean;
}

const PNLSlidesPage = forwardRef<PNLSlidesPageRef, PNLSlidesPageProps>(({
  pageData,
  onComplete,
  canProceed,
  onCanProceedChange,
}, ref) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasCompletedSlideshow, setHasCompletedSlideshow] = useState(false);
  const [showInstructionPopup, setShowInstructionPopup] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Show loading briefly when slide changes
  useEffect(() => {
    if (currentIndex > 0) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  const lesson = PNL_LESSONS[pageData.lessonId];
  const items: PNLItem[] = lesson?.[pageData.category] || [];
  const totalItems = items.length;
  const currentItem = items[currentIndex];

  const allTexts = useMemo(() => items.map(item => item.english), [items]);
  const { play, urlMap, isPreloading } = useVocabularyAudio(allTexts);

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
    if (!currentItem || isPlayingAudio) return;
    
    console.log('[PNL Audio] Playing audio for:', currentItem.english);
    console.log('[PNL Audio] Custom audioUrl:', currentItem.audioUrl);
    console.log('[PNL Audio] urlMap has:', urlMap[currentItem.english]);
    
    setIsPlayingAudio(true);
    try {
      // Use custom audioUrl if available, otherwise use TTS
      if (currentItem.audioUrl) {
        console.log('[PNL Audio] Using CUSTOM audioUrl:', currentItem.audioUrl);
        const audio = new Audio(currentItem.audioUrl);
        await audio.play();
        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
        });
      } else {
        console.log('[PNL Audio] Using TTS from urlMap');
        await play(currentItem.english);
      }
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Auto-play for items WITH custom audioUrl (independent effect - won't be cancelled by urlMap updates)
  useEffect(() => {
    if (currentItem?.audioUrl) {
      const timer = setTimeout(() => {
        handlePlayAudio();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex]); // Only depends on currentIndex

  // Auto-play for items WITHOUT custom audioUrl (waits for urlMap to be ready)
  useEffect(() => {
    if (currentItem && !currentItem.audioUrl && urlMap[currentItem.english] && !isPreloading) {
      const timer = setTimeout(() => {
        handlePlayAudio();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, urlMap, isPreloading]);

  if (!lesson || items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md p-6 text-center bg-white rounded-2xl shadow-lg">
          <p className="text-muted-foreground">
            No content found for this configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[80vh] p-4 sm:p-6 relative">
      {/* Loading overlay during slide transition */}
      {isTransitioning && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {/* Instruction Popup - only on first slide */}
      <PNLInstructionPopup
        isOpen={showInstructionPopup && currentIndex === 0}
        onClose={() => setShowInstructionPopup(false)}
        variant="normal"
      />


      {/* Main content - English word with translation and audio */}
      <div className="flex-1 flex items-center justify-center">
        <div key={currentIndex} className="w-full max-w-2xl p-8 md:p-12 rounded-2xl shadow-lg bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-200 animate-slide-in-fade">
          <div className="flex flex-col items-center text-center gap-6">
            {/* English word */}
            <h3 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight break-words">
              {currentItem.english}
            </h3>
            
            {/* Portuguese translation */}
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground font-medium break-words">
              {currentItem.portuguese}
            </p>
            
            {/* Audio button */}
            <Button
              variant="ghost"
              size="lg"
              onClick={handlePlayAudio}
              disabled={isPlayingAudio || isPreloading}
              className={cn(
                "mt-4 w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105",
                isPlayingAudio && "animate-pulse ring-4 ring-blue-300"
              )}
            >
              {isPlayingAudio ? (
                <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin" />
              ) : (
                <Volume2 className="h-10 w-10 md:h-12 md:w-12" />
              )}
            </Button>
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

PNLSlidesPage.displayName = 'PNLSlidesPage';

export default PNLSlidesPage;
