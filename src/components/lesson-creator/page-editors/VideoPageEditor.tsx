import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Upload, Plus, Trash2, Play, Pause, Clock, SkipBack, SkipForward } from 'lucide-react';

interface VideoPageEditorProps {
  content: any;
  onChange: (content: any) => void;
}

const VideoPageEditor: React.FC<VideoPageEditorProps> = ({ content, onChange }) => {
  const [hasQuiz, setHasQuiz] = useState(content.questions?.length > 0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showVideoPreview, setShowVideoPreview] = useState(false);

  const isBunnyUrl = (url: string) =>
    /iframe\.mediadelivery\.net|mediadelivery\.net\/(embed|play)\/|video\.bunnycdn\.com\/(play|embed)\//i.test(url);

  const normalizeBunnyUrl = (url: string) =>
    url.replace(/\/play\//, '/embed/').replace(/^https?:\/\/video\.bunnycdn\.com/i, 'https://iframe.mediadelivery.net');

  const handleVideoUrlChange = (url: string) => {
    onChange({ ...content, videoUrl: url });
    // Show preview when URL is added
    if (url && (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || isBunnyUrl(url))) {
      setShowVideoPreview(true);
    } else {
      setShowVideoPreview(false);
    }
  };


  const handleTranscriptChange = (transcript: string) => {
    onChange({ ...content, transcript });
  };

  const addQuestion = () => {
    const newQuestion = {
      id: `q_${Date.now()}`,
      timestamp_seconds: Math.floor(currentTime),
      question: '',
      correct_answers: [''],
      visible: true
    };
    
    const questions = content.questions || [];
    onChange({ ...content, questions: [...questions, newQuestion] });
  };

  const addQuestionAtCurrentTime = () => {
    if (videoRef.current) {
      const currentVideoTime = Math.floor(videoRef.current.currentTime);
      const newQuestion = {
        id: `q_${Date.now()}`,
        timestamp_seconds: currentVideoTime,
        question: '',
        correct_answers: [''],
        visible: true
      };
      
      const questions = content.questions || [];
      onChange({ ...content, questions: [...questions, newQuestion] });
    }
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const questions = [...(content.questions || [])];
    questions[index] = { ...questions[index], [field]: value };
    onChange({ ...content, questions });
  };

  const removeQuestion = (index: number) => {
    const questions = [...(content.questions || [])];
    questions.splice(index, 1);
    onChange({ ...content, questions });
  };

  const toggleQuiz = (enabled: boolean) => {
    setHasQuiz(enabled);
    if (!enabled) {
      onChange({ ...content, questions: [] });
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const seekVideo = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Vídeo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="videoUrl">URL do Vídeo</Label>
            <Input
              id="videoUrl"
              value={content.videoUrl || ''}
              onChange={(e) => handleVideoUrlChange(e.target.value)}
              placeholder="https://..."
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Suporte para YouTube, Vimeo, Bunny Stream (iframe.mediadelivery.net) ou links diretos de vídeo
            </p>

          </div>

          <div>
            <Label htmlFor="transcript">Transcrição (Opcional)</Label>
            <Textarea
              id="transcript"
              value={content.transcript || ''}
              onChange={(e) => handleTranscriptChange(e.target.value)}
              placeholder="Transcrição do vídeo..."
              className="mt-2"
              rows={4}
            />
          </div>

          {showVideoPreview && content.videoUrl && isBunnyUrl(content.videoUrl) && (
            <div className="mt-4 border rounded-lg p-4 bg-gray-50">
              <Label className="text-sm font-medium mb-2 block">Preview do Vídeo (Bunny Stream)</Label>
              <div className="aspect-video w-full max-w-md rounded-lg overflow-hidden bg-black">
                <iframe
                  src={normalizeBunnyUrl(content.videoUrl)}
                  className="w-full h-full"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {showVideoPreview && content.videoUrl && !isBunnyUrl(content.videoUrl) && (
            <div className="mt-4 border rounded-lg p-4 bg-gray-50">
              <Label className="text-sm font-medium mb-2 block">Preview do Vídeo</Label>
              <div className="space-y-3">
                <video
                  ref={videoRef}
                  src={content.videoUrl}
                  className="w-full max-w-md rounded-lg"
                  preload="metadata"
                  playsInline
                  webkit-playsinline="true"
                  x5-playsinline="true"
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  controls={false}
                />

                <div className="flex flex-col gap-3">
                  {/* Video controls */}
                  <div className="flex items-center justify-center gap-2">
                    {/* Rewind buttons */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => seekVideo(-20)}
                      title="Voltar 20 segundos"
                      className="text-xs"
                    >
                      <SkipBack className="h-3 w-3 mr-1" />
                      20s
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => seekVideo(-10)}
                      title="Voltar 10 segundos"
                      className="text-xs"
                    >
                      <SkipBack className="h-3 w-3 mr-1" />
                      10s
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => seekVideo(-1)}
                      title="Voltar 1 segundo"
                      className="text-xs"
                    >
                      <SkipBack className="h-3 w-3 mr-1" />
                      1s
                    </Button>
                    
                    {/* Play/Pause button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePlay}
                      className="px-4"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    
                    {/* Forward buttons */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => seekVideo(1)}
                      title="Avançar 1 segundo"
                      className="text-xs"
                    >
                      1s
                      <SkipForward className="h-3 w-3 ml-1" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => seekVideo(10)}
                      title="Avançar 10 segundos"
                      className="text-xs"
                    >
                      10s
                      <SkipForward className="h-3 w-3 ml-1" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => seekVideo(20)}
                      title="Avançar 20 segundos"
                      className="text-xs"
                    >
                      20s
                      <SkipForward className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                  
                  {/* Time display and add question button */}
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(currentTime)}
                    </span>
                    {hasQuiz && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={addQuestionAtCurrentTime}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Pergunta
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="hasQuiz"
              checked={hasQuiz}
              onCheckedChange={toggleQuiz}
            />
            <Label htmlFor="hasQuiz">Adicionar quiz durante o vídeo</Label>
          </div>
        </CardContent>
      </Card>

      {hasQuiz && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Perguntas do Quiz</CardTitle>
              <div className="flex gap-2">
                <Button onClick={addQuestion} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Pergunta Manual
                </Button>
                {showVideoPreview && (
                  <Button onClick={addQuestionAtCurrentTime} size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    No Tempo Atual
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {content.questions?.length > 0 ? (
              <div className="space-y-4">
                {[...content.questions]
                  .sort((a, b) => (b.timestamp_seconds || 0) - (a.timestamp_seconds || 0))
                  .map((question: any, sortedIndex: number) => {
                    // Find the original index for the onChange handler
                    const originalIndex = content.questions.findIndex((q: any) => q.id === question.id);
                    return (
                      <Card key={question.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                             <div className="flex justify-between items-start">
                               <div className="flex-1 space-y-3 mr-4">
                                 <div className="flex items-center gap-3">
                                   <div className="flex-1">
                                     <Label>Timestamp (segundos)</Label>
                                     <Input
                                       type="number"
                                       value={question.timestamp_seconds}
                                       onChange={(e) => updateQuestion(originalIndex, 'timestamp_seconds', parseInt(e.target.value) || 0)}
                                       className="mt-1"
                                       min="0"
                                     />
                                   </div>
                                   <div className="text-sm text-muted-foreground pt-6">
                                     {formatTime(question.timestamp_seconds)}
                                   </div>
                                 </div>

                                 <div className="flex items-center space-x-2">
                                   <Switch
                                     id={`visible-${originalIndex}`}
                                     checked={question.visible !== false}
                                     onCheckedChange={(checked) => updateQuestion(originalIndex, 'visible', checked)}
                                   />
                                   <Label htmlFor={`visible-${originalIndex}`}>Pergunta visível</Label>
                                 </div>
                                
                                <div>
                                  <Label>Pergunta</Label>
                                  <Input
                                    value={question.question}
                                    onChange={(e) => updateQuestion(originalIndex, 'question', e.target.value)}
                                    placeholder="Digite a pergunta..."
                                    className="mt-1"
                                  />
                                </div>
                                
                                <div>
                                  <Label>Respostas Corretas</Label>
                                  {question.correct_answers.map((answer: string, answerIndex: number) => (
                                    <div key={answerIndex} className="flex gap-2 mt-1">
                                      <Input
                                        value={answer}
                                        onChange={(e) => {
                                          const newAnswers = [...question.correct_answers];
                                          newAnswers[answerIndex] = e.target.value;
                                          updateQuestion(originalIndex, 'correct_answers', newAnswers);
                                        }}
                                        placeholder="Resposta correta..."
                                      />
                                      {question.correct_answers.length > 1 && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const newAnswers = [...question.correct_answers];
                                            newAnswers.splice(answerIndex, 1);
                                            updateQuestion(originalIndex, 'correct_answers', newAnswers);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newAnswers = [...question.correct_answers, ''];
                                      updateQuestion(originalIndex, 'correct_answers', newAnswers);
                                    }}
                                    className="mt-2"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar Resposta
                                  </Button>
                                </div>
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeQuestion(originalIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma pergunta adicionada ainda
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoPageEditor;