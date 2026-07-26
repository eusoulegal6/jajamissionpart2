import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import PNLLessonNav from "@/components/PNLLessonNav";
import {
  VocabularyLessonTemplate,
  VocabularyLessonConfig,
} from "@/components/vocabulary/VocabularyLessonTemplate";
import { useVocabularyAudio } from "@/hooks/useVocabularyAudio";

const LESSON6_IMAGE_URL =
  "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/Gemini_Generated_Image_npqbpvnpqbpvnpqb%20(1).png";

const LESSON6_CONFIG: VocabularyLessonConfig = {
  id: "lesson-6-family-and-travel",
  title: "Lesson 6 – Family, Work & Travel",
  imageUrl: LESSON6_IMAGE_URL,
  verbs: [
    { english: "go", portuguese: "ir" },
    { english: "see", portuguese: "ver" },
  ],
  newWords: [
    { english: "father", portuguese: "pai" },
    { english: "mother", portuguese: "mãe" },
    { english: "parents", portuguese: "pais" },
    { english: "brother", portuguese: "irmão" },
    { english: "sister", portuguese: "irmã" },
    { english: "children", portuguese: "filhos, crianças" },
    { english: "husband", portuguese: "marido, esposo" },
    { english: "wife", portuguese: "esposa" },
    { english: "family", portuguese: "família" },
    { english: "neighbor", portuguese: "vizinho(a)" },
    { english: "boss", portuguese: "chefe" },
    { english: "co-worker", portuguese: "colega de trabalho" },
    { english: "class", portuguese: "aula" },
    { english: "work", portuguese: "trabalho, emprego" },
    { english: "France", portuguese: "França" },
    {
      english: "the United Kingdom (U.K.)",
      portuguese: "Reino Unido",
    },
  ],
  usefulPhrases: [
    {
      english: "I see my neighbor at work.",
      portuguese: "Eu vejo meu vizinho no trabalho.",
    },
    {
      english: "Do you study at home?",
      portuguese: "Você estuda em casa?",
    },
    {
      english: "I see my parents in the evening.",
      portuguese: "Eu vejo meus pais à noite.",
    },
    {
      english: "I don't study at night.",
      portuguese: "Eu não estudo à noite.",
    },
  ],
  grammarExamples: [
    {
      english: "Do they live in Germany?",
      portuguese: "Eles moram na Alemanha?",
    },
    {
      english: "Do they go to school in the morning?",
      portuguese: "Eles vão para a escola de manhã?",
    },
    {
      english: "Do they speak Italian?",
      portuguese: "Eles falam italiano?",
    },
    {
      english: "Where do they want to go?",
      portuguese: "Aonde eles querem ir?",
    },
    {
      english: "They want to go to Germany.",
      portuguese: "Eles querem ir para a Alemanha.",
    },
    {
      english: "We want to go to school.",
      portuguese: "Nós queremos ir para a escola.",
    },
    {
      english: "They go to class in the evening.",
      portuguese: "Eles vão para a aula à noite.",
    },
    {
      english: "Do they want to go to the U.K.?",
      portuguese: "Eles querem ir para o Reino Unido?",
    },
    {
      english: "I see my family in the morning.",
      portuguese: "Eu vejo minha família de manhã.",
    },
    {
      english: "We go to work with my co-worker.",
      portuguese: "Nós vamos para o trabalho com meu colega.",
    },
    {
      english: "My brother goes to France.",
      portuguese: "Meu irmão vai para a França.",
    },
    {
      english: "Do you see your boss at work?",
      portuguese: "Você vê seu chefe no trabalho?",
    },
    {
      english: "They want to see their parents.",
      portuguese: "Eles querem ver os pais deles.",
    },
    {
      english: "My sister lives in Italy.",
      portuguese: "Minha irmã mora na Itália.",
    },
  ],
};

export default function Lesson6Page() {
  const allTexts = useMemo(
    () => [
      ...LESSON6_CONFIG.verbs.map((v) => v.english),
      ...LESSON6_CONFIG.newWords.map((w) => w.english),
      ...LESSON6_CONFIG.usefulPhrases.map((p) => p.english),
      ...LESSON6_CONFIG.grammarExamples.map((g) => g.english),
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
            to="/lessons/lesson-6-2"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-sky-700 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow hover:bg-sky-800 transition"
          >
            Next page: Practice sentences
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="flex-1">
        <VocabularyLessonTemplate
          config={LESSON6_CONFIG}
          onPlayAudio={play}
          isLoading={isPreloading}
          urlMap={urlMap}
        />
      </div>

      <PNLLessonNav
        backTo="/lessons"
        backLabel="Back to lessons menu"
        nextTo="/lessons/lesson-6-2"
        nextLabel="Next page: Practice sentences"
      />
    </div>
  );
}
