import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface RecommendedVocabularyPageEditorProps {
  content: any;
  onChange: (content: any) => void;
}

const RecommendedVocabularyPageEditor: React.FC<RecommendedVocabularyPageEditorProps> = ({ 
  content, 
  onChange 
}) => {
  const [topic, setTopic] = useState(content?.topic || '');
  const [questions, setQuestions] = useState<string[]>(content?.questions || []);
  const [recommendedWords, setRecommendedWords] = useState<string[]>(content?.recommendedWords || []);

  useEffect(() => {
    onChange({
      ...content,
      topic,
      questions,
      recommendedWords
    });
  }, [topic, questions, recommendedWords]);

  const handleTopicChange = (newTopic: string) => {
    setTopic(newTopic);
  };

  const handleQuestionsChange = (newQuestions: string[]) => {
    setQuestions(newQuestions);
  };

  const handleRecommendedWordsChange = (newWords: string[]) => {
    setRecommendedWords(newWords);
  };

  const addQuestion = () => {
    handleQuestionsChange([...questions, '']);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    handleQuestionsChange(newQuestions);
  };

  const updateQuestion = (index: number, newQuestion: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = newQuestion;
    handleQuestionsChange(newQuestions);
  };

  const addRecommendedWord = () => {
    handleRecommendedWordsChange([...recommendedWords, '']);
  };

  const removeRecommendedWord = (index: number) => {
    const newWords = recommendedWords.filter((_, i) => i !== index);
    handleRecommendedWordsChange(newWords);
  };

  const updateRecommendedWord = (index: number, newWord: string) => {
    const newWords = [...recommendedWords];
    newWords[index] = newWord;
    handleRecommendedWordsChange(newWords);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    if (result.type === 'questions') {
      const items = Array.from(questions);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      handleQuestionsChange(items);
    } else if (result.type === 'words') {
      const items = Array.from(recommendedWords);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      handleRecommendedWordsChange(items);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Topic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configurações do Vocabulário Recomendado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="topic">Tópico (opcional)</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value)}
                placeholder="Ex: Viajar, Comida, Trabalho..."
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Perguntas</CardTitle>
              <Button
                onClick={addQuestion}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Pergunta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma pergunta adicionada ainda. Clique em "Adicionar Pergunta" para começar.
              </p>
            ) : (
              <Droppable droppableId="questions" type="questions">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {questions.map((question, index) => (
                      <Draggable key={`question-${index}`} draggableId={`question-${index}`} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50"
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="mt-2"
                            >
                              <GripVertical className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <Label className="text-sm font-medium">Pergunta {index + 1}</Label>
                              <Textarea
                                value={question}
                                onChange={(e) => updateQuestion(index, e.target.value)}
                                placeholder="Digite a pergunta aqui..."
                                className="mt-2"
                                rows={2}
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeQuestion(index)}
                              className="text-red-600 border-red-200 hover:bg-red-50 mt-6"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </CardContent>
        </Card>

        {/* Recommended Words Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Vocabulário Recomendado</CardTitle>
              <Button
                onClick={addRecommendedWord}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Palavra
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recommendedWords.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma palavra recomendada ainda. Clique em "Adicionar Palavra" para começar.
              </p>
            ) : (
              <Droppable droppableId="words" type="words">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {recommendedWords.map((word, index) => (
                      <Draggable key={`word-${index}`} draggableId={`word-${index}`} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
                          >
                            <div
                              {...provided.dragHandleProps}
                            >
                              <GripVertical className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <Input
                                value={word}
                                onChange={(e) => updateRecommendedWord(index, e.target.value)}
                                placeholder="Digite a palavra recomendada..."
                                className="bg-white"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeRecommendedWord(index)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </CardContent>
        </Card>

        {/* Preview Section */}
        {(questions.length > 0 || recommendedWords.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview da Experiência do Estudante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendedWords.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Vocabulário recomendado:</p>
                  <div className="flex flex-wrap gap-2">
                    {recommendedWords.filter(word => word.trim()).map((word, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {questions.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Conversação simulada:</p>
                  <div className="space-y-3">
                    {questions.filter(q => q.trim()).map((question, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <p className="font-medium text-blue-700">IA:</p>
                        <p className="text-gray-700">{question}</p>
                        <p className="text-sm text-gray-500 mt-2 italic">
                          [Estudante responde aqui - IA analisará o uso do vocabulário recomendado]
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DragDropContext>
  );
};

export default RecommendedVocabularyPageEditor;