import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import ImageOptimizeButton from './ImageOptimizeButton';

interface ExactAnswerPageEditorProps {
  content: any;
  onChange: (content: any) => void;
}

const ExactAnswerPageEditor: React.FC<ExactAnswerPageEditorProps> = ({ content, onChange }) => {
  const handleQuestionChange = (question: string) => {
    onChange({ ...content, question });
  };

  const handleImageUrlChange = (imageUrl: string) => {
    onChange({ ...content, imageUrl });
  };

  const handleCorrectAnswerChange = (index: number, value: string) => {
    const newAnswers = [...(content.correctAnswers || [''])];
    newAnswers[index] = value;
    onChange({ ...content, correctAnswers: newAnswers });
  };

  const addCorrectAnswer = () => {
    const newAnswers = [...(content.correctAnswers || []), ''];
    onChange({ ...content, correctAnswers: newAnswers });
  };

  const removeCorrectAnswer = (index: number) => {
    const newAnswers = (content.correctAnswers || []).filter((_: string, i: number) => i !== index);
    onChange({ ...content, correctAnswers: newAnswers.length > 0 ? newAnswers : [''] });
  };

  const handleExplanationChange = (explanation: string) => {
    onChange({ ...content, explanation });
  };

  const correctAnswers = content.correctAnswers || [''];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pergunta de Resposta Exata</CardTitle>
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

          <div>
            <Label htmlFor="imageUrl">URL da Imagem (Opcional)</Label>
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

          <div>
            <div className="flex items-center justify-between">
              <Label>Respostas Corretas</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCorrectAnswer}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
            <div className="space-y-2 mt-2">
              {correctAnswers.map((answer, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={answer}
                    onChange={(e) => handleCorrectAnswerChange(index, e.target.value)}
                    placeholder={`Resposta correta ${index + 1}`}
                    className="flex-1"
                  />
                  {correctAnswers.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCorrectAnswer(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              A comparação ignora pontuação e maiúsculas/minúsculas
            </p>
          </div>

          <div>
            <Label htmlFor="explanation">Explicação (Opcional)</Label>
            <Textarea
              id="explanation"
              value={content.explanation || ''}
              onChange={(e) => handleExplanationChange(e.target.value)}
              placeholder="Explique a resposta ou forneça informações adicionais..."
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
              {content.imageUrl && (
                <img 
                  src={content.imageUrl} 
                  alt="Question" 
                  className="max-w-full h-auto mb-4 rounded-lg"
                />
              )}
              <div className="mb-4">
                <Input
                  placeholder="Digite sua resposta aqui..."
                  disabled
                  className="bg-background"
                />
              </div>
              {correctAnswers.filter(a => a.trim()).length > 0 && (
                <div className="p-3 bg-background rounded border">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Respostas aceitas:</p>
                  <ul className="text-sm space-y-1">
                    {correctAnswers.filter(a => a.trim()).map((answer, index) => (
                      <li key={index} className="text-foreground">• {answer}</li>
                    ))}
                  </ul>
                </div>
              )}
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

export default ExactAnswerPageEditor;