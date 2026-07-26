import React, { useMemo, useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { base64ToAudioBlob } from "@/utils/base64Utils";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { VOICE_IDS } from "@/contexts/AccentContext";
import { Loader2, Volume2, Turtle, Languages } from "lucide-react";
import { isMultiWordPhrase } from "@/utils/multiWordPhrases";

interface ValidationResult {
  valid: boolean;
  normalized: string;
  suggestions: string[];
}

const PronunciationAssistant: React.FC = () => {
  const { learningLanguage } = useLanguage();
  const [step, setStep] = useState<"input" | "listen">("input");
  const [wordInput, setWordInput] = useState("");
  const [selectedWord, setSelectedWord] = useState<string>("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Meaning/translation state
  const [meanings, setMeanings] = useState<string[]>([]);
  const [meaningLoading, setMeaningLoading] = useState(false);

  // Translation section state
  const [ptInput, setPtInput] = useState("");
  const [translatedWord, setTranslatedWord] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  // TTS hooks for each accent (normal speed)
  const ttsUS = useTextToSpeech(VOICE_IDS.american);
  const ttsUK = useTextToSpeech(VOICE_IDS.british);

  // Local audio cache for slow playback
  const slowCache = useRef<Map<string, string>>(new Map());
  const [slowLoading, setSlowLoading] = useState<Record<string, boolean>>({});

  const langLabel = useMemo(() => (learningLanguage === "es" ? "espanhol" : "inglês"), [learningLanguage]);

  const validateWord = async () => {
    setChecking(true);
    setError(null);
    const inputText = wordInput.trim();
    
    try {
      const { data, error } = await supabase.functions.invoke("validate-word", {
        body: { word: inputText, language: learningLanguage },
      });
      if (error) throw error;
      const res = data as ValidationResult;
      // Auto-proceed: use normalized if valid, first suggestion if not, or raw input as fallback
      if (res.valid) {
        proceedWith(res.normalized);
      } else if (res.suggestions?.length > 0) {
        proceedWith(res.suggestions[0]);
      } else {
        // Even if not validated, let the user hear it
        proceedWith(inputText);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to validate phrase");
    } finally {
      setChecking(false);
    }
  };

  const proceedWith = (word: string) => {
    const normalized = word;
    setSelectedWord(normalized);
    setMeanings([]);
    setStep("listen");
  };

  // Fetch meaning when entering listen step
  useEffect(() => {
    if (step !== "listen" || !selectedWord) return;

    const fetchMeaning = async () => {
      setMeaningLoading(true);
      try {
        const wordCount = selectedWord.trim().split(/\s+/).length;
        const isPhrase = wordCount > 2;

        if (isPhrase) {
          // Use translate-text for phrases
          const { data, error } = await supabase.functions.invoke("translate-text", {
            body: {
              text: selectedWord,
              sourceLanguage: learningLanguage === "es" ? "es" : "en",
              targetLanguage: "pt",
            },
          });
          if (error) throw error;
          if (data?.translation) {
            setMeanings([data.translation]);
          }
        } else {
          // Use translate-word for 1-2 words (returns multiple options)
          const { data, error } = await supabase.functions.invoke("translate-word", {
            body: { word: selectedWord, language: learningLanguage },
          });
          if (error) throw error;
          if (data?.translation) {
            const options = data.translation.split(" / ").map((t: string) => t.trim()).filter(Boolean);
            setMeanings(options.slice(0, 3));
          }
        }
      } catch (e) {
        console.error("Failed to fetch meaning:", e);
      } finally {
        setMeaningLoading(false);
      }
    };

    fetchMeaning();
  }, [step, selectedWord, learningLanguage]);

  const getSlowAudioUrl = async (voiceId: string): Promise<string> => {
    const key = `${voiceId}:${selectedWord}`;
    if (slowCache.current.has(key)) return slowCache.current.get(key)!;

    setSlowLoading((p) => ({ ...p, [key]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("speak-elevenlabs", {
        body: { text: selectedWord, voiceId },
      });
      if (error) throw error;
      if (!data?.audioContent) throw new Error("Invalid audio response");
      const blob = base64ToAudioBlob(data.audioContent);
      const url = URL.createObjectURL(blob);
      slowCache.current.set(key, url);
      return url;
    } finally {
      setSlowLoading((p) => ({ ...p, [key]: false }));
    }
  };

  const playSlow = async (voiceId: string) => {
    const url = await getSlowAudioUrl(voiceId);
    const audio = new Audio(url);
    audio.playbackRate = 0.5;
    await audio.play();
  };

  const handleTranslate = async () => {
    if (!ptInput.trim()) return;
    setIsTranslating(true);
    setTranslateError(null);
    setTranslatedWord("");
    try {
      const targetLang = learningLanguage === "es" ? "es" : "en";
      const { data, error } = await supabase.functions.invoke("translate-text", {
        body: {
          text: ptInput.trim(),
          sourceLanguage: "pt",
          targetLanguage: targetLang,
        },
      });
      if (error) throw error;
      if (data?.translation) {
        setTranslatedWord(data.translation);
      }
    } catch (e: any) {
      setTranslateError(e?.message || "Erro ao traduzir");
    } finally {
      setIsTranslating(false);
    }
  };

  // Slow playback for translated word
  const getSlowAudioUrlForTranslated = async (voiceId: string): Promise<string> => {
    const key = `translated:${voiceId}:${translatedWord}`;
    if (slowCache.current.has(key)) return slowCache.current.get(key)!;

    setSlowLoading((p) => ({ ...p, [key]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("speak-elevenlabs", {
        body: { text: translatedWord, voiceId },
      });
      if (error) throw error;
      if (!data?.audioContent) throw new Error("Invalid audio response");
      const blob = base64ToAudioBlob(data.audioContent);
      const url = URL.createObjectURL(blob);
      slowCache.current.set(key, url);
      return url;
    } finally {
      setSlowLoading((p) => ({ ...p, [key]: false }));
    }
  };

  const playSlowTranslated = async (voiceId: string) => {
    const url = await getSlowAudioUrlForTranslated(voiceId);
    const audio = new Audio(url);
    audio.playbackRate = 0.5;
    await audio.play();
  };

  return (
    <div className="h-full w-full flex flex-col items-center">
      <div className="w-full max-w-2xl p-4 space-y-5">
        {step === "input" && (
          <>
            {/* Main pronunciation input */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Pronúncia</h2>
                <p className="text-sm text-muted-foreground">Digite uma palavra ou frase em {langLabel} para verificar a ortografia e ouvir a pronúncia.</p>
                <p className="text-xs text-muted-foreground italic">Não se preocupe em escrever perfeitamente, vamos te ajudar!</p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder={learningLanguage === "es" ? "Escribe una palabra o expresión" : "Type a word or phrase"}
                  className="h-11"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") validateWord();
                  }}
                />
                <Button onClick={validateWord} disabled={!wordInput.trim() || checking} className="h-11 px-5">
                  {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
                </Button>
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

            </div>

            <Separator />

            {/* Translation helper section */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Não sabe a palavra?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Digite em português e vamos te ajudar!
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={ptInput}
                  onChange={(e) => setPtInput(e.target.value)}
                  placeholder="Digite em português..."
                  className="h-11"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTranslate();
                  }}
                />
                <Button onClick={handleTranslate} disabled={!ptInput.trim() || isTranslating} className="h-11 px-5">
                  {isTranslating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Traduzir"}
                </Button>
              </div>

              {translateError && <p className="text-destructive text-sm">{translateError}</p>}

              {translatedWord && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Inglês:</p>
                    <p className="text-2xl font-bold text-foreground">{translatedWord}</p>
                  </div>

                  {/* Accent cards for translated word */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border p-4 space-y-3">
                      <h3 className="font-semibold text-center"><span className="text-2xl">🇺🇸</span> American</h3>
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" className="flex-1 gap-2" onClick={() => ttsUS.handleSpeakMessage(100, translatedWord)}>
                          <Volume2 className="h-4 w-4" /> Normal
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => playSlowTranslated(VOICE_IDS.american)} disabled={slowLoading[`translated:${VOICE_IDS.american}:${translatedWord}`] === true}>
                          {slowLoading[`translated:${VOICE_IDS.american}:${translatedWord}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Turtle className="h-4 w-4" /> Slow</>}
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border p-4 space-y-3">
                      <h3 className="font-semibold text-center"><span className="text-2xl">🇬🇧</span> British</h3>
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" className="flex-1 gap-2" onClick={() => ttsUK.handleSpeakMessage(101, translatedWord)}>
                          <Volume2 className="h-4 w-4" /> Normal
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => playSlowTranslated(VOICE_IDS.british)} disabled={slowLoading[`translated:${VOICE_IDS.british}:${translatedWord}`] === true}>
                          {slowLoading[`translated:${VOICE_IDS.british}:${translatedWord}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Turtle className="h-4 w-4" /> Slow</>}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {step === "listen" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">"{selectedWord}"</h2>
              <Button variant="outline" size="sm" onClick={() => setStep("input")}>← Trocar palavra</Button>
            </div>

            {/* Accent cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* American */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="font-bold text-lg text-center"><span className="text-3xl">🇺🇸</span> American</h3>
                <div className="flex flex-col gap-2">
                  <Button className="w-full h-12 text-base gap-2" onClick={() => ttsUS.handleSpeakMessage(0, selectedWord)}>
                    <Volume2 className="h-5 w-5" /> Normal
                  </Button>
                  <Button variant="outline" className="w-full h-10 gap-2" onClick={() => playSlow(VOICE_IDS.american)} disabled={slowLoading[`${VOICE_IDS.american}:${selectedWord}`] === true}>
                    {slowLoading[`${VOICE_IDS.american}:${selectedWord}`] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><Turtle className="h-4 w-4" /> Slow</>
                    )}
                  </Button>
                </div>
              </div>

              {/* British */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="font-bold text-lg text-center"><span className="text-3xl">🇬🇧</span> British</h3>
                <div className="flex flex-col gap-2">
                  <Button className="w-full h-12 text-base gap-2" onClick={() => ttsUK.handleSpeakMessage(1, selectedWord)}>
                    <Volume2 className="h-5 w-5" /> Normal
                  </Button>
                  <Button variant="outline" className="w-full h-10 gap-2" onClick={() => playSlow(VOICE_IDS.british)} disabled={slowLoading[`${VOICE_IDS.british}:${selectedWord}`] === true}>
                    {slowLoading[`${VOICE_IDS.british}:${selectedWord}`] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><Turtle className="h-4 w-4" /> Slow</>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Meaning section */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg">📖 Significado</h3>
              {meaningLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Buscando tradução...
                </div>
              ) : meanings.length > 0 ? (
                meanings.length === 1 ? (
                  <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                    <p className="text-xl font-bold text-foreground">{meanings[0]}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {meanings.map((m, i) => (
                      <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                        <span className="text-xs text-muted-foreground mr-2">{i + 1}.</span>
                        <span className="text-lg font-semibold text-foreground">{m}</span>
                      </div>
                    ))}
                  </div>
                )
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PronunciationAssistant;
