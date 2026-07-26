import { useState, useRef, useEffect } from "react";
import { 
  AudioRecordingState, 
  initialAudioRecordingState, 
  startRecording as startAudioRecording,
  stopRecording as stopAudioRecording,
  playAudio as playAudioFile,
  cancelRecording as cancelAudioRecording,
  startRecordingWithStream
} from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LearningLanguage, useLanguage } from "@/contexts/LanguageContext";
import { useAudioInput } from "@/contexts/AudioInputContext";

// Clean up transcribed text by removing fillers and repeated words
const cleanupTranscribedText = (text: string): string => {
  if (!text) return text;
  
  // Step 1: Replace common fillers with empty string
  const withoutFillers = text
    .replace(/\b(um|uh|hmm|er|ah|like,|you know,)\b\s*/gi, '')
    .replace(/\b(so)\b\s+\b(like)\b\s*/gi, '')
    .replace(/\b(i mean)\b\s*/gi, '');
  
  // Step 2: Remove immediately repeated words (like "the the" or "I I")
  const withoutRepeats = withoutFillers
    .replace(/\b(\w+)\b\s+\b\1\b/gi, '$1')
    // Handle triple or more repeats (unlikely but possible)
    .replace(/\b(\w+)\b\s+\b\1\b\s+\b\1\b/gi, '$1');
  
  console.log("Original transcription:", text);
  console.log("Cleaned transcription:", withoutRepeats);
  
  return withoutRepeats;
};

export function useAudioRecording(currentMode?: string, learningLanguageProp?: LearningLanguage) {
  const { learningLanguage: contextLearningLanguage } = useLanguage();
  const learningLanguage = learningLanguageProp || contextLearningLanguage;
  const { isTabAudioActive, currentStream } = useAudioInput();

  const [recordingState, setRecordingState] = useState<AudioRecordingState>(initialAudioRecordingState);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showStopButton, setShowStopButton] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  
  // Enhanced debugging effect to track recording state changes
  useEffect(() => {
    console.log("useAudioRecording: Audio recording state changed:", {
      status: recordingState.status,
      hasRecordedAudio: !!recordingState.recordedAudio,
      hasMediaRecorder: !!recordingState.mediaRecorder,
      hasStream: !!recordingState.stream,
      currentMode,
      learningLanguage
    });
  }, [recordingState, currentMode, learningLanguage]);
  
  // Ensure the recording state is properly initialized to 'idle' on mount
  useEffect(() => {
    console.log("useAudioRecording hook mounted, initializing state to idle for mode:", currentMode);
    setRecordingState(initialAudioRecordingState);
  }, [currentMode]); // Add currentMode as dependency to reinitialize when mode changes
  
  const handleMicButtonClick = async () => {
    console.log("useAudioRecording: Mic button clicked", {
      currentStatus: recordingState.status,
      currentMode,
      isTranscribing
    });
    
    // If already recording, do nothing (we'll use the stop button instead)
    if (recordingState.status === 'recording') {
      console.log("Already recording, ignoring mic button click");
      return;
    }

    // If in preview mode, do nothing (user should interact with preview interface)
    if (recordingState.status === 'preview') {
      console.log("In preview mode, ignoring mic button click");
      return;
    }

    // If currently transcribing, don't start new recording
    if (isTranscribing) {
      console.log("Currently transcribing, ignoring mic button click");
      return;
    }

    // Start recording
    try {
      console.log("useAudioRecording: Starting recording...");
      if (isTabAudioActive && currentStream) {
        await startRecordingWithStream(currentStream, setRecordingState);
      } else {
        await startAudioRecording(setRecordingState);
      }
      setShowStopButton(true);
      console.log("useAudioRecording: Recording started successfully");
    } catch (error) {
      console.error("useAudioRecording: Failed to start recording:", error);
      toast({
        title: "Erro",
        description: "Não foi possível acessar o microfone. Verifique suas permissões.",
        variant: "destructive",
      });
      // Reset state on error
      setRecordingState(initialAudioRecordingState);
      setShowStopButton(false);
    }
  };

  const stopRecording = () => {
    console.log("useAudioRecording: Stop recording called", {
      currentStatus: recordingState.status,
      hasMediaRecorder: !!recordingState.mediaRecorder
    });
    
    if (recordingState.status === 'recording') {
      stopAudioRecording(recordingState);
      setShowStopButton(false);
      console.log("useAudioRecording: Stop recording command sent");
    }
  };

  const playAudio = () => {
    console.log("useAudioRecording: Play audio called", {
      hasRecordedAudio: !!recordingState.recordedAudio,
      audioSize: recordingState.recordedAudio?.size
    });
    
    if (recordingState.recordedAudio) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      
      setIsPlaying(true);
      
      const audio = playAudioFile(recordingState.recordedAudio);
      audioPlayerRef.current = audio;
      
      // When audio ends, update the playing state
      audio.onended = () => {
        setIsPlaying(false);
        console.log("useAudioRecording: Audio playback ended");
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        console.error("useAudioRecording: Audio playback error");
      };
    }
  };

  const cancelAudio = () => {
    console.log("useAudioRecording: Cancel audio called");
    cancelAudioRecording(setRecordingState, audioPlayerRef.current);
    audioPlayerRef.current = null;
    setIsPlaying(false);
    setShowStopButton(false);
    console.log("useAudioRecording: Audio canceled and state reset");
  };

  const transcribeAudio = async (recordedAudio: Blob): Promise<string> => {
    setIsTranscribing(true);
    
    try {
      console.log("useAudioRecording: Starting transcription", {
        audioType: recordedAudio.type,
        audioSize: recordedAudio.size,
        currentMode,
        learningLanguage,
      });

      // Validate minimum audio size (< 5KB is likely too short for Whisper)
      const MIN_AUDIO_SIZE = 5000; // 5KB minimum
      if (recordedAudio.size < MIN_AUDIO_SIZE) {
        console.warn("useAudioRecording: Audio file too short", {
          size: recordedAudio.size,
          minRequired: MIN_AUDIO_SIZE
        });
        throw new Error("Gravação muito curta. Por favor, fale por mais tempo.");
      }
      
      // Create form data with audio file
      const formData = new FormData();
      formData.append('file', recordedAudio, 'recording.webm');
      
      // Add learning language to FormData to help backend determine language settings
      formData.append('language', learningLanguage);
      console.log(`useAudioRecording: Including language "${learningLanguage}" in transcription request`);
      
      // Add current mode to FormData for 'specialist' or 'tradutor' to enable auto-detect
      if (currentMode === 'specialist' || currentMode === 'tradutor') {
        formData.append('mode', currentMode);
        console.log(`useAudioRecording: Including mode "${currentMode}" in transcription request (auto-detect enabled)`);
      }

      // Send to transcription API with proper authorization
      console.log("useAudioRecording: Sending audio transcription request");
      const response = await supabase.functions.invoke('transcribe-audio', {
        body: formData,
      }).catch((error) => {
        console.error("useAudioRecording: Audio transcription failed:", error);
        throw error;
      });

      console.log("useAudioRecording: Transcription API response:", response);
      
      // Check if the response was successful
      if (response.error) {
        console.error("useAudioRecording: Transcription API error:", response.error);
        throw new Error(`Error: ${response.error.message || response.error}`);
      }
      
      // Get the transcribed text from response.data
      if (!response.data || !response.data.text) {
        console.error("useAudioRecording: Transcription response missing text field:", response.data);
        throw new Error("Invalid response format: missing text field");
      }
      
      // Get the transcribed text and clean it up
      const rawTranscribedText = response.data.text;
      const transcribedText = cleanupTranscribedText(rawTranscribedText);
      
      console.log("useAudioRecording: Transcription successful", {
        originalText: rawTranscribedText,
        cleanedText: transcribedText
      });
      
      return transcribedText;
    } catch (error) {
      console.error("useAudioRecording: Failed to transcribe audio:", error);
      throw error;
    } finally {
      setIsTranscribing(false);
    }
  };

  const sendAudio = async (): Promise<{ recordedAudio: Blob | null; transcribedText: string | null }> => {
    // Store the recorded audio for further processing
    const recordedAudio = recordingState.recordedAudio;
    let transcribedText = null;
    
    console.log("useAudioRecording: sendAudio called", {
      hasRecordedAudio: !!recordedAudio,
      audioSize: recordedAudio?.size,
      currentMode
    });
    
    try {
      // Transcribe the audio if available
      if (recordedAudio) {
        console.log("useAudioRecording: Sending audio for transcription");
        transcribedText = await transcribeAudio(recordedAudio);
        console.log("useAudioRecording: Successfully transcribed audio to text:", transcribedText);
      } else {
        console.error("useAudioRecording: No recorded audio available to transcribe");
        throw new Error("No audio recorded");
      }
      
      return { recordedAudio, transcribedText };
    } catch (error) {
      console.error("useAudioRecording: Error in sendAudio:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao transcrever o áudio. Tente novamente.",
        variant: "destructive",
      });
      return { recordedAudio, transcribedText: null };
    } finally {
      // Reset the recording state after sending
      console.log("useAudioRecording: Resetting recording state to idle after sending");
      cancelAudioRecording(setRecordingState, audioPlayerRef.current);
      audioPlayerRef.current = null;
      setIsPlaying(false);
      setShowStopButton(false);
    }
  };

  // Additional debugging helper function
  const getDebugInfo = () => ({
    recordingState,
    isPlaying,
    showStopButton,
    isTranscribing,
    currentMode,
    learningLanguage,
    hasAudioPlayer: !!audioPlayerRef.current
  });

  return {
    recordingState,
    isPlaying,
    showStopButton,
    isTranscribing,
    handleMicButtonClick,
    stopRecording,
    playAudio,
    cancelAudio,
    sendAudio,
    getDebugInfo // Export debug info for troubleshooting
  };
}
