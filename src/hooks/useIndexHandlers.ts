
import { toast } from "@/hooks/use-toast";
import { useCallback } from "react";
import { getRoleplayIntroMessage } from "@/utils/roleplay-intro-messages";
import { AppMode } from "@/types/AppMode";
import { useAccent } from "@/contexts/AccentContext";
import { usePDFZoom } from "@/contexts/PDFZoomContext";

// Types for handler dependencies to remain generic/flexible but exact
export function useIndexHandlers(deps: {
  clearChat: () => void;
  setInputMessage: (msg: string) => void;
  setCurrentMode: (mode: AppMode) => void;
  setCurrentGame: (str: string) => void;
  setLevel: (s: string) => void;
  setCorrections: (b: boolean) => void;
  setQuizDifficulty: (s: string) => void;
  setQuizTheme: (s: string) => void;
  setCustomThemeInfo: (s: string) => void;
  setRolePlaySettings: (s: any) => void;
  setListeningDifficulty: (s: string) => void;
  setPendingListeningDifficulty: (s: string | null) => void;
}) {
  const { resetToDefault } = useAccent();
  const { resetZoom } = usePDFZoom();

  const handleNewChat = useCallback(() => {
    deps.clearChat();
    deps.setInputMessage("");
    toast({
      title: "Nova conversa iniciada",
      description: "A conversa foi reiniciada.",
    });
  }, [deps]);

  const handleBackToHome = useCallback(() => {
    deps.setCurrentMode("home");
    deps.setCurrentGame("");
    deps.clearChat();
    deps.setInputMessage("");
    deps.setLevel("");
    deps.setCorrections(false);
    deps.setQuizDifficulty("");
    deps.setQuizTheme("");
    deps.setCustomThemeInfo("");
    deps.setRolePlaySettings(null);
    deps.setListeningDifficulty("");
    deps.setPendingListeningDifficulty(null);
    resetToDefault(); // Reset accent to default when going back to home
    resetZoom(); // Reset zoom settings when going back to home
  }, [deps, resetToDefault, resetZoom]);

  return {
    handleNewChat,
    handleBackToHome,
  };
}
