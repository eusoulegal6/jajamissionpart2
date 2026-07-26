
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

interface QuestionsSetupScreenProps {
  onStart: (setup: { difficulty: string; theme: string }) => void;
  onBack: () => void;
}

export const difficulties = [
  "Fácil",
  "Médio",
  "Difícil"
];

// Real table names, not runtime mapping
const tableMap = {
  "Fácil": "perguntas_facil",
  "Médio": "perguntas_medio",
  "Difícil": "perguntas_dificil"
} as const;

// For TS: tuple/union of table names
type TableName = typeof tableMap[keyof typeof tableMap];

const QuestionsSetupScreen: React.FC<QuestionsSetupScreenProps> = ({ onStart, onBack }) => {
  const [difficulty, setDifficulty] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [theme, setTheme] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories (themes) for the selected difficulty
  useEffect(() => {
    if (!difficulty) {
      setCategories([]);
      setTheme("");
      return;
    }
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      setCategories([]);
      setTheme("");
      try {
        const table = tableMap[difficulty as keyof typeof tableMap];
        if (!table) {
          setError("Dificuldade inválida.");
          setCategories([]);
          setLoading(false);
          return;
        }
        // Provide explicit types based on table
        type CategoryRow = { category: string };

        const { data, error } = await supabase
          .from(table as TableName)
          .select("category")
          .returns<CategoryRow[]>();

        if (error) {
          setError("Erro ao carregar temas.");
          setCategories([]);
        } else {
          // Get unique categories
          const unique = Array.from(new Set((data || []).map(q => q.category))).sort();
          setCategories(unique);
        }
      } catch {
        setError("Erro inesperado ao buscar temas.");
        setCategories([]);
      }
      setLoading(false);
    };
    fetchCategories();
  }, [difficulty]);

  const handleStart = () => {
    if (difficulty && theme) {
      onStart({ difficulty, theme });
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-4 py-8 bg-gray-50">
      {/* Header with Voltar */}
      <div className="absolute top-0 left-0 w-full z-10">
        <div className="flex items-center bg-white px-4 py-3 border-b gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            aria-label="Voltar"
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-base font-semibold">Perguntas</span>
        </div>
      </div>
      {/* Push down to make space for header on mobile */}
      <div className="h-14" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">Perguntas: Escolha dificuldade e tema</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div>
            <p className="mb-1 font-semibold">Dificuldade</p>
            <div className="flex flex-wrap gap-2">
              {difficulties.map((diff) => (
                <Button
                  key={diff}
                  variant={difficulty === diff ? "default" : "outline"}
                  onClick={() => setDifficulty(diff)}
                  className={difficulty === diff ? "bg-green-500 text-white" : ""}
                  disabled={loading}
                >
                  {diff}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 font-semibold">Tema</p>
            <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
              {!difficulty && (
                <span className="text-gray-400 text-sm">Selecione uma dificuldade primeiro</span>
              )}
              {difficulty && loading && (
                <span className="text-gray-400 text-sm">Carregando temas...</span>
              )}
              {error && (
                <span className="text-red-500 text-sm">{error}</span>
              )}
              {!loading && !error && categories.length === 0 && difficulty && (
                <span className="text-gray-400 text-sm">Nenhum tema encontrado.</span>
              )}
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={theme === cat ? "default" : "outline"}
                  onClick={() => setTheme(cat)}
                  className={theme === cat ? "bg-blue-500 text-white" : ""}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button className="flex-1" disabled={!difficulty || !theme || loading} onClick={handleStart}>
              Começar atividade
            </Button>
            <Button className="flex-1" onClick={onBack} variant="outline" disabled={loading}>
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionsSetupScreen;
