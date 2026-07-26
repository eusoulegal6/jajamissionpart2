
import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { LearningLanguage } from "@/contexts/LanguageContext";

// Props required from parent for the handlers.
interface UseChatRestartHandlersProps {
  corrections: boolean;
  level: string;
  quizDifficulty: string;
  quizTheme: string;
  customThemeInfo: string;
  systemPrompt: string;
  setInputMessage: (msg: string) => void;
  clearChat: () => void;
  startConversation: (msg: string, prompt: string) => void;
  learningLanguage: LearningLanguage;
}

export function useChatRestartHandlers({
  corrections,
  level,
  quizDifficulty,
  quizTheme,
  customThemeInfo,
  systemPrompt,
  setInputMessage,
  clearChat,
  startConversation,
  learningLanguage,
}: UseChatRestartHandlersProps) {
  const handleRestartConversation = useCallback(() => {
    clearChat();
    setInputMessage("");
    const languageName = learningLanguage === 'en' ? 'inglês' : 'espanhol';
    const initialMessage = corrections
      ? `Olá Professor, vamos conversar em ${languageName}. Meu nível é ${level} e eu gostaria que você corrigisse meus erros.`
      : `Olá Professor, vamos conversar em ${languageName}. Meu nível é ${level} e prefiro praticar sem correções.`;

    startConversation(initialMessage, systemPrompt);
    toast({
      title: "Nova conversa iniciada",
      description: "Uma nova conversa foi iniciada com os mesmos ajustes.",
    });
  }, [corrections, level, startConversation, setInputMessage, clearChat, systemPrompt, learningLanguage]);

  const handleRestartQuiz = useCallback(() => {
    clearChat();
    setInputMessage("");
    const languageName = learningLanguage === 'en' ? 'inglês' : 'espanhol';
    let initialMessage = `Olá Professor, gostaria de fazer um quiz em ${languageName} com dificuldade ${quizDifficulty} sobre o tema "${quizTheme}"`;
    if (customThemeInfo) {
      initialMessage += `: ${customThemeInfo}`;
    }
    startConversation(initialMessage, systemPrompt);
    toast({
      title: "Novo quiz iniciado",
      description: "Um novo quiz foi iniciado com as mesmas configurações.",
    });
  }, [quizDifficulty, quizTheme, customThemeInfo, systemPrompt, setInputMessage, clearChat, startConversation, learningLanguage]);

  return { handleRestartConversation, handleRestartQuiz };
}
