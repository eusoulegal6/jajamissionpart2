
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DailyLessonSetupProps {
  level: string;
  setLevel: (level: string) => void;
  handleStartDailyLesson: () => void;
  handleBackToHome: () => void;
}

const DailyLessonSetup: React.FC<DailyLessonSetupProps> = ({
  level,
  setLevel,
  handleStartDailyLesson,
  handleBackToHome
}) => {
  const { t } = useLanguage();

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
        <h2 className="text-2xl font-bold text-[#202123]">{t('licao_do_dia')}</h2>
      </div>
      
      <div className="md:max-w-[900px] md:mx-auto w-full rounded-xl border border-[#dcdcdc] shadow-sm">
        <div className="md:p-8 p-6">
          <div className="mb-8">
            <h3 className="text-xl font-medium mb-6 text-[#202123]">{t('escolha_nivel')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
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
          
          <div className="flex md:justify-center justify-center mt-6">
            <Button 
              className="settings-submit w-full md:max-w-[350px]"
              onClick={handleStartDailyLesson}
            >
              {t('iniciar_licao')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyLessonSetup;