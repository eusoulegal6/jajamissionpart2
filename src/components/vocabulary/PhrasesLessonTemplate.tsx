import React, { useState } from "react";
import { Volume2, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonPracticeMode } from "./LessonPracticeMode";
import { getDisplayImageUrl } from "@/utils/imageOptimization";

export type PhraseItem = { english: string; portuguese: string };

export type PhrasesLessonConfig = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  phrases: PhraseItem[];
};

type Props = {
  config: PhrasesLessonConfig;
  onPlayAudio: (text: string) => void;
  isLoading?: boolean;
  urlMap?: Record<string, string>;
};

export const PhrasesLessonTemplate: React.FC<Props> = ({
  config,
  onPlayAudio,
  isLoading = false,
  urlMap = {},
}) => {
  const { title, subtitle, imageUrl, phrases } = config;
  const [showPractice, setShowPractice] = useState(false);

  // Convert phrases to practice items
  const practiceItems = phrases.map(p => ({
    english: p.english,
    portuguese: p.portuguese,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100/60">
      {/* Practice Mode Modal */}
      <LessonPracticeMode
        items={practiceItems}
        urlMap={urlMap}
        isOpen={showPractice}
        onClose={() => setShowPractice(false)}
        title="Practice Mode"
      />

      <main className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
        {/* HEADER */}
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
          <p className="mt-2 text-xs font-semibold tracking-[0.25em] text-sky-700 uppercase">
            Sentences
          </p>
          {subtitle && (
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              {subtitle}
            </p>
          )}
        </header>

        {/* GRID: PHRASES + IMAGE */}
        <section className="grid gap-4 lg:gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* LEFT: PHRASES LIST */}
          <div className="rounded-2xl bg-white shadow-sm border border-sky-100 p-4 sm:p-5">
            <h2 className="text-sm sm:text-base font-semibold text-sky-800 tracking-wide uppercase mb-3">
              Practice sentences
            </h2>
            <ul className="space-y-2">
              {phrases.map((item, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => onPlayAudio(item.english)}
                    disabled={isLoading}
                    className="w-full text-left rounded-lg px-2 py-2.5 hover:bg-sky-50 transition disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sky-900 text-lg sm:text-xl">
                          {item.english}
                        </p>
                        <p className="mt-0.5 text-sm sm:text-base text-slate-500">
                          {item.portuguese}
                        </p>
                      </div>
                      <Volume2 className="w-4 h-4 text-sky-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0 mt-1" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT: IMAGE FRAME */}
          <div className="rounded-2xl bg-white shadow-sm border border-sky-100 p-4 sm:p-5 flex flex-col">
            <div className="rounded-xl overflow-hidden bg-slate-200">
              <img
                src={getDisplayImageUrl(imageUrl)}
                alt={`${title} illustration`}
                className="w-full h-auto object-contain"
              />
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

export default PhrasesLessonTemplate;
