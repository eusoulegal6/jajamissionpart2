
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Home,
  Trophy,
  Star,
  RotateCcw,
  Loader,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  question: string;
  options: { letter: string; text: string }[];
  answer: string;
  explanation: string;
}

interface QuizInterfaceProps {
  chatHistory: { role: string; content: string }[];
  isLoading: boolean;
  onGoHome: () => void;
  onRestart?: () => void;
  quizTheme?: string;
}

function parseQuizQuestions(text: string): QuizQuestion[] {
  if (typeof text !== "string") return [];

  const questions: QuizQuestion[] = [];
  // Split by question markers [Q1], [Q2], etc.
  const questionBlocks = text.split(/\[Q\d+\]\s*/).filter(Boolean);

  for (const block of questionBlocks) {
    const lines = block.trim().split("\n").filter(Boolean);
    if (lines.length < 6) continue;

    const questionText = lines[0].trim();
    const options: { letter: string; text: string }[] = [];
    let answer = "";
    let explanation = "";

    for (const line of lines.slice(1)) {
      const optionMatch = line.match(/^\[([A-D])\]\s*(.+)/);
      const answerMatch = line.match(/^\[ANSWER\]\s*([A-D])/);
      const explanationMatch = line.match(/^\[EXPLANATION\]\s*(.+)/);

      if (optionMatch) {
        options.push({ letter: optionMatch[1], text: optionMatch[2].trim() });
      } else if (answerMatch) {
        answer = answerMatch[1];
      } else if (explanationMatch) {
        explanation = explanationMatch[1].trim();
      }
    }

    if (questionText && options.length === 4 && answer) {
      questions.push({ question: questionText, options, answer, explanation });
    }
  }

  return questions;
}

const normalizeQuizText = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text: unknown }).text ?? "");
        }
        return "";
      })
      .join("\n");
  }
  return "";
};

const optionColors = {
  idle: [
    "border-sky-200 bg-sky-50/80 hover:bg-sky-100 hover:border-sky-300",
    "border-violet-200 bg-violet-50/80 hover:bg-violet-100 hover:border-violet-300",
    "border-amber-200 bg-amber-50/80 hover:bg-amber-100 hover:border-amber-300",
    "border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100 hover:border-emerald-300",
  ],
  idleText: [
    "text-sky-700",
    "text-violet-700",
    "text-amber-700",
    "text-emerald-700",
  ],
  letterBg: [
    "bg-sky-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-emerald-500",
  ],
};

const QuizInterface: React.FC<QuizInterfaceProps> = ({
  chatHistory,
  isLoading,
  onGoHome,
  onRestart,
  quizTheme,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<
    { selected: string; correct: string; isCorrect: boolean }[]
  >([]);

  const assistantContent = useMemo(() => {
    const assistantMessage = chatHistory.find((m) => m.role === "assistant");
    return normalizeQuizText(assistantMessage?.content);
  }, [chatHistory]);

  // Parse questions from the AI response
  useEffect(() => {
    if (assistantContent && questions.length === 0) {
      const parsed = parseQuizQuestions(assistantContent);
      if (parsed.length > 0) {
        setQuestions(parsed);
      }
    }
  }, [assistantContent, questions.length]);

  const currentQuestion = questions[currentIndex];
  const total = questions.length;

  const handleSelect = useCallback(
    (letter: string) => {
      if (hasAnswered) return;
      setSelectedAnswer(letter);
    },
    [hasAnswered]
  );

  const handleConfirm = useCallback(() => {
    if (!selectedAnswer || !currentQuestion) return;
    const isCorrect = selectedAnswer === currentQuestion.answer;
    if (isCorrect) setScore((s) => s + 1);
    setHasAnswered(true);
    setAnsweredQuestions((prev) => [
      ...prev,
      {
        selected: selectedAnswer,
        correct: currentQuestion.answer,
        isCorrect,
      },
    ]);
  }, [selectedAnswer, currentQuestion]);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    } else {
      setShowResults(true);
    }
  }, [currentIndex, total]);

  // Loading state — also guard against missing currentQuestion (out of range)
  if (isLoading || questions.length === 0 || (!showResults && !currentQuestion)) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100">
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center shadow-xl animate-pulse">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <div
              className="absolute -inset-3 rounded-full border-4 border-violet-200 animate-spin"
              style={{ borderTopColor: "transparent", animationDuration: "2s" }}
            />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
              Preparing your Quiz
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-xs">
              Generating questions about {quizTheme || "the selected topic"}...
            </p>
          </div>
          <div className="flex gap-1.5 mt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2.5 w-2.5 rounded-full bg-violet-400 animate-bounce"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const percentage = Math.round((score / total) * 100);
    const getMessage = () => {
      if (percentage === 100) return "Perfect! Amazing! 🎉";
      if (percentage >= 80) return "Excellent work! 🌟";
      if (percentage >= 60) return "Well done! Keep practicing! 💪";
      if (percentage >= 40) return "Good effort! You're improving! 📚";
      return "Keep practicing! You'll get there! 🚀";
    };

    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 flex flex-col items-center max-w-md w-full">
            {/* Score circle */}
            <div className="relative mb-8">
              <div
                className={cn(
                  "h-32 w-32 md:h-40 md:w-40 rounded-full flex flex-col items-center justify-center shadow-2xl",
                  percentage >= 80
                    ? "bg-gradient-to-br from-emerald-400 to-teal-500"
                    : percentage >= 60
                    ? "bg-gradient-to-br from-amber-400 to-orange-500"
                    : "bg-gradient-to-br from-rose-400 to-pink-500"
                )}
              >
                <Trophy className="h-8 w-8 md:h-10 md:w-10 text-white/80 mb-1" />
                <span className="text-4xl md:text-5xl font-black text-white">
                  {score}/{total}
                </span>
              </div>
              {percentage >= 80 && (
                <>
                  <Star className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 fill-yellow-400 animate-pulse" />
                  <Star className="absolute -bottom-1 -left-3 h-6 w-6 text-yellow-400 fill-yellow-400 animate-pulse" style={{ animationDelay: "300ms" }} />
                </>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-2 text-center">
              {getMessage()}
            </h2>
            <p className="text-muted-foreground text-base md:text-lg mb-8 text-center">
              You got {score} out of {total} questions right ({percentage}%)
            </p>

            {/* Question review */}
            <div className="w-full space-y-3 mb-10">
              {answeredQuestions.map((aq, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 border",
                    aq.isCorrect
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-rose-50 border-rose-200"
                  )}
                >
                  {aq.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                  )}
                  <span className="text-sm font-medium text-foreground flex-1 line-clamp-1">
                    {questions[i]?.question}
                  </span>
                  {!aq.isCorrect && (
                    <span className="text-xs font-bold text-rose-600">
                      Answer: {aq.correct}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full">
              {onRestart && (
                <Button
                  onClick={onRestart}
                  className="w-full h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white shadow-lg"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Play Again
                </Button>
              )}
              <Button
                variant="outline"
                onClick={onGoHome}
                className="w-full h-12 rounded-2xl text-base font-semibold"
              >
                <Home className="h-5 w-5 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Question screen
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onGoHome}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Home className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500">
              {currentIndex + 1} / {total}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-600">{score}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentIndex + (hasAnswered ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto px-5 py-4 md:py-8">
        <div className="max-w-xl mx-auto">
          <div className="mb-8 md:mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="inline-block px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold uppercase tracking-wider mb-4">
              Question {currentIndex + 1}
            </span>
            <h2 className="text-xl md:text-2xl font-black text-foreground leading-snug">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3 md:space-y-4">
            {currentQuestion.options.map((option, i) => {
              const isSelected = selectedAnswer === option.letter;
              const isCorrect = option.letter === currentQuestion.answer;
              const showCorrect = hasAnswered && isCorrect;
              const showWrong = hasAnswered && isSelected && !isCorrect;

              return (
                <button
                  key={option.letter}
                  onClick={() => handleSelect(option.letter)}
                  disabled={hasAnswered}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 md:p-5 rounded-2xl border-2 transition-all duration-300 text-left",
                    "animate-in fade-in slide-in-from-bottom-4",
                    showCorrect
                      ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200 scale-[1.01]"
                      : showWrong
                      ? "border-rose-400 bg-rose-50 ring-2 ring-rose-200"
                      : isSelected
                      ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200 scale-[1.01]"
                      : optionColors.idle[i]
                  )}
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-xl text-white font-black text-lg md:text-xl shrink-0 transition-all",
                      showCorrect
                        ? "bg-emerald-500"
                        : showWrong
                        ? "bg-rose-500"
                        : isSelected
                        ? "bg-indigo-500"
                        : optionColors.letterBg[i]
                    )}
                  >
                    {showCorrect ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : showWrong ? (
                      <XCircle className="h-6 w-6" />
                    ) : (
                      option.letter
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-base md:text-lg font-semibold flex-1",
                      showCorrect
                        ? "text-emerald-800"
                        : showWrong
                        ? "text-rose-800"
                        : isSelected
                        ? "text-indigo-800"
                        : optionColors.idleText[i]
                    )}
                  >
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {hasAnswered && currentQuestion.explanation && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div
                className={cn(
                  "rounded-2xl p-5 border",
                  selectedAnswer === currentQuestion.answer
                    ? "bg-emerald-50/80 border-emerald-200"
                    : "bg-amber-50/80 border-amber-200"
                )}
              >
                <p className="text-sm md:text-base font-semibold text-foreground mb-1">
                  {selectedAnswer === currentQuestion.answer
                    ? "✅ Correct!"
                    : `❌ Correct answer: ${currentQuestion.answer}`}
                </p>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/70 bg-white/90 backdrop-blur-xl px-5 py-4">
        <div className="max-w-xl mx-auto">
          {!hasAnswered ? (
            <Button
              onClick={handleConfirm}
              disabled={!selectedAnswer}
              className={cn(
                "w-full h-14 rounded-2xl text-lg font-bold shadow-lg transition-all",
                selectedAnswer
                  ? "bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              Confirm Answer
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="w-full h-14 rounded-2xl text-lg font-bold bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white shadow-lg"
            >
              {currentIndex === total - 1 ? "See Results" : "Next Question"}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizInterface;
