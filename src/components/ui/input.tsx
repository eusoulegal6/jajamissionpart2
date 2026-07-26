
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Mic, Square, Play, Send, Trash2 } from "lucide-react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

// Audio Recording Types and States
export interface AudioRecordingState {
  status: 'idle' | 'recording' | 'preview';
  recordedAudio: Blob | null;
  mediaRecorder: MediaRecorder | null;
  stream: MediaStream | null;
}

export const initialAudioRecordingState: AudioRecordingState = {
  status: 'idle',
  recordedAudio: null,
  mediaRecorder: null,
  stream: null,
};

// Audio Recording Functions
export const startRecording = async (setRecordingState: React.Dispatch<React.SetStateAction<AudioRecordingState>>) => {
  try {
    console.log("Starting audio recording...");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      console.log("Recording stopped, audio blob created:", audioBlob.size, "bytes");
      
      setRecordingState(prevState => ({
        ...prevState,
        status: 'preview',
        recordedAudio: audioBlob,
        mediaRecorder: null,
        stream: null
      }));
      
      // Stop all tracks to release microphone
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    console.log("MediaRecorder started successfully");
    
    setRecordingState({
      status: 'recording',
      recordedAudio: null,
      mediaRecorder,
      stream
    });
  } catch (error) {
    console.error("Failed to start recording:", error);
    throw error;
  }
};

// Start recording with a provided stream (e.g., tab audio). Does NOT stop source tracks on finish.
export const startRecordingWithStream = async (
  externalStream: MediaStream,
  setRecordingState: React.Dispatch<React.SetStateAction<AudioRecordingState>>
) => {
  try {
    console.log("Starting audio recording with provided stream...");
    const mediaRecorder = new MediaRecorder(externalStream);
    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      console.log("Recording stopped (external stream), audio blob:", audioBlob.size, "bytes");
      
      setRecordingState(prevState => ({
        ...prevState,
        status: 'preview',
        recordedAudio: audioBlob,
        mediaRecorder: null,
        stream: null
      }));
      // IMPORTANT: Do not stop externalStream tracks here; it's managed globally
    };

    mediaRecorder.start();
    console.log("MediaRecorder started successfully with external stream");
    
    setRecordingState({
      status: 'recording',
      recordedAudio: null,
      mediaRecorder,
      stream: externalStream
    });
  } catch (error) {
    console.error("Failed to start recording with provided stream:", error);
    throw error;
  }
};

export const stopRecording = (recordingState: AudioRecordingState) => {
  console.log("Stopping recording, current state:", recordingState.status);
  
  if (recordingState.mediaRecorder && recordingState.status === 'recording') {
    recordingState.mediaRecorder.stop();
    console.log("MediaRecorder.stop() called");
  }
};

export const playAudio = (audioBlob: Blob): HTMLAudioElement => {
  console.log("Playing audio blob:", audioBlob.size, "bytes");
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
  return audio;
};

export const cancelRecording = (
  setRecordingState: React.Dispatch<React.SetStateAction<AudioRecordingState>>,
  audioPlayer: HTMLAudioElement | null
) => {
  console.log("Canceling recording/preview");
  
  // Stop audio player if playing
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
  }
  
  // Reset to initial idle state
  setRecordingState(initialAudioRecordingState);
};

// Recording Indicator Component
export const RecordingIndicator: React.FC = () => (
  <div className="flex items-center justify-center py-4">
    <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full">
      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      <span className="text-sm font-medium">Recording...</span>
    </div>
  </div>
);

// Stop Recording Button Component
export const StopRecordingButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <Button
    type="button"
    onClick={onClick}
    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-12 h-12"
    size="icon"
  >
    <Square className="h-6 w-6 fill-current" />
  </Button>
);

// Audio Preview Component
export const AudioPreview: React.FC<{
  isPlaying: boolean;
  onPlay: () => void;
  onSend: () => void;
  onDelete: () => void;
  isTranscribing?: boolean;
}> = ({ isPlaying, onPlay, onSend, onDelete, isTranscribing = false }) => (
  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
    <Button
      type="button"
      onClick={onPlay}
      disabled={isPlaying || isTranscribing}
      className="bg-blue-500 hover:bg-blue-600 text-white rounded-full"
      size="icon"
    >
      <Play className="h-4 w-4" />
    </Button>
    
    <div className="flex-grow">
      <p className="text-sm text-gray-600">
        {isTranscribing ? "Transcribing audio..." : "Audio recorded"}
      </p>
    </div>
    
    <Button
      type="button"
      onClick={onSend}
      disabled={isPlaying || isTranscribing}
      className="bg-green-500 hover:bg-green-600 text-white rounded-full"
      size="icon"
    >
      <Send className="h-4 w-4" />
    </Button>
    
    <Button
      type="button"
      onClick={onDelete}
      disabled={isPlaying || isTranscribing}
      variant="outline"
      className="text-red-500 hover:text-red-600 border-red-300 hover:border-red-400 rounded-full"
      size="icon"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);

export { Input }
