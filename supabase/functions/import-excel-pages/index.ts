import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📊 Starting Excel data parsing...');
    
    const { excelData } = await req.json();
    
    if (!excelData || !Array.isArray(excelData)) {
      throw new Error('No Excel data provided or invalid format');
    }

    console.log('📋 Excel data received:', excelData.length, 'rows');
    console.log('First few rows:', excelData.slice(0, 3));

    // Use OpenAI to intelligently parse the structure
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const aiPrompt = `You are an expert at analyzing Excel data structures. I have Excel data where each row contains information for creating article pages. The data has text content, an image URL, and an audio URL.

Here is the raw data from the Excel file (${excelData.length} rows total):
${JSON.stringify(excelData, null, 2)}

Please analyze this data and return a JSON array where each object has:
- text: the article text content
- imageUrl: the URL to the image
- audioUrl: the URL to the audio file

Important:
1. Identify which column contains the text, which has the image URL, and which has the audio URL
2. Skip header rows if present
3. Only include rows that have all three pieces of data
4. Return ONLY valid JSON, no explanations

Return format:
[
  {
    "text": "article text here",
    "imageUrl": "https://...",
    "audioUrl": "https://..."
  }
]`;

    console.log('🤖 Calling OpenAI to parse structure...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are a data parsing assistant. Always return valid JSON arrays only, no markdown or explanations.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        max_completion_tokens: 16000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    console.log('✅ OpenAI response received');
    
    const parsedContent = aiResponse.choices[0].message.content;
    console.log('📝 Parsed content:', parsedContent);
    
    let pages;
    try {
      // Try to parse as direct JSON
      pages = JSON.parse(parsedContent);
      
      // If the response is wrapped in an object, extract the array
      if (pages && typeof pages === 'object' && !Array.isArray(pages)) {
        // Look for array properties
        const possibleArrayKeys = Object.keys(pages).filter(key => Array.isArray(pages[key]));
        if (possibleArrayKeys.length > 0) {
          pages = pages[possibleArrayKeys[0]];
        }
      }
    } catch (e) {
      console.error('❌ Failed to parse AI response as JSON:', e);
      throw new Error('Failed to parse AI response');
    }

    if (!Array.isArray(pages)) {
      console.error('❌ Parsed content is not an array:', typeof pages, pages);
      throw new Error('AI did not return a valid array');
    }

    console.log(`✅ Successfully parsed ${pages.length} pages`);

    return new Response(
      JSON.stringify({ pages }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Error in import-excel-pages:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
