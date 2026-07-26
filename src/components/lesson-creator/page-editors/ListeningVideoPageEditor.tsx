import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Video } from 'lucide-react';

interface ListeningVideoPageEditorProps {
  content: any;
  onChange: (content: any) => void;
}

const ListeningVideoPageEditor: React.FC<ListeningVideoPageEditorProps> = ({ content, onChange }) => {
  const videoUrl = content.videoUrl || '';
  const questions = content.questions || [{ originalText: '' }];

  const handleVideoUrlChange = (url: string) => {
    onChange({ ...content, videoUrl: url });
  };

  const handleQuestionChange = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { originalText: text };
    onChange({ ...content, questions: newQuestions });
  };

  const addQuestion = () => {
    onChange({ 
      ...content, 
      questions: [...questions, { originalText: '' }] 
    });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_: any, i: number) => i !== index);
    onChange({ ...content, questions: newQuestions });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Configuração do Vídeo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="videoUrl">URL do Vídeo</Label>
            <Input
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => handleVideoUrlChange(e.target.value)}
              placeholder="https://iframe.mediadelivery.net/embed/... (Bunny Stream), YouTube ou .mp4"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Suporta Bunny Stream (iframe embed), YouTube e links diretos de vídeo
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exercícios de Transcrição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O aluno assistirá o vídeo e deverá transcrever o que ouviu. Adicione as frases corretas para comparação.
          </p>

          {questions.map((question: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor={`question-${index}`}>
                  Frase {index + 1}
                </Label>
                {questions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Input
                id={`question-${index}`}
                value={question.originalText || ''}
                onChange={(e) => handleQuestionChange(index, e.target.value)}
                placeholder="Digite a frase correta que aparece no vídeo..."
              />
            </div>
          ))}

          <Button
            onClick={addQuestion}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Frase
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ListeningVideoPageEditor;
