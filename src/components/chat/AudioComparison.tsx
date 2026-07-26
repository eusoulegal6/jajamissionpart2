import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader, Play, Pause } from "lucide-react";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { supabase } from "@/integrations/supabase/client";

interface AudioComparisonProps {
  userAudio: Blob;
  originalAudioText: string;
  originalAudioTitle?: string;
}

const PlayerCard: React.FC<{
  title: string, 
  onPlay: () => void, 
  onPlaySlow?: () => void,
  isPlaying: boolean, 
  isLoading?: boolean, 
  color: 'orange' | 'green',
  showSlowButton?: boolean
}> = ({ title, onPlay, onPlaySlow, isPlaying, isLoading = false, color, showSlowButton = false }) => {
    const colorClasses = {
        orange: {
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            text: 'text-orange-800',
        },
        green: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-800',
        }
    };

    return (
        <div className={`w-full shadow-sm rounded-lg p-3 flex items-center justify-between ${colorClasses[color].bg} border ${colorClasses[color].border}`}>
            <p className={`text-sm font-medium ${colorClasses[color].text}`}>{title}</p>
            <div className="flex gap-2">
                {showSlowButton && onPlaySlow && (
                    <Button
                        onClick={onPlaySlow}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        disabled={isLoading}
                        title="Reproduzir mais devagar"
                    >
                        🐢
                    </Button>
                )}
                <Button
                    onClick={onPlay}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader className="h-4 w-4 animate-spin" />
                    ) : isPlaying ? (
                        <Pause className="h-4 w-4" />
                    ) : (
                        <Play className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
    )
}

const AudioComparison: React.FC<AudioComparisonProps> = ({ userAudio, originalAudioText, originalAudioTitle }) => {
  const [userAudioElement, setUserAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isUserAudioPlaying, setIsUserAudioPlaying] = useState(false);
  const [originalSlowAudio, setOriginalSlowAudio] = useState<HTMLAudioElement | null>(null);
  const [isOriginalSlowPlaying, setIsOriginalSlowPlaying] = useState(false);
  const [isOriginalSlowLoading, setIsOriginalSlowLoading] = useState(false);
  
  const { isPlaying: isOriginalAudioPlaying, isLoadingAudio: isOriginalAudioLoading, handleSpeakMessage } = useTextToSpeech();

  useEffect(() => {
    const audioUrl = URL.createObjectURL(userAudio);
    const audio = new Audio(audioUrl);
    
    const onPlay = () => setIsUserAudioPlaying(true);
    const onPause = () => setIsUserAudioPlaying(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onPause);
    
    setUserAudioElement(audio);

    return () => {
      if (audio) {
        audio.pause();
        URL.revokeObjectURL(audioUrl);
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('ended', onPause);
      }
    };
  }, [userAudio]);

  const handlePlayUserAudio = () => {
    console.log("handlePlayUserAudio called, userAudioElement:", userAudioElement);
    console.log("isUserAudioPlaying:", isUserAudioPlaying);
    if (!userAudioElement) {
      console.log("No userAudioElement available");
      return;
    }
    if (isUserAudioPlaying) {
      console.log("Pausing user audio");
      userAudioElement.pause();
    } else {
      console.log("Playing user audio");
      userAudioElement.playbackRate = 1.0;
      userAudioElement.play().catch(console.error);
    }
  };

  const handlePlayUserAudioSlow = () => {
    if (!userAudioElement) return;
    if (isUserAudioPlaying) {
      userAudioElement.pause();
    } else {
      userAudioElement.playbackRate = 0.7;
      userAudioElement.play().catch(console.error);
    }
  };

  const handlePlayOriginalAudio = () => {
    handleSpeakMessage(0, originalAudioText);
  };

  const handlePlayOriginalAudioSlow = async () => {
    if (isOriginalSlowPlaying) {
      originalSlowAudio?.pause();
      return;
    }

    try {
      setIsOriginalSlowLoading(true);
      
      // Generate TTS audio for slow playback
      const { data, error } = await supabase.functions.invoke('speak-elevenlabs', {
        body: { text: originalAudioText }
      });
      
      if (error || !data?.audioContent) {
        console.error('Error generating slow audio:', error);
        return;
      }

      // Convert base64 to blob
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.playbackRate = 0.6; // 40% slower
      
      audio.onplay = () => setIsOriginalSlowPlaying(true);
      audio.onpause = () => setIsOriginalSlowPlaying(false);
      audio.onended = () => {
        setIsOriginalSlowPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      setOriginalSlowAudio(audio);
      await audio.play();
    } catch (error) {
      console.error('Error playing slow audio:', error);
    } finally {
      setIsOriginalSlowLoading(false);
    }
  };
  
  const originalAudioLoading = isOriginalAudioLoading[0];
  const originalAudioPlaying = isOriginalAudioPlaying[0];

  return (
    <div className="flex justify-start">
      <div className="message-bubble assistant-message">
        <div className="space-y-2">
            <PlayerCard 
                title="O que você falou:"
                onPlay={handlePlayUserAudio}
                isPlaying={isUserAudioPlaying}
                color="orange"
            />
            <PlayerCard 
                title={originalAudioTitle}
                onPlay={handlePlayOriginalAudio}
                onPlaySlow={handlePlayOriginalAudioSlow}
                isPlaying={originalAudioPlaying || isOriginalSlowPlaying}
                isLoading={originalAudioLoading || isOriginalSlowLoading}
                color="green"
                showSlowButton={true}
            />
        </div>
      </div>
    </div>
  );
};

export default AudioComparison;
