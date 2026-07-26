import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";
import LessonNavigation from "./LessonNavigation";
import "./video-player-styles.css";
import BunnyStreamPlayer, { isBunnyStreamUrl } from "./BunnyStreamPlayer";
import {
  getVimeoEmbedUrl,
  getYouTubeEmbedUrl,
  hasIPhoneUnsupportedVideoExtension,
  isIOSLikeDevice,
  isVimeoUrl,
  isYouTubeUrl,
  sanitizeVideoUrl,
} from "@/utils/videoCompatibility";

interface VideoPageProps {
  title: string;
  videoUrl: string;
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
  lessonId?: string;
  returnPath?: string;
  pnlConsultationLessonId?: string;
}

// Removed intro video functionality to focus on main video reliability

const VideoPage: React.FC<VideoPageProps> = (props) => {
  // Hosted players need iframe embeds; direct media files use the native implementation.
  if (isBunnyStreamUrl(props.videoUrl)) {
    return <BunnyVideoPage {...props} />;
  }
  if (isYouTubeUrl(props.videoUrl) || isVimeoUrl(props.videoUrl)) {
    return <EmbedVideoPage {...props} />;
  }
  return <NativeVideoPage {...props} />;
};

const VideoPageShell: React.FC<VideoPageProps & { children: React.ReactNode }> = ({
  title,
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
  pnlConsultationLessonId,
  children,
}) => (
  <div className="flex flex-col h-full bg-gray-50">
    <div className="p-4 bg-white border-b">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </div>
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">{children}</div>
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

const EmbedVideoPage: React.FC<VideoPageProps> = (props) => {
  const embedUrl = isYouTubeUrl(props.videoUrl)
    ? getYouTubeEmbedUrl(props.videoUrl)
    : getVimeoEmbedUrl(props.videoUrl);

  return (
    <VideoPageShell {...props}>
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
          title={props.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    </VideoPageShell>
  );
};

const BunnyVideoPage: React.FC<VideoPageProps> = ({
  title,
  videoUrl,
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
  lessonId,
  returnPath,
  pnlConsultationLessonId,
}) => {
  return (
    <VideoPageShell
      title={title}
      videoUrl={videoUrl}
      pageIndex={pageIndex}
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
      returnPath={returnPath}
      pnlConsultationLessonId={pnlConsultationLessonId}
    >
      <BunnyStreamPlayer videoUrl={videoUrl} title={title} />
    </VideoPageShell>
  );
};

const NativeVideoPage: React.FC<VideoPageProps> = ({
  title,
  videoUrl,
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
  lessonId,
  returnPath,
  pnlConsultationLessonId
}) => {
  // Single video ref for main video only
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Video state management
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  
  // Main video loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Control visibility timer
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Video URL validation
  const isValidVideoUrl = (url: string) => {
    if (!url) return false;
    try {
      new URL(url);
      return url.includes('supabase.co') || /\.(mp4|m4v|mov|m3u8|webm)(?:$|[?#])/i.test(url);
    } catch {
      return false;
    }
  };

  const mainVideoSrc = useMemo(() => sanitizeVideoUrl(videoUrl), [videoUrl]);
  const useNativeVideoControls = isIOSLikeDevice();
  const hasUnsupportedIPhoneFormat = useNativeVideoControls && hasIPhoneUnsupportedVideoExtension(mainVideoSrc);

  // Get the current video ref (only main video now)
  const getCurrentVideoRef = () => mainVideoRef.current;

  // Initialize main video
  useEffect(() => {
    // Validate main video URL first
    if (!isValidVideoUrl(mainVideoSrc)) {
      console.error('Invalid video URL:', mainVideoSrc);
      setHasError(true);
      setErrorMessage('Invalid video URL provided');
      setIsLoading(false);
      return;
    }

    console.log('Initializing main video:', { mainVideoSrc });
    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");
  }, [mainVideoSrc]);

  // Enhanced video event handlers for main video only
  const setupVideoEventHandlers = (video: HTMLVideoElement) => {
    const handleLoadedMetadata = () => {
      console.log('Main video metadata loaded');
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      console.log('Main video ended');
      setIsPlaying(false);
    };

    const handleError = (e: Event) => {
      console.error('Main video error:', e);
      setHasError(true);
      setErrorMessage('Error loading main video');
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      console.log('Main video loading started');
      setIsLoading(true);
      setHasError(false);
      setErrorMessage("");
    };

    const handleCanPlay = () => {
      console.log('Main video can play');
      setIsLoading(false);
    };

    const handleDurationChange = () => {
      console.log('Main video duration changed:', video.duration);
      setDuration(video.duration);
    };

    // Add event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('durationchange', handleDurationChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('durationchange', handleDurationChange);
    };
  };

  // Setup event handlers for main video
  useEffect(() => {
    const mainVideo = mainVideoRef.current;
    let mainCleanup: (() => void) | undefined;

    if (mainVideo) {
      console.log('Setting up main video event handlers');
      mainCleanup = setupVideoEventHandlers(mainVideo);
    }

    return () => {
      mainCleanup?.();
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = getCurrentVideoRef();
      if (!video) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekBy(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekBy(10);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Update video playback speed
  useEffect(() => {
    const video = getCurrentVideoRef();
    if (video) {
      video.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Auto-hide controls
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const togglePlayPause = async () => {
    const video = getCurrentVideoRef();
    if (!video) return;

    try {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        await video.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing video:', error);
      setHasError(true);
      setErrorMessage('Failed to play video');
    }
  };

  const toggleMute = () => {
    const video = getCurrentVideoRef();
    if (!video) return;
    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const seekBy = (seconds: number) => {
    const video = getCurrentVideoRef();
    if (!video) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = getCurrentVideoRef();
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = getCurrentVideoRef();
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVideoClick = () => {
    togglePlayPause();
    resetControlsTimer();
  };

  const handleMouseMove = () => {
    resetControlsTimer();
  };

  const retry = () => {
    setHasError(false);
    setErrorMessage("");
    const video = getCurrentVideoRef();
    if (video) {
      video.load();
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  // Loading state and error handling
  if ((hasError && errorMessage) || hasUnsupportedIPhoneFormat) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <VolumeX className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Video Error</h3>
            <p className="text-gray-600 mb-4">
              {hasUnsupportedIPhoneFormat
                ? 'Este formato de vídeo não é compatível com iPhone. Use MP4/H.264 para esta aula.'
                : errorMessage}
            </p>
            {!hasUnsupportedIPhoneFormat && (
              <Button onClick={retry} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Video Title */}
      <div className="p-4 bg-white border-b">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>

      {/* Video Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          ref={containerRef}
          className={`relative w-full max-w-4xl bg-black rounded-lg overflow-hidden ${
            isFullscreen ? 'h-screen max-w-none' : 'aspect-video'
          }`}
          onMouseMove={handleMouseMove}
        >
          {/* Main Video */}
          <video
            ref={mainVideoRef}
            src={mainVideoSrc}
            className="w-full h-full object-contain cursor-pointer"
            onClick={useNativeVideoControls ? undefined : handleVideoClick}
            controls={useNativeVideoControls}
            preload="metadata"
            playsInline
            webkit-playsinline="true"
            x5-playsinline="true"
            muted={isMuted}
          />

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center pointer-events-none">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm">Carregando vídeo...</p>
              </div>
            </div>
          )}

          {/* Controls Overlay */}
          {!useNativeVideoControls && (
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${
                (showControls || !isPlaying) ? 'opacity-100' : 'opacity-0'
              }`}
            >
            {/* Play/Pause Button (Center) */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={togglePlayPause}
                  className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                >
                  <Play className="h-8 w-8 text-white ml-1" />
                </Button>
              </div>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
              {/* Progress Bar */}
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime || 0}
                  onChange={handleSeek}
                  className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${
                      duration ? (currentTime / duration) * 100 : 0
                    }%, rgba(255,255,255,0.3) ${
                      duration ? (currentTime / duration) * 100 : 0
                    }%, rgba(255,255,255,0.3) 100%)`
                  }}
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlayPause}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>

                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  <span className="text-white text-sm font-medium">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
            </div>
          )}
        </div>
      </div>

      {/* Speed Control Section */}
      <div className="px-4 py-6 bg-white border-b">
        <div className="flex items-center justify-center gap-3 max-w-4xl mx-auto">
          <span className="text-sm text-gray-600 font-medium">Velocidade:</span>
          <div className="flex gap-2">
            <Button
              variant={playbackSpeed === 1.0 ? "default" : "outline"}
              size="sm"
              onClick={() => handleSpeedChange(1.0)}
              className="text-sm"
            >
              Normal
            </Button>
            <Button
              variant={playbackSpeed === 0.6 ? "default" : "outline"}
              size="sm"
              onClick={() => handleSpeedChange(0.6)}
              className="text-sm"
            >
              Devagar
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-6 pb-8">
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
    </div>
  );
};

export default VideoPage;