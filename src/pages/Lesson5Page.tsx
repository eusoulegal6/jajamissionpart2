import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import PNLLessonNav from "@/components/PNLLessonNav";
import {
  VocabularyLessonTemplate,
  VocabularyLessonConfig,
} from "@/components/vocabulary/VocabularyLessonTemplate";
import { useVocabularyAudio } from "@/hooks/useVocabularyAudio";

const LESSON5_IMAGE_URL =
  "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2006_21_37%20PM%20(1).png";

const LESSON5_CONFIG: VocabularyLessonConfig = {
  id: "lesson-5-live-and-understand",
  title: "Lesson 5 – Live, Study & Countries",
  imageUrl: LESSON5_IMAGE_URL,
  verbs: [
    { english: "live", portuguese: "morar, viver", audioUrl: "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/BRICS/ElevenLabs_2026-01-15T01_32_51_Jessica%20-%20Playful,%20Bright,%20Warm_pre_sp100_s50_sb75_v3.mp3" },
    { english: "understand", portuguese: "entender" },
  ],
  newWords: [
    { english: "classmate", portuguese: "colega de classe" },
    { english: "language", portuguese: "língua, idioma" },
    { english: "word", portuguese: "palavra" },
    { english: "city", portuguese: "cidade" },
    { english: "country", portuguese: "país" },
    { english: "Brazil", portuguese: "Brasil" },
    { english: "Spain", portuguese: "Espanha" },
    { english: "Germany", portuguese: "Alemanha" },
    { english: "Italy", portuguese: "Itália" },
    {
      english: "the United States of America (U.S.A.)",
      portuguese: "os Estados Unidos da América",
    },
    { english: "alone", portuguese: "sozinho(a)" },
    { english: "where", portuguese: "onde, aonde" },
    { english: "abroad", portuguese: "exterior (fora do país)" },
    { english: "this", portuguese: "este, esta, esse, essa" },
    { english: "that", portuguese: "aquele, aquela" },
    { english: "in", portuguese: "em, no, na" },
  ],
  usefulPhrases: [
    {
      english: "I understand that word in English.",
      portuguese: "Eu entendo aquela palavra em inglês.",
    },
    {
      english: "I live here, what about you?",
      portuguese: "Eu moro aqui, e você?",
    },
  ],
  grammarExamples: [
    {
      english: "We don't live here.",
      portuguese: "Nós não moramos aqui.",
    },
    {
      english: "They don't understand Spanish.",
      portuguese: "Eles não entendem espanhol.",
    },
    {
      english: "We don't want to study Portuguese.",
      portuguese: "Nós não queremos estudar português.",
    },
    {
      english: "They don't want to live there.",
      portuguese: "Eles não querem morar lá.",
    },
    {
      english: "Where do you live?",
      portuguese: "Onde você mora?",
    },
    {
      english: "Where do you study?",
      portuguese: "Onde você estuda?",
    },
    {
      english: "Where do you want to live?",
      portuguese: "Onde você quer morar?",
    },
    {
      english: "My classmate lives in Brazil.",
      portuguese: "Meu colega de classe mora no Brasil.",
    },
    {
      english: "They understand this word.",
      portuguese: "Eles entendem esta palavra.",
    },
    {
      english: "We live in this city.",
      portuguese: "Nós moramos nesta cidade.",
    },
    {
      english: "My friend lives in Germany.",
      portuguese: "Meu amigo mora na Alemanha.",
    },
    {
      english: "They don't understand that language.",
      portuguese: "Eles não entendem aquela língua.",
    },
    {
      english: "We want to live abroad.",
      portuguese: "Nós queremos morar no exterior.",
    },
  ],
};

export default function Lesson5Page() {
  const allTexts = useMemo(
    () => [
      ...LESSON5_CONFIG.verbs.map((v) => v.english),
      ...LESSON5_CONFIG.newWords.map((w) => w.english),
      ...LESSON5_CONFIG.usefulPhrases.map((p) => p.english),
      ...LESSON5_CONFIG.grammarExamples.map((g) => g.english),
    ],
    []
  );

  const { play, urlMap, isPreloading } = useVocabularyAudio(allTexts);

  return (
    <div className="bg-gradient-to-br from-sky-50 to-sky-100/60 min-h-screen flex flex-col">
      {/* Top navigation bar */}
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between">
          <Link
            to="/lessons"
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-slate-500 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow hover:bg-slate-600 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to lessons menu
          </Link>
          <Link
            to="/lessons/lesson-5-2"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-sky-700 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow hover:bg-sky-800 transition"
          >
            Next page: Practice sentences
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="flex-1">
        <VocabularyLessonTemplate
          config={LESSON5_CONFIG}
          onPlayAudio={play}
          isLoading={isPreloading}
          urlMap={urlMap}
        />
      </div>

      <PNLLessonNav
        backTo="/lessons"
        backLabel="Back to lessons menu"
        nextTo="/lessons/lesson-5-2"
        nextLabel="Next page: Practice sentences"
      />
    </div>
  );
}
