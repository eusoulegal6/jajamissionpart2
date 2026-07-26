import React, { useRef } from 'react';
import { LessonPage } from '../LessonCreatorWizard';
import VideoPageEditor from './VideoPageEditor';
import ArticlePageEditor from './ArticlePageEditor';
import TrueFalsePageEditor from './TrueFalsePageEditor';
import TTSArticlePageEditor from './TTSArticlePageEditor';
import AIFeedbackPageEditor from './AIFeedbackPageEditor';
import AIFeedbackWithParametersPageEditor from './AIFeedbackWithParametersPageEditor';
import AIFeedbackWithParametersEssayPageEditor from './AIFeedbackWithParametersEssayPageEditor';
import ListeningTranscriptionPageEditor from './ListeningTranscriptionPageEditor';
import ListeningVideoPageEditor from './ListeningVideoPageEditor';
import MultipleChoicePageEditor from './MultipleChoicePageEditor';
import ExactAnswerPageEditor from './ExactAnswerPageEditor';
import MatchingPageEditor from './MatchingPageEditor';
import RecommendedVocabularyPageEditor from './RecommendedVocabularyPageEditor';
import TrueFalseWithTextPageEditor from './TrueFalseWithTextPageEditor';
import MultipleChoiceWithTextPageEditor from './MultipleChoiceWithTextPageEditor';
import AudioMultipleChoicePageEditor from './AudioMultipleChoicePageEditor';
import EssayPageEditor from './EssayPageEditor';
import SuggestedWordsPageEditor from './SuggestedWordsPageEditor';
import SlideshowPageEditor from './SlideshowPageEditor';
import { PDFPageEditor } from './PDFPageEditor';
import PNLSlidesPageEditor from './PNLSlidesPageEditor';
import PronunciationSlidesPageEditor from './PronunciationSlidesPageEditor';
import CustomPronunciationSlidesPageEditor from './CustomPronunciationSlidesPageEditor';
import AudioSlidesPageEditor from './AudioSlidesPageEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface PageEditorWrapperProps {
  page: LessonPage;
  onChange: (updatedPage: LessonPage) => void;
}

const PageEditorWrapper: React.FC<PageEditorWrapperProps> = ({ page, onChange }) => {
  const handleTitleChange = (title: string) => {
    onChange({ ...page, title });
  };

  const handleContentChange = (content: any) => {
    onChange({ ...page, content });
  };

  const renderPageEditor = () => {
    switch (page.type) {
      case 'video':
      case 'videoQuiz':
        return <VideoPageEditor content={page.content} onChange={handleContentChange} />;
      case 'article':
        return <ArticlePageEditor content={page.content} onChange={handleContentChange} />;
      case 'trueFalse':
        return <TrueFalsePageEditor content={page.content} onChange={handleContentChange} />;
      case 'ttsArticle':
        return <TTSArticlePageEditor content={page.content} onChange={handleContentChange} />;
      case 'aiFeedback':
        return <AIFeedbackPageEditor content={page.content} onChange={handleContentChange} />;
      case 'aiFeedbackWithParameters':
        return <AIFeedbackWithParametersPageEditor content={page.content} onChange={handleContentChange} />;
      case 'aiFeedbackWithParametersEssay':
        return <AIFeedbackWithParametersEssayPageEditor content={page.content} onChange={handleContentChange} />;
      case 'listening':
        return <ListeningTranscriptionPageEditor content={page.content} onChange={handleContentChange} />;
      case 'listeningVideo':
        return <ListeningVideoPageEditor content={page.content} onChange={handleContentChange} />;
      case 'multipleChoice':
        return <MultipleChoicePageEditor content={page.content} onChange={handleContentChange} />;
      case 'exactAnswer':
        return <ExactAnswerPageEditor content={page.content} onChange={handleContentChange} />;
      case 'matching':
        return <MatchingPageEditor content={page.content} onChange={handleContentChange} />;
      case 'recommendedVocabulary':
        return <RecommendedVocabularyPageEditor content={page.content} onChange={handleContentChange} />;
      case 'trueFalseWithText':
        return <TrueFalseWithTextPageEditor content={page.content} onChange={handleContentChange} />;
      case 'multipleChoiceWithText':
        return <MultipleChoiceWithTextPageEditor content={page.content} onChange={handleContentChange} />;
      case 'audioMultipleChoice':
        return <AudioMultipleChoicePageEditor content={page.content} onChange={handleContentChange} />;
      case 'essay':
        return <EssayPageEditor content={page.content} onChange={handleContentChange} />;
      case 'suggestedWords':
        return <SuggestedWordsPageEditor content={page.content} onChange={handleContentChange} />;
      case 'slideshow':
        return <SlideshowPageEditor data={page.content} onChange={handleContentChange} />;
      case 'pdf':
        return <PDFPageEditor content={page.content} onChange={handleContentChange} />;
      case 'pnlSlides':
        return <PNLSlidesPageEditor content={page.content} onChange={handleContentChange} />;
      case 'pronunciationSlides':
        return <PronunciationSlidesPageEditor content={page.content} onChange={handleContentChange} />;
      case 'customPronunciationSlides':
        return <CustomPronunciationSlidesPageEditor content={page.content} onChange={handleContentChange} />;
      case 'audioSlides':
        return <AudioSlidesPageEditor content={page.content} onChange={handleContentChange} />;
      default:
        return (
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground">
                Editor para o tipo "{page.type}" ainda não implementado.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      {/* Scroll controls */}
      <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-t-lg border border-b-0">
        <span className="text-xs text-muted-foreground">↕ Role para ver mais opções</span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollBy(-200)}
            className="h-7 w-7 p-0"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollBy(200)}
            className="h-7 w-7 p-0"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Scrollable content area with visible native scrollbar */}
      <div 
        ref={scrollContainerRef}
        className="h-[500px] w-full border rounded-b-lg bg-background overflow-y-auto"
        style={{
          scrollbarWidth: 'auto',
          scrollbarColor: 'hsl(var(--primary)) hsl(var(--muted))'
        }}
      >
        <div className="space-y-4 p-4 pr-5">
          {/* Only show title input for certain page types - exclude trueFalseWithText */}
          {page.type !== 'trueFalseWithText' && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Página</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="pageTitle">Título da Página</Label>
                  <Input
                    id="pageTitle"
                    value={page.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Digite o título da página"
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {renderPageEditor()}
        </div>
      </div>
      
      {/* Custom scrollbar styling for webkit browsers */}
      <style>{`
        div[class*="h-[500px]"]::-webkit-scrollbar {
          width: 14px;
        }
        div[class*="h-[500px]"]::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 7px;
        }
        div[class*="h-[500px]"]::-webkit-scrollbar-thumb {
          background: hsl(var(--primary));
          border-radius: 7px;
          border: 2px solid hsl(var(--muted));
        }
        div[class*="h-[500px]"]::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.8);
        }
      `}</style>
    </div>
  );
};

export default PageEditorWrapper;