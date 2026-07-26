import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface AIFeedbackPageEditorProps {
  content: any;
  onChange: (content: any) => void;
}

const AIFeedbackPageEditor: React.FC<AIFeedbackPageEditorProps> = ({ content, onChange }) => {
  const questions: string[] = content.questions || [];
  const topic: string = content.topic || '';

  const handleTopicChange = (newTopic: string) => {
    onChange({ ...content, topic: newTopic });
  };

  const handleQuestionsChange = (newQuestions: string[]) => {
    onChange({ ...content, questions: newQuestions });
  };

  const addQuestion = () => {
    handleQuestionsChange([...questions, '']);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_: string, i: number) => i !== index);
    handleQuestionsChange(newQuestions);
  };

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    handleQuestionsChange(newQuestions);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const newQuestions = Array.from(questions) as string[];
    const [reorderedItem] = newQuestions.splice(result.source.index, 1);
    newQuestions.splice(result.destination.index, 0, reorderedItem);

    handleQuestionsChange(newQuestions);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração do AI Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="topic">Tópico (Opcional)</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => handleTopicChange(e.target.value)}
              placeholder="Digite o tópico da conversa..."
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              O tópico ajuda a IA a contextualizar as perguntas
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>Perguntas</Label>
              <Button onClick={addQuestion} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Pergunta
              </Button>
            </div>
            
            {questions.length > 0 && (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="questions">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 mt-3">
                      {questions.map((question: string, index: number) => (
                        <Draggable key={index} draggableId={`question-${index}`} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-start gap-3 p-3 border rounded-lg ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <div {...provided.dragHandleProps} className="mt-2">
                                <GripVertical className="h-4 w-4 text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <Textarea
                                  value={question}
                                  onChange={(e) => updateQuestion(index, e.target.value)}
                                  placeholder="Digite a pergunta..."
                                  className="min-h-[80px]"
                                />
                              </div>
                              <Button
                                onClick={() => removeQuestion(index)}
                                size="sm"
                                variant="ghost"
                                className="mt-2"
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
              </DragDropContext>
            )}
            
            {questions.length === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg mt-3">
                <p>Nenhuma pergunta adicionada ainda</p>
                <p className="text-sm">Clique no botão acima para adicionar uma pergunta</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview das Perguntas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questions.map((question: string, index: number) => (
                question.trim() && (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        AI
                      </div>
                      <div className="flex-1">
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <p className="text-sm font-medium text-gray-600 mb-1">
                            Pergunta {index + 1}:
                          </p>
                          <p className="text-sm">{question}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                        U
                      </div>
                      <div className="flex-1">
                        <div className="bg-blue-500 text-white rounded-lg p-3">
                          <p className="text-sm">
                            [O aluno responderá aqui e receberá feedback da IA]
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIFeedbackPageEditor;