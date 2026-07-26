import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Trash2, Share2, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface WordSaverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WordSaverModal: React.FC<WordSaverModalProps> = ({ isOpen, onClose }) => {
  const [newWord, setNewWord] = useState('');
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Load saved words from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem('teacher-saved-words');
    if (stored) {
      try {
        setSavedWords(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading saved words:', e);
      }
    }
  }, []);

  // Save words to localStorage whenever savedWords changes
  useEffect(() => {
    localStorage.setItem('teacher-saved-words', JSON.stringify(savedWords));
  }, [savedWords]);

  const handleAddWord = () => {
    const trimmedWord = newWord.trim();
    if (trimmedWord && !savedWords.includes(trimmedWord)) {
      setSavedWords(prev => [...prev, trimmedWord]);
      setNewWord('');
    }
  };

  const handleRemoveWord = (wordToRemove: string) => {
    setSavedWords(prev => prev.filter(word => word !== wordToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddWord();
    }
  };

  const clearAllWords = () => {
    setSavedWords([]);
  };

  const generateShareLink = () => {
    if (savedWords.length === 0) {
      toast.error('Adicione algumas palavras antes de compartilhar');
      return;
    }

    try {
      const encoded = btoa(JSON.stringify(savedWords));
      const shareUrl = `${window.location.origin}/shared-flashcards/${encoded}`;
      
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        toast.success('Link copiado! Qualquer pessoa pode usar este link para adicionar essas palavras aos flashcards.');
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        toast.error('Erro ao copiar link');
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error('Erro ao gerar link');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Saved Words
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Add new word */}
          <div className="flex gap-2">
            <Input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a word..."
              className="flex-1"
            />
            <Button
              onClick={handleAddWord}
              size="sm"
              disabled={!newWord.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Words list */}
          <div className="flex-1 overflow-y-auto">
            {savedWords.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No words saved yet. Add your first word above!
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {savedWords.length} word{savedWords.length !== 1 ? 's' : ''} saved
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateShareLink}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllWords}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Clear all
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {savedWords.map((word, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1"
                    >
                      {word}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWord(word)}
                        className="h-4 w-4 p-0 hover:bg-red-100 hover:text-red-600 ml-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WordSaverModal;