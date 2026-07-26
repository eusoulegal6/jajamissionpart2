
import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";

import { HelmetProvider } from "react-helmet-async";
import { PhoneAuthProvider } from "@/contexts/PhoneAuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalWordClickHandler from "./components/GlobalWordClickHandler";

import FullLessons from "./components/chat/FullLessons";
import TrueFalseQuiz from "./components/chat/TrueFalseQuiz";
import AIFeedbackPage from "./components/chat/AIFeedbackPage";
import TranslationPage from "./components/chat/TranslationPage";
import ListeningPage from "./components/chat/ListeningPage";
import LessonRunnerWithScoring from "./components/LessonRunnerWithScoring";
import CompleteLessonsScreen from "./components/CompleteLessonsScreen";
import FlashcardsPage from "./components/FlashcardsPage";
import SpecialistHelp from "./components/SpecialistHelp";
import SharedLessonHandler from "./components/SharedLessonHandler";
import SharedFlashcardsImport from "./components/SharedFlashcardsImport";
import LessonCreator from "./pages/LessonCreator";
import SlideshowCreator from "./pages/SlideshowCreator";
import { LessonAudioProvider } from "@/hooks/use-lesson-audio";
import { LanguageProvider } from "./contexts/LanguageContext";
import { KrakenProvider } from "./contexts/KrakenContext";
import { AccentProvider } from "./contexts/AccentContext";
import { TeacherModeProvider } from "./contexts/TeacherModeContext";
import { PDFZoomProvider } from "./contexts/PDFZoomContext";
import ContentExplorer from "./components/content/ContentExplorer";
import TOEFLExplorer from "./components/content/TOEFLExplorer";
import ProtectedRoute from "./components/ProtectedRoute";
import { AudioInputProvider } from "@/contexts/AudioInputContext";
import TeacherToolbar from "./components/teacher/TeacherToolbar";
import TeacherModeAccessButton from "./components/teacher/TeacherModeAccessButton";
import TeacherModeIndicator from "./components/teacher/TeacherModeIndicator";
import ZoomControls from "./components/ZoomControls";
import { useTeacherMode } from "./contexts/TeacherModeContext";
import LegacyLessonRunnerRedirect from "./components/LegacyLessonRunnerRedirect";
import FoodAndDrinksLessonPage from "./pages/FoodAndDrinksLesson";
import FoodAndDrinksLesson2Page from "./pages/FoodAndDrinksLesson2";
import LessonsMenu from "./pages/LessonsMenu";
import Lesson2Page from "./pages/Lesson2Page";
import Lesson2Page2 from "./pages/Lesson2Page2";
import Lesson3Page from "./pages/Lesson3Page";
import Lesson3Page2 from "./pages/Lesson3Page2";
import Lesson4Page from "./pages/Lesson4Page";
import Lesson5Page from "./pages/Lesson5Page";
import Lesson4Page2 from "./pages/Lesson4Page2";
import Lesson5Page2 from "./pages/Lesson5Page2";
import Lesson6Page from "./pages/Lesson6Page";
import Lesson6Page2 from "./pages/Lesson6Page2";
import CompressImageDemo from "./pages/CompressImageDemo";
import ImageCompressionAdmin from "./pages/admin/image-compression";
import ImageOptimizerAdmin from "./pages/admin/image-optimizer";
import LessonEditorPage from "./pages/LessonEditorPage";
import AulasComplementares from "./pages/AulasComplementares";
import SecretariaAulas from "./pages/SecretariaAulas";
import HorizonsFlix from "./pages/HorizonsFlix";
import FlixProgramDetail from "./pages/FlixProgramDetail";
import LessonJsonGuide from "./pages/LessonJsonGuide";
import SuperAdmin from "./pages/SuperAdmin";
import TextToSpeech from "./pages/TextToSpeech";
import TextCorrection from "./pages/TextCorrection";
import TutorRegistration from "./pages/TutorRegistration";




const queryClient = new QueryClient();

// Wrapper for ContentExplorer to provide onBack prop
const ContentExplorerPage = () => {
  const navigate = useNavigate();
  return <ContentExplorer onBack={() => navigate('/')} />;
};

const TOEFLExplorerPage = () => {
  const navigate = useNavigate();
  return <TOEFLExplorer onBack={() => navigate('/')} />;
};

// Wrapper for the standalone AI Feedback page route
const AIFeedbackPageRoute = () => {
  const [questionIndex, setQuestionIndex] = useState(0);
  return (
    <AIFeedbackPage
      questionIndex={questionIndex}
      setQuestionIndex={setQuestionIndex}
    />
  );
};

// Global Teacher Mode Components
const GlobalTeacherMode = () => {
  const { isTeacherMode, enableTeacherMode } = useTeacherMode();
  const location = useLocation();
  
  const hideTeacherButtonPaths = ["/aulas-complementares", "/secretaria", "/become-a-tutor"];
  const shouldHideTeacherButton = hideTeacherButtonPaths.includes(location.pathname);

  // Listen for teacher mode activation globally
  useEffect(() => {
    const handleTeacherModeActivation = () => {
      enableTeacherMode();
    };

    window.addEventListener('activateTeacherMode', handleTeacherModeActivation);
    return () => {
      window.removeEventListener('activateTeacherMode', handleTeacherModeActivation);
    };
  }, [enableTeacherMode]);

  // Global key listener for teacher mode cheat code.
  useEffect(() => {
    let keySequence = '';
    let activationTimeout: number | null = null;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.isComposing || e.repeat) {
        return;
      }

      if (!/^[a-zA-Z0-9]$/.test(e.key)) {
        return;
      }

      keySequence = (keySequence + e.key.toLowerCase()).slice(-7);

      if (keySequence === "teacher") {
        console.log("🎓 Teacher shortcut detected, scheduling activation...");
        keySequence = "";

        if (!isTeacherMode && activationTimeout === null) {
          activationTimeout = window.setTimeout(() => {
            activationTimeout = null;
            console.log("🎓 Dispatching teacher mode activation after keystroke");
            window.dispatchEvent(new Event('activateTeacherMode'));
          }, 0);
        }
      }
    };

    window.addEventListener('keyup', handleKeyPress, true);
    return () => {
      if (activationTimeout !== null) {
        window.clearTimeout(activationTimeout);
      }
      window.removeEventListener('keyup', handleKeyPress, true);
    };
  }, [isTeacherMode]);
  
  return isTeacherMode ? (
    <>
      <ZoomControls />
      <TeacherModeIndicator />
      <TeacherToolbar />
    </>
  ) : (
    !shouldHideTeacherButton && <TeacherModeAccessButton onConfirm={enableTeacherMode} />
  );
};

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <KrakenProvider>
      <PhoneAuthProvider>
        <LanguageProvider>
          <AccentProvider>
            <TeacherModeProvider>
              <PDFZoomProvider>
                <TooltipProvider>
                
                <Toaster />
                <Sonner />
                <LessonAudioProvider>
                  <AudioInputProvider>
                  <BrowserRouter>
                    <ErrorBoundary>
                    <GlobalTeacherMode />
                    <GlobalWordClickHandler />
                    <Routes>
                      <Route path="/" element={
                        <ProtectedRoute>
                          <SharedLessonHandler />
                        </ProtectedRoute>
                      } />
                      <Route path="/content" element={
                        <ProtectedRoute>
                          <ContentExplorerPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/content/:categoryId" element={
                        <ProtectedRoute>
                          <ContentExplorerPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/content/:categoryId/:chapterId" element={
                        <ProtectedRoute>
                          <ContentExplorerPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/lesson-runner" element={
                        <ProtectedRoute>
                          <LegacyLessonRunnerRedirect />
                        </ProtectedRoute>
                      } />
                      <Route path="/complete-lessons" element={
                        <ProtectedRoute>
                          <CompleteLessonsScreen />
                        </ProtectedRoute>
                      } />
                      <Route path="/text-to-speech" element={
                        <ProtectedRoute>
                          <TextToSpeech />
                        </ProtectedRoute>
                      } />
                      <Route path="/text-correction" element={
                        <ProtectedRoute>
                          <TextCorrection />
                        </ProtectedRoute>
                      } />
                      <Route path="/flashcards" element={
                        <ProtectedRoute>
                          <FlashcardsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/specialist-help" element={
                        <ProtectedRoute>
                          <SpecialistHelp />
                        </ProtectedRoute>
                      } />
                      <Route path="/full-lessons" element={
                        <ProtectedRoute>
                          <FullLessons />
                        </ProtectedRoute>
                      } />
                      <Route path="/true-false-quiz" element={
                        <ProtectedRoute>
                          <TrueFalseQuiz />
                        </ProtectedRoute>
                      } />
                      <Route path="/ai-feedback" element={
                        <ProtectedRoute>
                          <AIFeedbackPageRoute />
                        </ProtectedRoute>
                      } />
                      <Route path="/translation" element={
                        <ProtectedRoute>
                          <TranslationPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/listening" element={
                        <ProtectedRoute>
                          <ListeningPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/lesson-creator" element={
                        <ProtectedRoute>
                          <LessonCreator />
                        </ProtectedRoute>
                      } />

                      <Route path="/slideshow-creator" element={
                        <ProtectedRoute>
                          <SlideshowCreator />
                        </ProtectedRoute>
                      } />
                      <Route path="/toefl" element={
                        <ProtectedRoute>
                          <TOEFLExplorerPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/toefl/:categoryId" element={
                        <ProtectedRoute>
                          <TOEFLExplorerPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/toefl/:categoryId/:chapterId" element={
                        <ProtectedRoute>
                          <TOEFLExplorerPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/shared-flashcards/:encodedWords" element={<SharedFlashcardsImport />} />
                      <Route path="/lesson/:lessonId" element={
                        <ProtectedRoute>
                          <LessonRunnerWithScoring />
                        </ProtectedRoute>
                      } />
                      <Route path="/lesson-editor/:lessonId" element={
                        <ProtectedRoute>
                          <LessonEditorPage />
                        </ProtectedRoute>
                      } />

                      <Route path="/lessons" element={
                        <ProtectedRoute>
                          <LessonsMenu />
                        </ProtectedRoute>
                      } />
                      <Route path="/lessons/food-and-drinks" element={
                        <ProtectedRoute>
                          <FoodAndDrinksLessonPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/lessons/food-and-drinks-2" element={
                        <ProtectedRoute>
                          <FoodAndDrinksLesson2Page />
                        </ProtectedRoute>
                      } />
                      <Route path="/lessons/lesson-2" element={
                        <ProtectedRoute>
                          <Lesson2Page />
                        </ProtectedRoute>
                      } />
                      <Route path="/lessons/lesson-2-2" element={
                        <ProtectedRoute>
                          <Lesson2Page2 />
                        </ProtectedRoute>
                      } />
                      <Route path="/lessons/lesson-3" element={
                        <ProtectedRoute>
                          <Lesson3Page />
                        </ProtectedRoute>
                      } />
                      <Route path="/lessons/lesson-3-2" element={
                        <ProtectedRoute>
                          <Lesson3Page2 />
                        </ProtectedRoute>
                      } />
                      <Route path="/lessons/lesson-4" element={
                        <ProtectedRoute>
                          <Lesson4Page />
                        </ProtectedRoute>
                      } />
                      <Route path="/lessons/lesson-4-2" element={
                        <ProtectedRoute>
                          <Lesson4Page2 />
                        </ProtectedRoute>
                      } />
                      <Route path="/lessons/lesson-5" element={
                        <ProtectedRoute>
                          <Lesson5Page />
                        </ProtectedRoute>
                      } />
                      <Route path="/lessons/lesson-5-2" element={
                        <ProtectedRoute>
                          <Lesson5Page2 />
                        </ProtectedRoute>
                      } />
                      <Route path="/lessons/lesson-6" element={
                        <ProtectedRoute>
                          <Lesson6Page />
                        </ProtectedRoute>
                      } />
                      <Route path="/lessons/lesson-6-2" element={
                        <ProtectedRoute>
                          <Lesson6Page2 />
                        </ProtectedRoute>
                      } />
                      <Route path="/compress-demo" element={
                        <ProtectedRoute>
                          <CompressImageDemo />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/image-compression" element={
                        <ProtectedRoute>
                          <ImageCompressionAdmin />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/image-optimizer" element={
                        <ProtectedRoute>
                          <ImageOptimizerAdmin />
                        </ProtectedRoute>
                      } />
                      <Route path="/aulas-complementares" element={<AulasComplementares />} />
                      <Route path="/secretaria" element={<SecretariaAulas />} />
                      <Route path="/become-a-tutor" element={<TutorRegistration />} />
                      <Route path="/horizons-flix" element={
                        <ProtectedRoute>
                          <HorizonsFlix />
                        </ProtectedRoute>
                      } />
                      <Route path="/horizons-flix/:programId" element={
                        <ProtectedRoute>
                          <FlixProgramDetail />
                        </ProtectedRoute>
                      } />
                      <Route path="/lesson-json-guide" element={<LessonJsonGuide />} />
                      <Route path="/superadmin" element={<SuperAdmin />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    </ErrorBoundary>
                    </BrowserRouter>
                  </AudioInputProvider>
                </LessonAudioProvider>
              </TooltipProvider>
            </PDFZoomProvider>
          </TeacherModeProvider>
        </AccentProvider>
      </LanguageProvider>
    </PhoneAuthProvider>
  </KrakenProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
