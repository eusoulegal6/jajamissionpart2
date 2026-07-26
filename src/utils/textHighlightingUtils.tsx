import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Utility functions for text highlighting and show answer sections
 */

// Function to render text with highlighting support
// Converts **text** to highlighted (bold) text
export const renderHighlightedText = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Remove ** markers and apply highlighting
      const highlightedText = part.slice(2, -2);
      return (
        <strong key={index} className="bg-yellow-200 px-1 py-0.5 rounded font-semibold">
          {highlightedText}
        </strong>
      );
    }
    return part;
  });
};

// Component for a single show answer section
const ShowAnswerSection: React.FC<{ text: string; index: number }> = ({ text, index }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Reset visibility when text changes (e.g., when navigating to a new page)
  React.useEffect(() => {
    setIsVisible(false);
  }, [text]);

  return (
    <span className="inline-block my-2">
      {!isVisible ? (
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="mx-1 border-primary/50 hover:bg-primary/10"
        >
          <Eye className="h-4 w-4 mr-2" />
          Show answer
        </Button>
      ) : (
        <span className="inline-flex items-center gap-2 mx-1 px-3 py-1 bg-green-50 border border-green-200 rounded">
          <span className="text-green-900">{text}</span>
          <button
            onClick={() => setIsVisible(false)}
            className="text-green-600 hover:text-green-800"
            aria-label="Hide answer"
          >
            <EyeOff className="h-3 w-3" />
          </button>
        </span>
      )}
    </span>
  );
};

// Function to render text with bold markdown and show answer sections
// Converts **text** to bold and %%%text%%% to hidden answer sections
export const renderTextWithAnswers = (text: string): React.ReactNode => {
  if (!text) return text;

  // First split by show answer sections (%%%text%%%)
  const answerParts = text.split(/(%%%.*?%%%)/g);
  
  return answerParts.map((answerPart, answerIndex) => {
    if (answerPart.startsWith('%%%') && answerPart.endsWith('%%%')) {
      // This is a show answer section
      const answerText = answerPart.slice(3, -3);
      return <ShowAnswerSection key={`answer-${answerIndex}`} text={answerText} index={answerIndex} />;
    }
    
    // For non-answer sections, handle bold markup
    const boldParts = answerPart.split(/(\*\*.*?\*\*)/g);
    return (
      <span key={`section-${answerIndex}`}>
        {boldParts.map((boldPart, boldIndex) => {
          if (boldPart.startsWith('**') && boldPart.endsWith('**') && boldPart.length > 4) {
            const boldText = boldPart.slice(2, -2);
            return <strong key={`${answerIndex}-bold-${boldIndex}`}>{boldText}</strong>;
          }
          return <span key={`${answerIndex}-text-${boldIndex}`}>{boldPart}</span>;
        })}
      </span>
    );
  });
};

// Function to check if text contains highlighting markup
export const hasHighlighting = (text: string): boolean => {
  return /\*\*.*?\*\*/.test(text);
};

// Function to check if text contains show answer sections
export const hasShowAnswerSections = (text: string): boolean => {
  return /%%%.*?%%%/.test(text);
};

// Function to get plain text without highlighting markup
export const getPlainText = (text: string): string => {
  return text.replace(/\*\*(.*?)\*\*/g, '$1');
};