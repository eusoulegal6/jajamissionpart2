import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { X, Plus, Image, Video } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageOptimizeButton from './ImageOptimizeButton';

interface MultipleChoicePageEditorProps {
  content: any;
  onChange: (content: any) => void;
}

const MultipleChoicePageEditor: React.FC<MultipleChoicePageEditorProps> = ({ content, onChange }) => {
  const mediaType = content.mediaType || (content.videoUrl ? 'video' : 'image');

  const handleQuestionChange = (question: string) => {
    onChange({ ...content, question });
  };

  const handleMediaTypeChange = (type: string) => {
    onChange({ ...content, mediaType: type });
  };

  const handleImageUrlChange = (imageUrl: string) => {
    const currentUrl = content.imageUrl || '';
    const hasFullImage = currentUrl.includes('fullImage=true');
    const hasFitImage = currentUrl.includes('fitImage=true');
    
    let newUrl = imageUrl;
    if (hasFullImage && !imageUrl.includes('fullImage=true')) {
      newUrl = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}fullImage=true`;
    } else if (hasFitImage && !imageUrl.includes('fitImage=true')) {
      newUrl = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}fitImage=true`;
    }
    
    onChange({ ...content, imageUrl: newUrl });
  };

  const handleVideoUrlChange = (videoUrl: string) => {
    onChange({ ...content, videoUrl });
  };

  const handleImageDisplayChange = (mode: string) => {
    const currentUrl = content.imageUrl || '';
    let newUrl = currentUrl
      .replace(/[?&]fullImage=true/, '')
      .replace(/[?&]fitImage=true/, '')
      .replace(/\?$/, '');
    
    if (mode === 'full') {
      newUrl = `${newUrl}${newUrl.includes('?') ? '&' : '?'}fullImage=true`;
    } else if (mode === 'fit') {
      newUrl = `${newUrl}${newUrl.includes('?') ? '&' : '?'}fitImage=true`;
    }
    
    onChange({ ...content, imageUrl: newUrl });
  };

  const getImageDisplayMode = () => {
    const currentUrl = content.imageUrl || '';
    if (currentUrl.includes('fullImage=true')) return 'full';
    if (currentUrl.includes('fitImage=true')) return 'fit';
    return 'cut';
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange({ ...content, options: newOptions });
  };

  const handleCorrectAnswerChange = (correctAnswer: number) => {
    onChange({ ...content, correctAnswer });
  };

  const handleExplanationChange = (explanation: string) => {
    onChange({ ...content, explanation });
  };

  const addOption = () => {
    if (options.length < 4) {
      const newOptions = [...options, ''];
      onChange({ ...content, options: newOptions });
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      const newCorrectAnswer = content.correctAnswer >= newOptions.length ? 0 : content.correctAnswer;
      onChange({ ...content, options: newOptions, correctAnswer: newCorrectAnswer });
    }
  };

  // Helper to detect YouTube URLs
  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Convert YouTube URL to embed format
  const getYouTubeEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtube.com/embed/')) {
      return url;
    }
    return url;
  };

  const options = content.options || ['', ''];
  const correctAnswer = content.correctAnswer || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pergunta de Múltipla Escolha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="question">Pergunta</Label>
            <Textarea
              id="question"
              value={content.question || ''}
              onChange={(e) => handleQuestionChange(e.target.value)}
              placeholder="Digite a pergunta..."
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Media Type Selector */}
          <div>
            <Label>Tipo de Mídia (Opcional)</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={mediaType === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleMediaTypeChange('image')}
                className="flex items-center gap-2"
              >
                <Image className="h-4 w-4" />
                Imagem
              </Button>
              <Button
                type="button"
                variant={mediaType === 'video' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleMediaTypeChange('video')}
                className="flex items-center gap-2"
              >
                <Video className="h-4 w-4" />
                Vídeo
              </Button>
            </div>
          </div>

          {/* Image URL Input */}
          {mediaType === 'image' && (
            <>
              <div>
                <Label htmlFor="imageUrl">URL da Imagem</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="imageUrl"
                    value={content.imageUrl || ''}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                  <ImageOptimizeButton
                    imageUrl={content.imageUrl}
                    onOptimized={handleImageUrlChange}
                  />
                </div>
              </div>

              {content.imageUrl && (
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
                </div>
              )}
            </>
          )}

          {/* Video URL Input */}
          {mediaType === 'video' && (
            <div>
              <Label htmlFor="videoUrl">URL do Vídeo</Label>
              <Input
                id="videoUrl"
                value={content.videoUrl || ''}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                placeholder="https://youtube.com/watch?v=..., Bunny Stream embed, ou URL direta do vídeo"
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Suporta YouTube, Bunny Stream (https://iframe.mediadelivery.net/embed/...) ou URLs diretas de vídeo (mp4, webm, etc.)
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <Label>Opções de Resposta</Label>
              <div className="flex gap-2">
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(options.length - 1)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {options.length < 4 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-3 mt-2">
              {options.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Opção ${String.fromCharCode(65 + index)}`}
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Resposta Correta</Label>
            <RadioGroup
              value={correctAnswer.toString()}
              onValueChange={(value) => handleCorrectAnswerChange(parseInt(value))}
              className="mt-2"
            >
              {options.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1">
                    {String.fromCharCode(65 + index)} - {option || `Opção ${String.fromCharCode(65 + index)}`}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="explanation">Explicação (Opcional)</Label>
            <Textarea
              id="explanation"
              value={content.explanation || ''}
              onChange={(e) => handleExplanationChange(e.target.value)}
              placeholder="Explique por que esta é a resposta correta..."
              className="mt-2"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {content.question && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-muted/20">
              <p className="font-medium mb-3">{content.question}</p>
              {mediaType === 'image' && content.imageUrl && (
                <img 
                  src={content.imageUrl} 
                  alt="Question" 
                  className="max-w-full h-auto mb-4 rounded-lg"
                />
              )}
              {mediaType === 'video' && content.videoUrl && (
                <div className="mb-4 aspect-video">
                  {/iframe\.mediadelivery\.net|mediadelivery\.net\/(embed|play)\/|video\.bunnycdn\.com\/(play|embed)\//i.test(content.videoUrl) ? (
                    <iframe
                      src={content.videoUrl.replace(/\/play\//, '/embed/').replace(/^https?:\/\/video\.bunnycdn\.com/i, 'https://iframe.mediadelivery.net')}
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : isYouTubeUrl(content.videoUrl) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(content.videoUrl)}
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={content.videoUrl}
                      controls
                      preload="metadata"
                      playsInline
                      webkit-playsinline="true"
                      x5-playsinline="true"
                      className="w-full h-full rounded-lg"
                    />
                  )}
                </div>
              )}
              <div className="space-y-2">
                {options.map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className={`w-4 h-4 border rounded-full ${correctAnswer === index ? 'bg-primary border-primary' : 'border-muted-foreground'}`}></div>
                    <span>{String.fromCharCode(65 + index)} - {option}</span>
                  </div>
                ))}
              </div>
              {content.explanation && (
                <div className="mt-4 p-3 bg-background rounded border">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Explicação:</p>
                  <p className="text-sm">{content.explanation}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MultipleChoicePageEditor;
