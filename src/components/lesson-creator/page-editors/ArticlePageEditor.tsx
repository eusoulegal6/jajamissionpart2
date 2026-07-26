import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Upload, Image, Volume2, Bold, Eye, Move, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import ImageGenerationDialog from './ImageGenerationDialog';
import { AudioGenerationDialog } from './AudioGenerationDialog';
import ImageOptimizeButton from './ImageOptimizeButton';
import VideoUploadSection from './VideoUploadSection';

interface ArticlePageEditorProps {
  content: any;
  onChange: (content: any) => void;
}

const ArticlePageEditor: React.FC<ArticlePageEditorProps> = ({ content, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [cropPosition, setCropPosition] = useState(content.cropPosition || 50);
  const [showImageGenDialog, setShowImageGenDialog] = useState(false);
  const [showAudioGenDialog, setShowAudioGenDialog] = useState(false);

  const handleTextChange = (text: string) => {
    console.log('📝 Article Editor - Text changed to:', text);
    console.log('📝 Current content before change:', content);
    // Update both the top-level text field AND the nested content.text field
    const newContent = { 
      ...content, 
      text,
      content: {
        ...content.content,
        text
      }
    };
    console.log('📝 New content after change:', newContent);
    onChange(newContent);
  };

  const handleImageUrlChange = (imageUrl: string) => {
    // Preserve display mode when updating URL
    const currentUrl = content.imageUrl || content.content?.imageUrl || '';
    const hasFullImage = currentUrl.includes('fullImage=true');
    const hasFitImage = currentUrl.includes('fitImage=true');
    
    let newUrl = imageUrl;
    if (hasFullImage && !imageUrl.includes('fullImage=true')) {
      newUrl = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}fullImage=true`;
    } else if (hasFitImage && !imageUrl.includes('fitImage=true')) {
      newUrl = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}fitImage=true`;
    }
    
    onChange({ 
      ...content, 
      imageUrl: newUrl,
      content: {
        ...content.content,
        imageUrl: newUrl
      }
    });
  };

  const handleImageDisplayChange = (mode: string) => {
    const currentUrl = content.content?.imageUrl || content.imageUrl || '';
    let newUrl = currentUrl
      .replace(/[?&]fullImage=true/, '')
      .replace(/[?&]fitImage=true/, '')
      .replace(/\?$/, '');
    
    if (mode === 'full') {
      newUrl = `${newUrl}${newUrl.includes('?') ? '&' : '?'}fullImage=true`;
    } else if (mode === 'fit') {
      newUrl = `${newUrl}${newUrl.includes('?') ? '&' : '?'}fitImage=true`;
    }
    
    onChange({ 
      ...content, 
      imageUrl: newUrl,
      content: {
        ...content.content,
        imageUrl: newUrl
      }
    });
  };

  const getImageDisplayMode = () => {
    const currentUrl = content.content?.imageUrl || content.imageUrl || '';
    if (currentUrl.includes('fullImage=true')) return 'full';
    if (currentUrl.includes('fitImage=true')) return 'fit';
    return 'cut';
  };

  const handleCropPositionChange = (position: number) => {
    setCropPosition(position);
    onChange({
      ...content,
      cropPosition: position,
      content: {
        ...content.content,
        cropPosition: position
      }
    });
  };

  const handleAudioUrlChange = (audioUrl: string) => {
    onChange({ 
      ...content, 
      audioUrl,
      content: {
        ...content.content,
        audioUrl
      }
    });
  };

  const handleVideoUrlChange = (videoUrl: string) => {
    onChange({ 
      ...content, 
      videoUrl,
      content: {
        ...content.content,
        videoUrl
      }
    });
  };

  const hasVideo = !!(content.videoUrl || content.content?.videoUrl);

  const handleFileUpload = async (file: File) => {
    // TODO: Implement actual file upload to Supabase storage
    const mockUrl = URL.createObjectURL(file);
    handleImageUrlChange(mockUrl);
  };

  const handleAudioUpload = async (file: File) => {
    // TODO: Implement actual audio upload to Supabase storage
    const mockUrl = URL.createObjectURL(file);
    handleAudioUrlChange(mockUrl);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerAudioInput = () => {
    audioInputRef.current?.click();
  };

  const handleBoldText = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = content.content?.text || content.text || '';
    
    if (start !== end) {
      // Text is selected, wrap it in **
      const selectedText = currentText.substring(start, end);
      const newText = currentText.substring(0, start) + '**' + selectedText + '**' + currentText.substring(end);
      handleTextChange(newText);
      
      // Restore cursor position after the bold formatting
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, end + 2);
      }, 0);
    } else {
      // No text selected, insert ** placeholder
      const newText = currentText.substring(0, start) + '****' + currentText.substring(start);
      handleTextChange(newText);
      
      // Place cursor between the **
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, start + 2);
      }, 0);
    }
  };

  const handleShowAnswerText = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = content.content?.text || content.text || '';
    
    if (start !== end) {
      // Text is selected, wrap it in %%%
      const selectedText = currentText.substring(start, end);
      const newText = currentText.substring(0, start) + '%%%' + selectedText + '%%%' + currentText.substring(end);
      handleTextChange(newText);
      
      // Restore cursor position after the formatting
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 3, end + 3);
      }, 0);
    } else {
      // No text selected, insert %%% placeholder
      const newText = currentText.substring(0, start) + '%%%%%%' + currentText.substring(start);
      handleTextChange(newText);
      
      // Place cursor between the %%%
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 3, start + 3);
      }, 0);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo do Artigo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="articleText">Texto do Artigo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBoldText}
                  className="flex items-center gap-2"
                >
                  <Bold className="h-4 w-4" />
                  Negrito
                </Button>
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
            </div>
            <Textarea
              ref={textareaRef}
              id="articleText"
              value={content.content?.text || content.text || ''}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Digite o conteúdo do artigo..."
              className="mt-2 min-h-[200px] max-h-[400px] overflow-y-auto"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use **texto** para negrito e %%%texto%%% para criar seções "mostrar resposta". Selecione texto e clique nos botões para formatar automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Layout Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="slideMode">Slide Page Mode</Label>
              <p className="text-sm text-muted-foreground">
                Hide title, increase text size, and move audio button below text
              </p>
            </div>
            <Switch
              id="slideMode"
              checked={content.slideMode || false}
              onCheckedChange={(checked) => 
                onChange({ 
                  ...content, 
                  slideMode: checked,
                  content: {
                    ...content.content,
                    slideMode: checked
                  }
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Video Upload Section */}
      <VideoUploadSection
        videoUrl={content.videoUrl || content.content?.videoUrl || ''}
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
                value={content.content?.imageUrl || content.imageUrl || ''}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                placeholder="https://..."
              />
              <ImageOptimizeButton
                imageUrl={content.content?.imageUrl || content.imageUrl}
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

          <div className="space-y-2">
            <Label htmlFor="imageDisplay">Image Display Mode</Label>
            <Select value={getImageDisplayMode()} onValueChange={handleImageDisplayChange}>
              <SelectTrigger id="imageDisplay">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cut">Cut to Height (Default)</SelectItem>
                <SelectItem value="fit">Fit to Height</SelectItem>
                <SelectItem value="full">Show Full Image</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Cut: Crops image to limit height | Fit: Scales image to fit height | Full: Shows complete image
            </p>
            {getImageDisplayMode() === 'cut' && (content.content?.imageUrl || content.imageUrl) && (
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
          </div>

          {(content.content?.imageUrl || content.imageUrl) && (
            <div className="border rounded-lg p-4">
              <Label className="text-sm font-medium">Preview da Imagem</Label>
              <div className="mt-2 relative">
                <img
                  src={content.content?.imageUrl || content.imageUrl}
                  alt="Preview"
                  className="max-w-full h-auto max-h-48 rounded-lg object-cover"
                />
              </div>
            </div>
          )}

          {!(content.content?.imageUrl || content.imageUrl) && (
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

      {/* Audio section - hidden when video is present */}
      {!hasVideo && (
      <Card>
        <CardHeader>
          <CardTitle>Áudio do Artigo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="audioUrl">URL do Áudio</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="audioUrl"
                value={content.content?.audioUrl || content.audioUrl || ''}
                onChange={(e) => handleAudioUrlChange(e.target.value)}
                placeholder="https://... (MP3, WAV, etc.)"
              />
              <Button
                variant="outline"
                onClick={() => setShowAudioGenDialog(true)}
                className="shrink-0"
                title="Gerar áudio com IA"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={triggerAudioInput}
                className="shrink-0"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleAudioUpload(file);
                }
              }}
              className="hidden"
            />
          </div>

          {(content.content?.audioUrl || content.audioUrl) && (
            <div className="border rounded-lg p-4">
              <Label className="text-sm font-medium">Preview do Áudio</Label>
              <div className="mt-2">
                <audio
                  controls
                  src={content.content?.audioUrl || content.audioUrl}
                  className="w-full"
                >
                  Seu navegador não suporta o elemento de áudio.
                </audio>
              </div>
            </div>
          )}

          {!(content.content?.audioUrl || content.audioUrl) && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Volume2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground">Nenhum áudio selecionado</p>
              <p className="text-sm text-muted-foreground">
                Adicione uma URL ou faça upload de um arquivo de áudio
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
                src={content.content?.imageUrl || content.imageUrl}
                alt="Crop preview"
                className="w-full h-auto max-h-[300px] object-cover rounded-lg"
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

      {/* Image Generation Dialog */}
      <ImageGenerationDialog
        open={showImageGenDialog}
        onOpenChange={setShowImageGenDialog}
        articleText={content.content?.text || content.text || ''}
        onImageGenerated={handleImageUrlChange}
      />

      {/* Audio Generation Dialog */}
      <AudioGenerationDialog
        open={showAudioGenDialog}
        onOpenChange={setShowAudioGenDialog}
        articleText={content.content?.text || content.text || ''}
        onAudioGenerated={handleAudioUrlChange}
      />
    </div>
  );
};

export default ArticlePageEditor;