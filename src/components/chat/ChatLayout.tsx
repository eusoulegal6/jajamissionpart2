
import React, { useState } from "react";
import ChatInterface from "@/components/chat/ChatInterface";
import QuizInterface from "@/components/chat/QuizInterface";
import WordDefinitionModal from "@/components/WordDefinitionModal";
import { AppMode } from "@/types/AppMode";
import { GameType } from "@/hooks/useIndexState";

type ChatLayoutProps = {
  chatProps: {
    currentMode: AppMode;
    chatHistory: any[];
    rolePlaySettings?: {
      difficulty: string;
      situation: string;
    } | null;
    inputMessage: string;
    setInputMessage: (msg: string) => void;
    isLoading: boolean;
    isPlaying: Record<number, boolean>;
    isPlayingSlow?: Record<number, boolean>;
    isLoadingAudio: Record<number, boolean>;
    handleSubmit: (e: React.FormEvent) => void;
    handleBackToHome: () => void;
    handleNewChat: () => void;
    handleSpeakMessage: (index: number, text: string) => void;
    handleSpeakMessageSlow?: (index: number, text: string) => void;
    handleSendMessage: (msg: string) => void;
    handleRestartConversation: () => void;
    handleRestartQuiz: () => void;
    currentGame: GameType;
    handleStartGame: (gameType: string) => void;
    handleImageUpload: (file: File) => void;
    handleAskSpecialist: () => void;
    isFullScreen: boolean;
    corrections: boolean;
    quizTheme?: string;
  };
};

const ChatLayout: React.FC<ChatLayoutProps> = ({ chatProps }) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);

  // Quiz mode: render dedicated quiz interface
  if (chatProps.currentMode === "quiz") {
    return (
      <QuizInterface
        chatHistory={chatProps.chatHistory}
        isLoading={chatProps.isLoading}
        onGoHome={chatProps.handleBackToHome}
        onRestart={chatProps.handleRestartQuiz}
        quizTheme={chatProps.quizTheme}
      />
    );
  }

  return (
    <>
      <div className="flex-1 min-h-0 w-full">
        <ChatInterface {...chatProps} />
      </div>
      
      <WordDefinitionModal
        word={selectedWord}
        isOpen={isWordModalOpen}
        onClose={() => {
          setIsWordModalOpen(false);
          setSelectedWord(null);
        }}
      />
    </>
  );
};

export default ChatLayout;
