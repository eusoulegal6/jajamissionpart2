
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Headphones } from "lucide-react";
import AccentSelectionModal from "@/components/AccentSelectionModal";
import { useLanguage } from "@/contexts/LanguageContext";

interface ListeningSetupProps {
  handleStartListening: (difficulty?: string) => void;
  handleBackToHome: () => void;
}

const ListeningSetup: React.FC<ListeningSetupProps> = ({
  handleStartListening,
  handleBackToHome
}) => {
  const { t, learningLanguage } = useLanguage();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [showAccentModal, setShowAccentModal] = useState(false);

  const handleDifficultyClick = (difficulty: { value: string; label: string }) => {
    setSelectedDifficulty(difficulty.value);
    if (learningLanguage === 'en') {
      setShowAccentModal(true);
    } else {
      handleStartListening(difficulty.value);
    }
  };

  const handleAccentSelected = () => {
    handleStartListening(selectedDifficulty);
  };

  const difficulties = [
    { value: "easy", label: learningLanguage === 'es' ? "Fácil" : "Easy" },
    { value: "medium", label: learningLanguage === 'es' ? "Medio" : "Medium" },
    { value: "hard", label: learningLanguage === 'es' ? "Difícil" : "Hard" }
  ];


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="w-full max-w-md md:max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleBackToHome}
            className="text-[#202123] hover:bg-[#ececf1] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Headphones className="h-6 w-6 text-[#10a37f]" />
            <h1 className="text-xl font-semibold text-[#202123]">{t('listening_title')}</h1>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-6">
          <h2 className="text-lg md:text-xl font-medium text-[#202123] mb-4">{t('listening_choose_difficulty')}</h2>
          <div className="flex flex-col gap-4">
            {difficulties.map((difficulty, index) => {
              const colors = [
                { bg: "from-[#10a37f] to-[#0e8e6d]", hover: "hover:from-[#0e8e6d] hover:to-[#0c7a5e]" },
                { bg: "from-[#6366f1] to-[#8b5cf6]", hover: "hover:from-[#5558e3] hover:to-[#7c4fe0]" },
                { bg: "from-[#f59e0b] to-[#d97706]", hover: "hover:from-[#d97706] hover:to-[#b45309]" }
              ];
              const color = colors[index];
              return (
                <button
                  key={difficulty.value}
                  onClick={() => handleDifficultyClick(difficulty)}
                  className={`w-full py-5 md:py-6 px-6 rounded-xl text-lg md:text-xl font-semibold text-white shadow-md transition-all transform hover:scale-[1.02] hover:shadow-lg bg-gradient-to-r ${color.bg} ${color.hover}`}
                >
                  {difficulty.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div className="mb-8 space-y-4">
          <h2 className="text-lg font-medium text-[#202123] mb-3">{t('como_funciona')}</h2>
          <div className="space-y-3 text-[#6e6e80]">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#10a37f] text-white rounded-full flex items-center justify-center text-sm font-medium">1</span>
              <p>{t('listening_step1')}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#10a37f] text-white rounded-full flex items-center justify-center text-sm font-medium">2</span>
              <p>{t('listening_step2')}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#10a37f] text-white rounded-full flex items-center justify-center text-sm font-medium">3</span>
              <p>{t('listening_step3')}</p>
            </div>
          </div>
        </div>

        <AccentSelectionModal
          isOpen={showAccentModal}
          onClose={() => setShowAccentModal(false)}
          onAccentSelected={handleAccentSelected}
        />
      </div>
    </div>
  );
};

export default ListeningSetup;