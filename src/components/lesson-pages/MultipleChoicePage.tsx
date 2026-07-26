import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useScoringContext } from '@/contexts/ScoringContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTeacherMode } from '@/contexts/TeacherModeContext';
import { getDisplayImageUrl } from '@/utils/imageOptimization';
import OptimizedImg from '@/components/common/OptimizedImg';
import BunnyStreamPlayer, { isBunnyStreamUrl } from './BunnyStreamPlayer';
import { hasIPhoneUnsupportedVideoExtension, isIOSLikeDevice, sanitizeVideoUrl } from '@/utils/videoCompatibility';

interface MultipleChoicePageProps {
  question: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  options: string[];
  correctAnswer: number;
  explanation?: string;
  pageIndex?: number;
  questionIndex?: number;
}

const MultipleChoicePage: React.FC<MultipleChoicePageProps> = ({
  question,
  imageUrl,
  videoUrl,
  mediaType = 'image',
  options,
  correctAnswer,
  explanation,
  pageIndex = 0,
  questionIndex = 0
}) => {
  const isMobile = useIsMobile();
  const { isFontLarge, isTeacherMode } = useTeacherMode();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const { addResult } = useScoringContext();

  // Reset state when question changes (new page)
  useEffect(() => {
    setSelectedOption(null);
    setShowResult(false);
  }, [question, options]);

  // Reset image state when imageUrl prop changes
  useEffect(() => {
    if (imageUrl) {
      if (currentImageUrl !== imageUrl) {
        setImageLoaded(false);
        setCurrentImageUrl(imageUrl);
      }
    } else {
      setCurrentImageUrl(null);
      setImageLoaded(false);
    }
  }, [imageUrl, currentImageUrl]);

  const handleSubmit = () => {
    if (selectedOption !== null) {
      setShowResult(true);
      // Report result to scoring system
      const isCorrect = selectedOption === correctAnswer;
      console.log('📊 MultipleChoice - Adding result:', {
        questionIndex,
        isCorrect,
        pageIndex,
        pageType: 'multipleChoice',
        selectedOption,
        correctAnswer
      });
      addResult(questionIndex, isCorrect, pageIndex, 'multipleChoice');
    }
  };

  const isCorrect = selectedOption === correctAnswer;
  const sanitizedVideoUrl = videoUrl ? sanitizeVideoUrl(videoUrl) : '';
  const hasUnsupportedIPhoneFormat = isIOSLikeDevice() && sanitizedVideoUrl && hasIPhoneUnsupportedVideoExtension(sanitizedVideoUrl);

  // Helper to convert YouTube URL to embed format
  const getYouTubeEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtube.com/embed/')) {
      return url;
    }
    return url;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 pb-20 sm:pb-24">
      <div className="w-full max-w-4xl mx-auto space-y-6 lg:space-y-8">
        <Card className="shadow-lg">
          <CardContent className="p-6 sm:p-8 lg:p-10">
            {/* Image Media */}
            {(mediaType === 'image' || (!mediaType && !videoUrl)) && currentImageUrl && (
              <div className="mb-8 lg:mb-10 relative min-h-[200px] sm:min-h-[300px]">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                )}
                <img 
                  src={getDisplayImageUrl(currentImageUrl)} 
                  alt="Question"
                  className={`w-full ${
                    isMobile
                      ? 'object-contain'
                      : (
                          currentImageUrl && imageUrl && imageUrl.includes('fullImage=true')
                            ? ''
                            : currentImageUrl && imageUrl && imageUrl.includes('fitImage=true')
                            ? 'max-h-[220px] md:max-h-[300px] object-contain'
                            : 'max-h-[220px] md:max-h-[300px] object-cover object-top'
                        )
                  } rounded-lg shadow-md transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageLoaded(true)}
                />
              </div>
            )}

            {/* Video Media */}
            {(mediaType === 'video' || (!mediaType && videoUrl)) && videoUrl && (
              <div className="mb-8 lg:mb-10 aspect-video rounded-lg overflow-hidden shadow-md">
                {isBunnyStreamUrl(sanitizedVideoUrl) ? (
                  <BunnyStreamPlayer videoUrl={sanitizedVideoUrl} aspectVideo={false} className="!rounded-none w-full h-full" />
                ) : sanitizedVideoUrl.includes('youtube.com') || sanitizedVideoUrl.includes('youtu.be') ? (
                  <iframe
                    src={getYouTubeEmbedUrl(sanitizedVideoUrl)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : hasUnsupportedIPhoneFormat ? (
                  <div className="w-full h-full bg-black flex items-center justify-center p-4 text-center text-white">
                    Este formato de vídeo não é compatível com iPhone. Use MP4/H.264.
                  </div>
                ) : (
                  <video
                    src={sanitizedVideoUrl}
                    controls
                    preload="metadata"
                    playsInline
                    webkit-playsinline="true"
                    x5-playsinline="true"
                    className="w-full h-full"
                  />
                )}
              </div>
            )}
            
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
                  onClick={() => !showResult && setSelectedOption(index)}
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
                    className={`flex-1 cursor-pointer leading-relaxed ${
                      isTeacherMode && isFontLarge ? 'text-2xl lg:text-3xl' : 'text-base lg:text-xl'
                    } ${
                      showResult ? (
                        index === correctAnswer ? 'text-green-700 font-medium' :
                        index === selectedOption && !isCorrect ? 'text-red-700' : 'text-gray-700'
                      ) : 'text-gray-800'
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

export default MultipleChoicePage;