import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

interface MatchingPageEditorProps {
  content: any;
  onChange: (content: any) => void;
}

const MatchingPageEditor: React.FC<MatchingPageEditorProps> = ({ content, onChange }) => {
  const handleInstructionsChange = (instructions: string) => {
    onChange({ ...content, instructions });
  };

  const handlePairChange = (index: number, side: 'left' | 'right', value: string) => {
    const newPairs = [...(content.pairs || [])];
    if (!newPairs[index]) {
      newPairs[index] = { left: '', right: '' };
    }
    newPairs[index][side] = value;
    onChange({ ...content, pairs: newPairs });
  };

  const addPair = () => {
    const newPairs = [...(content.pairs || []), { left: '', right: '' }];
    onChange({ ...content, pairs: newPairs });
  };

  const removePair = (index: number) => {
    const newPairs = (content.pairs || []).filter((_: any, i: number) => i !== index);
    onChange({ ...content, pairs: newPairs.length > 0 ? newPairs : [{ left: '', right: '' }] });
  };

  const pairs = content.pairs || [{ left: '', right: '' }];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Atividade de Associação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="instructions">Instruções (Opcional)</Label>
            <Textarea
              id="instructions"
              value={content.instructions || ''}
              onChange={(e) => handleInstructionsChange(e.target.value)}
              placeholder="Digite as instruções para a atividade..."
              className="mt-2"
              rows={2}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>Pares para Associação</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPair}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Par
              </Button>
            </div>
            <div className="space-y-3 mt-2">
              {pairs.map((pair, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 items-center p-3 border rounded-lg">
                  <div>
                    <Label className="text-sm text-muted-foreground">Coluna Esquerda</Label>
                    <Input
                      value={pair.left || ''}
                      onChange={(e) => handlePairChange(index, 'left', e.target.value)}
                      placeholder="Item da esquerda"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Coluna Direita</Label>
                    <Input
                      value={pair.right || ''}
                      onChange={(e) => handlePairChange(index, 'right', e.target.value)}
                      placeholder="Item correspondente"
                      className="mt-1"
                    />
                  </div>
                  {pairs.length > 1 && (
                    <div className="col-span-2 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePair(index)}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Remover
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo de 2 pares necessários. Os itens serão embaralhados automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>

      {pairs.some(pair => pair.left && pair.right) && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-muted/20">
              {content.instructions && (
                <p className="font-medium mb-4">{content.instructions}</p>
              )}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-center">Coluna A</h4>
                  <div className="space-y-2">
                    {pairs.filter(pair => pair.left).map((pair, index) => (
                      <div key={index} className="p-2 bg-background border rounded text-center">
                        {pair.left}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3 text-center">Coluna B</h4>
                  <div className="space-y-2">
                    {pairs.filter(pair => pair.right).map((pair, index) => (
                      <div key={index} className="p-2 bg-background border rounded text-center">
                        {pair.right}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Os alunos conectarão itens da Coluna A com seus pares correspondentes na Coluna B
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatchingPageEditor;