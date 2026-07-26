import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Save, Plus, Trash2, X, Video, FileText, Volume2, Brain, Play,
  Headphones, HelpCircle, MessageSquare, ChevronUp, ChevronDown, Settings,
  GripVertical, Eye, Layers, BookOpen, Award, Link2, Mic, PenLine, 
  LayoutList, FileQuestion, ListChecks, Presentation, FileType
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getVoiceArtistNames } from '@/utils/voiceArtists';
import PageEditorWrapper from '../lesson-creator/page-editors/PageEditorWrapper';
import ComplementaryLessonsSelector from '../lesson-creator/ComplementaryLessonsSelector';
import { PNL_LESSON_OPTIONS } from '@/data/pnlLessons';

interface LessonPage {
  id: string;
  type: 'video' | 'article' | 'trueFalse' | 'aiFeedback' | 'aiFeedbackWithParameters' | 'aiFeedbackWithParametersEssay' | 'listening' | 'listeningVideo' | 'ttsArticle' | 'videoQuiz' | 'multipleChoice' | 'exactAnswer' | 'matching' | 'recommendedVocabulary' | 'trueFalseWithText' | 'multipleChoiceWithText' | 'audioMultipleChoice' | 'essay' | 'suggestedWords' | 'slideshow' | 'pdf' | 'pnlSlides' | 'pronunciationSlides' | 'customPronunciationSlides' | 'audioSlides';
  title: string;
  content: any;
}

interface LessonEditorData {
  title: string;
  description: string;
  difficulty: string;
  pages: LessonPage[];
  creditsEnabled?: boolean;
  narrator?: string;
  complementaryLessonIds?: string[];
  destination?: 'lessons' | 'content' | 'toefl';
  categoryId?: string;
  pnlConsultationLessonId?: string;
}

interface LessonEditorWizardProps {
  lessonId: string;
  onClose: () => void;
  onSave?: () => void;
}

// ─── Page type metadata ───
const PAGE_TYPES: { type: LessonPage['type']; label: string; icon: React.ElementType; category: string }[] = [
  { type: 'article', label: 'Artigo', icon: FileText, category: 'Conteúdo' },
  { type: 'ttsArticle', label: 'Artigo com Áudio', icon: Volume2, category: 'Conteúdo' },
  { type: 'video', label: 'Vídeo', icon: Video, category: 'Conteúdo' },
  { type: 'videoQuiz', label: 'Quiz de Vídeo', icon: Play, category: 'Conteúdo' },
  { type: 'slideshow', label: 'Slideshow', icon: Presentation, category: 'Conteúdo' },
  { type: 'pdf', label: 'PDF', icon: FileType, category: 'Conteúdo' },
  { type: 'multipleChoice', label: 'Múltipla Escolha', icon: HelpCircle, category: 'Exercícios' },
  { type: 'multipleChoiceWithText', label: 'M.E. com Texto', icon: FileQuestion, category: 'Exercícios' },
  { type: 'audioMultipleChoice', label: 'M.E. com Áudio', icon: Headphones, category: 'Exercícios' },
  { type: 'trueFalse', label: 'Verdadeiro/Falso', icon: ListChecks, category: 'Exercícios' },
  { type: 'trueFalseWithText', label: 'V/F com Texto', icon: ListChecks, category: 'Exercícios' },
  { type: 'exactAnswer', label: 'Resposta Exata', icon: PenLine, category: 'Exercícios' },
  { type: 'matching', label: 'Associação', icon: Link2, category: 'Exercícios' },
  { type: 'essay', label: 'Redação', icon: FileText, category: 'Escrita & IA' },
  { type: 'aiFeedback', label: 'Feedback IA', icon: Brain, category: 'Escrita & IA' },
  { type: 'aiFeedbackWithParameters', label: 'IA com Parâmetros', icon: Brain, category: 'Escrita & IA' },
  { type: 'aiFeedbackWithParametersEssay', label: 'IA Essay', icon: Brain, category: 'Escrita & IA' },
  { type: 'listening', label: 'Transcrição', icon: Headphones, category: 'Listening' },
  { type: 'listeningVideo', label: 'Transcrição Vídeo', icon: Video, category: 'Listening' },
  
  { type: 'recommendedVocabulary', label: 'Vocabulário Rec.', icon: BookOpen, category: 'Vocabulário' },
  { type: 'suggestedWords', label: 'Palavras Sugeridas', icon: MessageSquare, category: 'Vocabulário' },
  { type: 'customPronunciationSlides', label: 'Pronúncia Custom', icon: Mic, category: 'Pronúncia' },
  { type: 'audioSlides', label: 'Slides com Áudio', icon: Volume2, category: 'Pronúncia' },
  { type: 'pnlSlides', label: 'Slides PNL', icon: Layers, category: 'PNL' },
  { type: 'pronunciationSlides', label: 'Pronúncia PNL', icon: Mic, category: 'PNL' },
];

const getPageTypeMeta = (type: string) => PAGE_TYPES.find(p => p.type === type) || { label: type, icon: FileText, category: 'Outro' };

const looksLikeNumberedLessonTitle = (title?: string) => /^Lesson\s+\d+\s*[-–—]/i.test((title || '').trim());

const getDefaultContentForType = (type: string) => {
  switch (type) {
    case 'video': return { videoUrl: '', title: '', description: '' };
    case 'article': return { text: '', imageUrl: '' };
    case 'trueFalse': return { questions: [] };
    case 'multipleChoice': return { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' };
    case 'exactAnswer': return { question: '', correctAnswers: [''], explanation: '' };
    case 'matching': return { pairs: [{ left: '', right: '' }], instructions: '' };
    case 'trueFalseWithText': return { text: '', questions: [] };
    case 'multipleChoiceWithText': return { text: '', questions: [] };
    case 'audioMultipleChoice': return { audioUrl: '', questions: [] };
    case 'recommendedVocabulary': return { questions: [], topic: '', recommendedWords: [] };
    case 'suggestedWords': return { words: [], instructions: '' };
    case 'essay': return { topic: '', instructions: '' };
    case 'aiFeedback': return { questions: [], topic: '', instructions: '' };
    case 'aiFeedbackWithParameters': return { questions: [], topic: '', parameters: {} };
    case 'aiFeedbackWithParametersEssay': return { topic: '', instructions: '', parameters: {} };
    case 'listening': return { audioUrl: '', transcript: '', questions: [] };
    case 'listeningVideo': return { videoUrl: '', questions: [{ originalText: '' }] };
    case 'ttsArticle': return { displayText: '', audioText: '', imageUrl: '' };
    case 'videoQuiz': return { videoUrl: '', questions: [] };
    case 'slideshow': return { slideshowId: '' };
    case 'pdf': return { pdfUrl: '' };
    case 'pnlSlides': return { lessonId: '', category: 'verbs' };
    case 'pronunciationSlides': return { lessonId: '', category: 'verbs' };
    case 'customPronunciationSlides': return { slides: [] };
    case 'audioSlides': return { slides: [] };
    
    default: return {};
  }
};

const LessonEditorWizard: React.FC<LessonEditorWizardProps> = ({ lessonId, onClose, onSave }) => {
  const navigate = useNavigate();
  const { learningLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFromToeflTable, setIsFromToeflTable] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [activePanel, setActivePanel] = useState<'pages' | 'settings'>('pages');
  const [showAddPage, setShowAddPage] = useState(false);

  const [lessonData, setLessonData] = useState<LessonEditorData>({
    title: '', description: '', difficulty: 'Fácil', pages: [],
    creditsEnabled: false, narrator: undefined, complementaryLessonIds: [],
    destination: 'lessons'
  });

  // ─── Load lesson data ───
  useEffect(() => {
    const loadLessonData = async () => {
      try {
        let tableName = 'lessons';
        if (learningLanguage === 'es') {
          tableName = 'lessons_spanish';
        } else if (lessonId && typeof lessonId === 'string' && lessonId.includes('-')) {
          tableName = 'content_items';
        }

        let data: any = null;
        let error: any = null;

        const result = await supabase
          .from(tableName as 'lessons' | 'lessons_spanish' | 'content_items')
          .select('*').eq('id', lessonId).single();
        data = result.data; error = result.error;

        if (error) {
          if (tableName !== 'content_items') {
            const r = await supabase.from('content_items').select('*').eq('id', lessonId).single();
            if (!r.error) { data = r.data; error = null; tableName = 'content_items'; }
          }
          if (error) {
            const r = await supabase.from('toefl_items').select('*').eq('id', lessonId).single();
            if (!r.error) { data = r.data; error = null; tableName = 'toefl_items'; setIsFromToeflTable(true); }
          }
          if (error && tableName !== 'lessons') {
            const r = await supabase.from('lessons').select('*').eq('id', lessonId).single();
            if (!r.error) { data = r.data; error = null; tableName = 'lessons'; }
          }
        }

        if (error) {
          toast({ title: "Erro", description: "Não foi possível carregar a lição.", variant: "destructive" });
          return;
        }

        if (data) {
          const buildPage = (page: any, index: number) => {
            const type = page?.type || 'article';
            const rest: any = { ...page };
            delete rest.id; delete rest.type; delete rest.title; delete rest.pages; delete rest.credits;
            const content = { ...getDefaultContentForType(type), ...(page?.content || {}), ...rest };
            return { id: page?.id || `page-${index}`, type, title: page?.title || `Página ${index + 1}`, content };
          };

          let rawPages: any[] = [];
          const c: any = data.content;
          if (Array.isArray(c)) rawPages = c;
          else if (c && Array.isArray(c.pages)) {
            rawPages = c.pages;
            if (rawPages.length === 1 && Array.isArray(rawPages[0]?.pages)) rawPages = rawPages[0].pages;
          } else if (c && typeof c === 'object' && c.type) rawPages = [c];

          const pages = rawPages.map((p, idx) => buildPage(p, idx));

          let creditsEnabled = false;
          let narrator: string | undefined;
          const topCredits: any = (data as any).credits;
          const contentCredits: any = c?.credits;
          if (topCredits && typeof topCredits === 'object') { creditsEnabled = Boolean(topCredits.enabled); narrator = topCredits.narrator; }
          else if (contentCredits && typeof contentCredits === 'object') { creditsEnabled = Boolean(contentCredits.enabled); narrator = contentCredits.narrator; }

          setLessonData({
            title: data.title, description: data.description, difficulty: data.difficulty, pages,
            creditsEnabled, narrator, complementaryLessonIds: c?.complementaryLessonIds || [],
            destination: tableName === 'content_items' ? 'content' : (tableName === 'toefl_items' ? 'toefl' : 'lessons'),
            categoryId: tableName === 'content_items' ? data.chapter_id : (tableName === 'toefl_items' ? data.category_id : undefined),
            pnlConsultationLessonId: c?.pnlConsultationLessonId || undefined
          });
        }
      } catch (error) {
        toast({ title: "Erro", description: "Erro inesperado ao carregar a lição.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadLessonData();
  }, [lessonId, learningLanguage]);

  // ─── Save ───
  const handleSave = async () => {
    let tableName = 'lessons';
    let isToeflItem = false;
    if (learningLanguage === 'es') tableName = 'lessons_spanish';
    else if (lessonId && typeof lessonId === 'string') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(lessonId)) {
        const tc = await supabase.from('toefl_items').select('id').eq('id', lessonId).single();
        if (!tc.error) { tableName = 'toefl_items'; isToeflItem = true; }
        else tableName = 'content_items';
      }
    }

    if (!lessonData.title) { toast({ title: "Erro", description: "Por favor, preencha o título.", variant: "destructive" }); return; }
    if (!isToeflItem && !lessonData.description) { toast({ title: "Erro", description: "Por favor, preencha a descrição.", variant: "destructive" }); return; }

    setSaving(true);
    try {
      const contentData = {
        pages: lessonData.pages.map(page => {
          const title = page.type === 'trueFalseWithText' ? '' : page.title;
          return { id: page.id, type: page.type, title, ...page.content };
        }),
        credits: lessonData.creditsEnabled ? { enabled: true, narrator: lessonData.narrator } : undefined,
        complementaryLessonIds: lessonData.complementaryLessonIds || [],
        pnlConsultationLessonId: lessonData.pnlConsultationLessonId || undefined
      };

      const firstPageTitle = lessonData.pages[0]?.title?.trim();
      const lessonTitle = lessonData.title.trim();
      const saveTitle = firstPageTitle &&
        firstPageTitle !== lessonTitle &&
        looksLikeNumberedLessonTitle(firstPageTitle) &&
        !looksLikeNumberedLessonTitle(lessonTitle)
          ? firstPageTitle
          : lessonTitle;

      let updateData: any = { title: saveTitle, content: contentData };
      if (tableName !== 'content_items' && tableName !== 'toefl_items') {
        updateData.description = lessonData.description;
        updateData.difficulty = lessonData.difficulty;
      }

      console.log('[LessonEditorWizard] Saving', { tableName, lessonId, title: saveTitle });
      const { error, data: updated } = await supabase
        .from(tableName as 'lessons' | 'lessons_spanish' | 'content_items' | 'toefl_items')
        .update(updateData).eq('id', lessonId).select('id, title').maybeSingle();

      if (error) {
        console.error('[LessonEditorWizard] Save error:', error);
        toast({ title: "Erro", description: `Não foi possível salvar: ${error.message}`, variant: "destructive" });
        return;
      }

      if (!updated) {
        console.warn('[LessonEditorWizard] Update returned no row', { tableName, lessonId });
        toast({
          title: "Atenção",
          description: `Nenhuma linha atualizada em "${tableName}" para id ${lessonId}.`,
          variant: "destructive",
        });
        return;
      }

      console.log('[LessonEditorWizard] Saved row:', updated);

      if (tableName === 'toefl_items') {
        const { data: toeflItem } = await supabase.from('toefl_items').select('category_id').eq('id', lessonId).single();
        const categoryId = toeflItem?.category_id || 'reading';
        await queryClient.invalidateQueries({ queryKey: ['lesson_data'] });
        await queryClient.invalidateQueries({ queryKey: ['toefl_items'] });
        await queryClient.invalidateQueries({ queryKey: ['toefl_items_by_category', categoryId] });
        await queryClient.refetchQueries({ queryKey: ['lesson_data', lessonId] });
      } else if (tableName === 'content_items') {
        await queryClient.invalidateQueries({ queryKey: ['lesson_data'] });
        await queryClient.invalidateQueries({ queryKey: ['content_items'] });
        await queryClient.refetchQueries({ queryKey: ['lesson_data', lessonId] });
      } else {
        await queryClient.invalidateQueries({ queryKey: ['lesson_data'] });
        await queryClient.refetchQueries({ queryKey: ['lesson_data', lessonId] });
      }

      toast({ title: "Sucesso! 🎉", description: `Lição salva como "${updated.title}"` });
      onSave?.();
      onClose();
    } catch (error) {
      toast({ title: "Erro", description: "Erro inesperado ao salvar.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ─── Page operations ───
  const addPage = (type: LessonPage['type']) => {
    const meta = getPageTypeMeta(type);
    const newPage: LessonPage = {
      id: `page-${Date.now()}`,
      type,
      title: `Nova ${meta.label}`,
      content: getDefaultContentForType(type)
    };
    setLessonData(prev => ({ ...prev, pages: [...prev.pages, newPage] }));
    setCurrentPageIndex(lessonData.pages.length); // jump to new page
    setShowAddPage(false);
  };

  const insertPageAfter = (type: LessonPage['type']) => {
    const meta = getPageTypeMeta(type);
    const newPage: LessonPage = {
      id: `page-${Date.now()}`,
      type,
      title: `Nova ${meta.label}`,
      content: getDefaultContentForType(type)
    };
    const insertIdx = currentPageIndex + 1;
    setLessonData(prev => {
      const newPages = [...prev.pages];
      newPages.splice(insertIdx, 0, newPage);
      return { ...prev, pages: newPages };
    });
    setCurrentPageIndex(insertIdx);
    setShowAddPage(false);
  };

  const updatePage = (pageId: string, updates: Partial<LessonPage>) => {
    setLessonData(prev => ({
      ...prev,
      pages: prev.pages.map(page => page.id === pageId ? { ...page, ...updates } : page)
    }));
  };

  const deletePage = (index: number) => {
    setLessonData(prev => ({ ...prev, pages: prev.pages.filter((_, i) => i !== index) }));
    if (currentPageIndex >= lessonData.pages.length - 1 && currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const movePage = (fromIdx: number, direction: 'up' | 'down') => {
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= lessonData.pages.length) return;
    setLessonData(prev => {
      const newPages = [...prev.pages];
      [newPages[fromIdx], newPages[toIdx]] = [newPages[toIdx], newPages[fromIdx]];
      return { ...prev, pages: newPages };
    });
    setCurrentPageIndex(toIdx);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Carregando lição...</span>
        </div>
      </div>
    );
  }

  const currentPage = lessonData.pages[currentPageIndex];

  // ─── Group page types by category for the add-page panel ───
  const groupedTypes = PAGE_TYPES.reduce((acc, pt) => {
    if (!acc[pt.category]) acc[pt.category] = [];
    acc[pt.category].push(pt);
    return acc;
  }, {} as Record<string, typeof PAGE_TYPES>);

  return (
    <div className="fixed inset-0 z-[9999] h-screen flex flex-col bg-background">
      {/* ═══ TOP BAR ═══ */}
      <div className="flex-shrink-0 border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <Input
                value={lessonData.title}
                onChange={(e) => setLessonData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título da lição"
                className="text-lg font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{lessonData.pages.length} página{lessonData.pages.length !== 1 ? 's' : ''}</span>
                {lessonData.difficulty && !isFromToeflTable && (
                  <Badge variant="outline" className="text-xs">{lessonData.difficulty}</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant={activePanel === 'settings' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActivePanel(activePanel === 'settings' ? 'pages' : 'settings')}
            >
              <Settings className="h-4 w-4 mr-1" />
              Configurações
            </Button>
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ MAIN AREA ═══ */}
      <div className="flex-1 flex min-h-0">
        {/* ─── LEFT SIDEBAR: Page list ─── */}
        <div className="w-64 flex-shrink-0 border-r bg-muted/30 flex flex-col">
          <div className="p-3 border-b flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Páginas</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddPage(!showAddPage)}
              className="h-7 w-7 p-0"
              title="Adicionar página"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {lessonData.pages.map((page, idx) => {
                const meta = getPageTypeMeta(page.type);
                const Icon = meta.icon;
                const isActive = idx === currentPageIndex;
                return (
                  <button
                    key={page.id}
                    onClick={() => { setCurrentPageIndex(idx); setActivePanel('pages'); }}
                    className={`w-full text-left rounded-lg p-2.5 transition-all group relative ${
                      isActive
                        ? 'bg-primary/10 border border-primary/30 shadow-sm'
                        : 'hover:bg-muted border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`text-[10px] font-bold mt-0.5 w-4 text-center flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                        {idx + 1}
                      </span>
                      <Icon className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                          {page.title || meta.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{meta.label}</p>
                      </div>
                    </div>
                    {/* Reorder + delete on hover */}
                    <div className={`absolute right-1 top-1 flex gap-0.5 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                      <div
                        role="button"
                        onClick={(e) => { e.stopPropagation(); movePage(idx, 'up'); }}
                        className={`p-0.5 rounded hover:bg-muted-foreground/10 ${idx === 0 ? 'opacity-30 pointer-events-none' : ''}`}
                        title="Mover para cima"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </div>
                      <div
                        role="button"
                        onClick={(e) => { e.stopPropagation(); movePage(idx, 'down'); }}
                        className={`p-0.5 rounded hover:bg-muted-foreground/10 ${idx === lessonData.pages.length - 1 ? 'opacity-30 pointer-events-none' : ''}`}
                        title="Mover para baixo"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </div>
                      <div
                        role="button"
                        onClick={(e) => { e.stopPropagation(); deletePage(idx); }}
                        className="p-0.5 rounded hover:bg-destructive/10 text-destructive/60 hover:text-destructive"
                        title="Excluir página"
                      >
                        <Trash2 className="h-3 w-3" />
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Add page inline button */}
              <button
                onClick={() => setShowAddPage(true)}
                className="w-full text-left rounded-lg p-2.5 border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center gap-2 justify-center"
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Adicionar página</span>
              </button>
            </div>
          </ScrollArea>
        </div>

        {/* ─── MAIN CONTENT ─── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Add Page Panel */}
          {showAddPage && (
            <div className="border-b bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Adicionar Nova Página</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddPage(false)} className="h-6 w-6 p-0">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-3">
                {Object.entries(groupedTypes).map(([category, types]) => (
                  <div key={category}>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{category}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {types.map(({ type, label, icon: Icon }) => (
                        <Button
                          key={type}
                          variant="outline"
                          size="sm"
                          onClick={() => lessonData.pages.length > 0 ? insertPageAfter(type) : addPage(type)}
                          className="h-auto py-1.5 px-2.5 text-xs gap-1.5"
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Panel */}
          {activePanel === 'settings' && (
            <ScrollArea className="flex-1">
              <div className="max-w-2xl mx-auto p-6 space-y-6">
                {/* General Info */}
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <LayoutList className="h-4 w-4" /> Informações Gerais
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <Label>Título</Label>
                      <Input value={lessonData.title} onChange={(e) => setLessonData(prev => ({ ...prev, title: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea value={lessonData.description} onChange={(e) => setLessonData(prev => ({ ...prev, description: e.target.value }))} rows={3} />
                    </div>
                    {!isFromToeflTable && (
                      <div>
                        <Label>Dificuldade</Label>
                        <Select value={lessonData.difficulty} onValueChange={(v) => setLessonData(prev => ({ ...prev, difficulty: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fácil">Fácil</SelectItem>
                            <SelectItem value="Médio">Médio</SelectItem>
                            <SelectItem value="Difícil">Difícil</SelectItem>
                            <SelectItem value="Fluente">Fluente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </section>

                {/* Credits */}
                <section className="space-y-4 border-t pt-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Award className="h-4 w-4" /> Créditos
                  </h2>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Habilitar Créditos</Label>
                      <p className="text-xs text-muted-foreground">Exibir tela de créditos com narrador</p>
                    </div>
                    <Switch
                      checked={lessonData.creditsEnabled || false}
                      onCheckedChange={(checked) => setLessonData(prev => ({ ...prev, creditsEnabled: checked, narrator: checked ? prev.narrator : undefined }))}
                    />
                  </div>
                  {lessonData.creditsEnabled && (
                    <div>
                      <Label>Narrador</Label>
                      <Select value={lessonData.narrator || ''} onValueChange={(v) => setLessonData(prev => ({ ...prev, narrator: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione um narrador" /></SelectTrigger>
                        <SelectContent>
                          {getVoiceArtistNames().map((name) => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </section>

                {/* PNL Consultation */}
                <section className="space-y-4 border-t pt-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Consulta PNL
                  </h2>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Ativar Consulta PNL</Label>
                      <p className="text-xs text-muted-foreground">Ícone de livro para consultar vocabulário PNL</p>
                    </div>
                    <Switch
                      checked={!!lessonData.pnlConsultationLessonId}
                      onCheckedChange={(checked) => setLessonData(prev => ({ ...prev, pnlConsultationLessonId: checked ? 'lesson-1' : undefined }))}
                    />
                  </div>
                  {lessonData.pnlConsultationLessonId && (
                    <div>
                      <Label>Lição PNL</Label>
                      <Select value={lessonData.pnlConsultationLessonId} onValueChange={(v) => setLessonData(prev => ({ ...prev, pnlConsultationLessonId: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PNL_LESSON_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </section>

                {/* Complementary Lessons */}
                <section className="space-y-4 border-t pt-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Link2 className="h-4 w-4" /> Lições Complementares
                  </h2>
                  <ComplementaryLessonsSelector
                    destination={lessonData.destination || 'lessons'}
                    lessonCategory={lessonData.difficulty}
                    categoryId={lessonData.categoryId}
                    selectedLessonIds={lessonData.complementaryLessonIds || []}
                    onChange={(ids) => setLessonData(prev => ({ ...prev, complementaryLessonIds: ids }))}
                  />
                </section>

                {/* Slide mode toggle for articles */}
                <section className="space-y-4 border-t pt-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Opções de Artigos
                  </h2>
                  <Button
                    onClick={() => {
                      const articlePages = lessonData.pages.filter(p => p.type === 'article');
                      if (articlePages.length === 0) { toast({ title: "Nenhuma página de artigo encontrada", variant: "destructive" }); return; }
                      setLessonData(prev => ({
                        ...prev,
                        pages: prev.pages.map(p => p.type === 'article' ? { ...p, content: { ...p.content, slideMode: true } } : p)
                      }));
                      toast({ title: "Sucesso!", description: `Slide mode ativado em ${articlePages.length} artigo(s)` });
                    }}
                    variant="outline" size="sm"
                  >
                    <Presentation className="h-4 w-4 mr-2" />
                    Ativar Slide Mode (todos os artigos)
                  </Button>
                </section>
              </div>
            </ScrollArea>
          )}

          {/* Page Editor */}
          {activePanel === 'pages' && (
            <ScrollArea className="flex-1">
              {currentPage ? (
                <div className="p-6">
                  {/* Page header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs gap-1">
                        {React.createElement(getPageTypeMeta(currentPage.type).icon, { className: "h-3 w-3" })}
                        {getPageTypeMeta(currentPage.type).label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Página {currentPageIndex + 1} de {lessonData.pages.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => movePage(currentPageIndex, 'up')} disabled={currentPageIndex === 0}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => movePage(currentPageIndex, 'down')} disabled={currentPageIndex === lessonData.pages.length - 1}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deletePage(currentPageIndex)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Actual page editor */}
                  <PageEditorWrapper
                    page={currentPage}
                    onChange={(updatedPage) => updatePage(currentPage.id, updatedPage)}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-12">
                  <div className="text-center">
                    <Layers className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">Nenhuma página na lição</h3>
                    <p className="text-sm text-muted-foreground/70 mb-4">Comece adicionando sua primeira página</p>
                    <Button onClick={() => setShowAddPage(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Página
                    </Button>
                  </div>
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonEditorWizard;
