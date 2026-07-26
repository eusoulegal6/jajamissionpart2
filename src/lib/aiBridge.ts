import { supabase } from "@/integrations/supabase/client";

export type Segment =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Segment[];
};

const DEFAULT_MODEL = 'gpt-5.4';

function normalizeMessages(messages: any[]): ChatMessage[] {
  return messages.map((m: any) => {
    let content = m?.content;

    // If content is a plain string, Chat Completions accepts it.
    if (typeof content === 'string') {
      return { role: m.role, content };
    }

    // If code was using m.text instead of content
    if (!content && typeof m?.text === 'string') {
      content = [{ type: 'text', text: m.text }];
    }

    // Normalize array content
    if (Array.isArray(content)) {
      content = content.map((part: any) => {
        // Strings inside arrays → text segments
        if (typeof part === 'string') return { type: 'text', text: part };

        // Legacy Responses API shapes → Chat Completions shapes
        if (part?.type === 'input_text') {
          return { type: 'text', text: part.text ?? part.content ?? '' };
        }
        if (part?.type === 'input_image') {
          const url = part?.image_url?.url || part?.image_url || part?.url;
          return { type: 'image_url', image_url: { url } };
        }

        // Proper shapes
        if (part?.type === 'text') {
          return { type: 'text', text: part.text ?? '' };
        }
        if (part?.type === 'image_url') {
          const url =
            typeof part.image_url === 'string'
              ? part.image_url
              : part.image_url?.url;
          return { type: 'image_url', image_url: { url } };
        }

        // Fallback: stringify whatever it is
        return { type: 'text', text: String(part?.text ?? part?.content ?? '') };
      });
    }

    // If content is an object like { text: '...' }
    if (content && !Array.isArray(content) && typeof content === 'object' && 'text' in content) {
      content = [{ type: 'text', text: (content as any).text }];
    }

    return { role: m.role, content };
  });
}

export async function callAI({
  messages,
  model = DEFAULT_MODEL,
}: {
  messages: any[];
  model?: string;
}): Promise<any> {
  const normalized = normalizeMessages(messages);

  console.log('[callAI] Invoking chatgpt edge function with model:', model);

  const { data, error } = await supabase.functions.invoke('chatgpt', {
    body: { messages: normalized, model }
  });

  if (error) {
    console.error('[callAI] Edge function error:', error);
    throw new Error(`Edge function error: ${error.message || error}`);
  }

  const reply = data?.reply;
  try { return typeof reply === 'string' ? JSON.parse(reply) : reply; }
  catch { return reply; }
}