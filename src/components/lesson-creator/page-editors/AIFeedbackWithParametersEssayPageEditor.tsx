import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface AIFeedbackWithParametersEssayPageEditorProps {
  content: any;
  onChange: (content: any) => void;
}

const AIFeedbackWithParametersEssayPageEditor: React.FC<AIFeedbackWithParametersEssayPageEditorProps> = ({ content, onChange }) => {
  const questions: string[] = content.questions || [];
  const evaluationParameters: string[] = content.evaluationParameters || [];
  const topic: string = content.topic || '';

  const handleTopicChange = (newTopic: string) => {
    onChange({
      ...content,
      topic: newTopic
    });
  };

  const handleQuestionChange = (index: number, newQuestion: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = newQuestion;
    onChange({
      ...content,
      questions: newQuestions
    });
  };

  const addQuestion = () => {
    const newQuestions = [...questions, ''];
    onChange({
      ...content,
      questions: newQuestions
    });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    onChange({
      ...content,
      questions: newQuestions
    });
  };

  const handleParameterChange = (index: number, newParameter: string) => {
    const newParameters = [...evaluationParameters];
    newParameters[index] = newParameter;
    onChange({
      ...content,
      evaluationParameters: newParameters
    });
  };

  const addParameter = () => {
    const newParameters = [...evaluationParameters, ''];
    onChange({
      ...content,
      evaluationParameters: newParameters
    });
  };

  const removeParameter = (index: number) => {
    const newParameters = evaluationParameters.filter((_, i) => i !== index);
    onChange({
      ...content,
      evaluationParameters: newParameters
    });
  };

  const onQuestionDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange({
      ...content,
      questions: items
    });
  };

  const onParameterDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(evaluationParameters);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange({
      ...content,
      evaluationParameters: items
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Feedback com Parâmetros - Essay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="topic">Tópico (opcional)</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => handleTopicChange(e.target.value)}
              placeholder="Digite o tópico da aula..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Perguntas para Essays
            <Button onClick={addQuestion} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Pergunta
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={onQuestionDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {questions.map((question, index) => (
                    <Draggable key={index} draggableId={`question-${index}`} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex items-start gap-2 p-3 border rounded-lg bg-gray-50"
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="mt-2 cursor-grab hover:cursor-grabbing"
                          >
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor={`question-${index}`}>Pergunta {index + 1}</Label>
                            <Textarea
                              id={`question-${index}`}
                              value={question}
                              onChange={(e) => handleQuestionChange(index, e.target.value)}
                              placeholder="Digite a pergunta do essay aqui..."
                              className="mt-1 min-h-[80px]"
                            />
                          </div>
                          <Button
                            onClick={() => removeQuestion(index)}
                            variant="ghost"
                            size="sm"
                            className="mt-6 text-red-600 hover:text-red-800"
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
          {questions.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              Nenhuma pergunta adicionada. Clique em "Adicionar Pergunta" para começar.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Parâmetros de Avaliação
            <Button onClick={addParameter} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Parâmetro
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={onParameterDragEnd}>
            <Droppable droppableId="parameters">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {evaluationParameters.map((parameter, index) => (
                    <Draggable key={index} draggableId={`parameter-${index}`} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex items-start gap-2 p-3 border rounded-lg bg-gray-50"
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="mt-2 cursor-grab hover:cursor-grabbing"
                          >
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor={`parameter-${index}`}>Parâmetro {index + 1}</Label>
                            <Textarea
                              id={`parameter-${index}`}
                              value={parameter}
                              onChange={(e) => handleParameterChange(index, e.target.value)}
                              placeholder="Digite o critério de avaliação..."
                              rows={10}
                              autoGrow
                              maxHeight={384}
                              className="mt-1 min-h-48 overflow-y-auto"
                            />
                          </div>
                          <Button
                            onClick={() => removeParameter(index)}
                            variant="ghost"
                            size="sm"
                            className="mt-6 text-red-600 hover:text-red-800"
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
          {evaluationParameters.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              Nenhum parâmetro adicionado. Clique em "Adicionar Parâmetro" para começar.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-blue-900 mb-2">Sobre esta página:</h4>
          <p className="text-blue-800 text-sm">
            Esta página é otimizada para essays com área de escrita expandida e sem gravação de áudio. 
            Os estudantes podem escrever respostas mais longas e receberão feedback gramatical e baseado nos parâmetros definidos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIFeedbackWithParametersEssayPageEditor;