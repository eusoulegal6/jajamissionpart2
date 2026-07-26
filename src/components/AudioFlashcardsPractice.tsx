import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shuffle } from 'lucide-react';
import AudioFlashcard from './AudioFlashcard';
import { useIsMobile } from '@/hooks/use-mobile';
interface AudioFlashcard {
  front_text: string;
  back_text: string;
  audio_url: string;
  translation?: string;
}

interface AudioFlashcardsPracticeProps {
  flashcards: AudioFlashcard[];
  onBack?: () => void;
}

const getRandomIndex = (length: number, exclude?: number): number => {
  if (length <= 1) return 0;
  let randomIndex = Math.floor(Math.random() * length);
  while (randomIndex === exclude) {
    randomIndex = Math.floor(Math.random() * length);
  }
  return randomIndex;
};

const AudioFlashcardsPractice: React.FC<AudioFlashcardsPracticeProps> = ({
  flashcards,
  onBack
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const isMobile = useIsMobile();

  const handleNext = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    // First flip to front if showing back
    if (showBack) {
      setShowBack(false);
      // Wait for flip animation to complete before changing card
      setTimeout(() => {
        const newIndex = getRandomIndex(flashcards.length, currentIndex);
        setCurrentIndex(newIndex);
        setAnimationKey(prev => prev + 1); // Trigger card transition animation
        setIsTransitioning(false);
      }, 500); // Match the flip animation duration
    } else {
      // Already on front, just change card with animation
      const newIndex = getRandomIndex(flashcards.length, currentIndex);
      setCurrentIndex(newIndex);
      setAnimationKey(prev => prev + 1); // Trigger card transition animation
      setIsTransitioning(false);
    }
  };

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-lg text-muted-foreground mb-4">No audio flashcards available</p>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 flex items-center justify-between">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <h1 className="text-xl font-semibold text-gray-800">Audio Flashcards</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>
      
      {/* Main content area - on mobile, don't use flex-1 so button stays near card */}
      <div className={`${isMobile ? '' : 'flex-1'} flex flex-col ${isMobile ? 'justify-start pt-4' : 'justify-center'} px-4`}>
        <div className="w-full max-h-96 flex items-center justify-center">
          <div 
            key={animationKey} 
            className="w-full max-w-5xl aspect-[16/9] min-h-[250px] animate-fade-in"
          >
            <AudioFlashcard
              front={currentCard.audio_url}
              back={currentCard.front_text}
              translation={currentCard.translation}
              showBack={showBack}
              onFlip={() => setShowBack(!showBack)}
              className="w-full h-full"
            />
          </div>
        </div>
        
        {/* Button - on mobile, render here right after card */}
        {isMobile && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={handleNext}
              className="px-8 py-3 text-lg font-medium bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              size="lg"
            >
              <Shuffle className="h-5 w-5 mr-2" />
              Practice another
            </Button>
          </div>
        )}
      </div>
      
      {/* Bottom button - desktop only */}
      {!isMobile && (
        <div className="flex-shrink-0 p-6 flex justify-center">
          <Button
            onClick={handleNext}
            className="px-8 py-3 text-lg font-medium bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            size="lg"
          >
            <Shuffle className="h-5 w-5 mr-2" />
            Practice another
          </Button>
        </div>
      )}
    </div>
  );
};

export default AudioFlashcardsPractice;