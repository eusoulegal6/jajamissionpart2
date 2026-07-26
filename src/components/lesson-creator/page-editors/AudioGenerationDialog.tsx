import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AudioGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleText: string;
  onAudioGenerated: (audioUrl: string) => void;
}

export const AudioGenerationDialog: React.FC<AudioGenerationDialogProps> = ({
  open,
  onOpenChange,
  articleText,
  onAudioGenerated,
}) => {
  const [mode, setMode] = useState<'choose' | 'custom'>('choose');
  const [customText, setCustomText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAudio = async (text: string) => {
    if (!text.trim()) {
      toast.error('Texto não pode estar vazio');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Generating audio for text:', text.substring(0, 100) + '...');
      
      const { data, error } = await supabase.functions.invoke('cached-tts', {
        body: { text: text.trim() },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to generate audio');
      }

      console.log('Audio generation response:', data);

      if (data?.publicUrl) {
        onAudioGenerated(data.publicUrl);
        toast.success('Áudio gerado com sucesso!');
        onOpenChange(false);
        setMode('choose');
        setCustomText('');
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        console.error('Unexpected response format:', data);
        throw new Error('No audio URL in response');
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar áudio. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseArticleContent = () => {
    generateAudio(articleText);
  };

  const handleUseCustomText = () => {
    setMode('custom');
  };

  const handleGenerateCustom = () => {
    generateAudio(customText);
  };

  const handleBack = () => {
    setMode('choose');
    setCustomText('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar Áudio com IA</DialogTitle>
        </DialogHeader>

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Gerando áudio...</p>
          </div>
        ) : mode === 'choose' ? (
          <div className="flex flex-col gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              Como você deseja gerar o áudio?
            </p>
            <Button
              variant="outline"
              className="justify-start gap-3 h-auto py-4"
              onClick={handleUseArticleContent}
              disabled={!articleText.trim()}
            >
              <FileText className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Usar conteúdo do artigo</div>
                <div className="text-xs text-muted-foreground">
                  Gerar áudio com o texto do artigo
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-3 h-auto py-4"
              onClick={handleUseCustomText}
            >
              <Edit3 className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Escrever texto personalizado</div>
                <div className="text-xs text-muted-foreground">
                  Digitar um texto diferente para o áudio
                </div>
              </div>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-4">
            <Textarea
              placeholder="Digite o texto para gerar o áudio..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={6}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Voltar
              </Button>
              <Button 
                onClick={handleGenerateCustom} 
                className="flex-1"
                disabled={!customText.trim()}
              >
                Gerar Áudio
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
