
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Loader2 } from "lucide-react";
import LessonNavigation from "./LessonNavigation";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { updateLessonPageAudioUrl } from "@/utils/lessonUtils";
import { base64ToAudioBlob } from "@/utils/base64Utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { renderTextWithAnswers } from "@/utils/textHighlightingUtils";
import { useTeacherMode } from "@/contexts/TeacherModeContext";
import { getDisplayImageUrl } from "@/utils/imageOptimization";
import OptimizedImg from "@/components/common/OptimizedImg";
import ArticleVideoPlayer from "./ArticleVideoPlayer";

interface AudioContext {
  playAudio: (audioUrl: string, pageIndex: number) => void;
  pauseAudio: () => void;
  isAudioPlaying: (audioUrl: string) => boolean;
}

interface ArticlePageProps {
  title: string;
  imageUrl: string;
  videoUrl?: string;
  audioUrl:string;
  text: string;
  pageIndex: number;
  audioContext?: AudioContext;
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
  slideMode?: boolean;
  pnlConsultationLessonId?: string;
}

const ArticlePage: React.FC<ArticlePageProps> = ({ 
  title, 
  imageUrl, 
  videoUrl,
  audioUrl, 
  text, 
  pageIndex, 
  audioContext,
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
  slideMode = false,
  pnlConsultationLessonId
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { isFontLarge, isTeacherMode } = useTeacherMode();
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [isHighlightMode, setIsHighlightMode] = useState(false);

  // Scroll to top of article container when page changes
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [pageIndex]);

  // Reset image state when imageUrl prop changes
  useEffect(() => {
    if (imageUrl && imageUrl !== 'generate') {
      if (currentImageUrl !== imageUrl) {
        setImageLoaded(false);
        setCurrentImageUrl(imageUrl);
      }
    } else {
      setCurrentImageUrl(null);
      setImageLoaded(false);
    }
  }, [imageUrl, currentImageUrl]);

  const finalAudioUrl = generatedAudioUrl || (audioUrl !== 'generate' ? audioUrl : null);
  const isPlaying = (finalAudioUrl && audioContext?.isAudioPlaying(finalAudioUrl)) || false;

  const handleAudioToggle = () => {
    if (!audioContext || !finalAudioUrl) return;
    
    if (isPlaying) {
      audioContext.pauseAudio();
    } else {
      audioContext.playAudio(finalAudioUrl, pageIndex);
    }
  };

  const handleGenerateAudio = async () => {
    console.log('ArticlePage - handleGenerateAudio called with environment:', {
      hostname: window.location.hostname,
      origin: window.location.origin,
      lessonId,
      pageIndex,
      isAuthenticated
    });
    
    if (!lessonId) {
      console.error('ArticlePage - No lessonId provided for audio generation');
      toast({ title: "Erro: ID da lição não encontrado.", variant: "destructive" });
      return;
    }

    if (!isAuthenticated) {
      console.error('ArticlePage - User not authenticated for audio generation');
      toast({ title: "Erro: Usuário não autenticado.", variant: "destructive" });
      return;
    }
    
    console.log('ArticlePage - Starting audio generation for lesson:', lessonId, 'pageIndex:', pageIndex);
    setIsGeneratingAudio(true);
    
    try {
      console.log('ArticlePage - Generating audio for text:', text.substring(0, 100) + '...');
      
      // Use Supabase client's invoke method which handles authentication automatically
      const { data, error } = await supabase.functions.invoke('speak-elevenlabs', {
        body: { text }
      });
      
      console.log('ArticlePage - Edge function response:', { data, error });
      
      if (error) {
        console.error('ArticlePage - Edge function error:', error);
        throw new Error(`Falha ao gerar áudio: ${error.message || 'Erro desconhecido'}`);
      }
      
      if (!data || !data.audioContent) {
        throw new Error("Resposta inválida do serviço de áudio");
      }

      // Convert base64 to blob using the utility function
      console.log('ArticlePage - Converting base64 audio to blob...');
      const audioBlob = base64ToAudioBlob(data.audioContent);

      console.log('ArticlePage - Audio blob created:', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      if (audioBlob.size === 0) {
        throw new Error("Áudio gerado está vazio");
      }

      // Upload to Supabase Storage with a unique name
      const filePath = `lesson-audio/${lessonId}/${pageIndex}-${new Date().getTime()}.mp3`;
      console.log('ArticlePage - Uploading audio to Supabase storage at path:', filePath);
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('lesson_audio')
        .upload(filePath, audioBlob, {
          cacheControl: '3600',
          upsert: false,
        });

      console.log('ArticlePage - Upload result:', { uploadError, uploadData });

      if (uploadError) {
        console.error('ArticlePage - Audio upload error:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('lesson_audio')
        .getPublicUrl(filePath);

      const newAudioUrl = urlData.publicUrl;
      console.log('ArticlePage - Generated audio URL:', newAudioUrl);

      // Update the database
      console.log('ArticlePage - Updating database with audio URL...');
      const success = await updateLessonPageAudioUrl(lessonId, pageIndex, newAudioUrl);
      if (!success) {
        throw new Error("Falha ao atualizar a lição no banco de dados.");
      }
      
      // Update local state and parent state
      setGeneratedAudioUrl(newAudioUrl);
      onAudioGenerated?.(pageIndex, newAudioUrl);
      
      console.log('ArticlePage - Audio generation completed successfully');
      toast({ title: "Áudio gerado com sucesso!" });

    } catch (error) {
      console.error("ArticlePage - Erro completo ao gerar áudio:", {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        environment: window.location.hostname
      });
      
      let errorMessage = "Ocorreu um erro desconhecido.";
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as any).message);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({ 
        title: "Erro ao gerar áudio", 
        description: `${errorMessage} (Ambiente: ${window.location.hostname})`, 
        variant: "destructive" 
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const showGenerateAudioButton = audioUrl === 'generate' && !generatedAudioUrl;

  return (
    <div className="flex flex-col h-full">
      
      {/* Scrollable Content Container */}
      <div ref={scrollContainerRef} className="overflow-y-auto h-full bg-white pb-24">
        {/* Article Container */}
        <article className={`max-w-[680px] mx-auto px-4 sm:px-6 lg:px-8 ${slideMode ? 'py-4 sm:py-6' : 'py-8 sm:py-12 lg:py-16'}`}>
          {/* Title - Hide in slide mode */}
          {!slideMode && (
            <header className="mb-8 sm:mb-12">
              <h1 className="text-[32px] sm:text-[42px] leading-[1.2] font-serif text-gray-900 mb-6 sm:mb-8">
                {title}
              </h1>
            </header>
          )}

          {/* Video Player - Show if videoUrl is provided */}
          {videoUrl && (
            <figure className={slideMode ? "mb-4 sm:mb-6" : "mb-8 sm:mb-12"}>
              <ArticleVideoPlayer videoUrl={videoUrl} title={title} />
            </figure>
          )}

          {/* Featured Image - Only show if no video and imageUrl is provided */}
          {!videoUrl && currentImageUrl && (
            <figure className={slideMode ? "mb-4 sm:mb-6 relative min-h-[200px] sm:min-h-[300px]" : "mb-8 sm:mb-12 relative min-h-[200px] sm:min-h-[300px]"}>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              )}
              <img
                src={getDisplayImageUrl(currentImageUrl)}
                alt={title}
                className={`w-full h-auto ${
                  isMobile 
                    ? 'object-contain'
                    : 'max-h-[360px] object-contain'
                } rounded-lg shadow-sm transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}

                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
            </figure>
          )}

          {/* Audio Control - Show above text in normal mode, below text in slide mode. Hidden when video present */}
          {!videoUrl && !slideMode && audioContext && (
            <div className="mb-8 sm:mb-12 flex justify-center items-center gap-4">
              {showGenerateAudioButton ? (
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
              ) : finalAudioUrl ? (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleAudioToggle}
                  className="flex items-center gap-3 px-6 py-3 text-base font-medium border-2 hover:bg-gray-50 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                  {isPlaying ? "Pause audio" : "Listen to audio"}
                </Button>
              ) : null}
            </div>
          )}

          {/* Article Text */}
          <div className="prose prose-lg max-w-none">
            <div 
              className={
                slideMode 
                ? "text-[28px] sm:text-[34px] md:text-[38px] leading-[1.6] font-serif text-gray-800 whitespace-pre-line"
                : `text-[18px] sm:text-[20px] leading-[1.6] font-serif text-gray-800 whitespace-pre-line ${
                    isTeacherMode && isFontLarge ? 'text-[32px] sm:text-[36px]' : ''
                  }`
              }
            >
              {renderTextWithAnswers(text)}
            </div>
          </div>

          {/* End-of-article Audio Control - Nice design, only in normal mode with audio available */}
          {!videoUrl && !slideMode && audioContext && finalAudioUrl && (
            <div className="mt-12 sm:mt-16 flex justify-center">
              <button
                onClick={handleAudioToggle}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 px-8 py-5 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <div className="relative flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-2 ring-white/30">
                    {isPlaying ? (
                      <Pause className="h-6 w-6 text-white" style={{ width: '1.5rem', height: '1.5rem' }} />
                    ) : (
                      <Play className="h-6 w-6 text-white ml-0.5" style={{ width: '1.5rem', height: '1.5rem' }} />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-semibold text-white">
                      {isPlaying ? "Pause audio" : "Listen again"}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Audio Control - Show below text in slide mode. Hidden when video present */}
          {!videoUrl && slideMode && audioContext && (
            <div className="mt-8 sm:mt-12 flex justify-center items-center gap-4">
              {showGenerateAudioButton ? (
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
              ) : finalAudioUrl ? (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleAudioToggle}
                  className="flex items-center gap-3 px-6 py-3 text-base font-medium border-2 hover:bg-gray-50 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                  {isPlaying ? "Pause audio" : "Listen to audio"}
                </Button>
              ) : null}
            </div>
          )}
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

export default ArticlePage;
