
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert ArrayBuffer to base64 using a more efficient method that doesn't cause stack overflow
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192; // 8KB chunks for processing
  let binaryString = '';
  
  // Process in chunks to avoid stack overflow on large files
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binaryString += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  // Convert the complete binary string to base64 once
  return btoa(binaryString);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, voiceId } = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }

    // Validate text length to prevent excessively large audio files
    if (text.length > 5000) {
      throw new Error('Text is too long. Maximum 5000 characters allowed.');
    }

    console.log('Generating speech for text:', text.substring(0, 100) + '...');

    const elevenLabsApiKey = Deno.env.get('ELEVEN_API_KEY');
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Use ElevenLabs TTS API with the provided voice ID or default
    const selectedVoiceId = voiceId || 'aMSt68OGf4xUZAnLpTU8';
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsApiKey,
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
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('Audio generated successfully, size:', audioBuffer.byteLength);

    // Check if audio file is too large (>10MB)
    if (audioBuffer.byteLength > 10 * 1024 * 1024) {
      throw new Error('Generated audio file is too large. Please try with shorter text.');
    }

    // Convert to base64 using the fixed method
    const base64Audio = arrayBufferToBase64(audioBuffer);

    console.log('Base64 conversion completed, length:', base64Audio.length);

    return new Response(JSON.stringify({ audioContent: base64Audio }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in speak-elevenlabs function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
