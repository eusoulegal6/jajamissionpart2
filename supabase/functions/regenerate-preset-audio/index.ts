import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binaryString = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binaryString += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binaryString);
}

// Generate audio using ElevenLabs API directly
async function generateAudio(text: string, apiKey: string): Promise<ArrayBuffer> {
  const voiceId = 'aMSt68OGf4xUZAnLpTU8';
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_v3',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
  }

  return response.arrayBuffer();
}

// Normalize text to remove accents and special characters
function normalizeText(text: string): string {
  return text
    .normalize('NFD')                    // Decompose accents
    .replace(/[\u0300-\u036f]/g, '')     // Remove accent marks
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')        // Remove other special chars
    .replace(/\s+/g, '-')                // Replace spaces with hyphens
    .replace(/-+/g, '-')                 // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');              // Remove leading/trailing hyphens
}

// Create slug from text for file naming
function createSlug(text: string): string {
  return normalizeText(text).substring(0, 50);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { limit = 10, offset = 0 } = await req.json().catch(() => ({}));
    
    console.log(`[regenerate-preset-audio] Starting regeneration with limit=${limit}, offset=${offset}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const elevenLabsApiKey = Deno.env.get('ELEVEN_API_KEY');

    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch flashcards with their category names
    const { data: flashcards, error: fetchError } = await supabase
      .from('preset_flashcards')
      .select(`
        id,
        front_text,
        audio_url,
        category_id,
        preset_flashcard_categories!inner(name)
      `)
      .order('id')
      .range(offset, offset + limit - 1);

    if (fetchError) {
      throw new Error(`Failed to fetch flashcards: ${fetchError.message}`);
    }

    if (!flashcards || flashcards.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No more flashcards to process',
        processed: 0,
        nextOffset: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[regenerate-preset-audio] Found ${flashcards.length} flashcards to process`);

    const results: { id: string; status: string; error?: string }[] = [];
    
    for (const flashcard of flashcards) {
      try {
        const categoryName = (flashcard.preset_flashcard_categories as any)?.name || 'unknown';
        const categorySlug = normalizeText(categoryName); // Properly handle accented characters
        const slug = createSlug(flashcard.front_text);
        const timestamp = Date.now();
        const newFilePath = `preset/${categorySlug}/${slug}_${timestamp}.mp3`;

        console.log(`[regenerate-preset-audio] Processing: "${flashcard.front_text}" -> ${newFilePath}`);

        // Generate new audio
        const audioBuffer = await generateAudio(flashcard.front_text, elevenLabsApiKey);
        console.log(`[regenerate-preset-audio] Generated audio, size: ${audioBuffer.byteLength} bytes`);

        // Upload new audio to storage
        const { error: uploadError } = await supabase.storage
          .from('flashcard-audio')
          .upload(newFilePath, audioBuffer, {
            contentType: 'audio/mpeg',
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get public URL with cache-busting query parameter
        const { data: urlData } = supabase.storage
          .from('flashcard-audio')
          .getPublicUrl(newFilePath);

        const newAudioUrl = `${urlData.publicUrl}?v=${timestamp}`;

        // Delete old audio file if exists and is different
        if (flashcard.audio_url && flashcard.audio_url !== newAudioUrl) {
          try {
            const oldPath = flashcard.audio_url.split('/flashcard-audio/')[1];
            if (oldPath) {
              await supabase.storage.from('flashcard-audio').remove([oldPath]);
              console.log(`[regenerate-preset-audio] Deleted old file: ${oldPath}`);
            }
          } catch (deleteErr) {
            console.warn(`[regenerate-preset-audio] Could not delete old file: ${deleteErr}`);
          }
        }

        // Update database with new URL
        const { error: updateError } = await supabase
          .from('preset_flashcards')
          .update({ audio_url: newAudioUrl, updated_at: new Date().toISOString() })
          .eq('id', flashcard.id);

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        results.push({ id: flashcard.id, status: 'success' });
        console.log(`[regenerate-preset-audio] ✓ Completed: "${flashcard.front_text}"`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[regenerate-preset-audio] ✗ Failed for "${flashcard.front_text}": ${errorMessage}`);
        results.push({ id: flashcard.id, status: 'error', error: errorMessage });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const nextOffset = flashcards.length === limit ? offset + limit : null;

    console.log(`[regenerate-preset-audio] Batch complete: ${successCount} success, ${errorCount} errors`);

    return new Response(JSON.stringify({ 
      message: `Processed ${flashcards.length} flashcards`,
      processed: flashcards.length,
      success: successCount,
      errors: errorCount,
      nextOffset,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[regenerate-preset-audio] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
