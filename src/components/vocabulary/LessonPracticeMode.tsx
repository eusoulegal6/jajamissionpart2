import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Volume2, Shuffle, RotateCcw, Headphones } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import turtleIcon from "@/assets/turtle-slow-icon.png";
interface PracticeItem {
  english: string;
  portuguese: string;
}
interface LessonPracticeModeProps {
  items: PracticeItem[];
  urlMap: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}
const getRandomIndex = (length: number, exclude?: number): number => {
  if (length <= 1) return 0;
  let randomIndex = Math.floor(Math.random() * length);
  while (randomIndex === exclude) {
    randomIndex = Math.floor(Math.random() * length);
  }
  return randomIndex;
};
export const LessonPracticeMode: React.FC<LessonPracticeModeProps> = ({
  items,
  urlMap,
  isOpen,
  onClose,
  title = "Practice Mode"
}) => {
  const [currentIndex, setCurrentIndex] = useState(() => getRandomIndex(items.length));
  const [showAnswer, setShowAnswer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingSlow, setIsPlayingSlow] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isMobile = useIsMobile();
  const currentItem = items[currentIndex];
  const audioUrl = currentItem ? urlMap[currentItem.english.trim()] : null;

  // Auto-play audio when modal opens or when changing to a new item
  useEffect(() => {
    if (isOpen && audioUrl && audioRef.current && !showAnswer) {
      const playAudio = async () => {
        try {
          audioRef.current!.playbackRate = 1;
          audioRef.current!.load();
          await new Promise(resolve => setTimeout(resolve, 300));
          setIsPlaying(true);
          await audioRef.current!.play();
        } catch (error) {
          console.error("Error auto-playing audio:", error);
          setIsPlaying(false);
        }
      };
      playAudio();
    }
  }, [isOpen, audioUrl, animationKey]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowAnswer(false);
      setIsPlaying(false);
      setIsPlayingSlow(false);
    }
  }, [isOpen]);
  const handlePlayAudio = async () => {
    if (!audioUrl || !audioRef.current || isPlaying || isPlayingSlow) return;
    try {
      setIsPlaying(true);
      audioRef.current.playbackRate = 1;
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    }
  };
  const handlePlaySlowAudio = async () => {
    if (!audioUrl || !audioRef.current || isPlaying || isPlayingSlow) return;
    try {
      setIsPlayingSlow(true);
      audioRef.current.playbackRate = 0.6;
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      console.error("Error playing slow audio:", error);
      setIsPlayingSlow(false);
    }
  };
  const handleAudioEnd = () => {
    setIsPlaying(false);
    setIsPlayingSlow(false);
    if (audioRef.current) {
      audioRef.current.playbackRate = 1;
    }
  };
  const handleAudioError = () => {
    setIsPlaying(false);
    setIsPlayingSlow(false);
    console.error("Audio playback error");
  };
  const handleNext = useCallback(() => {
    setShowAnswer(false);
    setTimeout(() => {
      const newIndex = getRandomIndex(items.length, currentIndex);
      setCurrentIndex(newIndex);
      setAnimationKey(prev => prev + 1);
    }, 200);
  }, [items.length, currentIndex]);
  const handleFlip = () => {
    setShowAnswer(!showAnswer);
  };
  if (!currentItem) return null;
  return <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent hideCloseButton className="max-w-none w-screen h-screen max-h-screen rounded-none border-none p-0 bg-gradient-to-br from-blue-50 to-indigo-100">
        {audioUrl && <audio ref={audioRef} onEnded={handleAudioEnd} onError={handleAudioError} preload="auto">
            <source src={audioUrl} type="audio/mpeg" />
          </audio>}

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Headphones className="w-5 h-5 text-sky-600" />
            {title}
          </h2>
          <button type="button" onClick={onClose} className="p-3 rounded-full bg-white/80 hover:bg-white shadow-md transition">
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Main content */}
        <div key={animationKey} className={`w-full h-full flex flex-col items-center ${isMobile ? 'justify-start pt-20' : 'justify-center'} animate-fade-in`}>
          {/* Card container - centered horizontally */}
          <div className="relative w-[90%] max-w-2xl mx-auto aspect-[16/10] min-h-[280px] max-h-[400px] select-none cursor-pointer rounded-2xl shadow-lg bg-gradient-to-br from-blue-100 via-white to-indigo-100 border-2 border-blue-300 transition-all duration-300 hover:shadow-xl">
            
            {/* FRONT - Two big icons: Sound and Flip */}
            <div className={`w-full h-full absolute left-0 top-0 transition-transform duration-500 backface-hidden ${showAnswer ? 'rotate-y-180' : ''}`} style={{
            transformStyle: "preserve-3d"
          }}>
              <div className="w-full h-full p-8 gap-8 md:gap-16 rounded-2xl flex flex-col items-center justify-center">
                <div className="flex items-center justify-center gap-8 md:gap-16">
                  {/* Sound Button */}
                  <Button variant="secondary" size="lg" onClick={e => {
                  e.stopPropagation();
                  handlePlayAudio();
                }} disabled={isPlaying || isPlayingSlow || !audioUrl} className={`w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-4 border-blue-300 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 [&_svg]:size-auto ${isPlaying ? 'animate-pulse' : ''}`}>
                    <Volume2 className="h-10 w-10 md:h-16 md:w-16 lg:h-20 lg:w-20" />
                  </Button>

                  {/* Flip Button */}
                  <Button variant="secondary" size="lg" onClick={e => {
                  e.stopPropagation();
                  handleFlip();
                }} className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-4 border-indigo-300 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 [&_svg]:size-auto">
                    <RotateCcw className="h-10 w-10 md:h-16 md:w-16 lg:h-20 lg:w-20" />
                  </Button>
                </div>
                
                {/* Slow Audio Button (Turtle) */}
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={e => {
                    e.stopPropagation();
                    handlePlaySlowAudio();
                  }} 
                  disabled={isPlaying || isPlayingSlow || !audioUrl} 
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 border-2 border-yellow-300 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${isPlayingSlow ? 'animate-pulse' : ''}`}
                >
                  <img src={turtleIcon} alt="Slow playback" className="h-9 w-9 md:h-11 md:w-11" />
                </Button>
              </div>
            </div>

            {/* BACK - English word */}
            <div className={`w-full h-full absolute left-0 top-0 transition-transform duration-500 backface-hidden ${!showAnswer ? 'rotate-y-180' : ''}`} style={{
            transformStyle: "preserve-3d"
          }}>
              <div className="w-full h-full p-8 flex flex-col justify-center items-center text-center bg-gradient-to-br from-indigo-100 via-white to-blue-100 rounded-2xl">
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <span className="text-3xl md:text-5xl lg:text-6xl font-semibold text-gray-800 leading-tight max-w-full break-words">
                    {currentItem.english}
                  </span>
                  <span className="text-lg md:text-2xl lg:text-3xl font-medium text-gray-600 leading-tight max-w-full break-words">
                    {currentItem.portuguese}
                  </span>
                </div>
                <div className="flex-shrink-0 mt-2">
                  <Button size="lg" variant="secondary" className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-4 border-indigo-300 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 [&_svg]:size-auto" onClick={e => {
                  e.stopPropagation();
                  handleFlip();
                }} tabIndex={-1}>
                    <RotateCcw className="w-10 h-10 md:w-12 md:h-12" />
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

          {/* Button - on mobile, render here right after card */}
          {isMobile && <div className="mt-6 flex justify-center">
              <Button onClick={handleNext} className="px-8 py-3 text-lg font-medium bg-sky-600 hover:bg-sky-700" size="lg">
                <Shuffle className="h-5 w-5 mr-2" />
                Practice another
              </Button>
            </div>}
        </div>

        {/* Bottom button - desktop only */}
        {!isMobile && <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center">
            <Button onClick={handleNext} className="px-8 py-3 text-lg font-medium bg-sky-600 hover:bg-sky-700" size="lg">
              <Shuffle className="h-5 w-5 mr-2" />
              Practice another
            </Button>
          </div>}
      </DialogContent>
    </Dialog>;
};
export default LessonPracticeMode;