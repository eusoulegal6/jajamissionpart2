
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LearningLanguage } from "@/contexts/LanguageContext";

// Difficulty string to table mapping
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

export const useFetchPerguntasQuestions = () => {
  // Params: 
  //   learningLanguage: 'en' | 'es'
  //   difficulty: "Fácil" | "Médio" | "Difícil"
  //   theme: string
  // Returns Promise<{ error: string|null, data: string[] }>
  const fetchQuestions = useCallback(async (learningLanguage: LearningLanguage, difficulty: string, theme:string) => {
    const table = tableMap[learningLanguage]?.[difficulty as Difficulty];
    if (!table) {
      return { data: [], error: "invalid_difficulty" };
    }

    let { data, error } = await supabase
      .from(table)
      .select("question")
      .eq("category", theme);

    if (error) {
      return { data: [], error: "fetch_error" };
    }

    // Gets an array of question strings
    const questions = (data ?? []).map((row: { question: string }) => row.question);
    if (questions.length === 0) {
      return { data: [], error: "no_questions_found" };
    }

    return { data: questions, error: null };
  }, []);

  return {
    fetchQuestions
  };
};
