import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import horizonsFlixIcon from "@/assets/horizons-flix-icon.png";
import { Button } from "@/components/ui/button";
import { MessageCircle, HelpCircle, BookOpen, Briefcase, Gamepad2, ClipboardCheck, Headphones, Users, GraduationCap, Speech, MessageCircleQuestion, ArrowLeft, Plus, LogOut, Play, ImageIcon, Wand2 } from "lucide-react";
import flashcardIcon from "@/assets/flashcard-icon.png";
import tradutorIcon from "@/assets/tradutor-icon.png";
import textoParaVozIcon from "@/assets/texto-para-voz.png.asset.json";
import correcaoDeTextoIcon from "@/assets/correcao-de-texto.png.asset.json";
import TutorialModal from "@/components/TutorialModal";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useKraken } from "@/contexts/KrakenContext";
import { usePhoneAuth } from "@/contexts/PhoneAuthContext";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import InstallCTA from "@/components/InstallCTA";
import { useAudioInput } from "@/contexts/AudioInputContext";
import SlideshowManager from "@/components/slideshow-creator/SlideshowManager";
import { getDisplayImageUrl } from "@/utils/imageOptimization";
import OptimizedImg from "@/components/common/OptimizedImg";


interface HomeScreenProps {
  onModeSelect: (mode: "specialist" | "conversation-menu" | "interview" | "quiz" | "listening" | "role-play" | "content" | "flashcards-menu" | "toefl" | "curso-completo" | "pronunciation" | "freePronunciation" | "tradutor") => void;
  onModePreSelect?: (mode: string) => void;
}
const HomeScreen = ({
  onModeSelect,
  onModePreSelect
}: HomeScreenProps) => {
  const navigate = useNavigate();
  const {
    t,
    tLesson,
    learningLanguage,
    setLearningLanguage,
    uiLanguage
  } = useLanguage();
  const {
    isKrakenReleased,
    releaseKraken
  } = useKraken();
  const {
    logout,
    user
  } = usePhoneAuth();
  const {
    progressPercentage
  } = useLessonProgress();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [keySequence, setKeySequence] = useState("");
  const [showTabAudioCTA, setShowTabAudioCTA] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const { isTabAudioActive, activateTabAudio } = useAudioInput();
  
  // Keyboard sequence cheat code
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only track letters and numbers
      if (event.key.match(/^[a-zA-Z0-9]$/)) {
        setKeySequence(prev => {
          const newSequence = (prev + event.key.toLowerCase()).slice(-7); // Keep only last 7 characters
          console.log("🎹 Key sequence:", newSequence);

          // Check for cheat code
          if (newSequence === "abcdefg") {
            console.log("🚀 CHEAT CODE DETECTED! Releasing kraken...");
            releaseKraken();
            setKeySequence(""); // Reset sequence

            // Visual feedback
            const body = document.body;
            body.style.background = "linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #dda0dd)";
            body.style.backgroundSize = "400% 400%";
            body.style.animation = "krakenAnimation 2s ease-in-out";

            // Add keyframe animation if it doesn't exist
            if (!document.getElementById('kraken-style')) {
              const style = document.createElement('style');
              style.id = 'kraken-style';
              style.textContent = `
                @keyframes krakenAnimation {
                  0%, 100% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                }
              `;
              document.head.appendChild(style);
            }

            // Reset after animation
            setTimeout(() => {
              body.style.background = "";
              body.style.backgroundSize = "";
              body.style.animation = "";
            }, 2000);
          }

          // Secret trigger for tab audio
          if (newSequence.endsWith("record")) {
            setShowTabAudioCTA(true);
          }

          return newSequence;
        });
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [releaseKraken]);
  const handleCompleteLessons = () => {
    navigate("/complete-lessons");
  };
  const handleContentClick = () => {
    setShowComingSoon(true);
  };
  const handleBackFromComingSoon = () => {
    setShowComingSoon(false);
  };
  const handlePrivateLessons = () => {
    window.open("https://newhorizonsenglishschool.com/", "_blank");
  };
  const handleCreateLesson = () => {
    navigate("/lesson-creator");
  };

  const handleCreateSlideshow = () => {
    navigate("/slideshow-creator");
  };
  const handleToggleLearningLanguage = () => {
    setLearningLanguage(learningLanguage === 'en' ? 'es' : 'en');
  };
  
  const handleTutorialClick = () => {
    setShowTutorial(true);
  };
  const languageName = learningLanguage === 'en' ? uiLanguage === 'pt' ? 'inglês' : 'inglés' : uiLanguage === 'pt' ? 'espanhol' : 'español';

  // Use stored progress percentage for current learning language (increments by 2% per completed lesson)
  const currentLanguageProgress = progressPercentage[learningLanguage] || 0;

  // Helper to clear chat if callback present and then select mode
  const safeSelect = (mode: string) => {
    if (onModePreSelect) onModePreSelect(mode);
    onModeSelect(mode as any);
  };

  // Show coming soon screen
  if (showComingSoon) {
    return <div className="w-full max-w-5xl px-6 py-8 flex flex-col items-center">
        <div className="w-24 h-auto mb-6 animate-fade-in">
          <img src="/lovable-uploads/27a9e05b-01c1-4f55-9cc2-6f5e6758c158.png" alt="Tutor Virtual" className="w-full h-auto" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 text-[#202123]">{t('em_breve')}</h1>
          <p className="text-[#6e6e80] text-lg mb-6 max-w-md">
            {t('em_breve_desc')}
          </p>
          
          <Button onClick={handleBackFromComingSoon} className="flex items-center gap-2 bg-[#10a37f] hover:bg-[#0d8567] text-white px-6 py-3 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
            {t('voltar_inicio')}
          </Button>
        </div>
      </div>;
  }
  return <div className="course-home w-full max-w-5xl px-6 py-8 flex flex-col items-center">
      {/* User info and logout button */}
      <div className="w-full flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          {user && <div className="text-sm text-muted-foreground">
              {t('ola')}, {user.display_name || user.phone_number}
            </div>}
        </div>
        <Button onClick={logout} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4 mr-2" />
          {t('sair')}
        </Button>
      </div>

      <div className="course-hero w-full max-w-3xl mb-8 animate-fade-in">
        <div className="course-hero-orbit course-hero-orbit-one" />
        <div className="course-hero-orbit course-hero-orbit-two" />
        <div className="relative z-10 max-w-xl">
          <div className="course-eyebrow"><Wand2 className="h-4 w-4" /> Sua jornada de idiomas</div>
          <h1>Fluency <span>Voyage</span></h1>
          <p>Explore o idioma, conquiste novos caminhos e transforme cada conversa em uma nova descoberta.</p>
          <div className="course-hero-meta">
            <span><BookOpen className="h-4 w-4" /> Trilhas práticas</span>
            <span><Speech className="h-4 w-4" /> Conversas reais</span>
          </div>
        </div>
        <div className="course-compass" aria-hidden="true">
          <span>✦</span>
          <strong>FV</strong>
        </div>
      </div>

      {/* Progress Card */}
      <section className="course-progress bg-white p-6 rounded-xl shadow-sm w-full max-w-3xl mb-8">
        <h2 className="text-xl font-bold leading-tight tracking-tight text-[var(--text-color)] mb-4">
          {tLesson('progress')}
        </h2>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-600 text-base font-medium">{tLesson('total_progress')}</p>
              <p className="text-[var(--primary-600)] text-base font-bold">
                {Math.max(0, Math.min(100, currentLanguageProgress))}%
              </p>
            </div>

            <div className="h-3 rounded-full bg-[var(--primary-100)]">
              <div className="h-3 rounded-full bg-gradient-to-r from-[var(--primary-400)] to-[var(--primary-600)]" style={{
              width: `${Math.max(0, Math.min(100, currentLanguageProgress))}%`,
              background: "linear-gradient(to right, var(--primary-400), var(--primary-600))"
            }} role="progressbar" aria-valuenow={Math.max(0, Math.min(100, currentLanguageProgress))} aria-valuemin={0} aria-valuemax={100} />
            </div>
          </div>
        </div>
      </section>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 w-full max-w-3xl animate-fade-in">
        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={handleTutorialClick}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src="/lovable-uploads/357aec70-5e1c-49ea-a612-aae2b59f98d3.png" alt="Tutorial" className="h-10 w-10 mr-5" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">{t('tutorial_card')}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <InstallCTA />
        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={handleCompleteLessons}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src="/lovable-uploads/8cefaa7d-f6b6-44e6-845c-3142e001cd09.png" alt="Books" className="h-10 w-10 mr-5" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">{t('licoes_completas_card')}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={() => safeSelect("specialist")}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src="/lovable-uploads/8fb056c5-eff7-4a39-a6a5-a715bf7d5bbe.png" alt="Question" className="h-10 w-10 mr-5" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">{t('pergunte_professor')}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={() => safeSelect("conversation-menu")}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src="/lovable-uploads/a1bf6644-92da-4ed0-9da9-c34382604b7c.png" alt="Chat" className="h-10 w-10 mr-5" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">{t('pratica_conversacao')}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* HIDDEN: Conteúdo section - uncomment to restore
        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={() => safeSelect("content")}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src="/lovable-uploads/6ca0809f-bb35-458b-9f7f-a4a88fe3d76e.png" alt="Content" className="h-10 w-10 mr-5" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">Conteúdo</h2>
              </div>
            </div>
          </CardContent>
        </Card>
        */}

        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={() => safeSelect("quiz")}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src="/lovable-uploads/quiz-icon.png" alt="Quiz" className="h-10 w-10 mr-5" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">Quiz 🧠</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={() => safeSelect("listening")}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src="/lovable-uploads/16005237-1509-4d95-adc0-01010196e5f5.png" alt="Headphones" className="h-10 w-10 mr-5" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">{t('pratica_escuta')}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={() => safeSelect("curso-completo")}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src={getDisplayImageUrl("https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/c/5779405.png")} alt="Curso Completo" className="h-10 w-10 mr-5" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">{t('curso_completo_card')}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={() => navigate("/specialist-help", { state: { showPronunciation: true } })}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src="/lovable-uploads/pronunciation-icon.png" alt="Pronúncia" className="h-14 w-14 mr-5 object-contain" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">Pronúncia</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={() => safeSelect("role-play")}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src="/lovable-uploads/ca8effea-3d23-4b67-ace1-a9c2256cc58e.png" alt="Role Play" className="h-10 w-10 mr-5" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">{t('simulacao')}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={() => safeSelect("flashcards-menu")}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src={flashcardIcon} alt="Flashcards" className="h-10 w-10 mr-5" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">{t('flashcards_card')}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={() => safeSelect("interview")}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src="/lovable-uploads/e85a76b3-d1d4-41b2-9695-c38f8c500b41.png" alt="Briefcase" className="h-10 w-10 mr-5" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">{t('entrevista_emprego')}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={() => safeSelect("toefl")}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src={getDisplayImageUrl("https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/images/ETS_Logo%20(1).png")} alt="TOEFL" className="h-10 w-10 mr-5" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">TOEFL</h2>
              </div>
            </div>
          </CardContent>
        </Card>


        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={() => safeSelect("tradutor")}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src={tradutorIcon} alt="Tradutor" className="h-10 w-10 mr-5" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">{t('tradutor_card')}</h2>
              </div>
            </div>
          </CardContent>
        </Card>



        <Card className="bg-sky-50 border border-sky-200 hover:bg-sky-100 transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={handleToggleLearningLanguage}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <h2 className="text-lg font-bold mb-1.5 text-[#202123]">
                    {t("mudar_aprendizado")}
                  </h2>
                </div>
              <div className="text-4xl">
                {learningLanguage === "en" ? "🇺🇸" : "🇪🇸"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={() => navigate("/lessons")}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src={getDisplayImageUrl("https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/pows/ChatGPT%20Image%20Nov%2028,%202025,%2007_46_45%20PM%20(1).png")} alt="PNL" className="h-10 w-10 mr-5" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">{t('pnl_card')}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={() => navigate("/text-to-speech")}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src={textoParaVozIcon.url} alt="Texto para Voz" className="h-16 w-16 mr-4 object-contain" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">Texto para Voz 🔊</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={() => navigate("/text-correction")}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src={correcaoDeTextoIcon.url} alt="Correção de Texto" className="h-16 w-16 mr-4 object-contain" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">Correção de Texto ✍️</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] transition-all duration-300 rounded-2xl shadow-sm opacity-75 cursor-default">
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src={horizonsFlixIcon} alt="Horizons Flix" className="h-10 w-10 mr-5 object-contain" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold mb-0 text-[#202123]">Horizons Flix</h2>
                  <span className="inline-flex items-center rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wide">Em breve</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">Filmes para <strong>todos os níveis</strong></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isKrakenReleased && (
          <>
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={handleCreateLesson}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Plus className="h-10 w-10 mr-5 text-purple-600" />
                  <div className="flex-1">
                    <h2 className="text-lg font-bold mb-1.5 text-[#202123]">{t('criar_licao')}</h2>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={handleCreateSlideshow}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Play className="h-10 w-10 mr-5 text-blue-600" />
                  <div className="flex-1">
                    <h2 className="text-lg font-bold mb-1.5 text-[#202123]">{t('criar_slideshow')}</h2>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:bg-gradient-to-r hover:from-green-100 hover:to-emerald-100 transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={() => navigate('/admin/image-optimizer')}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ImageIcon className="h-10 w-10 mr-5 text-green-600" />
                  <div className="flex-1">
                    <h2 className="text-lg font-bold mb-1.5 text-[#202123]">Image Optimizer (New)</h2>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md" onClick={handlePrivateLessons}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <img src="/lovable-uploads/8772b1a6-925c-4a0b-bcc6-083cb8a79c3d.png" alt="Aulas particulares" className="h-10 w-10 mr-5" />
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1.5 text-[#202123]">{t('aulas_particulares')}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slideshow Manager - only shown when kraken is released */}
      {isKrakenReleased && (
        <div className="w-full max-w-3xl mt-8 animate-fade-in">
          <SlideshowManager />
        </div>
      )}

      {showTabAudioCTA && !isTabAudioActive && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button onClick={activateTabAudio}>Use audio from another tab</Button>
        </div>
      )}

      {isTabAudioActive && (
        <div className="fixed bottom-6 left-6 z-50 rounded-full border bg-background/95 px-3 py-1 text-sm shadow-sm">
          Using tab audio instead of mic
        </div>
      )}
      
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>;
};
export default HomeScreen;
