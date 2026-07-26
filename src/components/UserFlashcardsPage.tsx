import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, ArrowLeft, Trash2, Volume2, BookOpen, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserFlashcards } from "@/hooks/useUserFlashcards";
import { usePresetFlashcards } from "@/hooks/usePresetFlashcards";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { usePhoneAuth } from "@/contexts/PhoneAuthContext";
import { toast } from "sonner";
import Flashcard from "./Flashcard";
import FlashcardsPractice from "./FlashcardsPractice";
import PresetFlashcardsPractice from "./PresetFlashcardsPractice";
import { isMultiWordPhrase } from "@/utils/multiWordPhrases";

interface UserFlashcardsPageProps {
  onBack: () => void;
}

interface ValidationResult {
  valid: boolean;
  normalized: string;
  suggestions?: string[];
}

type ViewMode = 'selection' | 'user-add' | 'user-practice' | 'preset-practice';

const UserFlashcardsPage: React.FC<UserFlashcardsPageProps> = ({ onBack }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [wordInput, setWordInput] = useState("");
  const [validatingWord, setValidatingWord] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const { user } = usePhoneAuth();
  const { flashcards, loading, addFlashcard, deleteFlashcard } = useUserFlashcards();
  const { categories, loading: categoriesLoading } = usePresetFlashcards();
  const { handleSpeakMessage, isPlaying, isLoadingAudio } = useTextToSpeech();

  const validateWord = async (word: string): Promise<ValidationResult | null> => {
    const inputText = word.trim();
    
    if (isMultiWordPhrase(inputText)) {
      return {
        valid: true,
        normalized: inputText.toLowerCase(),
        suggestions: []
      };
    }
    
    try {
      const { data, error } = await supabase.functions.invoke("validate-word", {
        body: { word: inputText, language: "en" },
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Validation error:", error);
      return null;
    }
  };

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
    // Use the phone auth user ID instead of Supabase auth
    if (!user?.id) {
      console.error("No user ID available for audio generation");
      return null;
    }
    
    try {
      // Use fetch directly to get binary audio data instead of supabase.functions.invoke
      // which parses the response as JSON and corrupts binary data
      const response = await fetch(
        `https://mcuquzgpaeoqskesgcnx.supabase.co/functions/v1/speak-elevenlabs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jdXF1emdwYWVvcXNrZXNnY254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODM1MjcsImV4cCI6MjA2MTY1OTUyN30.vGIcy1PzEQ_OE3PYEVQGK1XC1iPfLA6kWTVG2dpiWqI",
            "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jdXF1emdwYWVvcXNrZXNnY254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODM1MjcsImV4cCI6MjA2MTY1OTUyN30.vGIcy1PzEQ_OE3PYEVQGK1XC1iPfLA6kWTVG2dpiWqI`,
          },
          body: JSON.stringify({ text: word.trim() }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("TTS request failed:", response.status, errorText);
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.audioContent) {
        throw new Error("No audio content in response");
      }

      // Convert base64 to blob using data URI approach (browser natively decodes)
      const audioDataUri = `data:audio/mpeg;base64,${data.audioContent}`;
      const audioResponse = await fetch(audioDataUri);
      const audioBlob = await audioResponse.blob();

      // Use phone auth user ID for the file path
      const fileName = `${user.id}/${word.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.mp3`;
      const { error: uploadError } = await supabase.storage
        .from('flashcard-audio')
        .upload(fileName, audioBlob, {
          contentType: 'audio/mpeg',
          upsert: false
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('flashcard-audio')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Audio generation and upload error:", error);
      return null;
    }
  };

  const handleAddFlashcard = async () => {
    if (!wordInput.trim()) {
      toast.error("Por favor, digite uma palavra");
      return;
    }

    setValidatingWord(true);

    try {
      const validation = await validateWord(wordInput);
      if (!validation?.valid) {
        setValidationResult(validation);
        setValidatingWord(false);
        return;
      }

      const normalizedWord = validation.normalized;
      setValidatingWord(false);
      setTranslating(true);

      const translation = await translateWord(normalizedWord);
      if (!translation) {
        toast.error("Erro ao traduzir a palavra");
        setTranslating(false);
        return;
      }

      setTranslating(false);
      setGenerating(true);

      const audioUrl = await generateAndUploadAudio(normalizedWord);
      if (!audioUrl) {
        toast.error("Erro ao gerar áudio. Flashcard não foi criado.");
        setGenerating(false);
        return;
      }

      setGenerating(false);

      const result = await addFlashcard(normalizedWord, translation, audioUrl);
      if (result) {
        toast.success("Flashcard adicionado com sucesso!");
        setWordInput("");
      } else {
        toast.error("Erro ao adicionar flashcard");
      }
    } catch (error) {
      console.error("Error adding flashcard:", error);
      toast.error("Erro inesperado");
      setValidatingWord(false);
      setTranslating(false);
      setGenerating(false);
      setValidationResult(null);
    }
  };

  const handleUseSuggestion = (suggestion: string) => {
    setWordInput(suggestion);
    setValidationResult(null);
  };

  const handleDeleteFlashcard = async (id: string) => {
    const success = await deleteFlashcard(id);
    if (success) {
      toast.success("Flashcard removido");
    } else {
      toast.error("Erro ao remover flashcard");
    }
  };

  const handlePlayAudio = (audioUrl?: string) => {
    if (!audioUrl) {
      console.error("No audio URL available for this flashcard");
      return;
    }
    
    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
      console.error("Error playing stored audio:", error);
    });
  };

  const handleBack = () => {
    if (viewMode === 'selection') {
      onBack();
    } else {
      setViewMode('selection');
      setSelectedCategoryId('');
    }
  };

  if (loading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Header with back button
  const Header = () => (
    <div className="flex items-center gap-2 mb-6">
      <Button
        variant="ghost"
        onClick={handleBack}
        className="flex items-center gap-2 p-2"
        size="sm"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Voltar</span>
      </Button>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Flashcards</h1>
    </div>
  );

  // Selection screen
  if (viewMode === 'selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
        <div className="max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto">
          <Header />
          
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Escolha os Flashcards</h2>
              <p className="text-muted-foreground">
                Selecione entre seus flashcards personalizados ou categorias predefinidas
              </p>
            </div>

            <div className="grid gap-4">
              {/* User's Personal Flashcards */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/30 hover:scale-[1.02]"
                onClick={() => setViewMode('user-add')}
              >
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-2">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Meus Flashcards</CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <p className="text-sm text-muted-foreground mb-2">
                    {flashcards.length} flashcard{flashcards.length !== 1 ? 's' : ''} criado{flashcards.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Crie e pratique com seus flashcards personalizados
                  </p>
                </CardContent>
              </Card>

              {/* Preset Categories */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-center">Categorias Predefinidas</h3>
                {categories.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhuma categoria disponível
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {categories.map((category) => (
                      <Card
                        key={category.id}
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/30 hover:scale-[1.02]"
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setViewMode('preset-practice');
                        }}
                      >
                        <CardHeader className="text-center pb-3">
                          <div className="flex justify-center mb-2">
                            <BookOpen className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle className="text-base">{category.name}</CardTitle>
                        </CardHeader>
                        {category.description && (
                          <CardContent className="text-center pt-0">
                            <p className="text-sm text-muted-foreground">
                              {category.description}
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User flashcards management (add/practice)
  if (viewMode === 'user-add') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-100">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200">
          <div className="flex items-center gap-3 p-4 max-w-7xl mx-auto">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center gap-2 hover:bg-gray-100"
              size="sm"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline font-medium">Voltar</span>
            </Button>
            <div className="h-6 w-px bg-gray-300 hidden sm:block" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meus Flashcards</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="pt-20 pb-8 px-4 max-w-7xl mx-auto">
          <div className="space-y-8">
            {/* Navigation Buttons */}
            <div className="flex gap-2 justify-center">
              <Button
                variant="default"
                onClick={() => setViewMode('user-add')}
                className="text-sm px-6 py-2"
                size="sm"
              >
                Adicionar
              </Button>
              <Button
                variant="outline"
                onClick={() => setViewMode('user-practice')}
                disabled={flashcards.filter(card => card.audio_url).length === 0}
                className="text-sm px-6 py-2"
                size="sm"
              >
                Praticar
              </Button>
            </div>

            {/* Add Word Section */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6 lg:p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  Adicionar Nova Palavra
                </h2>
                <p className="text-gray-600 text-sm lg:text-base">
                  Digite uma palavra ou expressão em inglês para criar um flashcard
                </p>
              </div>
              
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    placeholder="Digite uma palavra ou expressão em inglês..."
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddFlashcard()}
                    disabled={validatingWord || translating || generating}
                    className="flex-1 h-12 text-lg px-4 rounded-xl border-2 border-gray-200 focus:border-primary transition-colors"
                  />
                  <Button
                    onClick={handleAddFlashcard}
                    disabled={!wordInput.trim() || validatingWord || translating || generating}
                    className="h-12 px-6 text-base font-semibold rounded-xl min-w-[140px] transition-all duration-200 hover:scale-105"
                    size="default"
                  >
                    {validatingWord ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Validando...
                      </>
                    ) : translating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Traduzindo...
                      </>
                    ) : generating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        Adicionar
                      </>
                    )}
                  </Button>
                </div>
                
                {validationResult && !validationResult.valid && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <div className="text-red-700 font-medium mb-3">
                      ❌ Palavra não encontrada. Verifique a ortografia.
                    </div>
                    
                    {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-red-600 font-medium">Você quis dizer:</p>
                        <div className="flex flex-wrap gap-2">
                          {validationResult.suggestions.map((suggestion) => (
                            <Button 
                              key={suggestion} 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleUseSuggestion(suggestion)}
                              className="text-sm bg-white hover:bg-red-50 border-red-300 text-red-700 rounded-lg"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Flashcards Grid */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                  Seus Flashcards
                </h3>
                <p className="text-gray-600">
                  {flashcards.length} flashcard{flashcards.length !== 1 ? 's' : ''} criado{flashcards.length !== 1 ? 's' : ''}
                </p>
              </div>

                {flashcards.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-12 text-center">
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="text-6xl">📚</div>
                      <h4 className="text-xl font-semibold text-gray-700">
                        Nenhum flashcard ainda
                      </h4>
                      <p className="text-gray-500">
                        Comece criando seu primeiro flashcard usando o formulário acima
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {flashcards.map((card) => (
                      <div key={card.id} className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:scale-105 p-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-lg text-gray-900 flex-1 mr-2 break-words leading-tight">
                              {card.front_text}
                            </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFlashcard(card.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <p className="text-gray-600 font-medium break-words">
                          {card.back_text}
                        </p>
                        
                        <div className="flex justify-center pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => card.audio_url && handlePlayAudio(card.audio_url)}
                            disabled={!card.audio_url}
                            className="h-10 w-10 rounded-full border-2 border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                          >
                            <Volume2 className="h-4 w-4 text-blue-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User flashcards practice
  if (viewMode === 'user-practice') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <Header />
          
          <div className="flex gap-2 mb-6">
            <Button
              variant="outline"
              onClick={() => setViewMode('user-add')}
              className="flex-1 sm:flex-none text-sm"
              size="sm"
            >
              Adicionar
            </Button>
            <Button
              variant="default"
              onClick={() => setViewMode('user-practice')}
              className="flex-1 sm:flex-none text-sm"
              size="sm"
            >
              Praticar
            </Button>
          </div>

          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl">
              <FlashcardsPractice
                flashcards={flashcards
                  .filter(card => card.audio_url)
                  .map(card => ({
                    front: card.front_text,
                    back: card.back_text,
                    audio_url: card.audio_url,
                  }))
                }
                onBack={() => setViewMode('user-add')}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Preset category practice
  if (viewMode === 'preset-practice' && selectedCategoryId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <Header />
          
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl">
              <PresetFlashcardsPractice 
                categoryId={selectedCategoryId} 
                onBack={() => setViewMode('selection')}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default UserFlashcardsPage;