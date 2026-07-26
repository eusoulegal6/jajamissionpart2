import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PNLLessonNav from "@/components/PNLLessonNav";
import {
  PhrasesLessonTemplate,
  PhrasesLessonConfig,
} from "@/components/vocabulary/PhrasesLessonTemplate";
import { useVocabularyAudio } from "@/hooks/useVocabularyAudio";

const LESSON5_IMAGE_URL_2 =
  "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/Gemini_Generated_Image_524ock524ock524o%20(1).png";

const LESSON5_PHRASES_CONFIG: PhrasesLessonConfig = {
  id: "lesson-5-live-and-understand-phrases",
  title: "Lesson 5 – Live, Study & Countries",
  subtitle: "Practice sentences about where you live, study and travel.",
  imageUrl: LESSON5_IMAGE_URL_2,
  phrases: [
    {
      english: "We want to live abroad.",
      portuguese: "Nós queremos morar no exterior.",
    },
    {
      english: "Do you live alone?",
      portuguese: "Você mora sozinho?",
    },
    {
      english: "I don't understand this word.",
      portuguese: "Eu não entendo essa palavra.",
    },
    {
      english: "Do you want to live in Italy?",
      portuguese: "Você quer morar na Itália?",
    },
    {
      english: "They want to live in that country.",
      portuguese: "Eles querem morar naquele país.",
    },
    {
      english: "Do you want to live in this city?",
      portuguese: "Você quer morar nessa cidade?",
    },
    {
      english: "We don't live here.",
      portuguese: "Nós não moramos aqui.",
    },
    {
      english: "They don't understand that language.",
      portuguese: "Eles não entendem aquele idioma.",
    },
    {
      english: "Where do you study English?",
      portuguese: "Onde você estuda inglês?",
    },
    {
      english: "Where do you want to eat?",
      portuguese: "Onde você quer comer?",
    },
  ],
};

export default function Lesson5Page2() {
  const allTexts = useMemo(
    () => LESSON5_PHRASES_CONFIG.phrases.map((p) => p.english),
    []
  );

  const { play, urlMap, isPreloading } = useVocabularyAudio(allTexts);

  return (
    <div className="bg-gradient-to-br from-sky-50 to-sky-100/60 min-h-screen flex flex-col">
      {/* Top navigation bar */}
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between">
          <Link
            to="/lessons/lesson-5"
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
          config={LESSON5_PHRASES_CONFIG}
          onPlayAudio={play}
          isLoading={isPreloading}
          urlMap={urlMap}
        />
      </div>

      <PNLLessonNav
        backTo="/lessons/lesson-5"
        backLabel="Back to page 1"
      />
    </div>
  );
}
