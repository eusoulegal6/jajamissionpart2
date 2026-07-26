import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import PNLLessonNav from "@/components/PNLLessonNav";
import {
  VocabularyLessonTemplate,
  VocabularyLessonConfig,
} from "@/components/vocabulary/VocabularyLessonTemplate";
import { useVocabularyAudio } from "@/hooks/useVocabularyAudio";

const LESSON2_IMAGE_URL =
  "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2004_49_27%20PM%20(1).png";

const LESSON2_CONFIG: VocabularyLessonConfig = {
  id: "lesson-2-breakfast",
  title: "Lesson 2 – Breakfast & Preferences",
  imageUrl: LESSON2_IMAGE_URL,
  verbs: [
    { english: "want", portuguese: "querer" },
    { english: "like", portuguese: "gostar (de)" },
  ],
  newWords: [
    { english: "apple", portuguese: "maçã" },
    { english: "orange", portuguese: "laranja" },
    { english: "banana", portuguese: "banana" },
    { english: "fruit", portuguese: "fruta" },
    { english: "toast", portuguese: "torrada" },
    { english: "jam", portuguese: "geleia" },
    { english: "cereal", portuguese: "cereal" },
    { english: "yogurt", portuguese: "iogurte" },
    { english: "honey", portuguese: "mel" },
    { english: "granola", portuguese: "granola" },
    { english: "egg", portuguese: "ovo" },
    { english: "pie", portuguese: "torta" },
    { english: "chocolate", portuguese: "chocolate" },
  ],
  usefulPhrases: [
    {
      english: "I eat toast and jam for breakfast.",
      portuguese: "Eu como torradas com geleia no café da manhã.",
    },
    {
      english: "I want a piece of chocolate, please.",
      portuguese: "Eu quero um pedaço de chocolate, por favor.",
    },
    {
      english: "I want a slice of pie.",
      portuguese: "Eu quero uma fatia de torta.",
    },
  ],
  grammarExamples: [
    {
      english: "I want banana and granola.",
      portuguese: "Eu quero banana e granola.",
    },
    {
      english: "I don't want chocolate pie.",
      portuguese: "Eu não quero torta de chocolate.",
    },
    {
      english: "I like apples.",
      portuguese: "Eu gosto de maçã.",
    },
    {
      english: "I don't like jam.",
      portuguese: "Eu não gosto de geleia.",
    },
    {
      english: "I like to eat cereal and honey.",
      portuguese: "Eu gosto de comer cereal com mel.",
    },
    {
      english: "I want to drink orange juice.",
      portuguese: "Eu quero beber suco de laranja.",
    },
    {
      english: "You want yogurt and fruit.",
      portuguese: "Você quer iogurte e fruta.",
    },
    {
      english: "You like to eat toast.",
      portuguese: "Você gosta de comer torrada.",
    },
    {
      english: "I want to eat eggs.",
      portuguese: "Eu quero comer ovos.",
    },
    {
      english: "You don't like chocolate.",
      portuguese: "Você não gosta de chocolate.",
    },
  ],
};

export default function Lesson2Page() {
  const allTexts = useMemo(
    () => [
      ...LESSON2_CONFIG.verbs.map((v) => v.english),
      ...LESSON2_CONFIG.newWords.map((w) => w.english),
      ...LESSON2_CONFIG.usefulPhrases.map((p) => p.english),
      ...LESSON2_CONFIG.grammarExamples.map((g) => g.english),
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
            to="/lessons/lesson-2-2"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-sky-700 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow hover:bg-sky-800 transition"
          >
            Next page: Practice sentences
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="flex-1">
        <VocabularyLessonTemplate
          config={LESSON2_CONFIG}
          onPlayAudio={play}
          isLoading={isPreloading}
          urlMap={urlMap}
        />
      </div>

      <PNLLessonNav
        backTo="/lessons"
        backLabel="Back to lessons menu"
        nextTo="/lessons/lesson-2-2"
        nextLabel="Next page: Practice sentences"
      />
    </div>
  );
}
