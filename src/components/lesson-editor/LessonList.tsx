import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Clock, 
  User,
  BookOpen,
  Folder,
  Settings
} from 'lucide-react';
import LessonEditorWizard from './LessonEditorWizard';
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
  cached_audio_urls?: any;
}

interface ContentItem {
  id: string;
  title: string;
  content: any;
  chapter_id: string;
  order?: number;
  cached_audio_urls?: any;
}

interface LessonListProps {
  lessons: Lesson[];
  contentItems: ContentItem[];
  onDeleteLesson: (id: string) => Promise<boolean>;
  onDeleteContentItem: (id: string) => Promise<boolean>;
  onUpdateLesson: (id: string, updates: Partial<Lesson>) => Promise<boolean>;
  onUpdateContentItem: (id: string, updates: Partial<ContentItem>) => Promise<boolean>;
}

const LessonList: React.FC<LessonListProps> = ({
  lessons,
  contentItems,
  onDeleteLesson,
  onDeleteContentItem,
  onUpdateLesson,
  onUpdateContentItem
}) => {
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [editingContentItem, setEditingContentItem] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [showLessonEditor, setShowLessonEditor] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'facil':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medio':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'dificil':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'fluente':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pnl':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson.id);
    setEditData({
      title: lesson.title,
      description: lesson.description,
      difficulty: lesson.difficulty
    });
  };

  const handleEditContentItem = (item: ContentItem) => {
    setEditingContentItem(item.id);
    setEditData({
      title: item.title
    });
  };

  const handleSaveLesson = async (lessonId: string) => {
    const success = await onUpdateLesson(lessonId, editData);
    if (success) {
      setEditingLesson(null);
      setEditData({});
    }
  };

  const handleSaveContentItem = async (itemId: string) => {
    const success = await onUpdateContentItem(itemId, editData);
    if (success) {
      setEditingContentItem(null);
      setEditData({});
    }
  };

  const handleCancelEdit = () => {
    setEditingLesson(null);
    setEditingContentItem(null);
    setEditData({});
  };

  return (
    <div className="space-y-6">
      {/* Lessons Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Lições ({lessons.length})
        </h2>
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingLesson === lesson.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editData.title || ''}
                          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                          placeholder="Título da lição"
                          className="font-semibold"
                        />
                        <Textarea
                          value={editData.description || ''}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          placeholder="Descrição da lição"
                          rows={2}
                        />
                        <select
                          value={editData.difficulty || ''}
                          onChange={(e) => setEditData({ ...editData, difficulty: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="facil">Fácil</option>
                          <option value="medio">Médio</option>
                          <option value="dificil">Difícil</option>
                          <option value="fluente">Fluente</option>
                          <option value="pnl">PNL</option>
                        </select>
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-lg">{lesson.title}</CardTitle>
                        {lesson.description && (
                          <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {editingLesson === lesson.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSaveLesson(lesson.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowLessonEditor(lesson.id)}
                          className="h-8 w-8 p-0"
                          title="Editar conteúdo completo da lição"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditLesson(lesson)}
                          className="h-8 w-8 p-0"
                          title="Editar informações básicas"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50"
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
                                onClick={() => onDeleteLesson(lesson.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <Badge className={getDifficultyColor(lesson.difficulty)}>
                      {lesson.difficulty}
                    </Badge>
                    <div className="text-xs">
                      Lição criada
                    </div>
                  </div>
                  <div className="text-xs">
                    ID: {lesson.id.slice(0, 8)}...
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {lessons.length === 0 && (
            <Card className="border-dashed border-gray-300">
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-gray-500">Nenhuma lição encontrada</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Content Items Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Folder className="h-6 w-6" />
          Conteúdo ({contentItems.length})
        </h2>
        <div className="space-y-3">
          {contentItems.map((item) => (
            <Card key={item.id} className="border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingContentItem === item.id ? (
                      <Input
                        value={editData.title || ''}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        placeholder="Título do item"
                        className="font-semibold"
                      />
                    ) : (
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {editingContentItem === item.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSaveContentItem(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditContentItem(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Item de Conteúdo</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o item "{item.title}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDeleteContentItem(item.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">
                      Capítulo: {item.chapter_id}
                    </Badge>
                    <div className="text-xs">
                      Item de conteúdo
                    </div>
                  </div>
                  <div className="text-xs">
                    ID: {item.id.slice(0, 8)}...
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {contentItems.length === 0 && (
            <Card className="border-dashed border-gray-300">
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-gray-500">Nenhum item de conteúdo encontrado</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Lesson Editor Wizard Modal */}
      {showLessonEditor && (
        <LessonEditorWizard
          lessonId={showLessonEditor}
          onClose={() => setShowLessonEditor(null)}
          onSave={async () => {
            setShowLessonEditor(null);
            // Force refresh of the lessons list
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default LessonList;