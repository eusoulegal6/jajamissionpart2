import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import flashcardIcon from "@/assets/flashcard-icon.png";
import sharedAudioIcon from "@/assets/shared-audio-icon.png";
import { getDisplayImageUrl } from "@/utils/imageOptimization";
import { useLanguage } from "@/contexts/LanguageContext";

interface FlashcardsMenuScreenProps {
  onSelectFlashcards: () => void;
  onSelectAudioFlashcards: () => void;
  onBack: () => void;
}

const FlashcardsMenuScreen: React.FC<FlashcardsMenuScreenProps> = ({
  onSelectFlashcards,
  onSelectAudioFlashcards,
  onBack,
}) => {
  const { t } = useLanguage();

  return (
    <div className="h-full w-full flex flex-col items-center">
      <div className="w-full max-w-2xl p-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <h1 className="text-2xl font-bold mb-6 text-[#202123]">Flashcards</h1>

        <div className="grid grid-cols-1 gap-4">
          <Card
            className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md"
            onClick={onSelectFlashcards}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <img src={flashcardIcon} alt="Flashcards" className="h-12 w-12 mr-5" />
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-1 text-[#202123]">{t('flashcards_card')}</h2>
                  <p className="text-sm text-muted-foreground">Pratique vocabulário com cartões de frente e verso</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md"
            onClick={onSelectAudioFlashcards}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <img
                  src={getDisplayImageUrl("https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/c/rel.png")}
                  alt="Audio Flashcards"
                  className="h-12 w-12 mr-5"
                />
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-1 text-[#202123]">{t('audio_flashcards_card')}</h2>
                  <p className="text-sm text-muted-foreground">Pratique com áudio para melhorar a escuta</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FlashcardsMenuScreen;
