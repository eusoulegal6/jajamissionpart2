
import { useState, useRef } from "react";
import { AppMode } from "@/types/AppMode";

export type GameType = "guessWhoWhere" | "dreamPainter" | "realWorldHunt" | "";

export function useIndexState(initialState: any = null) {
  const [inputMessage, setInputMessage] = useState(initialState?.inputMessage || "");
  const [currentMode, setCurrentMode] = useState<AppMode>(initialState?.currentMode || "home");
  const [currentGame, setCurrentGame] = useState<GameType>(initialState?.currentGame || "");
  const [rolePlaySettings, setRolePlaySettings] = useState<{
    difficulty: string;
    situation: string;
  } | null>(initialState?.rolePlaySettings || null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Conversation states
  const [level, setLevel] = useState<string>(initialState?.level || "");
  const [corrections, setCorrections] = useState<boolean>(initialState?.corrections ?? false);

  // Quiz
  const [quizDifficulty, setQuizDifficulty] = useState<string>(initialState?.quizDifficulty || "");
  const [quizTheme, setQuizTheme] = useState<string>(initialState?.quizTheme || "");
  const [customThemeInfo, setCustomThemeInfo] = useState<string>(initialState?.customThemeInfo || "");

  // Listening
  const [listeningDifficulty, setListeningDifficulty] = useState<string>(initialState?.listeningDifficulty || "");
  const [pendingListeningDifficulty, setPendingListeningDifficulty] = useState<string | null>(initialState?.pendingListeningDifficulty || null);

  // Perguntas mode
  const [questionsDifficulty, setQuestionsDifficulty] = useState<string>(initialState?.questionsDifficulty || "");
  const [questionsTheme, setQuestionsTheme] = useState<string>(initialState?.questionsTheme || "");
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [showQuestionsSetup, setShowQuestionsSetup] = useState(initialState?.showQuestionsSetup ?? false);
  const [perguntasQuestions, setPerguntasQuestions] = useState<string[]>(initialState?.perguntasQuestions || []);
  const [perguntasQuestionIndex, setPerguntasQuestionIndex] = useState<number>(initialState?.perguntasQuestionIndex || 0);
  const [modeToShowTipFor, setModeToShowTipFor] = useState<AppMode | null>(null);

  // Add clearChat function to state
  const clearChat = () => {
    // If you have a chatHistory state at the top-level, clear it here (else leave it for now)
    // This will mainly be passed down to perguntas flow which doesn't use global history
  };

  return {
    inputMessage, setInputMessage,
    currentMode, setCurrentMode,
    currentGame, setCurrentGame,
    rolePlaySettings, setRolePlaySettings,
    scrollAreaRef,
    level, setLevel,
    corrections, setCorrections,
    quizDifficulty, setQuizDifficulty,
    quizTheme, setQuizTheme,
    customThemeInfo, setCustomThemeInfo,
    listeningDifficulty, setListeningDifficulty,
    pendingListeningDifficulty, setPendingListeningDifficulty,
    questionsDifficulty, setQuestionsDifficulty,
    questionsTheme, setQuestionsTheme,
    questionsLoading, setQuestionsLoading,
    questionsError, setQuestionsError,
    showQuestionsSetup, setShowQuestionsSetup,
    perguntasQuestions, setPerguntasQuestions,
    perguntasQuestionIndex, setPerguntasQuestionIndex,
    modeToShowTipFor, setModeToShowTipFor,
    clearChat, // Add here so it truly exists on state
  };
}
