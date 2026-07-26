import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit2, Trash2, CheckCircle, Copy, BookOpen, BookMarked } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LoadingScreen from '@/components/LoadingScreen';
import BookModeScreen from '@/components/BookModeScreen';
import { useNavigate, useLocation } from 'react-router-dom';
import cursoCompletoIcon from '@/assets/curso-completo-icon.png';
import LessonEditorWizard from '@/components/lesson-editor/LessonEditorWizard';
import { useLessonEditor } from '@/hooks/useLessonEditor';
import { toast } from '@/hooks/use-toast';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import ComplementaryLessonsDisplay from '@/components/lesson-pages/ComplementaryLessonsDisplay';
import PNLConsultationPopup from '@/components/lesson-pages/PNLConsultationPopup';
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
} from '@/components/ui/alert-dialog';

interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  content: any;
}

interface CursoCompletoScreenProps {
  onBack: () => void;
}

const CursoCompletoScreen: React.FC<CursoCompletoScreenProps> = ({ onBack }) => {
  const location = useLocation();
  const navigate = useNavigate();
  // Restore the category the student was viewing before entering a lesson
  const initialCategoryFromState = (location.state as any)?.cursoCompletoCategory ?? null;
  const initialBookModeFromState = (location.state as any)?.cursoCompletoBookModeCategory ?? null;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategoryFromState);
  const [bookModeCategory, setBookModeCategory] = useState<string | null>(initialBookModeFromState);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [keySequence, setKeySequence] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [extractMode, setExtractMode] = useState(false);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [pnlConsultationLessonId, setPnlConsultationLessonId] = useState<string | null>(null);

  // Clear restored state from history so future visits start fresh
  useEffect(() => {
    if (initialCategoryFromState || initialBookModeFromState) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep edit mode state in sync with a ref (used in global key handler)
  const editModeRef = useRef(editMode);
  const extractModeRef = useRef(extractMode);
  useEffect(() => {
    editModeRef.current = editMode;
  }, [editMode]);
  useEffect(() => {
    extractModeRef.current = extractMode;
  }, [extractMode]);
  const lastToggleRef = useRef(0);
  
  const { deleteLesson } = useLessonEditor();
  const { isLessonComplete } = useLessonProgress();

  const categories = [
    {
      id: 'Iniciante',
      title: 'Curso Iniciante',
      description: 'Beginner to intermediate',
      color: 'bg-green-500'
    },
    {
      id: 'Intermediário',
      title: 'Curso Intermediário', 
      description: 'Intermediate to advanced',
      color: 'bg-blue-500'
    },
    {
      id: 'Avançado',
      title: 'Curso Avançado',
      description: 'Advanced grammar',
      color: 'bg-orange-500'
    },
    {
      id: 'Business',
      title: 'Curso Business',
      description: 'Para alunos de nível intermediário e avançado',
      color: 'bg-purple-500'
    }
  ];

  // IDs of lessons that are only accessible via PNL complementary lessons
  const PNL_COMPLEMENTARY_LESSON_IDS = [
    // Avançado Lesson 1-6 (linked to PNL Lessons 1-6)
    "Avançado_1764467250203",
    "Avançado_1764557245707",
    "Avançado_1764985870657",
    "Avançado_1768352688539",
    "Avançado_1768432281145",
    "Avançado_1768434850023",
    // Review 1-6 (linked to PNL Lessons 1-6)
    "Avançado_1768851427153",
    "Avançado_1768857326832",
    "Avançado_1768859476702",
    "Avançado_1768873122417",
    "Avançado_1768881224164",
    "Avançado_1768874580382",
  ];

  const fetchLessons = async (difficulty: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('difficulty', difficulty)
        .order('title');

      if (error) throw error;
      
      // Filter out PNL complementary lessons (only accessible via PNL menu)
      const filteredData = (data || []).filter(
        lesson => !PNL_COMPLEMENTARY_LESSON_IDS.includes(lesson.id)
      );
      
      // Sort lessons numerically by lesson number in title
      const sortedLessons = filteredData.sort((a, b) => {
        const numA = parseInt(a.title.match(/Lesson (\d+)/)?.[1] || '999');
        const numB = parseInt(b.title.match(/Lesson (\d+)/)?.[1] || '999');
        return numA - numB;
      });
      
      setLessons(sortedLessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  // Cheat code detection for lesson editor (robust against duplicate listeners)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (/^[a-zA-Z0-9]$/.test(event.key)) {
        setKeySequence((prev) => {
          const newSequence = (prev + event.key.toLowerCase()).slice(-7);
          console.log("🎹 Key sequence:", newSequence);

          if (newSequence === "abcdefg") {
            const now = Date.now();
            // Prevent rapid double toggles (e.g., if multiple instances/listeners fire)
            if (now - lastToggleRef.current < 500) return "";
            lastToggleRef.current = now;

            const next = !editModeRef.current;
            setEditMode(next);
            // Defer toast to the next frame to avoid render-phase warnings
            requestAnimationFrame(() => {
              toast({
                title: next ? "Modo de Edição Ativado! 🔧" : "Modo de Edição Desativado",
                description: next ? "Agora você pode editar e excluir lições." : "Voltou ao modo normal.",
              });
            });
            return ""; // reset sequence after activation
          }
          
          if (newSequence.endsWith("extract")) {
            const now = Date.now();
            if (now - lastToggleRef.current < 500) return "";
            lastToggleRef.current = now;

            const next = !extractModeRef.current;
            setExtractMode(next);
            requestAnimationFrame(() => {
              toast({
                title: next ? "Modo Extract Ativado! 📋" : "Modo Extract Desativado",
                description: next ? "Agora você pode extrair o JSON das lições." : "Voltou ao modo normal.",
              });
            });
            return "";
          }
          
          return newSequence;
        });
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchLessons(selectedCategory);
    }
  }, [selectedCategory]);

  const handleLessonClick = (lesson: Lesson) => {
    if (editMode) return; // Don't navigate when in edit mode
    navigate(`/lesson/${lesson.id}`, {
      state: {
        returnPath: '/curso-completo',
        selectedDifficulty: lesson.difficulty,
        cursoCompletoCategory: selectedCategory,
      }
    });
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson.id);
  };

  const handleCloseEditor = () => {
    setEditingLesson(null);
  };

  const handleEditorSave = () => {
    if (selectedCategory) {
      fetchLessons(selectedCategory); // Refresh lessons after save
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    const success = await deleteLesson(lessonId);
    if (success && selectedCategory) {
      fetchLessons(selectedCategory);
    }
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setLessons([]);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // Book Mode view
  if (bookModeCategory) {
    const category = categories.find(c => c.id === bookModeCategory);
    return (
      <BookModeScreen
        category={bookModeCategory}
        categoryTitle={category?.title || bookModeCategory}
        categoryColor={category?.color || 'bg-primary'}
        onBack={() => setBookModeCategory(null)}
      />
    );
  }

  if (selectedCategory) {
    const category = categories.find(c => c.id === selectedCategory);
    
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                size="icon"
                onClick={handleBackToCategories}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {category?.title}
                </h1>
              </div>
            </div>

            {lessons.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhuma lição encontrada para esta categoria.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {lessons.map((lesson) => {
                  const isCompleted = isLessonComplete(lesson.id, lesson.difficulty);
                  const hasComplementary = lesson.content?.complementaryLessonIds?.length > 0;
                  
                  return (
                    <div key={lesson.id} className="space-y-4">
                        <Card
                          className={`relative cursor-pointer transition-all hover:shadow-2xl hover:scale-[1.03] border-2 ${
                            isCompleted
                              ? "bg-gradient-to-br from-green-50 via-white to-emerald-50 border-green-200"
                              : "border-primary/30 hover:border-primary/60"
                          }`}
                          onClick={() => handleLessonClick(lesson)}
                          style={{ cursor: editMode ? 'default' : 'pointer' }}
                      >
                        {/* Completed indicator */}
                        {isCompleted && !editMode && (
                          <div className="absolute top-3 right-3 z-10">
                            <CheckCircle className="h-6 w-6 text-green-600 fill-green-100" />
                          </div>
                        )}
                        
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
                      
                      <CardHeader className="pb-3">
                        <CardTitle className="text-2xl font-bold">{lesson.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-end gap-2">
                          {/* PNL Consultation Button */}
                          {lesson.content?.pnlConsultationLessonId && (
                            <Button
                              size="lg"
                              variant="outline"
                              className="h-10 w-10 p-0 bg-gradient-to-br from-indigo-500 to-purple-600 border-0 text-white hover:from-indigo-600 hover:to-purple-700 shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPnlConsultationLessonId(lesson.content.pnlConsultationLessonId);
                              }}
                              title="Consultar vocabulário PNL"
                            >
                              <BookOpen className="h-5 w-5" />
                            </Button>
                          )}
                          {extractMode && (
                            <Button
                              size="lg"
                              variant="outline"
                              className="px-4"
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
                              <Copy className="h-4 w-4 mr-2" />
                              Extract JSON
                            </Button>
                          )}
                          <Button size="lg" className="px-8">
                            Iniciar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Complementary Lessons Display */}
                    {hasComplementary && !editMode && (
                      <div className="ml-2 pl-2 md:ml-6 md:pl-4 border-l border-muted/40">
                        <ComplementaryLessonsDisplay 
                          lessonIds={lesson.content.complementaryLessonIds}
                          currentLessonId={lesson.id}
                          returnPath="/curso-completo"
                          cursoCompletoCategory={selectedCategory}
                          showLessonTitles
                        />
                      </div>
                    )}
                    </div>
                    );
                })}
              </div>
            )}
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Curso Completo
            </h1>
            <p className="text-muted-foreground mt-1">
              Escolha seu nível e comece a aprender
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {categories.map((category) => {
            return (
              <Card
                key={category.id}
                className="transition-all hover:shadow-lg hover:scale-[1.02] group overflow-hidden"
              >
                <div className={`h-2 ${category.color}`} />
                <CardHeader className="text-center pb-4">
                  <div className={`w-20 h-20 mx-auto rounded-full ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform p-3`}>
                    <img 
                      src={category.id === 'Business' 
                        ? '/lovable-uploads/e85a76b3-d1d4-41b2-9695-c38f8c500b41.png' 
                        : cursoCompletoIcon
                      } 
                      alt="Curso" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <CardTitle className="text-2xl mb-2">{category.title}</CardTitle>
                  <CardDescription className="text-base">{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-0 space-y-2">
                  <Button className="w-full" size="lg" onClick={() => setSelectedCategory(category.id)}>
                    Explorar Curso
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBookModeCategory(category.id);
                    }}
                  >
                    <BookMarked className="h-4 w-4 mr-2" />
                    Modo Livro
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CursoCompletoScreen;