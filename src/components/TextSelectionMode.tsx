import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { MULTI_WORD_PHRASES, findMultiWordPhrases } from "@/utils/multiWordPhrases";
import { useIsMobile } from "@/hooks/use-mobile";

interface TextSelectionModeProps {
  isActive: boolean;
  onCancel: () => void;
  onConfirm: (selectedWord: string) => void;
}

const TextSelectionMode: React.FC<TextSelectionModeProps> = ({
  isActive,
  onCancel,
  onConfirm
}) => {
  const modifiedContainersRef = useRef<Map<HTMLElement, string>>(new Map());
  const isMobile = useIsMobile();

  // Define event handlers using useCallback to ensure stable references
  const handleWordClick = useCallback((event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLElement;
    const word = target.textContent?.trim() || '';
    if (word) {
      // Immediately go to specialist without confirmation
      onConfirm(word);
    }
  }, [onConfirm]);

  const handleWordHover = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    target.style.backgroundColor = '#dbeafe';
  }, []);

  const handleWordLeave = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    target.style.backgroundColor = '';
  }, []);

  // Function to check if an element is specifically a "Play Audio" button
  const isPlayAudioButton = (element: HTMLElement): boolean => {
    if (element.tagName !== 'BUTTON') return false;
    
    const buttonText = element.textContent?.toLowerCase() || '';
    const hasPlayIcon = element.querySelector('svg[class*="lucide-play"]') !== null;
    const hasPauseIcon = element.querySelector('svg[class*="lucide-pause"]') !== null;
    const hasLoaderIcon = element.querySelector('svg[class*="lucide-loader"]') !== null;
    
    // Check if it's specifically an audio play/pause button
    const isAudioButton = (hasPlayIcon || hasPauseIcon || hasLoaderIcon) && 
                         (buttonText.includes('play audio') || 
                          buttonText.includes('pause audio') || 
                          buttonText.includes('loading audio') ||
                          buttonText.includes('ouvir'));
    
    return isAudioButton;
  };

  // Function to check if an element is within the navigation bar or audio controls (for text processing exclusion)
  const isInNavigationBar = (element: HTMLElement): boolean => {
    // Check if the element or any of its parents has navigation-related classes or is the fixed bottom navigation
    let current: HTMLElement | null = element;
    while (current) {
      // Check for fixed bottom navigation bar
      if (current.classList.contains('fixed') && 
          current.classList.contains('bottom-0') &&
          current.classList.contains('bg-white')) {
        return true;
      }
      
      // Check for common navigation container patterns
      if (current.tagName === 'BUTTON' && 
          current.closest('.fixed.bottom-0')) {
        return true;
      }

      // Check for audio control buttons by looking for icons or audio-related text
      if (current.tagName === 'BUTTON') {
        const buttonText = current.textContent?.toLowerCase() || '';
        const hasVolumeIcon = current.querySelector('svg[class*="lucide-volume"]') !== null;
        const hasPlayIcon = current.querySelector('svg[class*="lucide-play"]') !== null;
        const hasPauseIcon = current.querySelector('svg[class*="lucide-pause"]') !== null;
        const hasLoaderIcon = current.querySelector('svg[class*="lucide-loader"]') !== null;
        const hasAudioText = buttonText.includes('play') || 
                           buttonText.includes('pause') || 
                           buttonText.includes('audio') || 
                           buttonText.includes('ouvir') ||
                           buttonText.includes('loading');
        
        if (hasVolumeIcon || hasPlayIcon || hasPauseIcon || hasLoaderIcon || hasAudioText) {
          return true;
        }
      }

      // Check if the element is within an audio control container
      if (current.className && typeof current.className === 'string' && (
          current.className.includes('audio-control') ||
          current.className.includes('audio-button') ||
          current.className.includes('play-button')
        )) {
        return true;
      }

      current = current.parentElement;
    }
    return false;
  };

  // Function to process text and create clickable elements
  const processTextWithPhrases = useCallback((textNode: Text, parent: HTMLElement): HTMLElement[] => {
    // Skip if the parent element is within the navigation bar or audio controls
    if (isInNavigationBar(parent)) {
      return [];
    }

    // Store original innerHTML to restore later - but only if not already stored
    if (!modifiedContainersRef.current.has(parent)) {
      modifiedContainersRef.current.set(parent, parent.innerHTML);
    }

    const text = textNode.textContent || '';
    const phrases = findMultiWordPhrases(text);
    const elements: HTMLElement[] = [];
    
    if (phrases.length === 0) {
      // No phrases found, process as individual words
      const words = text.split(/(\s+|[.,!?;:()[\]{}"])/);
      const fragment = document.createDocumentFragment();
      
      words.forEach(part => {
        if (part.trim() && !/^\s+$/.test(part) && !/^[.,!?;:()[\]{}"]$/.test(part)) {
          // This is a word
          const span = document.createElement('span');
          span.textContent = part;
          span.style.cursor = 'pointer';
          span.style.padding = '0px';
          span.style.display = 'inline';
          span.style.borderRadius = '4px';
          span.style.transition = 'background-color 0.2s ease';
          span.addEventListener('click', handleWordClick);
          span.addEventListener('mouseenter', handleWordHover);
          span.addEventListener('mouseleave', handleWordLeave);
          elements.push(span);
          fragment.appendChild(span);
        } else {
          // This is whitespace or punctuation
          fragment.appendChild(document.createTextNode(part));
        }
      });
      
      parent.replaceChild(fragment, textNode);
      return elements;
    }
    
    // Process text with phrases
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    
    phrases.forEach(({phrase, start, end}) => {
      // Add text before the phrase
      if (start > lastIndex) {
        const beforeText = text.substring(lastIndex, start);
        const beforeWords = beforeText.split(/(\s+|[.,!?;:()[\]{}"])/);
        
        beforeWords.forEach(part => {
          if (part.trim() && !/^\s+$/.test(part) && !/^[.,!?;:()[\]{}"]$/.test(part)) {
            const span = document.createElement('span');
            span.textContent = part;
            span.style.cursor = 'pointer';
            span.style.padding = '0px';
            span.style.display = 'inline';
            span.style.borderRadius = '4px';
            span.style.transition = 'background-color 0.2s ease';
            span.addEventListener('click', handleWordClick);
            span.addEventListener('mouseenter', handleWordHover);
            span.addEventListener('mouseleave', handleWordLeave);
            elements.push(span);
            fragment.appendChild(span);
          } else {
            fragment.appendChild(document.createTextNode(part));
          }
        });
      }
      
      // Add the phrase as a single clickable element
      const phraseSpan = document.createElement('span');
      phraseSpan.textContent = text.substring(start, end);
      phraseSpan.style.cursor = 'pointer';
      phraseSpan.style.padding = '0px';
      phraseSpan.style.display = 'inline';
      phraseSpan.style.borderRadius = '4px';
      phraseSpan.style.transition = 'background-color 0.2s ease';
      phraseSpan.style.border = '1px dashed #3b82f6';
      phraseSpan.addEventListener('click', handleWordClick);
      phraseSpan.addEventListener('mouseenter', handleWordHover);
      phraseSpan.addEventListener('mouseleave', handleWordLeave);
      elements.push(phraseSpan);
      fragment.appendChild(phraseSpan);
      
      lastIndex = end;
    });
    
    // Add remaining text after the last phrase
    if (lastIndex < text.length) {
      const afterText = text.substring(lastIndex);
      const afterWords = afterText.split(/(\s+|[.,!?;:()[\]{}"])/);
      
      afterWords.forEach(part => {
        if (part.trim() && !/^\s+$/.test(part) && !/^[.,!?;:()[\]{}"]$/.test(part)) {
          const span = document.createElement('span');
          span.textContent = part;
          span.style.cursor = 'pointer';
          span.style.padding = '0px';
          span.style.display = 'inline';
          span.style.borderRadius = '4px';
          span.style.transition = 'background-color 0.2s ease';
          span.addEventListener('click', handleWordClick);
          span.addEventListener('mouseenter', handleWordHover);
          span.addEventListener('mouseleave', handleWordLeave);
          elements.push(span);
          fragment.appendChild(span);
        } else {
          fragment.appendChild(document.createTextNode(part));
        }
      });
    }
    
    parent.replaceChild(fragment, textNode);
    return elements;
  }, [handleWordClick, handleWordHover, handleWordLeave]);

  useEffect(() => {
    if (!isActive) {
      // Restore original HTML for all modified containers
      modifiedContainersRef.current.forEach((originalHTML, container) => {
        try {
          if (document.body.contains(container)) {
            container.innerHTML = originalHTML;
          }
        } catch (error) {
          console.error('Error restoring container:', error);
        }
      });
      
      // Clear the Map
      modifiedContainersRef.current.clear();
      return;
    }

    // Add click prevention ONLY for "Play Audio" buttons during text selection mode
    const allButtons = document.querySelectorAll('button');
    const preventAudioClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('button');
      if (button && isPlayAudioButton(button)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };

    allButtons.forEach(button => {
      if (isPlayAudioButton(button)) {
        button.addEventListener('click', preventAudioClick, true);
      }
    });

    // Find all text content in article pages and make words clickable, but exclude navigation bar and audio controls
    const textContainers = document.querySelectorAll('.prose, [class*="text-"], article, .lesson-text');

    textContainers.forEach(container => {
      // Skip containers that are within the navigation bar or audio controls
      if (isInNavigationBar(container as HTMLElement)) {
        return;
      }

      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      );

      const textNodes: Text[] = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent?.trim()) {
          textNodes.push(node as Text);
        }
      }

      textNodes.forEach(textNode => {
        try {
          const parent = textNode.parentNode as HTMLElement;
          if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') return;

          processTextWithPhrases(textNode, parent);
        } catch (error) {
          console.error('Error processing text node:', error);
        }
      });
    });

    // Cleanup function
    return () => {
      // Remove audio button click prevention
      allButtons.forEach(button => {
        if (isPlayAudioButton(button)) {
          button.removeEventListener('click', preventAudioClick, true);
        }
      });
    };
  }, [isActive, handleWordClick, handleWordHover, handleWordLeave, isMobile, processTextWithPhrases]);

  if (!isActive) return null;

  return (
    <>
      {/* Animation indicator at the top */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[15001] pointer-events-none">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg animate-pulse flex items-center gap-3">
          <p className="text-sm font-medium">Clique na palavra que tem dúvida</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="pointer-events-auto h-6 w-6 text-white hover:bg-blue-700 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default TextSelectionMode;