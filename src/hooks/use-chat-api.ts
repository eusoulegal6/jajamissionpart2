
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { generateImage } from "@/services/imageGenerationService";
import { callAI } from "@/lib/aiBridge";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | any[];
  image?: string;
}

export const getCorrectedSentence = async (
  text: string,
  learningLanguage: string,
  chatContext: ChatMessage[] = []
): Promise<string | null> => {
    const languageName = learningLanguage === 'en' ? 'inglês' : 'espanhol';
    const systemPrompt = `Você é um especialista em ${languageName}. Sua tarefa é corrigir a frase do usuário, que é a MAIS RECENTE em uma conversa. A frase pode conter erros de transcrição de áudio. Analise o CONTEXTO da conversa para entender a intenção do usuário. Corrija erros gramaticais, de digitação, ou palavras que soam parecidas mas estão erradas no contexto (ex: "write" em vez de "right"). NÃO corrija sinais de pontuação (vírgulas, pontos, pontos de interrogação, etc.) nem erros de maiúsculas/minúsculas. Foque apenas em gramática, vocabulário e estrutura da frase. Retorne APENAS a frase corrigida. Se a frase estiver correta, retorne a frase original sem nenhuma alteração ou comentário. Não adicione nenhuma explicação, apenas a frase.`;
    
    try {
        const contextString = chatContext
            .map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`)
            .join('\n');
        
        const userMessageContent = `
## CONTEXTO DA CONVERSA ANTERIOR:
${contextString || "Nenhum contexto."}

## FRASE ATUAL DO USUÁRIO PARA CORRIGIR:
${text}
`;
        
        console.log("Sending for correction with context and model gpt-4o:", userMessageContent);

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessageContent }
        ];
        const data = await callAI({ messages, model: "gpt-5.2" });
        const correctedText = data || text; // Fallback to original text
        console.log("Grammar correction success. Original:", text, "Corrected:", correctedText, "With context:", chatContext.length > 0);
        return correctedText;
    } catch (error) {
        console.error("Failed to get corrected sentence:", error);
        return null;
    }
};

export const useChatApi = (initialHistory?: ChatMessage[]) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(initialHistory || []);
  const [isLoading, setIsLoading] = useState(false);

  const extractExplicitPrompt = (messages: ChatMessage[]): string | null => {
    const triggerMessage = messages.find(
      (msg) => {
        // Handle both string and object content
        const content = typeof msg.content === 'string' 
          ? msg.content 
          : Array.isArray(msg.content) 
            ? msg.content.map(part => typeof part === 'object' && 'text' in part ? part.text : String(part)).join(' ')
            : String(msg.content);
        
        return msg.role === "assistant" && content.includes("Here is your final painting description:");
      }
    );
    if (!triggerMessage) return null;

    const content = typeof triggerMessage.content === 'string' 
      ? triggerMessage.content 
      : Array.isArray(triggerMessage.content) 
        ? triggerMessage.content.map(part => typeof part === 'object' && 'text' in part ? part.text : String(part)).join(' ')
        : String(triggerMessage.content);

    const parts = content.split("Here is your final painting description:");
    return parts.length > 1 ? parts[1].trim() : null;
  };

  const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = maxWidth / img.width;
          const canvas = document.createElement("canvas");
          canvas.width = maxWidth;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas not supported");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
    });
  };

  const sendImage = async (
    file: File,
    message: string,
    systemPrompt: string
  ) => {
    try {
      setIsLoading(true);
      const imageBase64 = await compressImage(file);
      const isRealWorldHunt = systemPrompt.includes("Real-World Hunt");
      const defaultMessage = isRealWorldHunt 
        ? "Here's the object you asked for" 
        : "Is this right?";
      const userMessage: ChatMessage = { 
        role: "user", 
        content: message || defaultMessage,
        image: imageBase64
      };
      const updatedChatHistory = [...chatHistory, userMessage];
      setChatHistory(updatedChatHistory);

      const messages = [
        { role: "system", content: systemPrompt },
        ...updatedChatHistory.map(msg => ({
          role: msg.role,
          content: msg.role === "user" && msg.image 
            ? [
                { type: "text", text: msg.content },
                { type: "image_url", image_url: { url: msg.image } }
              ]
            : msg.content
        }))
      ];

      const data = await callAI({ messages, model: "gpt-5.2" });
      const replyContent = data || "Desculpe, não consegui analisar esta imagem.";
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: replyContent
      };

      setChatHistory([...updatedChatHistory, assistantMessage]);
      return replyContent;
    } catch (error) {
      console.error("Failed to send image:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar imagem. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (
    message: string,
    systemPrompt: string,
    onSuccess?: (response: string) => void,
    model?: string
  ) => {
    if (!message.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Por favor, digite uma mensagem antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: ChatMessage = { role: "user", content: message.trim() };
    const updatedChatHistory = [...chatHistory, userMessage];
    setChatHistory(updatedChatHistory);
    setIsLoading(true);

    try {
      const isDreamPainter = model === "gpt-5.2";
      const messages = [
        { role: "system", content: systemPrompt },
        ...updatedChatHistory,
      ];

      const requestBody: any = { messages };
      if (model) requestBody.model = model;

      const data = await callAI(requestBody);
      let replyContent = data || "Desculpe, não consegui processar sua solicitação.";

      const assistantPreview: ChatMessage = {
        role: "assistant",
        content: replyContent,
      };

      const fullChatWithReply = [...updatedChatHistory, assistantPreview];
      const visualPrompt = extractExplicitPrompt(fullChatWithReply);

      if (visualPrompt && model === "gpt-5.2") {
        const loadingMsg: ChatMessage = { role: "assistant", content: replyContent };
        setChatHistory([...updatedChatHistory, loadingMsg]);

        const imageUrl = await generateImage(visualPrompt);
        if (imageUrl) {
          replyContent = `${replyContent}\n\nHere is your painting: ${imageUrl}`;
        }
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: replyContent,
      };

      setChatHistory([...updatedChatHistory, assistantMessage]);
      if (onSuccess) onSuccess(replyContent);
      return replyContent;
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar mensagem. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startConversation = async (
    initialMessage: string,
    systemPrompt: string,
    model?: string
  ) => {
    if (chatHistory.length > 0) return;
    setChatHistory([{ role: "user", content: initialMessage }]);
    setIsLoading(true);

    try {
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: initialMessage },
      ];

      const requestBody: any = { messages };
      if (model) requestBody.model = model;

      const data = await callAI(requestBody);
      const replyContent = data || "Desculpe, não consegui processar sua solicitação.";

      setChatHistory([
        { role: "user", content: initialMessage },
        { role: "assistant", content: replyContent },
      ]);

      return replyContent;
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        title: "Erro",
        description: "Falha ao iniciar a conversa. Por favor, tente novamente.",
        variant: "destructive",
      });
      setChatHistory([]);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  return {
    chatHistory,
    setChatHistory,
    isLoading,
    sendMessage,
    sendImage,
    startConversation,
    clearChat,
  };
};
