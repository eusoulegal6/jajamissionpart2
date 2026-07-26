import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import PNLLessonNav from "@/components/PNLLessonNav";
import {
  VocabularyLessonTemplate,
  VocabularyLessonConfig,
} from "@/components/vocabulary/VocabularyLessonTemplate";
import { useVocabularyAudio } from "@/hooks/useVocabularyAudio";

const LESSON4_IMAGE_URL =
  "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2005_09_17%20PM%20(1).png";

const LESSON4_CONFIG: VocabularyLessonConfig = {
  id: "lesson-4-languages-and-study",
  title: "Lesson 4 – Languages & Study",
  imageUrl: LESSON4_IMAGE_URL,
  verbs: [
    { english: "speak", portuguese: "falar" },
    { english: "study", portuguese: "estudar" },
  ],
  newWords: [
    { english: "Portuguese", portuguese: "português" },
    { english: "English", portuguese: "inglês" },
    { english: "French", portuguese: "francês" },
    { english: "Spanish", portuguese: "espanhol" },
    { english: "Italian", portuguese: "italiano" },
    { english: "German", portuguese: "alemão" },
    { english: "friend", portuguese: "amigo(a)" },
    { english: "teacher", portuguese: "professor(a)" },
    { english: "my", portuguese: "meu(s), minha(s)" },
    { english: "your", portuguese: "seu(s), sua(s)" },
    { english: "we", portuguese: "nós" },
    { english: "they", portuguese: "eles, elas" },
    { english: "here", portuguese: "aqui" },
    { english: "there", portuguese: "lá" },
    { english: "too", portuguese: "também" },
    { english: "with", portuguese: "com" },
  ],
  usefulPhrases: [
    {
      english: "I drink coffee in the morning.",
      portuguese: "Eu bebo café de manhã.",
    },
    {
      english: "You study English in the afternoon.",
      portuguese: "Você estuda inglês à tarde.",
    },
    {
      english: "I study English at school.",
      portuguese: "Eu estudo inglês na escola.",
    },
    {
      english: "Do you want to study with me?",
      portuguese: "Você quer estudar comigo?",
    },
  ],
  grammarExamples: [
    {
      english: "We speak Italian at school.",
      portuguese: "Nós falamos italiano na escola.",
    },
    {
      english: "We study Spanish here, too.",
      portuguese: "Nós estudamos espanhol aqui também.",
    },
    {
      english: "They study French there.",
      portuguese: "Eles estudam francês lá.",
    },
    {
      english: "They want to study here.",
      portuguese: "Eles querem estudar aqui.",
    },
    {
      english: "We want to speak English.",
      portuguese: "Nós queremos falar inglês.",
    },
    {
      english: "They want to study German.",
      portuguese: "Eles querem estudar alemão.",
    },
    {
      english: "My friend speaks Portuguese.",
      portuguese: "Meu amigo fala português.",
    },
    {
      english: "My teacher studies French.",
      portuguese: "Meu professor estuda francês.",
    },
    {
      english: "We like to study with friends.",
      portuguese: "Nós gostamos de estudar com amigos.",
    },
    {
      english: "They prefer to speak English here.",
      portuguese: "Eles preferem falar inglês aqui.",
    },
    {
      english: "Your teacher speaks Spanish, too.",
      portuguese: "Seu professor fala espanhol também.",
    },
    {
      english: "We eat and drink with friends.",
      portuguese: "Nós comemos e bebemos com amigos.",
    },
  ],
};

export default function Lesson4Page() {
  const allTexts = useMemo(
    () => [
      ...LESSON4_CONFIG.verbs.map((v) => v.english),
      ...LESSON4_CONFIG.newWords.map((w) => w.english),
      ...LESSON4_CONFIG.usefulPhrases.map((p) => p.english),
      ...LESSON4_CONFIG.grammarExamples.map((g) => g.english),
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
            to="/lessons/lesson-4-2"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-sky-700 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow hover:bg-sky-800 transition"
          >
            Next page: Practice sentences
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="flex-1">
        <VocabularyLessonTemplate
          config={LESSON4_CONFIG}
          onPlayAudio={play}
          isLoading={isPreloading}
          urlMap={urlMap}
        />
      </div>

      <PNLLessonNav
        backTo="/lessons"
        backLabel="Back to lessons menu"
        nextTo="/lessons/lesson-4-2"
        nextLabel="Next page: Practice sentences"
      />
    </div>
  );
}
