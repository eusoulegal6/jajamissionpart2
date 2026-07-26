import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import PNLLessonNav from "@/components/PNLLessonNav";
import {
  VocabularyLessonTemplate,
  VocabularyLessonConfig,
} from "@/components/vocabulary/VocabularyLessonTemplate";
import { useVocabularyAudio } from "@/hooks/useVocabularyAudio";

const LESSON3_IMAGE_URL =
  "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2004_53_26%20PM%20(1).png";

const LESSON3_CONFIG: VocabularyLessonConfig = {
  id: "lesson-3-meals-preferences",
  title: "Lesson 3 – Meals & Preferences",
  imageUrl: LESSON3_IMAGE_URL,
  verbs: [
    { english: "prefer", portuguese: "preferir" },
    { english: "love", portuguese: "amar, adorar" },
  ],
  newWords: [
    { english: "beef", portuguese: "carne bovina" },
    { english: "chicken", portuguese: "frango" },
    { english: "fish", portuguese: "peixe" },
    { english: "bacon", portuguese: "bacon" },
    { english: "sausage", portuguese: "linguiça, salsicha" },
    { english: "tomato", portuguese: "tomate" },
    { english: "rice", portuguese: "arroz" },
    { english: "beans", portuguese: "feijão" },
    { english: "French fries", portuguese: "batatas fritas" },
    { english: "sandwich", portuguese: "sanduíche" },
    { english: "salad", portuguese: "salada" },
    { english: "vegetables", portuguese: "legumes, verduras" },
    { english: "soda", portuguese: "refrigerante" },
    { english: "or", portuguese: "ou" },
    { english: "what", portuguese: "o que, qual" },
  ],
  usefulPhrases: [
    {
      english: "I want a glass of water, please.",
      portuguese: "Eu quero um copo de água, por favor.",
    },
    {
      english: "I want a cup of tea.",
      portuguese: "Eu quero uma xícara de chá.",
    },
    {
      english: "I eat rice and beans for lunch.",
      portuguese: "Eu como arroz e feijão no almoço.",
    },
    {
      english: "I prefer to eat fish for dinner.",
      portuguese: "Eu prefiro comer peixe no jantar.",
    },
  ],
  grammarExamples: [
    {
      english: "Do you eat fish?",
      portuguese: "Você come peixe?",
    },
    {
      english: "Do you want to eat French fries?",
      portuguese: "Você quer comer batatas fritas?",
    },
    {
      english: "Do you eat bread for breakfast?",
      portuguese: "Você come pão no café da manhã?",
    },
    {
      english: "What do you eat for dinner?",
      portuguese: "O que você come no jantar?",
    },
    {
      english: "What do you want to drink?",
      portuguese: "O que você quer beber?",
    },
    {
      english: "What do you like to eat?",
      portuguese: "O que você gosta de comer?",
    },
    {
      english: "Do you prefer chicken or beef?",
      portuguese: "Você prefere frango ou carne?",
    },
    {
      english: "I love salad and vegetables.",
      portuguese: "Eu amo salada e legumes.",
    },
    {
      english: "Do you like rice and beans?",
      portuguese: "Você gosta de arroz e feijão?",
    },
    {
      english: "I prefer to drink water or tea.",
      portuguese: "Eu prefiro beber água ou chá.",
    },
  ],
};

export default function Lesson3Page() {
  const allTexts = useMemo(
    () => [
      ...LESSON3_CONFIG.verbs.map((v) => v.english),
      ...LESSON3_CONFIG.newWords.map((w) => w.english),
      ...LESSON3_CONFIG.usefulPhrases.map((p) => p.english),
      ...LESSON3_CONFIG.grammarExamples.map((g) => g.english),
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
            to="/lessons/lesson-3-2"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-sky-700 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow hover:bg-sky-800 transition"
          >
            Next page: Practice sentences
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="flex-1">
        <VocabularyLessonTemplate
          config={LESSON3_CONFIG}
          onPlayAudio={play}
          isLoading={isPreloading}
          urlMap={urlMap}
        />
      </div>

      <PNLLessonNav
        backTo="/lessons"
        backLabel="Back to lessons menu"
        nextTo="/lessons/lesson-3-2"
        nextLabel="Next page: Practice sentences"
      />
    </div>
  );
}
