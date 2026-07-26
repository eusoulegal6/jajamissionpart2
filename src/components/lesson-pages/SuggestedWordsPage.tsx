import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, BookOpen, Sparkles } from 'lucide-react';
import { usePhoneAuth } from '@/contexts/PhoneAuthContext';
import { useUserFlashcards } from '@/hooks/useUserFlashcards';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LessonNavigation from './LessonNavigation';

interface SuggestedWordsPageProps {
  title?: string;
  description?: string;
  suggestedWords?: string[];
  onNext: () => void;
  onPrevious: () => void;
  isFirstPage: boolean;
  isLastPage: boolean;
  pageNumber: number;
  totalPages: number;
  onComplete: () => void;
  hasCompletedLesson: boolean;
  isAuthenticated: boolean;
  pageIndex: number;
  lessonId: string;
  returnPath: string;
  selectedDifficulty: string;
  currentPageIndex: number;
  pnlConsultationLessonId?: string;
}

const SuggestedWordsPage: React.FC<SuggestedWordsPageProps> = ({
  title = "Suggested Words",
  description = "Here are some words we recommend adding to your flashcard collection",
  suggestedWords = [],
  onNext,
  onPrevious,
  isFirstPage,
  isLastPage,
  pageNumber,
  totalPages,
  onComplete,
  hasCompletedLesson,
  isAuthenticated,
  pageIndex,
  lessonId,
  returnPath,
  selectedDifficulty,
  currentPageIndex,
  pnlConsultationLessonId,
  ...props
}) => {
  const { user } = usePhoneAuth();
  const { addFlashcard } = useUserFlashcards();
  
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [loadingWords, setLoadingWords] = useState<Set<string>>(new Set());

  const translateWord = async (word: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("translate-word", {
        body: { word: word.trim(), language: "en" },
      });
      
      if (error) throw error;
      return data.translation;
    } catch (error) {
      console.error("Translation error:", error);
      return null;
    }
  };

  const generateAndUploadAudio = async (word: string): Promise<string | null> => {
    if (!user?.id) return null;
    
    try {
      const { data: audioData, error: audioError } = await supabase.functions.invoke("speak-elevenlabs", {
        body: { text: word.trim() },
      });
      
      if (audioError) throw audioError;

      const binaryString = atob(audioData.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/mp3' });

      const fileName = `${user.id}/${word.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.mp3`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('flashcard-audio')
        .upload(fileName, audioBlob, {
          contentType: 'audio/mp3',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('flashcard-audio')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Audio generation and upload error:", error);
      return null;
    }
  };

  const handleAddWord = async (word: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para adicionar flashcards');
      return;
    }

    if (addedWords.has(word) || loadingWords.has(word)) {
      return;
    }

    setLoadingWords(prev => new Set([...prev, word]));

    try {
      const translation = await translateWord(word);
      if (!translation) {
        toast.error(`Erro ao traduzir a palavra: ${word}`);
        return;
      }

      const audioUrl = await generateAndUploadAudio(word);
      if (!audioUrl) {
        toast.error(`Erro ao gerar áudio para: ${word}`);
        return;
      }

      const result = await addFlashcard(word, translation, audioUrl);
      if (result) {
        setAddedWords(prev => new Set([...prev, word]));
        toast.success(`"${word}" adicionado aos seus flashcards!`);
      } else {
        toast.error(`Erro ao adicionar: ${word}`);
      }
    } catch (error) {
      console.error(`Error adding word ${word}:`, error);
      toast.error(`Erro ao processar: ${word}`);
    } finally {
      setLoadingWords(prev => {
        const newSet = new Set(prev);
        newSet.delete(word);
        return newSet;
      });
    }
  };

  const commonProps = {
    onNext,
    onPrevious,
    isFirstPage,
    isLastPage,
    pageNumber,
    totalPages,
    onComplete,
    hasCompletedLesson,
    isAuthenticated,
    pageIndex,
    lessonId,
    returnPath,
    selectedDifficulty,
    currentPageIndex,
    pnlConsultationLessonId,
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <BookOpen className="h-16 w-16 text-primary" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {title}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {description}
            </p>
          </div>

          {/* Words Grid */}
          {suggestedWords.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No words to suggest
                </h3>
                <p className="text-gray-500">
                  No words have been configured for this lesson page.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:gap-6">
              {suggestedWords.map((word, index) => {
                const isAdded = addedWords.has(word);
                const isLoading = loadingWords.has(word);
                
                return (
                  <Card 
                    key={index}
                    className={`transition-all duration-300 hover:shadow-lg border-2 ${
                      isAdded 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-blue-200 hover:border-blue-300'
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-full ${
                            isAdded ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            <BookOpen className={`h-6 w-6 ${
                              isAdded ? 'text-green-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              {word}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Add to your flashcard collection
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {isAdded && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <Check className="h-3 w-3 mr-1" />
                              Added
                            </Badge>
                          )}
                          
                          <Button
                            onClick={() => handleAddWord(word)}
                            disabled={isAdded || isLoading || !user}
                            size="lg"
                            className={`min-w-[120px] ${
                              isAdded 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-primary hover:bg-primary/90'
                            }`}
                          >
                            {isLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                Adding...
                              </>
                            ) : isAdded ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Added
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Word
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Summary */}
          {suggestedWords.length > 0 && (
            <div className="mt-8 text-center">
              <Card className="max-w-md mx-auto border-2 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold text-gray-700">
                      Progress: {addedWords.size} of {suggestedWords.length} added
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {addedWords.size === suggestedWords.length 
                      ? "Great! You've added all suggested words!"
                      : "Keep adding words to build your vocabulary!"
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <LessonNavigation {...commonProps} />
    </div>
  );
};

export default SuggestedWordsPage;