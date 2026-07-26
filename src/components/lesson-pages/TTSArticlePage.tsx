import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Loader2, Turtle } from "lucide-react";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import LessonNavigation from "./LessonNavigation";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { updateLessonPageAudioUrl } from "@/utils/lessonUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { renderTextWithAnswers } from "@/utils/textHighlightingUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTeacherMode } from "@/contexts/TeacherModeContext";
import { getDisplayImageUrl } from "@/utils/imageOptimization";
import OptimizedImg from "@/components/common/OptimizedImg";
import ArticleVideoPlayer from "./ArticleVideoPlayer";

interface TTSArticlePageProps {
  title: string;
  imageUrl: string;
  videoUrl?: string;
  displayText: string;
  audioText: string;
  audioUrl?: string;
  pageIndex: number;
  onNext?: () => void;
  onPrevious?: () => void;
  isFirstPage: boolean;
  isLastPage: boolean;
  pageNumber: number;
  totalPages: number;
  onComplete?: () => void;
  hasCompletedLesson: boolean;
  isAuthenticated: boolean;
  lessonData?: any;
  selectedDifficulty?: string;
  returnPath?: string;
  lessonId?: string;
  onAudioGenerated?: (pageIndex: number, newAudioUrl: string) => void;
  onImageGenerated?: (pageIndex: number, newImageUrl: string) => void;
  cropPosition?: number;
  pnlConsultationLessonId?: string;
}

const TTSArticlePage: React.FC<TTSArticlePageProps> = ({ 
  title, 
  imageUrl, 
  videoUrl,
  displayText,
  audioText,
  audioUrl,
  pageIndex,
  onNext,
  onPrevious,
  isFirstPage,
  isLastPage,
  pageNumber,
  totalPages,
  onComplete,
  hasCompletedLesson,
  isAuthenticated,
  lessonData,
  selectedDifficulty,
  returnPath,
  lessonId,
  onAudioGenerated,
  onImageGenerated,
  cropPosition = 50,
  pnlConsultationLessonId
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { isFontLarge, isTeacherMode } = useTeacherMode();
  const { isPlaying, isLoadingAudio, handleSpeakMessage } = useTextToSpeech();
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingStoredAudio, setIsPlayingStoredAudio] = useState(false);
  const [isPlayingSlowAudio, setIsPlayingSlowAudio] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const slowAudioRef = useRef<HTMLAudioElement | null>(null);

  // Enhanced cleanup function
  const cleanupAudioElements = () => {
    console.log('TTSArticlePage - Cleaning up audio elements');
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('ended', () => {});
      audioRef.current.removeEventListener('pause', () => {});
      audioRef.current.removeEventListener('play', () => {});
      audioRef.current.src = '';
      audioRef.current = null;
    }
    
    if (slowAudioRef.current) {
      slowAudioRef.current.pause();
      slowAudioRef.current.removeEventListener('ended', () => {});
      slowAudioRef.current.removeEventListener('pause', () => {});
      slowAudioRef.current.removeEventListener('play', () => {});
      slowAudioRef.current.src = '';
      slowAudioRef.current = null;
    }
    
    setIsPlayingStoredAudio(false);
    setIsPlayingSlowAudio(false);
  };

  // Reset state when page changes with enhanced cleanup
  useEffect(() => {
    console.log('TTSArticlePage - Page changed, resetting state for pageIndex:', pageIndex);
    setIsPageLoading(true);
    setGeneratedAudioUrl(null);
    
    // Clean up existing audio elements
    cleanupAudioElements();

    // Set a small delay to show loading state
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 300);

    return () => {
      clearTimeout(timer);
      cleanupAudioElements();
    };
  }, [pageIndex]);

  // Determine the final URLs to use
  const finalAudioUrl = generatedAudioUrl || (audioUrl && audioUrl !== 'generate' ? audioUrl : null);
  const isCurrentlyPlaying = isPlaying[pageIndex] || isPlayingStoredAudio;
  const isCurrentlyLoading = isLoadingAudio[pageIndex];

  // Handle existing audio URL when component loads or props change
  useEffect(() => {
    if (!isPageLoading && audioUrl && audioUrl !== 'generate' && !generatedAudioUrl) {
      console.log('TTSArticlePage - Loading existing audio URL:', audioUrl);
      setGeneratedAudioUrl(audioUrl);
    }
  }, [audioUrl, generatedAudioUrl, isPageLoading]);

  // Initialize audio elements with better event handling
  useEffect(() => {
    if (!isPageLoading && finalAudioUrl) {
      console.log('TTSArticlePage - Initializing audio elements for URL:', finalAudioUrl);
      
      // Regular audio element
      if (!audioRef.current) {
        audioRef.current = new Audio(finalAudioUrl);
        
        const handleAudioEnded = () => {
          console.log('Regular audio ended');
          setIsPlayingStoredAudio(false);
        };
        
        const handleAudioPause = () => {
          console.log('Regular audio paused');
          setIsPlayingStoredAudio(false);
        };
        
        const handleAudioPlay = () => {
          console.log('Regular audio started playing');
          setIsPlayingStoredAudio(true);
          // Stop slow audio if playing
          if (slowAudioRef.current && isPlayingSlowAudio) {
            slowAudioRef.current.pause();
            setIsPlayingSlowAudio(false);
          }
        };
        
        audioRef.current.addEventListener('ended', handleAudioEnded);
        audioRef.current.addEventListener('pause', handleAudioPause);
        audioRef.current.addEventListener('play', handleAudioPlay);
      }
      
      // Slow audio element
      if (!slowAudioRef.current) {
        slowAudioRef.current = new Audio(finalAudioUrl);
        slowAudioRef.current.playbackRate = 0.5;
        
        const handleSlowAudioEnded = () => {
          console.log('Slow audio ended');
          setIsPlayingSlowAudio(false);
        };
        
        const handleSlowAudioPause = () => {
          console.log('Slow audio paused');
          setIsPlayingSlowAudio(false);
        };
        
        const handleSlowAudioPlay = () => {
          console.log('Slow audio started playing');
          setIsPlayingSlowAudio(true);
          // Stop regular audio if playing
          if (audioRef.current && isPlayingStoredAudio) {
            audioRef.current.pause();
            setIsPlayingStoredAudio(false);
          }
        };
        
        slowAudioRef.current.addEventListener('ended', handleSlowAudioEnded);
        slowAudioRef.current.addEventListener('pause', handleSlowAudioPause);
        slowAudioRef.current.addEventListener('play', handleSlowAudioPlay);
      }
      
      // Update audio sources if URL changes
      if (audioRef.current && audioRef.current.src !== finalAudioUrl) {
        audioRef.current.src = finalAudioUrl;
      }
      if (slowAudioRef.current && slowAudioRef.current.src !== finalAudioUrl) {
        slowAudioRef.current.src = finalAudioUrl;
        slowAudioRef.current.playbackRate = 0.5;
      }
    }

    return cleanupAudioElements;
  }, [finalAudioUrl, isPageLoading]);

  const handleGenerateAudio = async () => {
    if (!lessonId) {
      toast({ title: "Erro: ID da lição não encontrado.", variant: "destructive" });
      return;
    }

    if (!isAuthenticated) {
      toast({ title: "Erro: Usuário não autenticado.", variant: "destructive" });
      return;
    }
    
    setIsGeneratingAudio(true);
    try {
      console.log('Generating audio for text:', audioText);
      
      // Use Supabase client's invoke method which handles authentication automatically
      const { data, error } = await supabase.functions.invoke('speak-elevenlabs', {
        body: { text: audioText }
      });
      
      console.log('Edge function response:', { data, error });
      
      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Falha ao gerar áudio: ${error.message || 'Erro desconhecido'}`);
      }
      
      if (!data || !data.audioContent) {
        throw new Error("Resposta inválida do serviço de áudio");
      }

      // Convert base64 to blob
      console.log('Converting base64 audio to blob...');
      const audioBlob = new Blob([
        Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))
      ], { type: 'audio/mpeg' });

      console.log('Audio blob created:', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      if (audioBlob.size === 0) {
        throw new Error("Áudio gerado está vazio");
      }

      // Upload to Supabase Storage with a unique name
      const filePath = `lesson-audio/${lessonId}/${pageIndex}-${new Date().getTime()}.mp3`;
      console.log('Uploading audio to Supabase storage at path:', filePath);
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('lesson_audio')
        .upload(filePath, audioBlob, {
          cacheControl: '3600',
          upsert: false,
        });

      console.log('Upload result:', { uploadError, uploadData });

      if (uploadError) {
        console.error('Audio upload error:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('lesson_audio')
        .getPublicUrl(filePath);

      const newAudioUrl = urlData.publicUrl;
      console.log('Generated audio URL:', newAudioUrl);

      // Update the database
      console.log('Updating database with audio URL...');
      const success = await updateLessonPageAudioUrl(lessonId, pageIndex, newAudioUrl);
      if (!success) {
        throw new Error("Falha ao atualizar a lição no banco de dados.");
      }
      
      // Update local state and parent state
      setGeneratedAudioUrl(newAudioUrl);
      onAudioGenerated?.(pageIndex, newAudioUrl);
      
      console.log('Audio generation completed successfully');
      toast({ title: "Áudio gerado com sucesso!" });

    } catch (error) {
      console.error("Erro completo ao gerar áudio:", error);
      
      let errorMessage = "Ocorreu um erro desconhecido.";
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as any).message);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({ 
        title: "Erro ao gerar áudio", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleAudioToggle = async () => {
    console.log('TTSArticlePage - Audio toggle requested');
    
    // If we have a stored audio URL, use the HTML audio element
    if (finalAudioUrl && audioRef.current) {
      if (isPlayingStoredAudio) {
        console.log('Pausing stored audio');
        audioRef.current.pause();
        setIsPlayingStoredAudio(false);
      } else {
        try {
          // Stop slow audio if playing
          if (slowAudioRef.current && isPlayingSlowAudio) {
            slowAudioRef.current.pause();
            setIsPlayingSlowAudio(false);
          }
          console.log('Playing stored audio');
          await audioRef.current.play();
          setIsPlayingStoredAudio(true);
        } catch (error) {
          console.error('Error playing stored audio:', error);
          // Fallback to TTS if stored audio fails
          handleSpeakMessage(pageIndex, audioText);
        }
      }
    } else {
      // Use TTS for real-time generation
      console.log('Using TTS for audio playback');
      handleSpeakMessage(pageIndex, audioText);
    }
  };

  const handleSlowAudioToggle = async () => {
    if (!finalAudioUrl || !slowAudioRef.current) return;
    
    console.log('TTSArticlePage - Slow audio toggle requested');
    
    if (isPlayingSlowAudio) {
      console.log('Pausing slow audio');
      slowAudioRef.current.pause();
      setIsPlayingSlowAudio(false);
    } else {
      try {
        // Stop regular audio if playing
        if (audioRef.current && isPlayingStoredAudio) {
          audioRef.current.pause();
          setIsPlayingStoredAudio(false);
        }
        console.log('Playing slow audio');
        await slowAudioRef.current.play();
        setIsPlayingSlowAudio(true);
      } catch (error) {
        console.error('Error playing slow audio:', error);
        toast({
          title: "Erro",
          description: "Não foi possível reproduzir o áudio lento.",
          variant: "destructive",
        });
      }
    }
  };

  // Updated logic for determining when to show generate buttons
  const shouldShowGenerateAudioButton = !finalAudioUrl && !isGeneratingAudio;

  console.log('TTSArticlePage render state:', {
    pageIndex,
    isPageLoading,
    audioUrl,
    generatedAudioUrl,
    finalAudioUrl,
    shouldShowGenerateAudioButton,
    isGeneratingAudio,
    isPlayingStoredAudio,
    isPlayingSlowAudio
  });

  // Show loading screen while page is transitioning
  if (isPageLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="overflow-y-auto h-full bg-white pb-24">
          <article className="max-w-[680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            {/* Title Skeleton */}
            <header className="mb-8 sm:mb-12">
              <Skeleton className="h-12 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/2" />
            </header>

            {/* Image Skeleton - Only if imageUrl exists and is not 'generate' */}
            {imageUrl && imageUrl !== 'generate' && (
              <figure className="mb-8 sm:mb-12">
                <Skeleton className="w-full h-64 rounded-lg" />
              </figure>
            )}

            {/* Audio Control Skeleton */}
            <div className="mb-8 sm:mb-12 flex justify-center">
              <Skeleton className="h-12 w-32" />
            </div>

            {/* Text Skeleton */}
            <div className="prose prose-lg max-w-none space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6" />
            </div>
          </article>
        </div>

        <LessonNavigation
          onNext={onNext}
          onPrevious={onPrevious}
          isFirstPage={isFirstPage}
          isLastPage={isLastPage}
          pageNumber={pageNumber}
          totalPages={totalPages}
          onComplete={onComplete}
          hasCompletedLesson={hasCompletedLesson}
          isAuthenticated={isAuthenticated}
          lessonData={lessonData}
          selectedDifficulty={selectedDifficulty}
          currentPageIndex={pageIndex}
          returnPath={returnPath}
          pnlConsultationLessonId={pnlConsultationLessonId}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      
      {/* Scrollable Content Container */}
      <div className="overflow-y-auto h-full bg-white pb-24">
        {/* Article Container */}
        <article className="max-w-[680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          {/* Title */}
          <header className="mb-8 sm:mb-12">
            <h1 className="text-[32px] sm:text-[42px] leading-[1.2] font-serif text-gray-900 mb-6 sm:mb-8">
              {title}
            </h1>
          </header>

          {/* Video Player - Show if videoUrl is provided */}
          {videoUrl && (
            <figure className="mb-8 sm:mb-12">
              <ArticleVideoPlayer videoUrl={videoUrl} title={title} />
            </figure>
          )}

          {/* Featured Image - Only show if no video and imageUrl is provided */}
          {!videoUrl && imageUrl && imageUrl !== 'generate' && (
            <figure className="mb-8 sm:mb-12">
              <img
                src={getDisplayImageUrl(imageUrl)}
                alt={title}
                className={`w-full h-auto ${
                  isMobile
                    ? 'object-contain'
                    : displayText 
                    ? 'max-h-[300px] md:max-h-[400px] object-cover' 
                    : 'object-contain'
                } rounded-lg shadow-sm`}
                style={
                  !isMobile && displayText
                    ? { objectPosition: `center ${cropPosition}%` }
                    : undefined
                }
                loading="lazy"
              />
            </figure>
          )}

          {/* Audio Control - Hidden when video is present */}
          {!videoUrl && (
            <div className="mb-8 sm:mb-12 flex justify-center">
              {shouldShowGenerateAudioButton ? (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleGenerateAudio}
                  disabled={isGeneratingAudio}
                  className="flex items-center gap-3 px-6 py-3 text-base font-medium border-2 hover:bg-gray-50 transition-colors"
                >
                  {isGeneratingAudio ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                  {isGeneratingAudio ? "Gerando Áudio..." : "Gerar Áudio"}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleAudioToggle}
                    disabled={isCurrentlyLoading}
                    className="flex items-center gap-3 px-6 py-3 text-base font-medium border-2 hover:bg-gray-50 transition-colors"
                  >
                    {isCurrentlyLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isCurrentlyPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                    {isCurrentlyLoading 
                      ? "Loading Audio..." 
                      : isCurrentlyPlaying 
                      ? "Pause Audio" 
                      : "Play Audio"}
                  </Button>
                  
                  {/* Slow Play Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSlowAudioToggle}
                    disabled={isCurrentlyLoading}
                    className="h-11 w-11 border-2 hover:bg-gray-50 transition-colors"
                    title="Play at slower speed"
                  >
                    {isPlayingSlowAudio ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Turtle className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Article Text */}
          <div className="prose prose-lg max-w-none">
            <div 
              className={`text-[18px] sm:text-[20px] leading-[1.6] font-serif text-gray-800 whitespace-pre-line ${
                isTeacherMode && isFontLarge ? 'text-[32px] sm:text-[36px]' : ''
              }`}
            >
              {renderTextWithAnswers(displayText)}
            </div>
          </div>
        </article>
      </div>

      <LessonNavigation
        onNext={onNext}
        onPrevious={onPrevious}
        isFirstPage={isFirstPage}
        isLastPage={isLastPage}
        pageNumber={pageNumber}
        totalPages={totalPages}
        onComplete={onComplete}
        hasCompletedLesson={hasCompletedLesson}
        isAuthenticated={isAuthenticated}
        lessonData={lessonData}
        selectedDifficulty={selectedDifficulty}
        currentPageIndex={pageIndex}
        returnPath={returnPath}
        onHighlightModeChange={setIsHighlightMode}
        pnlConsultationLessonId={pnlConsultationLessonId}
      />
    </div>
  );
};

export default TTSArticlePage;
