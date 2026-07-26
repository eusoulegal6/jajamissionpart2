
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lightbulb } from "lucide-react";
import AccentSelectionModal from "@/components/AccentSelectionModal";
import { useLanguage } from "@/contexts/LanguageContext";

interface ConversationSetupProps {
  level: string;
  setLevel: (level: string) => void;
  corrections: boolean;
  setCorrections: (corrections: boolean) => void;
  handleStartConversation: () => void;
  handleBackToHome: () => void;
}

const ConversationSetup: React.FC<ConversationSetupProps> = ({
  level,
  setLevel,
  corrections,
  setCorrections,
  handleStartConversation,
  handleBackToHome
}) => {
  const { learningLanguage, t } = useLanguage();
  const [showAccentModal, setShowAccentModal] = useState(false);

  const handleStartClick = () => {
    if (learningLanguage === 'en') {
      setShowAccentModal(true);
    } else {
      handleStartConversation();
    }
  };

  const handleAccentSelected = () => {
    handleStartConversation();
  };

  const levels = [
    { key: 'Básico', label: t('basico') },
    { key: 'Intermediário', label: t('intermediario') },
    { key: 'Avançado', label: t('avancado') },
  ];

  return (
    <div className="w-full px-6 py-6 md:py-10 flex flex-col bg-white">
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleBackToHome}
          className="mr-3 text-[#202123] hover:bg-[#f0f0f0] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold text-[#202123]">{t('pratica_conversacao_title')}</h2>
      </div>
      
      <div className="settings-container">
        <div className="settings-section">
          <h3 className="settings-header">{t('escolha_nivel')}</h3>
          <div className="settings-options">
            {levels.map(({ key, label }) => (
              <Button 
                key={key}
                variant={level === key ? "default" : "outline"}
                className={`settings-button ${level === key ? 'settings-button-selected' : 'settings-button-unselected'}`}
                onClick={() => setLevel(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="settings-section">
          <h3 className="settings-header">{t('deseja_correcoes')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Button 
              variant={corrections ? "default" : "outline"}
              className={`settings-button ${corrections ? 'settings-button-selected' : 'settings-button-unselected'}`}
              onClick={() => setCorrections(true)}
            >
              {t('com_correcao')}
            </Button>
            <Button 
              variant={!corrections ? "default" : "outline"}
              className={`settings-button ${!corrections ? 'settings-button-selected' : 'settings-button-unselected'}`}
              onClick={() => setCorrections(false)}
            >
              {t('sem_correcao')}
            </Button>
          </div>
        </div>
        
        <div className="settings-tip">
          <Lightbulb className="h-5 w-5 text-[#10a37f] mt-0.5 flex-shrink-0" />
          <p className="text-[#6e6e80] text-base leading-relaxed">
            {t('dica_conversacao')}
          </p>
        </div>
        
        <div className="settings-action">
          <Button 
            className="settings-submit"
            onClick={handleStartClick}
          >
            {t('comecar_conversa')}
          </Button>
        </div>
      </div>

      {learningLanguage === 'en' && (
        <AccentSelectionModal
          isOpen={showAccentModal}
          onClose={() => setShowAccentModal(false)}
          onAccentSelected={handleAccentSelected}
        />
      )}
    </div>
  );
};

export default ConversationSetup;