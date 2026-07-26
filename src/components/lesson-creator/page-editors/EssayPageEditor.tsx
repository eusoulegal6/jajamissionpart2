import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EssayPageEditorProps {
  content: any;
  onChange: (content: any) => void;
}

const EssayPageEditor: React.FC<EssayPageEditorProps> = ({ content, onChange }) => {
  const handleTopicChange = (topic: string) => {
    onChange({ ...content, topic });
  };

  const handleInstructionsChange = (instructions: string) => {
    onChange({ ...content, instructions });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Redação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="topic">Tópico da Redação</Label>
            <Input
              id="topic"
              value={content.topic || ''}
              onChange={(e) => handleTopicChange(e.target.value)}
              placeholder="Ex: Describe your favorite vacation destination"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="instructions">Instruções (Opcional)</Label>
            <Textarea
              id="instructions"
              value={content.instructions || ''}
              onChange={(e) => handleInstructionsChange(e.target.value)}
              placeholder="Instruções adicionais para o aluno..."
              className="mt-2"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {content.topic && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-muted/20">
              <h3 className="text-lg font-semibold mb-3">{content.topic}</h3>
              
              {content.instructions && (
                <div className="mb-4 p-3 bg-background rounded border">
                  <p className="text-sm">{content.instructions}</p>
                </div>
              )}
              
              <div className="border rounded p-3 bg-background min-h-[200px]">
                <p className="text-sm text-muted-foreground italic">
                  Área de escrita da redação aparecerá aqui...
                </p>
              </div>
              
              <div className="mt-3 flex gap-2">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm">
                  Obter Feedback da IA
                </button>
                <button className="px-4 py-2 border rounded text-sm">
                  Pedir Ajuda
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EssayPageEditor;