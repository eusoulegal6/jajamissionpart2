
import { useEffect, useState, useRef } from "react";
import { useSystemPrompt } from "@/hooks/use-system-prompt";
import { AppMode } from "@/types/AppMode";
import { useIndexState } from "@/hooks/useIndexState";
import { useIndexHandlers } from "@/hooks/useIndexHandlers";
import { useIndexChatHandlers } from "@/hooks/useIndexChatHandlers";
import IndexModeRenders from "@/components/chat/IndexModeRenders";
import ChatLayout from "@/components/chat/ChatLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation, useNavigate } from "react-router-dom";
import { usePrevious } from "@/hooks/usePrevious";
import { toast } from "@/hooks/use-toast";




const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [restoredState] = useState(() => {
    // Read (do not remove yet) so StrictMode double-mount still sees it
    const savedStateJSON = sessionStorage.getItem('appReturnState');
    if (savedStateJSON) {
      try {
        const parsed = JSON.parse(savedStateJSON);
        console.log('✅ Index - Restored state from sessionStorage:', parsed);
        console.log('✅ Index - Restored chatHistory length:', parsed.chatHistory?.length || 0);
        return parsed;
      } catch (e) {
        console.error("❌ Index - Failed to parse saved state:", e);
        return null;
      }
    }
    console.log('ℹ️ Index - No saved state found in sessionStorage');
    return null;
  });

  const hasAppliedRestore = useRef(false);

  // All state management
  const state = useIndexState(restoredState);
  const { learningLanguage } = useLanguage();
  const [animationSelector, setAnimationSelector] = useState<string | null>(null);

  // Check for return to content mode or curso completo
  useEffect(() => {
    if (hasAppliedRestore.current) return;

    if (location.state?.returnToContentMode) {
      state.setCurrentMode('content');
      navigate(location.pathname, { replace: true });
      return;
    }
    if (location.state?.currentMode === 'curso-completo' || location.state?.showCursoCompleto) {
      state.setCurrentMode('curso-completo');
      const cursoCompletoCategory = location.state?.cursoCompletoCategory;
      navigate(location.pathname, { 
        replace: true,
        state: cursoCompletoCategory ? { cursoCompletoCategory } : null,
      });
      return;
    }

    if (location.state?.restoreConversation) {
      // Try restoredState first, fall back to reading sessionStorage directly (StrictMode double-mount safe)
      let saved: any = restoredState;
      if (!saved) {
        try { saved = JSON.parse(sessionStorage.getItem('appReturnState') || 'null'); } catch { saved = null; }
      }

      if (saved?.currentMode) {
        state.setCurrentMode(saved.currentMode as AppMode);
      }

      if (saved?.autoSendMessage) {
        console.log('Index - Auto-sending message from restored state:', saved.autoSendMessage);
        chatHandlers.handleSendMessage(saved.autoSendMessage);
      } else {
        console.log('Index - Restoring conversation from sessionStorage');
      }

      // Prevent future restores and clear history state
      sessionStorage.removeItem('appReturnState');
      hasAppliedRestore.current = true;
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate, state.setCurrentMode, restoredState]);


  // System prompt as before
  const systemPrompt = useSystemPrompt({
    currentMode: state.currentMode,
    level: state.level,
    corrections: state.corrections,
    quizDifficulty: state.quizDifficulty,
    quizTheme: state.quizTheme,
    customThemeInfo: state.customThemeInfo,
    currentGame: state.currentGame,
    listeningDifficulty: state.listeningDifficulty,
    rolePlaySettings: state.rolePlaySettings,
    learningLanguage: learningLanguage,
  });

  // Multi-purpose handlers (for home navigation etc)
  const { handleNewChat: baseHandleNewChat, handleBackToHome } = useIndexHandlers({
    clearChat: state.clearChat,
    setInputMessage: state.setInputMessage,
    setCurrentMode: state.setCurrentMode,
    setCurrentGame: state.setCurrentGame as (str: string) => void,
    setLevel: state.setLevel,
    setCorrections: state.setCorrections,
    setQuizDifficulty: state.setQuizDifficulty,
    setQuizTheme: state.setQuizTheme,
    setCustomThemeInfo: state.setCustomThemeInfo,
    setRolePlaySettings: state.setRolePlaySettings,
    setListeningDifficulty: state.setListeningDifficulty,
    setPendingListeningDifficulty: state.setPendingListeningDifficulty,
  });

  // Main chat and game handlers
  const chatHandlers = useIndexChatHandlers({ 
    state, 
    systemPrompt,
    initialChatHistory: restoredState?.chatHistory,
  });

  // Wrapper that properly clears chat history
  const handleNewChat = () => {
    chatHandlers.setChatHistory([]);
    state.setInputMessage("");
    toast({
      title: "Nova conversa iniciada",
      description: "A conversa foi reiniciada.",
    });
  };

  // Wrapper that also clears real chat history when going back to home
  const wrappedHandleBackToHome = () => {
    handleBackToHome();
    chatHandlers.setChatHistory([]);
    chatHandlers.handleHomeToModeReset();
  };

  const prevIsChatInterfaceActive = usePrevious(chatHandlers.isChatInterfaceActive);
  const prevShowQuestionsSetup = usePrevious(state.showQuestionsSetup);

  const handleAskSpecialist = () => {
    const stateToSave = {
      // from state (useIndexState)
      currentMode: state.currentMode,
      currentGame: state.currentGame,
      rolePlaySettings: state.rolePlaySettings,
      level: state.level,
      corrections: state.corrections,
      quizDifficulty: state.quizDifficulty,
      quizTheme: state.quizTheme,
      customThemeInfo: state.customThemeInfo,
      listeningDifficulty: state.listeningDifficulty,
      pendingListeningDifficulty: state.pendingListeningDifficulty,
      questionsDifficulty: state.questionsDifficulty,
      questionsTheme: state.questionsTheme,
      showQuestionsSetup: state.showQuestionsSetup,
      perguntasQuestions: state.perguntasQuestions,
      perguntasQuestionIndex: state.perguntasQuestionIndex,
      // from chatHandlers (useIndexChatHandlers)
      chatHistory: chatHandlers.chatHistory,
    };
    console.log('💾 Index - Saving state to sessionStorage:', stateToSave);
    console.log('💾 Index - ChatHistory being saved:', chatHandlers.chatHistory);
    sessionStorage.setItem('appReturnState', JSON.stringify(stateToSave));

    // Build lessonContext for perguntas mode
    let lessonContext = undefined;
    if (state.currentMode === 'perguntas' && state.perguntasQuestions.length > 0) {
      const currentQuestion = state.perguntasQuestions[state.perguntasQuestionIndex];
      lessonContext = {
        lessonId: 'perguntas',
        lessonTitle: state.questionsTheme,
        pageId: `perguntas_${state.perguntasQuestionIndex}`,
        pageIndex: state.perguntasQuestionIndex,
        pageType: 'perguntas',
        pageTitle: state.questionsTheme,
        pageText: '',
        questions: [{
          id: 'q0',
          label: `${state.perguntasQuestionIndex + 1}.`,
          text: currentQuestion
        }],
        focusedQuestionId: 'q0',
        imageUrl: null
      };
    }

    navigate('/specialist-help', {
      state: {
        returnPath: '/',
        returnState: { restoreConversation: true },
        lessonContext
      }
    });
  };

  // Animate specialist help icon on mode entry
  useEffect(() => {
    // Trigger for general chat modes when transitioning from setup to chat
    if (chatHandlers.isChatInterfaceActive && !prevIsChatInterfaceActive) {
      setAnimationSelector('.chat-header button[title="Ask a specialist"]');
      return;
    }

    // Trigger for 'perguntas' mode after finishing its setup
    if (
      state.currentMode === "perguntas" &&
      !state.showQuestionsSetup &&
      prevShowQuestionsSetup
    ) {
      setAnimationSelector('.perguntas-header button[title="Ask a specialist"]');
    }
  }, [
    chatHandlers.isChatInterfaceActive,
    prevIsChatInterfaceActive,
    state.currentMode,
    state.showQuestionsSetup,
    prevShowQuestionsSetup,
  ]);

  // Effect to run the animation polling when a selector is set
  useEffect(() => {
    if (!animationSelector) return;

    console.log(`[Animation] Starting search for selector: ${animationSelector}`);

    let animationFrameId: number;
    let stopTryingTimeout: ReturnType<typeof setTimeout>;
    let removeAnimationTimeout: ReturnType<typeof setTimeout>;
    let attempts = 0;

    const findButtonAndAnimate = () => {
      attempts++;
      const specialistButton = document.querySelector(animationSelector);

      if (specialistButton) {
        console.log(`[Animation] Found button after ${attempts} attempts.`);
        specialistButton.classList.add("animate-shine", "bg-blue-100");
        removeAnimationTimeout = setTimeout(() => {
          specialistButton.classList.remove("animate-shine", "bg-blue-100");
          setAnimationSelector(null); // Reset for next time
        }, 2500); // Animation duration increased to 2.5s
      } else {
        // If not found, try again on the next frame
        animationFrameId = requestAnimationFrame(findButtonAndAnimate);
      }
    };

    // Start the search
    animationFrameId = requestAnimationFrame(findButtonAndAnimate);

    // Stop searching after 2 seconds to avoid infinite loops
    stopTryingTimeout = setTimeout(() => {
      cancelAnimationFrame(animationFrameId);
      if (!document.querySelector(animationSelector)) {
        console.log(`[Animation] Stopped searching after 2 seconds. Button not found for selector: ${animationSelector}`);
      }
      setAnimationSelector(null); // Reset if not found
    }, 2000);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(stopTryingTimeout);
      if (removeAnimationTimeout) {
        clearTimeout(removeAnimationTimeout);
      }
      // Ensure classes are removed on cleanup
      const button = document.querySelector(`${animationSelector}.animate-shine`);
      if (button) {
        button.classList.remove("animate-shine", "bg-blue-100");
      }
    };
  }, [animationSelector]);

  // Always scroll to bottom on chat
  useEffect(() => {
    if (state.scrollAreaRef.current) {
      state.scrollAreaRef.current.scrollTop = state.scrollAreaRef.current.scrollHeight;
    }
  }, [chatHandlers.chatHistory]);

  // Pick which main layout to render
  return (
    <div className={chatHandlers.isChatInterfaceActive ? "h-screen w-full overflow-hidden bg-gray-50 flex flex-col" : "min-h-screen bg-white relative"}>
      
      {chatHandlers.isChatInterfaceActive ? (
        <ChatLayout
          chatProps={{
            currentMode: state.currentMode,
            chatHistory: chatHandlers.chatHistory,
            rolePlaySettings: state.rolePlaySettings,
            inputMessage: state.inputMessage,
            setInputMessage: state.setInputMessage,
            isLoading: chatHandlers.isLoading,
            isPlaying: chatHandlers.isPlaying,
            isPlayingSlow: chatHandlers.isPlayingSlow,
            isLoadingAudio: chatHandlers.isLoadingAudio,
            handleSubmit: chatHandlers.handleSubmit,
            handleBackToHome: wrappedHandleBackToHome,
            handleNewChat,
            handleSpeakMessage: chatHandlers.handleSpeakMessage,
            handleSpeakMessageSlow: chatHandlers.handleSpeakMessageSlow,
            handleSendMessage: chatHandlers.handleSendMessage,
            handleRestartConversation: chatHandlers.handleRestartConversation,
            handleRestartQuiz: chatHandlers.handleRestartQuiz,
            currentGame: state.currentGame,
            handleStartGame: chatHandlers.handleStartGame,
            handleImageUpload: chatHandlers.handleImageUpload,
            handleAskSpecialist,
            isFullScreen: true,
            corrections: state.corrections,
            quizTheme: state.quizTheme,
          }}
        />
      ) : (
        <div className={state.currentMode === 'toefl' ? "w-full" : "w-full flex flex-col items-center"}>
          <IndexModeRenders
            {...state}
            chatHistory={chatHandlers.chatHistory}
            clearChat={state.clearChat}
            setChatHistory={chatHandlers.setChatHistory}
            handleStartConversation={chatHandlers.handleStartConversation}
            handleStartGame={chatHandlers.handleStartGame}
            handleStartInterview={chatHandlers.handleStartInterview}
            handleStartQuiz={chatHandlers.handleStartQuiz}
            handleStartListening={chatHandlers.handleStartListening}
            handleBackToHome={wrappedHandleBackToHome}
            setCurrentMode={state.setCurrentMode}
            setCustomState={() => {}}
            handlePerguntasSelect={chatHandlers.handlePerguntasSelect}
            setInputMessage={state.setInputMessage}
            setQuestionsLoading={state.setQuestionsLoading}
            setQuestionsError={state.setQuestionsError}
            setPerguntasQuestions={state.setPerguntasQuestions}
            setPerguntasQuestionIndex={state.setPerguntasQuestionIndex}
            handleAskSpecialist={handleAskSpecialist}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
