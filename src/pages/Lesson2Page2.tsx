import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PNLLessonNav from "@/components/PNLLessonNav";
import {
  PhrasesLessonTemplate,
  PhrasesLessonConfig,
} from "@/components/vocabulary/PhrasesLessonTemplate";
import { useVocabularyAudio } from "@/hooks/useVocabularyAudio";

const LESSON2_IMAGE_URL_2 =
  "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2004_51_07%20PM%20(1).png";

const LESSON2_PHRASES_CONFIG: PhrasesLessonConfig = {
  id: "lesson-2-breakfast-phrases",
  title: "Lesson 2 – Breakfast & Preferences",
  subtitle: "Practice sentences using want and like with breakfast foods.",
  imageUrl: LESSON2_IMAGE_URL_2,
  phrases: [
    {
      english: "I want yogurt and granola.",
      portuguese: "Eu quero iogurte com granola.",
    },
    {
      english: "I don't want eggs.",
      portuguese: "Eu não quero ovos.",
    },
    {
      english: "I like to drink juice.",
      portuguese: "Eu gosto de beber suco.",
    },
    {
      english: "I want to drink milk.",
      portuguese: "Eu quero beber leite.",
    },
    {
      english: "I want to eat honey.",
      portuguese: "Eu quero comer mel.",
    },
    {
      english: "I like oranges.",
      portuguese: "Eu gosto de laranja.",
    },
    {
      english: "I don't like apple juice.",
      portuguese: "Eu não gosto de suco de maçã.",
    },
    {
      english: "I like chocolate pie.",
      portuguese: "Eu gosto de torta de chocolate.",
    },
    {
      english: "I want a piece of cheese.",
      portuguese: "Eu quero um pedaço de queijo.",
    },
    {
      english: "I want to eat toast for breakfast.",
      portuguese: "Eu quero comer torradas no café da manhã.",
    },
  ],
};

export default function Lesson2Page2() {
  const allTexts = useMemo(
    () => LESSON2_PHRASES_CONFIG.phrases.map((p) => p.english),
    []
  );

  const { play, urlMap, isPreloading } = useVocabularyAudio(allTexts);

  return (
    <div className="bg-gradient-to-br from-sky-50 to-sky-100/60 min-h-screen flex flex-col">
      {/* Top navigation bar */}
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between">
          <Link
            to="/lessons/lesson-2"
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-sky-700 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow hover:bg-sky-800 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to page 1
          </Link>
          <Link
            to="/lessons"
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-slate-500 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow hover:bg-slate-600 transition"
          >
            Back to lessons menu ➡
          </Link>
        </div>
      </div>

      <div className="flex-1">
        <PhrasesLessonTemplate
          config={LESSON2_PHRASES_CONFIG}
          onPlayAudio={play}
          isLoading={isPreloading}
          urlMap={urlMap}
        />
      </div>

      <PNLLessonNav
        backTo="/lessons/lesson-2"
        backLabel="Back to page 1"
      />
    </div>
  );
}
