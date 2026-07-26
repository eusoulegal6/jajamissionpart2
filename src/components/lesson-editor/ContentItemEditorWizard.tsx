import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, X, Video, FileText, Volume2, Brain, Play, Headphones, Trash2, Plus, HelpCircle, MessageSquare, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PageEditorWrapper from '@/components/lesson-creator/page-editors/PageEditorWrapper';
import type { LessonPage } from '@/components/lesson-creator/LessonCreatorWizard';
import { getVoiceArtistNames } from '@/utils/voiceArtists';

interface ContentItemEditorWizardProps {
  itemId: string;
  onClose: () => void;
  onSave?: () => void | Promise<void>;
}

interface ContentItemEditorData {
  title: string;
  description: string;
  pages: LessonPage[];
  creditsEnabled?: boolean;
  narrator?: string;
}

const ContentItemEditorWizard: React.FC<ContentItemEditorWizardProps> = ({ itemId, onClose, onSave }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [data, setData] = useState<ContentItemEditorData>({
    title: '',
    description: '',
    pages: [],
    creditsEnabled: false,
    narrator: undefined,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('content_items')
          .select('*')
          .eq('id', itemId)
          .single();
        if (error) throw error;

        const content = (data as any).content || {};
        let rawPages: any[] = [];
        if (Array.isArray(content)) rawPages = content;
        else if (content && Array.isArray(content.pages)) rawPages = content.pages;
        else if (content && content.type) rawPages = [content];
        else rawPages = [];

        const getDefaultContentForType = (type: string) => {
          switch (type) {
            case 'video':
              return { videoUrl: '', title: '', description: '' };
            case 'article':
              return { text: '', imageUrl: '' };
            case 'trueFalse':
              return { questions: [] };
            case 'multipleChoice':
              return { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' };
            case 'exactAnswer':
              return { question: '', correctAnswers: [''], explanation: '' };
            case 'matching':
              return { pairs: [{ left: '', right: '' }], instructions: '' };
            case 'aiFeedback':
              return { questions: [], topic: '', instructions: '' };
            case 'listening':
              return { audioUrl: '', transcript: '', questions: [] };
            case 'ttsArticle':
              return { displayText: '', audioText: '', imageUrl: '' };
            case 'videoQuiz':
              return { videoUrl: '', questions: [] };
            default:
              return {};
          }
        };

        const pages: LessonPage[] = rawPages.map((p: any, idx: number) => {
          const type = p?.type || 'article';
          const rest: any = { ...p };
          delete rest.id; delete rest.type; delete rest.title; delete rest.pages; delete rest.credits;
          return {
            id: p?.id || `page-${idx}`,
            type,
            title: p?.title || `Página ${idx + 1}`,
            content: {
              ...getDefaultContentForType(type),
              ...(p?.content || {}),
              ...rest,
            },
          } as LessonPage;
        });

        const credits = content?.credits || {};
        const description = content?.description || '';

        setData({
          title: (data as any).title,
          description,
          pages,
          creditsEnabled: Boolean(credits?.enabled),
          narrator: credits?.narrator,
        });
      } catch (e) {
        console.error('Error loading content item:', e);
        toast({ title: 'Erro', description: 'Não foi possível carregar o conteúdo.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [itemId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const contentPayload: any = {
        pages: data.pages.map((page) => ({
          id: page.id,
          type: page.type,
          title: page.title,
          ...page.content,
        })),
        description: data.description,
        credits: data.creditsEnabled ? { enabled: true, narrator: data.narrator } : undefined,
      };

      const { error } = await supabase
        .from('content_items')
        .update({ title: data.title, content: contentPayload })
        .eq('id', itemId);

      if (error) throw error;

      toast({ title: 'Salvo!', description: 'Conteúdo atualizado com sucesso.' });
      await onSave?.();
      onClose();
    } catch (e) {
      console.error('Error saving content item:', e);
      toast({ title: 'Erro', description: 'Não foi possível salvar o conteúdo.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const addPage = (type: LessonPage['type']) => {
    const getDefaultContentForType = (type: string) => {
      switch (type) {
        case 'video':
          return { videoUrl: '', title: '', description: '' };
        case 'article':
          return { text: '', imageUrl: '' };
        case 'trueFalse':
          return { questions: [] };
        case 'multipleChoice':
          return { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' };
        case 'exactAnswer':
          return { question: '', correctAnswers: [''], explanation: '' };
        case 'matching':
          return { pairs: [{ left: '', right: '' }], instructions: '' };
        case 'aiFeedback':
          return { questions: [], topic: '', instructions: '' };
        case 'listening':
          return { audioUrl: '', transcript: '', questions: [] };
        case 'ttsArticle':
          return { displayText: '', audioText: '', imageUrl: '' };
        case 'videoQuiz':
          return { videoUrl: '', questions: [] };
        default:
          return {};
      }
    };

    const newPage: LessonPage = {
      id: `page-${Date.now()}`,
      type,
      title: `Nova ${getPageTypeName(type)}`,
      content: getDefaultContentForType(type),
    } as LessonPage;

    setData((prev) => ({ ...prev, pages: [...prev.pages, newPage] }));
  };

  const updatePage = (pageId: string, updates: Partial<LessonPage>) => {
    setData((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => (p.id === pageId ? { ...p, ...updates } : p)),
    }));
  };

  const deletePage = (pageId: string) => {
    setData((prev) => ({ ...prev, pages: prev.pages.filter((p) => p.id !== pageId) }));
  };

  const getPageTypeName = (type: string) => {
    const names: Record<string, string> = {
      video: 'Página de Vídeo',
      article: 'Artigo',
      trueFalse: 'Quiz Verdadeiro/Falso',
      multipleChoice: 'Múltipla Escolha',
      exactAnswer: 'Resposta Exata',
      matching: 'Associação',
      aiFeedback: 'Feedback IA',
      aiFeedbackWithParameters: 'IA Feedback com Parâmetros',
      listening: 'Exercício de Escuta',
      ttsArticle: 'Artigo com Áudio',
      videoQuiz: 'Quiz de Vídeo',
    };
    return names[type] || type;
  };

  const getPageIcon = (type: string) => {
    const icons: any = { 
      video: Video, 
      article: FileText, 
      trueFalse: Brain, 
      multipleChoice: HelpCircle,
      exactAnswer: MessageSquare,
      matching: FileText,
      aiFeedback: Brain,
      aiFeedbackWithParameters: Brain,
      listening: Headphones, 
      ttsArticle: Volume2, 
      videoQuiz: Play 
    };
    return icons[type] || FileText;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span>Carregando conteúdo...</span>
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
              <CardTitle className="text-2xl">Editor de Conteúdo</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Edite este item específico: título, descrição, páginas e créditos</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button variant="outline" onClick={onClose} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Fechar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-6">
          <Tabs defaultValue="general" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4 flex-shrink-0">
              <TabsTrigger value="general">Informações Gerais</TabsTrigger>
              <TabsTrigger value="credits">Créditos</TabsTrigger>
              <TabsTrigger value="pages">Páginas ({data.pages.length})</TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0">
              <TabsContent value="general" className="mt-0 h-full overflow-y-auto max-h:[60vh]">
                <div className="space-y-6 pb-6 pr-2">
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Título</Label>
                      <Input value={data.title} onChange={(e) => setData((p) => ({ ...p, title: e.target.value }))} placeholder="Digite o título" />
                    </div>
                    <div>
                      <Label className="mb-2 block">Descrição</Label>
                      <Textarea rows={3} value={data.description} onChange={(e) => setData((p) => ({ ...p, description: e.target.value }))} placeholder="Descreva o conteúdo" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="credits" className="mt-0 h-full overflow-y-auto max-h:[60vh]">
                <div className="space-y-6 pb-6 pr-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Habilitar Créditos</Label>
                        <p className="text-sm text-muted-foreground">Exibir tela de créditos com narrador</p>
                      </div>
                      <Switch checked={data.creditsEnabled || false} onCheckedChange={(checked) => setData((p) => ({ ...p, creditsEnabled: checked, narrator: checked ? p.narrator : undefined }))} />
                    </div>

                    {data.creditsEnabled && (
                      <div className="space-y-4 pt-4 border-t">
                        <div>
                          <Label>Narrador</Label>
                          <Select value={data.narrator || ''} onValueChange={(v) => setData((p) => ({ ...p, narrator: v }))}>
                            <SelectTrigger className="mt-2 bg-white border border-gray-300 z-50">
                              <SelectValue placeholder="Selecione um narrador" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-300 shadow-lg z-50">
                              {getVoiceArtistNames().map((name) => (
                                <SelectItem key={name} value={name} className="hover:bg-gray-100">{name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pages" className="mt-0 h-full overflow-y-auto max-h-[60vh]">
                <div className="space-y-6 pb-6 pr-2">
                  {/* Add page buttons */}
                  <div className="flex flex-wrap gap-2">
                    {(['video','article','trueFalse','multipleChoice','exactAnswer','matching','aiFeedback','aiFeedbackWithParameters','listening','ttsArticle','videoQuiz'] as LessonPage['type'][]).map((type) => {
                      const Icon = getPageIcon(type);
                      return (
                        <Button key={type} variant="outline" size="sm" onClick={() => {
                          addPage(type);
                          // Navigate to the newly added page
                          setCurrentPageIndex(data.pages.length);
                        }} className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          <Icon className="h-4 w-4" />
                          {getPageTypeName(type)}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Page Navigation - Slide-like interface */}
                  {data.pages.length > 0 && (
                    <div className="space-y-4">
                      {/* Page Navigation Header */}
                      <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/30">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                          disabled={currentPageIndex === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            Página {currentPageIndex + 1} de {data.pages.length}
                          </span>
                          <div className="flex gap-1">
                            {data.pages.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setCurrentPageIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  idx === currentPageIndex 
                                    ? 'bg-primary' 
                                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPageIndex(Math.min(data.pages.length - 1, currentPageIndex + 1))}
                          disabled={currentPageIndex === data.pages.length - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Current Page Editor */}
                      {data.pages[currentPageIndex] && (() => {
                        const page = data.pages[currentPageIndex];
                        const Icon = getPageIcon(page.type);
                        return (
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (currentPageIndex > 0) {
                                          const newPages = [...data.pages];
                                          [newPages[currentPageIndex], newPages[currentPageIndex - 1]] = 
                                            [newPages[currentPageIndex - 1], newPages[currentPageIndex]];
                                          setData(prev => ({ ...prev, pages: newPages }));
                                          setCurrentPageIndex(currentPageIndex - 1);
                                        }
                                      }}
                                      disabled={currentPageIndex === 0}
                                      title="Mover para cima"
                                    >
                                      <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (currentPageIndex < data.pages.length - 1) {
                                          const newPages = [...data.pages];
                                          [newPages[currentPageIndex], newPages[currentPageIndex + 1]] = 
                                            [newPages[currentPageIndex + 1], newPages[currentPageIndex]];
                                          setData(prev => ({ ...prev, pages: newPages }));
                                          setCurrentPageIndex(currentPageIndex + 1);
                                        }
                                      }}
                                      disabled={currentPageIndex === data.pages.length - 1}
                                      title="Mover para baixo"
                                    >
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-5 w-5 text-primary" />
                                    <div>
                                      <h4 className="font-medium">{page.title}</h4>
                                      <Badge variant="outline" className="text-xs">
                                        {getPageTypeName(page.type)}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    deletePage(page.id);
                                    // Adjust current index if needed
                                    if (currentPageIndex >= data.pages.length - 1 && currentPageIndex > 0) {
                                      setCurrentPageIndex(currentPageIndex - 1);
                                    }
                                  }}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <PageEditorWrapper page={page as any} onChange={(updated) => updatePage(page.id, updated)} />
                            </CardContent>
                          </Card>
                        );
                      })()}
                    </div>
                  )}

                  {data.pages.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma página ainda. Adicione uma acima.</p>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentItemEditorWizard;
