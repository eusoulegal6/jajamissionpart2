
import React, { useState, useEffect } from 'react';
import { useContentCategories, useContentChapters, useContentItems } from '@/hooks/useContent';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, ChevronRight, Edit2, Trash2, X, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNavigate, useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { buildContentReturnPath } from '@/utils/contentNavigation';
import ContentItemEditorWizard from '../lesson-editor/ContentItemEditorWizard';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

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

const ItemListView = (
  { categoryId, chapter, onBack, isEmbedded, editMode, onEditItem, onDeleteItem }:
  { categoryId: string; chapter: any; onBack: () => void; isEmbedded?: boolean; editMode: boolean; onEditItem: (item: any) => void; onDeleteItem: (item: any) => void }
) => {
    const navigate = useNavigate();
    const { data: items, isLoading } = useContentItems(chapter.id);

    const handleItemClick = (item: any) => {
        if (editMode) return; // Disable navigation in edit mode
        console.log('ContentExplorer - handleItemClick called with isEmbedded:', isEmbedded);
        
        let lessonPages: any[] = [];

        // Handle different content formats
        if (Array.isArray(item.content)) {
            // Content is already an array of pages
            lessonPages = item.content;
        } else if (item.content && typeof item.content === 'object') {
            if ((item.content as any).pages && Array.isArray((item.content as any).pages)) {
                // Content has a pages property
                lessonPages = (item.content as any).pages;
            } else if ((item.content as any).type) {
                // Content is a single page object (like video lessons)
                lessonPages = [item.content];
            } else if (Object.keys(item.content).length === 0) {
                // Empty content object - create a placeholder
                lessonPages = [{
                    type: "content",
                    title: item.title,
                    content: "This lesson content is being prepared."
                }];
            }
        }

        if (!lessonPages || lessonPages.length === 0) {
            console.error("Content item does not contain valid lesson pages:", item);
            return;
        }
        
        // Determine the correct returnPath based on context
        const returnPath = isEmbedded 
            ? '/' // Return to Index page in content mode
            : buildContentReturnPath(categoryId, chapter.id); // Return to content route
        
        console.log('ContentExplorer - Setting returnPath:', returnPath, 'isEmbedded:', isEmbedded);
        
        navigate('/lesson-runner', { 
            state: { 
                lesson: lessonPages,
                lessonId: item.id,
                // NOTE: The content items don't have a difficulty setting yet.
                // Using a default value so progress tracking works correctly.
                selectedDifficulty: 'Fácil',
                returnPath, 
            } 
        });
    };
    
    return (
        <div>
            <Header title={chapter.title} onBack={onBack} />
            {isLoading ? <LoadingSkeleton /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4 md:p-6">
                    {items?.map(item => {
                        // Check if this item is a video lesson
                        const isVideoLesson = item.content && (
                            (item.content as any).type === 'video' ||
                            (Array.isArray(item.content) && item.content.some((page: any) => page.type === 'video')) ||
                            ((item.content as any).pages && Array.isArray((item.content as any).pages) && 
                             (item.content as any).pages.some((page: any) => page.type === 'video'))
                        );
                        
                        return (
                            <Card 
                              key={item.id} 
                              className="group relative cursor-pointer hover:shadow-lg transition-shadow"
                              onClick={() => handleItemClick(item)}
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
                                        onEditItem(item);
                                      }}
                                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                                      aria-label="Editar item de conteúdo"
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
                                          aria-label="Excluir item de conteúdo"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Excluir Conteúdo</AlertDialogTitle>
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
                                        {isVideoLesson ? (
                                            <Video className="h-5 w-5 text-blue-500" />
                                        ) : (
                                            <BookOpen className="h-5 w-5 text-blue-500" />
                                        )}
                                        {item.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 line-clamp-2">{(item.content as any)?.description}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
            
            {/* Add "Want more lessons?" button at the end for specific chapters */}
            {!isLoading && items && items.length > 0 && (
                ['Fácil', 'Médio', 'Difícil', 'Easy', 'Medium', 'Hard'].includes(chapter.title) && (
                    <div className="flex justify-center p-4 md:p-6">
                        <div className="w-full max-w-md">
                            <Button 
                                variant="outline"
                                size="lg"
                                onClick={() => {
                                    const isEnglishChapter = ['Hard', 'Difícil'].includes(chapter.title);
                                    
                                    const difficultyMessages: Record<string, string> = {
                                        "Fácil": "Nível fácil, alunos A1-A2",
                                        "Easy": "Easy level, A1-A2 students",
                                        "Médio": "nível A2-B1",
                                        "Medium": "A2-B1 level",
                                        "Difícil": "B2",
                                        "Hard": "B2"
                                    };
                                    
                                    const difficultyText = difficultyMessages[chapter.title] || chapter.title;
                                    
                                    const message = isEnglishChapter
                                        ? `Create an ESL lesson with texts, true or false questions and conversation questions. Before creating the lesson, give me five theme options to choose from. And also give me the option to write the theme I would like myself. The difficulty level should be ${difficultyText}.`
                                        : `Crie uma lição ESL com textos, perguntas true or false e perguntas de conversação. Antes de criar a lição, me dê cinco opções de temas para escolher. E me de também a opção de eu mesmo escrever o tema que gostaria. A dificuldade vai ser ${difficultyText}.`;
                                    
                                    // Save current state to sessionStorage with the same structure as CompleteLessonsScreen
                                    sessionStorage.setItem('appReturnState', JSON.stringify({
                                        currentMode: 'specialist',
                                        chatHistory: [],
                                        inputMessage: '',
                                        contentReturnPath: buildContentReturnPath(categoryId, chapter.id),
                                        autoSendMessage: message
                                    }));
                                    
                                    navigate('/', { 
                                        state: { 
                                            restoreConversation: true,
                                            fromContent: true
                                        }
                                    });
                                }}
                                className="flex items-center gap-2 text-base w-full"
                            >
                                {['Hard', 'Difícil'].includes(chapter.title)
                                    ? "Want more lessons? Click here"
                                    : "Quer mais lições? Clique aqui"}
                            </Button>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

const ChapterListView = ({ category, onBack }: { category: any, onBack: () => void }) => {
    const { data: chapters, isLoading } = useContentChapters(category.id);
    const navigate = useNavigate();

    const handleSelectChapter = (chapter: any) => {
        navigate(`/content/${category.id}/${chapter.id}`);
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

const CategoryListView = ({ onBack }: { onBack: () => void }) => {
    const { data: categories, isLoading } = useContentCategories();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleSelectCategory = (category: any) => {
        navigate(`/content/${category.id}`);
    };

    return (
        <div>
            <Header title={t('conteudo')} onBack={onBack} />
            {isLoading ? <LoadingSkeleton /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4 md:p-6">
                    {categories?.map(category => (
                        <Card key={category.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleSelectCategory(category)}>
                            <CardHeader>
                                <CardTitle>{category.name}</CardTitle>
                                {category.description && <CardDescription>{category.description}</CardDescription>}
                            </CardHeader>
                            <CardContent>
                               <div className="flex justify-between items-center text-sm text-gray-500">
                                    <span>Ver capítulos</span>
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
    const { t } = useLanguage();
    return (
        <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
            <div className="flex items-center">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mr-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t('voltar')}
                </Button>
                <h1 className="text-xl font-semibold truncate">Conteúdo</h1>
            </div>
        </div>
    );
};


const ContentExplorer = ({ onBack, isEmbedded }: { onBack: () => void; isEmbedded?: boolean }) => {
    const { categoryId, chapterId } = useParams<{ categoryId: string; chapterId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    // Use the prop-based embedded mode detection instead of URL checking
    const embedded = isEmbedded ?? false;
    
    const [editMode, setEditMode] = useState(false);
    const [keySequence, setKeySequence] = useState("");
    const [showEditor, setShowEditor] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    // Cheat code detection for edit mode
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key.match(/^[a-zA-Z0-9]$/)) {
                setKeySequence(prev => {
                    const newSequence = (prev + event.key.toLowerCase()).slice(-7);
                    console.log("🎹 Key sequence:", newSequence);
                    
                    if (newSequence === "abcdefg") {
                        console.log("🔧 CONTENT EDIT MODE TOGGLE!");
                        setEditMode((prevMode) => {
                          const next = !prevMode;
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

    const handleDeleteContentItem = async (item: any) => {
      try {
        const { error } = await supabase
          .from('content_items')
          .delete()
          .eq('id', item.id);
        if (error) throw error;

        // Refresh the list for this chapter
        await queryClient.invalidateQueries({ queryKey: ['content_items', item.chapter_id] });
        toast({ title: 'Item excluído', description: 'Conteúdo removido com sucesso.' });
      } catch (err) {
        console.error('Error deleting content item:', err);
        toast({ title: 'Erro', description: 'Não foi possível excluir o item.', variant: 'destructive' });
      }
    };

    const { data: categories, isLoading: categoriesLoading } = useContentCategories();
    const { data: chapters, isLoading: chaptersLoading } = useContentChapters(categoryId!);

    if (categoryId && chapterId) {
        if (chaptersLoading) return <LoadingSkeleton />;
        const chapter = chapters?.find(c => c.id === chapterId);
        if (!chapter) {
             return (
                <div className="p-4">
                    <Header title="Erro" onBack={() => navigate(`/content/${categoryId}`)} />
                    <p>Capítulo não encontrado.</p>
                </div>
             );
        }
        return (
            <>
                <ItemListView 
                  categoryId={categoryId} 
                  chapter={chapter} 
                  onBack={() => embedded ? onBack() : navigate(`/content/${categoryId}`)} 
                  isEmbedded={embedded}
                  editMode={editMode}
                  onEditItem={(item) => { setSelectedItem(item); setShowEditor(true); }}
                  onDeleteItem={handleDeleteContentItem}
                />
                {/* Exit edit mode floating button */}
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
                {/* Editor Modal (global editor for now) */}
                {showEditor && selectedItem && (
                  <ContentItemEditorWizard 
                    itemId={selectedItem.id} 
                    onClose={() => { setShowEditor(false); setSelectedItem(null); }}
                    onSave={async () => {
                      await queryClient.invalidateQueries({ queryKey: ['content_items', selectedItem.chapter_id] });
                    }}
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
                    <Header title="Erro" onBack={() => navigate('/content')} />
                    <p>Categoria não encontrada.</p>
                </div>
            );
        }
        return (
            <>
                <ChapterListView 
                  category={category} 
                  onBack={() => embedded ? onBack() : navigate('/content')} 
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
            </>
        );
    }

    return (
        <>
            <CategoryListView onBack={onBack} />
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
        </>
    );
};

export default ContentExplorer;
