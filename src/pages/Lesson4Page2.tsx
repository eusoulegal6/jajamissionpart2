import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PNLLessonNav from "@/components/PNLLessonNav";
import {
  PhrasesLessonTemplate,
  PhrasesLessonConfig,
} from "@/components/vocabulary/PhrasesLessonTemplate";
import { useVocabularyAudio } from "@/hooks/useVocabularyAudio";

const LESSON4_IMAGE_URL_2 =
  "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2005_12_38%20PM%20(1).png";

const LESSON4_PHRASES_CONFIG: PhrasesLessonConfig = {
  id: "lesson-4-languages-and-study-phrases",
  title: "Lesson 4 – Languages & Study",
  subtitle: "Practice sentences using speak and study with languages and friends.",
  imageUrl: LESSON4_IMAGE_URL_2,
  phrases: [
    {
      english: "I like to speak English with my friends.",
      portuguese: "Eu gosto de falar inglês com meus amigos.",
    },
    {
      english: "They speak Spanish at school.",
      portuguese: "Eles falam espanhol na escola.",
    },
    {
      english: "They like to study Portuguese.",
      portuguese: "Eles gostam de estudar português.",
    },
    {
      english: "We want to study Italian, too.",
      portuguese: "Nós queremos estudar italiano também.",
    },
    {
      english: "Do you study here or there?",
      portuguese: "Você estuda aqui ou lá?",
    },
    {
      english: "Do you want to study with me?",
      portuguese: "Você quer estudar comigo?",
    },
    {
      english: "Do you speak German with your teacher?",
      portuguese: "Você fala alemão com seu professor?",
    },
    {
      english: "I speak Italian with my friend.",
      portuguese: "Eu falo italiano com meu amigo.",
    },
    {
      english: "We want to study in the morning.",
      portuguese: "Nós queremos estudar de manhã.",
    },
    {
      english: "Do you want to study in the afternoon?",
      portuguese: "Você quer estudar à tarde?",
    },
  ],
};

export default function Lesson4Page2() {
  const allTexts = useMemo(
    () => LESSON4_PHRASES_CONFIG.phrases.map((p) => p.english),
    []
  );

  const { play, urlMap, isPreloading } = useVocabularyAudio(allTexts);

  return (
    <div className="bg-gradient-to-br from-sky-50 to-sky-100/60 min-h-screen flex flex-col">
      {/* Top navigation bar */}
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between">
          <Link
            to="/lessons/lesson-4"
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
          config={LESSON4_PHRASES_CONFIG}
          onPlayAudio={play}
          isLoading={isPreloading}
          urlMap={urlMap}
        />
      </div>

      <PNLLessonNav
        backTo="/lessons/lesson-4"
        backLabel="Back to page 1"
      />
    </div>
  );
}
