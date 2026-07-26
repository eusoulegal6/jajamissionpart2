import { toast } from "@/hooks/use-toast";

// Local Supabase edge function for image generation using OpenAI gpt-image-1.5
const IMAGE_GENERATION_ENDPOINT = 'https://mcuquzgpaeoqskesgcnx.supabase.co/functions/v1/generate-image';

// NOTE: This service intentionally does NOT send the X-Gen-Key header.
// The chat/doubt path uses this service and must remain blocked for students.
// Authoring UIs (lesson creator dialogs) call the edge function directly with the key.
export async function generateImage(prompt: string, _appId: string = 'app-general'): Promise<string | null> {
  try {
    toast({
      title: "Generating your image",
      description: "This might take a moment...",
    });

    const response = await fetch(IMAGE_GENERATION_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.imageUrl || data.url;
    if (!imageUrl) throw new Error("Missing imageUrl in response");
    return imageUrl;
  } catch (error) {
    console.error("Failed to generate image:", error);
    toast({
      title: "Image Generation Failed",
      description: error instanceof Error ? error.message : "We couldn't generate your image. Please try again.",
      variant: "destructive",
    });
    return null;
  }
}
