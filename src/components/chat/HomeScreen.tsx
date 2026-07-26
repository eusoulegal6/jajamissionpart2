import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import horizonsFlixIcon from "@/assets/horizons-flix-icon.png";
import { Button } from "@/components/ui/button";
import { MessageCircle, HelpCircle, BookOpen, Briefcase, Gamepad2, ClipboardCheck, Headphones, Users, GraduationCap, Speech, MessageCircleQuestion, ArrowLeft, Plus, LogOut, Play, PlayCircle, ImageIcon, Wand2, Sparkles } from "lucide-react";
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
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
      {/* Top bar */}
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center gap-3">
          {user && (
            <div className="text-sm text-slate-600">
              {t('ola')}, <span className="font-semibold text-slate-800">{user.display_name || user.phone_number}</span>
            </div>
          )}
        </div>
        <Button onClick={logout} variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
          <LogOut className="h-4 w-4 mr-2" />
          {t('sair')}
        </Button>
      </div>

      {/* Hero */}
      <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white rounded-2xl animate-fade-in">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide">
                <Sparkles className="h-3.5 w-3.5" />
                Fluency Voyage
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {t('ola')}{user ? `, ${user.display_name || ''}` : ''}!
              </h1>
              <p className="text-white/75 text-sm sm:text-base max-w-md">
                Continue explorando, praticando e conquistando novos caminhos no idioma.
              </p>
              <div className="flex items-center gap-4 pt-1">
                <div>
                  <div className="text-2xl font-bold">{currentLanguageProgress}%</div>
                  <div className="text-xs text-white/65">{tLesson('total_progress')}</div>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <button
                  onClick={handleToggleLearningLanguage}
                  className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 transition-colors"
                >
                  <span className="text-xl">{learningLanguage === 'en' ? '🇺🇸' : '🇪🇸'}</span>
                  <span className="text-sm font-medium">{learningLanguage === 'en' ? 'Inglês' : 'Espanhol'}</span>
                </button>
              </div>
            </div>
            <div className="hidden md:flex shrink-0">
              <div className="relative h-28 w-28 rounded-full bg-white/10 flex items-center justify-center backdrop-blur border border-white/20">
                <Wand2 className="h-10 w-10 text-white/60" />
                <div className="absolute inset-3 rounded-full border border-white/10" />
              </div>
            </div>
          </div>
          <div className="mt-6 h-2 rounded-full bg-white/15">
            <div
              className="h-2 rounded-full bg-white/90 transition-all duration-700 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, currentLanguageProgress))}%` }}
              role="progressbar"
              aria-valuenow={Math.max(0, Math.min(100, currentLanguageProgress))}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </CardContent>
      </Card>

      {/* Practice */}
      <section className="w-full">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Prática</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Card className="group cursor-pointer border-l-4 border-l-blue-500 hover:shadow-md hover:border-l-blue-600 transition-all duration-200 rounded-xl bg-white" onClick={() => safeSelect("conversation-menu")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><MessageCircle className="h-5 w-5 text-blue-600" /></div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">{t('pratica_conversacao')}</h3></div>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer border-l-4 border-l-blue-500 hover:shadow-md hover:border-l-blue-600 transition-all duration-200 rounded-xl bg-white" onClick={() => safeSelect("listening")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Headphones className="h-5 w-5 text-blue-600" /></div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">{t('pratica_escuta')}</h3></div>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer border-l-4 border-l-blue-500 hover:shadow-md hover:border-l-blue-600 transition-all duration-200 rounded-xl bg-white" onClick={() => safeSelect("quiz")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><ClipboardCheck className="h-5 w-5 text-blue-600" /></div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">Quiz</h3></div>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer border-l-4 border-l-blue-500 hover:shadow-md hover:border-l-blue-600 transition-all duration-200 rounded-xl bg-white" onClick={() => safeSelect("role-play")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Users className="h-5 w-5 text-blue-600" /></div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">{t('simulacao')}</h3></div>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer border-l-4 border-l-blue-500 hover:shadow-md hover:border-l-blue-600 transition-all duration-200 rounded-xl bg-white" onClick={() => safeSelect("interview")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Briefcase className="h-5 w-5 text-blue-600" /></div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">{t('entrevista_emprego')}</h3></div>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer border-l-4 border-l-blue-500 hover:shadow-md hover:border-l-blue-600 transition-all duration-200 rounded-xl bg-white" onClick={() => safeSelect("perguntas")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><MessageCircleQuestion className="h-5 w-5 text-blue-600" /></div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">{t('perguntas')}</h3></div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Learn */}
      <section className="w-full">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Aprender</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Card className="group cursor-pointer border-l-4 border-l-emerald-500 hover:shadow-md hover:border-l-emerald-600 transition-all duration-200 rounded-xl bg-white" onClick={handleCompleteLessons}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><BookOpen className="h-5 w-5 text-emerald-600" /></div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">{t('licoes_completas_card')}</h3></div>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer border-l-4 border-l-emerald-500 hover:shadow-md hover:border-l-emerald-600 transition-all duration-200 rounded-xl bg-white" onClick={() => safeSelect("curso-completo")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><GraduationCap className="h-5 w-5 text-emerald-600" /></div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">{t('curso_completo_card')}</h3></div>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer border-l-4 border-l-emerald-500 hover:shadow-md hover:border-l-emerald-600 transition-all duration-200 rounded-xl bg-white" onClick={() => navigate("/lessons")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><Sparkles className="h-5 w-5 text-emerald-600" /></div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">{t('pnl_card')}</h3></div>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer border-l-4 border-l-emerald-500 hover:shadow-md hover:border-l-emerald-600 transition-all duration-200 rounded-xl bg-white" onClick={() => safeSelect("toefl")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 overflow-hidden">
                <img src={getDisplayImageUrl("https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/images/ETS_Logo%20(1).png")} alt="TOEFL" className="h-6 w-6 object-contain" />
              </div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">TOEFL</h3></div>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer border-l-4 border-l-emerald-500 hover:shadow-md hover:border-l-emerald-600 transition-all duration-200 rounded-xl bg-white" onClick={() => safeSelect("flashcards-menu")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><img src={flashcardIcon} alt="" className="h-5 w-5 object-contain" /></div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">{t('flashcards_card')}</h3></div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tools */}
      <section className="w-full">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Ferramentas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Card className="group cursor-pointer border-l-4 border-l-amber-500 hover:shadow-md hover:border-l-amber-600 transition-all duration-200 rounded-xl bg-white" onClick={() => safeSelect("tradutor")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0"><img src={tradutorIcon} alt="" className="h-5 w-5 object-contain" /></div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">{t('tradutor_card')}</h3></div>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer border-l-4 border-l-amber-500 hover:shadow-md hover:border-l-amber-600 transition-all duration-200 rounded-xl bg-white" onClick={() => navigate("/text-to-speech")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0"><img src={textoParaVozIcon.url} alt="" className="h-5 w-5 object-contain" /></div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">Texto para Voz</h3></div>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer border-l-4 border-l-amber-500 hover:shadow-md hover:border-l-amber-600 transition-all duration-200 rounded-xl bg-white" onClick={() => navigate("/text-correction")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0"><img src={correcaoDeTextoIcon.url} alt="" className="h-5 w-5 object-contain" /></div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">Correção de Texto</h3></div>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer border-l-4 border-l-amber-500 hover:shadow-md hover:border-l-amber-600 transition-all duration-200 rounded-xl bg-white" onClick={() => navigate("/specialist-help", { state: { showPronunciation: true } })}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0"><Speech className="h-5 w-5 text-amber-600" /></div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">Pronúncia</h3></div>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer border-l-4 border-l-amber-500 hover:shadow-md hover:border-l-amber-600 transition-all duration-200 rounded-xl bg-white" onClick={handleTutorialClick}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0"><PlayCircle className="h-5 w-5 text-amber-600" /></div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">{t('tutorial_card')}</h3></div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* More */}
      <section className="w-full">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Mais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Card className="group cursor-pointer border-l-4 border-l-purple-500 hover:shadow-md hover:border-l-purple-600 transition-all duration-200 rounded-xl bg-white" onClick={() => safeSelect("specialist")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0"><HelpCircle className="h-5 w-5 text-purple-600" /></div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">{t('pergunte_professor')}</h3></div>
            </CardContent>
          </Card>
          <Card className="group cursor-pointer border-l-4 border-l-purple-500 hover:shadow-md hover:border-l-purple-600 transition-all duration-200 rounded-xl bg-white" onClick={handlePrivateLessons}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0"><img src="/lovable-uploads/8772b1a6-925c-4a0b-bcc6-083cb8a79c3d.png" alt="" className="h-5 w-5 object-contain" /></div>
              <div className="min-w-0"><h3 className="font-semibold text-sm">{t('aulas_particulares')}</h3></div>
            </CardContent>
          </Card>
          <Card className="group border-l-4 border-l-purple-500/30 hover:border-l-purple-500/50 transition-all duration-200 rounded-xl bg-white opacity-60 cursor-default">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50/50 flex items-center justify-center shrink-0"><img src={horizonsFlixIcon} alt="" className="h-5 w-5 object-contain opacity-50" /></div>
              <div className="min-w-0"><div className="flex items-center gap-2"><h3 className="font-semibold text-sm">Horizons Flix</h3><span className="inline-flex items-center rounded-full bg-amber-100 border border-amber-300 px-1.5 py-0 text-[10px] font-bold text-amber-700 uppercase tracking-wide">Em breve</span></div></div>
            </CardContent>
          </Card>
          {isKrakenReleased && (
            <>
              <Card className="group cursor-pointer border-l-4 border-l-purple-500 hover:shadow-md hover:border-l-purple-600 transition-all duration-200 rounded-xl bg-white" onClick={handleCreateLesson}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0"><Plus className="h-5 w-5 text-purple-600" /></div>
                  <div className="min-w-0"><h3 className="font-semibold text-sm">{t('criar_licao')}</h3></div>
                </CardContent>
              </Card>
              <Card className="group cursor-pointer border-l-4 border-l-purple-500 hover:shadow-md hover:border-l-purple-600 transition-all duration-200 rounded-xl bg-white" onClick={handleCreateSlideshow}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0"><Play className="h-5 w-5 text-purple-600" /></div>
                  <div className="min-w-0"><h3 className="font-semibold text-sm">{t('criar_slideshow')}</h3></div>
                </CardContent>
              </Card>
              <Card className="group cursor-pointer border-l-4 border-l-purple-500 hover:shadow-md hover:border-l-purple-600 transition-all duration-200 rounded-xl bg-white" onClick={() => navigate('/admin/image-optimizer')}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0"><ImageIcon className="h-5 w-5 text-purple-600" /></div>
                  <div className="min-w-0"><h3 className="font-semibold text-sm">Image Optimizer</h3></div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </section>

      {/* Install CTA */}
      <InstallCTA />

      {/* Slideshow Manager */}
      {isKrakenReleased && (
        <div className="w-full animate-fade-in">
          <SlideshowManager />
        </div>
      )}

      {/* Tab Audio */}
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
    </div>
  );
};
export default HomeScreen;
