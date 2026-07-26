
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Circle, Image, Camera, ClipboardCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type GameProps = {
  handleStartGame: (gameType: string) => void;
  handleBackToHome: () => void;
  handleQuizSelect: () => void;
};

const GamesSetup: React.FC<GameProps> = ({ handleStartGame, handleBackToHome, handleQuizSelect }) => {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-5xl px-6 py-8 flex flex-col items-center">
      <div className="w-24 h-auto mb-6 animate-fade-in">
        <img 
          src="/lovable-uploads/27a9e05b-01c1-4f55-9cc2-6f5e6758c158.png" 
          alt="Tutor Virtual" 
          className="w-full h-auto"
        />
      </div>
      
      <h1 className="text-2xl md:text-3xl font-bold mb-3 text-[#202123] animate-scale-in">
        {t('jogos_interativos')}
      </h1>
      <p className="text-[#6e6e80] text-base md:text-lg mb-8 max-w-md text-center">
        {t('escolha_jogo')}
      </p>
      
      <div className="w-full max-w-3xl mb-8">
        <Button 
          onClick={handleBackToHome}
          variant="outline" 
          className="mb-6 text-[#6e6e80] border-[#e5e5e5] hover:bg-[#f5f5f5]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('voltar')}
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 w-full animate-fade-in">
          <Card 
            className="bg-gradient-to-r from-[#f0f0ff] to-[#f8f8ff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#e9e9ff] hover:to-[#f5f5ff] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" 
            onClick={handleQuizSelect}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <ClipboardCheck className="h-10 w-10 mr-5 text-[#8B5CF6]" />
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-1.5 text-[#202123]">Quiz 🧠</h2>
                  <p className="text-[#6e6e80] text-sm">
                    {t('quiz_desc_games')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-gradient-to-r from-[#f0f0ff] to-[#f8f8ff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#e9e9ff] hover:to-[#f5f5ff] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md"
            onClick={() => handleStartGame("dreamPainter")}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <Image className="h-10 w-10 mr-5 text-[#8B5CF6]" />
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-1.5 text-[#202123]">Dream Painter 🎨</h2>
                  <p className="text-[#6e6e80] text-sm">
                    {t('dream_painter_desc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-gradient-to-r from-[#f0f0ff] to-[#f8f8ff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#e9e9ff] hover:to-[#f5f5ff] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md md:col-span-2 md:mx-auto md:max-w-[calc(50%-12px)]"
            onClick={() => handleStartGame("realWorldHunt")}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <Camera className="h-10 w-10 mr-5 text-[#8B5CF6]" />
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-1.5 text-[#202123]">Real-World Hunt 📷</h2>
                  <p className="text-[#6e6e80] text-sm">
                    {t('real_world_hunt_desc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GamesSetup;