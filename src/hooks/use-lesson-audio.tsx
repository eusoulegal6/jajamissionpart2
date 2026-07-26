
import React, { useState, useRef, useCallback, useContext, createContext, ReactNode } from "react";

interface AudioState {
  isPlaying: boolean;
  currentAudioUrl: string | null;
  currentPageIndex: number | null;
}

interface LessonAudioContextValue {
  audioState: AudioState;
  playAudio: (audioUrl: string, pageIndex: number) => void;
  pauseAudio: () => void;
  stopAudio: () => void;
  isCurrentPagePlaying: (pageIndex: number) => boolean;
  isAudioPlaying: (audioUrl: string) => boolean;
}

const LessonAudioContext = createContext<LessonAudioContextValue | undefined>(undefined);

export const LessonAudioProvider = ({ children }: { children: ReactNode }) => {
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentAudioUrl: null,
    currentPageIndex: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = useCallback((audioUrl: string, pageIndex: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    audioRef.current.onplay = () => {
      setAudioState({
        isPlaying: true,
        currentAudioUrl: audioUrl,
        currentPageIndex: pageIndex,
      });
    };
    audioRef.current.onpause = () => {
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    };
    audioRef.current.onended = () => {
      setAudioState({
        isPlaying: false,
        currentAudioUrl: null,
        currentPageIndex: null,
      });
    };
    audioRef.current.src = audioUrl;
    audioRef.current.play().catch(err => {
      console.error("Failed to play audio:", err);
      setAudioState({
        isPlaying: false,
        currentAudioUrl: null,
        currentPageIndex: null,
      });
    });
  }, []);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAudioState({
      isPlaying: false,
      currentAudioUrl: null,
      currentPageIndex: null,
    });
  }, []);

  const isCurrentPagePlaying = useCallback((pageIndex: number) => {
    return audioState.isPlaying && audioState.currentPageIndex === pageIndex;
  }, [audioState.isPlaying, audioState.currentPageIndex]);

  const isAudioPlaying = useCallback((audioUrl: string) => {
    return audioState.isPlaying && audioState.currentAudioUrl === audioUrl;
  }, [audioState.isPlaying, audioState.currentAudioUrl]);

  return (
    <LessonAudioContext.Provider
      value={{
        audioState,
        playAudio,
        pauseAudio,
        stopAudio,
        isCurrentPagePlaying,
        isAudioPlaying,
      }}
    >
      {children}
    </LessonAudioContext.Provider>
  );
};

export const useLessonAudio = (): LessonAudioContextValue => {
  const context = useContext(LessonAudioContext);
  if (!context) {
    throw new Error("useLessonAudio must be used within a LessonAudioProvider");
  }
  return context;
};
