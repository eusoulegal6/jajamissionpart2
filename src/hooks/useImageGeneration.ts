import { useState, useCallback } from 'react';
import type { LessonPage } from '@/components/lesson-creator/LessonCreatorWizard';
import { GEN_GATE_KEY, GEN_GATE_HEADER } from '@/lib/genGate';

// Local Supabase edge function using OpenAI gpt-image-1.5
const IMAGE_GENERATION_ENDPOINT = 'https://mcuquzgpaeoqskesgcnx.supabase.co/functions/v1/generate-image';

const generateImageWithOpenAI = async (prompt: string): Promise<string | null> => {
  try {
    const response = await fetch(IMAGE_GENERATION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [GEN_GATE_HEADER]: GEN_GATE_KEY,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    return data.imageUrl || data.url || null;
  } catch (error) {
    console.error('OpenAI image generation error:', error);
    return null;
  }
};


interface ImageGenerationProgress {
  current: number;
  total: number;
  isGenerating: boolean;
  error: string | null;
}

interface ImageItemToProcess {
  pageIndex: number;
  type: 'article' | 'multipleChoice' | 'audioSlide';
  slideIndex?: number;
  prompt: string;
}

export function useImageGeneration() {
  const [progress, setProgress] = useState<ImageGenerationProgress>({
    current: 0,
    total: 0,
    isGenerating: false,
    error: null,
  });

  const findItemsNeedingImages = useCallback((pages: LessonPage[]): ImageItemToProcess[] => {
    const itemsToProcess: ImageItemToProcess[] = [];

    pages.forEach((page, pageIndex) => {
      // Handle article pages
      if (page.type === 'article') {
        const text = page.content?.text || '';
        const hasImage = page.content?.imageUrl;
        const customPrompt = (page.content as any)?._imagePrompt;

        // Only process if no image and either has custom prompt or has text
        if (!hasImage && (customPrompt || text)) {
          itemsToProcess.push({
            pageIndex,
            type: 'article',
            prompt: customPrompt || text,
          });
        }
      }

      // Handle multipleChoice pages with custom image prompts
      if (page.type === 'multipleChoice') {
        const hasImage = page.content?.imageUrl;
        const customPrompt = (page.content as any)?._imagePrompt;

        // Only process if has custom prompt and no image
        if (!hasImage && customPrompt) {
          itemsToProcess.push({
            pageIndex,
            type: 'multipleChoice',
            prompt: customPrompt,
          });
        }
      }

      // Handle audioSlides: per-slide images
      if (page.type === 'audioSlides') {
        const slides = (page.content as any)?.slides || [];
        slides.forEach((slide: any, slideIndex: number) => {
          const hasImage = slide?.imageUrl;
          const customPrompt = slide?._imagePrompt;
          const english = slide?.english || '';
          if (!hasImage && (customPrompt || english)) {
            itemsToProcess.push({
              pageIndex,
              type: 'audioSlide',
              slideIndex,
              prompt: customPrompt || english,
            });
          }
        });
      }
    });

    return itemsToProcess;
  }, []);


  const generateMissingImages = useCallback(async (
    pages: LessonPage[],
    onUpdate: (updatedPages: LessonPage[]) => void
  ): Promise<{ success: boolean; message: string; successCount: number; errorCount: number }> => {
    const itemsToProcess = findItemsNeedingImages(pages);

    if (itemsToProcess.length === 0) {
      return { success: true, message: 'Nenhuma imagem precisa ser gerada', successCount: 0, errorCount: 0 };
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
        const imageUrl = await generateImageWithOpenAI(item.prompt);

        if (imageUrl) {
          const page = updatedPages[item.pageIndex];

          if (item.type === 'audioSlide' && typeof item.slideIndex === 'number') {
            const slides = [...(((page.content as any)?.slides) || [])];
            slides[item.slideIndex] = { ...slides[item.slideIndex], imageUrl };
            updatedPages[item.pageIndex] = {
              ...page,
              content: { ...page.content, slides },
            };
          } else {
            updatedPages[item.pageIndex] = {
              ...page,
              content: { ...page.content, imageUrl },
            };
          }

          successCount++;
        } else {
          errorCount++;
          console.warn(`Failed to generate image for: "${item.prompt.substring(0, 50)}..."`);
        }
      } catch (error) {
        errorCount++;
        console.error('Error generating image:', error);
      }

      // Longer delay for image generation to avoid rate limits (1500ms between calls)
      if (i < itemsToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    // Update parent with new pages
    onUpdate(updatedPages);

    setProgress(prev => ({ ...prev, isGenerating: false }));

    if (errorCount === 0) {
      return {
        success: true,
        message: `${successCount} imagem(ns) gerada(s) com sucesso!`,
        successCount,
        errorCount,
      };
    } else {
      return {
        success: false,
        message: `${successCount} gerada(s), ${errorCount} falha(s)`,
        successCount,
        errorCount,
      };
    }
  }, [findItemsNeedingImages]);

  const countItemsNeedingImages = useCallback((pages: LessonPage[]): number => {
    return findItemsNeedingImages(pages).length;
  }, [findItemsNeedingImages]);

  return {
    progress,
    generateMissingImages,
    countItemsNeedingImages,
    findItemsNeedingImages,
  };
}
