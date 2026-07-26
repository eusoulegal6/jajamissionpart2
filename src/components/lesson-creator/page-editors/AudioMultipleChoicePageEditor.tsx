import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { X, Plus, Play, Pause } from 'lucide-react';

interface AudioMultipleChoicePageEditorProps {
  content: any;
  onChange: (content: any) => void;
}

const AudioMultipleChoicePageEditor: React.FC<AudioMultipleChoicePageEditorProps> = ({ content, onChange }) => {
  const [isPreviewPlaying, setIsPreviewPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const handleQuestionChange = (question: string) => {
    onChange({ ...content, question });
  };

  const handleAudioUrlChange = (audioUrl: string) => {
    onChange({ ...content, audioUrl });
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

  const handleAudioPreview = () => {
    if (!content.audioUrl) return;

    if (isPreviewPlaying) {
      audioRef.current?.pause();
      setIsPreviewPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.src = content.audioUrl;
        audioRef.current.play()
          .then(() => setIsPreviewPlaying(true))
          .catch(console.error);
      }
    }
  };

  React.useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => setIsPreviewPlaying(false);
      const handlePause = () => setIsPreviewPlaying(false);
      
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('pause', handlePause);
      
      return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('pause', handlePause);
      };
    }
  }, []);

  const options = content.options || ['', ''];
  const correctAnswer = content.correctAnswer || 0;

  return (
    <div className="space-y-6">
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      <Card>
        <CardHeader>
          <CardTitle>Áudio + Múltipla Escolha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="audioUrl">URL do Áudio</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="audioUrl"
                value={content.audioUrl || ''}
                onChange={(e) => handleAudioUrlChange(e.target.value)}
                placeholder="https://exemplo.com/audio.mp3"
                className="flex-1"
              />
              {content.audioUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAudioPreview}
                  className="flex items-center gap-2"
                >
                  {isPreviewPlaying ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Testar
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

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
              {options.map((option, index) => (
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
              {options.map((option, index) => (
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

      {content.question && content.audioUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="mb-4 p-3 bg-background rounded border">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Áudio da Pergunta</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAudioPreview}
                    className="flex items-center gap-2"
                  >
                    {isPreviewPlaying ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Reproduzir
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <p className="font-medium mb-3">{content.question}</p>
              
              <div className="space-y-2">
                {options.map((option, index) => (
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

export default AudioMultipleChoicePageEditor;