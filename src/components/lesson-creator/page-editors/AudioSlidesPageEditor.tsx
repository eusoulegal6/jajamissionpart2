import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Volume2, Plus, Trash2, GripVertical, Loader2, Check, RefreshCw, ImageIcon, Upload, X, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { getCachedTtsUrl } from '@/lib/ttsCached';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { GEN_GATE_KEY, GEN_GATE_HEADER } from '@/lib/genGate';


interface AudioSlide {
  english: string;
  translation: string;
  audioUrl?: string;
  imageUrl?: string;
  /** Authoring-only: prompt used to generate the slide image. Never rendered to students. */
  _imagePrompt?: string;
}

interface AudioSlidesPageEditorProps {
  content: {
    slides?: AudioSlide[];
  };
  onChange: (content: any) => void;
}

const AudioSlidesPageEditor: React.FC<AudioSlidesPageEditorProps> = ({ content, onChange }) => {
  const slides = content.slides || [];
  const [generatingAudio, setGeneratingAudio] = useState<number | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // AI image generation state
  const [aiDialogIndex, setAiDialogIndex] = useState<number | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreviewUrl, setAiPreviewUrl] = useState<string | null>(null);

  const uploadImageFile = useCallback(async (file: File, index: number) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setUploadingImage(index);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `slide-image-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `audio-slides/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lesson_images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('lesson_images')
        .getPublicUrl(filePath);

      const newSlides = [...slides];
      newSlides[index] = { ...newSlides[index], imageUrl: urlData.publicUrl };
      onChange({ ...content, slides: newSlides });
      toast.success('Image uploaded!');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploadingImage(null);
    }
  }, [slides, content, onChange]);

  const handleAddSlide = () => {
    const newSlide: AudioSlide = {
      english: '',
      translation: '',
      audioUrl: ''
    };
    onChange({ ...content, slides: [...slides, newSlide] });
  };

  const handleRemoveSlide = (index: number) => {
    const newSlides = slides.filter((_, i) => i !== index);
    onChange({ ...content, slides: newSlides });
  };

  const handleSlideChange = (index: number, field: keyof AudioSlide, value: string) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    onChange({ ...content, slides: newSlides });
  };

  const handleGenerateAudio = async (index: number) => {
    const slide = slides[index];
    if (!slide.english) {
      toast.error('Please enter the English text first');
      return;
    }
    
    setGeneratingAudio(index);
    try {
      const audioUrl = await getCachedTtsUrl(slide.english);
      if (audioUrl) {
        const newSlides = [...slides];
        newSlides[index] = { ...newSlides[index], audioUrl };
        onChange({ ...content, slides: newSlides });
        toast.success('Audio generated successfully');
      } else {
        toast.error('Failed to generate audio');
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error('Failed to generate audio');
    } finally {
      setGeneratingAudio(null);
    }
  };

  const handleGenerateAllAudio = async () => {
    const slidesWithoutAudio = slides.filter((s) => s.english && !s.audioUrl);
    if (slidesWithoutAudio.length === 0) {
      toast.info('All slides already have audio');
      return;
    }

    setGeneratingAll(true);
    const newSlides = [...slides];
    let successCount = 0;

    for (let i = 0; i < slides.length; i++) {
      if (slides[i].english && !slides[i].audioUrl) {
        try {
          const audioUrl = await getCachedTtsUrl(slides[i].english);
          if (audioUrl) {
            newSlides[i] = { ...newSlides[i], audioUrl };
            successCount++;
          }
        } catch (error) {
          console.error(`Error generating audio for slide ${i}:`, error);
        }
      }
    }

    onChange({ ...content, slides: newSlides });
    setGeneratingAll(false);
    toast.success(`Generated audio for ${successCount} slides`);
  };

  const playAudioPreview = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  // --- AI Image Generation ---
  const openAiDialog = (index: number) => {
    const slide = slides[index];
    // Pre-fill prompt with the slide's English word/phrase
    setAiPrompt(slide.english ? `A clear, colorful illustration representing: ${slide.english}` : '');
    setAiPreviewUrl(null);
    setAiDialogIndex(index);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Digite um prompt para gerar a imagem');
      return;
    }
    setAiGenerating(true);
    setAiPreviewUrl(null);
    try {
      const response = await fetch('https://mcuquzgpaeoqskesgcnx.supabase.co/functions/v1/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [GEN_GATE_HEADER]: GEN_GATE_KEY },
        body: JSON.stringify({ prompt: aiPrompt }),
      });


      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`API error (${response.status}): ${responseText}`);
      }

      const data = JSON.parse(responseText);
      if (data.imageUrl) {
        setAiPreviewUrl(data.imageUrl);
      } else {
        throw new Error(data.error || 'No image URL in response');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar imagem');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAiApprove = () => {
    if (aiDialogIndex === null || !aiPreviewUrl) return;
    const newSlides = [...slides];
    newSlides[aiDialogIndex] = { ...newSlides[aiDialogIndex], imageUrl: aiPreviewUrl };
    onChange({ ...content, slides: newSlides });
    toast.success('Imagem aprovada e adicionada!');
    setAiDialogIndex(null);
    setAiPreviewUrl(null);
    setAiPrompt('');
  };

  const handleAiReject = () => {
    setAiPreviewUrl(null);
    toast.info('Imagem descartada. Edite o prompt e tente novamente.');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Vocabulary Slides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>English:</strong> The word or phrase in English</li>
              <li><strong>Translation:</strong> The Portuguese translation</li>
              <li><strong>Audio:</strong> Click "Generate Audio" to create TTS audio for each slide</li>
              <li><strong>Image:</strong> Upload an image or generate one with AI ✨</li>
            </ul>
          </div>

          {/* Generate All Button */}
          {slides.length > 0 && (
            <Button 
              onClick={handleGenerateAllAudio} 
              variant="outline" 
              className="w-full"
              disabled={generatingAll}
            >
              {generatingAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating all audio...
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Generate Audio for All Slides
                </>
              )}
            </Button>
          )}

          {/* Slides list */}
          <div className="space-y-4">
            {slides.map((slide, index) => (
              <Card key={index} className="bg-muted/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">Slide {index + 1}</Badge>
                      {slide.audioUrl && (
                        <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
                          <Check className="h-3 w-3" />
                          Audio Ready
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSlide(index)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <Label className="text-xs">English (word or phrase)</Label>
                      <Input
                        value={slide.english}
                        onChange={(e) => handleSlideChange(index, 'english', e.target.value)}
                        placeholder="e.g., Hello, how are you?"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Translation (Portuguese)</Label>
                      <Input
                        value={slide.translation}
                        onChange={(e) => handleSlideChange(index, 'translation', e.target.value)}
                        placeholder="e.g., Olá, como você está?"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Image (optional)
                      </Label>

                      {slide.imageUrl ? (
                        <div className="mt-2 relative inline-block">
                          <div className="rounded-lg overflow-hidden border w-24 h-24">
                            <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSlideChange(index, 'imageUrl', '')}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-md hover:opacity-80"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1 space-y-2">
                          <div
                            onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
                            onDragLeave={() => setDragOverIndex(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverIndex(null);
                              const file = e.dataTransfer.files?.[0];
                              if (file) uploadImageFile(file, index);
                            }}
                            onClick={() => fileInputRefs.current[index]?.click()}
                            className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
                              dragOverIndex === index
                                ? 'border-primary bg-primary/5'
                                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                            }`}
                          >
                            <input
                              ref={(el) => { fileInputRefs.current[index] = el; }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadImageFile(file, index);
                                e.target.value = '';
                              }}
                            />
                            {uploadingImage === index ? (
                              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span className="text-xs">Uploading...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                <Upload className="h-5 w-5" />
                                <span className="text-xs">Drop image or click to upload</span>
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full gap-1.5 text-xs"
                            onClick={() => openAiDialog(index)}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Gerar imagem com IA
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Audio controls */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateAudio(index)}
                        disabled={generatingAudio === index || !slide.english}
                        className="flex-1"
                      >
                        {generatingAudio === index ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : slide.audioUrl ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate Audio
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-4 w-4 mr-2" />
                            Generate Audio
                          </>
                        )}
                      </Button>
                      
                      {slide.audioUrl && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => playAudioPreview(slide.audioUrl!)}
                          className="gap-1"
                        >
                          <Volume2 className="h-4 w-4" />
                          Preview
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={handleAddSlide} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Slide
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      {slides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Preview</span>
              <Badge variant="secondary">{slides.length} slides</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {slides.slice(0, 5).map((slide, index) => (
                <div key={index} className="bg-muted/50 rounded-lg p-3 text-sm flex items-center gap-3">
                  {slide.imageUrl && (
                    <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 border">
                      <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {slide.audioUrl ? (
                    <Volume2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {slide.english || '(empty)'}
                    </p>
                    {slide.translation && (
                      <p className="text-muted-foreground text-xs truncate">{slide.translation}</p>
                    )}
                  </div>
                </div>
              ))}
              {slides.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  ... and {slides.length - 5} more slides
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Image Generation Dialog */}
      <Dialog open={aiDialogIndex !== null} onOpenChange={(open) => { if (!open && !aiGenerating) { setAiDialogIndex(null); setAiPreviewUrl(null); setAiPrompt(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Gerar Imagem com IA
            </DialogTitle>
          </DialogHeader>

          {aiGenerating ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Gerando imagem...</p>
            </div>
          ) : aiPreviewUrl ? (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border">
                <img src={aiPreviewUrl} alt="Generated preview" className="w-full h-auto max-h-72 object-contain bg-muted" />
              </div>
              <p className="text-xs text-muted-foreground text-center">Deseja usar esta imagem?</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleAiReject} className="flex-1 gap-1.5">
                  <XCircle className="h-4 w-4" />
                  Descartar
                </Button>
                <Button onClick={handleAiApprove} className="flex-1 gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  Aprovar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="aiSlidePrompt">Descreva a imagem que deseja gerar</Label>
                <Textarea
                  id="aiSlidePrompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: Uma ilustração colorida de uma maçã vermelha..."
                  className="mt-2 min-h-[80px]"
                />
              </div>
              <Button onClick={handleAiGenerate} disabled={!aiPrompt.trim()} className="w-full gap-1.5">
                <Sparkles className="h-4 w-4" />
                Gerar Imagem
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AudioSlidesPageEditor;
