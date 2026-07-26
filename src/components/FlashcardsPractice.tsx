
import React, { useState } from "react";
import Flashcard from "./Flashcard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface FlashcardsPracticeProps {
  flashcards: { front: string; back: string; audio_url?: string }[];
  onBack?: () => void;
}

const getRandomIndex = (length: number, exclude?: number) => {
  if (length <= 1) return 0;
  let idx;
  do {
    idx = Math.floor(Math.random() * length);
  } while (idx === exclude);
  return idx;
};

const FlashcardsPractice: React.FC<FlashcardsPracticeProps> = ({ flashcards, onBack }) => {
  const [current, setCurrent] = useState<number>(0);
  const [animationKey, setAnimationKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    setIsLoading(true);
    setCurrent((prev) => getRandomIndex(flashcards.length, prev));
    setAnimationKey(prev => prev + 1);
    
    // Show loading for a brief moment to ensure smooth transition
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  if (flashcards.length === 0) {
    return (
      <div className="text-center text-gray-500">
        Não encontramos nenhum flashcard para praticar neste nível ainda.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold text-gray-800">Prática de Flashcards</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col justify-center px-4 pb-20">
        <div className="w-full h-full max-h-96 flex items-center justify-center">
          {isLoading ? (
            <div className="w-full max-w-5xl aspect-[16/9] min-h-[250px] rounded-2xl shadow-lg bg-gradient-to-br from-blue-100 via-white to-indigo-100 border-2 border-blue-300 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-600 font-medium">Carregando...</span>
              </div>
            </div>
          ) : (
            <div 
              key={animationKey} 
              className="w-full max-w-5xl aspect-[16/9] min-h-[250px] animate-fade-in"
            >
              <Flashcard
                front={flashcards[current].front}
                back={flashcards[current].back}
                cardIndex={current}
                audio_url={flashcards[current].audio_url}
                className="w-full h-full"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom button */}
      <div className="flex-shrink-0 p-6 flex justify-center">
        <Button
          onClick={handleNext}
          className="px-8 py-3 text-lg font-medium"
          variant="secondary"
          size="lg"
        >
          Praticar outro
        </Button>
      </div>
    </div>
  );
};

export default FlashcardsPractice;
