
import { useEffect, useCallback, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { AppMode } from "@/types/AppMode";
import { getRoleplayIntroMessage } from "@/utils/roleplay-intro-messages";
import { useChatApi, ChatMessage } from "@/hooks/use-chat-api";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useChatRestartHandlers } from "@/hooks/useChatRestartHandlers";
import { GameType } from "@/hooks/useIndexState";
import { useLanguage, LearningLanguage } from "@/contexts/LanguageContext";
import { useAccent } from "@/contexts/AccentContext";

export function useIndexChatHandlers({
  state,
  systemPrompt,
  initialChatHistory,
}: {
  state: ReturnType<typeof import("./useIndexState").useIndexState>,
  systemPrompt: string,
  initialChatHistory?: ChatMessage[],
}) {
  const {
    chatHistory,
    setChatHistory,
    isLoading,
    sendMessage,
    sendImage,
    startConversation,
    clearChat,
  } = useChatApi(initialChatHistory);

  const { getVoiceId } = useAccent();
  const { isPlaying, isPlayingSlow, isLoadingAudio, handleSpeakMessage, handleSpeakMessageSlow } = useTextToSpeech(getVoiceId());
  
  // Use a try-catch to safely access the language context
  let learningLanguage: LearningLanguage = 'en'; // Default fallback
  try {
    const languageContext = useLanguage();
    learningLanguage = languageContext.learningLanguage;
  } catch (error) {
    console.warn('Language context not available, using default:', error);
  }

  // Handlers -- before activating any chat interface, clear chat
  // We'll ensure home-to-mode always starts fresh (called by new handler)
  const handleHomeToModeReset = useCallback(() => {
    setChatHistory([]);
    clearChat();
    state.setRolePlaySettings(null);
    state.setInputMessage("");
    state.setQuestionsDifficulty("");
    state.setQuestionsTheme("");
    state.setShowQuestionsSetup(false);
    state.setPerguntasQuestions([]);
    state.setQuestionsLoading(false);
    state.setQuestionsError(null);
    state.setQuizDifficulty("");
    state.setQuizTheme("");
    state.setCustomThemeInfo("");
    state.setLevel("");
    state.setCorrections(false);
  }, [
    setChatHistory, clearChat, state
  ]);

  // Handlers
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const needsAdvancedModel = state.currentMode === "games" && state.currentGame === "realWorldHunt";
    const needsDreamPainterModel = state.currentMode === "games" && state.currentGame === "dreamPainter";
    let model;
    if (needsDreamPainterModel) model = "gpt-5.2";
    else if (needsAdvancedModel) model = "gpt-5.2";
    await sendMessage(state.inputMessage, systemPrompt, undefined, model);
    state.setInputMessage("");
  }, [sendMessage, systemPrompt, state]);

  const handleSendMessage = useCallback(async (message: string) => {
    const needsAdvancedModel = state.currentMode === "games" && state.currentGame === "realWorldHunt";
    const needsDreamPainterModel = state.currentMode === "games" && state.currentGame === "dreamPainter";
    let model;
    if (needsDreamPainterModel) model = "gpt-5.2";
    else if (needsAdvancedModel) model = "gpt-5.2";
    await sendMessage(message, systemPrompt, undefined, model);
  }, [sendMessage, systemPrompt, state]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (state.currentMode === "games" && state.currentGame === "realWorldHunt") {
      await sendImage(file, "", systemPrompt);
    }
  }, [sendImage, systemPrompt, state]);

  const handleStartConversation = useCallback(() => {
    if (!state.level) {
      const languageName = learningLanguage === 'en' ? 'inglês' : 'espanhol';
      toast({
        title: "Selecione um nível",
        description: `Por favor, escolha seu nível de ${languageName} para continuar.`,
        variant: "destructive",
      });
      return;
    }
    state.setRolePlaySettings(null);
    const languageName = learningLanguage === 'en' ? 'inglês' : 'espanhol';
    const initialMessage = state.corrections
      ? `Olá Professor, vamos conversar em ${languageName}. Meu nível é ${state.level} e eu gostaria que você corrigisse meus erros.`
      : `Olá Professor, vamos conversar em ${languageName}. Meu nível é ${state.level} e prefiro praticar sem correções.`;
    startConversation(initialMessage, systemPrompt);
  }, [state, startConversation, systemPrompt, learningLanguage]);

  const handleStartInterview = useCallback(() => {
    const languageName = learningLanguage === 'en' ? 'inglês' : 'espanhol';
    const initialMessage = `Olá Professor, gostaria de simular uma entrevista de emprego em ${languageName}.`;
    startConversation(initialMessage, systemPrompt);
  }, [startConversation, systemPrompt, learningLanguage]);

  const handleStartQuiz = useCallback(() => {
    if (!state.quizDifficulty) {
      toast({
        title: "Selecione uma dificuldade",
        description: "Por favor, escolha a dificuldade do quiz para continuar.",
        variant: "destructive",
      });
      return;
    }
    if (!state.quizTheme) {
      toast({
        title: "Selecione um tema",
        description: "Por favor, escolha um tema para o quiz.",
        variant: "destructive",
      });
      return;
    }
    if ((state.quizTheme === "Your city" || state.quizTheme === "Your favorite artist") && !state.customThemeInfo) {
      toast({
        title: "Informação necessária",
        description: state.quizTheme === "Your city"
          ? "Por favor, digite o nome da sua cidade."
          : "Por favor, digite o nome do seu artista favorito.",
        variant: "destructive",
      });
      return;
    }
    const languageName = learningLanguage === 'en' ? 'inglês' : 'espanhol';
    let initialMessage = `Olá Professor, gostaria de fazer um quiz em ${languageName} com dificuldade ${state.quizDifficulty} sobre o tema "${state.quizTheme}"`;
    if (state.customThemeInfo) initialMessage += `: ${state.customThemeInfo}`;
    startConversation(initialMessage, systemPrompt);
  }, [state, startConversation, systemPrompt, learningLanguage]);

  const handleStartListening = useCallback((difficulty?: string) => {
    clearChat();
    if (difficulty) {
      state.setPendingListeningDifficulty(difficulty);
      state.setListeningDifficulty(difficulty);
    }
    state.setCurrentMode("listening");
  }, [clearChat, state]);

  useEffect(() => {
    if (state.currentMode === "listening" && state.pendingListeningDifficulty !== null) {
      const initialMessage = learningLanguage === 'es'
        ? "Empezar práctica de escucha"
        : "Start listening practice";
      startConversation(initialMessage, systemPrompt);
      state.setPendingListeningDifficulty(null);
    }
    // Only run when mode, listeningDifficulty or language change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentMode, state.listeningDifficulty, learningLanguage]);

  const handleStartGame = useCallback((gameType: string) => {
    state.setCurrentGame(gameType as GameType);
    let initialMessage = "";
    let model: string | undefined;
    switch (gameType) {
      case "guessWhoWhere":
        initialMessage = learningLanguage === 'es'
          ? "Hola Profesor, me gustaría jugar al juego 'Adivina Quién o Dónde'. Por favor, pregúntame si quiero adivinar un país o una persona."
          : "Hello Professor, I would like to play the game 'Guess Who or Where'. Please ask me if I want to guess a country or a person.";
        break;
      case "dreamPainter":
        clearChat();
        state.setCurrentGame(gameType as GameType);
        const dreamPainterIntro = learningLanguage === 'es'
          ? "¡Hola! Soy DreamPainter, y juntos crearemos una pintura única basada en tu imaginación. ¿Estás listo para comenzar?"
          : "Hi! I'm DreamPainter, and together we'll create a unique painting based on your imagination. Are you ready to begin?";
        setChatHistory([{
          role: "assistant",
          content: dreamPainterIntro
        }]);
        return;
      case "realWorldHunt":
        initialMessage = learningLanguage === 'es'
          ? "Hola profesor, me gustaría jugar al juego 'Caza del Mundo Real'. Por favor, explícame cómo funciona el juego y pídeme que encuentre un objeto que fotografiaré con mi cámara."
          : "Hello teacher, I would like to play the 'Real-World Hunt' game. Please explain how the game works and ask me to find an object that I'll photograph with my camera.";
        model = "gpt-5.2";
        break;
      default:
        const languageName = learningLanguage === 'en' ? 'inglês' : 'espanhol';
        initialMessage = `Olá Professor, gostaria de jogar um jogo em ${languageName}.`;
    }
    startConversation(initialMessage, systemPrompt, model);
  }, [state, clearChat, setChatHistory, startConversation, systemPrompt, learningLanguage]);

  const { handleRestartConversation, handleRestartQuiz } = useChatRestartHandlers({
    corrections: state.corrections,
    level: state.level,
    quizDifficulty: state.quizDifficulty,
    quizTheme: state.quizTheme,
    customThemeInfo: state.customThemeInfo,
    systemPrompt,
    setInputMessage: state.setInputMessage,
    clearChat,
    startConversation,
    learningLanguage,
  });

  const handlePerguntasSelect = useCallback(() => {
    state.setQuestionsDifficulty("");
    state.setQuestionsTheme("");
    state.setShowQuestionsSetup(true);
    state.setCurrentMode("perguntas");
  }, [state]);

  // Derived flag for chat interface
  const isChatInterfaceActive = (
    [
      "conversation",
      "specialist",
      "interview",
      "quiz",
      "games",
      "listening",
      "role-play",
      // "perguntas" mode is handled by IndexModeRenders, not the main chat layout.
    ].includes(state.currentMode)
    && (
      state.currentMode === "specialist"
      || chatHistory?.length > 0
      || (state.currentMode === "listening" && state.pendingListeningDifficulty !== null)
    )
  );

  return {
    chatHistory,
    setChatHistory,
    isLoading,
    isPlaying,
    isPlayingSlow,
    isLoadingAudio,
    handleSpeakMessage,
    handleSpeakMessageSlow,
    handleSubmit,
    handleSendMessage,
    handleImageUpload,
    handleStartConversation,
    handleStartGame,
    handleStartInterview,
    handleStartQuiz,
    handleStartListening,
    handleRestartConversation,
    handleRestartQuiz,
    handlePerguntasSelect,
    isChatInterfaceActive,
    handleHomeToModeReset, // <- Expose just in case needed
  };
}

// NOTE: This file is 258 lines long. You should consider refactoring it soon.
