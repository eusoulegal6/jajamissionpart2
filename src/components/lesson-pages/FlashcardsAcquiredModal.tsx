import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { LessonFlashcard } from '@/types/lesson';

interface FlashcardsAcquiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards: LessonFlashcard[];
}

const FlashcardsAcquiredModal: React.FC<FlashcardsAcquiredModalProps> = ({
  isOpen,
  onClose,
  flashcards
}) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentCardIndex(0);
      setIsFlipped(false);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const currentCard = flashcards[currentCardIndex];

  if (!currentCard) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <div className="text-center space-y-6 py-6">
          {/* Header with celebration animation */}
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-primary rounded-full p-4">
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Novos Flashcards Adquiridos!
            </h2>
            <p className="text-muted-foreground">
              Você ganhou {flashcards.length} novo{flashcards.length !== 1 ? 's' : ''} flashcard{flashcards.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Flashcard Display */}
          <div className="relative min-h-[300px] flex items-center justify-center perspective-1000">
            <Card 
              className="w-full max-w-md cursor-pointer transition-all duration-500 transform hover:scale-105 animate-scale-in"
              onClick={() => setIsFlipped(!isFlipped)}
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              <CardContent className="p-8 min-h-[250px] flex flex-col justify-center items-center">
                {!isFlipped ? (
                  <div className="text-center space-y-4">
                    <BookOpen className="w-12 h-12 mx-auto text-primary" />
                    <p className="text-2xl font-semibold">{currentCard.front}</p>
                    <p className="text-sm text-muted-foreground">Clique para ver a resposta</p>
                  </div>
                ) : (
                  <div className="text-center space-y-4" style={{ transform: 'rotateY(180deg)' }}>
                    <p className="text-2xl font-semibold text-primary">{currentCard.back}</p>
                    {currentCard.context && (
                      <p className="text-sm text-muted-foreground italic">
                        "{currentCard.context}"
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2">
            {flashcards.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentCardIndex
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentCardIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {currentCardIndex + 1} de {flashcards.length}
            </span>
            
            <Button
              onClick={handleNext}
              className="gap-2"
            >
              {currentCardIndex < flashcards.length - 1 ? (
                <>
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Concluir
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlashcardsAcquiredModal;
