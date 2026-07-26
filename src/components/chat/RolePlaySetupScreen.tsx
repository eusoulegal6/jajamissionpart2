
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Coffee,
  Hotel,
  Users,
  ShoppingBag,
  Plane,
  MapPin,
  Globe,
  Briefcase,
  Footprints,
  Sparkles,
  Zap,
  Flame,
} from "lucide-react";
import AccentSelectionModal from "@/components/AccentSelectionModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type Difficulty = "Fácil" | "Médio" | "Difícil";

const situations: Record<Difficulty, string[]> = {
  "Fácil": [
    "Pedindo comida em um restaurante",
    "Fazendo check-in em um hotel",
    "Conhecendo alguém novo",
  ],
  "Médio": [
    "Comprando roupas em uma loja",
    "Resolvendo um problema no aeroporto",
    "Pedindo informação na rua",
  ],
  "Difícil": [
    "Conversando com um estrangeiro sobre cultura brasileira",
    "Participando de uma reunião de trabalho em inglês",
    "Fazendo um passeio com alguém que você acabou de conhecer",
  ],
};

const situationTranslationKeys: Record<string, string> = {
  "Pedindo comida em um restaurante": "rp_restaurante",
  "Fazendo check-in em um hotel": "rp_hotel",
  "Conhecendo alguém novo": "rp_conhecendo",
  "Comprando roupas em uma loja": "rp_roupas",
  "Resolvendo um problema no aeroporto": "rp_aeroporto",
  "Pedindo informação na rua": "rp_informacao",
  "Conversando com um estrangeiro sobre cultura brasileira": "rp_cultura",
  "Participando de uma reunião de trabalho em inglês": "rp_reuniao",
  "Fazendo um passeio com alguém que você acabou de conhecer": "rp_passeio",
};

const situationIcons: Record<string, React.ElementType> = {
  "Pedindo comida em um restaurante": Coffee,
  "Fazendo check-in em um hotel": Hotel,
  "Conhecendo alguém novo": Users,
  "Comprando roupas em uma loja": ShoppingBag,
  "Resolvendo um problema no aeroporto": Plane,
  "Pedindo informação na rua": MapPin,
  "Conversando com um estrangeiro sobre cultura brasileira": Globe,
  "Participando de uma reunião de trabalho em inglês": Briefcase,
  "Fazendo um passeio com alguém que você acabou de conhecer": Footprints,
};

const situationGradients: Record<string, string> = {
  "Pedindo comida em um restaurante": "from-orange-500 to-red-500",
  "Fazendo check-in em um hotel": "from-blue-500 to-indigo-500",
  "Conhecendo alguém novo": "from-pink-500 to-rose-500",
  "Comprando roupas em uma loja": "from-violet-500 to-purple-500",
  "Resolvendo um problema no aeroporto": "from-sky-500 to-cyan-500",
  "Pedindo informação na rua": "from-emerald-500 to-green-500",
  "Conversando com um estrangeiro sobre cultura brasileira": "from-amber-500 to-yellow-500",
  "Participando de uma reunião de trabalho em inglês": "from-slate-600 to-zinc-700",
  "Fazendo um passeio com alguém que você acabou de conhecer": "from-teal-500 to-cyan-500",
};

const difficultyConfig: Record<Difficulty, {
  icon: React.ElementType;
  gradient: string;
  glow: string;
  ring: string;
  description: string;
  descriptionKey: string;
}> = {
  "Fácil": {
    icon: Sparkles,
    gradient: "from-emerald-400 to-teal-500",
    glow: "shadow-emerald-200/60",
    ring: "ring-emerald-400",
    description: "Situações simples do dia a dia",
    descriptionKey: "rp_facil_desc",
  },
  "Médio": {
    icon: Zap,
    gradient: "from-amber-400 to-orange-500",
    glow: "shadow-amber-200/60",
    ring: "ring-amber-400",
    description: "Interações mais elaboradas",
    descriptionKey: "rp_medio_desc",
  },
  "Difícil": {
    icon: Flame,
    gradient: "from-rose-500 to-red-600",
    glow: "shadow-rose-200/60",
    ring: "ring-rose-400",
    description: "Conversas complexas e abstratas",
    descriptionKey: "rp_dificil_desc",
  },
};

interface RolePlaySetupScreenProps {
  onStart: (options: { difficulty: Difficulty; situation: string }) => void;
  onBack?: () => void;
}

const RolePlaySetupScreen: React.FC<RolePlaySetupScreenProps> = ({ onStart, onBack }) => {
  const { learningLanguage, t } = useLanguage();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);
  const [showAccentModal, setShowAccentModal] = useState(false);

  const handleStartClick = () => {
    if (!difficulty || !selectedSituation) return;
    if (learningLanguage === 'en') {
      setShowAccentModal(true);
    } else {
      onStart({ difficulty: difficulty!, situation: selectedSituation! });
    }
  };

  const handleAccentSelected = () => {
    onStart({ difficulty: difficulty!, situation: selectedSituation! });
  };

  const difficultyLabels: Record<string, string> = {
    "Fácil": t('dificuldade_facil_title'),
    "Médio": t('dificuldade_medio_title'),
    "Difícil": t('dificuldade_dificil_title'),
  };

  return (
    <div className="w-full min-h-full flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </button>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
              {t('simulacao_title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('escolha_dificuldade')}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Step 1: Difficulty */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-slate-900 text-white text-xs font-bold">1</span>
              <h2 className="text-lg font-bold text-foreground">{t('escolha_dificuldade')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {(["Fácil", "Médio", "Difícil"] as Difficulty[]).map((level) => {
                const config = difficultyConfig[level];
                const DiffIcon = config.icon;
                const isSelected = difficulty === level;

                return (
                  <button
                    key={level}
                    onClick={() => {
                      setDifficulty(level);
                      setSelectedSituation(null);
                    }}
                    className={cn(
                      "relative group flex flex-col items-center gap-3 p-5 md:p-6 rounded-2xl border-2 transition-all duration-300",
                      isSelected
                        ? cn("border-transparent ring-2", config.ring, "shadow-xl", config.glow, "scale-[1.02]")
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                    )}
                  >
                    {/* Gradient background when selected */}
                    {isSelected && (
                      <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br opacity-[0.08]", config.gradient)} />
                    )}

                    <div className={cn(
                      "relative flex items-center justify-center h-14 w-14 md:h-16 md:w-16 rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110",
                      `bg-gradient-to-br ${config.gradient}`
                    )}>
                      <DiffIcon className="h-7 w-7 md:h-8 md:w-8" />
                    </div>

                    <div className="relative text-center">
                      <p className="text-base md:text-lg font-bold text-foreground">
                        {difficultyLabels[level]}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        {config.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Situation */}
          {difficulty && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center h-7 w-7 rounded-full bg-slate-900 text-white text-xs font-bold">2</span>
                <h2 className="text-lg font-bold text-foreground">{t('escolha_situacao')}</h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {situations[difficulty].map((situation) => {
                  const SitIcon = situationIcons[situation] || Coffee;
                  const gradient = situationGradients[situation] || "from-slate-500 to-slate-600";
                  const isSelected = selectedSituation === situation;

                  return (
                    <button
                      key={situation}
                      onClick={() => setSelectedSituation(situation)}
                      className={cn(
                        "relative flex items-center gap-4 p-4 md:p-5 rounded-2xl border-2 text-left transition-all duration-300",
                        isSelected
                          ? "border-slate-800 bg-slate-900 shadow-xl scale-[1.01]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center h-12 w-12 md:h-14 md:w-14 shrink-0 rounded-xl text-white shadow-md",
                        `bg-gradient-to-br ${gradient}`
                      )}>
                        <SitIcon className="h-6 w-6 md:h-7 md:w-7" />
                      </div>

                      <p className={cn(
                        "text-base md:text-lg font-semibold leading-snug transition-colors",
                        isSelected ? "text-white" : "text-foreground"
                      )}>
                        {t(situationTranslationKeys[situation] || situation)}
                      </p>

                      {isSelected && (
                        <div className="ml-auto shrink-0">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/20">
                            <ArrowRight className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer CTA */}
      {difficulty && selectedSituation && (
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-xl border-t border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="max-w-2xl mx-auto px-4 md:px-6 py-4">
            <button
              onClick={handleStartClick}
              className="w-full flex items-center justify-center gap-3 py-4 md:py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-lg md:text-xl font-bold shadow-xl shadow-emerald-200/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99]"
            >
              {t('comecar')}
              <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>
        </div>
      )}

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

export default RolePlaySetupScreen;
