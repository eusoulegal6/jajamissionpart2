import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-gen-key',
};

const GEN_GATE_FALLBACK = "x8Qa2Lm9Vt4Rp7Zs3Wn6Yb1Hk5Jd0Cf";
const MODEL = "google/gemini-3.1-flash-image";

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Image generation is temporarily disabled to prevent accidental usage.
  return new Response(JSON.stringify({ error: 'Image generation is currently disabled' }), {
    status: 503,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });


  try {
    const provided = req.headers.get('x-gen-key') || req.headers.get('X-Gen-Key') || '';
    const expected = Deno.env.get('GEN_GATE_KEY') || GEN_GATE_FALLBACK;
    if (!provided || !constantTimeEqual(provided, expected)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY is not configured');

    console.log(`Generating image via Lovable AI Gateway (${MODEL}):`, prompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorData);
      if (response.status === 429) throw new Error('Rate limit exceeded. Please try again later.');
      if (response.status === 402) throw new Error('AI credits exhausted. Please add credits to your workspace.');
      throw new Error(`Image generation failed: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      console.error('Unexpected gateway response:', JSON.stringify(data));
      throw new Error('No image data returned from gateway');
    }

    const binaryString = atob(b64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const imageBlob = new Blob([bytes], { type: 'image/png' });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const filename = `generated-${Date.now()}.png`;
    const filePath = `generated-images/${filename}`;
    const { error: uploadError } = await supabase.storage
      .from('lesson_images')
      .upload(filePath, imageBlob, { cacheControl: '3600', upsert: false, contentType: 'image/png' });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from('lesson_images').getPublicUrl(filePath);

    return new Response(JSON.stringify({ imageUrl: urlData.publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-image function:', error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
