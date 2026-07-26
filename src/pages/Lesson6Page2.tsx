import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PNLLessonNav from "@/components/PNLLessonNav";
import {
  PhrasesLessonTemplate,
  PhrasesLessonConfig,
} from "@/components/vocabulary/PhrasesLessonTemplate";
import { useVocabularyAudio } from "@/hooks/useVocabularyAudio";

const LESSON6_IMAGE_URL_2 =
  "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/Gemini_Generated_Image_1t6vgr1t6vgr1t6v%20(1).png";

const LESSON6_PHRASES_CONFIG: PhrasesLessonConfig = {
  id: "lesson-6-family-and-travel-phrases",
  title: "Lesson 6 – Family, Work & Travel",
  subtitle: "Practice sentences using go and see with family, work and travel.",
  imageUrl: LESSON6_IMAGE_URL_2,
  phrases: [
    {
      english: "I go to work in the morning.",
      portuguese: "Eu vou para o trabalho de manhã.",
    },
    {
      english: "They go to school in the afternoon.",
      portuguese: "Eles vão para a escola à tarde.",
    },
    {
      english: "They want to go to France.",
      portuguese: "Eles querem ir para a França.",
    },
    {
      english: "We don't like to go to class in the evening.",
      portuguese: "Nós não gostamos de ir para a aula à noite.",
    },
    {
      english: "I want to go to the U.S.A.",
      portuguese: "Eu quero ir para os E.U.A.",
    },
    {
      english: "I see my husband at home.",
      portuguese: "Eu vejo meu esposo em casa.",
    },
    {
      english: "Do they speak English at work?",
      portuguese: "Eles falam inglês no trabalho?",
    },
    {
      english: "Do they speak Italian or French?",
      portuguese: "Eles falam italiano ou francês?",
    },
    {
      english: "Do you live with your family?",
      portuguese: "Você mora com a sua família?",
    },
    {
      english: "Do you speak German with your teacher?",
      portuguese: "Você fala alemão com seu professor?",
    },
  ],
};

export default function Lesson6Page2() {
  const allTexts = useMemo(
    () => LESSON6_PHRASES_CONFIG.phrases.map((p) => p.english),
    []
  );

  const { play, urlMap, isPreloading } = useVocabularyAudio(allTexts);

  return (
    <div className="bg-gradient-to-br from-sky-50 to-sky-100/60 min-h-screen flex flex-col">
      {/* Top navigation bar */}
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between">
          <Link
            to="/lessons/lesson-6"
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
          config={LESSON6_PHRASES_CONFIG}
          onPlayAudio={play}
          isLoading={isPreloading}
          urlMap={urlMap}
        />
      </div>

      <PNLLessonNav
        backTo="/lessons/lesson-6"
        backLabel="Back to page 1"
      />
    </div>
  );
}
