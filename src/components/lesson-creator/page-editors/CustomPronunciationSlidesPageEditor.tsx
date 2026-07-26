import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Mic, Plus, Trash2, GripVertical, Volume2, Loader2, Check } from 'lucide-react';
import { CustomPronunciationSlide } from '@/types/lesson';
import { getCachedTtsUrl } from '@/lib/ttsCached';
import { toast } from 'sonner';

interface CustomPronunciationSlidesPageEditorProps {
  content: {
    slides?: CustomPronunciationSlide[];
  };
  onChange: (content: any) => void;
}

const CustomPronunciationSlidesPageEditor: React.FC<CustomPronunciationSlidesPageEditorProps> = ({ content, onChange }) => {
  const slides = content.slides || [];
  const [generatingAudio, setGeneratingAudio] = useState<number | null>(null);

  const handleAddSlide = () => {
    const newSlide: CustomPronunciationSlide = {
      displayText: '',
      comparisonText: '',
      translation: '',
      audioMode: false
    };
    onChange({ ...content, slides: [...slides, newSlide] });
  };

  const handleRemoveSlide = (index: number) => {
    const newSlides = slides.filter((_, i) => i !== index);
    onChange({ ...content, slides: newSlides });
  };

  const handleSlideChange = (index: number, field: keyof CustomPronunciationSlide, value: any) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    
    // Auto-fill comparisonText with displayText if empty
    if (field === 'displayText' && !newSlides[index].comparisonText) {
      newSlides[index].comparisonText = value;
    }
    
    onChange({ ...content, slides: newSlides });
  };

  const handleAudioModeToggle = async (index: number, enabled: boolean) => {
    const slide = slides[index];
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], audioMode: enabled };
    
    // If enabling audio mode and we have display text but no audio URL, generate it
    if (enabled && slide.displayText && !slide.displayAudioUrl) {
      setGeneratingAudio(index);
      try {
        const audioUrl = await getCachedTtsUrl(slide.displayText);
        if (audioUrl) {
          newSlides[index].displayAudioUrl = audioUrl;
          toast.success('Audio generated successfully');
        } else {
          toast.error('Failed to generate audio');
          newSlides[index].audioMode = false;
        }
      } catch (error) {
        console.error('Error generating audio:', error);
        toast.error('Failed to generate audio');
        newSlides[index].audioMode = false;
      } finally {
        setGeneratingAudio(null);
      }
    }
    
    onChange({ ...content, slides: newSlides });
  };

  const handleRegenerateAudio = async (index: number) => {
    const slide = slides[index];
    if (!slide.displayText) {
      toast.error('Please enter display text first');
      return;
    }
    
    setGeneratingAudio(index);
    try {
      const audioUrl = await getCachedTtsUrl(slide.displayText);
      if (audioUrl) {
        const newSlides = [...slides];
        newSlides[index] = { ...newSlides[index], displayAudioUrl: audioUrl };
        onChange({ ...content, slides: newSlides });
        toast.success('Audio regenerated successfully');
      } else {
        toast.error('Failed to regenerate audio');
      }
    } catch (error) {
      console.error('Error regenerating audio:', error);
      toast.error('Failed to regenerate audio');
    } finally {
      setGeneratingAudio(null);
    }
  };

  const playAudioPreview = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Custom Pronunciation Slides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>Display Text:</strong> What the student sees and tries to say</li>
              <li><strong>Comparison Text:</strong> What the system compares against (for pronunciation scoring)</li>
              <li><strong>Translation:</strong> Optional Portuguese translation shown below</li>
              <li><strong>Audio Mode:</strong> Play audio instead of showing text (for listening practice)</li>
            </ul>
            <p className="mt-2 text-xs text-blue-600">
              Tip: Use different comparison text for contractions (e.g., display "I'm" but compare "I am")
            </p>
          </div>

          {/* Slides list */}
          <div className="space-y-4">
            {slides.map((slide, index) => (
              <Card key={index} className="bg-muted/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">Slide {index + 1}</Badge>
                      {slide.audioMode && (
                        <Badge variant="secondary" className="gap-1">
                          <Volume2 className="h-3 w-3" />
                          Audio Mode
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
                      <Label className="text-xs">Display Text (what user sees/hears)</Label>
                      <Input
                        value={slide.displayText}
                        onChange={(e) => handleSlideChange(index, 'displayText', e.target.value)}
                        placeholder="e.g., I'm going to the store"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Comparison Text (for pronunciation check)</Label>
                      <Input
                        value={slide.comparisonText}
                        onChange={(e) => handleSlideChange(index, 'comparisonText', e.target.value)}
                        placeholder="e.g., I am going to the store"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Translation (optional)</Label>
                      <Input
                        value={slide.translation || ''}
                        onChange={(e) => handleSlideChange(index, 'translation', e.target.value)}
                        placeholder="e.g., Eu vou à loja"
                        className="mt-1"
                      />
                    </div>

                    {/* Audio Mode Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={slide.audioMode || false}
                          onCheckedChange={(checked) => handleAudioModeToggle(index, checked)}
                          disabled={generatingAudio === index}
                        />
                        <Label className="text-xs font-medium">
                          Audio Mode (play audio instead of showing text)
                        </Label>
                        {generatingAudio === index && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      
                      {slide.audioMode && slide.displayAudioUrl && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => playAudioPreview(slide.displayAudioUrl!)}
                            className="h-7 text-xs"
                          >
                            <Volume2 className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRegenerateAudio(index)}
                            disabled={generatingAudio === index}
                            className="h-7 text-xs"
                          >
                            {generatingAudio === index ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Regenerate'
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {slide.audioMode && slide.displayAudioUrl && (
                      <div className="flex items-center gap-2 text-xs text-green-600">
                        <Check className="h-3 w-3" />
                        Audio cached and ready
                      </div>
                    )}
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
              {slides.slice(0, 3).map((slide, index) => (
                <div key={index} className="bg-muted/50 rounded-lg p-3 text-sm flex items-center gap-3">
                  {slide.audioMode ? (
                    <Volume2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  ) : (
                    <Mic className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {slide.audioMode ? '🔊 ' : ''}{slide.displayText || '(empty)'}
                    </p>
                    {slide.translation && (
                      <p className="text-muted-foreground text-xs truncate">{slide.translation}</p>
                    )}
                    {slide.displayText !== slide.comparisonText && slide.comparisonText && (
                      <p className="text-xs text-blue-600 truncate">
                        Compares: {slide.comparisonText}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {slides.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  ... and {slides.length - 3} more slides
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomPronunciationSlidesPageEditor;
