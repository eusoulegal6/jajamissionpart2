import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Maximize2, Volume2, Loader2, Mic, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import OptimizedImg from '@/components/common/OptimizedImg';
import { getDisplayImageUrl } from '@/utils/imageOptimization';

interface SlideshowPageProps {
  pageData: {
    type: 'slideshow';
    title?: string;
    slideshowId: string;
  };
  onComplete?: () => void;
  canProceed?: boolean;
  onCanProceedChange?: (canProceed: boolean) => void;
}

interface SlideshowSlide {
  imageUrl: string;
  mobileImageUrl?: string;
  thumbnailUrl?: string;
  audioUrl?: string;
  order: number;
  type?: 'default' | 'comparison' | 'normal';
}

interface Slideshow {
  id: string;
  title: string;
  description?: string;
  slides: SlideshowSlide[];
  mobileMode?: boolean;
}

const SlideshowPage: React.FC<SlideshowPageProps> = ({
  pageData,
  onComplete,
  onCanProceedChange
}) => {
  const [slideshow, setSlideshow] = useState<Slideshow | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [slideLoading, setSlideLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [viewedSlides, setViewedSlides] = useState<Set<number>>(new Set([0]));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Fetch slideshow data
  useEffect(() => {
    const fetchSlideshow = async () => {
      try {
        const { data, error } = await supabase
          .from('slideshows')
          .select('*')
          .eq('id', pageData.slideshowId)
          .single();

        if (error) throw error;
        
        const slides = typeof data.slides === 'string' 
          ? JSON.parse(data.slides) 
          : data.slides;
        
        setSlideshow({
          ...data,
          slides: slides || [],
          mobileMode: data.mobile_mode
        });
      } catch (error) {
        console.error('Error fetching slideshow:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o slideshow",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (pageData.slideshowId) {
      fetchSlideshow();
    }
  }, [pageData.slideshowId, toast]);

  // Handle slide change - show loading until image loads
  useEffect(() => {
    // If all images are preloaded, skip per-slide loading
    if (allImagesLoaded) {
      setSlideLoading(false);
    } else {
      setSlideLoading(true);
    }
  }, [currentSlideIndex, allImagesLoaded]);

  // Preload all slide images after slideshow data is fetched
  useEffect(() => {
    if (!slideshow || slideshow.slides.length === 0) return;

    let cancelled = false;
    const preloadImages = async () => {
      const promises = slideshow.slides.map((slide) => {
        const url = (isMobile && slideshow.mobileMode && slide.mobileImageUrl)
          ? slide.mobileImageUrl
          : slide.imageUrl || '';
        const displayUrl = getDisplayImageUrl(url);
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // resolve anyway so we don't block
          img.src = displayUrl;
        });
      });
      await Promise.all(promises);
      if (!cancelled) {
        setAllImagesLoaded(true);
        setSlideLoading(false);
      }
    };
    preloadImages();
    return () => { cancelled = true; };
  }, [slideshow, isMobile]);

  const handleImageLoaded = () => {
    setSlideLoading(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/placeholder.svg';
    setSlideLoading(false);
  };

  const stopCurrentAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    setIsPlayingAudio(false);
  };

  const handleNextSlide = () => {
    if (slideshow && currentSlideIndex < slideshow.slides.length - 1) {
      stopCurrentAudio();
      const nextIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(nextIndex);
      setViewedSlides(prev => new Set(prev.add(nextIndex)));
      setRecordedAudio(null);
      setShowComparison(false);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      stopCurrentAudio();
      const prevIndex = currentSlideIndex - 1;
      setCurrentSlideIndex(prevIndex);
      setViewedSlides(prev => new Set(prev.add(prevIndex)));
      setRecordedAudio(null);
      setShowComparison(false);
    }
  };

  const handlePlayAudio = async () => {
    const currentSlide = slideshow?.slides[currentSlideIndex];
    if (!currentSlide?.audioUrl) return;

    if (isPlayingAudio && currentAudio) {
      stopCurrentAudio();
      return;
    }

    try {
      const audio = new Audio(currentSlide.audioUrl);
      audio.onended = () => {
        setIsPlayingAudio(false);
        setCurrentAudio(null);
      };
      audio.onerror = () => {
        toast({
          title: "Erro",
          description: "Não foi possível reproduzir o áudio",
          variant: "destructive"
        });
        setIsPlayingAudio(false);
        setCurrentAudio(null);
      };
      
      setCurrentAudio(audio);
      setIsPlayingAudio(true);
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reproduzir o áudio",
        variant: "destructive"
      });
    }
  };

  // Handle recording
  const handleRecordToggle = async () => {
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          setRecordedAudio(blob);
          stream.getTracks().forEach(track => track.stop());
        };
        
        setMediaRecorder(recorder);
        recorder.start();
        setIsRecording(true);
        setRecordedAudio(null);
        setShowComparison(false);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível acessar o microfone",
          variant: "destructive"
        });
      }
    }
  };

  const handlePlayRecorded = () => {
    if (!recordedAudio) return;
    const url = URL.createObjectURL(recordedAudio);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    audio.play();
  };

  const handlePlayOriginal = () => {
    const currentSlide = slideshow?.slides[currentSlideIndex];
    if (!currentSlide?.audioUrl) return;
    const audio = new Audio(currentSlide.audioUrl);
    audio.play();
  };

  // Register global handler so LessonRunner's Next button advances slides, not pages
  useEffect(() => {
    const handleGlobalNext = () => {
      if (slideshow && currentSlideIndex < slideshow.slides.length - 1) {
        handleNextSlide();
      } else if (slideshow && currentSlideIndex === slideshow.slides.length - 1) {
        // On last slide, allow lesson to proceed to next page
        onComplete?.();
      }
    };
    
    (window as any).__slideshowNextHandler = handleGlobalNext;
    
    return () => {
      delete (window as any).__slideshowNextHandler;
    };
  }, [slideshow, currentSlideIndex, onComplete]);

  // Keyboard navigation in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevSlide();
      } else if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, currentSlideIndex, slideshow]);

  // Enable proceeding once all slides have been viewed
  useEffect(() => {
    if (slideshow && viewedSlides.size === slideshow.slides.length) {
      onCanProceedChange?.(true);
    }
  }, [viewedSlides, slideshow, onCanProceedChange]);

  if (loading || !allImagesLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading slideshow...' : 'Loading images...'}
        </p>
      </div>
    );
  }

  if (!slideshow || slideshow.slides.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum slide encontrado</p>
      </div>
    );
  }

  const currentSlide = slideshow.slides[currentSlideIndex];
  // Use mobile image on mobile devices if available, otherwise fallback to desktop image
  const rawImageUrl = (isMobile && slideshow.mobileMode && currentSlide?.mobileImageUrl) 
    ? currentSlide.mobileImageUrl 
    : currentSlide?.imageUrl || '';
  const currentImageUrl = getDisplayImageUrl(rawImageUrl);
  const isComparisonSlide = currentSlide?.type === 'comparison';
  const hasAudio = !!currentSlide?.audioUrl;
  const canGoNext = currentSlideIndex < slideshow.slides.length - 1;
  const canGoPrev = currentSlideIndex > 0;

  const renderLoadingOverlay = () => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-4 border-primary/20 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-20 w-20 animate-spin text-primary" />
        </div>
      </div>
    </div>
  );

  const renderSlideContent = (inFullscreen: boolean = false) => (
    <div className={`relative ${inFullscreen ? 'bg-black' : 'bg-white'} rounded-lg shadow-lg overflow-hidden ${inFullscreen ? '' : 'mb-6 md:mb-8 mx-auto'} ${!inFullscreen && !isMobile ? 'max-w-4xl' : ''}`}>
      <div className={`${inFullscreen ? 'h-screen' : slideshow.mobileMode && isMobile ? 'aspect-[9/16]' : 'aspect-video'} relative`}>
        {slideLoading && renderLoadingOverlay()}
        
        <OptimizedImg
          src={currentImageUrl}
          alt={`Slide ${currentSlideIndex + 1}`}
          className={`w-full h-full ${inFullscreen ? 'object-contain' : slideshow.mobileMode && isMobile ? 'max-h-[500px] object-contain' : 'object-contain'} ${!isMobile && !inFullscreen ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${slideLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={handleImageLoaded}
          onError={handleImageError}
          onClick={() => {
            if (!isMobile && !inFullscreen) {
              setIsFullscreen(true);
            }
          }}
        />
        
        {/* Audio button overlay - inside the slideshow */}
        {hasAudio && !isComparisonSlide && !slideLoading && !inFullscreen && (
          <button
            onClick={(e) => { e.stopPropagation(); handlePlayAudio(); }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-105 font-medium text-lg"
          >
            <Volume2 className={`h-6 w-6 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
            {isPlayingAudio ? 'Pause' : 'Listen'}
          </button>
        )}
        
        {/* Fullscreen audio button */}
        {hasAudio && !isComparisonSlide && inFullscreen && (
          <button
            onClick={(e) => { e.stopPropagation(); handlePlayAudio(); }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-8 py-4 bg-white/90 text-black rounded-full shadow-lg hover:bg-white transition-all hover:scale-105 font-medium text-xl"
          >
            <Volume2 className={`h-7 w-7 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
            {isPlayingAudio ? 'Pause' : 'Listen'}
          </button>
        )}
        
        {!inFullscreen && !isMobile && !slideLoading && (
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            aria-label="Tela cheia"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        )}
        
        {inFullscreen && (
          <>
            {canGoPrev && (
              <button
                onClick={(e) => { e.stopPropagation(); handlePrevSlide(); }}
                className="absolute left-0 top-0 bottom-0 w-1/4 flex items-center justify-start pl-4 bg-gradient-to-r from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-12 w-12 text-white" />
              </button>
            )}
            {canGoNext && (
              <button
                onClick={(e) => { e.stopPropagation(); handleNextSlide(); }}
                className="absolute right-0 top-0 bottom-0 w-1/4 flex items-center justify-end pr-4 bg-gradient-to-l from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-12 w-12 text-white" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderAudioComparisonSection = () => {
    if (!isComparisonSlide || !hasAudio) return null;

    return (
      <div className="bg-muted/50 rounded-lg p-4 md:p-6 mx-auto max-w-4xl">
        <h3 className="text-lg font-semibold mb-4 text-center">Pratique sua pronúncia</h3>
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
          <Button onClick={handlePlayOriginal} variant="outline" className="w-full md:w-auto">
            <Volume2 className="h-4 w-4 mr-2" />
            Ouvir original
          </Button>
          
          <Button
            onClick={handleRecordToggle}
            variant={isRecording ? "destructive" : "default"}
            className="w-full md:w-auto"
          >
            {isRecording ? <><Square className="h-4 w-4 mr-2" />Parar</> : <><Mic className="h-4 w-4 mr-2" />Gravar</>}
          </Button>
          
          {recordedAudio && (
            <>
              <Button onClick={handlePlayRecorded} variant="secondary" className="w-full md:w-auto">
                <Volume2 className="h-4 w-4 mr-2" />Ouvir gravação
              </Button>
              <Button onClick={() => setShowComparison(!showComparison)} variant="outline" className="w-full md:w-auto">
                <RotateCcw className="h-4 w-4 mr-2" />{showComparison ? 'Esconder' : 'Comparar'}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      
      {renderSlideContent(false)}
      
      {renderAudioComparisonSection()}
      
      
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-none w-screen h-screen p-0 bg-black border-none">
          <div className="relative w-full h-full" onClick={() => setIsFullscreen(false)}>
            {renderSlideContent(true)}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">Clique para fechar</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SlideshowPage;
