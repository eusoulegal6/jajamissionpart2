import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { renderHighlightedText } from '@/utils/textHighlightingUtils';
import TextHighlighter from '@/components/ui/text-highlighter';

interface MultipleChoiceWithTextPageEditorProps {
  content: any;
  onChange: (content: any) => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

const MultipleChoiceWithTextPageEditor: React.FC<MultipleChoiceWithTextPageEditorProps> = ({ 
  content, 
  onChange 
}) => {
  const [text, setText] = useState(content?.text || '');
  const [questions, setQuestions] = useState<Question[]>(content?.questions || []);

  useEffect(() => {
    onChange({
      ...content,
      text,
      questions
    });
  }, [text, questions]);

  const handleTextChange = (newText: string) => {
    setText(newText);
  };

  const handleQuestionsChange = (newQuestions: Question[]) => {
    setQuestions([...newQuestions]);
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    };
    const newQuestions = [newQuestion, ...questions];
    console.log('Adding question, new array:', newQuestions);
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    handleQuestionsChange(newQuestions);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    handleQuestionsChange(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    handleQuestionsChange(newQuestions);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    handleQuestionsChange(items);
  };

  return (
    <div className="space-y-6">
      {/* Text Content Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Texto para Leitura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TextHighlighter
            value={text}
            onChange={handleTextChange}
            placeholder="Digite o texto que os estudantes irão ler aqui..."
            label="Texto que o estudante irá ler"
          />
        </CardContent>
      </Card>

      {/* Questions Configuration */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Perguntas de Múltipla Escolha</CardTitle>
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
              <p className="text-muted-foreground text-center py-8">
                Nenhuma pergunta adicionada ainda. Clique em "Adicionar Pergunta" para começar.
              </p>
            ) : (
              <Droppable droppableId="questions">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {questions.map((question, index) => (
                      <Draggable key={question.id} draggableId={question.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="border rounded-lg p-4 bg-gray-50 space-y-4"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                {...provided.dragHandleProps}
                                className="mt-2"
                              >
                                <GripVertical className="h-4 w-4 text-gray-400" />
                              </div>
                              <div className="flex-1 space-y-4">
                                <div>
                                  <Label className="text-sm font-medium">Pergunta {questions.length - index}</Label>
                                  <Textarea
                                    value={question.question}
                                    onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                                    placeholder="Digite a pergunta aqui..."
                                    className="mt-2"
                                    rows={2}
                                  />
                                </div>
                                
                                {/* Options */}
                                <div className="space-y-3">
                                  <Label className="text-sm font-medium">Opções de Resposta</Label>
                                  {question.options.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center gap-3">
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                                        question.correctAnswer === optionIndex 
                                          ? 'bg-green-100 border-green-500 text-green-700' 
                                          : 'border-gray-300 text-gray-500'
                                      }`}>
                                        {String.fromCharCode(65 + optionIndex)}
                                      </div>
                                      <Input
                                        value={option}
                                        onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                        placeholder={`Opção ${String.fromCharCode(65 + optionIndex)}`}
                                        className="flex-1"
                                      />
                                    </div>
                                  ))}
                                </div>

                                {/* Correct Answer Selection */}
                                <div>
                                  <Label className="text-sm font-medium">Resposta Correta</Label>
                                  <Select
                                    value={question.correctAnswer.toString()}
                                    onValueChange={(value) => updateQuestion(index, 'correctAnswer', parseInt(value))}
                                  >
                                    <SelectTrigger className="mt-2">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {question.options.map((option, optionIndex) => (
                                        <SelectItem key={optionIndex} value={optionIndex.toString()}>
                                          {String.fromCharCode(65 + optionIndex)} - {option.trim() || `Opção ${String.fromCharCode(65 + optionIndex)}`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Explicação (opcional)</Label>
                                  <div className="mt-2 border rounded-md">
                                    <Textarea
                                      value={question.explanation || ''}
                                      onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                                      placeholder="Explique por que esta resposta está correta..."
                                      className="border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 w-full min-h-[60px] max-h-[120px]"
                                      autoGrow
                                      maxHeight={120}
                                    />
                                  </div>
                                </div>
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
      </DragDropContext>

      {/* Preview Section */}
      {(text.trim() || questions.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview da Experiência do Estudante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Text Preview */}
              <div>
                <h4 className="font-medium mb-2">Texto para Leitura:</h4>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
                  {text.trim() ? (
                    <div className="text-sm whitespace-pre-wrap">{renderHighlightedText(text)}</div>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">Nenhum texto adicionado ainda</p>
                  )}
                </div>
              </div>
              
              {/* Questions Preview */}
              <div>
                <h4 className="font-medium mb-2">Perguntas:</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {questions.length > 0 ? (
                    questions.map((question, index) => (
                      question.question.trim() && (
                        <div key={question.id} className="border rounded-lg p-3 bg-white">
                          <p className="text-sm font-medium mb-2">
                            {index + 1}. {question.question}
                          </p>
                          <div className="space-y-1 mb-2">
                            {question.options.map((option, optionIndex) => (
                              option.trim() && (
                                <div key={optionIndex} className="flex items-center gap-2 text-xs">
                                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-xs ${
                                    question.correctAnswer === optionIndex 
                                      ? 'bg-green-100 border-green-500 text-green-700' 
                                      : 'border-gray-300 text-gray-500'
                                  }`}>
                                    {String.fromCharCode(65 + optionIndex)}
                                  </span>
                                  <span className={question.correctAnswer === optionIndex ? 'font-medium text-green-700' : ''}>
                                    {option}
                                  </span>
                                </div>
                              )
                            ))}
                          </div>
                          {question.explanation?.trim() && (
                            <div className="text-xs text-muted-foreground">
                              ✓ Com explicação
                            </div>
                          )}
                        </div>
                      )
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm italic">Nenhuma pergunta adicionada ainda</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Como funciona:</strong> Os estudantes verão o texto em uma área rolável do lado esquerdo 
                e as perguntas de múltipla escolha do lado direito. Eles podem rolar o texto enquanto respondem às perguntas 
                e avançar para a próxima pergunta sem perder o acesso ao texto.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MultipleChoiceWithTextPageEditor;