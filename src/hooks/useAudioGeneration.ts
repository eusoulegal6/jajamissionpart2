import { useState, useCallback } from 'react';
import { getCachedTtsUrl } from '@/lib/ttsCached';
import type { LessonPage } from '@/components/lesson-creator/LessonCreatorWizard';
import type { CustomPronunciationSlide } from '@/types/lesson';

interface AudioGenerationProgress {
  current: number;
  total: number;
  isGenerating: boolean;
  error: string | null;
}

interface AudioItemToProcess {
  pageIndex: number;
  slideIndex?: number;
  type: 'customPronunciationSlide' | 'audioSlide' | 'article';
  textToSpeak: string;
}

export function useAudioGeneration() {
  const [progress, setProgress] = useState<AudioGenerationProgress>({
    current: 0,
    total: 0,
    isGenerating: false,
    error: null,
  });

  const findItemsNeedingAudio = useCallback((pages: LessonPage[]): AudioItemToProcess[] => {
    const itemsToProcess: AudioItemToProcess[] = [];

    pages.forEach((page, pageIndex) => {
      // Handle customPronunciationSlides (EXISTING)
      if (page.type === 'customPronunciationSlides') {
        const slides = (page.content?.slides || []) as CustomPronunciationSlide[];
        slides.forEach((slide, slideIndex) => {
          if (slide.audioMode === true && !slide.displayAudioUrl && slide.displayText) {
            itemsToProcess.push({
              pageIndex,
              slideIndex,
              type: 'customPronunciationSlide',
              textToSpeak: slide.displayText,
            });
          }
        });
      }

      // Handle audioSlides (NEW) - check both content.slides and page.slides
      if (page.type === 'audioSlides') {
        const slides = page.content?.slides || (page as any).slides || [];
        slides.forEach((slide: any, slideIndex: number) => {
          if (!slide.audioUrl && slide.english) {
            itemsToProcess.push({
              pageIndex,
              slideIndex,
              type: 'audioSlide',
              textToSpeak: slide.english,
            });
          }
        });
      }

      // Handle article pages (NEW) - check both content.text and page.text
      if (page.type === 'article') {
        const text = page.content?.text || (page as any).text || '';
        const hasAudio = page.content?.audioUrl || (page as any).audioUrl;
        
        if (text && !hasAudio) {
          itemsToProcess.push({
            pageIndex,
            type: 'article',
            textToSpeak: text,
          });
        }
      }
    });

    return itemsToProcess;
  }, []);

  const generateMissingAudio = useCallback(async (
    pages: LessonPage[],
    onUpdate: (updatedPages: LessonPage[]) => void
  ): Promise<{ success: boolean; message: string; successCount: number; errorCount: number }> => {
    const itemsToProcess = findItemsNeedingAudio(pages);

    if (itemsToProcess.length === 0) {
      return { success: true, message: 'Nenhum áudio precisa ser gerado', successCount: 0, errorCount: 0 };
    }

    setProgress({
      current: 0,
      total: itemsToProcess.length,
      isGenerating: true,
      error: null,
    });

    let successCount = 0;
    let errorCount = 0;
    const updatedPages = JSON.parse(JSON.stringify(pages)) as LessonPage[];

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];

      setProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        const audioUrl = await getCachedTtsUrl(item.textToSpeak);

        if (audioUrl) {
          const page = updatedPages[item.pageIndex];

          if (item.type === 'customPronunciationSlide' && item.slideIndex !== undefined) {
            // Update customPronunciationSlides
            const slides = [...(page.content?.slides || [])] as CustomPronunciationSlide[];
            slides[item.slideIndex] = { ...slides[item.slideIndex], displayAudioUrl: audioUrl };
            updatedPages[item.pageIndex] = {
              ...page,
              content: { ...page.content, slides },
            };
          } else if (item.type === 'audioSlide' && item.slideIndex !== undefined) {
            // Update audioSlides - check both content.slides and page.slides
            const slides = [...(page.content?.slides || (page as any).slides || [])];
            slides[item.slideIndex] = { ...slides[item.slideIndex], audioUrl };
            updatedPages[item.pageIndex] = {
              ...page,
              content: { ...page.content, slides },
            };
          } else if (item.type === 'article') {
            // Update article page
            updatedPages[item.pageIndex] = {
              ...page,
              content: { ...page.content, audioUrl },
            };
          }

          successCount++;
        } else {
          errorCount++;
          console.warn(`Failed to generate audio for: "${item.textToSpeak.substring(0, 50)}..."`);
        }
      } catch (error) {
        errorCount++;
        console.error('Error generating audio:', error);
      }

      // Small delay to avoid rate limiting (300ms between calls)
      if (i < itemsToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // Update parent with new pages
    onUpdate(updatedPages);

    setProgress(prev => ({ ...prev, isGenerating: false }));

    if (errorCount === 0) {
      return {
        success: true,
        message: `${successCount} áudio(s) gerado(s) com sucesso!`,
        successCount,
        errorCount,
      };
    } else {
      return {
        success: false,
        message: `${successCount} gerado(s), ${errorCount} falha(s)`,
        successCount,
        errorCount,
      };
    }
  }, [findItemsNeedingAudio]);

  const countItemsNeedingAudio = useCallback((pages: LessonPage[]): number => {
    return findItemsNeedingAudio(pages).length;
  }, [findItemsNeedingAudio]);

  return {
    progress,
    generateMissingAudio,
    countItemsNeedingAudio,
    findItemsNeedingAudio,
  };
}
