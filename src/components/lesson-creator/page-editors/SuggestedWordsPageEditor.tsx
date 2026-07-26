import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X, BookText } from 'lucide-react';

interface SuggestedWordsPageEditorProps {
  content: any;
  onChange: (content: any) => void;
}

const SuggestedWordsPageEditor: React.FC<SuggestedWordsPageEditorProps> = ({ content, onChange }) => {
  const [newWord, setNewWord] = useState('');

  const description = content?.description || '';
  const suggestedWords = content?.suggestedWords || [];

  const handleDescriptionChange = (description: string) => {
    onChange({
      ...content,
      description
    });
  };

  const handleAddWord = () => {
    if (!newWord.trim()) return;
    
    const updatedWords = [...suggestedWords, newWord.trim()];
    onChange({
      ...content,
      suggestedWords: updatedWords
    });
    setNewWord('');
  };

  const handleRemoveWord = (index: number) => {
    const updatedWords = suggestedWords.filter((_: any, i: number) => i !== index);
    onChange({
      ...content,
      suggestedWords: updatedWords
    });
  };

  const handleWordChange = (index: number, newValue: string) => {
    const updatedWords = [...suggestedWords];
    updatedWords[index] = newValue;
    onChange({
      ...content,
      suggestedWords: updatedWords
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddWord();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookText className="h-5 w-5" />
            Configurações da Página de Palavras Sugeridas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição da Página</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Digite uma descrição para explicar aos estudantes sobre as palavras sugeridas..."
              className="mt-2"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Palavras Sugeridas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Adicione palavras que os estudantes poderão adicionar aos seus flashcards
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new word */}
          <div className="flex gap-2">
            <Input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite uma palavra em inglês..."
              className="flex-1"
            />
            <Button
              onClick={handleAddWord}
              disabled={!newWord.trim()}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Words list */}
          {suggestedWords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma palavra adicionada ainda</p>
              <p className="text-sm">Use o campo acima para adicionar palavras</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {suggestedWords.length} palavra{suggestedWords.length !== 1 ? 's' : ''} adicionada{suggestedWords.length !== 1 ? 's' : ''}
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {suggestedWords.map((word: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <Badge variant="secondary" className="text-sm">
                      {index + 1}
                    </Badge>
                    <Input
                      value={word}
                      onChange={(e) => handleWordChange(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveWord(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <BookText className="h-4 w-4 text-blue-600" />
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-blue-900">Como funciona</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Os estudantes verão as palavras em cards interativos</p>
                <p>• Eles podem clicar para adicionar palavras aos seus flashcards</p>
                <p>• As palavras serão automaticamente traduzidas e terão áudio gerado</p>
                <p>• O progresso é mostrado conforme adicionam as palavras</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuggestedWordsPageEditor;