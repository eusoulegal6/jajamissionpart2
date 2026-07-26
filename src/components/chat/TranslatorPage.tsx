import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Volume2, ArrowRightLeft, Loader, Square } from "lucide-react";
import tradutorIcon from "@/assets/tradutor-icon.png";
import { supabase } from "@/integrations/supabase/client";
import { useAudioRecording } from "@/hooks/use-audio-recording";

type TranslationDirection = "en-pt" | "pt-en";

interface TranslatorPageProps {
  onBack: () => void;
}

const TranslatorPage: React.FC<TranslatorPageProps> = ({ onBack }) => {
  const [direction, setDirection] = useState<TranslationDirection>("en-pt");
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [pendingTranscription, setPendingTranscription] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    recordingState,
    isTranscribing,
    handleMicButtonClick,
    stopRecording,
    sendAudio,
  } = useAudioRecording("tradutor");

  const sourceLanguage = direction === "en-pt" ? "Inglês" : "Português";
  const targetLanguage = direction === "en-pt" ? "Português" : "Inglês";

  // When recording state changes to "preview" and we have pending transcription, process it
  useEffect(() => {
    const processAudio = async () => {
      if (pendingTranscription && recordingState.status === "preview" && recordingState.recordedAudio) {
        setPendingTranscription(false);
        const result = await sendAudio();
        if (result.transcribedText) {
          setInputText(result.transcribedText);
          // Use current direction directly to avoid stale closure
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
    // Swap the texts
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
      // Set flag to process audio when it's ready
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

      // Convert base64 to audio
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
    <div className="flex flex-col min-h-screen w-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-xl font-semibold">Tradutor</h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-4 py-6">
        <div className="w-full max-w-2xl space-y-4">
          {/* Language Selector */}
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-4">
                <div className="flex-1 text-center">
                  <span className="text-lg font-medium text-gray-700">{sourceLanguage}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSwapDirection}
                  className="rounded-full hover:bg-gray-100"
                >
                  <ArrowRightLeft className="h-5 w-5 text-primary" />
                </Button>
                <div className="flex-1 text-center">
                  <span className="text-lg font-medium text-gray-700">{targetLanguage}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Input Section */}
          <Card className="bg-white shadow-sm">
          <CardContent className="p-4 space-y-4">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={direction === "en-pt" ? "Type in English..." : "Digite em português..."}
                className="min-h-[120px] resize-none text-lg"
              />
              <div className="flex items-center justify-between">
                <Button
                  variant={recordingState.status === "recording" ? "destructive" : "ghost"}
                  size="icon"
                  onClick={handleMicPress}
                  disabled={isTranscribing || pendingTranscription}
                  className={`h-16 w-16 rounded-full ${recordingState.status !== "recording" && !isTranscribing && !pendingTranscription ? "bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 shadow-lg shadow-purple-500/30" : ""}`}
                >
                  {isTranscribing || pendingTranscription ? (
                    <Loader className="h-8 w-8 animate-spin" />
                  ) : recordingState.status === "recording" ? (
                    <Square className="h-8 w-8" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-9 w-9">
                      <path fill="white" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                      <path fill="white" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                  )}
                </Button>
                <Button
                  onClick={handleSendClick}
                  disabled={!inputText.trim() || isTranslating}
                  size="icon"
                  className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90"
                >
                  {isTranslating ? (
                    <Loader className="h-8 w-8 animate-spin" />
                  ) : (
                    <img src={tradutorIcon} alt="Traduzir" className="h-10 w-10" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          {(translatedText || isTranslating) && (
            <Card className="bg-white shadow-sm border-2 border-primary/20">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-500">
                    {direction === "en-pt" ? "Tradução em português" : "Translation in English"}
                  </div>
                  {translatedText && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePlayAudio}
                      disabled={isLoadingAudio}
                      className="rounded-full hover:bg-gray-100"
                    >
                      {isLoadingAudio ? (
                        <Loader className="h-5 w-5 animate-spin text-primary" />
                      ) : isPlayingAudio ? (
                        <Square className="h-5 w-5 text-primary" />
                      ) : (
                        <Volume2 className="h-5 w-5 text-primary" />
                      )}
                    </Button>
                  )}
                </div>
                {isTranslating ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <p className="text-lg text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {translatedText}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default TranslatorPage;
