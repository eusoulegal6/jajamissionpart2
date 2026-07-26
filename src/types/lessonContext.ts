export type LessonPageContext = {
  lessonId: string;
  lessonTitle?: string;

  pageId: string;
  pageIndex: number;
  pageType: string;

  pageTitle?: string;
  pageText?: string;

  questions?: {
    id: string;
    label?: string;
    text: string;
  }[];

  focusedQuestionId?: string | null;
  imageUrl?: string | null;
};

export function buildLessonPageContext(
  lesson: any[],
  currentPage: any,
  currentPageIndex: number,
  lessonId?: string,
  lessonTitle?: string,
  focusedQuestionIndex?: number
): LessonPageContext {
  console.log('🔍 buildLessonPageContext called with:', {
    currentPageIndex,
    pageType: currentPage?.type,
    focusedQuestionIndex,
    currentPage: JSON.stringify(currentPage, null, 2)
  });

  const pageType = currentPage?.type || 'unknown';
  const questions: { id: string; label?: string; text: string }[] = [];
  let focusedQuestionId: string | null = null;
  let pageText = '';
  let pageTitle = currentPage?.title || currentPage?.content?.title || '';
  let imageUrl: string | null = currentPage?.imageUrl || currentPage?.content?.imageUrl || null;

  // Helper function to extract question text from various possible structures
  const extractQuestionText = (q: any): string => {
    if (typeof q === 'string') return q;
    if (!q) return '';
    
    // Try all possible field names for question text
    const text = q.statement || 
           q.question || 
           q.text || 
           q.originalText ||
           q.prompt ||
           q.content ||
           q.questionText ||
           q.title ||
           '';
    
    console.log('📝 Extracting question text:', { q, extractedText: text });
    return text;
  };

  // Extract text and questions based on page type
  switch (pageType) {
    case 'article':
    case 'ttsArticle':
      pageText = currentPage?.text || currentPage?.content?.text || '';
      break;
      
    case 'trueFalseWithText':
    case 'multipleChoiceWithText':
      pageText = currentPage?.content?.text || '';
      const questionsArray = currentPage?.content?.questions || [];
      questionsArray.forEach((q: any, idx: number) => {
        const qId = `q${idx}`;
        const questionText = extractQuestionText(q);
        if (questionText) {
          questions.push({
            id: qId,
            label: `${idx + 1}.`,
            text: questionText
          });
          if (focusedQuestionIndex === idx) {
            focusedQuestionId = qId;
          }
        }
      });
      break;
      
    case 'trueFalse':
      if (currentPage?.questions && Array.isArray(currentPage.questions)) {
        currentPage.questions.forEach((q: any, idx: number) => {
          const qId = `q${idx}`;
          const questionText = extractQuestionText(q);
          if (questionText) {
            questions.push({
              id: qId,
              label: `${idx + 1}.`,
              text: questionText
            });
            if (focusedQuestionIndex === idx) {
              focusedQuestionId = qId;
            }
          }
        });
      } else if (currentPage?.statement || currentPage?.content?.statement) {
        questions.push({
          id: 'q0',
          text: currentPage.statement || currentPage.content.statement
        });
        if (focusedQuestionIndex === 0) {
          focusedQuestionId = 'q0';
        }
      }
      break;
      
    case 'multipleChoice':
    case 'audioMultipleChoice':
      const mcQuestion = currentPage?.question || currentPage?.content?.question || '';
      pageText = mcQuestion;
      // Add the main question to questions array
      if (mcQuestion) {
        questions.push({
          id: 'main_question',
          text: mcQuestion
        });
        focusedQuestionId = 'main_question';
      }
      // Add options as well for context
      if (currentPage?.content?.options || currentPage?.options) {
        const opts = currentPage.content?.options || currentPage.options || [];
        opts.forEach((opt: string, idx: number) => {
          questions.push({
            id: `opt${idx}`,
            label: String.fromCharCode(65 + idx) + ')',
            text: opt
          });
        });
      }
      break;
      
    case 'exactAnswer':
      const eaQuestion = currentPage?.question || currentPage?.content?.question || '';
      pageText = eaQuestion;
      if (eaQuestion) {
        questions.push({
          id: 'main_question',
          text: eaQuestion
        });
        focusedQuestionId = 'main_question';
      }
      break;
      
    case 'aiFeedback':
    case 'aiFeedbackWithParameters':
    case 'aiFeedbackWithParametersEssay':
    case 'recommendedVocabulary':
      // Handle both plural 'questions' array AND singular 'question' string
      let aiQuestions = currentPage?.questions || currentPage?.content?.questions || [];
      let isSingleQuestion = false;
      
      // If no questions array, check for singular 'question' property
      if (aiQuestions.length === 0) {
        const singleQuestion = currentPage?.question || currentPage?.content?.question;
        if (singleQuestion) {
          aiQuestions = [{ question: singleQuestion }];
          isSingleQuestion = true;
        }
      }
      
      aiQuestions.forEach((q: any, idx: number) => {
        const qId = `q${idx}`;
        const questionText = extractQuestionText(q);
        if (questionText) {
          questions.push({
            id: qId,
            label: `${idx + 1}.`,
            text: questionText
          });
          // For single questions, always focus on it
          // For multiple questions, focus on the one matching focusedQuestionIndex
          if (isSingleQuestion) {
            focusedQuestionId = qId;
          } else if (focusedQuestionIndex !== undefined && focusedQuestionIndex === idx) {
            focusedQuestionId = qId;
          }
        }
      });
      break;
      
    case 'listening':
      pageTitle = currentPage?.content?.title || currentPage?.title || 'Listening Exercise';
      const listeningQuestions = currentPage?.content?.questions || currentPage?.questions || [];
      listeningQuestions.forEach((q: any, idx: number) => {
        const qId = `q${idx}`;
        const questionText = extractQuestionText(q);
        if (questionText) {
          questions.push({
            id: qId,
            label: `${idx + 1}.`,
            text: questionText
          });
          if (focusedQuestionIndex === idx) {
            focusedQuestionId = qId;
          }
        }
      });
      break;
      
    case 'video':
    case 'videoQuiz':
      pageText = currentPage?.content?.description || '';
      imageUrl = currentPage?.content?.videoUrl || currentPage?.videoUrl || null;
      break;
      
    case 'essay':
      pageText = currentPage?.content?.prompt || currentPage?.prompt || '';
      if (pageText) {
        questions.push({
          id: 'essay_prompt',
          text: pageText
        });
        focusedQuestionId = 'essay_prompt';
      }
      break;
      
    case 'slideshow':
      pageTitle = currentPage?.title || 'Slideshow';
      break;
      
    case 'pdf':
      pageTitle = currentPage?.content?.title || currentPage?.title || 'PDF Document';
      pageText = currentPage?.content?.pdfUrl || currentPage?.pdfUrl || '';
      break;
  }

  console.log('✅ Built lesson context:', {
    lessonId: lessonId || 'unknown',
    pageType,
    questionsCount: questions.length,
    questions,
    focusedQuestionId
  });

  return {
    lessonId: lessonId || 'unknown',
    lessonTitle,
    pageId: currentPage?.id || `page_${currentPageIndex}`,
    pageIndex: currentPageIndex,
    pageType,
    pageTitle,
    pageText,
    questions: questions.length > 0 ? questions : undefined,
    focusedQuestionId,
    imageUrl
  };
}

export function buildLessonDoubtSystemPrompt(ctx: LessonPageContext): string {
  const parts: string[] = [];

  parts.push(
    "You are an experienced ESL (English as a Second Language) teacher helping a student with a specific lesson page.",
    "",
    "The student can:",
    "- Ask about this page (questions, instructions, text, vocabulary, etc.).",
    "- Or ask any other doubt about English.",
    "",
    "If they say things like 'I don't understand this question', use the lesson context below to figure out which question they mean.",
    "",
    "When you explain a concept or answer a question about the lesson content, always ask at the end: \"Gostaria de ver alguns exemplos de resposta?\" (Would you like to see some example answers?)",
    ""
  );

  parts.push(`Lesson: ${ctx.lessonTitle || ctx.lessonId}`);
  parts.push(`Page ${ctx.pageIndex + 1} (${ctx.pageType}) - ${ctx.pageTitle || ""}`);
  parts.push("");

  if (ctx.pageText) {
    parts.push("Page text:");
    parts.push(ctx.pageText);
    parts.push("");
  }

  if (ctx.questions && ctx.questions.length > 0) {
    if (ctx.focusedQuestionId) {
      parts.push("Current question the student is looking at:");
      const focusedQ = ctx.questions.find(q => q.id === ctx.focusedQuestionId);
      if (focusedQ) {
        const label = focusedQ.label ? `${focusedQ.label} ` : "";
        parts.push(`${label}${focusedQ.text}`);
      }
      parts.push("");
      
      if (ctx.questions.length > 1) {
        parts.push("Other questions on this page:");
        ctx.questions
          .filter(q => q.id !== ctx.focusedQuestionId)
          .forEach((q) => {
            const label = q.label ? `${q.label} ` : "";
            parts.push(`${label}${q.text}`);
          });
        parts.push("");
      }
    } else {
      parts.push("Questions on this page:");
      ctx.questions.forEach((q) => {
        const label = q.label ? `${q.label} ` : "";
        parts.push(`${label}${q.text}`);
      });
      parts.push("");
    }
  }

  if (ctx.imageUrl) {
    parts.push(
      `There is an image on this page at URL: ${ctx.imageUrl}.`,
      "If your model can see images, you may use that to answer.",
      "If not, answer based only on the text and be transparent about it if necessary."
    );
  }

  return parts.join("\n");
}
