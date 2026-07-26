
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

interface QuizSetupProps {
  quizDifficulty: string;
  setQuizDifficulty: (difficulty: string) => void;
  quizTheme: string;
  setQuizTheme: (theme: string) => void;
  customThemeInfo: string;
  setCustomThemeInfo: (info: string) => void;
  handleStartQuiz: () => void;
  handleBackToHome: () => void;
}

const QuizSetup: React.FC<QuizSetupProps> = ({
  quizDifficulty,
  setQuizDifficulty,
  quizTheme,
  setQuizTheme,
  customThemeInfo,
  setCustomThemeInfo,
  handleStartQuiz,
  handleBackToHome
}) => {
  const { learningLanguage, t } = useLanguage();

  const themeListEnglish = [
    "Geography", "History", "Science", "The Bible", "Music", "Movies",
    "Soccer", "Technology", "Travel", "Animals", "Health & Body",
    "World Politics", "Video Games", "Your city", "Your favorite artist",
    "Your country", "Your field of work", "Your favorite TV series"
  ];

  const themeListSpanish = [
    "Geografía", "Historia", "Ciencias", "La Biblia", "Música", "Películas",
    "Fútbol", "Tecnología", "Viajes", "Animales", "Salud y Cuerpo",
    "Política Mundial", "Videojuegos", "Tu ciudad", "Tu artista favorito",
    "Tu país", "Tu área de trabajo", "Tu serie favorita"
  ];

  const themeList = learningLanguage === 'es' ? themeListSpanish : themeListEnglish;

  const personalizedThemesEnglish = [
    "Your city", "Your favorite artist", "Your country", "Your field of work", "Your favorite TV series"
  ];

  const personalizedThemesSpanish = [
    "Tu ciudad", "Tu artista favorito", "Tu país", "Tu área de trabajo", "Tu serie favorita"
  ];

  const personalizedThemes = learningLanguage === 'es' ? personalizedThemesSpanish : personalizedThemesEnglish;

  const getPlaceholderText = (theme: string) => {
    if (learningLanguage === 'es') {
      const placeholders: Record<string, string> = {
        "Tu ciudad": "Ej: Madrid, Barcelona, etc.",
        "Tu artista favorito": "Ej: Taylor Swift, Beyoncé, etc.",
        "Tu país": "Ej: España, México, etc.",
        "Tu área de trabajo": "Ej: Ingeniería Civil, Marketing, etc.",
        "Tu serie favorita": "Ej: Stranger Things, The Office, etc."
      };
      return placeholders[theme] || "";
    } else {
      const placeholders: Record<string, string> = {
        "Your city": "Ex: São Paulo, Rio de Janeiro, etc.",
        "Your favorite artist": "Ex: Taylor Swift, Beyoncé, etc.",
        "Your country": "Ex: Brasil, Argentina, etc.",
        "Your field of work": "Ex: Engenharia Civil, Marketing, etc.",
        "Your favorite TV series": "Ex: Stranger Things, The Office, etc."
      };
      return placeholders[theme] || "";
    }
  };

  const getQuestionText = (theme: string) => {
    if (learningLanguage === 'es') {
      const questions: Record<string, string> = {
        "Tu ciudad": "¿En qué ciudad vives?",
        "Tu artista favorito": "¿Cuál es tu artista favorito?",
        "Tu país": "¿Cuál es tu país?",
        "Tu área de trabajo": "¿Cuál es tu área de trabajo?",
        "Tu serie favorita": "¿Cuál es tu serie favorita?"
      };
      return questions[theme] || "";
    } else {
      const questions: Record<string, string> = {
        "Your city": "Qual cidade você mora?",
        "Your favorite artist": "Qual é o seu artista favorito?",
        "Your country": "Qual é o seu país?",
        "Your field of work": "Qual é sua área de atuação?",
        "Your favorite TV series": "Qual é sua série favorita?"
      };
      return questions[theme] || "";
    }
  };

  const difficultyOptions = [
    { key: "Básico", label: t('basico_quiz') },
    { key: "Intermediário / Avançado", label: t('intermediario_avancado') },
  ];

  return (
    <div className="w-full px-6 py-6 md:py-10 flex flex-col bg-white">
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleBackToHome}
          className="mr-3 text-[#202123] hover:bg-[#f0f0f0] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold text-[#202123]">Quiz</h2>
      </div>

      <div className="settings-container">
        <div className="settings-section">
          <h3 className="settings-header">{t('escolha_dificuldade_quiz')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {difficultyOptions.map(({ key, label }) => (
              <Button 
                key={key}
                variant={quizDifficulty === key ? "default" : "outline"}
                className={`settings-button ${quizDifficulty === key ? 'settings-button-selected' : 'settings-button-unselected'}`}
                onClick={() => setQuizDifficulty(key)}
              >
                {label}
              </Button>
            ))}
          </div>
          <p className="text-[#6e6e80] text-base italic mb-6">
            {t('dificuldade_quiz_desc')}
          </p>
        </div>

        <div className="settings-section">
          <h3 className="settings-header">{t('escolha_tema')}</h3>
          <div className="settings-tip">
            <Lightbulb className="h-5 w-5 text-[#10a37f] mt-0.5 flex-shrink-0" />
            <p className="text-[#6e6e80] text-base leading-relaxed">
              {t('dica_quiz')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {themeList.map((theme) => (
            <Button
              key={theme}
              variant={quizTheme === theme ? "default" : "outline"}
              className={`settings-button ${quizTheme === theme ? 'settings-button-selected' : 'settings-button-unselected'}`}
              onClick={() => {
                setQuizTheme(theme);
                setCustomThemeInfo("");
              }}
            >
              {theme}
            </Button>
          ))}

          <Button
            variant={!themeList.includes(quizTheme) && quizTheme ? "default" : "outline"}
            className={`settings-button ${!themeList.includes(quizTheme) && quizTheme ? 'settings-button-selected' : 'settings-button-unselected'}`}
            onClick={() => {
              const customTheme = prompt(t('digite_tema'));
              if (customTheme && customTheme.trim()) {
                setQuizTheme(customTheme.trim());
                setCustomThemeInfo("");
              }
            }}
          >
            {t('outro_tema')}
          </Button>
        </div>

        {personalizedThemes.includes(quizTheme) && (
          <div className="mb-10">
            <h3 className="text-xl font-medium mb-6 text-[#202123]">
              {getQuestionText(quizTheme)}
            </h3>
            <Input
              placeholder={getPlaceholderText(quizTheme)}
              value={customThemeInfo}
              onChange={(e) => setCustomThemeInfo(e.target.value)}
              className="bg-[#f0f0f0] border-[#dcdcdc] text-[#202123] placeholder:text-[#6e6e80] rounded-full py-6 md:py-4 px-5 text-[17px] input-focus max-w-xl"
            />
          </div>
        )}

        <div className="settings-action">
          <Button 
            className="settings-submit"
            onClick={handleStartQuiz}
          >
            {t('iniciar_quiz')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizSetup;