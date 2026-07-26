import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PNLLessonNav from "@/components/PNLLessonNav";
import {
  PhrasesLessonTemplate,
  PhrasesLessonConfig,
} from "@/components/vocabulary/PhrasesLessonTemplate";
import { useVocabularyAudio } from "@/hooks/useVocabularyAudio";

const LESSON3_IMAGE_URL_2 =
  "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/Gemini_Generated_Image_s8s5rrs8s5rrs8s5%20(1)%20(1).png";

const LESSON3_PHRASES_CONFIG: PhrasesLessonConfig = {
  id: "lesson-3-meals-preferences-phrases",
  title: "Lesson 3 – Meals & Preferences",
  subtitle: "Practice sentences using prefer and love with foods and drinks.",
  imageUrl: LESSON3_IMAGE_URL_2,
  phrases: [
    {
      english: "I prefer to drink a glass of water.",
      portuguese: "Eu prefiro beber um copo de água.",
    },
    {
      english: "I prefer to eat beef and vegetables.",
      portuguese: "Eu prefiro comer carne e legumes.",
    },
    {
      english: "I prefer juice to soda.",
      portuguese: "Eu prefiro suco a refrigerante.",
    },
    {
      english: "I love French fries.",
      portuguese: "Eu amo batatas fritas.",
    },
    {
      english: "I prefer to eat chicken and salad for lunch.",
      portuguese: "Eu prefiro comer frango e salada no almoço.",
    },
    {
      english: "Do you like sausages and bacon?",
      portuguese: "Você gosta de linguiça e bacon?",
    },
    {
      english: "Do you want to drink juice?",
      portuguese: "Você quer beber suco?",
    },
    {
      english: "Do you want to eat fish or beef for dinner?",
      portuguese: "Você quer comer peixe ou carne no jantar?",
    },
    {
      english: "What do you like?",
      portuguese: "Do que você gosta?",
    },
    {
      english: "What do you want to eat?",
      portuguese: "O que você quer comer?",
    },
  ],
};

export default function Lesson3Page2() {
  const allTexts = useMemo(
    () => LESSON3_PHRASES_CONFIG.phrases.map((p) => p.english),
    []
  );

  const { play, urlMap, isPreloading } = useVocabularyAudio(allTexts);

  return (
    <div className="bg-gradient-to-br from-sky-50 to-sky-100/60 min-h-screen flex flex-col">
      {/* Top navigation bar */}
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between">
          <Link
            to="/lessons/lesson-3"
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
          config={LESSON3_PHRASES_CONFIG}
          onPlayAudio={play}
          isLoading={isPreloading}
          urlMap={urlMap}
        />
      </div>

      <PNLLessonNav
        backTo="/lessons/lesson-3"
        backLabel="Back to page 1"
      />
    </div>
  );
}
