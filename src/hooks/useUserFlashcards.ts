import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePhoneAuth } from "@/contexts/PhoneAuthContext";

export type UserFlashcard = {
  id: string;
  front_text: string;
  back_text: string;
  audio_url?: string;
  created_at: string;
};

export const useUserFlashcards = () => {
  const [flashcards, setFlashcards] = useState<UserFlashcard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user: phoneUser } = usePhoneAuth();

  const fetchFlashcards = async () => {
    // Use phone auth user ID
    const userId = phoneUser?.id;
    
    if (!userId) {
      setFlashcards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("user_flashcards")
        .select("id, front_text, back_text, audio_url, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        setFlashcards([]);
      } else {
        setFlashcards(data || []);
      }
    } catch (err) {
      setError("Failed to fetch flashcards");
      setFlashcards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phoneUser?.id) {
      fetchFlashcards();
    }
  }, [phoneUser?.id]);

  const addFlashcard = async (frontText: string, backText: string, audioUrl?: string) => {
    // Use phone auth user ID
    const userId = phoneUser?.id;
    
    if (!userId) {
      console.error("No phone auth user found");
      return null;
    }

    console.log("Adding flashcard with:", { userId, frontText, backText, audioUrl });

    try {
      const { data, error } = await supabase
        .from("user_flashcards")
        .insert({
          user_id: userId,
          front_text: frontText,
          back_text: backText,
          audio_url: audioUrl,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase error adding flashcard:", error);
        throw error;
      }

      console.log("Successfully added flashcard:", data);
      setFlashcards(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error("Error adding flashcard:", err);
      return null;
    }
  };

  const deleteFlashcard = async (id: string) => {
    // Use phone auth user ID
    const userId = phoneUser?.id;
    
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from("user_flashcards")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;

      setFlashcards(prev => prev.filter(card => card.id !== id));
      return true;
    } catch (err) {
      console.error("Error deleting flashcard:", err);
      return false;
    }
  };

  return {
    flashcards,
    loading,
    error,
    addFlashcard,
    deleteFlashcard,
    refetch: fetchFlashcards,
  };
};