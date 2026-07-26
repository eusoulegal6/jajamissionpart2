import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

// Render **bold** markdown in explanation text
const renderBoldText = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-800">{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

interface DetailedCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  correctedText: string;
  originalText: string;
  cleanCorrectedVersion?: string | null;
}

interface Correction {
  original: string;
  corrected: string;
  explanation: string;
  startIndex: number;
  endIndex: number;
}

const DetailedCorrectionModal: React.FC<DetailedCorrectionModalProps> = ({
  isOpen,
  onClose,
  correctedText,
  originalText,
  cleanCorrectedVersion,
}) => {
  const { t } = useLanguage();
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  // Check if a correction is only about punctuation or capitalization
  const isOnlyPunctuationOrCapitalization = (original: string, corrected: string): boolean => {
    const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
    return normalize(original) === normalize(corrected);
  };

  // Parse the AI response to extract corrections and clean corrected text
  const parseCorrections = (aiText: string): { corrections: Correction[]; displayText: string } => {
    const pattern = /"([^"]+)"\(([^)]+)\)\s*:([^:]+):/g;
    const corrections: Correction[] = [];
    let match;

    while ((match = pattern.exec(aiText)) !== null) {
      const [, original, corrected, explanation] = match;
      const trimmedOriginal = original.trim();
      const trimmedCorrected = corrected.trim();

      if (!isOnlyPunctuationOrCapitalization(trimmedOriginal, trimmedCorrected)) {
        corrections.push({
          original: trimmedOriginal,
          corrected: trimmedCorrected,
          explanation: explanation.trim(),
          startIndex: 0,
          endIndex: 0,
        });
      }
    }

    let displayText = aiText
      .replace(/"[^"]+"\([^)]+\)\s*:[^:]+:/g, '')
      .replace(/^[\s\S]*?(?=[A-Z])/m, '')
      .split(/\n\s*-/)[0]
      .replace(/\n+/g, ' ')
      .trim();

    if (!displayText || displayText.startsWith('-') || displayText.includes('usar ')) {
      displayText = '';
    }

    return { corrections, displayText };
  };

  const { corrections: aiCorrections, displayText: parsedDisplayText } = parseCorrections(correctedText);
  const displayText = cleanCorrectedVersion || originalText;

  const normalizeWord = (word: string): string => {
    return word.toLowerCase().replace(/[^\w\s]/g, '').trim();
  };

  const getOriginalWordsSet = (): Set<string> => {
    const words = originalText.split(/\s+/).map(normalizeWord).filter(w => w.length > 0);
    return new Set(words);
  };

  const getAddedWords = (): { word: string; normalizedWord: string }[] => {
    if (!displayText) return [];
    const originalWordsSet = getOriginalWordsSet();
    const correctedWords = displayText.split(/\s+/).filter(w => w.trim().length > 0);
    const addedWords: { word: string; normalizedWord: string }[] = [];
    
    for (const word of correctedWords) {
      const normalized = normalizeWord(word);
      if (normalized.length > 0 && !originalWordsSet.has(normalized)) {
        addedWords.push({ word, normalizedWord: normalized });
      }
    }
    return addedWords;
  };

  const isWordCoveredByCorrections = (normalizedWord: string, corrections: Correction[]): boolean => {
    return corrections.some(c => {
      const correctedNormalized = normalizeWord(c.corrected);
      return correctedNormalized.includes(normalizedWord) || normalizedWord.includes(correctedNormalized);
    });
  };

  const getRemovedWords = (): { word: string; normalizedWord: string }[] => {
    if (!displayText) return [];
    const correctedWordsSet = new Set(
      displayText.split(/\s+/).map(normalizeWord).filter(w => w.length > 0)
    );
    const originalWords = originalText.split(/\s+/).filter(w => w.trim().length > 0);
    const removedWords: { word: string; normalizedWord: string }[] = [];
    
    for (const word of originalWords) {
      const normalized = normalizeWord(word);
      if (normalized.length > 0 && !correctedWordsSet.has(normalized)) {
        removedWords.push({ word, normalizedWord: normalized });
      }
    }
    return removedWords;
  };

  const buildFinalCorrections = (): Correction[] => {
    const finalCorrections = [...aiCorrections];
    const addedWords = getAddedWords();
    const removedWords = getRemovedWords();
    const usedAddedIndices = new Set<number>();
    
    for (const removed of removedWords) {
      const isCovered = aiCorrections.some(c => 
        normalizeWord(c.original).includes(removed.normalizedWord) || 
        removed.normalizedWord.includes(normalizeWord(c.original))
      );
      
      if (isCovered) continue;
      
      let matchedAddedIndex = -1;
      for (let i = 0; i < addedWords.length; i++) {
        if (usedAddedIndices.has(i)) continue;
        const added = addedWords[i];
        if (added.normalizedWord.length > 0) {
          matchedAddedIndex = i;
          usedAddedIndices.add(i);
          break;
        }
      }
      
      if (matchedAddedIndex >= 0) {
        finalCorrections.push({
          original: removed.word,
          corrected: addedWords[matchedAddedIndex].word,
          explanation: t('palavra_corrigida'),
          startIndex: 0,
          endIndex: 0,
        });
      }
    }

    // Removed: no longer auto-generate "(faltando)" entries for added words
    // The AI prompt now handles all corrections explicitly

    return finalCorrections;
  };

  const corrections = buildFinalCorrections();

  const renderCorrectedTextWithDiff = (text: string): JSX.Element => {
    if (!text) return <span></span>;
    
    const originalWordsSet = getOriginalWordsSet();
    const words = text.split(/(\s+)/);
    
    return (
      <>
        {words.map((word, index) => {
          if (/^\s+$/.test(word)) {
            return <span key={index}>{word}</span>;
          }
          
          const nw = normalizeWord(word);
          
          if (nw.length > 0 && !originalWordsSet.has(nw)) {
            return (
              <span key={index} className="font-bold text-green-600">
                {word}
              </span>
            );
          }
          
          return <span key={index}>{word}</span>;
        })}
      </>
    );
  };

  const renderCorrectedText = () => {
    if (corrections.length === 0) {
      return <span className="text-gray-700">{originalText}</span>;
    }

    let lastIndex = 0;
    const elements: JSX.Element[] = [];

    const sortedCorrections = [...corrections].sort((a, b) => {
      const aIndex = originalText.indexOf(a.original, lastIndex);
      const bIndex = originalText.indexOf(b.original, lastIndex);
      return aIndex - bIndex;
    });

    sortedCorrections.forEach((correction, index) => {
      const originalIndex = originalText.indexOf(correction.original, lastIndex);
      
      if (originalIndex === -1) return;

      if (originalIndex > lastIndex) {
        elements.push(
          <span key={`text-${index}`} className="text-gray-700">
            {originalText.slice(lastIndex, originalIndex)}
          </span>
        );
      }

      elements.push(
        <TooltipProvider key={`correction-${index}`}>
          <Tooltip 
            open={activeTooltip === index}
            onOpenChange={(open) => setActiveTooltip(open ? index : null)}
          >
            <TooltipTrigger asChild>
              <span
                className="relative cursor-pointer transition-all duration-200 hover:bg-red-50 rounded px-1"
                onClick={() => setActiveTooltip(activeTooltip === index ? null : index)}
              >
                <span className="line-through text-red-500 decoration-2">
                  {correction.original}
                </span>
                <span className="ml-1 font-semibold text-green-600 bg-green-50 px-1 rounded">
                  {correction.corrected}
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="max-w-xs p-3 bg-gray-800 text-white rounded-lg shadow-lg"
            >
              <p className="text-sm">{correction.explanation}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      lastIndex = originalIndex + correction.original.length;
    });

    if (lastIndex < originalText.length) {
      elements.push(
        <span key="text-end" className="text-gray-700">
          {originalText.slice(lastIndex)}
        </span>
      );
    }

    return <div className="leading-relaxed">{elements}</div>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white" hideCloseButton>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-4 top-4 h-10 w-10 rounded-full hover:bg-gray-100"
        >
          <X className="h-6 w-6" />
        </Button>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {t('correcao_detalhada')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">{t('seu_texto_original')}</h3>
            <div className="bg-gray-50 border rounded-lg p-4">
              <p className="text-gray-600 italic">{originalText}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">{t('texto_corrigido')}</h3>
            <div className="bg-white border rounded-lg p-4 min-h-[100px]">
              {corrections.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-green-600 font-medium">{t('texto_correto')}</p>
                  <p className="text-gray-500 text-sm mt-1">{t('sem_erros_corrigir')}</p>
                </div>
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  {renderCorrectedTextWithDiff(displayText || corrections.map(c => c.corrected).join(' '))}
                </p>
              )}
            </div>
          </div>

          {corrections.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">
                {t('correcoes_count')} ({corrections.length}):
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
                {corrections.map((correction, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium text-red-600">"{correction.original}"</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium text-green-600">"{correction.corrected}"</span>
                    <p className="text-gray-600 mt-1 ml-4">{renderBoldText(correction.explanation)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailedCorrectionModal;