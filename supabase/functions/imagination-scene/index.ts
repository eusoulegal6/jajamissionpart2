import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const GEMINI_TEXT_MODEL = "gemini-3.1-flash-lite";
const NANO_BANANA_IMAGE_MODEL = "gemini-3.1-flash-lite-image";

async function makeCreativePlanWithGemini({
  learnerIdea,
  question,
  setting,
  language,
  apiKey,
}: {
  learnerIdea: string;
  question: string;
  setting: string;
  language: "English" | "Spanish";
  apiKey: string;
}) {
  const schema = {
    type: "OBJECT",
    properties: {
      editPrompt: { type: "STRING" },
      feedback: { type: "STRING" },
    },
    required: ["editPrompt", "feedback"],
  };

  const systemInstruction = `You are the warm, playful guide of an image-creation language game. A student has seen an illustrated scene and answered an open question in ${language}. Interpret fragments and minor mistakes generously. Create editPrompt as one direct, concise instruction in English for an image editor: add the student's intended ideas naturally to the supplied scene. Preserve its composition, setting, characters already present, and illustration style. Do not remove existing elements, add text, alter canvas dimensions, or mention a reference image. Keep editPrompt under 40 words. feedback must be one short, cheerful sentence in ${language}, acknowledging the specific idea warmly without judging it as right or wrong. It may mention only what the student requested, never claim the image already contains it.`;

  const userContent = JSON.stringify({ question, setting, learnerIdea });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userContent }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 250,
          responseMimeType: "application/json",
          responseSchema: schema,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini creative plan error:", response.status, errorText);
    throw new Error("Could not create creative plan");
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("The creative guide returned no plan");

  const plan = JSON.parse(text) as { editPrompt?: string; feedback?: string };
  if (!plan.editPrompt || !plan.feedback) {
    throw new Error("The creative guide returned an incomplete plan");
  }

  return plan;
}

async function fetchImageAsBase64(imageUrl: string): Promise<{ mimeType: string; data: string }> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch source image: ${res.status}`);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await res.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  const base64 = btoa(binary);
  return {
    mimeType: contentType.includes("png") ? "image/png" : contentType.includes("webp") ? "image/webp" : "image/jpeg",
    data: base64,
  };
}

async function generateEditedImageWithNanoBanana({
  prompt,
  sourceImageUrl,
  apiKey,
}: {
  prompt: string;
  sourceImageUrl?: string;
  apiKey: string;
}): Promise<string> {
  const parts: Array<Record<string, unknown>> = [];

  if (sourceImageUrl && /^https?:\/\//i.test(sourceImageUrl)) {
    try {
      const sourceImage = await fetchImageAsBase64(sourceImageUrl);
      parts.push({
        inlineData: {
          mimeType: sourceImage.mimeType,
          data: sourceImage.data,
        },
      });
    } catch (err) {
      console.warn("Could not fetch source image, generating scene directly:", err);
    }
  }

  parts.push({
    text: `Edit this scene according to the following instruction in the same colorful storybook illustration style: ${prompt}`,
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${NANO_BANANA_IMAGE_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseModalities: ["image", "text"],
        },
      }),
    },
  );

  if (!response.ok) {
    const errorDetails = await response.text();
    console.error("Nano Banana 2 Lite error:", response.status, errorDetails);
    throw new Error(`Nano Banana 2 Lite generation failed: ${response.status}`);
  }

  const payload = await response.json();
  const returnedParts = payload?.candidates?.[0]?.content?.parts || [];
  const imagePart = returnedParts.find((p: Record<string, unknown>) => p.inlineData);

  if (!imagePart || !imagePart.inlineData?.data) {
    console.error("No image part in Nano Banana response:", JSON.stringify(payload).slice(0, 500));
    throw new Error("No image generated by Nano Banana 2 Lite");
  }

  const mimeType = imagePart.inlineData.mimeType || "image/jpeg";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await request.json();
    const learnerIdea = String(body.learnerIdea || "").trim().slice(0, 180);
    const question = String(body.question || "").trim().slice(0, 500);
    const setting = String(body.setting || "").trim().slice(0, 220);
    const sourceImageUrl = String(body.sourceImageUrl || "").trim();
    const language = body.language === "es" ? "Spanish" : "English";

    if (!learnerIdea || !question || !setting) {
      return json({ error: "An idea and scene details are required" }, 400);
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("gemini_api_key") || Deno.env.get("GOOGLE_API_KEY");
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured in Supabase secrets");
      return json({ error: "Gemini API key is not configured" }, 500);
    }

    // Step 1: Gemini 3.1 Flash Lite plans the edit prompt and creates warm feedback
    const plan = await makeCreativePlanWithGemini({
      learnerIdea,
      question,
      setting,
      language,
      apiKey,
    });

    // Step 2: Nano Banana 2 Lite edits the image seamlessly
    const imageUrl = await generateEditedImageWithNanoBanana({
      prompt: plan.editPrompt,
      sourceImageUrl,
      apiKey,
    });

    return json({ imageUrl, feedback: plan.feedback });
  } catch (error) {
    console.error("imagination-scene error:", error instanceof Error ? error.message : "Unexpected error");
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
