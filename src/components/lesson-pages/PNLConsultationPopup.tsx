import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Volume2, ChevronLeft, ChevronRight, Loader2, X, BookOpen } from 'lucide-react';
import { PNL_LESSONS, PNL_CATEGORY_LABELS, PNLCategory, PNLItem } from '@/data/pnlLessons';
import { useVocabularyAudio } from '@/hooks/useVocabularyAudio';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PNLConsultationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
}

const PNLConsultationPopup: React.FC<PNLConsultationPopupProps> = ({
  isOpen,
  onClose,
  lessonId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PNLCategory>('newWords');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingItemIndex, setPlayingItemIndex] = useState<number | null>(null);

  const lesson = PNL_LESSONS[lessonId];
  
  const categories: PNLCategory[] = ['verbs', 'newWords', 'usefulPhrases', 'grammarExamples'];
  
  const currentItems: PNLItem[] = lesson?.[selectedCategory] || [];
  
  // Collect all texts for preloading audio
  const allTexts = useMemo(() => {
    if (!lesson) return [];
    return [
      ...lesson.verbs,
      ...lesson.newWords,
      ...lesson.usefulPhrases,
      ...lesson.grammarExamples
    ].map(item => item.english);
  }, [lesson]);
  
  const { play, isPreloading } = useVocabularyAudio(allTexts);

  const handlePlayAudio = async (item: PNLItem, index: number) => {
    if (isPlayingAudio) return;
    
    setIsPlayingAudio(true);
    setPlayingItemIndex(index);
    try {
      // Use custom audioUrl if available, otherwise use TTS
      if (item.audioUrl) {
        const audio = new Audio(item.audioUrl);
        await audio.play();
        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
        });
      } else {
        await play(item.english);
      }
    } finally {
      setIsPlayingAudio(false);
      setPlayingItemIndex(null);
    }
  };

  if (!lesson) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden" hideCloseButton>
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <BookOpen className="h-5 w-5" />
              </div>
              <p className="text-lg font-semibold">{lesson.title}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as PNLCategory)} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 h-auto p-1 gap-1 flex-wrap">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                {PNL_CATEGORY_LABELS[category]}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="flex-1 m-0 p-0">
              <ScrollArea className="h-[50vh]">
                <div className="p-4 space-y-2">
                  {(lesson[category] as PNLItem[]).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePlayAudio(item, index)}
                        disabled={isPlayingAudio || isPreloading}
                        className={cn(
                          "h-9 w-9 rounded-full p-0 flex-shrink-0",
                          "bg-indigo-500 hover:bg-indigo-600 text-white",
                          playingItemIndex === index && "animate-pulse"
                        )}
                      >
                        {playingItemIndex === index ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground break-words">{item.english}</p>
                        <p className="text-sm text-muted-foreground break-words">{item.portuguese}</p>
                      </div>
                    </div>
                  ))}
                  
                  {(lesson[category] as PNLItem[]).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum item nesta categoria
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        {/* Footer */}
        <div className="border-t p-3 bg-muted/30">
          {isPreloading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Carregando áudios...</span>
            </div>
          ) : (
            <p className="text-xs text-center text-muted-foreground">
              Clique no ícone de áudio para ouvir a pronúncia
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PNLConsultationPopup;
