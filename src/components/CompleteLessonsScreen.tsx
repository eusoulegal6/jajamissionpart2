import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Play, BookOpen, CheckCircle, User, LogOut, Video, Headphones, Edit2, Trash2, Save, X, Copy, BookMarked } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import DifficultySelectionScreen from "./DifficultySelectionScreen";

import { supabase } from "@/integrations/supabase/client";
import { getLessonIcon } from "@/utils/lessonIconUtils";
import { orderLessons } from "@/utils/lessonOrderingUtils";
import { Lesson } from "@/types/lesson";
import { usePhoneAuth } from "@/contexts/PhoneAuthContext";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { useLanguage } from "@/contexts/LanguageContext";
import TipScreen from "./chat/TipScreen";
import LessonEditorWizard from "./lesson-editor/LessonEditorWizard";
import { useLessonEditor } from "@/hooks/useLessonEditor";
import { toast } from "@/hooks/use-toast";
import PNLConsultationPopup from "./lesson-pages/PNLConsultationPopup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


const CompleteLessonsScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = usePhoneAuth();
  const { isLessonComplete, getCompletionStats } = useLessonProgress();
  const { learningLanguage, t } = useLanguage();
  
  // Check if we're returning from a lesson with a pre-selected difficulty
  const preSelectedDifficulty = location.state?.selectedDifficulty;
  
  const [selectedDifficulty, setSelectedDifficulty] = useState<"Fácil" | "Médio" | "Difícil" | "PNL" | "Fluente" | null>(
    preSelectedDifficulty || null
  );
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedType, setSelectedType] = useState<"all" | "video" | "headphone" | "text">(() => {
    const savedType = sessionStorage.getItem('completeLessonsSelectedType');
    return (savedType as "all" | "video" | "headphone" | "text") || "all";
  });
  const [showTip, setShowTip] = useState(() => {
    const hasSeenTip = sessionStorage.getItem('seenCompleteLessonsTip');
    return !hasSeenTip;
  });
  const [showLessonEditor, setShowLessonEditor] = useState(false);
  const [keySequence, setKeySequence] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [extractMode, setExtractMode] = useState(false);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [pnlConsultationLessonId, setPnlConsultationLessonId] = useState<string | null>(null);
  
  // Keep mode states in refs to avoid stale closures in event handlers
  const editModeRef = React.useRef(editMode);
  const extractModeRef = React.useRef(extractMode);
  React.useEffect(() => { editModeRef.current = editMode; }, [editMode]);
  React.useEffect(() => { extractModeRef.current = extractMode; }, [extractMode]);
  
  const { deleteLesson } = useLessonEditor();

  const handleProceedFromTip = () => {
    sessionStorage.setItem('seenCompleteLessonsTip', 'true');
    setShowTip(false);
  };

  // Cheat code detection for lesson editor
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.match(/^[a-zA-Z0-9]$/)) {
        setKeySequence(prev => {
          const newSequence = (prev + event.key.toLowerCase()).slice(-7);
          console.log("🎹 Key sequence:", newSequence);
          
          if (newSequence === "abcdefg") {
            console.log("🔧 EDIT MODE ACTIVATED!");
            const next = !editModeRef.current;
            setEditMode(next);
            setKeySequence("");
            
            toast({
              title: next ? "Modo de Edição Ativado! 🔧" : "Modo de Edição Desativado",
              description: next ? "Agora você pode editar e excluir lições." : "Voltou ao modo normal.",
            });
          }
          
          if (newSequence.endsWith("extract")) {
            console.log("📋 EXTRACT MODE ACTIVATED!");
            const next = !extractModeRef.current;
            setExtractMode(next);
            setKeySequence("");
            
            toast({
              title: next ? "Modo Extract Ativado! 📋" : "Modo Extract Desativado",
              description: next ? "Agora você pode extrair o JSON das lições." : "Voltou ao modo normal.",
            });
          }
          
          return newSequence;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    // Show auth modal if not authenticated and user tries to access lessons
    if (selectedDifficulty && !isAuthenticated) {
      setShowAuthModal(true);
      setSelectedDifficulty(null);
    }
  }, [selectedDifficulty, isAuthenticated]);

  useEffect(() => {
    if (selectedDifficulty && isAuthenticated) {
      fetchLessons();
    }
  }, [selectedDifficulty, isAuthenticated, learningLanguage]);

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleBackToDifficulty = () => {
    setSelectedDifficulty(null);
    setLessons([]);
    // Clear the selected type filter when going back
    setSelectedType("all");
    sessionStorage.removeItem('completeLessonsSelectedType');
    // Clear the navigation state when going back to difficulty selection
    navigate("/complete-lessons", { replace: true });
  };

  const handleDifficultySelect = (difficulty: "Fácil" | "Médio" | "Difícil" | "PNL" | "Fluente") => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setSelectedDifficulty(difficulty);
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (editMode) return; // Don't navigate when in edit mode
    console.log("Starting lesson:", lesson.id);
    navigate("/lesson-runner", { 
      state: { 
        // Remove lesson data to force fresh database load
        selectedDifficulty: selectedDifficulty,
        lessonId: lesson.id,
        returnPath: "/complete-lessons"
      } 
    });
  };

  const fetchLessons = async () => {
    if (!selectedDifficulty || !isAuthenticated) return;
    
    console.log("Fetching lessons from Supabase for language:", learningLanguage);
    setLoading(true);
    
    try {
      const tableName = learningLanguage === 'es' ? 'lessons_spanish' : 'lessons';
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("difficulty", selectedDifficulty);

      if (error) {
        console.error("Error fetching lessons:", error);
        setLessons([]);
      } else {
        console.log(`Found ${data?.length || 0} lessons`);
        const orderedLessons = orderLessons(data || [], selectedDifficulty);
        setLessons(orderedLessons);
      }
    } catch (error) {
      console.error("Unexpected error fetching lessons:", error);
      setLessons([]);
    }
    setLoading(false);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson.id);
  };

  const handleCloseEditor = () => {
    setEditingLesson(null);
  };

  const handleEditorSave = () => {
    fetchLessons(); // Refresh lessons after save
  };

  const handleDeleteLesson = async (lessonId: string) => {
    const tableName = learningLanguage === 'es' ? 'lessons_spanish' : 'lessons';
    const success = await deleteLesson(lessonId, tableName as any);
    if (success) {
      fetchLessons();
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Show difficulty selection after successful auth
  };

  const handleLogout = () => {
    logout();
    setSelectedDifficulty(null);
    setLessons([]);
    navigate("/complete-lessons", { replace: true });
  };

  // Helper function to get lesson type based on description
  const getLessonType = (description: string): "video" | "headphone" | "text" => {
    if (description.toLowerCase() === "video") {
      return "video";
    }
    if (description.toLowerCase().includes("headphone")) {
      return "headphone";
    }
    return "text";
  };

  // Filter lessons based on selected type
  const filteredLessons = selectedType === "all" 
    ? lessons 
    : lessons.filter(lesson => getLessonType(lesson.description) === selectedType);

  if (showTip && !selectedDifficulty) {
    return <TipScreen onProceed={handleProceedFromTip} />;
  }


  if (!selectedDifficulty) {
    const stats = getCompletionStats("Fácil");
    return (
      <>
        <DifficultySelectionScreen 
          onDifficultySelect={handleDifficultySelect}
          userInfo={user}
          onLogout={handleLogout}
        />
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="bg-white border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBackToDifficulty}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('voltar')}
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-semibold">{t('licoes_header')} - {selectedDifficulty}</h1>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">{t('carregando_licoes')}</p>
          </div>
      </div>

      {/* Lesson Editor Wizard */}
      {editingLesson && (
        <LessonEditorWizard
          lessonId={editingLesson}
          onClose={handleCloseEditor}
          onSave={handleEditorSave}
        />
      )}
    </div>
  );
  }

  const completionStats = getCompletionStats(selectedDifficulty);
  const progressPercentage =
    lessons.length > 0 ? (completionStats.completed / lessons.length) * 100 : 0;

  return (
    <>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBackToDifficulty}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('voltar')}
            </Button>
            <div className="text-center flex-1 max-w-md mx-4">
              <h1 className="text-xl font-semibold">
                {t('licoes_header')} - {selectedDifficulty}
              </h1>
              {lessons.length > 0 && (
                <Progress value={progressPercentage} className="h-2 w-full" />
              )}
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">

            {/* Type Filter */}
            {lessons.length > 0 && (
              <div className="mb-8 p-4 bg-white rounded-lg border shadow-sm">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-medium text-gray-700">{t('tipo_filtro')}</span>
                  <div className="flex gap-2 flex-wrap">
                     <Button
                      variant={selectedType === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedType("all");
                        sessionStorage.setItem('completeLessonsSelectedType', "all");
                      }}
                      className="text-sm"
                    >
                      {t('todos')}
                    </Button>
                    <Button
                      variant={selectedType === "video" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedType("video");
                        sessionStorage.setItem('completeLessonsSelectedType', "video");
                      }}
                      className="flex items-center gap-2 text-sm"
                    >
                       <Video className="h-4 w-4" />
                       {t('video_filtro')}
                    </Button>
                    <Button
                      variant={selectedType === "headphone" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedType("headphone");
                        sessionStorage.setItem('completeLessonsSelectedType', "headphone");
                      }}
                      className="flex items-center gap-2 text-sm"
                    >
                       <Headphones className="h-4 w-4" />
                       {t('audio_filtro')}
                    </Button>
                    <Button
                      variant={selectedType === "text" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedType("text");
                        sessionStorage.setItem('completeLessonsSelectedType', "text");
                      }}
                      className="flex items-center gap-2 text-sm"
                    >
                       <BookOpen className="h-4 w-4" />
                       {t('texto_filtro')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {/* Lessons List */}
            {lessons.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('nenhuma_licao')}
                </h3>
                <p className="text-gray-600">
                  {t('nenhuma_licao_desc')}
                </p>
              </div>
            ) : filteredLessons.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('nenhuma_licao')}
                </h3>
                <p className="text-gray-600">
                  {t('nenhuma_licao_tipo')}
                </p>
              </div>
            ) : (
              <div>
                {/* Lessons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLessons.map((lesson) => {
                    const IconComponent = getLessonIcon(lesson.description);
                    const isCompleted = isLessonComplete(lesson.id, selectedDifficulty);
                    return (
                      <Card
                        key={lesson.id}
                        className={`group relative cursor-pointer overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 ${
                          isCompleted
                            ? "bg-gradient-to-br from-green-50 via-white to-emerald-50"
                            : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"
                        }`}
                        onClick={() => editMode ? undefined : handleLessonClick(lesson)}
                        style={{ cursor: editMode ? 'default' : 'pointer' }}
                      >
                        {/* Edit mode buttons */}
                        {editMode && (
                          <div className="absolute top-3 left-3 z-20 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditLesson(lesson);
                              }}
                              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-8 w-8 p-0 bg-white/90 hover:bg-red-50 border-red-200 text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Lição</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir a lição "{lesson.title}"? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteLesson(lesson.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                        
                        {/* Completed indicator */}
                        {isCompleted && !editMode && (
                          <div className="absolute top-3 right-3 z-10">
                            <CheckCircle className="h-6 w-6 text-green-600 fill-green-100" />
                          </div>
                        )}
                        {/* Subtle gradient overlay */}
                        <div
                          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                            isCompleted
                              ? "bg-gradient-to-br from-green-500/5 to-emerald-500/10"
                              : "bg-gradient-to-br from-blue-500/5 to-indigo-500/10"
                          }`}
                        />
                        <CardHeader className="relative pb-2 pt-6">
                          <CardTitle
                            className={`text-lg font-bold line-clamp-2 flex items-start gap-3 transition-colors duration-200 ${
                              isCompleted
                                ? "text-gray-900 group-hover:text-green-900"
                                : "text-gray-900 group-hover:text-blue-900"
                            }`}
                          >
                            <IconComponent
                              className={`h-6 w-6 flex-shrink-0 mt-0.5 transition-colors duration-200 ${
                                isCompleted
                                  ? "text-green-600 group-hover:text-green-700"
                                  : "text-blue-600 group-hover:text-blue-700"
                              }`}
                            />
                            <span className="flex-1">{lesson.title}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="relative pt-2 pb-6">
                          {/* Interactive indicator */}
                          <div className="flex items-center justify-end gap-2">
                            {extractMode && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="px-3"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const jsonStr = JSON.stringify(lesson, null, 2);
                                  navigator.clipboard.writeText(jsonStr);
                                  toast({
                                    title: "JSON Copiado! 📋",
                                    description: `Lição "${lesson.title}" copiada para o clipboard.`,
                                  });
                                }}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Extract
                              </Button>
                            )}
                            {/* PNL Consultation Button */}
                            {lesson.content?.pnlConsultationLessonId && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 bg-gradient-to-br from-indigo-500 to-purple-600 border-0 text-white hover:from-indigo-600 hover:to-purple-700 shadow-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPnlConsultationLessonId(lesson.content.pnlConsultationLessonId);
                                }}
                                title="Consultar vocabulário"
                              >
                                <BookMarked className="h-4 w-4" />
                              </Button>
                            )}
                            <div className="flex items-center gap-2">
                              <Play
                                className={`h-4 w-4 transition-all duration-200 group-hover:translate-x-1 ${
                                  isCompleted
                                    ? "text-green-500 group-hover:text-green-600"
                                    : "text-blue-500 group-hover:text-blue-600"
                                }`}
                              />
                              <div
                                className={`w-8 h-0.5 transition-colors duration-200 ${
                                  isCompleted
                                    ? "bg-green-200 group-hover:bg-green-300"
                                    : "bg-blue-200 group-hover:bg-blue-300"
                                }`}
                              />
                            </div>
                          </div>
                          </CardContent>
                        {/* Border accent */}
                        <div
                          className={`absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${
                            isCompleted
                              ? "bg-gradient-to-r from-green-500 to-emerald-500"
                              : "bg-gradient-to-r from-blue-500 to-indigo-500"
                          }`}
                        />
                      </Card>
                    );
                  })}
                </div>

                {/* Create More Lessons Button */}
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      const isEnglishDifficulty = selectedDifficulty === "Difícil" || selectedDifficulty === "Fluente" || selectedDifficulty === "PNL";
                      
                      const difficultyMessages = {
                        "Fácil": "Nível fácil, alunos A1-A2",
                        "Médio": "nível A2-B1",
                        "Difícil": "B2",
                        "Fluente": "fluente",
                        "PNL": "fluente"
                      };
                      
                      const difficultyText = difficultyMessages[selectedDifficulty as keyof typeof difficultyMessages] || selectedDifficulty;
                      
                      const message = isEnglishDifficulty
                        ? `Create an ESL lesson with texts, true or false questions and conversation questions. Before creating the lesson, give me five theme options to choose from. And also give me the option to write the theme I would like myself. The difficulty level should be ${difficultyText}.`
                        : `Crie uma lição ESL com textos, perguntas true or false e perguntas de conversação. Antes de criar a lição, me dê cinco opções de temas para escolher. E me de também a opção de eu mesmo escrever o tema que gostaria. A dificuldade vai ser ${difficultyText}.`;
                      
                      // Save current state to sessionStorage
                      sessionStorage.setItem('appReturnState', JSON.stringify({
                        currentMode: 'specialist',
                        chatHistory: [],
                        inputMessage: '',
                        selectedDifficulty: selectedDifficulty,
                        autoSendMessage: message
                      }));
                      
                      navigate('/', { 
                        state: { 
                          restoreConversation: true,
                          fromCompleteLessons: true
                        } 
                      });
                    }}
                    className="flex items-center gap-2 text-base"
                  >
                    {(selectedDifficulty === "Difícil" || selectedDifficulty === "Fluente" || selectedDifficulty === "PNL")
                      ? "Want more lessons? Click here"
                      : "Quer mais lições? Clique aqui"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Exit edit mode floating button */}
      {editMode && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            variant="destructive"
            onClick={() => {
              setEditMode(false);
              toast({
                title: "Modo de Edição Desativado",
                description: "Voltou ao modo normal.",
              });
            }}
            className="shadow-lg"
            aria-label="Sair do modo de edição"
          >
            <X className="h-4 w-4 mr-2" />
            Sair do modo de edição
          </Button>
        </div>
      )}
      
      {/* Lesson Editor Wizard */}
      {editingLesson && (
        <LessonEditorWizard
          lessonId={editingLesson}
          onClose={handleCloseEditor}
          onSave={handleEditorSave}
        />
      )}

      {/* PNL Consultation Popup */}
      {pnlConsultationLessonId && (
        <PNLConsultationPopup
          isOpen={!!pnlConsultationLessonId}
          onClose={() => setPnlConsultationLessonId(null)}
          lessonId={pnlConsultationLessonId}
        />
      )}
    </>
  );
};

export default CompleteLessonsScreen;
