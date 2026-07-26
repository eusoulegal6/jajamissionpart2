export interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  content: any;
  credits?: LessonCredits;
  flashcards?: LessonFlashcard[];
  complementaryLessonIds?: string[];
}

export interface LessonFlashcard {
  front: string;
  back: string;
  context?: string;
}

export interface LessonCredits {
  enabled: boolean;
  narrator: string;
}

export interface VoiceArtist {
  name: string;
  image: string;
  flag: string;
}

export interface TTSArticlePageData {
  type: "ttsArticle";
  title: string;
  imageUrl: string;
  displayText: string;
  audioText: string;
  audioUrl?: string;
}

export interface VideoQuizQuestion {
  id: string;
  timestamp_seconds: number;
  question: string;
  correct_answers: string[];
  visible: boolean;
}

export interface VideoQuizPageData {
  type: "videoQuiz";
  title: string;
  videoUrl: string;
  questions: VideoQuizQuestion[];
}

export interface MultipleChoicePageData {
  type: "multipleChoice";
  title: string;
  question: string;
  imageUrl?: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface ExactAnswerPageData {
  type: "exactAnswer";
  title: string;
  question: string;
  imageUrl?: string;
  correctAnswers: string[];
  explanation?: string;
}

export interface MatchingPageData {
  type: "matching";
  title: string;
  pairs: { left: string; right: string }[];
  instructions?: string;
}

export interface RecommendedVocabularyPageData {
  type: "recommendedVocabulary";
  title: string;
  topic?: string;
  questions: string[];
  recommendedWords: string[];
}

export interface TrueFalseWithTextPageData {
  type: "trueFalseWithText";
  title: string;
  text: string;
  questions: {
    id: string;
    question: string;
    answer: boolean;
    explanation?: string;
  }[];
}

export interface MultipleChoiceWithTextPageData {
  type: "multipleChoiceWithText";
  title: string;
  text: string;
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }[];
}

export interface AIFeedbackWithParametersPageData {
  type: "aiFeedbackWithParameters";
  title: string;
  topic?: string;
  questions: string[];
  evaluationParameters: string[];
}

export interface AIFeedbackWithParametersEssayPageData {
  type: "aiFeedbackWithParametersEssay";
  title: string;
  topic?: string;
  questions: string[];
  evaluationParameters: string[];
}

export interface AudioMultipleChoicePageData {
  type: "audioMultipleChoice";
  title: string;
  question: string;
  audioUrl: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface SuggestedWordsPageData {
  type: "suggestedWords";
  title?: string;
  description?: string;
  suggestedWords?: string[];
  content?: {
    suggestedWords?: string[];
  };
}

export interface EssayPageData {
  type: "essay";
  title: string;
  topic: string;
  instructions?: string;
}

export interface SlideshowPageData {
  type: "slideshow";
  title: string;
  slideshowId: string;
}

export interface PDFPageData {
  type: "pdf";
  title?: string;
  pdfUrl: string;
}

export interface PNLSlidesPageData {
  type: "pnlSlides";
  title: string;
  lessonId: string;
  category: 'verbs' | 'newWords' | 'usefulPhrases' | 'grammarExamples';
}

export interface PronunciationSlidesPageData {
  type: "pronunciationSlides";
  title: string;
  lessonId: string;
  category: 'verbs' | 'newWords' | 'usefulPhrases' | 'grammarExamples';
}

export interface CustomPronunciationSlide {
  displayText: string;
  comparisonText: string;
  translation?: string;
  audioMode?: boolean;
  displayAudioUrl?: string;
}

export interface CustomPronunciationSlidesPageData {
  type: "customPronunciationSlides";
  title: string;
  slides: CustomPronunciationSlide[];
}

export interface AudioSlide {
  english: string;
  translation: string;
  audioUrl?: string;
  imageUrl?: string;
  /** Authoring-only: prompt used to generate the slide image. Never rendered to students. */
  _imagePrompt?: string;
}

export interface AudioSlidesPageData {
  type: "audioSlides";
  title: string;
  slides: AudioSlide[];
}
