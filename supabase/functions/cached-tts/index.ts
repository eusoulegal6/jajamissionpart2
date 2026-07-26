// supabase/functions/cached-tts/index.ts
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// These environment variables are automatically available in Supabase functions.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Bucket where lesson audios are stored. This must be created as a PUBLIC bucket.
const BUCKET_NAME = "lesson_audio";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * generateTtsAudio - Uses ElevenLabs API (same as speak-elevenlabs function)
 * Returns audio as Uint8Array
 */
async function generateTtsAudio(text: string): Promise<Uint8Array> {
  const elevenLabsApiKey = Deno.env.get("ELEVEN_API_KEY");
  
  if (!elevenLabsApiKey) {
    throw new Error("ELEVEN_API_KEY is not configured");
  }

  // Use eleven_v3 model with custom voice
  const voiceId = "aMSt68OGf4xUZAnLpTU8";

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_v3",
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

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const text = (body?.text ?? "").toString().trim();

    if (!text) {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const slug = slugify(text);
    const filePath = `vocabulary/${slug}.mp3`;

    let fromCache = false;

    console.log("[cached-tts] Incoming text:", text);
    console.log("[cached-tts] Slug/filePath:", slug, filePath);

    // 1) Check if file already exists in storage
    const { data: existingFile, error: existingError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);

    if (!existingError && existingFile) {
      // File exists → just return its public URL (no new TTS generation)
      fromCache = true;
    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    // Add cache-busting parameter to force CDN to serve fresh content
    const cacheBuster = `?v=${Date.now()}`;
    const publicUrlWithCacheBuster = publicData.publicUrl + cacheBuster;

    console.log("[cached-tts] CACHE HIT for:", filePath);

    return new Response(
      JSON.stringify({
        publicUrl: publicUrlWithCacheBuster,
        fromCache,
      }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("[cached-tts] CACHE MISS, generating audio for:", filePath);

    // 2) File does NOT exist → generate audio ONCE and upload
    const audioBytes = await generateTtsAudio(text);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, audioBytes, {
        contentType: "audio/mpeg",
        cacheControl: "31536000",
        upsert: false, // never overwrite once created
      });

    if (uploadError) {
      // If upload fails because file already exists (race condition), just get the URL
      if (uploadError.message?.includes("already exists") || uploadError.message?.includes("Duplicate")) {
        console.log("[cached-tts] File was created by another request, returning existing URL");
        fromCache = true;
        const { data: publicData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        const cacheBuster = `?v=${Date.now()}`;
        return new Response(
          JSON.stringify({
            publicUrl: publicData.publicUrl + cacheBuster,
            fromCache,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      console.error("[cached-tts] Upload error:", uploadError);
      throw uploadError;
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    // Add cache-busting parameter to force CDN to serve fresh content
    const cacheBuster = `?v=${Date.now()}`;
    const publicUrlWithCacheBuster = publicData.publicUrl + cacheBuster;

    fromCache = false;

    console.log("[cached-tts] GENERATED + UPLOADED audio for:", filePath);

    return new Response(
      JSON.stringify({
        publicUrl: publicUrlWithCacheBuster,
        fromCache,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("[cached-tts] error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal error in cached-tts",
        details: `${err}`,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
