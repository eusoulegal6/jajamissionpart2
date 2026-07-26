import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { base64ToAudioBlob } from '@/utils/base64Utils';
import { useToast } from '@/hooks/use-toast';

interface TextHighlightModeProps {
  isActive?: boolean;
  onExit?: () => void;
}

const TextHighlightMode: React.FC<TextHighlightModeProps> = () => {
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const isGeneratingRef = useRef(false);
  const { toast } = useToast();

  const handleGenerateAudio = useCallback(async (text: string) => {
    if (!text) return;
    
    // Use ref to prevent duplicate calls during state transitions
    if (isGeneratingRef.current) {
      console.log('TextHighlightMode: Already generating audio, skipping duplicate request');
      return;
    }

    isGeneratingRef.current = true;
    setIsGeneratingAudio(true);
    
    // Dispatch event to notify UI that audio generation started
    window.dispatchEvent(new CustomEvent('highlight:loading', { detail: { loading: true } }));

    try {
      console.log('TextHighlightMode: Generating audio for text:', text.substring(0, 50) + '...');
      const { data, error } = await supabase.functions.invoke('speak-elevenlabs', {
        body: { text }
      });

      if (error) {
        throw new Error(`Failed to generate audio: ${error.message || 'Unknown error'}`);
      }

      if (!data || !data.audioContent) {
        throw new Error("Invalid response from audio service");
      }

      // Convert base64 to blob and play
      const audioBlob = base64ToAudioBlob(data.audioContent);
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      
      // Notify UI that audio is about to play (loading done)
      window.dispatchEvent(new CustomEvent('highlight:loading', { detail: { loading: false } }));
      
      audio.play();
    } catch (error) {
      console.error("Error generating audio:", error);
      toast({
        title: "Error generating audio",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      // Notify UI that loading is done (even on error)
      window.dispatchEvent(new CustomEvent('highlight:loading', { detail: { loading: false } }));
    } finally {
      isGeneratingRef.current = false;
      setIsGeneratingAudio(false);
    }
  }, [toast]);

  useEffect(() => {
    const onPlay = (event: CustomEvent) => {
      const text = event.detail?.text;
      if (text) {
        void handleGenerateAudio(text);
      }
    };
    
    window.addEventListener('highlight:play', onPlay as EventListener);
    return () => window.removeEventListener('highlight:play', onPlay as EventListener);
  }, [handleGenerateAudio]);

  return null;
};

export default TextHighlightMode;
