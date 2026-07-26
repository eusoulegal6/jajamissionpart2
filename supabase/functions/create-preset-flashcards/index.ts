import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WordData {
  word: string;
  translation?: string;
}

interface CategoryData {
  name: string;
  description?: string;
  words: WordData[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { categories }: { categories: CategoryData[] } = await req.json();

    if (!categories || !Array.isArray(categories)) {
      throw new Error('Categories array is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = [];

    for (const category of categories) {
      console.log(`Processing category: ${category.name}`);
      
      // Create category
      const { data: categoryData, error: categoryError } = await supabase
        .from('preset_flashcard_categories')
        .upsert({
          name: category.name,
          description: category.description || null,
          order_index: results.length
        }, {
          onConflict: 'name'
        })
        .select()
        .single();

      if (categoryError) {
        console.error(`Error creating category ${category.name}:`, categoryError);
        throw categoryError;
      }

      const flashcards = [];

      for (let i = 0; i < category.words.length; i++) {
        const wordData = category.words[i];
        const word = wordData.word.trim();
        
        console.log(`Processing word ${i + 1}/${category.words.length}: ${word}`);

        try {
          let translation = wordData.translation;
          
          // If translation not provided, get it from the translate-word function
          if (!translation) {
            const { data: translateData, error: translateError } = await supabase.functions.invoke("translate-word", {
              body: { word: word, language: "en" },
            });
            
            if (translateError) {
              console.error(`Translation error for word ${word}:`, translateError);
              continue;
            }
            
            translation = translateData.translation;
          }

          // Generate audio using speak-elevenlabs function
          const { data: audioData, error: audioError } = await supabase.functions.invoke("speak-elevenlabs", {
            body: { text: word },
          });
          
          if (audioError) {
            console.error(`Audio generation error for word ${word}:`, audioError);
            continue;
          }

          // Convert base64 to blob and upload to storage
          const binaryString = atob(audioData.audioContent);
          const bytes = new Uint8Array(binaryString.length);
          for (let j = 0; j < binaryString.length; j++) {
            bytes[j] = binaryString.charCodeAt(j);
          }
          const audioBlob = new Blob([bytes], { type: 'audio/mp3' });

          // Upload to storage with a systematic name
          const fileName = `preset/${category.name.toLowerCase().replace(/[^a-z0-9]/gi, '_')}/${word.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.mp3`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('flashcard-audio')
            .upload(fileName, audioBlob, {
              contentType: 'audio/mp3',
              upsert: false
            });

          if (uploadError) {
            console.error(`Upload error for word ${word}:`, uploadError);
            continue;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('flashcard-audio')
            .getPublicUrl(fileName);

          // Create flashcard record
          flashcards.push({
            category_id: categoryData.id,
            front_text: word,
            back_text: translation,
            audio_url: publicUrl,
            order_index: i
          });

        } catch (wordError) {
          console.error(`Error processing word ${word}:`, wordError);
          continue;
        }
      }

      // Bulk insert flashcards for this category
      if (flashcards.length > 0) {
        const { error: flashcardsError } = await supabase
          .from('preset_flashcards')
          .insert(flashcards);

        if (flashcardsError) {
          console.error(`Error inserting flashcards for category ${category.name}:`, flashcardsError);
          throw flashcardsError;
        }
      }

      results.push({
        category: category.name,
        flashcards_created: flashcards.length,
        total_words: category.words.length
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Preset flashcards created successfully',
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-preset-flashcards function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});