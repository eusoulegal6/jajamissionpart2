import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ALWAYS return JSON (even for strings)
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, model = "gpt-5.4" } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      return jsonResponse({ error: 'OpenAI API key not configured' }, 500);
    }

    console.log('ChatGPT function called with model:', model);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return jsonResponse({ error: `OpenAI API error: ${response.status}` }, 500);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "No response generated";

    // Parse the response content if it looks like JSON, otherwise keep as string
    let out;
    try {
      out = { reply: JSON.parse(reply) };
    } catch {
      out = { reply };
    }

    console.log('ChatGPT response successful');

    // content can be a JSON string or normal text.
    // We already parsed to `out` above if it looked like JSON; otherwise it's a plain string.
    return jsonResponse(out, 200);

  } catch (error) {
    console.error('Error in chatgpt function:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});
