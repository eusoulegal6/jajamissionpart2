
import React, { useState, useEffect } from "react";
import { Volume2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  front: string;
  back: string;
  showBack?: boolean;
  onFlip?: () => void;
  cardIndex?: number;
  className?: string;
  audio_url?: string;
}

const Flashcard: React.FC<FlashcardProps> = ({
  front,
  back,
  showBack = false,
  onFlip,
  cardIndex = 0,
  className,
  audio_url
}) => {
  const [flipped, setFlipped] = useState(showBack);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    setFlipped(showBack);
  }, [cardIndex, showBack]);

  useEffect(() => {
    if (audio_url) {
      const audio = new Audio(audio_url);
      audio.preload = 'auto';
      setAudioElement(audio);
    }
  }, [audio_url]);

  const handleCardFlip = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFlipped((cur) => !cur);
    if (onFlip) onFlip();
  };

  const handleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audio_url || !audioElement) return;
    
    setIsAudioLoading(true);
    audioElement.currentTime = 0;
    audioElement.play()
      .then(() => setIsAudioLoading(false))
      .catch(() => setIsAudioLoading(false));
  };

  return (
    <div
      className={cn(
        "relative w-full h-full select-none",
        className
      )}
      style={{ perspective: "1000px" }}
    >
      {/* Inner container that rotates */}
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500",
          flipped && "rotate-y-180"
        )}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* FRONT */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl shadow-lg bg-gradient-to-br from-blue-100 via-white to-indigo-100 border-2 border-blue-300"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="w-full h-full p-6 md:p-8 flex flex-col justify-center items-center text-center">
            {/* Word with sound icon beside it */}
            <div className="flex-1 flex items-center justify-center gap-4">
              <span className="text-5xl md:text-7xl lg:text-8xl font-bold text-gray-900 leading-tight max-w-full break-words">
                {front}
              </span>
              {audio_url && (
                <Button
                  size="lg"
                  variant="secondary"
                  className={cn(
                    "w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-2 border-blue-300 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex-shrink-0",
                    isAudioLoading && "animate-pulse"
                  )}
                  onClick={handleAudio}
                  disabled={isAudioLoading}
                >
                  {isAudioLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Volume2 className="w-7 h-7 md:w-8 md:h-8" />
                  )}
                </Button>
              )}
            </div>
            
            {/* Flip button */}
            <div className="flex-shrink-0 mt-0 md:-mt-8">
              <Button
                size="lg"
                variant="secondary"
                className="w-20 h-20 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-4 border-indigo-300 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 [&_svg]:size-auto"
                onClick={handleCardFlip}
              >
                <RotateCcw className="w-10 h-10 md:w-18 md:h-18" />
              </Button>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl shadow-lg bg-gradient-to-br from-indigo-100 via-white to-blue-100 border-2 border-blue-300 rotate-y-180"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="w-full h-full p-6 md:p-8 flex flex-col justify-center items-center text-center">
            <div className="flex-1 flex items-center justify-center">
              <span className="text-5xl md:text-7xl lg:text-8xl font-semibold text-gray-800 leading-tight max-w-full break-words">
                {back}
              </span>
            </div>
            <div className="flex-shrink-0 mt-0 md:-mt-8">
              <Button
                size="lg"
                variant="secondary"
                className="w-20 h-20 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-4 border-indigo-300 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 [&_svg]:size-auto"
                onClick={handleCardFlip}
              >
                <RotateCcw className="w-10 h-10 md:w-18 md:h-18" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .rotate-y-180 {
            transform: rotateY(180deg);
          }
        `
      }} />
    </div>
  );
};

export default Flashcard;
