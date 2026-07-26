
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FlashcardType = {
  front: string;
  back: string;
};

export type FlashcardDeck = {
  id: string;
  title: string;
  cards: FlashcardType[];
};

export const useFlashcards = (difficulty: string) => {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!difficulty) {
      setDecks([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const fetchDecks = async () => {
      const { data, error } = await supabase
        .from("flashcards")
        .select("id, title, cards")
        .eq("difficulty", difficulty)
        .order("title", { ascending: true });

      if (error || !data) {
        setDecks([]);
      } else {
        setDecks(
          Array.isArray(data)
            ? data.map((deck) => ({
                id: deck.id,
                title: deck.title,
                cards: Array.isArray(deck.cards) ? deck.cards as FlashcardType[] : [],
              }))
            : []
        );
      }
      setLoading(false);
    };

    fetchDecks();
  }, [difficulty]);

  return { decks, loading };
};
