
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Users, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Difficulties: label, value, icon, color, and custom description
const difficulties = [
  {
    label: "Fácil",
    value: "Fácil",
    color: "from-green-500 to-emerald-600",
    hoverColor: "hover:from-green-600 hover:to-emerald-700",
    icon: GraduationCap,
    descriptionKey: "dificuldade_facil_desc",
  },
  {
    label: "Médio",
    value: "Médio",
    color: "from-blue-500 to-indigo-600",
    hoverColor: "hover:from-blue-600 hover:to-indigo-700",
    icon: Users,
    descriptionKey: "dificuldade_medio_desc",
  },
  {
    label: "Difícil",
    value: "Difícil",
    color: "from-purple-500 to-violet-600",
    hoverColor: "hover:from-purple-600 hover:to-violet-700",
    icon: BookOpen,
    descriptionKey: "dificuldade_dificil_desc",
  },
];

interface QuestionsDifficultyScreenProps {
  onSelect: (difficulty: string) => void;
  onBack: () => void;
}

const QuestionsDifficultyScreen: React.FC<QuestionsDifficultyScreenProps> = ({
  onSelect,
  onBack,
}) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col h-screen bg-white animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('voltar')}
          </Button>
          <div className="flex-1 text-center max-w-md mx-4">
            <h1 className="text-xl font-semibold">
              {t('perguntas_escolha_dificuldade')}
            </h1>
          </div>
          <div className="w-20" />
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {difficulties.map((diff) => {
              const Icon = diff.icon;
              return (
                <button
                  key={diff.value}
                  type="button"
                  onClick={() => onSelect(diff.value)}
                  tabIndex={0}
                  aria-label={`Escolher dificuldade ${diff.label}`}
                  className={`
                    group
                    w-full
                    rounded-xl
                    border-0
                    bg-white
                    text-gray-900
                    font-bold
                    text-lg
                    shadow-lg
                    transition-all
                    duration-300
                    outline-none
                    focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:border-blue-500
                    hover:shadow-2xl
                    active:scale-98
                    cursor-pointer
                    flex flex-col items-stretch justify-between min-h-[220px]
                    p-0
                    overflow-hidden
                  `}
                  style={{ minHeight: 220 }}
                >
                  {/* colored bar */}
                  <div
                    className={`h-2 bg-gradient-to-r ${diff.color} ${diff.hoverColor} transition-all duration-300 group-hover:h-3`}
                  />
                  {/* icon + label */}
                  <div className="flex-1 flex flex-col items-center justify-center p-6 pb-3 gap-3">
                    <div
                      className={`p-3 rounded-lg bg-gradient-to-r ${diff.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-gray-900 group-hover:text-gray-700 transition-colors duration-200 text-xl font-semibold tracking-tight">
                      {diff.label}
                    </span>
                    <p className="text-gray-600 font-normal text-sm leading-snug text-center mt-2 mb-0">
                      {t(diff.descriptionKey)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionsDifficultyScreen;
