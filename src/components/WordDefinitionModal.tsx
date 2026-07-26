import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { base64ToAudioBlob } from "@/utils/base64Utils";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface WordDefinitionModalProps {
  word: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface WordData {
  translation: string;
  exampleEn: string;
  examplePt: string;
  exampleEs?: string;
}

const WordDefinitionModal: React.FC<WordDefinitionModalProps> = ({
  word,
  isOpen,
  onClose,
}) => {
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const { toast } = useToast();
  const { learningLanguage } = useLanguage();
  const isSpanish = learningLanguage === 'es';

  useEffect(() => {
    if (isOpen && word) {
      fetchWordDefinition();
    } else {
      setWordData(null);
    }
  }, [isOpen, word]);

  const fetchWordDefinition = async () => {
    if (!word) return;

    setIsLoading(true);
    try {
      const targetLang = isSpanish ? 'Spanish' : 'Portuguese';
      const tagSuffix = isSpanish ? 'ES' : 'PT';
      const fallbackExample = isSpanish ? 'Ejemplo no disponible' : 'Exemplo não disponível';

      const nativeLang = 'Portuguese';
      const prompt = `Provide ${targetLang} translations and example sentences for the English word "${word}". 
Format your response EXACTLY like this:
%TRANSLATION%translation 1 / translation 2 / translation 3%/TRANSLATION%
%EXAMPLE_EN%example sentence in English here%/EXAMPLE_EN%
%EXAMPLE_${tagSuffix}%${targetLang} translation of the example%/EXAMPLE_${tagSuffix}%
${isSpanish ? `%EXAMPLE_PT%Portuguese translation of the example%/EXAMPLE_PT%` : ''}

For TRANSLATION: Provide 1-3 different ${targetLang} translations separated by " / " (slash with spaces). Include the most common translations and alternatives if they exist.
For EXAMPLE_EN: One short, simple sentence in English using the word "${word}".
For EXAMPLE_${tagSuffix}: A single ${targetLang} translation of that example sentence (not multiple options).
${isSpanish ? `For EXAMPLE_PT: A single Portuguese translation of that same example sentence.` : ''}`;

      const { data, error } = await supabase.functions.invoke("chatgpt", {
        body: {
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          model: "gpt-5.4-mini",
        },
      });

      if (error) throw error;

      // Parse the response
      const response = data.reply || "";
      const translationMatch = response.match(/%TRANSLATION%(.*?)%\/TRANSLATION%/s);
      const exampleEnMatch = response.match(/%EXAMPLE_EN%(.*?)%\/EXAMPLE_EN%/s);
      const exampleTransMatch = response.match(new RegExp(`%EXAMPLE_${tagSuffix}%(.*?)%\\/EXAMPLE_${tagSuffix}%`, 's'));
      const examplePtMatch = isSpanish 
        ? response.match(/%EXAMPLE_PT%(.*?)%\/EXAMPLE_PT%/s)
        : null;

      setWordData({
        translation: translationMatch ? translationMatch[1].trim() : "Translation not available",
        exampleEn: exampleEnMatch ? exampleEnMatch[1].trim() : "Example not available",
        examplePt: isSpanish 
          ? (examplePtMatch ? examplePtMatch[1].trim() : "Tradução não disponível")
          : (exampleTransMatch ? exampleTransMatch[1].trim() : fallbackExample),
        exampleEs: isSpanish 
          ? (exampleTransMatch ? exampleTransMatch[1].trim() : "Ejemplo no disponible")
          : undefined,
      });
    } catch (error) {
      console.error("Error fetching word definition:", error);
      toast({
        title: "Error",
        description: "Failed to load word definition. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = async () => {
    if (!word || isPlayingAudio) return;

    setIsPlayingAudio(true);
    try {
      const { data, error } = await supabase.functions.invoke("speak-elevenlabs", {
        body: { text: word },
      });

      if (error) throw error;

      if (!data || !data.audioContent) {
        throw new Error("Invalid response from audio service");
      }

      // Convert base64 to blob and play
      const audioBlob = base64ToAudioBlob(data.audioContent);
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        toast({
          title: "Audio Error",
          description: "Failed to play audio.",
          variant: "destructive",
        });
      };
      await audio.play();
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlayingAudio(false);
      toast({
        title: "Error",
        description: "Failed to play audio. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-3 pt-1">
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 pt-1 pb-4">
            {/* Word and Audio */}
            <div className="flex items-center justify-center gap-4">
              <h2 className="text-5xl font-bold text-foreground mt-0">{word}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={playAudio}
                disabled={isPlayingAudio}
                className="h-10 w-10"
              >
                {isPlayingAudio ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Translation */}
            {wordData && (
              <>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {isSpanish ? 'Traducción' : 'Tradução'}
                  </h3>
                  <p className="text-xl font-medium text-foreground">
                    {wordData.translation}
                  </p>
                </div>

                {/* Example */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                   {isSpanish ? 'Ejemplo' : 'Exemplo'}
                  </h3>
                  <div className="space-y-1">
                    {isSpanish && wordData.exampleEs ? (
                      <>
                        <p className="text-base text-foreground italic">
                          "{wordData.exampleEs}"
                        </p>
                        <p className="text-sm text-muted-foreground italic">
                          "{wordData.examplePt}"
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-base text-foreground italic">
                          "{wordData.exampleEn}"
                        </p>
                        <p className="text-sm text-muted-foreground italic">
                          "{wordData.examplePt}"
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WordDefinitionModal;
