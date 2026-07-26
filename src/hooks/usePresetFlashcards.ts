import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PresetFlashcard = {
  id: string;
  front_text: string;
  back_text: string;
  audio_url: string;
  order_index: number;
};

export type PresetFlashcardCategory = {
  id: string;
  name: string;
  description?: string;
  order_index: number;
};

export const usePresetFlashcards = () => {
  const [categories, setCategories] = useState<PresetFlashcardCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("preset_flashcard_categories")
          .select("*")
          .order("order_index", { ascending: true });

        if (error) {
          console.error("Error fetching preset categories:", error);
          setCategories([]);
        } else {
          setCategories(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const getFlashcardsByCategory = useCallback(async (categoryId: string): Promise<PresetFlashcard[]> => {
    try {
      const { data, error } = await supabase
        .from("preset_flashcards")
        .select("*")
        .eq("category_id", categoryId)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error fetching preset flashcards:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error:", error);
      return [];
    }
  }, []);

  return { categories, loading, getFlashcardsByCategory };
};