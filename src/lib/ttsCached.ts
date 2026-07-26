import { supabase } from "@/integrations/supabase/client";

/**
 * Returns a URL pointing to an mp3 for the given text.
 * This uses a backend function that caches the audio in Supabase Storage.
 */
export async function getCachedTtsUrl(text: string): Promise<string | null> {
  const trimmed = text?.trim();
  if (!trimmed) return null;

  try {
    const { data, error } = await supabase.functions.invoke("cached-tts", {
      body: { text: trimmed },
    });

    if (error) {
      console.error("Error invoking cached-tts:", error);
      return null;
    }

    const anyData = data as any;
    return anyData?.publicUrl ?? null;
  } catch (err) {
    console.error("Exception calling cached-tts:", err);
    throw err; // Re-throw so the UI can catch and display it
  }
}
