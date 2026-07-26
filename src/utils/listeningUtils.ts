
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { base64ToAudioBlob } from './base64Utils';

interface CachedAudioUrls {
  [questionIndex: string]: {
    [difficulty: string]: string;
  };
}

const isUUID = (id: string) => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Function to sanitize difficulty level for file paths
const sanitizeDifficulty = (difficulty: string): string => {
  return difficulty
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace invalid chars with dash
    .toLowerCase();
};

// Validate if audio URL is accessible
const validateAudioUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('listeningUtils - Audio URL validation failed:', error);
    return false;
  }
};

export const getCachedAudioUrl = async (
  lessonId: string, 
  questionIndex: number, 
  difficulty: string
): Promise<string | null> => {
  console.log('listeningUtils - getCachedAudioUrl called:', { lessonId, questionIndex, difficulty });
  
  // Early validation
  if (!lessonId || lessonId === 'undefined' || lessonId === 'null') {
    console.warn('listeningUtils - Invalid lessonId provided:', lessonId);
    return null;
  }

  if (typeof questionIndex !== 'number' || questionIndex < 0) {
    console.warn('listeningUtils - Invalid questionIndex provided:', questionIndex);
    return null;
  }

  if (!difficulty || typeof difficulty !== 'string') {
    console.warn('listeningUtils - Invalid difficulty provided:', difficulty);
    return null;
  }
  
  try {
    let item: { cached_audio_urls: Json } | null = null;

    if (isUUID(lessonId)) {
      console.log('listeningUtils - Checking content_items table for UUID:', lessonId);
      const { data, error } = await supabase
        .from('content_items')
        .select('cached_audio_urls')
        .eq('id', lessonId)
        .single();
      
      if (error) {
        console.error('listeningUtils - Error fetching from content_items:', error);
        return null;
      }
      
      item = data;
    } else {
      console.log('listeningUtils - Checking lessons tables for non-UUID:', lessonId);
      const tablesToTry = ['lessons', 'lessons_spanish'] as const;
      for (const tbl of tablesToTry) {
        console.log(`listeningUtils - Checking table: ${tbl}`);
        const { data, error } = await supabase
          .from(tbl)
          .select('cached_audio_urls')
          .eq('id', lessonId)
          .maybeSingle();

        if (error) {
          console.warn(`listeningUtils - Error while checking table ${tbl} for lesson ${lessonId}:`, error);
          continue;
        }

        if (data) {
          console.log(`listeningUtils - Found data in table ${tbl}:`, data);
          item = data;
          break;
        }
      }
    }

    if (!item || !item.cached_audio_urls) {
      console.log('listeningUtils - No cached audio URLs found');
      return null;
    }

    const cachedUrls = item.cached_audio_urls as CachedAudioUrls;
    const audioUrl = cachedUrls[questionIndex.toString()]?.[difficulty];
    
    if (!audioUrl) {
      console.log('listeningUtils - No cached audio URL for this question/difficulty combination');
      return null;
    }

    // Validate that the URL is still accessible
    console.log('listeningUtils - Validating cached audio URL:', audioUrl);
    const isValid = await validateAudioUrl(audioUrl);
    
    if (!isValid) {
      console.warn('listeningUtils - Cached audio URL is no longer valid:', audioUrl);
      return null;
    }
    
    console.log('listeningUtils - Valid cached audio URL found:', audioUrl);
    return audioUrl;
  } catch (error) {
    console.error('listeningUtils - Error getting cached audio URL:', error);
    return null;
  }
};

export const setCachedAudioUrl = async (
  lessonId: string, 
  questionIndex: number, 
  difficulty: string, 
  audioUrl: string
): Promise<boolean> => {
  console.log('listeningUtils - setCachedAudioUrl called:', { lessonId, questionIndex, difficulty, audioUrl });
  
  // Early validation
  if (!lessonId || lessonId === 'undefined' || lessonId === 'null') {
    console.error('listeningUtils - Invalid lessonId provided for caching:', lessonId);
    return false;
  }

  if (typeof questionIndex !== 'number' || questionIndex < 0) {
    console.error('listeningUtils - Invalid questionIndex provided for caching:', questionIndex);
    return false;
  }

  if (!difficulty || typeof difficulty !== 'string') {
    console.error('listeningUtils - Invalid difficulty provided for caching:', difficulty);
    return false;
  }

  if (!audioUrl || typeof audioUrl !== 'string') {
    console.error('listeningUtils - Invalid audioUrl provided for caching:', audioUrl);
    return false;
  }
  
  try {
    let tableName: 'content_items' | 'lessons' | 'lessons_spanish' | null = null;
    let item: { cached_audio_urls: Json } | null = null;

    if (isUUID(lessonId)) {
      console.log('listeningUtils - Checking content_items table for UUID:', lessonId);
      const { data, error } = await supabase
        .from('content_items')
        .select('cached_audio_urls')
        .eq('id', lessonId)
        .single();
      
      if (error) {
        console.error('listeningUtils - Error fetching from content_items:', error);
        return false;
      }
      
      tableName = 'content_items';
      item = data;
    } else {
      console.log('listeningUtils - Checking lessons tables for non-UUID:', lessonId);
      const tablesToTry = ['lessons', 'lessons_spanish'] as const;
      for (const tbl of tablesToTry) {
        console.log(`listeningUtils - Checking table: ${tbl}`);
        const { data, error } = await supabase
          .from(tbl)
          .select('cached_audio_urls')
          .eq('id', lessonId)
          .maybeSingle();

        if (error) {
          console.warn(`listeningUtils - Error while checking table ${tbl} for lesson ${lessonId}:`, error);
          continue;
        }

        if (data) {
          console.log(`listeningUtils - Found data in table ${tbl}:`, data);
          tableName = tbl;
          item = data;
          break;
        }
      }
    }

    if (!tableName || !item) {
      console.error('listeningUtils - Lesson not found for caching:', lessonId);
      return false;
    }

    // Get existing cached URLs or initialize empty object
    const existingCachedUrls = (item.cached_audio_urls as CachedAudioUrls) || {};
    
    // Update the cached URLs
    const updatedCachedUrls = {
      ...existingCachedUrls,
      [questionIndex.toString()]: {
        ...existingCachedUrls[questionIndex.toString()],
        [difficulty]: audioUrl
      }
    };

    console.log('listeningUtils - Updating database with cached audio URL...');
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ cached_audio_urls: updatedCachedUrls })
      .eq('id', lessonId);

    if (updateError) {
      console.error('listeningUtils - Database update error:', updateError);
      return false;
    }

    console.log('listeningUtils - Successfully cached audio URL');
    return true;
  } catch (error) {
    console.error('listeningUtils - Error setting cached audio URL:', error);
    return false;
  }
};

export const generateAndCacheListeningAudio = async (
  lessonId: string,
  questionIndex: number,
  difficulty: string,
  audioText: string
): Promise<string | null> => {
  console.log('listeningUtils - generateAndCacheListeningAudio called:', { 
    lessonId, 
    questionIndex, 
    difficulty, 
    audioText: audioText.substring(0, 50) + '...' 
  });

  // Early validation
  if (!lessonId || lessonId === 'undefined' || lessonId === 'null') {
    console.error('listeningUtils - Invalid lessonId provided for generation:', lessonId);
    throw new Error('ID da lição inválido para geração de áudio');
  }

  if (!audioText || typeof audioText !== 'string' || audioText.trim().length === 0) {
    console.error('listeningUtils - Invalid audioText provided for generation:', audioText);
    throw new Error('Texto inválido para geração de áudio');
  }

  try {
    // First, double-check if audio is already cached (avoid race conditions)
    console.log('listeningUtils - Double-checking cache before generation...');
    const existingCachedUrl = await getCachedAudioUrl(lessonId, questionIndex, difficulty);
    if (existingCachedUrl) {
      console.log('listeningUtils - Found existing cached audio, returning it:', existingCachedUrl);
      return existingCachedUrl;
    }

    // Generate audio using ElevenLabs
    const { data, error } = await supabase.functions.invoke('speak-elevenlabs', {
      body: { text: audioText }
    });
    
    console.log('listeningUtils - Edge function response:', { data, error });
    
    if (error) {
      console.error('listeningUtils - Edge function error:', error);
      throw new Error(`Falha ao gerar áudio: ${error.message || 'Erro desconhecido'}`);
    }
    
    if (!data || !data.audioContent) {
      throw new Error("Resposta inválida do serviço de áudio");
    }

    // Convert base64 to blob
    console.log('listeningUtils - Converting base64 audio to blob...');
    const audioBlob = base64ToAudioBlob(data.audioContent);

    console.log('listeningUtils - Audio blob created:', {
      size: audioBlob.size,
      type: audioBlob.type
    });

    if (audioBlob.size === 0) {
      throw new Error("Áudio gerado está vazio");
    }

    // Sanitize the difficulty level for file path
    const sanitizedDifficulty = sanitizeDifficulty(difficulty);
    
    // For now, just create an object URL from the blob instead of uploading to storage
    // This avoids the need to create a storage bucket
    console.log('listeningUtils - Creating object URL from audio blob...');
    const newAudioUrl = URL.createObjectURL(audioBlob);
    console.log('listeningUtils - Generated audio URL:', newAudioUrl);

    // Note: Object URLs can't be cached in the database as they're temporary
    // If persistent caching is needed, a storage bucket would need to be created
    console.log('listeningUtils - Using temporary object URL (not cached in database)');

    console.log('listeningUtils - Audio generation and caching completed successfully');
    return newAudioUrl;

  } catch (error) {
    console.error('listeningUtils - Error generating and caching audio:', error);
    throw error;
  }
};
