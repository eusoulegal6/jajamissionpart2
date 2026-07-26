import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader, Sparkles, FileText, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { GEN_GATE_KEY, GEN_GATE_HEADER } from '@/lib/genGate';


interface ImageGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleText: string;
  onImageGenerated: (imageUrl: string) => void;
}

const ImageGenerationDialog: React.FC<ImageGenerationDialogProps> = ({
  open,
  onOpenChange,
  articleText,
  onImageGenerated,
}) => {
  const [mode, setMode] = useState<'choose' | 'custom'>('choose');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = async (prompt: string) => {
    setIsGenerating(true);
    try {
      console.log('Generating image with OpenAI gpt-image-1.5, prompt:', prompt);

      const response = await fetch('https://mcuquzgpaeoqskesgcnx.supabase.co/functions/v1/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [GEN_GATE_HEADER]: GEN_GATE_KEY,
        },
        body: JSON.stringify({
          prompt,
        }),
      });


      // Get response text first to handle both JSON and non-JSON responses
      const responseText = await response.text();
      console.log('API Response status:', response.status);
      console.log('API Response text:', responseText);

      if (!response.ok) {
        throw new Error(`API error (${response.status}): ${responseText || 'Unknown error'}`);
      }

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error('Invalid response format from image generation API');
      }
      
      if (data.imageUrl) {
        onImageGenerated(data.imageUrl);
        toast.success('Imagem gerada com sucesso!');
        onOpenChange(false);
        // Reset state
        setMode('choose');
        setCustomPrompt('');
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('No image URL in response');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar imagem. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseArticleContent = () => {
    if (!articleText.trim()) {
      toast.error('Não há conteúdo do artigo para usar como prompt.');
      return;
    }
    // Use the first 500 characters of the article as prompt
    const prompt = `Create an illustration for this article content: ${articleText.slice(0, 500)}`;
    generateImage(prompt);
  };

  const handleUseCustomPrompt = () => {
    if (!customPrompt.trim()) {
      toast.error('Por favor, digite um prompt.');
      return;
    }
    generateImage(customPrompt);
  };

  const handleClose = () => {
    if (!isGenerating) {
      onOpenChange(false);
      setMode('choose');
      setCustomPrompt('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar Imagem com IA
          </DialogTitle>
        </DialogHeader>
        
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Gerando imagem...</p>
          </div>
        ) : mode === 'choose' ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Como você deseja gerar a imagem?
            </p>
            <div className="grid gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-start gap-1"
                onClick={handleUseArticleContent}
                disabled={!articleText.trim()}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Usar conteúdo do artigo</span>
                </div>
                <span className="text-xs text-muted-foreground font-normal">
                  Gerar baseado no texto do artigo
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-start gap-1"
                onClick={() => setMode('custom')}
              >
                <div className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  <span className="font-medium">Digitar meu próprio prompt</span>
                </div>
                <span className="text-xs text-muted-foreground font-normal">
                  Descrever a imagem que você deseja
                </span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="customPrompt">Descreva a imagem que você deseja</Label>
              <Textarea
                id="customPrompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ex: Uma ilustração colorida de uma pessoa estudando idiomas..."
                className="mt-2 min-h-[100px]"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMode('choose')} className="flex-1">
                Voltar
              </Button>
              <Button onClick={handleUseCustomPrompt} disabled={!customPrompt.trim()} className="flex-1">
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageGenerationDialog;
