
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Loader, RefreshCw, Turtle, Check } from "lucide-react";

interface ListeningMessageProps {
  message: {
    role: "system" | "user" | "assistant";
    content: string;
  };
  index: number;
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: () => void;
  onPlayAgain?: () => void;
  onPlaySlow?: () => void;
  isPlayingSlow?: boolean;
  onSendMessage?: (message: string) => void;
}

const ListeningMessage: React.FC<ListeningMessageProps> = ({
  message,
  index,
  isPlaying,
  isLoading,
  onPlay,
  onPlayAgain,
  onPlaySlow,
  isPlayingSlow = false,
  onSendMessage
}) => {
  
  // Check if this is a hidden phrase message
  const isHiddenPhraseMessage = 
    message.role === "assistant" && 
    message.content.startsWith("<hidden_phrase>") && 
    message.content.endsWith("</hidden_phrase>");

  // Check if this is a feedback message (assistant message without hidden phrase)
  const isFeedbackMessage = 
    message.role === "assistant" && 
    !isHiddenPhraseMessage &&
    message.content.includes("Gostaria de jogar novamente?");

  // Check if this is a "try another phrase" message
  const isTryAnotherMessage = 
    message.role === "assistant" && 
    !isHiddenPhraseMessage &&
    message.content.includes("Gostaria de tentar outra frase?");

  // Extract the hidden phrase content for audio
  const hiddenPhrase = message.content.match(/<hidden_phrase>(.*?)<\/hidden_phrase>/)?.[1];

  // If this is a hidden phrase message, show only the audio buttons
  if (isHiddenPhraseMessage && hiddenPhrase) {
    return (
      <div className="flex justify-start">
        <div className="message-bubble assistant-message">
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={onPlay}
              className={`h-11 px-5 flex items-center gap-2 rounded-full transition-all shadow-sm ${
                isPlaying 
                  ? "bg-[#10a37f] text-white hover:bg-[#0e8e6d]" 
                  : "bg-gradient-to-r from-[#10a37f] to-[#0e8e6d] text-white hover:from-[#0e8e6d] hover:to-[#0c7a5e] hover:shadow-md"
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
              <span className="text-sm font-semibold">{isPlaying ? "Pause" : "Listen"}</span>
            </Button>
            {onPlaySlow && (
              <Button
                onClick={onPlaySlow}
                className={`h-11 px-5 flex items-center gap-2 rounded-full transition-all shadow-sm ${
                  isPlayingSlow 
                    ? "bg-[#6366f1] text-white hover:bg-[#5558e3]" 
                    : "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:from-[#5558e3] hover:to-[#7c4fe0] hover:shadow-md"
                }`}
                disabled={isLoading}
                title="Listen slowly"
              >
                <Turtle className="h-5 w-5" />
                <span className="text-sm font-semibold">{isPlayingSlow ? "Pause" : "Slow"}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // For "try another phrase" messages, show content with Yes button
  if (isTryAnotherMessage) {
    return (
      <div className="flex justify-start">
        <div className="message-bubble assistant-message">
          <div className="flex items-start">
            <div className="flex-1">
              <p className="whitespace-pre-wrap text-[17px] leading-relaxed">{message.content}</p>
              {onSendMessage && (
                <div className="mt-3">
                  <Button
                    onClick={() => onSendMessage("yes")}
                    className="bg-[#10a37f] hover:bg-[#0e8e6d] text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Yes
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPlay}
                className="h-7 w-7 p-0 flex-shrink-0 text-[#6e6e80] hover:text-[#202123] transition-colors hover:opacity-90 hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className={`h-4 w-4 ${isPlaying ? "text-[#10a37f]" : ""}`} />
                )}
              </Button>
              {onPlaySlow && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPlaySlow}
                  className="h-7 w-7 p-0 flex-shrink-0 text-[#6e6e80] hover:text-[#202123] transition-colors hover:opacity-90 hover:scale-105"
                  disabled={isLoading}
                  title="Play slowly (70% slower)"
                >
                  <Turtle className={`h-4 w-4 ${isPlayingSlow ? "text-[#10a37f]" : ""}`} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For feedback messages, show content with play again button
  if (isFeedbackMessage) {
    return (
      <div className="flex justify-start">
        <div className="message-bubble assistant-message">
          <div className="flex items-start">
            <div className="flex-1">
              <p className="whitespace-pre-wrap text-[17px] leading-relaxed">{message.content}</p>
              {onPlayAgain && (
                <div className="mt-3">
                  <Button
                    onClick={onPlayAgain}
                    className="bg-[#10a37f] hover:bg-[#0e8e6d] text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Jogar Novamente
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPlay}
                className="h-7 w-7 p-0 flex-shrink-0 text-[#6e6e80] hover:text-[#202123] transition-colors hover:opacity-90 hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className={`h-4 w-4 ${isPlaying ? "text-[#10a37f]" : ""}`} />
                )}
              </Button>
              {onPlaySlow && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPlaySlow}
                  className="h-7 w-7 p-0 flex-shrink-0 text-[#6e6e80] hover:text-[#202123] transition-colors hover:opacity-90 hover:scale-105"
                  disabled={isLoading}
                  title="Play slowly (70% slower)"
                >
                  <Turtle className={`h-4 w-4 ${isPlayingSlow ? "text-[#10a37f]" : ""}`} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For all other messages (user messages and assistant feedback), render normally
  return (
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
          <div className="flex-1">
            <p className="whitespace-pre-wrap text-[17px] leading-relaxed">{message.content}</p>
          </div>
          {message.role === "assistant" && (
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPlay}
                className="h-7 w-7 p-0 flex-shrink-0 text-[#6e6e80] hover:text-[#202123] transition-colors hover:opacity-90 hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className={`h-4 w-4 ${isPlaying ? "text-[#10a37f]" : ""}`} />
                )}
              </Button>
              {onPlaySlow && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPlaySlow}
                  className="h-7 w-7 p-0 flex-shrink-0 text-[#6e6e80] hover:text-[#202123] transition-colors hover:opacity-90 hover:scale-105"
                  disabled={isLoading}
                  title="Play slowly (70% slower)"
                >
                  <Turtle className={`h-4 w-4 ${isPlayingSlow ? "text-[#10a37f]" : ""}`} />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListeningMessage;
