import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { usePresetFlashcards, PresetFlashcard } from "@/hooks/usePresetFlashcards";
import Flashcard from "./Flashcard";
import { useIsMobile } from "@/hooks/use-mobile";
import flashcardIcon from "@/assets/flashcard-icon.png";

interface PresetFlashcardsPracticeProps {
  categoryId: string;
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

const PresetFlashcardsPractice: React.FC<PresetFlashcardsPracticeProps> = ({ categoryId, onBack }) => {
  const [flashcards, setFlashcards] = useState<PresetFlashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<number>(0);
  const { getFlashcardsByCategory } = usePresetFlashcards();
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadFlashcards = async () => {
      setLoading(true);
      const cards = await getFlashcardsByCategory(categoryId);
      setFlashcards(cards);
      setCurrent(0);
      setLoading(false);
    };

    if (categoryId) {
      loadFlashcards();
    }
  }, [categoryId]);

  const handleNext = () => {
    setCurrent((prev) => getRandomIndex(flashcards.length, prev));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center text-gray-500 p-8">
        Nenhum flashcard encontrado nesta categoria.
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
        <img src={flashcardIcon} alt="Flashcards" className="h-10 w-10" />
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>
      
      {/* Main content area */}
      <div className={`${isMobile ? '' : 'flex-1'} flex flex-col ${isMobile ? 'justify-start pt-4' : 'justify-center'} px-4`}>
        <div className="w-full max-h-96 flex items-center justify-center">
          <div className="w-full max-w-5xl aspect-[16/9] min-h-[250px]">
            <Flashcard
              front={flashcards[current].front_text}
              back={flashcards[current].back_text}
              cardIndex={current}
              audio_url={flashcards[current].audio_url}
              className="w-full h-full"
            />
          </div>
        </div>
        
        {/* Button - on mobile, render here right after card */}
        {isMobile && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={handleNext}
              className="px-8 py-3 text-lg font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
              size="lg"
            >
              Praticar outro
            </Button>
          </div>
        )}
      </div>
      
      {/* Bottom button - desktop only */}
      {!isMobile && (
        <div className="flex-shrink-0 p-6 flex justify-center">
          <Button
            onClick={handleNext}
            className="px-8 py-3 text-lg font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
            size="lg"
          >
            Praticar outro
          </Button>
        </div>
      )}
    </div>
  );
};

export default PresetFlashcardsPractice;