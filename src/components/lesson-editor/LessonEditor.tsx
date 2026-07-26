import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LessonList from './LessonList';
import { useLessonEditor } from '@/hooks/useLessonEditor';

interface LessonEditorProps {
  onClose: () => void;
}

const LessonEditor: React.FC<LessonEditorProps> = ({ onClose }) => {
  const {
    lessons,
    contentItems,
    loading,
    deleteLesson,
    deleteContentItem,
    updateLesson,
    updateContentItem,
    refreshLessons,
    refreshContentItems
  } = useLessonEditor();

  const [keySequence, setKeySequence] = useState("");

  // Handle escape key to close editor
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
      
      // Track key sequence to potentially close with same cheat code
      if (event.key.match(/^[a-zA-Z0-9]$/)) {
        setKeySequence(prev => {
          const newSequence = (prev + event.key.toLowerCase()).slice(-7);
          if (newSequence === "abcdefg") {
            onClose();
            return "";
          }
          return newSequence;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

  const handleRefresh = () => {
    refreshLessons();
    refreshContentItems();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Carregando...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Editor de Lições</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Gerencie todas as lições e conteúdos do sistema
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Fechar
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          <Tabs defaultValue="all" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="all">Todos ({lessons.length + contentItems.length})</TabsTrigger>
              <TabsTrigger value="lessons">Lições ({lessons.length})</TabsTrigger>
              <TabsTrigger value="content">Conteúdo ({contentItems.length})</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-auto">
              <TabsContent value="all" className="mt-0 h-full">
                <LessonList
                  lessons={lessons}
                  contentItems={contentItems}
                  onDeleteLesson={deleteLesson}
                  onDeleteContentItem={deleteContentItem}
                  onUpdateLesson={updateLesson}
                  onUpdateContentItem={updateContentItem}
                />
              </TabsContent>
              
              <TabsContent value="lessons" className="mt-0 h-full">
                <LessonList
                  lessons={lessons}
                  contentItems={[]}
                  onDeleteLesson={deleteLesson}
                  onDeleteContentItem={deleteContentItem}
                  onUpdateLesson={updateLesson}
                  onUpdateContentItem={updateContentItem}
                />
              </TabsContent>
              
              <TabsContent value="content" className="mt-0 h-full">
                <LessonList
                  lessons={[]}
                  contentItems={contentItems}
                  onDeleteLesson={deleteLesson}
                  onDeleteContentItem={deleteContentItem}
                  onUpdateLesson={updateLesson}
                  onUpdateContentItem={updateContentItem}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LessonEditor;