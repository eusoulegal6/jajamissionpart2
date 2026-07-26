
import { useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { base64ToAudioBlob } from "@/utils/base64Utils";

export const useTextToSpeech = (voiceId?: string) => {
  const [isPlaying, setIsPlaying] = useState<Record<number, boolean>>({});
  const [isPlayingSlow, setIsPlayingSlow] = useState<Record<number, boolean>>({});
  const [isLoadingAudio, setIsLoadingAudio] = useState<Record<number, boolean>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const slowAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Map<string, string>>(new Map());
  const currentPlayingIndex = useRef<number | null>(null);
  const currentSlowPlayingIndex = useRef<number | null>(null);

  // Enhanced cleanup function
  const stopAllAudio = () => {
    console.log('TTS - Stopping all audio');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (slowAudioRef.current) {
      slowAudioRef.current.pause();
      slowAudioRef.current.currentTime = 0;
      slowAudioRef.current = null;
    }
    setIsPlaying({});
    setIsPlayingSlow({});
    currentPlayingIndex.current = null;
    currentSlowPlayingIndex.current = null;
  };

  const handleSpeakMessage = async (messageIndex: number, text: string) => {
    console.log('TTS - handleSpeakMessage called for index:', messageIndex, 'currently playing:', currentPlayingIndex.current);
    
    // If already playing this message, stop it
    if (isPlaying[messageIndex] && currentPlayingIndex.current === messageIndex) {
      console.log('TTS - Stopping currently playing message');
      stopAllAudio();
      return;
    }
    
    // If another message is playing, stop it first
    if (currentPlayingIndex.current !== null && currentPlayingIndex.current !== messageIndex) {
      console.log('TTS - Stopping other playing message:', currentPlayingIndex.current);
      stopAllAudio();
    }
    
    // Reset all loading states first
    setIsLoadingAudio({});
    
    try {
      // Validate text length
      if (text.length > 5000) {
        toast({
          title: "Texto muito longo",
          description: "O texto é muito longo para conversão em áudio. Máximo de 5000 caracteres.",
          variant: "destructive",
        });
        return;
      }

      // Generate a cache key based on the message text and voice ID
      const cacheKey = `message-${messageIndex}-${text.substring(0, 50)}_${voiceId || 'default'}`;
      let audioUrl: string;
      
      // Check if we have this audio in cache
      if (audioCache.current.has(cacheKey)) {
        audioUrl = audioCache.current.get(cacheKey)!;
        console.log('TTS - Using cached audio for key:', cacheKey);
      } else {
        // Set this specific message to loading state
        setIsLoadingAudio(prev => ({...prev, [messageIndex]: true}));
        
        console.log('TTS - Calling TTS function for text length:', text.length);
        
        // Use Supabase client's invoke method which handles authentication automatically
        const { data, error } = await supabase.functions.invoke('speak-elevenlabs', {
          body: { text, voiceId }
        });
        
        if (error) {
          console.error('TTS Error:', error);
          throw new Error(`Falha ao gerar áudio: ${error.message || 'Erro desconhecido'}`);
        }
        
        if (!data || !data.audioContent) {
          throw new Error("Resposta inválida do serviço de áudio");
        }

        console.log('TTS - Received audio content, converting to blob...');

        try {
          // Convert base64 to blob using the utility function
          const audioBlob = base64ToAudioBlob(data.audioContent);
          audioUrl = URL.createObjectURL(audioBlob);
          
          console.log('TTS - Audio blob created successfully, size:', audioBlob.size);
          
          // Store in cache
          audioCache.current.set(cacheKey, audioUrl);
        } catch (conversionError) {
          console.error('TTS - Error converting audio data:', conversionError);
          throw new Error(`Erro ao processar dados de áudio: ${conversionError.message}`);
        }
      }
      
      // Clear loading state once response is received
      setIsLoadingAudio(prev => ({...prev, [messageIndex]: false}));
      
      // Create new audio element for this playback
      console.log('TTS - Creating new audio element');
      const newAudio = new Audio(audioUrl);
      
      newAudio.onended = () => {
        console.log('TTS - Audio ended for index:', messageIndex);
        setIsPlaying(prev => ({...prev, [messageIndex]: false}));
        currentPlayingIndex.current = null;
        audioRef.current = null;
      };
      
      newAudio.onerror = (e) => {
        console.error("TTS - Audio playback error:", e);
        setIsPlaying(prev => ({...prev, [messageIndex]: false}));
        currentPlayingIndex.current = null;
        audioRef.current = null;
        toast({
          title: "Erro",
          description: "Não foi possível reproduzir o áudio. Por favor, tente novamente.",
          variant: "destructive",
        });
      };
      
      newAudio.onplay = () => {
        console.log('TTS - Audio started playing for index:', messageIndex);
        setIsPlaying(prev => ({...prev, [messageIndex]: true}));
        currentPlayingIndex.current = messageIndex;
      };
      
      newAudio.onpause = () => {
        console.log('TTS - Audio paused for index:', messageIndex);
        setIsPlaying(prev => ({...prev, [messageIndex]: false}));
        currentPlayingIndex.current = null;
      };
      
      // Set the new audio as current and play
      audioRef.current = newAudio;
      
      console.log('TTS - Starting playback for index:', messageIndex);
      newAudio.play().catch(error => {
        console.error("TTS - Failed to play audio:", error);
        setIsPlaying(prev => ({...prev, [messageIndex]: false}));
        currentPlayingIndex.current = null;
        audioRef.current = null;
        toast({
          title: "Erro",
          description: "Não foi possível reproduzir o áudio. Por favor, tente novamente.",
          variant: "destructive",
        });
      });
    } catch (error) {
      console.error("TTS - Failed to load audio:", error);
      setIsLoadingAudio(prev => ({...prev, [messageIndex]: false}));
      setIsPlaying(prev => ({...prev, [messageIndex]: false}));
      currentPlayingIndex.current = null;
      
      let errorMessage = "Não foi possível carregar o áudio. Por favor, tente novamente.";
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes("too long")) {
          errorMessage = "O texto é muito longo para conversão em áudio.";
        } else if (error.message.includes("too large")) {
          errorMessage = "O arquivo de áudio gerado é muito grande.";
        } else if (error.message.includes("API key")) {
          errorMessage = "Configuração de áudio não encontrada.";
        } else if (error.message.includes("decode")) {
          errorMessage = "Erro ao processar o áudio gerado.";
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSpeakMessageSlow = async (messageIndex: number, text: string) => {
    console.log('TTS - handleSpeakMessageSlow called for index:', messageIndex, 'currently playing slow:', currentSlowPlayingIndex.current);
    
    // If already playing this message slow, stop it
    if (isPlayingSlow[messageIndex] && currentSlowPlayingIndex.current === messageIndex) {
      console.log('TTS - Stopping currently playing slow message');
      if (slowAudioRef.current) {
        slowAudioRef.current.pause();
        slowAudioRef.current.currentTime = 0;
        slowAudioRef.current = null;
      }
      setIsPlayingSlow({});
      currentSlowPlayingIndex.current = null;
      return;
    }
    
    // Stop any other playing audio first
    stopAllAudio();
    
    // Reset all loading states first
    setIsLoadingAudio({});
    
    try {
      // Validate text length
      if (text.length > 5000) {
        toast({
          title: "Texto muito longo",
          description: "O texto é muito longo para conversão em áudio. Máximo de 5000 caracteres.",
          variant: "destructive",
        });
        return;
      }

      // Check cache first (same as regular audio)
      const cacheKey = `${text}_${voiceId || 'default'}`;
      let audioUrl = audioCache.current.get(cacheKey);

      if (!audioUrl) {
        // Set loading state
        setIsLoadingAudio(prev => ({ ...prev, [messageIndex]: true }));

        console.log('TTS - Calling speak-elevenlabs function for slow audio...');
        const { data, error } = await supabase.functions.invoke('speak-elevenlabs', {
          body: { 
            text: text,
            voiceId: voiceId
          }
        });

        if (error) {
          throw new Error(`Falha ao gerar áudio: ${error.message || 'Erro desconhecido'}`);
        }

        if (!data || !data.audioContent) {
          throw new Error("Resposta inválida do serviço de áudio");
        }

        // Convert base64 to blob and create object URL
        const audioBlob = base64ToAudioBlob(data.audioContent);
        audioUrl = URL.createObjectURL(audioBlob);
        
        // Cache the URL
        audioCache.current.set(cacheKey, audioUrl);
        console.log('TTS - Audio generated and cached for slow playback');
      } else {
        console.log('TTS - Using cached audio for slow playback');
      }

      // Create audio element with slow playback
      const audio = new Audio(audioUrl);
      audio.playbackRate = 0.3; // 70% slower
      
      audio.onended = () => {
        console.log('TTS - Slow audio playback ended');
        setIsPlayingSlow(prev => ({ ...prev, [messageIndex]: false }));
        currentSlowPlayingIndex.current = null;
        slowAudioRef.current = null;
      };

      audio.onerror = () => {
        console.error('TTS - Error playing slow audio');
        setIsPlayingSlow(prev => ({ ...prev, [messageIndex]: false }));
        currentSlowPlayingIndex.current = null;
        slowAudioRef.current = null;
        toast({
          title: "Erro de áudio",
          description: "Falha ao reproduzir o áudio.",
          variant: "destructive",
        });
      };

      audio.onplay = () => {
        console.log('TTS - Slow audio started playing');
        setIsPlayingSlow(prev => ({ ...prev, [messageIndex]: true }));
        currentSlowPlayingIndex.current = messageIndex;
      };

      audio.onpause = () => {
        console.log('TTS - Slow audio paused');
        setIsPlayingSlow(prev => ({ ...prev, [messageIndex]: false }));
      };

      slowAudioRef.current = audio;
      console.log('TTS - Starting slow audio playback...');
      await audio.play();

    } catch (error) {
      console.error('TTS - Error in handleSpeakMessageSlow:', error);
      setIsPlayingSlow(prev => ({ ...prev, [messageIndex]: false }));
      currentSlowPlayingIndex.current = null;
      
      toast({
        title: "Erro",
        description: "Falha ao reproduzir áudio lento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAudio(prev => ({ ...prev, [messageIndex]: false }));
    }
  };

  return {
    isPlaying,
    isPlayingSlow,
    isLoadingAudio,
    handleSpeakMessage,
    handleSpeakMessageSlow,
    stopAllAudio
  };
};
