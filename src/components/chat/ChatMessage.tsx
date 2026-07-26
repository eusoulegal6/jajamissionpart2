
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Loader, RefreshCw, ZoomIn, X, Coffee, Hotel, Users, ShoppingBag, Plane, MapPin, Globe, Briefcase, Footprints, MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogClose
} from "@/components/ui/dialog";
import { getDisplayImageUrl } from "@/utils/imageOptimization";
import OptimizedImg from "@/components/common/OptimizedImg";
import { cn } from "@/lib/utils";

/**
 * Renders text with **bold** markdown support.
 * Splits on **...** and wraps matched segments in <strong>.
 */
const renderFormattedText = (text: string): React.ReactNode => {
  // Split by **...**  pattern
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

/** Maps character names found in 🔵 lines to icon + gradient */
const characterConfig: Record<string, { icon: React.ElementType; gradient: string }> = {
  "Waiter": { icon: Coffee, gradient: "from-orange-500 to-red-500" },
  "Camarero": { icon: Coffee, gradient: "from-orange-500 to-red-500" },
  "Receptionist": { icon: Hotel, gradient: "from-blue-500 to-indigo-500" },
  "Recepcionista": { icon: Hotel, gradient: "from-blue-500 to-indigo-500" },
  "Stranger": { icon: Users, gradient: "from-pink-500 to-rose-500" },
  "Desconocido": { icon: Users, gradient: "from-pink-500 to-rose-500" },
  "Store Clerk": { icon: ShoppingBag, gradient: "from-violet-500 to-purple-500" },
  "Dependiente": { icon: ShoppingBag, gradient: "from-violet-500 to-purple-500" },
  "Airport Staff": { icon: Plane, gradient: "from-sky-500 to-cyan-500" },
  "Personal del aeropuerto": { icon: Plane, gradient: "from-sky-500 to-cyan-500" },
  "Local": { icon: MapPin, gradient: "from-emerald-500 to-green-500" },
  "Tourist": { icon: Globe, gradient: "from-amber-500 to-yellow-500" },
  "Turista": { icon: Globe, gradient: "from-amber-500 to-yellow-500" },
  "Manager": { icon: Briefcase, gradient: "from-slate-600 to-zinc-700" },
  "Gerente": { icon: Briefcase, gradient: "from-slate-600 to-zinc-700" },
  "New Friend": { icon: Footprints, gradient: "from-teal-500 to-cyan-500" },
  "Nuevo amigo": { icon: Footprints, gradient: "from-teal-500 to-cyan-500" },
  "Partner": { icon: MessageCircle, gradient: "from-slate-500 to-slate-600" },
  "Compañero": { icon: MessageCircle, gradient: "from-slate-500 to-slate-600" },
};

/**
 * Detects if a message contains a roleplay character line (🔵 CharName: ...)
 * and returns { characterName, icon, gradient, contextText, dialogueText }
 */
function parseRolePlayMessage(content: string) {
  // Match 🔵 followed by a character name and colon
  const match = content.match(/🔵\s*([^:]+):\s*([\s\S]*)/);
  if (!match) return null;

  const characterName = match[1].trim();
  const dialogueText = match[2].trim();

  // Extract context (🟡 block before the 🔵 line)
  const contextMatch = content.match(/🟡[^\n]*\n([\s\S]*?)(?=\n\s*🔵)/);
  const contextText = contextMatch ? contextMatch[1].trim() : null;

  const config = characterConfig[characterName] || { icon: MessageCircle, gradient: "from-slate-500 to-slate-600" };

  return {
    characterName,
    dialogueText,
    contextText,
    ...config,
  };
}

interface ChatMessageProps {
  message: {
    role: "system" | "user" | "assistant";
    content: string;
    image?: string;
  };
  index: number;
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: () => void;
  onPlayAgain?: () => void;
  selectedWordForPronunciation?: string | null;
  onPronounceWord?: (word: string) => void;
  isPronunciationLoading?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  index,
  isPlaying,
  isLoading,
  onPlay,
  onPlayAgain,
  selectedWordForPronunciation,
  onPronounceWord,
  isPronunciationLoading
}) => {
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Function to handle image click
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageDialog(true);
  };

  // Check if this is an assistant response to a word explanation request
  const isWordExplanation = message.role === "assistant" && 
    selectedWordForPronunciation && 
    index > 0 &&
    (message.content.includes("significa") || 
     message.content.includes("significado") ||
     message.content.includes("palavra") ||
     message.content.includes("inglês") ||
     message.content.includes("exemplo"));

  // Check if this is a roleplay character message
  const rolePlayData = message.role === "assistant" ? parseRolePlayMessage(message.content) : null;

  // Detect AI feedback messages (graded answers, corrections) — disable word-click on these.
  const isFeedbackMessage = message.role === "assistant" && /\*\*\s*(?:[^\w\s]+\s*)?(Relev[âa]ncia|Gram[áa]tica|Pontua[çc][ãa]o|Contexto|Postura|Vocabul[áa]rio|Pron[úu]ncia|Estrutura|Coer[êe]ncia|Clareza|Native version|Vers[ãa]o nativa|Resposta nativa|Score|Grammar|Vocabulary|Feedback|Avalia[çc][ãa]o|Corre[çc][ãa]o|Sugest[õo]es?)\b/i.test(message.content);

  // Function to process message content and detect if it contains an image URL
  const processContent = () => {
    const content = message.content;
    
    // First, check if the message has an attached image
    if (message.image) {
      return (
        <>
          <div className="mb-3">
            <div className="relative group">
              <img 
                src={message.image} 
                alt="Uploaded" 
                className="rounded-lg max-w-full shadow-md cursor-pointer transition-opacity hover:opacity-95"
                style={{ maxHeight: '400px' }} 
                onClick={() => handleImageClick(message.image!)}
              />
              <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="h-4 w-4" />
              </div>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-[17px] leading-relaxed">
            {renderFormattedText(content)}
          </p>
        </>
      );
    }
    
    // Check if the message contains "Here is your painting:" and has an image URL
    if (content.includes("Here is your painting:") && content.includes("http")) {
      const parts = content.split("Here is your painting:");
      const imageUrlMatch = parts[1].match(/(https?:\/\/[^\s]+)/);
      
      if (imageUrlMatch && imageUrlMatch[0]) {
        const imageUrl = imageUrlMatch[0].trim();
        
        return (
          <>
            <p className="whitespace-pre-wrap text-[17px] leading-relaxed mb-3">
              Here is your painting:
            </p>
            <div className="mt-2 mb-4">
              <div className="relative group">
                <img 
                  src={getDisplayImageUrl(imageUrl)} 
                  alt="Your Painting" 
                  className="rounded-lg max-w-full shadow-md cursor-pointer transition-opacity hover:opacity-95"
                  style={{ maxHeight: '400px' }} 
                  onClick={() => handleImageClick(imageUrl)}
                />
                <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="h-4 w-4" />
                </div>
              </div>
            </div>
            {onPlayAgain && (
              <Button 
                onClick={onPlayAgain}
                className="mt-3 flex items-center gap-2 bg-[#10a37f] hover:bg-[#0e8e6d] text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Create new painting
              </Button>
            )}
          </>
        );
      }
    }
    
    // If no image URL is detected, just render the text content normally
    return <p className="whitespace-pre-wrap text-[17px] leading-relaxed">{renderFormattedText(content)}</p>;
  };

  // Render roleplay character message with avatar
  if (rolePlayData) {
    const CharIcon = rolePlayData.icon;
    return (
      <>
        <div className="flex justify-start">
          <div className="w-full max-w-[85%]">
            {/* Context block */}
            {rolePlayData.contextText && (
              <div className="mb-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800 leading-relaxed">
                  <span className="font-semibold">🟡 Contexto:</span> {rolePlayData.contextText}
                </p>
              </div>
            )}

            {/* Character dialogue */}
            <div className="flex items-start gap-3">
              <div className={cn(
                "flex items-center justify-center h-10 w-10 md:h-11 md:w-11 rounded-full text-white shadow-md shrink-0",
                `bg-gradient-to-br ${rolePlayData.gradient}`
              )}>
                <CharIcon className="h-5 w-5 md:h-5.5 md:w-5.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r",
                    rolePlayData.gradient
                  )}>
                    {rolePlayData.characterName}
                  </span>
                </div>
                <div className="message-bubble assistant-message">
                  <div className="flex items-start">
                    <div className="flex-1" data-word-clickable>
                      <p className="whitespace-pre-wrap text-[17px] leading-relaxed">
                        {renderFormattedText(rolePlayData.dialogueText)}
                      </p>
                    </div>
                    {rolePlayData.dialogueText.length < 500 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onPlay}
                        className="ml-2 h-7 w-7 p-0 flex-shrink-0 text-[#6e6e80] hover:text-[#202123] transition-colors hover:opacity-90 hover:scale-105"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Volume2 className={`h-4 w-4 ${isPlaying ? "text-[#10a37f]" : ""}`} />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Image Dialog */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent className={`max-w-[95vw] p-0 border-0 bg-transparent ${isMobile ? 'w-full h-[90vh] max-h-[90vh]' : 'max-h-[90vh]'}`}>
            <div className="relative w-full h-full flex items-center justify-center bg-black/90 rounded-lg overflow-hidden">
              <DialogClose className="absolute top-4 right-4 z-50">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8 rounded-full bg-black/80 border-0 text-white hover:bg-black hover:text-white"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
              <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                {selectedImage && (
                  <img src={selectedImage} alt="Expanded view" className="max-w-full max-h-full object-contain rounded" />
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div 
        className={`flex ${
          message.role === "user" ? "justify-end" : "justify-start"
        }`}
      >
        <div 
          className={`message-bubble ${
            message.role === "user" 
              ? "user-message" 
              : "assistant-message"
          }`}
        >
          <div className="flex items-start">
            <div className="flex-1" data-word-clickable={message.role === "assistant" && !isFeedbackMessage ? "" : undefined} data-no-word-click={isFeedbackMessage ? "" : undefined}>
              {processContent()}
            </div>
            {/* Regular audio button - only for assistant messages, not images, and short messages */}
            {message.role === "assistant" &&
             !message.content.includes("Here is your painting:") &&
             !message.image &&
             message.content.length < 500 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPlay}
                className="ml-2 h-7 w-7 p-0 flex-shrink-0 text-[#6e6e80] hover:text-[#202123] transition-colors hover:opacity-90 hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className={`h-4 w-4 ${isPlaying ? "text-[#10a37f]" : ""}`} />
                )}
              </Button>
            )}
          </div>
          
          {/* Pronunciation button - completely separate from regular audio controls */}
          {isWordExplanation && selectedWordForPronunciation && onPronounceWord && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Button
                onClick={() => onPronounceWord(selectedWordForPronunciation)}
                disabled={isPronunciationLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 h-auto"
              >
                {isPronunciationLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                Pronúncia de "{selectedWordForPronunciation}"
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className={`max-w-[95vw] p-0 border-0 bg-transparent ${isMobile ? 'w-full h-[90vh] max-h-[90vh]' : 'max-h-[90vh]'}`}>
          <div className="relative w-full h-full flex items-center justify-center bg-black/90 rounded-lg overflow-hidden">
            <DialogClose className="absolute top-4 right-4 z-50">
              <Button 
                variant="outline" 
                size="icon"
                className="h-8 w-8 rounded-full bg-black/80 border-0 text-white hover:bg-black hover:text-white"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
            
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Expanded view"
                  className="max-w-full max-h-full object-contain rounded"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatMessage;
