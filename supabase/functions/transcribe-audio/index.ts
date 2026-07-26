import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.20.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const language = formData.get('language') as string | null; // 'en' or 'es'
    const mode = formData.get('mode') as string | null; // e.g., 'specialist'
    
    if (!file) {
      throw new Error('No audio file provided.');
    }
    
    console.log('transcribe-audio function called with:', { language, mode, fileName: file.name, fileSize: file.size });

    // Base options for OpenAI transcription
    const transcriptionOptions: OpenAI.Audio.TranscriptionCreateParams = {
        model: 'whisper-1',
        file: file,
    };

    // If mode is 'specialist' or 'tradutor', we don't specify a language to allow auto-detection.
    // Otherwise, we force the language based on the user's learning language.
    if (mode !== 'specialist' && mode !== 'tradutor') {
      // Determine transcription language. Default to 'en' if not specified or not 'es'.
      const targetLanguage = language === 'es' ? 'es' : 'en';
      transcriptionOptions.language = targetLanguage;
      console.log('Sending to OpenAI Whisper with forced language:', targetLanguage);
    } else {
      console.log('Sending to OpenAI Whisper with auto-detected language (specialist/tradutor mode).');
    }

    const transcription = await openai.audio.transcriptions.create(transcriptionOptions);

    console.log('Transcription successful:', transcription.text);

    return new Response(JSON.stringify({ text: transcription.text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in transcribe-audio function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
