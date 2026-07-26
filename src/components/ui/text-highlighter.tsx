import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Highlighter } from 'lucide-react';

interface TextHighlighterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  rows?: number;
  className?: string;
}

const TextHighlighter: React.FC<TextHighlighterProps> = ({
  value,
  onChange,
  placeholder,
  label,
  rows = 10,
  className = ""
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setSelectionStart(textareaRef.current.selectionStart);
      setSelectionEnd(textareaRef.current.selectionEnd);
    }
  };

  const highlightSelectedText = () => {
    if (textareaRef.current && selectionStart !== selectionEnd) {
      const beforeSelection = value.substring(0, selectionStart);
      const selectedText = value.substring(selectionStart, selectionEnd);
      const afterSelection = value.substring(selectionEnd);
      
      // Check if the selected text is already highlighted
      if (selectedText.startsWith('**') && selectedText.endsWith('**')) {
        // Remove highlighting
        const unHighlightedText = selectedText.slice(2, -2);
        const newValue = beforeSelection + unHighlightedText + afterSelection;
        onChange(newValue);
        
        // Update cursor position
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(
              selectionStart, 
              selectionStart + unHighlightedText.length
            );
          }
        }, 0);
      } else {
        // Add highlighting
        const highlightedText = `**${selectedText}**`;
        const newValue = beforeSelection + highlightedText + afterSelection;
        onChange(newValue);
        
        // Update cursor position
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(
              selectionStart, 
              selectionStart + highlightedText.length
            );
          }
        }, 0);
      }
    }
  };

  const hasSelection = selectionStart !== selectionEnd;
  const selectedText = value.substring(selectionStart, selectionEnd);
  const isHighlighted = selectedText.startsWith('**') && selectedText.endsWith('**');

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        <ScrollArea className="h-[300px] w-full rounded-md border">
          <div className="p-3">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onSelect={handleSelectionChange}
              onMouseUp={handleSelectionChange}
              onKeyUp={handleSelectionChange}
              placeholder={placeholder}
              autoGrow
              maxHeight={800}
              className="border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 w-full min-h-[400px]"
            />
          </div>
        </ScrollArea>
        {hasSelection && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={highlightSelectedText}
            className="absolute top-2 right-8 flex items-center gap-2 bg-background/90 backdrop-blur-sm border shadow-sm z-10"
          >
            <Highlighter className="h-3 w-3" />
            {isHighlighted ? 'Remover Destaque' : 'Destacar'}
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Este texto aparecerá em uma área rolável para os estudantes lerem enquanto respondem às perguntas.
      </p>
      <p className="text-sm text-blue-600">
        💡 <strong>Dica:</strong> Selecione o texto e clique em "Destacar" para destacar partes importantes (aparecerá em negrito com fundo amarelo).
      </p>
    </div>
  );
};

export default TextHighlighter;