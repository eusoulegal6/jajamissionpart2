import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, Image, Volume2, Play, Eye, Move, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import ImageGenerationDialog from './ImageGenerationDialog';
import { AudioGenerationDialog } from './AudioGenerationDialog';
import ImageOptimizeButton from './ImageOptimizeButton';
import VideoUploadSection from './VideoUploadSection';

interface TTSArticlePageEditorProps {
  content: any;
  onChange: (content: any) => void;
}

const TTSArticlePageEditor: React.FC<TTSArticlePageEditorProps> = ({ content, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [cropPosition, setCropPosition] = useState(content.cropPosition || 50);
  const [showImageGenDialog, setShowImageGenDialog] = useState(false);
  const [showAudioGenDialog, setShowAudioGenDialog] = useState(false);

  const handleDisplayTextChange = (displayText: string) => {
    onChange({ ...content, displayText });
  };

  const handleAudioTextChange = (audioText: string) => {
    onChange({ ...content, audioText });
  };

  const handleImageUrlChange = (imageUrl: string) => {
    onChange({ ...content, imageUrl });
  };

  const handleFileUpload = async (file: File) => {
    // TODO: Implement actual file upload to Supabase storage
    const mockUrl = URL.createObjectURL(file);
    handleImageUrlChange(mockUrl);
  };

  const handleAudioUrlChange = (audioUrl: string) => {
    onChange({ ...content, audioUrl });
  };

  const handleVideoUrlChange = (videoUrl: string) => {
    onChange({ ...content, videoUrl });
  };

  const hasVideo = !!content.videoUrl;

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleShowAnswerText = () => {
    const textarea = displayTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = content.displayText || '';
    
    if (start !== end) {
      // Text is selected, wrap it in %%%
      const selectedText = currentText.substring(start, end);
      const newText = currentText.substring(0, start) + '%%%' + selectedText + '%%%' + currentText.substring(end);
      handleDisplayTextChange(newText);
      
      // Restore cursor position after the formatting
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 3, end + 3);
      }, 0);
    } else {
      // No text selected, insert %%% placeholder
      const newText = currentText.substring(0, start) + '%%%%%%' + currentText.substring(start);
      handleDisplayTextChange(newText);
      
      // Place cursor between the %%%
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 3, start + 3);
      }, 0);
    }
  };

  const handleCropPositionChange = (position: number) => {
    setCropPosition(position);
    onChange({
      ...content,
      cropPosition: position
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Texto do Artigo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="displayText">Texto para Exibição</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleShowAnswerText}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Show answer
              </Button>
            </div>
            <Textarea
              ref={displayTextareaRef}
              id="displayText"
              value={content.displayText || ''}
              onChange={(e) => handleDisplayTextChange(e.target.value)}
              placeholder="Texto que será exibido na tela..."
              className="mt-2 min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use %%%texto%%% para criar seções "mostrar resposta". Selecione texto e clique no botão para formatar automaticamente.
            </p>
          </div>

          {hasVideo ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 font-medium">
                ⚠️ Áudio desabilitado — quando um vídeo é adicionado, o áudio do artigo não é exibido.
              </p>
            </div>
          ) : (
            <div>
              <Label htmlFor="audioText">Texto para Áudio (TTS)</Label>
              <Textarea
                id="audioText"
                value={content.audioText || ''}
                onChange={(e) => handleAudioTextChange(e.target.value)}
                placeholder="Texto que será convertido em áudio..."
                className="mt-2 min-h-[150px]"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-muted-foreground">
                  Este texto será usado para gerar o áudio automaticamente
                </p>
                <Button
                  onClick={() => setShowAudioGenDialog(true)}
                  size="sm"
                  variant="outline"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Áudio
                </Button>
              </div>
              {content.audioUrl && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <Label className="text-sm font-medium">Áudio Gerado:</Label>
                  <audio controls src={content.audioUrl} className="w-full mt-2" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Upload Section */}
      <VideoUploadSection
        videoUrl={content.videoUrl || ''}
        onVideoUrlChange={handleVideoUrlChange}
      />

      {/* Image section - hidden when video is present */}
      {!hasVideo && (
      <Card>
        <CardHeader>
          <CardTitle>Imagem do Artigo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="imageUrl">URL da Imagem</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="imageUrl"
                value={content.imageUrl || ''}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                placeholder="https://..."
              />
              <ImageOptimizeButton
                imageUrl={content.imageUrl}
                onOptimized={handleImageUrlChange}
              />
              <Button
                variant="outline"
                onClick={() => setShowImageGenDialog(true)}
                className="shrink-0"
                title="Gerar imagem com IA"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={triggerFileInput}
                className="shrink-0"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
              className="hidden"
            />
          </div>

          {content.displayText && content.imageUrl && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCropDialog(true)}
              className="w-full flex items-center gap-2"
            >
              <Move className="h-4 w-4" />
              Change the Cut
            </Button>
          )}

          {content.imageUrl && (
            <div className="border rounded-lg p-4">
              <Label className="text-sm font-medium">Preview da Imagem</Label>
              <div className="mt-2 relative">
                <img
                  src={content.imageUrl}
                  alt="Preview"
                  className="max-w-full h-auto max-h-48 rounded-lg object-cover"
                />
              </div>
            </div>
          )}

          {!content.imageUrl && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground">Nenhuma imagem selecionada</p>
              <p className="text-sm text-muted-foreground">
                Adicione uma URL ou faça upload de uma imagem
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Crop Position Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adjust Image Crop Position</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Move the slider to adjust which part of the image is visible in the cropped view. This preview shows the exact frame that will be displayed.
            </p>
            <div className="relative w-full flex justify-center items-center bg-muted rounded-lg border p-4">
              <img
                src={content.imageUrl}
                alt="Crop preview"
                className="w-full h-auto max-h-[300px] md:max-h-[400px] object-cover rounded-lg"
                style={{
                  objectPosition: `center ${cropPosition}%`
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Vertical Position: {cropPosition}%</Label>
              <Slider
                value={[cropPosition]}
                onValueChange={(value) => handleCropPositionChange(value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCropDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCropDialog(false)}>
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {(content.displayText || content.audioText) && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50">
              {content.imageUrl && (
                <div className="mb-4">
                  <img
                    src={content.imageUrl}
                    alt="Article preview"
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              )}
              <div className="space-y-3">
                {content.displayText && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Texto de Exibição:</p>
                    <p className="text-sm whitespace-pre-wrap">{content.displayText}</p>
                  </div>
                )}
                {content.audioText && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium text-gray-600">Texto do Áudio:</p>
                      <Button size="sm" variant="outline">
                        <Play className="h-3 w-3 mr-1" />
                        Reproduzir
                      </Button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap text-gray-700">{content.audioText}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Generation Dialog */}
      <ImageGenerationDialog
        open={showImageGenDialog}
        onOpenChange={setShowImageGenDialog}
        articleText={content.displayText || content.audioText || ''}
        onImageGenerated={handleImageUrlChange}
      />

      {/* Audio Generation Dialog */}
      <AudioGenerationDialog
        open={showAudioGenDialog}
        onOpenChange={setShowAudioGenDialog}
        articleText={content.audioText || content.displayText || ''}
        onAudioGenerated={handleAudioUrlChange}
      />
    </div>
  );
};

export default TTSArticlePageEditor;