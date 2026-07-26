import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { usePresetFlashcards, PresetFlashcard } from '@/hooks/usePresetFlashcards';
import AudioFlashcardsPractice from './AudioFlashcardsPractice';

interface PresetAudioFlashcardsPracticeProps {
  selectedCategories: string[];
  onBack: () => void;
}

const PresetAudioFlashcardsPractice: React.FC<PresetAudioFlashcardsPracticeProps> = ({
  selectedCategories,
  onBack
}) => {
  const { getFlashcardsByCategory } = usePresetFlashcards();
  const [flashcards, setFlashcards] = useState<PresetFlashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlashcards = async () => {
      setLoading(true);
      try {
        const allFlashcards: PresetFlashcard[] = [];
        
        for (const categoryId of selectedCategories) {
          const categoryFlashcards = await getFlashcardsByCategory(categoryId);
          allFlashcards.push(...categoryFlashcards);
        }
        
        setFlashcards(allFlashcards);
      } catch (error) {
        console.error('Error fetching flashcards:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedCategories.length > 0) {
      fetchFlashcards();
    } else {
      setLoading(false);
    }
  }, [selectedCategories, getFlashcardsByCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Transform preset flashcards to audio flashcard format
  const audioFlashcards = flashcards.map(card => ({
    front_text: card.front_text,
    back_text: card.front_text, // Show English word on back
    audio_url: card.audio_url,
    translation: card.back_text // Portuguese translation
  }));

  return (
    <AudioFlashcardsPractice
      flashcards={audioFlashcards}
      onBack={onBack}
    />
  );
};

export default PresetAudioFlashcardsPractice;