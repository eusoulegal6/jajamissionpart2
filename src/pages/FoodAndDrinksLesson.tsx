import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PNLLessonNav from "@/components/PNLLessonNav";
import {
  VocabularyLessonTemplate,
  VocabularyLessonConfig,
} from "@/components/vocabulary/VocabularyLessonTemplate";
import { useVocabularyAudio } from "@/hooks/useVocabularyAudio";

const LESSON_IMAGE_URL =
  "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2004_45_49%20PM%20(1).png";

/**
 * Food & Drinks lesson config based on the reference image.
 * NOTE: Verbs are shown without "to" (eat, drink).
 */
const FOOD_AND_DRINKS_CONFIG: VocabularyLessonConfig = {
  id: "food-and-drinks-basic",
  title: "Food & Drinks - Lesson 1",
  imageUrl: LESSON_IMAGE_URL,
  verbs: [
    { english: "eat", portuguese: "comer" },
    { english: "drink", portuguese: "beber, tomar" },
  ],
  newWords: [
    { english: "water", portuguese: "água" },
    { english: "coffee", portuguese: "café" },
    { english: "milk", portuguese: "leite" },
    { english: "tea", portuguese: "chá" },
    { english: "juice", portuguese: "suco" },
    { english: "bread", portuguese: "pão" },
    { english: "cracker", portuguese: "biscoito / bolacha salgada" },
    { english: "cookie", portuguese: "biscoito / bolacha doce" },
    { english: "pancake", portuguese: "panqueca" },
    { english: "ham", portuguese: "presunto" },
    { english: "cheese", portuguese: "queijo" },
    { english: "butter", portuguese: "manteiga" },
    { english: "I", portuguese: "eu" },
    { english: "you", portuguese: "você" },
    { english: "and", portuguese: "e" },
  ],
  usefulPhrases: [
    {
      english: "I eat crackers. And you?",
      portuguese: "Eu como biscoitos salgados. E você?",
    },
    {
      english: "I drink coffee with milk.",
      portuguese: "Eu bebo café com leite.",
    },
  ],
  grammarExamples: [
    {
      english: "I eat pancakes.",
      portuguese: "Eu como panquecas.",
    },
    {
      english: "You eat cookies.",
      portuguese: "Você come bolachas doces.",
    },
    {
      english: "I drink tea.",
      portuguese: "Eu bebo chá.",
    },
    {
      english: "You drink juice.",
      portuguese: "Você bebe suco.",
    },
    {
      english: "I eat bread and cheese.",
      portuguese: "Eu como pão e queijo.",
    },
    {
      english: "You eat ham and butter.",
      portuguese: "Você come presunto e manteiga.",
    },
    {
      english: "I drink water and milk.",
      portuguese: "Eu bebo água e leite.",
    },
    {
      english: "You drink coffee and tea.",
      portuguese: "Você bebe café e chá.",
    },
  ],
};

export default function FoodAndDrinksLessonPage() {
  const allTexts = useMemo(
    () => [
      ...FOOD_AND_DRINKS_CONFIG.verbs.map((v) => v.english),
      ...FOOD_AND_DRINKS_CONFIG.newWords.map((w) => w.english),
      ...FOOD_AND_DRINKS_CONFIG.usefulPhrases.map((p) => p.english),
      ...FOOD_AND_DRINKS_CONFIG.grammarExamples.map((g) => g.english),
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
            ⬅ Back to lessons menu
          </Link>
          <Link
            to="/lessons/food-and-drinks-2"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-sky-700 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow hover:bg-sky-800 transition"
          >
            Next page: Practice sentences
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="flex-1">
        <VocabularyLessonTemplate
          config={FOOD_AND_DRINKS_CONFIG}
          onPlayAudio={play}
          isLoading={isPreloading}
          urlMap={urlMap}
        />
      </div>

      <PNLLessonNav
        backTo="/lessons"
        backLabel="Back to lessons menu"
        nextTo="/lessons/food-and-drinks-2"
        nextLabel="Next page: Practice sentences"
      />
    </div>
  );
}
