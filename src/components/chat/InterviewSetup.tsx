
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface InterviewSetupProps {
  handleStartInterview: () => void;
  handleBackToHome: () => void;
}

const InterviewSetup: React.FC<InterviewSetupProps> = ({
  handleStartInterview,
  handleBackToHome
}) => {
  const { t, learningLanguage } = useLanguage();

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
        <h2 className="text-2xl font-bold text-[#202123]">{t('entrevista_title')}</h2>
      </div>
      
      <div className="settings-container">
        <div className="text-left">
          <p className="text-[#202123] mb-6">
            {t('entrevista_desc')}
          </p>
          <p className="text-[#202123] mb-4 font-medium">
            {t('entrevista_recomendado')}
          </p>
        </div>
        
        <div className="settings-action">
          <Button 
            className="settings-submit"
            onClick={handleStartInterview}
          >
            {t('iniciar_entrevista')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetup;