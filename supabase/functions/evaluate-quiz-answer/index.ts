import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userAnswer, lessonId, timestampSeconds, question, correctAnswers } = await req.json();

    if (!userAnswer) {
      throw new Error('Missing required parameter: userAnswer');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    let questionData, correctAnswersData;

    // If question and correctAnswers are provided directly, use them
    if (question && correctAnswers) {
      questionData = { question, correct_answers: correctAnswers };
    } else if (lessonId && timestampSeconds !== undefined) {
      // Fallback: try to get from database if lesson ID and timestamp are provided
      const { data: dbQuestion, error: questionError } = await supabase
        .from('video_quiz_questions')
        .select('question, correct_answers')
        .eq('lesson_id', lessonId)
        .eq('timestamp_seconds', timestampSeconds)
        .single();

      if (questionError || !dbQuestion) {
        console.error('Error fetching question:', questionError);
        throw new Error('Question not found and no question data provided');
      }
      questionData = dbQuestion;
    } else {
      throw new Error('Either provide question/correctAnswers directly or lessonId/timestampSeconds for database lookup');
    }

    // Use OpenAI to evaluate the answer
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const correctAnswersArray = questionData.correct_answers as string[];
    const systemPrompt = `You are evaluating a student's answer to a quiz question. Be fair and encouraging.
    
Question: ${questionData.question}
Correct answers: ${correctAnswersArray.join(', ')}
Student's answer: ${userAnswer}

Mark the answer as CORRECT if the student demonstrates understanding, even with minor issues. Accept answers with:
- Minor spelling or grammar mistakes
- Different word order but same meaning
- Synonyms or alternative expressions
- Incomplete but captures the main concept
- Simpler or more casual language

CRITICAL — NEVER correct or penalize:
- Punctuation (commas, periods, question marks, apostrophes, quotes, etc.)
- Capitalization / uppercase / lowercase (letras maiúsculas e minúsculas)
Ignore these completely when scoring and never mention them in feedback. They must NOT lower the confidence score.


Only mark as INCORRECT if:
- Clearly wrong or contradicts the correct answer
- Fundamentally misunderstands the concept
- Completely unrelated to the question

IMPORTANT - Confidence scoring:
- 1.0: Perfect answer, exactly matches expected response
- 0.85-0.95: Very good answer with minor imperfections
- 0.7-0.85: Good answer showing clear understanding but with some issues
- 0.6-0.7: Acceptable answer with partial understanding
- Below 0.6: Mark as incorrect

Return a JSON response with:
- "correct": boolean (true if shows understanding)
- "feedback": string (brief, encouraging feedback if correct; empty if incorrect)
- "confidence": number (0-1, reflecting answer quality as described above)

Be generous with marking correct, but reflect quality accurately in the confidence score.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Evaluate this answer: "${userAnswer}"` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error('Failed to evaluate answer');
    }

    const aiResponse = await response.json();
    const evaluation = JSON.parse(aiResponse.choices[0].message.content);

    console.log('Answer evaluation:', {
      userAnswer,
      question: questionData.question,
      correctAnswers: correctAnswersArray,
      evaluation
    });

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in evaluate-quiz-answer function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      correct: false,
      feedback: "Sorry, there was an error evaluating your answer. Please try again.",
      confidence: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});