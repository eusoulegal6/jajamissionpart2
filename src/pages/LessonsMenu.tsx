import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { BookOpen, Lock, ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import ComplementaryLessonsDisplay from "@/components/lesson-pages/ComplementaryLessonsDisplay";
import { useKraken } from "@/contexts/KrakenContext";
import PNLBookModeScreen from "@/components/PNLBookModeScreen";

interface LessonCard {
  id: string;
  title: string;
  subtitle: string;
  href?: string;
  active: boolean;
  complementaryLessonIds?: string[];
}

const LESSONS: LessonCard[] = [
  {
    id: "1",
    title: "Lesson 1",
    subtitle: "Eat & Drink",
    href: "/lessons/food-and-drinks",
    active: true,
    complementaryLessonIds: ["Avançado_1764467250203", "Avançado_1768851427153"],
  },
  {
    id: "2",
    title: "Lesson 2",
    subtitle: "Want & Like",
    href: "/lessons/lesson-2",
    active: true,
    complementaryLessonIds: ["Avançado_1764557245707", "Avançado_1768857326832"],
  },
  {
    id: "3",
    title: "Lesson 3",
    subtitle: "Prefer & Love",
    href: "/lessons/lesson-3",
    active: true,
    complementaryLessonIds: ["Avançado_1764985870657", "Avançado_1768859476702"],
  },
  {
    id: "4",
    title: "Lesson 4",
    subtitle: "Speak & Study",
    href: "/lessons/lesson-4",
    active: true,
    complementaryLessonIds: ["Avançado_1768352688539", "Avançado_1768873122417"],
  },
  {
    id: "5",
    title: "Lesson 5",
    subtitle: "Live & Understand",
    href: "/lessons/lesson-5",
    active: true,
    complementaryLessonIds: ["Avançado_1768432281145", "Avançado_1768874580382"],
  },
  {
    id: "6",
    title: "Lesson 6",
    subtitle: "Go & See",
    href: "/lessons/lesson-6",
    active: true,
    complementaryLessonIds: ["Avançado_1768434850023", "Avançado_1768881224164"],
  },
];

export default function LessonsMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { releaseKraken } = useKraken();
  const [keySequence, setKeySequence] = useState("");
  const [showBookMode, setShowBookMode] = useState(false);

  // Check if we should show book mode from navigation state
  useEffect(() => {
    if (location.state?.showBookMode) {
      setShowBookMode(true);
    }
  }, [location.state]);

  // Cheat code detection for edit mode
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.match(/^[a-zA-Z0-9]$/)) {
        setKeySequence(prev => {
          const newSequence = (prev + event.key).slice(-7);
          
          if (newSequence === "abcdefg") {
            console.log("✏️ EDIT MODE ACTIVATED on PNL Lessons!");
            releaseKraken();
            return "";
          }
          return newSequence;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [releaseKraken]);

  if (showBookMode) {
    return <PNLBookModeScreen onBack={() => setShowBookMode(false)} />;
  }

  return (
    <div className="bg-gradient-to-br from-sky-50 to-sky-100/60 min-h-screen flex flex-col">
      {/* Back button */}
      <div className="pt-4 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-sky-700 hover:text-sky-900 hover:bg-sky-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>

      {/* Header */}
      <header className="pt-4 pb-4 px-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-sky-900 mb-2">
          Choose your lesson
        </h1>
        <p className="text-sky-700 text-sm sm:text-base">
          Start learning English with our vocabulary lessons
        </p>
      </header>

      {/* Mode Selection */}
      <div className="px-4 pb-6">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 border-sky-300 bg-white text-sky-800 hover:bg-sky-50"
            onClick={() => setShowBookMode(false)}
          >
            <Compass className="w-4 h-4 mr-2" />
            Explorar Lições
          </Button>
          <Button
            className="flex-1 h-12 bg-sky-700 hover:bg-sky-800 text-white"
            onClick={() => setShowBookMode(true)}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Modo Livro
          </Button>
        </div>
      </div>

      {/* Lessons Grid */}
      <main className="flex-1 px-4 pb-8">
        <div className="max-w-3xl mx-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LESSONS.map((lesson) => (
            <div key={lesson.id} className="flex flex-col">
              {/* Main lesson card */}
              <div
                className={`rounded-2xl p-6 shadow-md transition ${
                  lesson.active
                    ? "bg-white hover:shadow-lg"
                    : "bg-gray-100 opacity-70"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {lesson.active ? (
                    <BookOpen className="w-6 h-6 text-sky-600" />
                  ) : (
                    <Lock className="w-6 h-6 text-gray-400" />
                  )}
                  <span className="text-lg font-semibold text-sky-900">
                    {lesson.title}
                  </span>
                </div>
                <p
                  className={`text-sm mb-4 ${
                    lesson.active ? "text-sky-700" : "text-gray-500"
                  }`}
                >
                  {lesson.subtitle}
                </p>
                {lesson.active && lesson.href ? (
                  <Link
                    to={lesson.href}
                    className="inline-flex w-full items-center justify-center rounded-full bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-sky-800 transition"
                  >
                    Start lesson
                  </Link>
                ) : (
                  <span className="inline-flex w-full items-center justify-center rounded-full bg-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-500 cursor-not-allowed">
                    Coming soon
                  </span>
                )}
              </div>

              {/* Complementary Lessons */}
              {lesson.complementaryLessonIds && lesson.complementaryLessonIds.length > 0 && (
                <div className="-mt-1 mx-2 bg-gradient-to-b from-sky-50 to-sky-100/70 border-x border-b border-sky-200 rounded-b-2xl px-3 pt-2 pb-3 shadow-sm">
                  <ComplementaryLessonsDisplay
                    lessonIds={lesson.complementaryLessonIds}
                    pnlLessonKey={`lesson-${lesson.id}`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
