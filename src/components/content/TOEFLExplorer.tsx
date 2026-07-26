import React, { useState, useEffect } from 'react';
import { useTOEFLCategories, useTOEFLChapters, useTOEFLItems, useTOEFLItemsByCategory } from '@/hooks/useTOEFLContent';
import { useTOEFLProgress } from '@/hooks/useTOEFLProgress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, ChevronRight, Edit2, Trash2, X, CheckCircle, Circle, Headphones, Mic, PenTool } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNavigate, useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import LessonEditorWizard from '@/components/lesson-editor/LessonEditorWizard';

const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4 md:p-6">
        {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        ))}
    </div>
);

const TOEFLItemListView = (
  { categoryId, chapter, onBack, isEmbedded, editMode, onEditItem, onDeleteItem }:
  { categoryId: string; chapter: any; onBack: () => void; isEmbedded?: boolean; editMode: boolean; onEditItem: (item: any) => void; onDeleteItem: (item: any) => void }
) => {
    const navigate = useNavigate();
    const { data: items, isLoading } = useTOEFLItems(chapter.id);
    const { isTOEFLItemComplete, toggleTOEFLItemCompletion } = useTOEFLProgress();

    const handleItemClick = (item: any) => {
        if (editMode) return;
        
        let lessonPages: any[] = [];

        if (Array.isArray(item.content)) {
            lessonPages = item.content;
        } else if (item.content && typeof item.content === 'object') {
            if ((item.content as any).pages && Array.isArray((item.content as any).pages)) {
                lessonPages = (item.content as any).pages;
            } else if ((item.content as any).type) {
                lessonPages = [item.content];
            } else if (Object.keys(item.content).length === 0) {
                lessonPages = [{
                    type: "content",
                    title: item.title,
                    content: "This lesson content is being prepared."
                }];
            }
        }

        if (!lessonPages || lessonPages.length === 0) {
            console.error("TOEFL item does not contain valid lesson pages:", item);
            return;
        }
        
        const returnPath = isEmbedded ? '/' : `/toefl/${categoryId}/${chapter.id}`;
        
        navigate('/lesson-runner', { 
            state: { 
                lesson: lessonPages,
                lessonId: item.id,
                selectedDifficulty: 'Médio',
                returnPath, 
                isTOEFLLesson: true,
            } 
        });
    };

    const handleToggleCompletion = async (e: React.MouseEvent, itemId: string) => {
        e.stopPropagation();
        const success = await toggleTOEFLItemCompletion(itemId);
        if (success) {
            const isNowComplete = isTOEFLItemComplete(itemId);
            toast({
                title: isNowComplete ? "Lição marcada como completa!" : "Lição desmarcada",
                description: isNowComplete ? "Você pode continuar com a próxima lição." : "A lição foi removida das completas.",
            });
        }
    };
    
    return (
        <div>
            <Header title={chapter.title} onBack={onBack} />
            {isLoading ? <LoadingSkeleton /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4 md:p-6">
                    {items?.map(item => {
                        const isCompleted = isTOEFLItemComplete(item.id);
                        return (
                        <Card 
                          key={item.id} 
                          className={`group relative cursor-pointer hover:shadow-lg transition-shadow ${
                            isCompleted ? 'ring-2 ring-green-500 bg-green-50' : ''
                          }`}
                          onClick={() => handleItemClick(item)}
                          style={{ cursor: editMode ? 'default' : 'pointer' }}
                        >
                            {editMode && (
                              <div className="absolute top-3 left-3 z-20 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    console.log('🔧 Edit button onClick triggered (ItemListView)');
                                    e.stopPropagation();
                                    onEditItem(item);
                                  }}
                                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                                  aria-label="Editar item TOEFL"
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
                                      aria-label="Excluir item TOEFL"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir Item TOEFL</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir "{item.title}"? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => onDeleteItem(item)} className="bg-red-600 hover:bg-red-700">
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}

                            {/* Completion toggle button - always visible */}
                            <div className="absolute top-3 right-3 z-20">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => handleToggleCompletion(e, item.id)}
                                className={`h-8 w-8 p-0 bg-white/90 hover:bg-white border-2 transition-colors ${
                                  isCompleted 
                                    ? 'border-green-500 text-green-600 bg-green-50' 
                                    : 'border-gray-300 text-gray-400 hover:border-green-400 hover:text-green-500'
                                }`}
                                aria-label={isCompleted ? "Marcar como incompleta" : "Marcar como completa"}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="h-4 w-4 fill-current" />
                                ) : (
                                  <Circle className="h-4 w-4" />
                                )}
                              </Button>
                            </div>

                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    {categoryId === 'listening' ? (
                                        <Headphones className={`h-5 w-5 ${isCompleted ? 'text-green-500' : 'text-blue-500'}`} />
                                    ) : categoryId === 'speaking' ? (
                                        <Mic className={`h-5 w-5 ${isCompleted ? 'text-green-500' : 'text-blue-500'}`} />
                                    ) : categoryId === 'writing' ? (
                                        <PenTool className={`h-5 w-5 ${isCompleted ? 'text-green-500' : 'text-blue-500'}`} />
                                    ) : (
                                        <BookOpen className={`h-5 w-5 ${isCompleted ? 'text-green-500' : 'text-blue-500'}`} />
                                    )}
                                    <span className={isCompleted ? 'text-green-700' : ''}>{item.title}</span>
                                    {isCompleted && (
                                      <CheckCircle className="h-4 w-4 text-green-500 fill-current ml-auto" />
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className={`text-sm line-clamp-2 ${isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                                  {(item.content as any)?.description}
                                </p>
                            </CardContent>
                        </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const TOEFLChapterListView = ({ category, onBack }: { category: any, onBack: () => void }) => {
    const { data: chapters, isLoading } = useTOEFLChapters(category.id);
    const navigate = useNavigate();

    const handleSelectChapter = (chapter: any) => {
        navigate(`/toefl/${category.id}/${chapter.id}`);
    };

    return (
        <div>
            <Header title={category.name} onBack={onBack} />
            {isLoading ? <LoadingSkeleton /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4 md:p-6">
                    {chapters?.map(chapter => (
                        <Card key={chapter.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleSelectChapter(chapter)}>
                            <CardHeader>
                                <CardTitle>{chapter.title}</CardTitle>
                                {chapter.description && <CardDescription>{chapter.description}</CardDescription>}
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <span>Ver itens</span>
                                    <ChevronRight className="h-4 w-4" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

const TOEFLCategoryItemsView = ({ category, onBack, editMode, onEditItem, onDeleteItem }: { category: any, onBack: () => void, editMode: boolean, onEditItem: (item: any) => void, onDeleteItem: (item: any) => void }) => {
    const navigate = useNavigate();
    const { data: items, isLoading } = useTOEFLItemsByCategory(category.id);
    const { isTOEFLItemComplete, toggleTOEFLItemCompletion } = useTOEFLProgress();

    const handleItemClick = (item: any) => {
        if (editMode) return;
        
        let lessonPages: any[] = [];

        if (Array.isArray(item.content)) {
            lessonPages = item.content;
        } else if (item.content && typeof item.content === 'object') {
            if ((item.content as any).pages && Array.isArray((item.content as any).pages)) {
                lessonPages = (item.content as any).pages;
            } else if ((item.content as any).type) {
                lessonPages = [item.content];
            } else if (Object.keys(item.content).length === 0) {
                lessonPages = [{
                    type: "content",
                    title: item.title,
                    content: "This lesson content is being prepared."
                }];
            }
        }

        if (!lessonPages || lessonPages.length === 0) {
            console.error("TOEFL item does not contain valid lesson pages:", item);
            return;
        }
        
        const returnPath = `/toefl/${category.id}`;
        
        navigate('/lesson-runner', { 
            state: { 
                lesson: lessonPages,
                lessonId: item.id,
                selectedDifficulty: 'Médio',
                returnPath, 
                isTOEFLLesson: true,
            } 
        });
    };

    const handleToggleCompletion = async (e: React.MouseEvent, itemId: string) => {
        e.stopPropagation();
        const success = await toggleTOEFLItemCompletion(itemId);
        if (success) {
            const isNowComplete = isTOEFLItemComplete(itemId);
            toast({
                title: isNowComplete ? "Lição marcada como completa!" : "Lição desmarcada",
                description: isNowComplete ? "Você pode continuar com a próxima lição." : "A lição foi removida das completas.",
            });
        }
    };

    return (
        <div>
            <Header title={category.name} onBack={onBack} />
            {isLoading ? <LoadingSkeleton /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4 md:p-6">
                    {items?.map(item => {
                        const isCompleted = isTOEFLItemComplete(item.id);
                        return (
                        <Card 
                          key={item.id} 
                          className={`group relative cursor-pointer hover:shadow-lg transition-shadow ${
                            isCompleted ? 'ring-2 ring-green-500 bg-green-50' : ''
                          }`}
                          onClick={() => handleItemClick(item)}
                          style={{ cursor: editMode ? 'default' : 'pointer' }}
                        >
                            {editMode && (
                              <div className="absolute top-3 left-3 z-20 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    console.log('🔧 Edit button onClick triggered');
                                    e.stopPropagation();
                                    onEditItem(item);
                                  }}
                                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                                  aria-label="Editar item TOEFL"
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
                                      aria-label="Excluir item TOEFL"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir Item TOEFL</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir "{item.title}"? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => onDeleteItem(item)} className="bg-red-600 hover:bg-red-700">
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}


                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    {category.id === 'listening' ? (
                                        <Headphones className={`h-5 w-5 ${isCompleted ? 'text-green-500' : 'text-blue-500'}`} />
                                    ) : category.id === 'speaking' ? (
                                        <Mic className={`h-5 w-5 ${isCompleted ? 'text-green-500' : 'text-blue-500'}`} />
                                    ) : category.id === 'writing' ? (
                                        <PenTool className={`h-5 w-5 ${isCompleted ? 'text-green-500' : 'text-blue-500'}`} />
                                    ) : (
                                        <BookOpen className={`h-5 w-5 ${isCompleted ? 'text-green-500' : 'text-blue-500'}`} />
                                    )}
                                    <span className={isCompleted ? 'text-green-700' : ''}>{item.title}</span>
                                    {isCompleted && (
                                      <CheckCircle className="h-4 w-4 text-green-500 fill-current ml-auto" />
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className={`text-sm line-clamp-2 ${isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                                  {(item.content as any)?.description}
                                </p>
                            </CardContent>
                        </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const TOEFLCategoryListView = ({ onBack }: { onBack: () => void }) => {
    const { data: categories, isLoading } = useTOEFLCategories();
    const navigate = useNavigate();

    const handleSelectCategory = (category: any) => {
        navigate(`/toefl/${category.id}`);
    };

    return (
        <div>
            <Header title="TOEFL Preparation" onBack={onBack} />
            {isLoading ? <LoadingSkeleton /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4 md:p-6">
                    {categories?.map(category => (
                        <Card key={category.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleSelectCategory(category)}>
                            <CardHeader>
                                <CardTitle>{category.name}</CardTitle>
                                {category.description && <CardDescription>{category.description}</CardDescription>}
                            </CardHeader>
                            <CardContent>
                               <div className="flex justify-end items-center text-sm text-gray-500">
                                    <ChevronRight className="h-4 w-4" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

const Header = ({ title, onBack }: { title: string, onBack: () => void }) => {
    return (
        <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
            <div className="flex items-center">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mr-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </Button>
                <h1 className="text-xl font-semibold truncate">{title}</h1>
            </div>
        </div>
    );
};

const TOEFLExplorer = ({ onBack, isEmbedded }: { onBack: () => void; isEmbedded?: boolean }) => {
    const { categoryId, chapterId } = useParams<{ categoryId: string; chapterId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const embedded = isEmbedded ?? false;
    
    const [editMode, setEditMode] = useState(false);
    const [keySequence, setKeySequence] = useState("");
    const [editorOpen, setEditorOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    
    console.log('🔧 TOEFLExplorer state:', { editMode, editorOpen, selectedItem: selectedItem?.id });
    
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key.match(/^[a-zA-Z0-9]$/)) {
                setKeySequence(prev => {
                    const newSequence = (prev + event.key.toLowerCase()).slice(-7);
                    
                    if (newSequence === "abcdefg") {
                        setEditMode((prevMode) => {
                          const next = !prevMode;
                          console.log('🔧 Edit mode toggled:', next);
                          toast({
                            title: next ? "Modo de Edição Ativado! 🔧" : "Modo de Edição Desativado",
                            description: next ? "Toque no lápis para editar ou na lixeira para excluir." : "Voltou ao modo normal.",
                          });
                          return next;
                        });
                        setKeySequence("");
                    }
                    return newSequence;
                });
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    const handleDeleteTOEFLItem = async (item: any) => {
      try {
        const { error } = await supabase
          .from('toefl_items')
          .delete()
          .eq('id', item.id);
        if (error) throw error;
        
        // Invalidate both chapter-based and category-based queries
        await queryClient.invalidateQueries({ queryKey: ['toefl_items', item.chapter_id] });
        await queryClient.invalidateQueries({ queryKey: ['toefl_items_by_category', item.category_id] });
        toast({ title: 'Item excluído', description: 'Item TOEFL removido com sucesso.' });
      } catch (err) {
        console.error('Error deleting TOEFL item:', err);
        toast({ title: 'Erro', description: 'Não foi possível excluir o item.', variant: 'destructive' });
      }
    };

    const handleEditTOEFLItem = (item: any) => {
      console.log('🔧 Edit button clicked for item:', item);
      console.log('🔧 Current editMode:', editMode);
      console.log('🔧 Setting selectedItem and opening editor...');
      setSelectedItem(item);
      setEditorOpen(true);
    };

    const handleSaveSuccess = () => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['toefl_items'] });
      queryClient.invalidateQueries({ queryKey: ['toefl_items_by_category'] });
      setEditorOpen(false);
      setSelectedItem(null);
    };

    const { data: categories, isLoading: categoriesLoading } = useTOEFLCategories();
    const { data: chapters, isLoading: chaptersLoading } = useTOEFLChapters(categoryId!);

    if (categoryId && chapterId) {
        if (chaptersLoading) return <LoadingSkeleton />;
        const chapter = chapters?.find(c => c.id === chapterId);
        if (!chapter) {
             return (
                <div className="p-4">
                    <Header title="Erro" onBack={() => navigate(`/toefl/${categoryId}`)} />
                    <p>Capítulo não encontrado.</p>
                </div>
             );
        }
        return (
            <>
                <TOEFLItemListView 
                  categoryId={categoryId} 
                  chapter={chapter} 
                  onBack={() => embedded ? onBack() : navigate(`/toefl/${categoryId}`)} 
                  isEmbedded={embedded}
                  editMode={editMode}
                  onEditItem={handleEditTOEFLItem}
                  onDeleteItem={handleDeleteTOEFLItem}
                />
                {editMode && (
                  <div className="fixed bottom-4 right-4 z-50">
                    <Button
                      variant="destructive"
                      onClick={() => setEditMode(false)}
                      className="shadow-lg"
                      aria-label="Sair do modo de edição"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Sair do modo de edição
                    </Button>
                  </div>
                )}
                
                {editorOpen && selectedItem && (
                  <LessonEditorWizard
                    lessonId={selectedItem.id}
                    onClose={() => {
                      setEditorOpen(false);
                      setSelectedItem(null);
                    }}
                    onSave={handleSaveSuccess}
                  />
                )}
            </>
        );
    }

    if (categoryId) {
        if (categoriesLoading) return <LoadingSkeleton />;
        const category = categories?.find(c => c.id === categoryId);
        if (!category) {
            return (
                <div className="p-4">
                    <Header title="Erro" onBack={() => navigate('/toefl')} />
                    <p>Categoria não encontrada.</p>
                </div>
            );
        }
        return (
            <>
                <TOEFLCategoryItemsView 
                  category={category} 
                  onBack={() => embedded ? onBack() : navigate('/toefl')} 
                  editMode={editMode}
                  onEditItem={handleEditTOEFLItem}
                  onDeleteItem={handleDeleteTOEFLItem}
                />
                {editMode && (
                  <div className="fixed bottom-4 right-4 z-50">
                    <Button
                      variant="destructive"
                      onClick={() => setEditMode(false)}
                      className="shadow-lg"
                      aria-label="Sair do modo de edição"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Sair do modo de edição
                    </Button>
                  </div>
                )}
                
                {editorOpen && selectedItem && (
                  <LessonEditorWizard
                    lessonId={selectedItem.id}
                    onClose={() => {
                      setEditorOpen(false);
                      setSelectedItem(null);
                    }}
                    onSave={handleSaveSuccess}
                  />
                )}
            </>
        );
    }

    return (
        <>
            <TOEFLCategoryListView onBack={onBack} />
            {editMode && (
              <div className="fixed bottom-4 right-4 z-50">
                <Button
                  variant="destructive"
                  onClick={() => setEditMode(false)}
                  className="shadow-lg"
                  aria-label="Sair do modo de edição"
                >
                  <X className="h-4 w-4 mr-2" />
                  Sair do modo de edição
                </Button>
              </div>
            )}
            
            {editorOpen && selectedItem && (
              <LessonEditorWizard
                lessonId={selectedItem.id}
                onClose={() => {
                  setEditorOpen(false);
                  setSelectedItem(null);
                }}
                onSave={handleSaveSuccess}
              />
            )}
        </>
    );
};

export default TOEFLExplorer;