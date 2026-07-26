import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Heart,
  HelpCircle,
  Home,
  Lightbulb,
  Loader,
  MessageSquareQuote,
  PenLine,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserRound,
  Volume2,
  WandSparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { base64ToAudioBlob } from "@/utils/base64Utils";

const renderBold = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

interface FeedbackCard {
  type: "response" | "tips" | "suggestions" | "score";
  title: string;
  content: string;
}

export function parseFeedbackCards(text: string): FeedbackCard[] | null {
  const hasResponseBlocks = /📝\s*\*{0,2}(?:Resposta|Response)\s*\d+/i.test(text);
  const hasInterviewReview = /📝\s*\*{0,2}(?:Interview Review|Revisão da Entrevista|Revisión de la Entrevista)/i.test(text);
  if (!hasResponseBlocks && !hasInterviewReview) return null;

  const cards: FeedbackCard[] = [];

  if (hasResponseBlocks) {
    const responsePattern = /📝\s*\*{0,2}(?:Resposta|Response)\s*(\d+)\*{0,2}/gi;
    const matches = [...text.matchAll(responsePattern)];

    for (let i = 0; i < matches.length; i++) {
      const startIdx = matches[i].index!;
      const endIdx = i < matches.length - 1 ? matches[i + 1].index! : undefined;
      const section = text.slice(startIdx, endIdx).trim();
      const scoreIdx = section.indexOf("✅");

      if (scoreIdx > 0) {
        cards.push({
          type: "response",
          title: matches[i][0].replace("📝", "").replace(/\*\*/g, "").trim(),
          content: section.slice(0, scoreIdx).replace(matches[i][0], "").trim(),
        });
        cards.push({
          type: "score",
          title: "Resultado Final",
          content: section.slice(scoreIdx).trim(),
        });
      } else {
        cards.push({
          type: "response",
          title: matches[i][0].replace("📝", "").replace(/\*\*/g, "").trim(),
          content: section.replace(matches[i][0], "").trim(),
        });
      }
    }

    if (!cards.some((c) => c.type === "score")) {
      const scoreMatch = text.match(/✅\s*\*{0,2}(?:Nota Geral|Overall Score|Puntuación General)[:\s]*\*{0,2}[\s\S]*/i);
      if (scoreMatch) {
        cards.push({
          type: "score",
          title: "Resultado Final",
          content: scoreMatch[0].trim(),
        });
      }
    }
  } else if (hasInterviewReview) {
    const questionPattern = /\*{0,2}(?:Question|Pergunta|Pregunta)\s*(\d+)?[:\s]*\*{0,2}/gi;
    const matches = [...text.matchAll(questionPattern)];
    const tipsPatterns = [
      /📘\s*\*{0,2}(?:English & Grammar Tips|Dicas de Inglês e Gramática|Consejos de Español y Gramática)\*{0,2}/i,
      /💼\s*\*{0,2}(?:Job Interview Suggestions|Sugestões para a Entrevista|Sugerencias para la Entrevista)\*{0,2}/i,
    ];

    let questionsEndIdx = text.length;
    const tipsSections: { idx: number; title: string; type: "tips" | "suggestions" }[] = [];

    for (const pattern of tipsPatterns) {
      const match = text.match(pattern);
      if (match && match.index !== undefined) {
        const type = pattern.source.includes("Tips|Dicas|Consejos") ? "tips" : "suggestions";
        tipsSections.push({ idx: match.index, title: match[0].replace(/📘|💼/g, "").replace(/\*\*/g, "").trim(), type });
        if (match.index < questionsEndIdx) questionsEndIdx = match.index;
      }
    }

    tipsSections.sort((a, b) => a.idx - b.idx);

    // Try to split by "Pergunta:" blocks (new format) or "Question N:" blocks
    const perguntaBlockPattern = /\*{0,2}Pergunta:\*{0,2}/gi;
    const perguntaMatches = [...text.matchAll(perguntaBlockPattern)];
    
    if (perguntaMatches.length > 0) {
      // New format: split by **Pergunta:** blocks
      for (let i = 0; i < perguntaMatches.length; i++) {
        const startIdx = perguntaMatches[i].index!;
        const endIdx = i < perguntaMatches.length - 1 ? perguntaMatches[i + 1].index! : questionsEndIdx;
        cards.push({
          type: "response",
          title: `Pergunta ${i + 1}`,
          content: text.slice(startIdx, endIdx).trim(),
        });
      }
    } else {
      // Legacy format: Question 1, Question 2, etc.
      for (let i = 0; i < matches.length; i++) {
        const startIdx = matches[i].index!;
        const endIdx = i < matches.length - 1 ? matches[i + 1].index! : questionsEndIdx;
        cards.push({
          type: "response",
          title: `Pergunta ${matches[i][1] || i + 1}`,
          content: text.slice(startIdx, endIdx).trim(),
        });
      }
    }

    for (let i = 0; i < tipsSections.length; i++) {
      const startIdx = tipsSections[i].idx;
      const endIdx = i < tipsSections.length - 1 ? tipsSections[i + 1].idx : text.length;
      const section = text.slice(startIdx, endIdx).trim();
      cards.push({
        type: tipsSections[i].type,
        title: tipsSections[i].title,
        content: section.replace(/^📘|^💼/, "").replace(/\*\*[^*]+\*\*/, "").trim(),
      });
    }
  }

  return cards.length > 0 ? cards : null;
}

type ContentSectionType =
  | "question"
  | "student"
  | "improved"
  | "grammar"
  | "context"
  | "posture"
  | "interview_tip"
  | "teacher"
  | "tips"
  | "score"
  | "text";

interface ContentSection {
  type: ContentSectionType;
  label: string;
  body: string;
}

const detectSectionType = (label: string): ContentSectionType => {
  const normalized = label.toLowerCase();

  if (/pergunta|question|pregunta/.test(normalized)) return "question";
  if (/resposta do aluno|student'?s answer|student answer|your answer|your response|tu respuesta|sua resposta/.test(normalized)) return "student";
  if (/vers[aã]o melhorada|improved version|versi[oó]n mejorada|como o professor corrigiria|como um nativo falaria|corrected version|vers[aã]o corrigida|how a native would say/.test(normalized)) return "improved";
  if (/corre[cç][oõ]es gramaticais|correções gramaticais|grammar corrections/.test(normalized)) return "grammar";
  if (/corre[cç][oõ]es de contexto|correções de contexto|context corrections/.test(normalized)) return "context";
  if (/sugest[aã]o para entrevista|interview suggestion/i.test(normalized)) return "interview_tip";
  if (/feedback do professor|teacher feedback|explica[cç][aã]o do professor|clarity & fluency|clareza e flu[eê]ncia/.test(normalized)) return "teacher";
  if (/nota de postura|politeness score/i.test(normalized)) return "posture";
  if (/nota de gram[aá]tica|grammar score|nota de contexto|context score/i.test(normalized)) return "score";
  if (/dicas|tips|suggestions|sugest[oõ]es|consejos/.test(normalized)) return "tips";
  if (/nota|score|puntuaci[oó]n/.test(normalized)) return "score";
  return "text";
};

function parseContentSections(text: string): ContentSection[] {
  const sections: ContentSection[] = [];
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let current: ContentSection | null = null;

  const flush = () => {
    if (current && current.body.trim()) {
      sections.push({ ...current, body: current.body.trim() });
    }
  };

  for (const line of lines) {
    if (/^[📝📘💼]/.test(line)) continue;

    const scoreLine = line.match(/^✅\s*\*{0,2}([^:*]+:?)[\*\s]*(.*)$/i);
    if (scoreLine) {
      flush();
      current = null;
      const scoreLabel = scoreLine[1].replace(/\*/g, "").trim() || "Nota Geral";
      const scoreType = /postura|politeness/i.test(scoreLabel) ? "posture" : "score";
      sections.push({
        type: scoreType,
        label: scoreLabel,
        body: scoreLine[2].trim(),
      });
      continue;
    }

    const labeled = line.match(/^\*{0,2}([^:*]{3,}):\*{0,2}\s*(.*)$/);
    if (labeled) {
      const label = labeled[1].replace(/\*/g, "").trim();
      const type = detectSectionType(label);
      if (type !== "text") {
        flush();
        current = {
          type,
          label,
          body: labeled[2]?.trim() ? `${labeled[2].trim()}\n` : "",
        };
        continue;
      }
    }

    if (current) {
      current.body += `${line}\n`;
    } else {
      sections.push({ type: "text", label: "Texto", body: line });
    }
  }

  flush();
  return sections;
}

const getSectionStyles = (type: ContentSectionType) => {
  switch (type) {
    case "question":
      return {
        shell: "border-sky-200 bg-sky-50/90",
        glow: "from-sky-300/40 to-blue-400/10",
        badge: "bg-sky-600 text-white",
        label: "text-sky-700",
        text: "text-sky-950",
        icon: HelpCircle,
      };
    case "student":
      return {
        shell: "border-emerald-200 bg-emerald-50/90",
        glow: "from-emerald-300/40 to-teal-400/10",
        badge: "bg-emerald-600 text-white",
        label: "text-emerald-700",
        text: "text-emerald-950",
        icon: UserRound,
      };
    case "improved":
      return {
        shell: "border-amber-200 bg-amber-50/90",
        glow: "from-amber-300/40 to-orange-400/10",
        badge: "bg-amber-500 text-white",
        label: "text-amber-700",
        text: "text-amber-950",
        icon: WandSparkles,
      };
    case "grammar":
      return {
        shell: "border-rose-200 bg-rose-50/90",
        glow: "from-rose-300/40 to-pink-300/10",
        badge: "bg-rose-500 text-white",
        label: "text-rose-700",
        text: "text-rose-950",
        icon: PenLine,
      };
    case "context":
      return {
        shell: "border-indigo-200 bg-indigo-50/90",
        glow: "from-indigo-300/40 to-blue-300/10",
        badge: "bg-indigo-500 text-white",
        label: "text-indigo-700",
        text: "text-indigo-950",
        icon: Target,
      };
    case "interview_tip":
      return {
        shell: "border-cyan-200 bg-cyan-50/90",
        glow: "from-cyan-300/40 to-teal-300/10",
        badge: "bg-cyan-600 text-white",
        label: "text-cyan-700",
        text: "text-cyan-950",
        icon: Briefcase,
      };
    case "posture":
      return {
        shell: "border-purple-200 bg-purple-50/90",
        glow: "from-purple-300/40 to-fuchsia-300/10",
        badge: "bg-purple-500 text-white",
        label: "text-purple-700",
        text: "text-purple-950",
        icon: Heart,
      };
    case "teacher":
      return {
        shell: "border-rose-200 bg-rose-50/90",
        glow: "from-rose-300/40 to-fuchsia-300/10",
        badge: "bg-rose-600 text-white",
        label: "text-rose-700",
        text: "text-rose-950",
        icon: MessageSquareQuote,
      };
    case "tips":
      return {
        shell: "border-violet-200 bg-violet-50/90",
        glow: "from-violet-300/40 to-purple-300/10",
        badge: "bg-violet-600 text-white",
        label: "text-violet-700",
        text: "text-violet-950",
        icon: Lightbulb,
      };
    case "score":
      return {
        shell: "border-yellow-300 bg-yellow-50/95",
        glow: "from-yellow-300/50 to-orange-300/20",
        badge: "bg-yellow-500 text-white",
        label: "text-yellow-700",
        text: "text-yellow-950",
        icon: Trophy,
      };
    default:
      return {
        shell: "border-border bg-card",
        glow: "from-muted/20 to-transparent",
        badge: "bg-primary text-primary-foreground",
        label: "text-muted-foreground",
        text: "text-foreground",
        icon: BookOpen,
      };
  }
};

const renderBody = (body: string, textClass: string, bulletColor: string) => {
  return body.split("\n").filter(Boolean).map((line, index) => {
    const cleaned = line.trim();
    if (/^[➤•-]/.test(cleaned)) {
      return (
        <div key={index} className="flex items-start gap-2.5">
          <span className={cn("mt-[7px] h-2 w-2 rounded-full shrink-0", bulletColor)} />
          <p className={cn("text-base md:text-lg leading-relaxed", textClass)}>{renderBold(cleaned.replace(/^[➤•-]\s*/, ""))}</p>
        </div>
      );
    }

    return (
      <p key={index} className={cn("text-base md:text-lg leading-relaxed", textClass)}>
        {renderBold(cleaned)}
      </p>
    );
  });
};

const SpeakButton: React.FC<{ text: string }> = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const plainText = text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/^[➤•-]\s*/gm, "").trim();

  const handlePlay = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("speak-elevenlabs", {
        body: { text: plainText },
      });
      if (error || !data?.audioContent) throw new Error("TTS failed");
      const blob = base64ToAudioBlob(data.audioContent);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setIsPlaying(false); audioRef.current = null; };
      audio.onerror = () => { setIsPlaying(false); audioRef.current = null; };
      setIsPlaying(true);
      await audio.play();
    } catch {
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePlay}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
        isPlaying
          ? "bg-amber-500 text-white shadow-md"
          : "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200"
      )}
    >
      {isLoading ? (
        <Loader className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Volume2 className="h-3.5 w-3.5" />
      )}
      {isPlaying ? "Reproduzindo..." : "Ouvir"}
    </button>
  );
};

const SectionBlock: React.FC<{ section: ContentSection }> = ({ section }) => {
  const styles = getSectionStyles(section.type);
  const Icon = styles.icon;

  if (section.type === "score" || section.type === "posture") {
    const iconColor = section.type === "posture" ? "text-purple-500" : "text-yellow-500";
    return (
      <div className={cn("relative overflow-hidden rounded-2xl border-2 p-5 md:p-6 shadow-lg", styles.shell)}>
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", styles.glow)} />
        <div className="relative flex flex-col items-center text-center gap-3">
          <div className={cn("flex items-center gap-2", iconColor)}>
            <Star className="h-6 w-6 fill-current" />
            {section.type === "posture" ? <Heart className="h-9 w-9" /> : <Award className="h-9 w-9" />}
            <Star className="h-6 w-6 fill-current" />
          </div>
          <span className={cn("text-[11px] md:text-xs font-bold uppercase tracking-[0.2em]", styles.label)}>{section.label || "Nota Geral"}</span>
          <div className={cn("text-2xl md:text-4xl font-black leading-tight", styles.text)}>{renderBold(section.body || "-")}</div>
        </div>
      </div>
    );
  }

  const showSpeakButton = section.type === "improved";

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border p-4 md:p-5 shadow-md", styles.shell)}>
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40", styles.glow)} />
      <div className="relative">
        <div className="flex items-center gap-3 mb-2.5">
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm", styles.badge)}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <p className={cn("text-[11px] md:text-xs font-bold uppercase tracking-[0.18em] flex-1", styles.label)}>{section.label}</p>
          {showSpeakButton && <SpeakButton text={section.body} />}
        </div>
        <div className="pl-12 space-y-1.5">
          {renderBody(section.body, styles.text, styles.badge.split(" ")[0])}
        </div>
      </div>
    </div>
  );
};

const getCardConfig = (type: FeedbackCard["type"]) => {
  switch (type) {
    case "score":
      return {
        gradient: "from-yellow-400 via-amber-500 to-orange-500",
        iconBg: "bg-gradient-to-br from-yellow-400 to-orange-500",
        Icon: Trophy,
        chipBg: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      };
    case "tips":
      return {
        gradient: "from-blue-500 via-cyan-500 to-teal-500",
        iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
        Icon: GraduationCap,
        chipBg: "bg-blue-100 text-blue-800 border border-blue-200",
      };
    case "suggestions":
      return {
        gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
        iconBg: "bg-gradient-to-br from-violet-500 to-fuchsia-500",
        Icon: Briefcase,
        chipBg: "bg-violet-100 text-violet-800 border border-violet-200",
      };
    default:
      return {
        gradient: "from-emerald-500 via-teal-500 to-cyan-500",
        iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
        Icon: Target,
        chipBg: "bg-emerald-100 text-emerald-800 border border-emerald-200",
      };
  }
};

interface FeedbackWizardProps {
  cards: FeedbackCard[];
  autoExpand?: boolean;
  onGoHome?: () => void;
}

const FeedbackWizard: React.FC<FeedbackWizardProps> = ({ cards, autoExpand = false, onGoHome }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(autoExpand);
  const contentRef = useRef<HTMLDivElement>(null);
  const current = cards[currentIndex];
  const total = cards.length;
  const config = getCardConfig(current.type);
  const sections = parseContentSections(current.content);

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, total]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  }, [currentIndex]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentIndex]);

  if (isExpanded) {
    return (
      <div data-no-word-click className="fixed inset-0 z-[9999] flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100">
        <div className={cn("h-2 w-full bg-gradient-to-r", config.gradient)} />

        <div className="flex items-center justify-between px-5 py-4 border-b border-border/70 bg-white/90 backdrop-blur-xl">
          <div className="flex items-center gap-4 min-w-0">
            <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] text-white shadow-xl", config.iconBg)}>
              <config.Icon className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl md:text-2xl font-black tracking-tight text-foreground">{current.title}</h2>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {cards.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      i === currentIndex
                        ? cn("h-2.5 w-9 bg-gradient-to-r", config.gradient)
                        : i < currentIndex
                          ? "h-2.5 w-2.5 bg-slate-400"
                          : "h-2.5 w-2.5 bg-slate-200"
                    )}
                  />
                ))}
                <span className="ml-1 text-xs md:text-sm font-semibold text-muted-foreground">{currentIndex + 1}/{total}</span>
              </div>
            </div>
          </div>

          {onGoHome ? (
            <Button variant="outline" onClick={onGoHome} className="rounded-2xl gap-2 px-4 h-10 text-sm font-semibold border-slate-300 hover:bg-slate-100">
              <Home className="h-4 w-4" />
              Início
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div ref={contentRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 md:px-6 py-5 md:py-6 space-y-3.5">
            {sections.length > 0 ? sections.map((section, i) => (
              <div key={`${currentIndex}-${i}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 70}ms`, animationFillMode: "both" }}>
                <SectionBlock section={section} />
              </div>
            )) : (
              <SectionBlock section={{ type: "text", label: "Feedback", body: current.content }} />
            )}
          </div>
        </div>

        <div className="border-t border-border/70 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto max-w-3xl px-4 md:px-6 py-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0} className="h-12 rounded-2xl px-5 text-base font-semibold">
                <ChevronLeft className="h-5 w-5" />
                Anterior
              </Button>
              <Button
                onClick={currentIndex === total - 1 ? (onGoHome || (() => setIsExpanded(false))) : goNext}
                className={cn("h-12 rounded-2xl px-6 text-base font-semibold text-white shadow-lg", currentIndex === total - 1 ? "bg-gradient-to-r from-emerald-500 to-teal-500" : cn("bg-gradient-to-r", config.gradient))}
              >
                {currentIndex === total - 1 ? "Concluir" : "Próximo"}
                {currentIndex === total - 1 ? <CheckCircle2 className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </Button>
            </div>
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="flex items-center justify-center gap-2 w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                Voltar ao Início
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full my-5">
      <button onClick={() => setIsExpanded(true)} className="group w-full cursor-pointer text-left">
        <div className="relative overflow-hidden rounded-[30px] border-2 border-slate-200 bg-white shadow-[0_24px_70px_-38px_rgba(0,0,0,0.35)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_32px_90px_-40px_rgba(0,0,0,0.4)]">
          <div className={cn("h-2 w-full bg-gradient-to-r", config.gradient)} />
          <div className={cn("absolute -right-10 -top-10 h-44 w-44 rounded-full blur-3xl opacity-20 bg-gradient-to-br", config.gradient)} />

          <div className="relative p-6 md:p-7">
            <div className="flex items-center gap-4">
              <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] text-white shadow-xl", config.iconBg)}>
                <BookOpen className="h-8 w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl md:text-2xl font-black tracking-tight text-foreground">Feedback Completo</h3>
                <p className="mt-1 text-sm md:text-base text-muted-foreground">Blocos separados para pergunta, resposta do aluno, feedback do professor e versão melhorada.</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              {cards.map((card, i) => {
                const chip = getCardConfig(card.type);
                return (
                  <span key={i} className={cn("rounded-xl px-3 py-1.5 text-xs md:text-sm font-bold", chip.chipBg)}>
                    {card.title}
                  </span>
                );
              })}
            </div>

            <div className={cn("mt-6 flex items-center justify-center gap-3 rounded-2xl px-5 py-4 text-lg font-black text-white shadow-lg transition-transform duration-300 group-hover:scale-[1.01] bg-gradient-to-r", config.gradient)}>
              Ver Feedback Organizado
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default FeedbackWizard;
