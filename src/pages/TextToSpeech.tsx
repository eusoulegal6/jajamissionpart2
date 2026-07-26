import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Play, Pause, Turtle, RotateCcw, Loader2, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { base64ToAudioBlob } from "@/utils/base64Utils";
import { VOICE_IDS } from "@/contexts/AccentContext";
import { toast } from "@/hooks/use-toast";

type Accent = "american" | "british";

const MAX_CHARS = 5000;

const TextToSpeech = () => {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [accent, setAccent] = useState<Accent>("american");
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingSlow, setIsPlayingSlow] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const generatedKey = useRef<string>("");

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsPlayingSlow(false);
  };

  const generate = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_CHARS) {
      toast({ title: "Texto muito longo", description: `Máximo de ${MAX_CHARS} caracteres.`, variant: "destructive" });
      return;
    }
    stopAudio();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("speak-elevenlabs", {
        body: { text: trimmed, voiceId: VOICE_IDS[accent] },
      });
      if (error) throw error;
      if (!data?.audioContent) throw new Error("Resposta inválida do serviço de áudio");
      const blob = base64ToAudioBlob(data.audioContent);
      const url = URL.createObjectURL(blob);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(url);
      generatedKey.current = `${accent}::${trimmed}`;
      // Auto-play once generated
      setTimeout(() => playAt(1, url), 50);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro", description: e.message || "Não foi possível gerar o áudio.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const playAt = (rate: number, urlOverride?: string) => {
    const url = urlOverride || audioUrl;
    if (!url) return;
    stopAudio();
    const a = new Audio(url);
    a.playbackRate = rate;
    a.onended = () => {
      setIsPlaying(false);
      setIsPlayingSlow(false);
    };
    a.onerror = () => {
      setIsPlaying(false);
      setIsPlayingSlow(false);
      toast({ title: "Erro", description: "Falha ao reproduzir o áudio.", variant: "destructive" });
    };
    audioRef.current = a;
    if (rate < 1) setIsPlayingSlow(true);
    else setIsPlaying(true);
    a.play().catch(() => {
      setIsPlaying(false);
      setIsPlayingSlow(false);
    });
  };

  const handlePlayPause = () => {
    if (isPlaying || isPlayingSlow) {
      stopAudio();
      return;
    }
    playAt(1);
  };

  const handleSlow = () => {
    if (isPlayingSlow) {
      stopAudio();
      return;
    }
    playAt(0.6);
  };

  const handleReplay = () => playAt(1);

  const charsLeft = MAX_CHARS - text.length;
  const hasFreshAudio = audioUrl && generatedKey.current === `${accent}::${text.trim()}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#10a37f]/10 text-[#10a37f] mb-3">
            <Volume2 className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-[#202123]">Texto para Voz</h1>
          <p className="text-[#6e6e80] mt-2">
            Digite ou cole um texto em inglês e ouça com pronúncia natural.
          </p>
        </div>

        <Card className="rounded-2xl shadow-sm border-[#e8e8e8]">
          <CardContent className="p-5 md:p-6 space-y-5">
            {/* Accent selector */}
            <div>
              <label className="block text-sm font-semibold text-[#202123] mb-2">Sotaque</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccent("american")}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition ${
                    accent === "american"
                      ? "border-[#10a37f] bg-[#10a37f]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-3xl">🇺🇸</span>
                  <span className="font-medium">Americano</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccent("british")}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition ${
                    accent === "british"
                      ? "border-[#10a37f] bg-[#10a37f]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-3xl">🇬🇧</span>
                  <span className="font-medium">Britânico</span>
                </button>
              </div>
            </div>

            {/* Textarea */}
            <div>
              <label className="block text-sm font-semibold text-[#202123] mb-2">Texto</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite ou cole aqui o texto em inglês que deseja ouvir..."
                className="min-h-[260px] max-h-[400px] text-base resize-y overflow-y-auto"
                maxLength={MAX_CHARS}
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${charsLeft < 200 ? "text-orange-600" : "text-gray-500"}`}>
                  {text.length} / {MAX_CHARS}
                </span>
              </div>
            </div>

            {/* Generate button */}
            <Button
              onClick={generate}
              disabled={isLoading || !text.trim()}
              className="w-full h-14 text-lg font-semibold bg-[#10a37f] hover:bg-[#0d8567] text-white rounded-xl"
            >
              {isLoading ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Gerando áudio...</>
              ) : (
                <><Volume2 className="h-5 w-5 mr-2" /> Gerar e ouvir</>
              )}
            </Button>

            {/* Playback controls */}
            {hasFreshAudio && (
              <div className="grid grid-cols-3 gap-3 pt-1">
                <Button
                  onClick={handlePlayPause}
                  variant="outline"
                  className="h-14 rounded-xl flex-col gap-1"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  <span className="text-xs">{isPlaying ? "Pausar" : "Tocar"}</span>
                </Button>
                <Button
                  onClick={handleReplay}
                  variant="outline"
                  className="h-14 rounded-xl flex-col gap-1"
                >
                  <RotateCcw className="h-5 w-5" />
                  <span className="text-xs">Repetir</span>
                </Button>
                <Button
                  onClick={handleSlow}
                  variant="outline"
                  className={`h-14 rounded-xl flex-col gap-1 ${isPlayingSlow ? "bg-[#10a37f]/10 border-[#10a37f]" : ""}`}
                >
                  <Turtle className="h-5 w-5" />
                  <span className="text-xs">{isPlayingSlow ? "Parar" : "Devagar"}</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TextToSpeech;
