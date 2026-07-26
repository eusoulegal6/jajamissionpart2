import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Eye, 
  Save, 
  Upload, 
  Video, 
  FileText, 
  HelpCircle, 
  MessageSquare, 
  Headphones, 
  Volume2,
  GripVertical,
  BookText,
  File,
  Presentation,
  Mic,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Sparkles,
  X,
  Settings,
  Layers,
  BookOpen,
  Award,
  Link2,
  PenLine,
  LayoutList,
  FileQuestion,
  ListChecks,
  FileType
} from 'lucide-react';
import { useAudioGeneration } from '@/hooks/useAudioGeneration';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import PageEditorWrapper from './page-editors/PageEditorWrapper';
import FlashcardsEditor from './page-editors/FlashcardsEditor';
import ComplementaryLessonsSelector from './ComplementaryLessonsSelector';
import { useContentCategories, useContentChapters } from '@/hooks/useContent';
import { useTOEFLCategories, useTOEFLChapters } from '@/hooks/useTOEFLContent';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { getVoiceArtistNames } from '@/utils/voiceArtists';
import { Switch } from '@/components/ui/switch';
import { PNL_LESSON_OPTIONS } from '@/data/pnlLessons';
import { ScrollArea } from '@/components/ui/scroll-area';

// ─── Page type metadata for visual editor ───
const VISUAL_PAGE_TYPES: { type: LessonPage['type']; label: string; icon: React.ElementType; category: string }[] = [
  { type: 'article', label: 'Artigo', icon: FileText, category: 'Conteúdo' },
  { type: 'ttsArticle', label: 'Artigo com Áudio', icon: Volume2, category: 'Conteúdo' },
  { type: 'video', label: 'Vídeo', icon: Video, category: 'Conteúdo' },
  { type: 'videoQuiz', label: 'Quiz de Vídeo', icon: Video, category: 'Conteúdo' },
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
  { type: 'aiFeedback', label: 'Feedback IA', icon: MessageSquare, category: 'Escrita & IA' },
  { type: 'aiFeedbackWithParameters', label: 'IA com Parâmetros', icon: MessageSquare, category: 'Escrita & IA' },
  { type: 'aiFeedbackWithParametersEssay', label: 'IA Essay', icon: MessageSquare, category: 'Escrita & IA' },
  { type: 'listening', label: 'Transcrição', icon: Headphones, category: 'Listening' },
  { type: 'listeningVideo', label: 'Transcrição Vídeo', icon: Video, category: 'Listening' },
  { type: 'recommendedVocabulary', label: 'Vocabulário Rec.', icon: BookText, category: 'Vocabulário' },
  { type: 'suggestedWords', label: 'Palavras Sugeridas', icon: MessageSquare, category: 'Vocabulário' },
  { type: 'customPronunciationSlides', label: 'Pronúncia Custom', icon: Mic, category: 'Pronúncia' },
  { type: 'audioSlides', label: 'Slides com Áudio', icon: Volume2, category: 'Pronúncia' },
  { type: 'pnlSlides', label: 'Slides PNL', icon: Layers, category: 'PNL' },
  { type: 'pronunciationSlides', label: 'Pronúncia PNL', icon: Mic, category: 'PNL' },
];

const getVisualPageTypeMeta = (type: string) => VISUAL_PAGE_TYPES.find(p => p.type === type) || { label: type, icon: FileText, category: 'Outro' };

export interface LessonPage {
  id: string;
  type: 'video' | 'article' | 'trueFalse' | 'aiFeedback' | 'aiFeedbackWithParameters' | 'aiFeedbackWithParametersEssay' | 'listening' | 'listeningVideo' | 'ttsArticle' | 'videoQuiz' | 'multipleChoice' | 'exactAnswer' | 'matching' | 'recommendedVocabulary' | 'trueFalseWithText' | 'multipleChoiceWithText' | 'audioMultipleChoice' | 'essay' | 'suggestedWords' | 'slideshow' | 'pdf' | 'pnlSlides' | 'pronunciationSlides' | 'customPronunciationSlides' | 'audioSlides';
  title: string;
  content: any;
}

export interface LessonCreatorData {
  title: string;
  description: string;
  destination: 'lessons' | 'content' | 'toefl';
  // For lessons destination
  lessonCategory?: 'facil' | 'medio' | 'dificil' | 'fluente' | 'pnl' | 'Iniciante' | 'Intermediário' | 'Avançado' | 'Business' | 'facil_es' | 'medio_es' | 'dificil_es' | 'fluente_es';
  // For content destination  
  categoryId?: string;
  chapterId?: string;
  pages: LessonPage[];
  // Credits configuration
  creditsEnabled?: boolean;
  narrator?: string;
  // Flashcards configuration
  flashcards?: Array<{ front: string; back: string; context?: string }>;
  // Complementary lessons
  complementaryLessonIds?: string[];
  // PNL Consultation
  pnlConsultationLessonId?: string;
}

const LessonCreatorWizard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [creationMode, setCreationMode] = useState<'select' | 'wizard' | 'json'>('select');
  const [visualEditorMode, setVisualEditorMode] = useState(false);
  const [showVisualAddPage, setShowVisualAddPage] = useState(false);
  const [visualActivePanel, setVisualActivePanel] = useState<'pages' | 'settings'>('pages');
  const [currentStep, setCurrentStep] = useState(0);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [lessonData, setLessonData] = useState<LessonCreatorData>({
    title: '',
    description: '',
    destination: 'lessons',
    pages: [],
    flashcards: []
  });
  
  // Fetch content categories and chapters
  const { data: contentCategories, isLoading: categoriesLoading } = useContentCategories();
  const { data: contentChapters, isLoading: chaptersLoading } = useContentChapters(lessonData.categoryId || '');
  const { data: toeflCategories } = useTOEFLCategories();
  const { data: toeflChapters } = useTOEFLChapters(lessonData.categoryId || '');
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedPageType, setSelectedPageType] = useState<LessonPage['type']>('article');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);
  
  // Audio generation hook
  const { progress: audioProgress, generateMissingAudio, countItemsNeedingAudio } = useAudioGeneration();
  const { progress: imageProgress, generateMissingImages, countItemsNeedingImages } = useImageGeneration();

  // Tracks whether the lesson has already been persisted to the DB.
  // When set, subsequent saves (and post-generation auto-saves) UPDATE instead of INSERT.
  const [savedRef, setSavedRef] = useState<{ table: 'lessons' | 'lessons_spanish' | 'toefl_items' | 'content_items'; id: string } | null>(null);

  // Persist the latest content for an already-saved lesson (used by auto-save after generation)
  const persistLatestContent = useCallback(async (pages: LessonPage[]) => {
    if (!savedRef) return;
    const lessonContent: any = {
      pages,
      credits: lessonData.creditsEnabled ? { enabled: true, narrator: lessonData.narrator } : undefined,
      flashcards: lessonData.flashcards && lessonData.flashcards.length > 0 ? lessonData.flashcards : undefined,
      complementaryLessonIds: lessonData.complementaryLessonIds && lessonData.complementaryLessonIds.length > 0 ? lessonData.complementaryLessonIds : undefined,
      pnlConsultationLessonId: lessonData.pnlConsultationLessonId || undefined,
    };
    const { error } = await supabase.from(savedRef.table).update({ content: lessonContent }).eq('id', savedRef.id);
    if (error) {
      console.error('Auto-save failed:', error);
      toast.error(`Auto-save falhou: ${error.message}`);
    } else {
      toast.success('Mídias salvas no banco automaticamente.');
    }
  }, [savedRef, lessonData.creditsEnabled, lessonData.narrator, lessonData.flashcards, lessonData.complementaryLessonIds, lessonData.pnlConsultationLessonId]);

  const handleGenerateAudio = async () => {
    let latestPages: LessonPage[] = lessonData.pages;
    const result = await generateMissingAudio(lessonData.pages, (updatedPages) => {
      latestPages = updatedPages;
      setLessonData(prev => ({ ...prev, pages: updatedPages }));
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.warning(result.message);
    }

    // Auto-persist if lesson already exists in DB
    if (savedRef && result.successCount > 0) {
      await persistLatestContent(latestPages);
    }
  };

  const handleGenerateImages = async () => {
    let latestPages: LessonPage[] = lessonData.pages;
    const result = await generateMissingImages(lessonData.pages, (updatedPages) => {
      latestPages = updatedPages;
      setLessonData(prev => ({ ...prev, pages: updatedPages }));
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.warning(result.message);
    }

    if (savedRef && (result as any).successCount > 0) {
      await persistLatestContent(latestPages);
    }
  };

  const handleGenerateAll = async () => {
    // Generate audio first
    if (countItemsNeedingAudio(lessonData.pages) > 0) {
      await handleGenerateAudio();
    }

    // Then generate images
    if (countItemsNeedingImages(lessonData.pages) > 0) {
      await handleGenerateImages();
    }
  };


  const steps = [
    'Informações Básicas',
    'Destino',
    'Páginas',
    'Configurações',
    'Revisão'
  ];

  const pageTypes = [
    { type: 'video' as const, icon: Video, label: 'Vídeo', description: 'Adicionar vídeo com ou sem quiz' },
    { type: 'article' as const, icon: FileText, label: 'Artigo', description: 'Artigo de texto com imagem' },
    { type: 'slideshow' as const, icon: FileText, label: 'Slideshow', description: 'Apresentação de slides com áudio' },
    { type: 'pdf' as const, icon: File, label: 'PDF', description: 'Visualizador de documentos PDF' },
    { type: 'trueFalse' as const, icon: HelpCircle, label: 'Verdadeiro/Falso', description: 'Quiz de verdadeiro ou falso' },
    { type: 'trueFalseWithText' as const, icon: FileText, label: 'V/F com Texto', description: 'Texto para ler + perguntas V/F' },
    { type: 'multipleChoice' as const, icon: HelpCircle, label: 'Múltipla Escolha', description: 'Pergunta com 4 opções' },
    { type: 'multipleChoiceWithText' as const, icon: FileText, label: 'M.E. com Texto', description: 'Texto para ler + múltipla escolha' },
    { type: 'exactAnswer' as const, icon: MessageSquare, label: 'Resposta Exata', description: 'Pergunta com resposta específica' },
    { type: 'matching' as const, icon: FileText, label: 'Associação', description: 'Conectar pares de itens' },
    { type: 'recommendedVocabulary' as const, icon: MessageSquare, label: 'Vocabulário Recomendado', description: 'IA com vocabulário sugerido' },
    { type: 'aiFeedback' as const, icon: MessageSquare, label: 'IA Feedback', description: 'Conversa com feedback da IA' },
    { type: 'aiFeedbackWithParameters' as const, icon: MessageSquare, label: 'IA Feedback com Parâmetros', description: 'IA Feedback com parâmetros de avaliação customizados' },
    { type: 'aiFeedbackWithParametersEssay' as const, icon: FileText, label: 'IA Analyzer com Parâmetros - Essay', description: 'IA Feedback para essays com área expandida de escrita' },
    { type: 'listening' as const, icon: Headphones, label: 'Listening', description: 'Exercício de compreensão auditiva' },
    { type: 'listeningVideo' as const, icon: Video, label: 'Video Listening', description: 'Listening com vídeo (sem geração de áudio)' },
    { type: 'ttsArticle' as const, icon: Volume2, label: 'TTS Artigo', description: 'Artigo com áudio sintetizado' },
    { type: 'audioMultipleChoice' as const, icon: Volume2, label: 'Áudio + M.E.', description: 'Múltipla escolha com áudio' },
    { type: 'essay' as const, icon: FileText, label: 'Redação', description: 'Atividade de escrita com feedback IA' },
    { type: 'videoQuiz' as const, icon: Video, label: 'Vídeo Quiz', description: 'Vídeo com perguntas durante reprodução' },
    { type: 'suggestedWords' as const, icon: BookText, label: 'Palavras Sugeridas', description: 'Palavras para adicionar aos flashcards' },
    { type: 'pnlSlides' as const, icon: Presentation, label: 'PNL Slides', description: 'Vocabulário slideshow das lições PNL' },
    { type: 'pronunciationSlides' as const, icon: Presentation, label: 'Pronúncia Slides', description: 'Prática de pronúncia com gravação e feedback' },
    { type: 'customPronunciationSlides' as const, icon: Mic, label: 'Pronúncia Personalizada', description: 'Slides de pronúncia com frases customizadas' },
    { type: 'audioSlides' as const, icon: Volume2, label: 'Audio Slides', description: 'Slides de vocabulário com áudio personalizado' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (creationMode === 'json' || creationMode === 'wizard') {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      } else {
        setCreationMode('select');
        setCurrentStep(0);
      }
    } else {
      navigate('/');
    }
  };

  const handleJsonImport = () => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonInput);
      
      // Validate the JSON structure
      if (!parsed.title) {
        setJsonError('JSON must have a "title" field');
        return;
      }
      
      // Extract pages from content.pages or content directly if it's an array
      let pages = [];
      if (parsed.content?.pages) {
        pages = parsed.content.pages;
      } else if (Array.isArray(parsed.content)) {
        pages = parsed.content;
      } else if (parsed.pages) {
        pages = parsed.pages;
      }
      
      // Build lessonData from the parsed JSON
      setLessonData(prev => ({
        ...prev,
        title: parsed.title || '',
        description: parsed.description || '',
        pages: pages.map((page: any, index: number) => ({
          id: page.id || `page_${Date.now()}_${index}`,
          type: page.type || 'article',
          title: page.title || `Page ${index + 1}`,
          content: page.content || page
        })),
        creditsEnabled: parsed.content?.credits?.enabled || false,
        narrator: parsed.content?.credits?.narrator || '',
        flashcards: parsed.content?.flashcards || [],
        complementaryLessonIds: parsed.content?.complementaryLessonIds || [],
        pnlConsultationLessonId: parsed.content?.pnlConsultationLessonId || ''
      }));
      
      // Move to step 1 (destination selection) in wizard mode
      setCreationMode('wizard');
      setCurrentStep(1);
      
      toast.success(`JSON importado! ${pages.length} páginas encontradas.`);
    } catch (e) {
      setJsonError(`JSON inválido: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
    }
  };

  const generateUniqueId = () => {
    return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addNewPage = () => {
    const newPage: LessonPage = {
      id: generateUniqueId(),
      type: selectedPageType,
      title: `Nova página ${selectedPageType}`,
      content: getDefaultContentForType(selectedPageType)
    };
    
    setLessonData(prev => ({
      ...prev,
      pages: [...prev.pages, newPage]
    }));
    
    // Navigate to the newly added page
    setCurrentPageIndex(lessonData.pages.length);
  };

  const getDefaultContentForType = (type: LessonPage['type']) => {
    switch (type) {
      case 'video':
        return { videoUrl: '', transcript: '' };
      case 'article':
        return { text: '', imageUrl: '', audioUrl: '' };
      case 'trueFalse':
        return { statement: '', isTrue: true, explanation: '' };
      case 'multipleChoice':
        return { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' };
      case 'exactAnswer':
        return { question: '', correctAnswers: [''], explanation: '' };
      case 'matching':
        return { pairs: [{ left: '', right: '' }], instructions: '' };
      case 'trueFalseWithText':
        return { text: '', questions: [] };
      case 'multipleChoiceWithText':
        return { text: '', questions: [] };
      case 'recommendedVocabulary':
        return { questions: [], topic: '', recommendedWords: [] };
      case 'aiFeedback':
        return { questions: [], topic: '' };
      case 'aiFeedbackWithParameters':
        return { questions: [], topic: '', evaluationParameters: [] };
      case 'aiFeedbackWithParametersEssay':
        return { questions: [], topic: '', evaluationParameters: [] };
      case 'listening':
        return { audioUrl: '', transcript: '', questions: [] };
      case 'listeningVideo':
        return { videoUrl: '', questions: [{ originalText: '' }] };
      case 'ttsArticle':
        return { displayText: '', audioText: '', imageUrl: '' };
      case 'audioMultipleChoice':
        return { question: '', audioUrl: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' };
      case 'essay':
        return { topic: '', instructions: '' };
      case 'suggestedWords':
        return { description: '', suggestedWords: [] };
      case 'pdf':
        return { pdfUrl: '', title: '' };
      case 'pnlSlides':
        return { lessonId: '', category: '' };
      case 'pronunciationSlides':
        return { lessonId: '', category: '' };
      case 'customPronunciationSlides':
        return { slides: [] };
      case 'audioSlides':
        return { slides: [] };
      default:
        return {};
    }
  };

  const removePage = (pageId: string) => {
    setLessonData(prev => ({
      ...prev,
      pages: prev.pages.filter(page => page.id !== pageId)
    }));
  };

  const updatePage = (updatedPage: LessonPage) => {
    setLessonData(prev => ({
      ...prev,
      pages: prev.pages.map(page => 
        page.id === updatedPage.id ? updatedPage : page
      )
    }));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const newPages = Array.from(lessonData.pages);
    const [reorderedItem] = newPages.splice(result.source.index, 1);
    newPages.splice(result.destination.index, 0, reorderedItem);

    setLessonData(prev => ({
      ...prev,
      pages: newPages
    }));
  };

  const handleExcelImport = async (file: File) => {
    setIsImportingExcel(true);
    try {
      console.log('📊 Starting Excel import for file:', file.name);
      
      // Import xlsx library dynamically
      const XLSX = await import('xlsx');
      
      // Read the file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON array
      const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log('📋 Excel data parsed:', excelData.length, 'rows');

      // Send to edge function for AI parsing
      const response = await fetch('https://mcuquzgpaeoqskesgcnx.supabase.co/functions/v1/import-excel-pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ excelData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Excel import error:', errorData);
        throw new Error(errorData.error || 'Failed to import Excel');
      }

      const data = await response.json();
      console.log('✅ Excel import successful:', data);

      if (!data.pages || !Array.isArray(data.pages)) {
        throw new Error('Invalid response from server');
      }

      // Create article pages from the imported data
      const newPages: LessonPage[] = data.pages.map((pageData: any, index: number) => ({
        id: `page_${Date.now()}_${index}`,
        type: 'article' as const,
        title: `Article ${lessonData.pages.length + index + 1}`,
        content: {
          text: pageData.text || '',
          imageUrl: pageData.imageUrl || '',
          audioUrl: pageData.audioUrl || '',
          content: {
            text: pageData.text || '',
            imageUrl: pageData.imageUrl || '',
            audioUrl: pageData.audioUrl || ''
          }
        }
      }));

      // Add the new pages to the lesson
      setLessonData(prev => ({
        ...prev,
        pages: [...prev.pages, ...newPages]
      }));

      toast.success(`${newPages.length} páginas importadas com sucesso!`);
    } catch (error) {
      console.error('❌ Error importing Excel:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao importar Excel');
    } finally {
      setIsImportingExcel(false);
    }
  };

  // Drag and drop handlers for Excel import
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Por favor, envie um arquivo Excel (.xlsx, .xls) ou CSV (.csv)');
      return;
    }

    handleExcelImport(file);
  };

  // Map form difficulty values to database expected format
  const isSpanishCategory = (category: string) => category.endsWith('_es');

  const mapDifficultyToDatabase = (formDifficulty: string): string => {
    // Strip _es suffix for Spanish categories
    const baseDifficulty = formDifficulty.replace('_es', '');
    const difficultyMap: { [key: string]: string } = {
      'facil': 'Fácil',
      'medio': 'Médio', 
      'dificil': 'Difícil',
      'pnl': 'PNL',
      'fluente': 'Fluente'
    };
    return difficultyMap[baseDifficulty.toLowerCase()] || formDifficulty;
  };

  const saveLesson = async () => {
    try {
      // Safety: don't save while audio is still generating
      if (audioProgress.isGenerating) {
        toast.error('Aguarde a geração de áudio terminar antes de salvar.');
        return;
      }

      // Safety: if there are pages still needing audio, generate first so URLs persist
      const pendingAudios = countItemsNeedingAudio(lessonData.pages);
      if (pendingAudios > 0) {
        toast.error(`Gere os ${pendingAudios} áudio(s) pendentes antes de salvar (botão "Gerar Áudio").`);
        return;
      }

      console.log('🔧 LESSON CREATOR - Saving lesson with data:', lessonData);
      
      
      // Validate required fields
      if (lessonData.destination === 'toefl' && !lessonData.categoryId) {
        toast.error('Por favor, selecione uma categoria TOEFL');
        return;
      }
      
      if (lessonData.destination === 'content' && !lessonData.chapterId) {
        toast.error('Por favor, selecione um capítulo de conteúdo');
        return;
      }
      
      if (lessonData.destination === 'lessons' && !lessonData.lessonCategory) {
        toast.error('Por favor, selecione uma categoria de lição');
        return;
      }
      
      const buildContent = () => ({
        pages: lessonData.pages,
        credits: lessonData.creditsEnabled ? { enabled: true, narrator: lessonData.narrator } : undefined,
        flashcards: lessonData.flashcards && lessonData.flashcards.length > 0 ? lessonData.flashcards : undefined,
        complementaryLessonIds: lessonData.complementaryLessonIds && lessonData.complementaryLessonIds.length > 0 ? lessonData.complementaryLessonIds : undefined,
        pnlConsultationLessonId: lessonData.pnlConsultationLessonId || undefined,
      });

      // If already saved, do an UPDATE on the existing row instead of inserting a duplicate
      if (savedRef) {
        const lessonContent = buildContent() as any;
        const updatePayload: any = { content: lessonContent };
        if (savedRef.table === 'lessons' || savedRef.table === 'lessons_spanish') {
          updatePayload.title = lessonData.title;
          updatePayload.description = lessonData.description;
        } else {
          updatePayload.title = lessonData.title;
        }
        const { error } = await supabase.from(savedRef.table).update(updatePayload).eq('id', savedRef.id);
        if (error) throw error;
        toast.success('Lição atualizada com sucesso!');
        return;
      }

      if (lessonData.destination === 'lessons') {
        const isSpanish = isSpanishCategory(lessonData.lessonCategory!);
        const tableName = isSpanish ? 'lessons_spanish' : 'lessons';
        const lessonId = `${lessonData.lessonCategory}_${Date.now()}`;
        const lessonContent = buildContent();

        console.log(`🔧 LESSON CREATOR - Saving to ${tableName} table with ID:`, lessonId);
        const { error } = await supabase
          .from(tableName)
          .insert({
            id: lessonId,
            title: lessonData.title,
            description: lessonData.description,
            difficulty: mapDifficultyToDatabase(lessonData.lessonCategory!),
            content: lessonContent as any
          });

        if (error) {
          console.error(`🔧 LESSON CREATOR - ${tableName} table error:`, error);
          throw error;
        }
        setSavedRef({ table: tableName as any, id: lessonId });
      } else if (lessonData.destination === 'toefl') {
        const toeflItemData = buildContent();
        console.log('🔧 LESSON CREATOR - Saving to toefl_items table with category:', lessonData.categoryId);
        const { data, error } = await supabase
          .from('toefl_items')
          .insert({
            title: lessonData.title,
            category_id: lessonData.categoryId!,
            content: toeflItemData as any,
            order_index: 0
          })
          .select('id')
          .single();

        if (error) {
          console.error('🔧 LESSON CREATOR - TOEFL items table error:', error);
          throw error;
        }
        if (data?.id) setSavedRef({ table: 'toefl_items', id: data.id });
      } else {
        const contentItemData = buildContent();
        console.log('🔧 LESSON CREATOR - Saving to content_items table with chapter_id:', lessonData.chapterId);
        const { data, error } = await supabase
          .from('content_items')
          .insert({
            title: lessonData.title,
            chapter_id: lessonData.chapterId!,
            content: contentItemData as any,
            order: 0
          })
          .select('id')
          .single();

        if (error) {
          console.error('🔧 LESSON CREATOR - Content items table error:', error);
          throw error;
        }
        if (data?.id) setSavedRef({ table: 'content_items', id: data.id });
      }

      toast.success('Lição salva! Você pode continuar gerando áudios/imagens — elas serão salvas automaticamente.');

    } catch (error) {
      console.error('🔧 LESSON CREATOR - Save error:', error);
      toast.error(`Erro ao salvar lição: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Título da Lição</Label>
              <Input
                id="title"
                value={lessonData.title}
                onChange={(e) => setLessonData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Digite o título da lição"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={lessonData.description}
                onChange={(e) => setLessonData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o conteúdo e objetivos da lição"
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label>Onde será inserida a lição?</Label>
              <div className="mt-4 space-y-4">
                <Card 
                  className={`cursor-pointer transition-all ${
                    lessonData.destination === 'lessons' 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setLessonData(prev => ({ ...prev, destination: 'lessons' }))}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold">Lições Completas</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Adicionar à seção de lições estruturadas por dificuldade
                    </p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-all ${
                    lessonData.destination === 'content' 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setLessonData(prev => ({ ...prev, destination: 'content' }))}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold">Conteúdo</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Adicionar à seção de conteúdo organizado por categorias e capítulos
                    </p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-all ${
                    lessonData.destination === 'toefl' 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setLessonData(prev => ({ ...prev, destination: 'toefl' }))}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold">TOEFL</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Adicionar às categorias TOEFL (Reading, Listening, Speaking, Writing)
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {lessonData.destination === 'lessons' && (
              <div className="space-y-4">
                <div>
                  <Label>Categoria da Lição</Label>
                  <Select
                    value={lessonData.lessonCategory || ''}
                    onValueChange={(value: LessonCreatorData['lessonCategory']) => 
                      setLessonData(prev => ({ ...prev, lessonCategory: value }))
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facil">Fácil</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="dificil">Difícil</SelectItem>
                      <SelectItem value="fluente">Fluente</SelectItem>
                      <SelectItem value="pnl">PNL</SelectItem>
                      <SelectItem value="Iniciante">Curso Iniciante</SelectItem>
                      <SelectItem value="Intermediário">Curso Intermediário</SelectItem>
                      <SelectItem value="Avançado">Curso Avançado</SelectItem>
                      <SelectItem value="Business">Curso Business</SelectItem>
                      <SelectItem value="facil_es">Fácil (Espanhol) 🇪🇸</SelectItem>
                      <SelectItem value="medio_es">Médio (Espanhol) 🇪🇸</SelectItem>
                      <SelectItem value="dificil_es">Difícil (Espanhol) 🇪🇸</SelectItem>
                      <SelectItem value="fluente_es">Fluente (Espanhol) 🇪🇸</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {lessonData.destination === 'content' && (
              <div className="space-y-4">
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={lessonData.categoryId || ''}
                    onValueChange={(value) => {
                      setLessonData(prev => ({ 
                        ...prev, 
                        categoryId: value,
                        chapterId: undefined // Reset chapter when category changes
                      }));
                    }}
                    disabled={categoriesLoading}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={categoriesLoading ? "Carregando..." : "Selecione uma categoria"} />
                    </SelectTrigger>
                    <SelectContent>
                      {contentCategories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Capítulo</Label>
                  <Select
                    value={lessonData.chapterId || ''}
                    onValueChange={(value) => setLessonData(prev => ({ ...prev, chapterId: value }))}
                    disabled={!lessonData.categoryId || chaptersLoading}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={
                        !lessonData.categoryId 
                          ? "Selecione uma categoria primeiro" 
                          : chaptersLoading 
                            ? "Carregando..." 
                            : "Selecione um capítulo"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {contentChapters?.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {lessonData.destination === 'toefl' && (
              <div className="space-y-4">
                <div>
                  <Label>Categoria TOEFL</Label>
                  <Select
                    value={lessonData.categoryId || ''}
                    onValueChange={(value) => {
                      setLessonData(prev => ({ 
                        ...prev, 
                        categoryId: value
                      }));
                    }}
                    disabled={categoriesLoading}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={categoriesLoading ? "Carregando..." : "Selecione uma categoria TOEFL"} />
                    </SelectTrigger>
                    <SelectContent>
                      {toeflCategories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  TOEFL é organizado por categorias (Reading, Listening, Speaking, Writing) sem necessidade de capítulos.
                </p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Páginas da Lição</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setVisualEditorMode(true)}
                  variant="default"
                  size="sm"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Editor Visual
                </Button>
                <Button
                  onClick={() => {
                    const articlePages = lessonData.pages.filter(page => page.type === 'article');
                    if (articlePages.length === 0) {
                      toast.error('Nenhuma página de artigo encontrada');
                      return;
                    }
                    setLessonData(prev => ({
                      ...prev,
                      pages: prev.pages.map(page => 
                        page.type === 'article' 
                          ? { ...page, content: { ...page.content, slideMode: true } }
                          : page
                      )
                    }));
                    toast.success(`Slide mode ativado em ${articlePages.length} página(s) de artigo`);
                  }}
                  variant="outline"
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ativar Slide Mode (Artigos)
                </Button>
                <Button
                  onClick={() => setPreviewMode(!previewMode)}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {previewMode ? 'Editar' : 'Visualizar'}
                </Button>
              </div>
            </div>

            {!previewMode && (
              <>
                <div className="border rounded-lg p-4">
                  <Label>Adicionar Nova Página</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {pageTypes.map(({ type, icon: Icon, label }) => (
                      <Button
                        key={type}
                        variant={selectedPageType === type ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPageType(type)}
                        className="h-auto p-3 flex flex-col items-center gap-2"
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{label}</span>
                      </Button>
                    ))}
                  </div>
                  <Button
                    onClick={addNewPage}
                    className="w-full mt-3"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Página
                  </Button>
                </div>

                <div 
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    isDraggingOver 
                      ? 'border-2 border-primary bg-primary/10 scale-[1.02]' 
                      : 'border-border bg-muted/30'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Label>Importar Páginas do Excel</Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    {isDraggingOver 
                      ? '📥 Solte o arquivo aqui' 
                      : 'Faça upload de um arquivo Excel/CSV ou arraste o arquivo aqui. A IA entenderá automaticamente a estrutura.'
                    }
                  </p>
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleExcelImport(file);
                        e.target.value = ''; // Reset input
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    onClick={() => excelInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                    size="sm"
                    disabled={isImportingExcel}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isImportingExcel ? 'Importando...' : 'Selecionar Arquivo Excel/CSV'}
                  </Button>
                </div>

                {/* Audio Generation Section - Shows for all page types that need audio */}
                {countItemsNeedingAudio(lessonData.pages) > 0 && (
                  <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <Label className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
                          <Volume2 className="h-4 w-4" />
                          Geração de Áudio
                        </Label>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          {countItemsNeedingAudio(lessonData.pages)} item{countItemsNeedingAudio(lessonData.pages) !== 1 ? 's' : ''} precisa{countItemsNeedingAudio(lessonData.pages) !== 1 ? 'm' : ''} de áudio
                        </p>
                      </div>
                      <Button
                        onClick={handleGenerateAudio}
                        disabled={audioProgress.isGenerating || countItemsNeedingAudio(lessonData.pages) === 0}
                        variant="default"
                        size="sm"
                        className="gap-2"
                      >
                        {audioProgress.isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Gerando {audioProgress.current}/{audioProgress.total}
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-4 w-4" />
                            Gerar Áudio
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Progress Bar */}
                    {audioProgress.isGenerating && (
                      <div className="mt-3">
                        <Progress 
                          value={(audioProgress.current / audioProgress.total) * 100} 
                          className="h-2"
                        />
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 text-center">
                          {Math.round((audioProgress.current / audioProgress.total) * 100)}% completo
                        </p>
                      </div>
                    )}
                    
                    {/* Error Display */}
                    {audioProgress.error && (
                      <p className="text-sm text-destructive mt-2">
                        {audioProgress.error}
                      </p>
                    )}
                  </div>
                )}

                {/* Image Generation Section */}
                {countItemsNeedingImages(lessonData.pages) > 0 && (
                  <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <Label className="text-purple-800 dark:text-purple-200 flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Geração de Imagens
                        </Label>
                        <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                          {countItemsNeedingImages(lessonData.pages)} item{countItemsNeedingImages(lessonData.pages) !== 1 ? 's' : ''} precisa{countItemsNeedingImages(lessonData.pages) !== 1 ? 'm' : ''} de imagens
                        </p>
                      </div>
                      <Button
                        onClick={handleGenerateImages}
                        disabled={imageProgress.isGenerating || countItemsNeedingImages(lessonData.pages) === 0}
                        variant="default"
                        size="sm"
                        className="gap-2 bg-purple-600 hover:bg-purple-700"
                      >
                        {imageProgress.isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Gerando {imageProgress.current}/{imageProgress.total}
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-4 w-4" />
                            Gerar Imagens
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Progress Bar */}
                    {imageProgress.isGenerating && (
                      <div className="mt-3">
                        <Progress 
                          value={(imageProgress.current / imageProgress.total) * 100} 
                          className="h-2"
                        />
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 text-center">
                          {Math.round((imageProgress.current / imageProgress.total) * 100)}% completo
                        </p>
                      </div>
                    )}
                    
                    {/* Error Display */}
                    {imageProgress.error && (
                      <p className="text-sm text-destructive mt-2">
                        {imageProgress.error}
                      </p>
                    )}
                  </div>
                )}

                {/* Generate All Button - only show if both audio and images are needed */}
                {(countItemsNeedingAudio(lessonData.pages) > 0 || countItemsNeedingImages(lessonData.pages) > 0) && (
                  <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-primary/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-primary flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Gerar Todos
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {countItemsNeedingAudio(lessonData.pages)} áudios + {countItemsNeedingImages(lessonData.pages)} imagens
                        </p>
                      </div>
                      <Button
                        onClick={handleGenerateAll}
                        disabled={audioProgress.isGenerating || imageProgress.isGenerating}
                        variant="default"
                        size="sm"
                        className="gap-2"
                      >
                        {(audioProgress.isGenerating || imageProgress.isGenerating) ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Gerar Todos
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {lessonData.pages.length > 0 && (
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
                      Página {currentPageIndex + 1} de {lessonData.pages.length}
                    </span>
                    <div className="flex gap-1">
                      {lessonData.pages.map((_, idx) => (
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
                    onClick={() => setCurrentPageIndex(Math.min(lessonData.pages.length - 1, currentPageIndex + 1))}
                    disabled={currentPageIndex === lessonData.pages.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Current Page Editor */}
                {lessonData.pages[currentPageIndex] && (
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
                                  const newPages = [...lessonData.pages];
                                  [newPages[currentPageIndex], newPages[currentPageIndex - 1]] = 
                                    [newPages[currentPageIndex - 1], newPages[currentPageIndex]];
                                  setLessonData(prev => ({ ...prev, pages: newPages }));
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
                                if (currentPageIndex < lessonData.pages.length - 1) {
                                  const newPages = [...lessonData.pages];
                                  [newPages[currentPageIndex], newPages[currentPageIndex + 1]] = 
                                    [newPages[currentPageIndex + 1], newPages[currentPageIndex]];
                                  setLessonData(prev => ({ ...prev, pages: newPages }));
                                  setCurrentPageIndex(currentPageIndex + 1);
                                }
                              }}
                              disabled={currentPageIndex === lessonData.pages.length - 1}
                              title="Mover para baixo"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                          <div>
                            <Badge variant="outline">
                              {pageTypes.find(pt => pt.type === lessonData.pages[currentPageIndex].type)?.label}
                            </Badge>
                            <h4 className="font-medium mt-1">{lessonData.pages[currentPageIndex].title}</h4>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const pageId = lessonData.pages[currentPageIndex].id;
                            removePage(pageId);
                            // Adjust current index if needed
                            if (currentPageIndex >= lessonData.pages.length - 1 && currentPageIndex > 0) {
                              setCurrentPageIndex(currentPageIndex - 1);
                            }
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <PageEditorWrapper
                          page={lessonData.pages[currentPageIndex]}
                          onChange={updatePage}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {lessonData.pages.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma página adicionada ainda</p>
                <p className="text-sm">Use os botões acima para adicionar páginas à sua lição</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Configurações Finais</h3>
            <p className="text-muted-foreground">Configure os créditos, flashcards e lições complementares.</p>
            
            <Card>
              <CardHeader>
                <CardTitle>Créditos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Habilitar Créditos</Label>
                    <p className="text-sm text-muted-foreground">
                      Exibir tela de créditos com informações do narrador ao final da lição
                    </p>
                  </div>
                  <Switch
                    checked={lessonData.creditsEnabled || false}
                    onCheckedChange={(checked) => 
                      setLessonData(prev => ({ 
                        ...prev, 
                        creditsEnabled: checked,
                        narrator: checked ? prev.narrator : undefined
                      }))
                    }
                  />
                </div>
                
                {lessonData.creditsEnabled && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label>Narrador</Label>
                      <Select
                        value={lessonData.narrator || ''}
                        onValueChange={(value) => 
                          setLessonData(prev => ({ ...prev, narrator: value }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione um narrador" />
                        </SelectTrigger>
                        <SelectContent>
                          {getVoiceArtistNames().map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {lessonData.narrator && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <Label className="text-sm font-medium">Preview dos Créditos</Label>
                        <div className="mt-2 text-center">
                          <p className="text-lg font-semibold mb-2">Narrado por:</p>
                          <p className="text-base">{lessonData.narrator}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <ComplementaryLessonsSelector
              destination={lessonData.destination}
              lessonCategory={lessonData.lessonCategory}
              categoryId={lessonData.categoryId}
              selectedLessonIds={lessonData.complementaryLessonIds || []}
              onChange={(lessonIds) => 
                setLessonData(prev => ({ ...prev, complementaryLessonIds: lessonIds }))
              }
            />

            <Card>
              <CardHeader>
                <CardTitle>Consulta PNL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Habilitar Consulta PNL</Label>
                    <p className="text-sm text-muted-foreground">
                      Adicionar um ícone de consulta em todas as páginas para acessar o vocabulário PNL
                    </p>
                  </div>
                  <Switch
                    checked={!!lessonData.pnlConsultationLessonId}
                    onCheckedChange={(checked) => 
                      setLessonData(prev => ({ 
                        ...prev, 
                        pnlConsultationLessonId: checked ? 'lesson-1' : undefined
                      }))
                    }
                  />
                </div>
                
                {lessonData.pnlConsultationLessonId && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label>Lição PNL</Label>
                      <Select
                        value={lessonData.pnlConsultationLessonId}
                        onValueChange={(value) => 
                          setLessonData(prev => ({ ...prev, pnlConsultationLessonId: value }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione uma lição PNL" />
                        </SelectTrigger>
                        <SelectContent>
                          {PNL_LESSON_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <FlashcardsEditor
              flashcards={lessonData.flashcards || []}
              onChange={(flashcards) => 
                setLessonData(prev => ({ ...prev, flashcards }))
              }
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Revisão da Lição</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Título</Label>
                    <p className="text-sm text-muted-foreground">{lessonData.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Descrição</Label>
                    <p className="text-sm text-muted-foreground">{lessonData.description}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Categoria</Label>
                    <Badge>{lessonData.destination === 'lessons' ? lessonData.lessonCategory : lessonData.categoryId}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Destino</Label>
                    <p className="text-sm text-muted-foreground">
                      {lessonData.destination === 'lessons' ? 'Lições Completas' : 'Conteúdo'}
                    </p>
                  </div>
                  {lessonData.creditsEnabled && (
                    <div>
                      <Label className="text-sm font-medium">Créditos</Label>
                      <p className="text-sm text-muted-foreground">
                        Habilitado - Narrador: {lessonData.narrator}
                      </p>
                    </div>
                  )}
                  {lessonData.flashcards && lessonData.flashcards.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Flashcards</Label>
                      <p className="text-sm text-muted-foreground">
                        {lessonData.flashcards.length} flashcard{lessonData.flashcards.length !== 1 ? 's' : ''} configurado{lessonData.flashcards.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Estrutura da Lição</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Páginas ({lessonData.pages.length})
                    </Label>
                    {lessonData.pages.map((page, index) => (
                      <div key={page.id} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{index + 1}.</span>
                        <Badge variant="outline" className="text-xs">
                          {pageTypes.find(pt => pt.type === page.type)?.label}
                        </Badge>
                        <span>{page.title}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="border rounded-lg p-4 bg-muted">
              <h4 className="font-medium mb-2">JSON da Lição</h4>
              <pre className="text-xs bg-background p-3 rounded border overflow-auto max-h-40">
                {JSON.stringify(lessonData, null, 2)}
              </pre>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Visual Editor helpers ───
  const visualInsertPageAfter = (type: LessonPage['type']) => {
    const meta = getVisualPageTypeMeta(type);
    const newPage: LessonPage = {
      id: generateUniqueId(),
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
    setShowVisualAddPage(false);
  };

  const visualAddPage = (type: LessonPage['type']) => {
    const meta = getVisualPageTypeMeta(type);
    const newPage: LessonPage = {
      id: generateUniqueId(),
      type,
      title: `Nova ${meta.label}`,
      content: getDefaultContentForType(type)
    };
    setLessonData(prev => ({ ...prev, pages: [...prev.pages, newPage] }));
    setCurrentPageIndex(lessonData.pages.length);
    setShowVisualAddPage(false);
  };

  const visualMovePage = (fromIdx: number, direction: 'up' | 'down') => {
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= lessonData.pages.length) return;
    setLessonData(prev => {
      const newPages = [...prev.pages];
      [newPages[fromIdx], newPages[toIdx]] = [newPages[toIdx], newPages[fromIdx]];
      return { ...prev, pages: newPages };
    });
    setCurrentPageIndex(toIdx);
  };

  const visualDeletePage = (index: number) => {
    setLessonData(prev => ({ ...prev, pages: prev.pages.filter((_, i) => i !== index) }));
    if (currentPageIndex >= lessonData.pages.length - 1 && currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const visualGroupedTypes = VISUAL_PAGE_TYPES.reduce((acc, pt) => {
    if (!acc[pt.category]) acc[pt.category] = [];
    acc[pt.category].push(pt);
    return acc;
  }, {} as Record<string, typeof VISUAL_PAGE_TYPES>);

  const visualCurrentPage = lessonData.pages[currentPageIndex];

  // ─── VISUAL EDITOR FULL-SCREEN MODE ───
  if (visualEditorMode && creationMode === 'wizard' && currentStep === 2) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* ═══ TOP BAR ═══ */}
        <div className="flex-shrink-0 border-b bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => setVisualEditorMode(false)} className="flex-shrink-0">
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
                  <Badge variant="outline" className="text-xs">Criando</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant={visualActivePanel === 'settings' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setVisualActivePanel(visualActivePanel === 'settings' ? 'pages' : 'settings')}
              >
                <Settings className="h-4 w-4 mr-1" />
                Configurações
              </Button>
              <Button variant="outline" size="sm" onClick={() => setVisualEditorMode(false)}>
                Voltar ao Wizard
              </Button>
            </div>
          </div>
        </div>

        {/* ═══ MAIN AREA ═══ */}
        <div className="flex-1 flex min-h-0">
          {/* ─── LEFT SIDEBAR ─── */}
          <div className="w-64 flex-shrink-0 border-r bg-muted/30 flex flex-col">
            <div className="p-3 border-b flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Páginas</span>
              <Button
                variant="ghost" size="sm"
                onClick={() => setShowVisualAddPage(!showVisualAddPage)}
                className="h-7 w-7 p-0"
                title="Adicionar página"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {lessonData.pages.map((page, idx) => {
                  const meta = getVisualPageTypeMeta(page.type);
                  const Icon = meta.icon;
                  const isActive = idx === currentPageIndex;
                  return (
                    <button
                      key={page.id}
                      onClick={() => { setCurrentPageIndex(idx); setVisualActivePanel('pages'); }}
                      className={`group relative w-full text-left rounded-lg p-2.5 transition-all ${
                        isActive ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 pr-16">
                        <div className={`flex items-center justify-center h-6 w-6 rounded text-xs font-medium flex-shrink-0 ${
                          isActive ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/10 text-muted-foreground'
                        }`}>
                          {idx + 1}
                        </div>
                        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                            {page.title || meta.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">{meta.label}</p>
                        </div>
                      </div>
                      <div className={`absolute right-1 top-1 flex gap-0.5 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                        <button onClick={(e) => { e.stopPropagation(); visualMovePage(idx, 'up'); }} disabled={idx === 0} className="p-0.5 rounded hover:bg-muted-foreground/10 disabled:opacity-30" title="Mover para cima">
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); visualMovePage(idx, 'down'); }} disabled={idx === lessonData.pages.length - 1} className="p-0.5 rounded hover:bg-muted-foreground/10 disabled:opacity-30" title="Mover para baixo">
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); visualDeletePage(idx); }} className="p-0.5 rounded hover:bg-destructive/10 text-destructive/60 hover:text-destructive" title="Excluir página">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </button>
                  );
                })}

                <button
                  onClick={() => setShowVisualAddPage(true)}
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
            {showVisualAddPage && (
              <div className="border-b bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Adicionar Nova Página</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowVisualAddPage(false)} className="h-6 w-6 p-0">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {Object.entries(visualGroupedTypes).map(([category, types]) => (
                    <div key={category}>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{category}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {types.map(({ type, label, icon: Icon }) => (
                          <Button
                            key={type}
                            variant="outline"
                            size="sm"
                            onClick={() => lessonData.pages.length > 0 ? visualInsertPageAfter(type) : visualAddPage(type)}
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
            {visualActivePanel === 'settings' && (
              <ScrollArea className="flex-1">
                <div className="max-w-2xl mx-auto p-6 space-y-6">
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
                    </div>
                  </section>

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

                  <section className="space-y-4 border-t pt-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Link2 className="h-4 w-4" /> Lições Complementares
                    </h2>
                    <ComplementaryLessonsSelector
                      destination={lessonData.destination}
                      lessonCategory={lessonData.lessonCategory}
                      categoryId={lessonData.categoryId}
                      selectedLessonIds={lessonData.complementaryLessonIds || []}
                      onChange={(ids) => setLessonData(prev => ({ ...prev, complementaryLessonIds: ids }))}
                    />
                  </section>

                  <section className="space-y-4 border-t pt-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Opções de Artigos
                    </h2>
                    <Button
                      onClick={() => {
                        const articlePages = lessonData.pages.filter(p => p.type === 'article');
                        if (articlePages.length === 0) { toast.error('Nenhuma página de artigo encontrada'); return; }
                        setLessonData(prev => ({
                          ...prev,
                          pages: prev.pages.map(p => p.type === 'article' ? { ...p, content: { ...p.content, slideMode: true } } : p)
                        }));
                        toast.success(`Slide mode ativado em ${articlePages.length} artigo(s)`);
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
            {visualActivePanel === 'pages' && (
              <ScrollArea className="flex-1">
                {visualCurrentPage ? (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs gap-1">
                          {React.createElement(getVisualPageTypeMeta(visualCurrentPage.type).icon, { className: "h-3 w-3" })}
                          {getVisualPageTypeMeta(visualCurrentPage.type).label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Página {currentPageIndex + 1} de {lessonData.pages.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => visualMovePage(currentPageIndex, 'up')} disabled={currentPageIndex === 0}>
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => visualMovePage(currentPageIndex, 'down')} disabled={currentPageIndex === lessonData.pages.length - 1}>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => visualDeletePage(currentPageIndex)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <PageEditorWrapper
                      page={visualCurrentPage}
                      onChange={(updatedPage) => updatePage(updatedPage)}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-12">
                    <div className="text-center">
                      <Layers className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">Nenhuma página na lição</h3>
                      <p className="text-sm text-muted-foreground/70 mb-4">Comece adicionando sua primeira página</p>
                      <Button onClick={() => setShowVisualAddPage(true)}>
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
  }

  // Mode selection screen
  if (creationMode === 'select') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Criador de Lições</h1>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Cancelar
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Como você quer criar a lição?</h2>
              
              <Card 
                className="cursor-pointer transition-all hover:bg-primary/5 hover:ring-2 hover:ring-primary"
                onClick={() => setCreationMode('wizard')}
              >
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Criar do Zero</h3>
                    <p className="text-muted-foreground mt-1">
                      Use o assistente passo a passo para criar uma nova lição, adicionando páginas uma a uma
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer transition-all hover:bg-primary/5 hover:ring-2 hover:ring-primary"
                onClick={() => setCreationMode('json')}
              >
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Importar de JSON</h3>
                    <p className="text-muted-foreground mt-1">
                      Cole o JSON completo de uma lição existente para criar uma cópia ou fazer ajustes
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // JSON import screen
  if (creationMode === 'json') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Importar Lição de JSON</h1>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Cancelar
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="json-input">Cole o JSON da lição aqui</Label>
                <Textarea
                  id="json-input"
                  value={jsonInput}
                  onChange={(e) => {
                    setJsonInput(e.target.value);
                    setJsonError(null);
                  }}
                  placeholder='{"title": "Minha Lição", "description": "...", "content": {"pages": [...]}}'
                  className="mt-2 font-mono text-sm"
                  rows={20}
                />
              </div>
              
              {jsonError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {jsonError}
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">O JSON deve conter:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><code className="bg-muted px-1 rounded">title</code> - Título da lição</li>
                  <li><code className="bg-muted px-1 rounded">description</code> - Descrição (opcional)</li>
                  <li><code className="bg-muted px-1 rounded">content.pages</code> - Array de páginas com type e content</li>
                </ul>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              
              <Button onClick={handleJsonImport} disabled={!jsonInput.trim()}>
                Importar e Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular wizard mode
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Criador de Lições</h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => navigate('/')}>
                  {savedRef ? 'Fechar' : 'Cancelar'}
                </Button>
                {currentStep === steps.length - 1 && (
                  <Button
                    onClick={saveLesson}
                    disabled={audioProgress.isGenerating || imageProgress.isGenerating}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {audioProgress.isGenerating
                      ? 'Gerando áudio...'
                      : savedRef ? 'Atualizar Lição' : 'Salvar Lição'}
                  </Button>
                )}
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index <= currentStep
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`ml-2 text-sm ${
                      index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 h-1 mx-4 ${
                        index < currentStep ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            {renderStepContent()}
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStep === 0 ? 'Voltar' : 'Anterior'}
            </Button>

            {currentStep < steps.length - 1 && (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 0 && !lessonData.title) ||
                  (currentStep === 1 && lessonData.destination === 'content' && (!lessonData.categoryId || !lessonData.chapterId)) ||
                  (currentStep === 1 && lessonData.destination === 'lessons' && !lessonData.lessonCategory) ||
                  (currentStep === 3 && lessonData.creditsEnabled && !lessonData.narrator)
                }
              >
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonCreatorWizard;