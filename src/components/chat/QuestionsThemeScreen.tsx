
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shuffle as RandomIcon, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, Language } from "@/contexts/LanguageContext";

interface QuestionsThemeScreenProps {
  difficulty: string;
  onSelect: (theme: string) => void;
  onBack: () => void;
  handleAskSpecialist?: () => void;
}

const tableMap = {
  en: {
    "Fácil": "perguntas_facil",
    "Médio": "perguntas_medio",
    "Difícil": "perguntas_dificil"
  },
  es: {
    "Fácil": "perguntas_facil_spanish",
    "Médio": "perguntas_medio_spanish",
    "Difícil": "perguntas_dificil_spanish"
  }
} as const;

type Difficulty = keyof typeof tableMap.en;

const QuestionsThemeScreen: React.FC<QuestionsThemeScreenProps> = ({ difficulty, onSelect, onBack, handleAskSpecialist }) => {
  const [themes, setThemes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language, t } = useLanguage();

  useEffect(() => {
    if (!difficulty) return;
    const fetchThemes = async () => {
      setLoading(true);
      setError(null);
      setThemes([]);
      try {
        const table = tableMap[language as Language]?.[difficulty as Difficulty];
        if (!table) {
          setError(t("dificuldade_invalida"));
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.from(table).select("category");
        if (error) {
          setError(t("erro_carregar_temas"));
          setThemes([]);
        } else {
          const unique = Array.from(new Set((data || []).map(r => r.category))).sort();
          setThemes(unique);
        }
      } catch {
        setError(t("erro_inesperado_temas"));
        setThemes([]);
      }
      setLoading(false);
    };
    fetchThemes();
  }, [difficulty, language, t]);

  const handleRandomTheme = () => {
    if (!themes || themes.length === 0) return;
    const idx = Math.floor(Math.random() * themes.length);
    onSelect(themes[idx]);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
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
            <h1 className="text-xl font-semibold">{t('escolha_o_tema')}</h1>
          </div>
          <div className="w-20 flex justify-end items-center">
            {handleAskSpecialist && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAskSpecialist}
                title="Ask a specialist"
                className="text-gray-500 hover:text-gray-900"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-2xl w-full mx-auto">
          {/* Add random button here */}
          <div className="flex justify-end mb-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleRandomTheme}
              disabled={loading || !!error || themes.length === 0}
              title={t('aleatorio_title')}
            >
              <RandomIcon className="h-4 w-4" />
              {t('aleatorio')}
            </Button>
          </div>
          {loading ? (
            <div className="text-gray-500 italic text-center py-8">{t('carregando_temas')}</div>
          ) : error ? (
            <div className="text-red-500 font-semibold text-center py-8">{error}</div>
          ) : themes.length === 0 ? (
            <div className="text-gray-400 text-center py-8">{t('nenhum_tema_encontrado')}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              {themes.map(theme => (
                <button
                  key={theme}
                  onClick={() => onSelect(theme)}
                  className="group flex h-32 w-full flex-col items-center justify-center rounded-xl border bg-gray-50 p-4 text-center transition-all duration-300 hover:scale-105 hover:border-primary hover:bg-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                >
                  <span className="text-lg font-semibold text-gray-700 transition-colors group-hover:text-primary">
                    {theme}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionsThemeScreen;
