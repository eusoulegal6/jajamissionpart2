
import React, { useEffect, useState } from "react";
import HomeScreen from "@/components/chat/HomeScreen";
import ConversationSetup from "@/components/chat/ConversationSetup";
import InterviewSetup from "@/components/chat/InterviewSetup";
import QuizSetup from "@/components/chat/QuizSetup";
import GamesSetup from "@/components/chat/GamesSetup";
import ListeningSetup from "@/components/chat/ListeningSetup";
import RolePlaySetupScreen from "@/components/chat/RolePlaySetupScreen";
import RolePlayIntroScreen from "@/components/chat/RolePlayIntroScreen";
import QuestionsDifficultyScreen from "@/components/chat/QuestionsDifficultyScreen";
import QuestionsThemeScreen from "@/components/chat/QuestionsThemeScreen";
import AIFeedbackPage from "@/components/chat/AIFeedbackPage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getRoleplayIntroMessage } from "@/utils/roleplay-intro-messages";
import { useFetchPerguntasQuestions } from "@/hooks/useFetchPerguntasQuestions";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import TipScreen from "@/components/chat/TipScreen";
import { AppMode } from "@/types/AppMode";
import ContentExplorer from "@/components/content/ContentExplorer";
import TOEFLExplorer from "@/components/content/TOEFLExplorer";
import UserFlashcardsPage from "@/components/UserFlashcardsPage";
import UserAudioFlashcardsPage from "@/components/UserAudioFlashcardsPage";
import CursoCompletoScreen from "@/components/CursoCompletoScreen";
import PronunciationSection from "@/components/PronunciationSection";
import FreePronunciationCheck from "@/components/FreePronunciationCheck";
import TranslatorPage from "@/components/chat/TranslatorPage";
import FlashcardsMenuScreen from "@/components/chat/FlashcardsMenuScreen";
import ConversationMenuScreen from "@/components/chat/ConversationMenuScreen";
import { useNavigate } from "react-router-dom";

type Props = {
  currentMode: AppMode;
  chatHistory: any[];
  rolePlaySettings: any;
  level: string;
  setLevel: (s: string) => void;
  corrections: boolean;
  setCorrections: (b: boolean) => void;
  handleStartConversation: () => void;
  handleBackToHome: () => void;
  quizDifficulty: string;
  setQuizDifficulty: (s: string) => void;
  quizTheme: string;
  setQuizTheme: (s: string) => void;
  customThemeInfo: string;
  setCustomThemeInfo: (s: string) => void;
  handleStartQuiz: () => void;
  handleStartGame: (type: string) => void;
  handleStartInterview: () => void;
  listeningDifficulty: string;
  pendingListeningDifficulty: string | null;
  handleStartListening: (difficulty?: string) => void;
  clearChat: () => void;
  setChatHistory: (a: any) => void;
  setRolePlaySettings: (t: any) => void;
  setCurrentMode: React.Dispatch<React.SetStateAction<AppMode>>;
  setCustomState: (obj: any) => void;
  questionsDifficulty: string;
  setQuestionsDifficulty: (s: string) => void;
  questionsTheme: string;
  setQuestionsTheme: (s: string) => void;
  questionsLoading: boolean;
  setQuestionsLoading: (b: boolean) => void;
  questionsError: string | null;
  setQuestionsError: (e: string | null) => void;
  showQuestionsSetup: boolean;
  setShowQuestionsSetup: (b: boolean) => void;
  perguntasQuestions: string[];
  setPerguntasQuestions: (q: string[]) => void;
  perguntasQuestionIndex: number;
  setPerguntasQuestionIndex: (n: number) => void;
  setInputMessage: (s: string) => void;
  handlePerguntasSelect: () => void;
  handleAskSpecialist: () => void;
  modeToShowTipFor: AppMode | null;
  setModeToShowTipFor: React.Dispatch<React.SetStateAction<AppMode | null>>;
};

// Helper to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const IndexModeRenders: React.FC<Props> = (props) => {
  const {
    currentMode,
    chatHistory,
    rolePlaySettings,
    level,
    setLevel,
    corrections,
    setCorrections,
    handleStartConversation,
    handleBackToHome,
    quizDifficulty,
    setQuizDifficulty,
    quizTheme,
    setQuizTheme,
    customThemeInfo,
    setCustomThemeInfo,
    handleStartQuiz,
    handleStartGame,
    handleStartInterview,
    listeningDifficulty,
    pendingListeningDifficulty,
    handleStartListening,
    clearChat,
    setChatHistory,
    setRolePlaySettings,
    setCurrentMode,
    setCustomState,
    questionsDifficulty,
    setQuestionsDifficulty,
    questionsTheme,
    setQuestionsTheme,
    questionsLoading,
    setQuestionsLoading,
    questionsError,
    setQuestionsError,
    showQuestionsSetup,
    setShowQuestionsSetup,
    perguntasQuestions,
    setPerguntasQuestions,
    perguntasQuestionIndex,
    setPerguntasQuestionIndex,
    setInputMessage,
    handlePerguntasSelect,
    handleAskSpecialist,
    modeToShowTipFor,
    setModeToShowTipFor,
  } = props;

  const { learningLanguage, t } = useLanguage();
  const navigate = useNavigate();

  // New local state for multi-step perguntas setup
  const [stepDifficulty, setStepDifficulty] = useState<string | null>(null);
  const [rolePlayIntroData, setRolePlayIntroData] = useState<{
    difficulty: string;
    situation: string;
    imageUrl?: string;
  } | null>(null);

  const { fetchQuestions } = useFetchPerguntasQuestions();

  // If user selects 'daily' mode, navigate to the complete lessons screen.
  useEffect(() => {
    if (currentMode === 'daily') {
      navigate('/complete-lessons');
      setCurrentMode('home' as AppMode); // Reset mode to avoid re-triggering on back navigation
    }
  }, [currentMode, navigate, setCurrentMode]);

  // If user switches out of perguntas mode, reset the flow steps
  useEffect(() => {
    if (currentMode !== "perguntas") {
      setStepDifficulty(null);
    }
  }, [currentMode]);

  // Cross-mode entry: Always clear chat & state before setting new chat mode
  const handleHomeScreenPreSelect = (mode: string) => {
    // Only do this if not already in that mode and mode is a chat mode
    const chatModes = [
      "specialist", "conversation", "interview", "quiz",
      "games", "listening", "role-play", "perguntas"
    ];
    if (
      (chatModes as string[]).includes(mode) &&
      currentMode === "home"
    ) {
      // Blanket reset: clear chat, input, quiz state, questions, etc
      clearChat();
      setChatHistory([]);
      setRolePlaySettings(null);
      setInputMessage("");
      // questions/quiz resets:
      setQuestionsDifficulty("");
      setQuestionsTheme("");
      setShowQuestionsSetup(false);
      setPerguntasQuestions([]);
      setQuestionsLoading(false);
      setQuestionsError(null);
      setQuizDifficulty("");
      setQuizTheme("");
      setCustomThemeInfo("");
      setLevel("");
      setCorrections(false);
    }
  };

  // FETCH questions when both difficulty+theme is set and not in setup step
  useEffect(() => {
    if (
      currentMode === "perguntas" &&
      !showQuestionsSetup &&
      questionsDifficulty &&
      questionsTheme &&
      perguntasQuestions.length === 0
    ) {
      setQuestionsLoading(true);
      setQuestionsError(null);

      fetchQuestions(learningLanguage, questionsDifficulty, questionsTheme).then(({ data, error }) => {
        if (error) {
          setPerguntasQuestions([]);
          setQuestionsError(t(error));
        } else {
          setPerguntasQuestions(shuffleArray(data));
          setQuestionsError(null);
        }
        setQuestionsLoading(false);
      });
    }
    // We only want to fetch when these change, and we have no questions.
    // Adding perguntasQuestions to deps with the length check prevents re-fetching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMode, showQuestionsSetup, questionsDifficulty, questionsTheme, learningLanguage, t, perguntasQuestions]);

  if (modeToShowTipFor) {
    return (
      <TipScreen
        onProceed={() => {
          if (modeToShowTipFor === "perguntas") {
            handlePerguntasSelect();
          } else {
            setCurrentMode(modeToShowTipFor);
          }
          setModeToShowTipFor(null);
        }}
      />
    );
  }

  // STEP 1: Only show difficulty picker if user is in perguntas mode and in setup, with no difficulty yet
  if (currentMode === "perguntas" && showQuestionsSetup && !stepDifficulty) {
    return (
      <QuestionsDifficultyScreen
        onSelect={difficulty => {
          setStepDifficulty(difficulty);
        }}
        onBack={handleBackToHome}
      />
    );
  }

  // STEP 2: Once difficulty picked, show theme picker for that difficulty
  if (currentMode === "perguntas" && showQuestionsSetup && stepDifficulty) {
    return (
      <QuestionsThemeScreen
        difficulty={stepDifficulty}
        onSelect={theme => {
          setQuestionsDifficulty(stepDifficulty);
          setQuestionsTheme(theme);
          setShowQuestionsSetup(false);
          setInputMessage("");
          clearChat();
          setStepDifficulty(null); // reset local just in case of revisit
          setPerguntasQuestionIndex(0);
        }}
        onBack={() => setStepDifficulty(null)}
        handleAskSpecialist={handleAskSpecialist}
      />
    );
  }

  if (currentMode === "home") {
    return (
      <HomeScreen
        onModePreSelect={handleHomeScreenPreSelect}
        onModeSelect={(mode) => {
          if (mode === 'content' || mode === 'tradutor' || mode === 'conversation-menu' || mode === 'flashcards-menu') {
            setCurrentMode(mode as AppMode);
            return;
          }
          setModeToShowTipFor(mode as AppMode);
        }}
      />
    );
  }

  if (currentMode === 'conversation-menu') {
    return <ConversationMenuScreen
      onSelectChat={() => setModeToShowTipFor('conversation' as AppMode)}
      onSelectPerguntas={() => setModeToShowTipFor('perguntas' as AppMode)}
      onBack={handleBackToHome}
    />;
  }

  if (currentMode === 'content') {
    return <ContentExplorer onBack={handleBackToHome} isEmbedded={true} />;
  }

  if (currentMode === 'toefl') {
    return <TOEFLExplorer onBack={handleBackToHome} isEmbedded={true} />;
  }

  if (currentMode === 'curso-completo') {
    return <CursoCompletoScreen onBack={handleBackToHome} />;
  }

  if (currentMode === 'flashcards-menu') {
    return <FlashcardsMenuScreen
      onSelectFlashcards={() => setCurrentMode('flashcards')}
      onSelectAudioFlashcards={() => setCurrentMode('audio-flashcards')}
      onBack={handleBackToHome}
    />;
  }

  if (currentMode === 'flashcards') {
    return <UserFlashcardsPage onBack={handleBackToHome} />;
  }

  if (currentMode === 'audio-flashcards') {
    return <UserAudioFlashcardsPage onBack={handleBackToHome} />;
  }

  if (currentMode === 'pronunciation') {
    return <PronunciationSection onBack={handleBackToHome} />;
  }

  if (currentMode === 'freePronunciation') {
    return <FreePronunciationCheck onBack={handleBackToHome} />;
  }

  if (currentMode === 'tradutor') {
    return <TranslatorPage onBack={handleBackToHome} />;
  }

  if (currentMode === "conversation" && chatHistory.length === 0 && !rolePlaySettings) {
    return (
      <ConversationSetup
        level={level}
        setLevel={setLevel}
        corrections={corrections}
        setCorrections={setCorrections}
        handleStartConversation={handleStartConversation}
        handleBackToHome={handleBackToHome}
      />
    );
  }

  if (currentMode === "interview" && chatHistory.length === 0) {
    return (
      <InterviewSetup
        handleStartInterview={handleStartInterview}
        handleBackToHome={handleBackToHome}
      />
    );
  }

  if (currentMode === "quiz" && chatHistory.length === 0) {
    return (
      <QuizSetup
        quizDifficulty={quizDifficulty}
        setQuizDifficulty={setQuizDifficulty}
        quizTheme={quizTheme}
        setQuizTheme={setQuizTheme}
        customThemeInfo={customThemeInfo}
        setCustomThemeInfo={setCustomThemeInfo}
        handleStartQuiz={handleStartQuiz}
        handleBackToHome={handleBackToHome}
      />
    );
  }


  if (currentMode === "listening" && pendingListeningDifficulty === null) {
    return (
      <ListeningSetup
        handleStartListening={handleStartListening}
        handleBackToHome={handleBackToHome}
      />
    );
  }

  if (currentMode === "role-play") {
    const imageMap: Record<string, string> = {
      "Pedindo comida em um restaurante": "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/compressed-images/from-url/2b5772f3-7d9c-4c3c-aea5-5f3b531e9fe3.webp",
      "Fazendo check-in em um hotel": "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/compressed-images/from-url/eb2906d2-e6a7-4646-9765-6067471960c5.webp",
      "Conhecendo alguém novo": "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/compressed-images/from-url/1eca391b-cdfe-4a52-a32d-651ac7d516be.webp",
      "Comprando roupas em uma loja": "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/compressed-images/from-url/dd2a1ce0-a75a-4e46-a06b-af9d28a8c4a3.webp",
      "Resolvendo um problema no aeroporto": "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/compressed-images/from-url/538d9833-fbf6-40fe-b080-7f65cdae769c.webp",
      "Pedindo informação na rua": "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/compressed-images/from-url/8625ae3b-d6ff-416b-bf59-47b38107b624.webp",
      "Conversando com um estrangeiro sobre cultura brasileira": "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/compressed-images/from-url/2a4eb413-4677-4b13-b87b-270e90984986.webp",
      "Participando de uma reunião de trabalho em inglês": "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/compressed-images/from-url/27c4dd10-ae1d-4e46-9806-d20949395f96.webp",
      "Fazendo um passeio com alguém que você acabou de conhecer": "https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/compressed-images/from-url/de677a3e-71c1-4e99-b3d7-4b3d05b08f73.webp",
    };

    // Show intro screen if rolePlayIntroData is set
    if (rolePlayIntroData) {
      return (
        <RolePlayIntroScreen
          situation={rolePlayIntroData.situation}
          difficulty={rolePlayIntroData.difficulty}
          imageUrl={rolePlayIntroData.imageUrl}
          onStart={() => {
            const { difficulty, situation } = rolePlayIntroData;
            clearChat();

            const firstMessage = {
              role: "assistant" as const,
              content: getRoleplayIntroMessage(situation, learningLanguage),
            };

            setChatHistory([firstMessage]);
            setRolePlaySettings({ difficulty, situation });
            setRolePlayIntroData(null);
            setCurrentMode("conversation");
          }}
          onBack={() => {
            setRolePlayIntroData(null);
          }}
        />
      );
    }

    return (
      <RolePlaySetupScreen
        onStart={({ difficulty, situation }) => {
          setRolePlayIntroData({
            difficulty,
            situation,
            imageUrl: imageMap[situation],
          });
        }}
        onBack={handleBackToHome}
      />
    );
  }

  if (
    currentMode === "perguntas" &&
    !showQuestionsSetup &&
    questionsDifficulty &&
    questionsTheme
  ) {
    return (
      <div className="flex flex-col bg-white w-full">
        {/* Header - match CompleteLessonsScreen */}
        <div className="bg-white border-b px-4 py-3 perguntas-header">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                setShowQuestionsSetup(true);
                setStepDifficulty(null);
                setQuestionsDifficulty("");
                setQuestionsTheme("");
                setPerguntasQuestions([]);
                setPerguntasQuestionIndex(0);
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('voltar')}
            </Button>
            <div className="flex-1 text-center max-w-md mx-4">
              <h1 className="text-xl font-semibold truncate">
                {questionsTheme}
              </h1>
            </div>
            <div className="w-20 flex justify-end items-center">
            </div>
          </div>
        </div>
        {/* Main Content: card immediately below header, fully flush to top */}
        <div
          className="
            w-full
            flex flex-col items-center
            px-0 pt-0 pb-0
            md:px-0 md:pt-0 md:pb-0 md:items-center md:justify-start
          "
          style={{ marginTop: 0 }}
        >
          <div className="w-full max-w-4xl mx-auto flex flex-col justify-start">
            <Card className="w-full rounded-lg shadow-md overflow-hidden border-0 mt-0 p-0">
              {questionsLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[220px] py-16">
                  <span className="text-gray-500 text-lg">Carregando perguntas...</span>
                </div>
              ) : questionsError ? (
                <div className="flex flex-col items-center justify-center min-h-[220px] py-16">
                  <span className="text-red-500 text-lg">{questionsError}</span>
                  <Button
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded"
                    onClick={() => {
                      setShowQuestionsSetup(true);
                      setStepDifficulty(null);
                    }}
                  >
                    {t('voltar')}
                  </Button>
                </div>
              ) : (
                <AIFeedbackPage
                  questions={perguntasQuestions}
                  topic={questionsTheme}
                  onBack={() => {
                    setShowQuestionsSetup(true);
                    setStepDifficulty(null);
                    setQuestionsDifficulty("");
                    setQuestionsTheme("");
                    setPerguntasQuestions([]);
                    setPerguntasQuestionIndex(0);
                  }}
                  questionIndex={perguntasQuestionIndex}
                  setQuestionIndex={setPerguntasQuestionIndex}
                  handleAskSpecialist={handleAskSpecialist}
                  onHomeClick={() => {
                    setShowQuestionsSetup(true);
                    setStepDifficulty(null);
                    setQuestionsDifficulty("");
                    setQuestionsTheme("");
                    setPerguntasQuestions([]);
                    setPerguntasQuestionIndex(0);
                  }}
                />
              )}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default IndexModeRenders;
