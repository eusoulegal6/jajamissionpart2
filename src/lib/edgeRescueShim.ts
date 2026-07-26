type Segment =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Segment[];
};

const SAFE_MODELS = new Set(['gpt-4.1', 'gpt-4.1-mini', 'gpt-5.2']);
const DEFAULT_MODEL = 'gpt-5.2';

function normalizeMessages(messages: any[]): ChatMessage[] {
  return (messages ?? []).map((m: any) => {
    let content = m?.content;

    // Accept { text: '...' }
    if (!content && typeof m?.text === 'string') content = [{ type: 'text', text: m.text }];

    // Plain string is fine
    if (typeof content === 'string') return { role: m.role, content };

    // Array of parts → normalize
    if (Array.isArray(content)) {
      content = content.map((part: any) => {
        if (typeof part === 'string') return { type: 'text', text: part };

        // Legacy Responses API → Chat Completions
        if (part?.type === 'input_text')  return { type: 'text', text: part.text ?? part.content ?? '' };
        if (part?.type === 'input_image') {
          const url = part?.image_url?.url || part?.image_url || part?.url;
          return { type: 'image_url', image_url: { url } };
        }

        // Already-valid
        if (part?.type === 'text')       return { type: 'text', text: part.text ?? '' };
        if (part?.type === 'image_url') {
          const u = typeof part.image_url === 'string' ? part.image_url : part.image_url?.url;
          return { type: 'image_url', image_url: { url: u } };
        }

        // Fallback: stringify unknown shapes
        const t = part?.text ?? part?.content ?? '';
        return { type: 'text', text: String(t) };
      });
    }

    // Object like { text: '...' }
    if (content && !Array.isArray(content) && typeof content === 'object' && 'text' in content) {
      content = [{ type: 'text', text: (content as any).text }];
    }

    return { role: m.role, content };
  });
}

// Flatten any message (or parts) to pure string for last-resort retry
function flattenToTextOnly(messages: any[]): { role: string; content: string }[] {
  const toStr = (c: any): string => {
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) {
      return c.map((p) => {
        if (typeof p === 'string') return p;
        if (p?.type === 'text') return p.text ?? '';
        if (p?.type === 'image_url') {
          const u = typeof p.image_url === 'string' ? p.image_url : p.image_url?.url;
          return u ? `[Image: ${u}]` : '[Image]';
        }
        if (p?.type === 'input_text')  return p.text ?? p.content ?? '';
        if (p?.type === 'input_image') {
          const u = p?.image_url?.url || p?.image_url || p?.url;
          return u ? `[Image: ${u}]` : '[Image]';
        }
        return String(p?.text ?? p?.content ?? '');
      }).join('\n');
    }
    if (c && typeof c === 'object' && 'text' in c) return c.text ?? '';
    return String(c ?? '');
  };

  return (messages ?? []).map((m: any) => ({
    role: m.role || 'user',
    content: toStr(m.content ?? m.text ?? '')
  }));
}

function parseBody(init?: RequestInit): any | null {
  if (!init?.body) return null;
  try { return JSON.parse(init.body as string); } catch { return null; }
}

async function invokeChatgpt(supabase: any, body: any) {
  // Use Supabase invoke so auth headers are handled for us
  return supabase.functions.invoke('chatgpt', { body });
}

/**
 * Intercept any fetch with { messages: [...] } body.
 * 1) normalize messages
 * 2) force model to safe set
 * 3) call supabase.functions.invoke('chatgpt')
 * 4) if Edge returns non-2xx (wrapped as error), retry once with text-only messages
 */
export function installEdgeRescueShim(supabase: any) {
  if (!supabase?.functions?.invoke) return;
  if ((window as any).__edgeRescueShimInstalled) return;

  const origFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const body = parseBody(init);
    const looksAI = body && Array.isArray(body.messages);

    if (!looksAI) {
      // Non-AI calls pass through
      return origFetch(input as any, init);
    }

    // Build normalized request
    let reqBody: any = { ...body };
    reqBody.model = SAFE_MODELS.has(body.model) ? body.model : DEFAULT_MODEL;
    if (Array.isArray(body.messages)) {
      reqBody.messages = normalizeMessages(body.messages);
    }

    // First try: invoke with normalized payload
    let { data, error } = await invokeChatgpt(supabase, reqBody);
    if (!error) {
      return new Response(JSON.stringify(data ?? {}), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    // If Edge wrapped OpenAI 4xx as 500, retry once with text-only fallback
    console.warn('[edgeRescue] First call failed, retrying with text-only messages. Details:', error);
    const fallbackBody = {
      ...reqBody,
      messages: flattenToTextOnly(reqBody.messages)
    };
    ({ data, error } = await invokeChatgpt(supabase, fallbackBody));

    if (error) {
      console.error('[edgeRescue] Fallback also failed:', error);
      return new Response(JSON.stringify({ error: String(error.message || error) }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data ?? {}), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  };

  (window as any).__edgeRescueShimInstalled = true;
}