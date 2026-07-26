import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, RotateCcw } from 'lucide-react';

interface AudioFlashcardProps {
  front: string; // audio URL
  back: string; // English word to show
  translation?: string; // Portuguese translation
  showBack?: boolean;
  onFlip?: () => void;
  cardIndex?: number;
  className?: string;
}

const AudioFlashcard: React.FC<AudioFlashcardProps> = ({
  front: audioUrl,
  back: text,
  translation,
  showBack = false,
  onFlip,
  cardIndex = 0,
  className = "",
}) => {
  const [flipped, setFlipped] = useState(showBack);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Reset flip state when showBack prop changes
  useEffect(() => {
    setFlipped(showBack);
  }, [showBack]);

  // Reload audio when URL changes
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.load();
      setIsPlaying(false);
    }
  }, [audioUrl]);

  const handleCardFlip = () => {
    setFlipped(!flipped);
    if (onFlip) {
      onFlip();
    }
  };

  const handleAudio = async () => {
    if (!audioUrl || !audioRef.current || isPlaying) return;
    
    try {
      setIsPlaying(true);
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  const handleAudioError = () => {
    setIsPlaying(false);
    console.error('Audio playback error');
  };

  return (
    <div className={`relative w-full h-full select-none cursor-pointer rounded-2xl shadow-lg bg-gradient-to-br from-blue-100 via-white to-indigo-100 border-2 border-blue-300 transition-all duration-300 hover:shadow-xl ${className}`}>
      {audioUrl && (
        <audio
          ref={audioRef}
          onEnded={handleAudioEnd}
          onError={handleAudioError}
          preload="metadata"
        >
          <source src={audioUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}

      {/* FRONT - Two big icons: Sound and Flip */}
      <div
        className={`w-full h-full absolute left-0 top-0 transition-transform duration-500 backface-hidden ${
          flipped ? 'rotate-y-180' : ''
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="w-full h-full p-8 flex items-center justify-center gap-8 md:gap-16 rounded-2xl">
          {/* Sound Button */}
          <Button
            variant="secondary"
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              handleAudio();
            }}
            disabled={isPlaying || !audioUrl}
            className={`w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-4 border-blue-300 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 [&_svg]:!size-auto ${isPlaying ? 'animate-pulse' : ''}`}
          >
            <Volume2 className="h-20 w-20 md:h-28 md:w-28 lg:h-32 lg:w-32" />
          </Button>

          {/* Flip Button */}
          <Button
            variant="secondary"
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              handleCardFlip();
            }}
            className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-4 border-indigo-300 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 [&_svg]:!size-auto"
          >
            <RotateCcw className="h-20 w-20 md:h-28 md:w-28 lg:h-32 lg:w-32" />
          </Button>
        </div>
      </div>

      {/* BACK - English word */}
      <div
        className={`w-full h-full absolute left-0 top-0 transition-transform duration-500 backface-hidden ${
          !flipped ? 'rotate-y-180' : ''
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="w-full h-full p-8 flex flex-col justify-center items-center text-center bg-gradient-to-br from-indigo-100 via-white to-blue-100 rounded-2xl">
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <span className="text-3xl md:text-5xl lg:text-6xl font-semibold text-gray-800 leading-tight max-w-full break-words">
              {text}
            </span>
            {translation && (
              <span className="text-lg md:text-2xl lg:text-3xl font-medium text-gray-600 leading-tight max-w-full break-words">
                {translation}
              </span>
            )}
          </div>
          <div className="flex-shrink-0 mt-6">
            <Button
              size="lg"
              variant="secondary"
              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-4 border-indigo-300 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              onClick={(e) => {
                e.stopPropagation();
                handleCardFlip();
              }}
              tabIndex={-1}
            >
              <RotateCcw className="w-8 h-8 md:w-10 md:h-10" />
            </Button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .backface-hidden {
            backface-visibility: hidden;
          }
          .rotate-y-180 {
            transform: rotateY(180deg);
          }
        `
      }} />
    </div>
  );
};

export default AudioFlashcard;