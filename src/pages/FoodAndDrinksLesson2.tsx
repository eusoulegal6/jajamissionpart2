import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import PNLLessonNav from "@/components/PNLLessonNav";
import {
  PhrasesLessonTemplate,
  PhrasesLessonConfig,
} from "@/components/vocabulary/PhrasesLessonTemplate";
import { useVocabularyAudio } from "@/hooks/useVocabularyAudio";

const LESSON_IMAGE_URL_2 =
  "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2004_47_33%20PM%20(1).png";

// Phrases extracted from the reference image.
const FOOD_AND_DRINKS_PHRASES_CONFIG: PhrasesLessonConfig = {
  id: "food-and-drinks-phrases",
  title: "Food & Drinks - Lesson 1",
  subtitle: "Practice using the new words in simple sentences.",
  imageUrl: LESSON_IMAGE_URL_2,
  phrases: [
    {
      english: "I eat bread.",
      portuguese: "Eu como pão.",
    },
    {
      english: "I eat cheese.",
      portuguese: "Eu como queijo.",
    },
    {
      english: "You eat cookies.",
      portuguese: "Você come biscoitos doces.",
    },
    {
      english: "I drink water.",
      portuguese: "Eu bebo água.",
    },
    {
      english: "I drink milk.",
      portuguese: "Eu bebo leite.",
    },
    {
      english: "You drink juice.",
      portuguese: "Você bebe suco.",
    },
    {
      english: "I eat bread and butter.",
      portuguese: "Eu como pão com manteiga.",
    },
    {
      english: "I drink coffee with milk.",
      portuguese: "Eu bebo café com leite.",
    },
    {
      english: "I eat crackers and you drink tea.",
      portuguese: "Eu como bolachas salgadas e você bebe chá.",
    },
    {
      english: "I eat bread, ham, and cheese. And you?",
      portuguese: "Eu como pão, presunto e queijo. E você?",
    },
  ],
};

export default function FoodAndDrinksLesson2Page() {
  const allTexts = useMemo(
    () => FOOD_AND_DRINKS_PHRASES_CONFIG.phrases.map((p) => p.english),
    []
  );

  // Uses the same cached-audio system as the first page.
  const { play, urlMap, isPreloading } = useVocabularyAudio(allTexts);

  return (
    <div className="bg-gradient-to-br from-sky-50 to-sky-100/60 min-h-screen flex flex-col">
      {/* Top navigation bar */}
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between">
          <Link
            to="/lessons/food-and-drinks"
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-sky-700 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow hover:bg-sky-800 transition"
          >
            ⬅ Back to page 1
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
          config={FOOD_AND_DRINKS_PHRASES_CONFIG}
          onPlayAudio={play}
          isLoading={isPreloading}
          urlMap={urlMap}
        />
      </div>

      <PNLLessonNav
        backTo="/lessons/food-and-drinks"
        backLabel="Back to page 1"
      />
    </div>
  );
}
