import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Loader2,
  Wand2,
  Copy,
  Check,
  Volume2,
  Pause,
  Play,
  ChevronDown,
  ListChecks,
  SpellCheck,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { base64ToAudioBlob } from "@/utils/base64Utils";
import { VOICE_IDS } from "@/contexts/AccentContext";
import { toast } from "@/hooks/use-toast";

type Mode = "minimal" | "rewrite";

interface CorrectionItem {
  original: string;
  corrected: string;
  explanation: string;
  type?: string;
}

interface AIResult {
  corrected: string;
  corrections: CorrectionItem[];
}

const MAX_CHARS = 6000;

const TextCorrection = () => {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("minimal");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [correctionsOpen, setCorrectionsOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const correctionsRef = useRef<HTMLDivElement | null>(null);


  // audio
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (result && !isLoading && resultRef.current) {
      const t = setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [result, isLoading]);

  useEffect(() => {
    if (correctionsOpen && correctionsRef.current) {
      const t = setTimeout(() => {
        correctionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
      return () => clearTimeout(t);
    }
  }, [correctionsOpen]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const handleGenerate = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_CHARS) {
      toast({ title: "Texto muito longo", description: `Máximo de ${MAX_CHARS} caracteres.`, variant: "destructive" });
      return;
    }
    stopAudio();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setResult(null);
    setIsLoading(true);

    const systemPrompt =
      mode === "minimal"
        ? `You are an expert English proofreader. Fix ONLY clear grammar, spelling, verb tense, agreement, and word-choice errors in the user's text. Keep the original style, voice, structure, and vocabulary as close as possible. Do NOT rewrite or restructure. Ignore punctuation and capitalization issues — do not flag or change them.

Return a STRICT JSON object (no markdown, no code fences) with this exact shape:
{
  "corrected": "the full corrected English text",
  "corrections": [
    {
      "original": "exact wrong snippet from the user's text",
      "corrected": "the fixed snippet",
      "explanation": "short explanation in Portuguese (Brasil) why it was wrong and why the fix is right",
      "type": "grammar | spelling | verb tense | agreement | word choice"
    }
  ]
}

If there are no errors, return "corrections": []. Always respond with valid JSON only.`
        : `You are an expert English writing coach. Rewrite the user's English text so it is clearer, more natural, and well-structured — KEEPING THE SAME ORIGINAL IDEA, meaning and intent. Improve flow, clarity, word choice, and structure. Do not add new information that wasn't implied. The output must still be in English.

Return a STRICT JSON object (no markdown, no code fences) with this exact shape:
{
  "corrected": "the rewritten, improved English text",
  "corrections": [
    {
      "original": "snippet from the original text",
      "corrected": "how it became in the rewrite",
      "explanation": "short explanation in Portuguese (Brasil) of WHY this change improves clarity, style, naturalness or structure",
      "type": "clareza | naturalidade | estrutura | vocabulário | gramática"
    }
  ]
}

List the most relevant 4–10 changes (not every tiny tweak). Always respond with valid JSON only.`;

    try {
      const { data, error } = await supabase.functions.invoke("chatgpt", {
        body: {
          model: "gpt-5.4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: trimmed },
          ],
        },
      });
      if (error) throw error;

      let parsed: AIResult | null = null;
      const reply = data?.reply;
      if (reply && typeof reply === "object" && "corrected" in reply) {
        parsed = reply as AIResult;
      } else if (typeof reply === "string") {
        const cleaned = reply.replace(/```json|```/g, "").trim();
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          parsed = { corrected: cleaned, corrections: [] };
        }
      }
      if (!parsed || !parsed.corrected) throw new Error("Resposta inválida da IA");
      if (!Array.isArray(parsed.corrections)) parsed.corrections = [];
      setResult(parsed);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro", description: e.message || "Não foi possível processar o texto.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.corrected) return;
    try {
      await navigator.clipboard.writeText(result.corrected);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "Erro", description: "Não foi possível copiar.", variant: "destructive" });
    }
  };

  const handleGenerateAudio = async () => {
    if (!result?.corrected) return;
    if (audioUrl) {
      if (isPlaying) {
        stopAudio();
      } else {
        const a = new Audio(audioUrl);
        a.onended = () => setIsPlaying(false);
        audioRef.current = a;
        setIsPlaying(true);
        a.play().catch(() => setIsPlaying(false));
      }
      return;
    }
    setIsLoadingAudio(true);
    try {
      const { data, error } = await supabase.functions.invoke("speak-elevenlabs", {
        body: { text: result.corrected, voiceId: VOICE_IDS.american },
      });
      if (error) throw error;
      if (!data?.audioContent) throw new Error("Resposta inválida do áudio");
      const blob = base64ToAudioBlob(data.audioContent);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      const a = new Audio(url);
      a.onended = () => setIsPlaying(false);
      audioRef.current = a;
      setIsPlaying(true);
      a.play().catch(() => setIsPlaying(false));
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro", description: e.message || "Não foi possível gerar o áudio.", variant: "destructive" });
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const charsLeft = MAX_CHARS - text.length;

  const typeColor = (t?: string) => {
    const k = (t || "").toLowerCase();
    if (k.includes("spell")) return "bg-rose-50 text-rose-700 border-rose-200";
    if (k.includes("gram")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (k.includes("tense") || k.includes("verb")) return "bg-violet-50 text-violet-700 border-violet-200";
    if (k.includes("agree")) return "bg-sky-50 text-sky-700 border-sky-200";
    if (k.includes("word") || k.includes("vocab")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (k.includes("clar")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (k.includes("natur")) return "bg-teal-50 text-teal-700 border-teal-200";
    if (k.includes("estrut") || k.includes("struct")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

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
            <Wand2 className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-[#202123]">Correção de Texto</h1>
          <p className="text-[#6e6e80] mt-2">
            Cole um texto em inglês e receba uma versão corrigida ou reescrita, com explicações.
          </p>
        </div>

        <Card className="rounded-2xl shadow-sm border-[#e8e8e8]">
          <CardContent className="p-5 md:p-6 space-y-5">
            {/* Textarea */}
            <div>
              <label className="block text-sm font-semibold text-[#202123] mb-2">Seu texto em inglês</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Cole aqui o texto em inglês que você quer corrigir ou melhorar..."
                className="min-h-[260px] max-h-[400px] text-base resize-y overflow-y-auto"
                maxLength={MAX_CHARS}
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${charsLeft < 200 ? "text-orange-600" : "text-gray-500"}`}>
                  {text.length} / {MAX_CHARS}
                </span>
              </div>
            </div>

            {/* Mode selector */}
            <div>
              <label className="block text-sm font-semibold text-[#202123] mb-2">Tipo de correção</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode("minimal")}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition ${
                    mode === "minimal"
                      ? "border-[#10a37f] bg-[#10a37f]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <SpellCheck className="h-5 w-5 mt-0.5 text-[#10a37f] shrink-0" />
                  <div>
                    <div className="font-semibold text-[#202123]">Correção mínima</div>
                    <div className="text-xs text-[#6e6e80] mt-0.5">
                      Corrige apenas gramática e ortografia, mantendo seu texto original.
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("rewrite")}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition ${
                    mode === "rewrite"
                      ? "border-[#10a37f] bg-[#10a37f]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Sparkles className="h-5 w-5 mt-0.5 text-[#10a37f] shrink-0" />
                  <div>
                    <div className="font-semibold text-[#202123]">Reescrita</div>
                    <div className="text-xs text-[#6e6e80] mt-0.5">
                      Reescreve o texto de forma mais clara e natural, com a mesma ideia.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={isLoading || !text.trim()}
              className="w-full h-14 text-lg font-semibold bg-[#10a37f] hover:bg-[#0d8567] text-white rounded-xl"
            >
              {isLoading ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processando...</>
              ) : (
                <><Wand2 className="h-5 w-5 mr-2" /> {mode === "minimal" ? "Corrigir texto" : "Reescrever texto"}</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <div ref={resultRef} className="mt-6 space-y-4">
            <Card className="rounded-2xl shadow-sm border-[#10a37f]/30 bg-white">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-[#10a37f]/10 text-[#10a37f] flex items-center justify-center">
                    <Check className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-[#202123]">
                    {mode === "minimal" ? "Texto corrigido" : "Nova versão"}
                  </h2>
                </div>

                <div className="rounded-xl bg-[#f7f7f8] border border-[#e8e8e8] p-4 text-[17px] leading-relaxed text-[#202123] whitespace-pre-wrap">
                  {result.corrected}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    className="h-12 rounded-xl gap-2"
                  >
                    {copied ? <><Check className="h-4 w-4" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar</>}
                  </Button>
                  <Button
                    onClick={handleGenerateAudio}
                    disabled={isLoadingAudio}
                    className="h-12 rounded-xl gap-2 bg-[#10a37f] hover:bg-[#0d8567] text-white"
                  >
                    {isLoadingAudio ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</>
                    ) : isPlaying ? (
                      <><Pause className="h-4 w-4" /> Pausar</>
                    ) : audioUrl ? (
                      <><Play className="h-4 w-4" /> Tocar áudio</>
                    ) : (
                      <><Volume2 className="h-4 w-4" /> Gerar áudio</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Corrections collapsible */}
            <Card ref={correctionsRef} className="rounded-2xl shadow-sm border-[#e8e8e8]">
              <Collapsible open={correctionsOpen} onOpenChange={setCorrectionsOpen}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-5 md:p-6 hover:bg-gray-50 transition rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                        <ListChecks className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-base font-bold text-[#202123]">Correções</h3>
                        <p className="text-xs text-[#6e6e80]">
                          {result.corrections.length === 0
                            ? "Nenhuma correção necessária"
                            : `${result.corrections.length} ${result.corrections.length === 1 ? "ajuste explicado" : "ajustes explicados"}`}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="h-5 w-5 text-gray-500 transition-transform [&[data-state=open]]:rotate-180" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-5 md:px-6 pb-5 md:pb-6 space-y-3">
                    {result.corrections.length === 0 && (
                      <div className="text-sm text-[#6e6e80] italic">
                        Seu texto está ótimo — nada a ajustar.
                      </div>
                    )}
                    {result.corrections.map((c, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-1.5 text-[15px]">
                          <div>
                            <span className="text-rose-700 font-semibold">Antes: </span>
                            <span className="line-through text-rose-700/80">{c.original}</span>
                          </div>
                          <div>
                            <span className="text-emerald-700 font-semibold">Depois: </span>
                            <span className="text-emerald-700 font-medium">{c.corrected}</span>
                          </div>
                        </div>
                        {c.explanation && (
                          <p className="mt-3 text-sm text-[#374151] leading-relaxed">
                            <span className="font-semibold text-[#202123]">Por quê: </span>
                            {c.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextCorrection;
