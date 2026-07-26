import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Volume2, Loader2, ChevronRight } from 'lucide-react';
import { usePhoneAuth } from '@/contexts/PhoneAuthContext';
import { useUserFlashcards, UserFlashcard } from '@/hooks/useUserFlashcards';
import { usePresetFlashcards } from '@/hooks/usePresetFlashcards';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import AudioFlashcardsPractice from './AudioFlashcardsPractice';
import PresetAudioFlashcardsPractice from './PresetAudioFlashcardsPractice';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserAudioFlashcardsPageProps {
  onBack: () => void;
}

interface ValidationResult {
  valid: boolean;
  normalized: string;
  suggestions?: string[];
}

type ViewMode = 'selection' | 'user-add' | 'user-practice' | 'preset-practice';

const UserAudioFlashcardsPage: React.FC<UserAudioFlashcardsPageProps> = ({ onBack }) => {
  const { user } = usePhoneAuth();
  const { flashcards, loading: flashcardsLoading, addFlashcard, deleteFlashcard } = useUserFlashcards();
  const { categories, loading: categoriesLoading } = usePresetFlashcards();
  const { handleSpeakMessage, isPlaying } = useTextToSpeech();

  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const validateWord = async (word: string): Promise<ValidationResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-word', {
        body: { word: word.trim() }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error validating word:', error);
      return null;
    }
  };

  const translateWord = async (word: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('translate-word', {
        body: { word: word.trim() }
      });

      if (error) throw error;
      return data?.translation || null;
    } catch (error) {
      console.error('Error translating word:', error);
      return null;
    }
  };

  const generateAndUploadAudio = async (word: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('speak-elevenlabs', {
        body: { text: word.trim() }
      });

      if (error) throw error;

      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))], 
        { type: 'audio/mpeg' }
      );

      const fileName = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('flashcard-audio')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('flashcard-audio')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error generating and uploading audio:', error);
      return null;
    }
  };

  const handleAddFlashcard = async () => {
    if (!frontText.trim() || !backText.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both fields",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    try {
      // Validate the English word
      const validation = await validateWord(frontText);
      if (!validation?.valid) {
        toast({
          title: "Invalid word",
          description: "Please enter a valid English word",
          variant: "destructive"
        });
        return;
      }

      // Generate audio for the English word
      const audioUrl = await generateAndUploadAudio(validation.normalized);
      if (!audioUrl) {
        toast({
          title: "Error",
          description: "Failed to generate audio",
          variant: "destructive"
        });
        return;
      }

      // Add the flashcard
      await addFlashcard(validation.normalized, backText.trim(), audioUrl);
      
      setFrontText('');
      setBackText('');
      
      toast({
        title: "Success",
        description: "Audio flashcard added successfully!"
      });
    } catch (error) {
      console.error('Error adding flashcard:', error);
      toast({
        title: "Error",
        description: "Failed to add flashcard",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteFlashcard = async (id: string) => {
    try {
      await deleteFlashcard(id);
      toast({
        title: "Success",
        description: "Flashcard deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      toast({
        title: "Error",
        description: "Failed to delete flashcard",
        variant: "destructive"
      });
    }
  };

  const handlePlayAudio = (audioUrl?: string) => {
    if (audioUrl) {
      handleSpeakMessage(0, audioUrl);
    }
  };

  const handleBack = () => {
    if (viewMode === 'selection') {
      onBack();
    } else {
      setViewMode('selection');
      setSelectedCategories([]);
    }
  };

  if (flashcardsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const Header = () => (
    <div className="flex items-center justify-between mb-6">
      <Button variant="outline" onClick={handleBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <h1 className="text-2xl font-bold">Audio flashcards</h1>
      <div></div>
    </div>
  );

  if (viewMode === 'user-practice') {
    const audioFlashcards = flashcards.map(card => ({
      front_text: card.front_text,
      back_text: card.front_text, // Show English word on back
      audio_url: card.audio_url || '',
      translation: card.back_text // Portuguese translation
    }));

    return (
      <div className="max-w-4xl mx-auto p-6">
        <AudioFlashcardsPractice
          flashcards={audioFlashcards}
          onBack={handleBack}
        />
      </div>
    );
  }

  if (viewMode === 'preset-practice') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <PresetAudioFlashcardsPractice
          selectedCategories={selectedCategories}
          onBack={handleBack}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Header />

      {viewMode === 'selection' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Audio Flashcards */}
          <Card>
            <CardHeader>
              <CardTitle>Practice Your Flashcards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {flashcards.length === 0 
                  ? "You haven't created any flashcards yet."
                  : `You have ${flashcards.length} flashcard${flashcards.length === 1 ? '' : 's'} available for practice.`
                }
              </p>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Para adicionar novos flashcards, vá para a seção "Flashcards" no menu principal.
                </p>
              </div>
              {flashcards.length > 0 && (
                <Button 
                  onClick={() => setViewMode('user-practice')}
                  className="w-full"
                >
                  Practice Your Flashcards
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Preset Audio Flashcards */}
          <Card>
            <CardHeader>
              <CardTitle>Preset Flashcards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Choose from our collection of preset flashcard categories.
              </p>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant="secondary"
                    onClick={() => {
                      setSelectedCategories([category.id]);
                      setViewMode('preset-practice');
                    }}
                    className="w-full justify-between py-3 h-auto rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <span>{category.name}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ))}
              </div>
             </CardContent>
           </Card>
         </div>
       )}
     </div>
  );
};

export default UserAudioFlashcardsPage;
