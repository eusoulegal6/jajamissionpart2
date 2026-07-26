import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Play, Pause } from 'lucide-react';
import { useLessonAudio } from '@/hooks/use-lesson-audio';
import { useScoringContext } from '@/contexts/ScoringContext';
import { useTeacherMode } from '@/contexts/TeacherModeContext';

interface AudioMultipleChoicePageProps {
  question: string;
  audioUrl: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  pageIndex?: number;
  questionIndex?: number;
}

const AudioMultipleChoicePage: React.FC<AudioMultipleChoicePageProps> = ({
  question,
  audioUrl,
  options,
  correctAnswer,
  explanation,
  pageIndex = 0,
  questionIndex = 0
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const { isFontLarge, isTeacherMode } = useTeacherMode();
  const { audioState, playAudio, pauseAudio, isAudioPlaying } = useLessonAudio();
  const { addResult } = useScoringContext();

  // Reset state when question or audioUrl changes (new page)
  useEffect(() => {
    setSelectedOption(null);
    setShowResult(false);
  }, [question, audioUrl, options]);

  const handleSubmit = () => {
    if (selectedOption !== null) {
      setShowResult(true);
      // Report result to scoring system
      const isCorrect = selectedOption === correctAnswer;
      addResult(questionIndex, isCorrect, pageIndex, 'audioMultipleChoice');
    }
  };


  const handleAudioToggle = () => {
    if (isAudioPlaying(audioUrl)) {
      pauseAudio();
    } else {
      playAudio(audioUrl, 0);
    }
  };

  const isCorrect = selectedOption === correctAnswer;
  const isCurrentAudioPlaying = isAudioPlaying(audioUrl);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 pb-24 sm:pb-32">
      <div className="w-full max-w-4xl mx-auto space-y-6 lg:space-y-8">
        <Card className="shadow-lg">
          <CardContent className="p-6 sm:p-8 lg:p-10">
            {/* Audio Controls */}
            <div className="mb-8 lg:mb-10 p-6 lg:p-8 bg-muted/20 rounded-lg border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                  Áudio da Pergunta
                </h3>
                <Button
                  onClick={handleAudioToggle}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-3 px-6 py-3 text-base lg:text-lg font-medium min-w-[140px]"
                >
                  {isCurrentAudioPlaying ? (
                    <>
                      <Pause className="h-5 w-5 lg:h-6 lg:w-6" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 lg:h-6 lg:w-6" />
                      Reproduzir
                    </>
                  )}
                </Button>
              </div>
              {audioState.isPlaying && audioState.currentAudioUrl === audioUrl && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-base lg:text-lg text-muted-foreground font-medium">
                    Reproduzindo áudio...
                  </span>
                </div>
              )}
            </div>

            <h2 className={`text-xl sm:text-2xl lg:text-4xl font-semibold mb-6 lg:mb-8 text-gray-900 leading-relaxed ${
              isTeacherMode && isFontLarge ? 'text-3xl sm:text-4xl lg:text-5xl' : ''
            }`}>
              {question}
            </h2>

            <RadioGroup
              value={selectedOption !== null ? selectedOption.toString() : ""}
              onValueChange={(value) => setSelectedOption(parseInt(value))}
              disabled={showResult}
              className="space-y-4 lg:space-y-6"
            >
              {options.map((option, index) => (
                <div 
                  key={index} 
                  className={`flex items-start space-x-3 lg:space-x-4 p-4 lg:p-5 rounded-lg border-2 transition-all duration-200 ${
                    showResult ? (
                      index === correctAnswer ? 'border-green-500 bg-green-50' :
                      index === selectedOption ? 'border-red-500 bg-red-50' : 
                      'border-gray-200 bg-gray-50'
                    ) : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                  }`}
                >
                  <RadioGroupItem 
                    value={index.toString()} 
                    id={`option-${index}`}
                    className={`mt-1 h-5 w-5 lg:h-6 lg:w-6 ${
                      showResult ? (
                        index === correctAnswer ? 'border-green-500 text-green-600' :
                        index === selectedOption ? 'border-red-500 text-red-600' : ''
                      ) : ''
                    }`}
                  />
                  <Label 
                    htmlFor={`option-${index}`}
                    className={`flex-1 cursor-pointer text-base lg:text-xl leading-relaxed ${
                      isTeacherMode && isFontLarge ? 'text-2xl lg:text-3xl' : ''
                    } ${
                      showResult ? (
                        index === correctAnswer ? 'text-green-700 font-medium' :
                        index === selectedOption ? 'text-red-700' : 'text-gray-600'
                      ) : 'text-gray-900'
                    }`}
                  >
                    <span className="font-semibold text-gray-600 mr-3">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                    {showResult && index === correctAnswer && (
                      <CheckCircle className="inline ml-3 h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
                    )}
                    {showResult && index === selectedOption && !isCorrect && (
                      <XCircle className="inline ml-3 h-5 w-5 lg:h-6 lg:w-6 text-red-600" />
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {!showResult && (
              <div className="mt-8 lg:mt-10 flex justify-center">
                <Button 
                  onClick={handleSubmit}
                  disabled={selectedOption === null}
                  size="lg"
                  className="px-8 py-3 text-lg lg:text-xl font-medium min-w-[140px]"
                >
                  Responder
                </Button>
              </div>
            )}

            {showResult && (
              <div className="mt-8 lg:mt-10 space-y-6">
                <div className={`p-6 lg:p-8 rounded-lg border-2 ${
                  isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    {isCorrect ? (
                      <CheckCircle className="h-6 w-6 lg:h-7 lg:w-7 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 lg:h-7 lg:w-7 text-red-600" />
                    )}
                    <span className={`text-lg lg:text-xl font-semibold ${
                      isCorrect ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {isCorrect ? 'Correto!' : 'Incorreto'}
                    </span>
                  </div>
                  {!isCorrect && (
                    <p className="text-base lg:text-xl text-gray-700 leading-relaxed">
                      A resposta correta é: <strong>{String.fromCharCode(65 + correctAnswer)}. {options[correctAnswer]}</strong>
                    </p>
                  )}
                </div>

                {explanation && (
                  <div className="p-6 lg:p-8 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <h4 className="text-lg lg:text-xl font-semibold text-blue-800 mb-3">
                      Explicação:
                    </h4>
                    <p className="text-base lg:text-xl text-blue-700 leading-relaxed">
                      {explanation}
                    </p>
                  </div>
                )}

              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AudioMultipleChoicePage;