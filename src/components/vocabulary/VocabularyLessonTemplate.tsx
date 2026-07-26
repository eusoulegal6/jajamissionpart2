import React, { useState } from "react";
import { Volume2, Maximize2, X, Headphones } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { LessonPracticeMode } from "./LessonPracticeMode";
import { getDisplayImageUrl } from "@/utils/imageOptimization";

export type VerbItem = { english: string; portuguese: string; audioUrl?: string };
export type WordItem = { english: string; portuguese: string; audioUrl?: string };
export type PhraseItem = { english: string; portuguese: string; audioUrl?: string };

export type VocabularyLessonConfig = {
  id: string;
  title: string;
  imageUrl: string;
  verbs: VerbItem[];
  newWords: WordItem[];
  usefulPhrases: PhraseItem[];
  grammarExamples: PhraseItem[];
};

type Props = {
  config: VocabularyLessonConfig;
  onPlayAudio: (text: string) => void;
  isLoading?: boolean;
  urlMap?: Record<string, string>;
};

type ExpandedSection = "verbs" | "newWords" | "usefulPhrases" | "grammar" | null;

export const VocabularyLessonTemplate: React.FC<Props> = ({
  config,
  onPlayAudio,
  isLoading = false,
  urlMap = {},
}) => {
  const { title, imageUrl, verbs, newWords, usefulPhrases, grammarExamples } = config;
  const isMobile = useIsMobile();
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const [showPractice, setShowPractice] = useState(false);

  // Helper to play audio - uses custom audioUrl if available, otherwise TTS
  const handlePlayAudio = (text: string, customAudioUrl?: string) => {
    if (customAudioUrl) {
      const audio = new Audio(customAudioUrl);
      audio.play().catch(err => console.error("Error playing custom audio:", err));
    } else {
      onPlayAudio(text);
    }
  };

  // Combine all items for practice mode
  const allPracticeItems = [
    ...verbs.map(v => ({ english: v.english, portuguese: v.portuguese })),
    ...newWords.map(w => ({ english: w.english, portuguese: w.portuguese })),
    ...usefulPhrases.map(p => ({ english: p.english, portuguese: p.portuguese })),
    ...grammarExamples.map(g => ({ english: g.english, portuguese: g.portuguese })),
  ];

  const ExpandButton = ({ section }: { section: ExpandedSection }) => {
    if (isMobile) return null;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpandedSection(section);
        }}
        className="p-1.5 rounded-lg hover:bg-sky-100 transition text-sky-600"
        title="Expand section"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    );
  };

  const renderExpandedContent = () => {
    switch (expandedSection) {
      case "verbs":
        return (
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-sky-800">Verbs</h2>
            <div className="flex flex-wrap gap-4">
              {verbs.map((verb) => (
                <button
                  key={verb.english}
                  type="button"
                  onClick={() => handlePlayAudio(verb.english, verb.audioUrl)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-4 rounded-full bg-sky-600 text-white text-2xl px-8 py-4 shadow hover:bg-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-semibold">{verb.english}</span>
                  <span className="opacity-90 text-xl">| {verb.portuguese}</span>
                  <Volume2 className="w-6 h-6" />
                </button>
              ))}
            </div>
          </div>
        );
      case "newWords":
        return (
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-sky-800">New Words</h2>
            <ul className="space-y-4 max-w-4xl">
              {newWords.map((word) => (
                <li key={word.english}>
                  <button
                    type="button"
                    onClick={() => onPlayAudio(word.english)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between gap-6 rounded-xl px-6 py-5 bg-sky-50 hover:bg-sky-100 text-left transition disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-baseline gap-6 flex-1">
                      <span className="font-semibold text-sky-900 text-3xl">{word.english}</span>
                      <span className="text-xl text-slate-500">{word.portuguese}</span>
                    </div>
                    <Volume2 className="w-7 h-7 text-sky-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      case "usefulPhrases":
        return (
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-sky-800">Useful Phrases</h2>
            <ul className="space-y-5 max-w-5xl">
              {usefulPhrases.map((phrase) => (
                <li key={phrase.english}>
                  <button
                    type="button"
                    onClick={() => onPlayAudio(phrase.english)}
                    disabled={isLoading}
                    className="w-full text-left rounded-xl px-6 py-5 bg-sky-50 hover:bg-sky-100 transition disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-sky-900 text-3xl">{phrase.english}</p>
                        <p className="mt-2 text-xl text-slate-500">{phrase.portuguese}</p>
                      </div>
                      <Volume2 className="w-7 h-7 text-sky-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0 mt-1" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      case "grammar":
        return (
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-sky-100">Grammar</h2>
            <div className="space-y-4 max-w-5xl">
              {grammarExamples.map((g) => (
                <button
                  key={g.english}
                  type="button"
                  onClick={() => onPlayAudio(g.english)}
                  disabled={isLoading}
                  className="w-full text-left rounded-xl bg-sky-800/40 hover:bg-sky-700/60 px-6 py-5 transition disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-3xl text-sky-50">{g.english}</p>
                      <p className="mt-2 text-xl text-sky-200">{g.portuguese}</p>
                    </div>
                    <Volume2 className="w-7 h-7 text-sky-300 opacity-0 group-hover:opacity-100 transition flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100/60">
      {/* Practice Mode Modal */}
      <LessonPracticeMode
        items={allPracticeItems}
        urlMap={urlMap}
        isOpen={showPractice}
        onClose={() => setShowPractice(false)}
        title="Practice Mode"
      />

      {/* Fullscreen Expanded Modal */}
      <Dialog open={expandedSection !== null} onOpenChange={() => setExpandedSection(null)}>
        <DialogContent 
          hideCloseButton
          className={`max-w-none w-screen h-screen max-h-screen rounded-none border-none p-0 ${
            expandedSection === "grammar" ? "bg-sky-900" : "bg-white"
          }`}
        >
          <div className="relative w-full h-full overflow-auto p-8">
            <button
              type="button"
              onClick={() => setExpandedSection(null)}
              className={`absolute top-6 right-6 p-3 rounded-full transition z-10 ${
                expandedSection === "grammar" 
                  ? "bg-sky-800 hover:bg-sky-700 text-sky-100" 
                  : "bg-sky-100 hover:bg-sky-200 text-sky-800"
              }`}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="pt-4">
              {renderExpandedContent()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <main className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
        {/* TOP: VERBS BAR */}
        <header className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-slate-900">
              {title}
            </h1>
            <Button
              onClick={() => setShowPractice(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              disabled={isLoading || Object.keys(urlMap).length === 0}
            >
              <Headphones className="w-4 h-4" />
              Practice
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <p className="text-xs font-semibold tracking-[0.25em] text-sky-700 uppercase">
              Verbs
            </p>
            <ExpandButton section="verbs" />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {verbs.map((verb) => (
              <button
                key={verb.english}
                type="button"
                onClick={() => handlePlayAudio(verb.english, verb.audioUrl)}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-full bg-sky-600 text-white text-sm sm:text-base px-4 py-2 shadow hover:bg-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-semibold">{verb.english}</span>
                <span className="opacity-90 text-xs sm:text-sm">
                  | {verb.portuguese}
                </span>
                <Volume2 className="w-4 h-4" />
              </button>
            ))}
          </div>
        </header>

        {/* MAIN GRID */}
        <section className="grid gap-4 lg:gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {/* LEFT: NEW WORDS + IMAGE */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-white shadow-sm border border-sky-100 p-4 sm:p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm sm:text-base font-semibold text-sky-800 tracking-wide uppercase">
                  New words
                </h2>
                <ExpandButton section="newWords" />
              </div>
              <ul className="space-y-2">
                {newWords.map((word) => (
                  <li key={word.english}>
                    <button
                      type="button"
                      onClick={() => onPlayAudio(word.english)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-sky-50 text-left transition disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex items-baseline gap-3 flex-1 min-w-0">
                        <span className="font-semibold text-sky-900 text-base">
                          {word.english}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-500 truncate">
                          {word.portuguese}
                        </span>
                      </div>
                      <Volume2 className="w-4 h-4 text-sky-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* IMAGE */}
            <div className="w-full rounded-xl overflow-hidden bg-slate-200">
              <img
                src={getDisplayImageUrl(imageUrl)}
                alt={`${title} illustration`}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* RIGHT: USEFUL PHRASES + GRAMMAR */}
          <div className="flex flex-col gap-4">
            {/* USEFUL PHRASES */}
            <div className="rounded-2xl bg-white shadow-sm border border-sky-100 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm sm:text-base font-semibold text-sky-800 tracking-wide uppercase">
                  Useful phrases
                </h2>
                <ExpandButton section="usefulPhrases" />
              </div>
              <ul className="space-y-3">
                {usefulPhrases.map((phrase) => (
                  <li key={phrase.english}>
                    <button
                      type="button"
                      onClick={() => onPlayAudio(phrase.english)}
                      disabled={isLoading}
                      className="w-full text-left rounded-lg px-2 py-2 hover:bg-sky-50 transition disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sky-900 text-base">
                            {phrase.english}
                          </p>
                          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                            {phrase.portuguese}
                          </p>
                        </div>
                        <Volume2 className="w-4 h-4 text-sky-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0 mt-0.5" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* GRAMMAR BOX */}
            <div className="rounded-2xl bg-sky-900 text-sky-50 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm sm:text-base font-semibold tracking-wide uppercase">
                  Grammar
                </h2>
                {!isMobile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedSection("grammar");
                    }}
                    className="p-1.5 rounded-lg hover:bg-sky-800 transition text-sky-300"
                    title="Expand section"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-2.5">
                {grammarExamples.map((g) => (
                  <button
                    key={g.english}
                    type="button"
                    onClick={() => onPlayAudio(g.english)}
                    disabled={isLoading}
                    className="w-full text-left rounded-lg bg-sky-800/40 hover:bg-sky-700/60 px-3 py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-base">{g.english}</p>
                        <p className="mt-0.5 text-xs sm:text-sm text-sky-200">
                          {g.portuguese}
                        </p>
                      </div>
                      <Volume2 className="w-4 h-4 text-sky-300 opacity-0 group-hover:opacity-100 transition flex-shrink-0 mt-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Loading indicator */}
        {isLoading && (
          <div className="fixed bottom-4 right-4 bg-sky-600 text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Loading audios...
          </div>
        )}
      </main>
    </div>
  );
};

export default VocabularyLessonTemplate;
