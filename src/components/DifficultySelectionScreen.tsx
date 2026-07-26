
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Users, BookOpen, Brain, Briefcase, LogOut, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface UserSession {
  id: string;
  phone_number: string;
  display_name: string | null;
  created_at: string;
  last_login: string;
}

interface DifficultySelectionScreenProps {
  onDifficultySelect: (difficulty: "Fácil" | "Médio" | "Difícil" | "PNL" | "Fluente") => void;
  showAuthInfo?: boolean;
  userInfo?: UserSession | null;
  onLogout?: () => void;
}

const DifficultySelectionScreen: React.FC<DifficultySelectionScreenProps> = ({ 
  onDifficultySelect,
  showAuthInfo = false,
  userInfo,
  onLogout
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleBackToHome = () => {
    navigate("/");
  };

  const difficulties = [
    {
      level: "Fácil" as const,
      icon: GraduationCap,
      title: t('dificuldade_facil_title'),
      description: t('dificuldade_facil_description'),
      color: "from-green-500 to-emerald-600",
      hoverColor: "hover:from-green-600 hover:to-emerald-700"
    },
    {
      level: "Médio" as const,
      icon: Users,
      title: t('dificuldade_medio_title'),
      description: t('dificuldade_medio_description'),
      color: "from-blue-500 to-indigo-600",
      hoverColor: "hover:from-blue-600 hover:to-indigo-700"
    },
    {
      level: "Difícil" as const,
      icon: BookOpen,
      title: t('dificuldade_dificil_title'),
      description: t('dificuldade_dificil_description'),
      color: "from-purple-500 to-violet-600",
      hoverColor: "hover:from-purple-600 hover:to-violet-700"
    },
    {
      level: "Fluente" as const,
      icon: Briefcase,
      title: t('dificuldade_fluente_title'),
      description: t('dificuldade_fluente_description'),
      color: "from-slate-600 to-gray-800",
      hoverColor: "hover:from-slate-700 hover:to-gray-900"
    }
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('voltar')}
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-semibold">{t('licoes_header')}</h1>
          </div>
          <div className="flex items-center gap-2">
            {userInfo && onLogout && (
              <Button
                variant="ghost"
                onClick={onLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
            {!userInfo && <div className="w-20"></div>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Auth info banner */}
          {showAuthInfo && !userInfo && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Autenticação Necessária</p>
                    <p>Para acessar as lições completas e acompanhar seu progresso, você precisará informar seu número de telefone. Isso nos permite salvar seu progresso de forma segura.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Welcome message */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('selecione_nivel')}
            </h2>
          </div>

          {/* Difficulty Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {difficulties.map((difficulty) => {
              const IconComponent = difficulty.icon;
              
              return (
                <Card
                  key={difficulty.level}
                  className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1"
                  onClick={() => onDifficultySelect(difficulty.level)}
                >
                  <div className={`h-2 bg-gradient-to-r ${difficulty.color} group-hover:h-3 transition-all duration-300`} />
                  
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${difficulty.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <span className="text-gray-900 group-hover:text-gray-700 transition-colors duration-200">
                        {difficulty.title}
                      </span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {difficulty.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        {t('clique_selecionar')}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-0.5 bg-gradient-to-r ${difficulty.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
                        <ArrowLeft className={`h-4 w-4 text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform duration-200`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DifficultySelectionScreen;
