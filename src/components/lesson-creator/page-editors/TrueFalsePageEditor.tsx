import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface TrueFalsePageEditorProps {
  content: any;
  onChange: (content: any) => void;
}

interface Question {
  text: string;
  correctAnswer: boolean;
  explanation: string;
}

const TrueFalsePageEditor: React.FC<TrueFalsePageEditorProps> = ({ content, onChange }) => {
  // Check if we have a questions array (multiple questions format) or single question format
  const hasQuestionsArray = Array.isArray(content.questions) && content.questions.length > 0;
  
  const handleSingleStatementChange = (statement: string) => {
    onChange({ ...content, statement });
  };

  const handleSingleAnswerChange = (isTrue: boolean) => {
    onChange({ ...content, isTrue });
  };

  const handleSingleExplanationChange = (explanation: string) => {
    onChange({ ...content, explanation });
  };

  // Handlers for questions array format
  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const questions = [...(content.questions || [])];
    questions[index] = { ...questions[index], [field]: value };
    onChange({ ...content, questions });
  };

  const addQuestion = () => {
    const questions = [...(content.questions || [])];
    questions.push({ text: '', correctAnswer: true, explanation: '' });
    onChange({ ...content, questions });
  };

  const removeQuestion = (index: number) => {
    const questions = [...(content.questions || [])];
    questions.splice(index, 1);
    onChange({ ...content, questions });
  };

  // Render multiple questions format
  if (hasQuestionsArray) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Perguntas Verdadeiro/Falso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {content.questions.map((question: Question, index: number) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-semibold">Pergunta {index + 1}</Label>
                  {content.questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div>
                  <Label htmlFor={`statement-${index}`}>Afirmação</Label>
                  <Textarea
                    id={`statement-${index}`}
                    value={question.text || ''}
                    onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                    placeholder="Digite a afirmação que será avaliada..."
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Resposta Correta</Label>
                  <RadioGroup
                    value={question.correctAnswer ? 'true' : 'false'}
                    onValueChange={(value) => handleQuestionChange(index, 'correctAnswer', value === 'true')}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id={`true-${index}`} />
                      <Label htmlFor={`true-${index}`}>Verdadeiro</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id={`false-${index}`} />
                      <Label htmlFor={`false-${index}`}>Falso</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor={`explanation-${index}`}>Explicação</Label>
                  <Textarea
                    id={`explanation-${index}`}
                    value={question.explanation || ''}
                    onChange={(e) => handleQuestionChange(index, 'explanation', e.target.value)}
                    placeholder="Explique por que a resposta está correta ou incorreta..."
                    className="mt-2"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta explicação será mostrada após o aluno responder
                  </p>
                </div>
              </div>
            ))}

            <Button onClick={addQuestion} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Pergunta
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render single question format (legacy)
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pergunta Verdadeiro/Falso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="statement">Afirmação</Label>
            <Textarea
              id="statement"
              value={content.statement || ''}
              onChange={(e) => handleSingleStatementChange(e.target.value)}
              placeholder="Digite a afirmação que será avaliada..."
              className="mt-2"
              rows={3}
            />
          </div>

          <div>
            <Label>Resposta Correta</Label>
            <RadioGroup
              value={content.isTrue ? 'true' : 'false'}
              onValueChange={(value) => handleSingleAnswerChange(value === 'true')}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true">Verdadeiro</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false">Falso</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="explanation">Explicação</Label>
            <Textarea
              id="explanation"
              value={content.explanation || ''}
              onChange={(e) => handleSingleExplanationChange(e.target.value)}
              placeholder="Explique por que a resposta está correta ou incorreta..."
              className="mt-2"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Esta explicação será mostrada após o aluno responder
            </p>
          </div>
        </CardContent>
      </Card>

      {content.statement && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="font-medium mb-3">{content.statement}</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
                  <span>Verdadeiro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
                  <span>Falso</span>
                </div>
              </div>
              {content.explanation && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <p className="text-sm font-medium text-gray-600 mb-1">Explicação:</p>
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

export default TrueFalsePageEditor;