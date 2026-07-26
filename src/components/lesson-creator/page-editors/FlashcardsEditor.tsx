import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { LessonFlashcard } from '@/types/lesson';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isMultiWordPhrase } from '@/utils/multiWordPhrases';

interface FlashcardsEditorProps {
  flashcards: LessonFlashcard[];
  onChange: (flashcards: LessonFlashcard[]) => void;
}

interface ValidationResult {
  valid: boolean;
  normalized: string;
  suggestions?: string[];
}

const FlashcardsEditor: React.FC<FlashcardsEditorProps> = ({ flashcards, onChange }) => {
  const [wordInput, setWordInput] = useState("");
  const [validating, setValidating] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const validateWord = async (word: string): Promise<ValidationResult | null> => {
    const inputText = word.trim();
    
    if (isMultiWordPhrase(inputText)) {
      return {
        valid: true,
        normalized: inputText.toLowerCase(),
        suggestions: []
      };
    }
    
    try {
      const { data, error } = await supabase.functions.invoke("validate-word", {
        body: { word: inputText, language: "en" },
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Validation error:", error);
      return null;
    }
  };

  const translateWord = async (word: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("translate-word", {
        body: { word: word.trim(), language: "en" },
      });
      
      if (error) throw error;
      return data.translation;
    } catch (error) {
      console.error("Translation error:", error);
      return null;
    }
  };

  const handleAddFlashcard = async () => {
    if (!wordInput.trim()) {
      toast.error("Por favor, digite uma palavra em inglês");
      return;
    }

    setValidating(true);

    try {
      const validation = await validateWord(wordInput);
      if (!validation?.valid) {
        setValidationResult(validation);
        setValidating(false);
        return;
      }

      const normalizedWord = validation.normalized;
      setValidating(false);
      setTranslating(true);

      const translation = await translateWord(normalizedWord);
      if (!translation) {
        toast.error("Erro ao traduzir a palavra");
        setTranslating(false);
        return;
      }

      setTranslating(false);

      // Add flashcard with English as front, Portuguese as back
      onChange([...flashcards, { 
        front: normalizedWord,
        back: translation,
        context: '' 
      }]);
      
      toast.success("Flashcard adicionado!");
      setWordInput("");
      setValidationResult(null);
    } catch (error) {
      console.error("Error adding flashcard:", error);
      toast.error("Erro inesperado");
      setValidating(false);
      setTranslating(false);
      setValidationResult(null);
    }
  };

  const handleUseSuggestion = (suggestion: string) => {
    setWordInput(suggestion);
    setValidationResult(null);
  };

  const removeFlashcard = (index: number) => {
    onChange(flashcards.filter((_, i) => i !== index));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(flashcards);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange(items);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flashcards da Lição</CardTitle>
        <p className="text-sm text-muted-foreground">
          Digite palavras em inglês que serão automaticamente traduzidas e salvas quando o aluno completar a lição
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Word Section */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="word-input">Adicionar Nova Palavra</Label>
            <div className="flex gap-2">
              <Input
                id="word-input"
                placeholder="Digite uma palavra em inglês..."
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddFlashcard()}
                disabled={validating || translating}
                className="flex-1"
              />
              <Button
                onClick={handleAddFlashcard}
                disabled={!wordInput.trim() || validating || translating}
                size="default"
              >
                {validating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Validando...
                  </>
                ) : translating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Traduzindo...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
            </div>
          </div>

          {validationResult && !validationResult.valid && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="text-destructive font-medium mb-2">
                ❌ Palavra não encontrada. Verifique a ortografia.
              </div>
              
              {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-destructive/80 font-medium">Você quis dizer:</p>
                  <div className="flex flex-wrap gap-2">
                    {validationResult.suggestions.map((suggestion) => (
                      <Button 
                        key={suggestion} 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleUseSuggestion(suggestion)}
                        className="text-sm"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Flashcards List */}
        {flashcards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum flashcard adicionado ainda</p>
            <p className="text-sm">Digite uma palavra em inglês acima para começar</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Flashcards ({flashcards.length})
              </Label>
              <p className="text-xs text-muted-foreground">
                Arraste para reordenar
              </p>
            </div>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="flashcards">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {flashcards.map((flashcard, index) => (
                      <Draggable key={index} draggableId={`flashcard-${index}`} index={index}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="border-2"
                          >
                            <CardContent className="pt-4 pb-4">
                              <div className="flex items-center gap-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="w-5 h-5 text-muted-foreground" />
                                </div>
                                
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Inglês</p>
                                    <p className="font-medium">{flashcard.front}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Português</p>
                                    <p className="font-medium">{flashcard.back}</p>
                                  </div>
                                </div>
                                
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFlashcard(index)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FlashcardsEditor;
