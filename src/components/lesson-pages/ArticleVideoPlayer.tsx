import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw } from "lucide-react";
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

interface ArticleVideoPlayerProps {
  videoUrl: string;
  title?: string;
}

const ArticleVideoPlayer: React.FC<ArticleVideoPlayerProps> = ({ videoUrl, title }) => {
  // Bunny Stream uses iframe embed; route to its dedicated player.
  // Native <video> implementation lives in NativeArticleVideoPlayer below — unchanged.
  if (isBunnyStreamUrl(videoUrl)) {
    return <BunnyStreamPlayer videoUrl={videoUrl} title={title} />;
  }
  if (isYouTubeUrl(videoUrl) || isVimeoUrl(videoUrl)) {
    const embedUrl = isYouTubeUrl(videoUrl) ? getYouTubeEmbedUrl(videoUrl) : getVimeoEmbedUrl(videoUrl);
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
          title={title || "Article video"}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }
  return <NativeArticleVideoPlayer videoUrl={videoUrl} title={title} />;
};

const NativeArticleVideoPlayer: React.FC<ArticleVideoPlayerProps> = ({ videoUrl, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const videoSrc = useMemo(() => sanitizeVideoUrl(videoUrl), [videoUrl]);
  const useNativeVideoControls = isIOSLikeDevice();
  const hasUnsupportedIPhoneFormat = useNativeVideoControls && hasIPhoneUnsupportedVideoExtension(videoSrc);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => { setDuration(video.duration); setIsLoading(false); };
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onEnded = () => setIsPlaying(false);
    const onError = () => { setHasError(true); setIsLoading(false); };
    const onCanPlay = () => setIsLoading(false);
    const onLoadStart = () => { setIsLoading(true); setHasError(false); };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('loadstart', onLoadStart);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('loadstart', onLoadStart);
    };
  }, [videoSrc]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const togglePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (isPlaying) { video.pause(); setIsPlaying(false); }
      else { await video.play(); setIsPlaying(true); }
    } catch (e) { console.error('Error playing video:', e); }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) await containerRef.current.requestFullscreen();
      else await document.exitFullscreen();
    } catch (e) { console.error('Error toggling fullscreen:', e); }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const retry = () => {
    setHasError(false);
    videoRef.current?.load();
  };

  if (hasError || hasUnsupportedIPhoneFormat) {
    return (
      <div className="w-full rounded-lg bg-gray-900 flex items-center justify-center py-12">
        <div className="text-center text-white">
          <VolumeX className="h-10 w-10 mx-auto mb-3 text-red-400" />
          <p className="text-sm mb-3">
            {hasUnsupportedIPhoneFormat
              ? 'Este formato de vídeo não é compatível com iPhone. Use MP4/H.264.'
              : 'Erro ao carregar vídeo'}
          </p>
          {!hasUnsupportedIPhoneFormat && (
            <Button variant="outline" size="sm" onClick={retry} className="text-white border-white/30 hover:bg-white/10">
              <RotateCcw className="h-4 w-4 mr-2" /> Tentar novamente
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black rounded-lg overflow-hidden group ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-auto max-h-[50vh] sm:max-h-[60vh] object-contain cursor-pointer"
        onClick={useNativeVideoControls ? undefined : togglePlayPause}
        controls={useNativeVideoControls}
        preload="metadata"
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
        </div>
      )}

      {/* Controls - on TOP */}
      {!useNativeVideoControls && (
        <div
          className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
            (showControls || !isPlaying) ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
        {/* Progress Bar */}
        <div className="px-3 pt-3">
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
        <div className="flex items-center justify-between px-2 pb-2 pt-1">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={togglePlayPause} className="text-white hover:bg-white/20 h-8 w-8 p-0">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleMute} className="text-white hover:bg-white/20 h-8 w-8 p-0">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <span className="text-white/80 text-xs ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:bg-white/20 h-8 w-8 p-0">
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
        </div>
      )}

      {/* Center Play Button when paused */}
      {!useNativeVideoControls && !isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Button
            variant="ghost"
            size="lg"
            onClick={togglePlayPause}
            className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm pointer-events-auto"
          >
            <Play className="h-7 w-7 text-white ml-0.5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ArticleVideoPlayer;
