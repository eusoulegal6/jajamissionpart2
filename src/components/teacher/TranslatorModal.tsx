import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Volume2, ArrowRightLeft, Loader, Square, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { useAudioInput } from "@/contexts/AudioInputContext";
import tradutorIcon from "@/assets/tradutor-icon.png";
import sharedAudioIcon from "@/assets/shared-audio-icon.png";

type TranslationDirection = "en-pt" | "pt-en";

interface TranslatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TranslatorModal: React.FC<TranslatorModalProps> = ({ isOpen, onClose }) => {
  const [direction, setDirection] = useState<TranslationDirection>("en-pt");
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [pendingTranscription, setPendingTranscription] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (translatedText && !isTranslating && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [translatedText, isTranslating]);
  const { isTabAudioActive, activateTabAudio, deactivateTabAudio } = useAudioInput();
  const {
    recordingState,
    isTranscribing,
    handleMicButtonClick,
    stopRecording,
    sendAudio,
  } = useAudioRecording("tradutor");

  const sourceLanguage = direction === "en-pt" ? "Inglês" : "Português";
  const targetLanguage = direction === "en-pt" ? "Português" : "Inglês";

  useEffect(() => {
    const processAudio = async () => {
      if (pendingTranscription && recordingState.status === "preview" && recordingState.recordedAudio) {
        setPendingTranscription(false);
        const result = await sendAudio();
        if (result.transcribedText) {
          setInputText(result.transcribedText);
          const currentDirection = direction;
          setIsTranslating(true);
          try {
            const { data, error } = await supabase.functions.invoke("translate-text", {
              body: { 
                text: result.transcribedText.trim(), 
                sourceLanguage: currentDirection === "en-pt" ? "en" : "pt",
                targetLanguage: currentDirection === "en-pt" ? "pt" : "en"
              },
            });
            if (error) {
              console.error("Translation error:", error);
              setTranslatedText("Erro ao traduzir. Tente novamente.");
            } else {
              setTranslatedText(data.translation || "");
            }
          } catch (err) {
            console.error("Translation exception:", err);
            setTranslatedText("Erro ao traduzir. Tente novamente.");
          } finally {
            setIsTranslating(false);
          }
        }
      }
    };
    processAudio();
  }, [recordingState.status, recordingState.recordedAudio, pendingTranscription, direction, sendAudio]);

  const handleSwapDirection = () => {
    setDirection(prev => prev === "en-pt" ? "pt-en" : "en-pt");
    const temp = inputText;
    setInputText(translatedText);
    setTranslatedText(temp);
  };

  const handleTranslate = async (text: string) => {
    if (!text.trim()) return;
    
    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-text", {
        body: { 
          text: text.trim(), 
          sourceLanguage: direction === "en-pt" ? "en" : "pt",
          targetLanguage: direction === "en-pt" ? "pt" : "en"
        },
      });

      if (error) {
        console.error("Translation error:", error);
        setTranslatedText("Erro ao traduzir. Tente novamente.");
        return;
      }

      setTranslatedText(data.translation || "");
    } catch (err) {
      console.error("Translation exception:", err);
      setTranslatedText("Erro ao traduzir. Tente novamente.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleMicPress = () => {
    if (recordingState.status === "recording") {
      setPendingTranscription(true);
      stopRecording();
    } else if (recordingState.status === "idle") {
      handleMicButtonClick();
    }
  };

  const handleSendClick = () => {
    handleTranslate(inputText);
  };

  const handlePlayAudio = async () => {
    if (!translatedText.trim()) return;
    
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingAudio(false);
      return;
    }

    setIsLoadingAudio(true);
    try {
      const { data, error } = await supabase.functions.invoke("speak-elevenlabs", {
        body: { text: translatedText },
      });

      if (error || !data?.audioContent) {
        console.error("TTS error:", error);
        return;
      }

      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.onended = () => setIsPlayingAudio(false);
        audioRef.current.play();
        setIsPlayingAudio(true);
      }
    } catch (err) {
      console.error("TTS exception:", err);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0" hideCloseButton>
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
          <DialogHeader className="flex-1">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <img src={tradutorIcon} alt="Tradutor" className="h-8 w-8" />
              Tradutor
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <button
              onClick={isTabAudioActive ? deactivateTabAudio : activateTabAudio}
              className={`rounded-full h-10 w-10 flex items-center justify-center transition-all duration-200 ${
                isTabAudioActive 
                  ? 'ring-2 ring-red-500 bg-red-100' 
                  : ''
              }`}
              title={isTabAudioActive ? "Disable shared audio" : "Enable shared audio"}
            >
              <img src={sharedAudioIcon} alt="Shared audio" className="h-8 w-8 object-contain" />
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-10 w-10 rounded-full hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Language Selector */}
          <Card className="bg-white shadow-sm border">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-4">
                <div className="flex-1 text-center">
                  <span className="text-2xl font-semibold text-gray-700">{sourceLanguage}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSwapDirection}
                  className="rounded-full hover:bg-gray-100 h-12 w-12"
                >
                  <ArrowRightLeft className="h-7 w-7 text-primary" />
                </Button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-semibold text-gray-700">{targetLanguage}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Input Section */}
          <Card className="bg-white shadow-sm border">
            <CardContent className="p-4 space-y-4">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={direction === "en-pt" ? "Type in English..." : "Digite em português..."}
                className="min-h-[180px] resize-none text-4xl leading-relaxed"
              />
              <div className="flex items-center justify-between">
                <Button
                  variant={recordingState.status === "recording" ? "destructive" : "ghost"}
                  size="icon"
                  onClick={handleMicPress}
                  disabled={isTranscribing || pendingTranscription}
                  className={`h-14 w-14 rounded-full ${recordingState.status !== "recording" && !isTranscribing && !pendingTranscription ? "bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 shadow-lg shadow-purple-500/30" : ""}`}
                >
                  {isTranscribing || pendingTranscription ? (
                    <Loader className="h-7 w-7 animate-spin" />
                  ) : recordingState.status === "recording" ? (
                    <Square className="h-7 w-7" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-8 w-8">
                      <path fill="white" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                      <path fill="white" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                  )}
                </Button>
                <Button
                  onClick={handleSendClick}
                  disabled={!inputText.trim() || isTranslating}
                  size="icon"
                  className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90"
                >
                  {isTranslating ? (
                    <Loader className="h-7 w-7 animate-spin" />
                  ) : (
                    <img src={tradutorIcon} alt="Traduzir" className="h-9 w-9" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          {(translatedText || isTranslating) && (
            <Card ref={outputRef} className="bg-white shadow-sm border-2 border-primary/20">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-base font-medium text-gray-500">
                    {direction === "en-pt" ? "Tradução em português" : "Translation in English"}
                  </div>
                  {translatedText && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePlayAudio}
                      disabled={isLoadingAudio}
                      className="rounded-full hover:bg-gray-100 h-12 w-12"
                    >
                      {isLoadingAudio ? (
                        <Loader className="h-7 w-7 animate-spin text-primary" />
                      ) : isPlayingAudio ? (
                        <Square className="h-7 w-7 text-primary" />
                      ) : (
                        <Volume2 className="h-7 w-7 text-primary" />
                      )}
                    </Button>
                  )}
                </div>
                {isTranslating ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <p className="text-4xl text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {translatedText}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <audio ref={audioRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default TranslatorModal;
