import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Plus, Check } from 'lucide-react';
import { usePhoneAuth } from '@/contexts/PhoneAuthContext';
import { useUserFlashcards } from '@/hooks/useUserFlashcards';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SharedFlashcardsImport: React.FC = () => {
  const { encodedWords } = useParams<{ encodedWords: string }>();
  const navigate = useNavigate();
  const { user } = usePhoneAuth();
  const { addFlashcard } = useUserFlashcards();
  
  const [words, setWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    if (encodedWords) {
      try {
        const decoded = atob(encodedWords);
        const wordList = JSON.parse(decoded);
        setWords(Array.isArray(wordList) ? wordList : []);
      } catch (error) {
        console.error('Error decoding words:', error);
        toast.error('Link inválido');
        navigate('/');
      }
    }
  }, [encodedWords, navigate]);

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

  const handleImportWords = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para importar flashcards');
      return;
    }

    setLoading(true);
    let successCount = 0;

    try {
      for (const word of words) {
        try {
          const translation = await translateWord(word);
          if (!translation) {
            console.error(`Failed to translate: ${word}`);
            continue;
          }

          const audioUrl = await generateAndUploadAudio(word);
          
          // Insert flashcard directly using phone_number instead of relying on Supabase auth
          const { data, error } = await supabase
            .from('user_flashcards')
            .insert({
              phone_number: user.phone_number,
              front_text: word,
              back_text: translation,
              audio_url: audioUrl || null,
            })
            .select()
            .single();

          if (error) {
            console.error('Error adding flashcard:', error);
          } else {
            successCount++;
            setImportedCount(successCount);
          }
        } catch (error) {
          console.error(`Error processing word ${word}:`, error);
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} flashcard${successCount !== 1 ? 's' : ''} importado${successCount !== 1 ? 's' : ''} com sucesso!`);
        setTimeout(() => navigate('/flashcards'), 1500);
      } else {
        toast.error('Erro ao importar flashcards');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erro ao importar flashcards');
    } finally {
      setLoading(false);
    }
  };

  if (!words.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          
          <Card>
            <CardContent className="text-center py-12">
              <h1 className="text-xl font-semibold mb-4">Link inválido</h1>
              <p className="text-muted-foreground">
                Não foi possível carregar os flashcards compartilhados.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Flashcards Compartilhados</CardTitle>
            <p className="text-muted-foreground">
              {words.length} palavra{words.length !== 1 ? 's' : ''} compartilhada{words.length !== 1 ? 's' : ''}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Words preview */}
            <div className="space-y-3">
              <h3 className="font-semibold">Palavras:</h3>
              <div className="flex flex-wrap gap-2">
                {words.map((word, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {word}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Import status */}
            {loading && importedCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">
                  Importando... {importedCount}/{words.length} concluído{importedCount !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              {!user ? (
                <div className="text-center space-y-3">
                  <p className="text-muted-foreground text-sm">
                    Você precisa estar logado para importar flashcards
                  </p>
                  <Button
                    onClick={() => navigate('/')}
                    className="w-full"
                  >
                    Fazer Login
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    onClick={handleImportWords}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        Importando... ({importedCount}/{words.length})
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar aos Meus Flashcards
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => navigate('/flashcards')}
                    className="w-full"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Ver Meus Flashcards
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SharedFlashcardsImport;