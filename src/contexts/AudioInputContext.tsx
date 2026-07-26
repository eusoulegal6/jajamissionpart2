import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

interface AudioInputContextValue {
  isTabAudioActive: boolean;
  currentStream: MediaStream | null;
  activateTabAudio: () => Promise<void>;
  deactivateTabAudio: () => void;
}

const AudioInputContext = createContext<AudioInputContextValue | undefined>(undefined);

export const AudioInputProvider = ({ children }: { children: ReactNode }) => {
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [isTabAudioActive, setIsTabAudioActive] = useState(false);

  const deactivateTabAudio = useCallback(() => {
    setIsTabAudioActive(false);
    // Do not forcibly stop tracks here; if user ended share, tracks are already ended
    setCurrentStream(null);
    toast({ title: "Voltou ao microfone", description: "O áudio voltou a usar o microfone.", variant: "default" });
  }, []);

  const activateTabAudio = useCallback(async () => {
    try {
      // Request tab/screen share WITH video (required by most browsers) and audio
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

      // Ensure we actually have an audio track (user must pick a tab and enable 'share tab audio')
      const hasAudio = stream.getAudioTracks().length > 0;
      if (!hasAudio) {
        // Clean up and inform the user
        stream.getTracks().forEach(t => t.stop());
        toast({
          title: "Nenhum áudio capturado",
          description: "Selecione uma guia com áudio e marque 'Compartilhar áudio da guia'.",
          variant: "destructive",
        });
        return;
      }

      // Stop the video track(s) to save resources; keep audio alive
      stream.getVideoTracks().forEach(track => track.stop());

      setCurrentStream(stream);
      setIsTabAudioActive(true);
      toast({ title: "Usando áudio da guia", description: "Agora usando áudio da guia em vez do microfone." });

      // If the user stops sharing, revert back
      const handleEnded = () => {
        deactivateTabAudio();
      };
      stream.getTracks().forEach(track => {
        track.addEventListener('ended', handleEnded, { once: true });
      });
    } catch (err: any) {
      if (err && (err.name === 'NotAllowedError' || err.name === 'AbortError')) {
        toast({ title: "Compartilhamento cancelado", description: "Você cancelou o compartilhamento de guia.", variant: "default" });
      } else {
        toast({ title: "Erro ao capturar guia", description: "Tente novamente e permita o compartilhamento com áudio.", variant: "destructive" });
      }
      console.warn("Tab audio sharing failed:", err);
    }
  }, [deactivateTabAudio]);

  useEffect(() => {
    return () => {
      // Cleanup listeners if any
      currentStream?.getTracks().forEach(track => {
        // No explicit stop to avoid affecting system state unexpectedly
        track.onended = null;
      });
    };
  }, [currentStream]);

  return (
    <AudioInputContext.Provider value={{ isTabAudioActive, currentStream, activateTabAudio, deactivateTabAudio }}>
      {children}
    </AudioInputContext.Provider>
  );
};

export const useAudioInput = () => {
  const ctx = useContext(AudioInputContext);
  if (!ctx) throw new Error("useAudioInput must be used within AudioInputProvider");
  return ctx;
};
