import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const jsonResponse = (body: unknown, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { word, language = "en" } = await req.json()
    
    if (!word) {
      return jsonResponse({ error: 'Word is required' }, 400)
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return jsonResponse({ error: 'OpenAI API key not configured' }, 500)
    }

    const targetLanguage = language === "es" ? "spanish" : "english"
    const prompt = `Translate the ${targetLanguage} word "${word}" to Portuguese. 
    Provide multiple translation options separated by " / " if the word has different meanings or translations.
    Return only the Portuguese translations separated by " / ", no explanations or additional text.
    Example: "fósforo / encaixar / partida" for the word "matches".`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5.4-nano',
        messages: [
          { 
            role: 'system', 
            content: 'You are a translation assistant. Provide accurate, concise translations.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 50,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      return jsonResponse({ error: 'Translation service error' }, 500)
    }

    const data = await response.json()
    const translation = data.choices[0]?.message?.content?.trim()

    if (!translation) {
      return jsonResponse({ error: 'No translation received' }, 500)
    }

    return jsonResponse({ translation })

  } catch (error) {
    console.error('Translation error:', error)
    return jsonResponse({ error: 'An unexpected error occurred' }, 500)
  }
})