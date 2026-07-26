import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PNL_LESSONS, PNL_LESSON_OPTIONS, PNL_CATEGORY_LABELS, PNLCategory } from '@/data/pnlLessons';
import { Badge } from '@/components/ui/badge';
import { Mic } from 'lucide-react';

interface PronunciationSlidesPageEditorProps {
  content: {
    lessonId?: string;
    category?: PNLCategory;
  };
  onChange: (content: any) => void;
}

const CATEGORY_OPTIONS: { value: PNLCategory; label: string }[] = [
  { value: 'verbs', label: 'Verbs' },
  { value: 'newWords', label: 'New Words' },
  { value: 'usefulPhrases', label: 'Useful Phrases' },
  { value: 'grammarExamples', label: 'Grammar' },
];

const PronunciationSlidesPageEditor: React.FC<PronunciationSlidesPageEditorProps> = ({ content, onChange }) => {
  const selectedLesson = content.lessonId ? PNL_LESSONS[content.lessonId] : null;
  const selectedCategory = content.category;
  
  const itemCount = selectedLesson && selectedCategory 
    ? selectedLesson[selectedCategory]?.length || 0
    : 0;

  const handleLessonChange = (value: string) => {
    onChange({ ...content, lessonId: value });
  };

  const handleCategoryChange = (value: PNLCategory) => {
    onChange({ ...content, category: value });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Pronunciation Slides Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            This page type allows students to practice pronunciation by recording themselves 
            and comparing with the native audio. Includes automatic pronunciation scoring.
          </div>
          
          <div className="space-y-2">
            <Label>Select PNL Lesson</Label>
            <Select value={content.lessonId || ''} onValueChange={handleLessonChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a lesson..." />
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

          <div className="space-y-2">
            <Label>Select Category</Label>
            <Select value={content.category || ''} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a category..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {selectedLesson && selectedCategory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Preview</span>
              <Badge variant="secondary">{itemCount} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Lesson:</strong> {selectedLesson.title}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Category:</strong> {PNL_CATEGORY_LABELS[selectedCategory]}
              </p>
              
              {/* Show first 3 items as preview */}
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Sample items (students will record these):
                </p>
                {selectedLesson[selectedCategory].slice(0, 3).map((item, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-3 text-sm flex items-center gap-3">
                    <Mic className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{item.english}</p>
                      <p className="text-muted-foreground">{item.portuguese}</p>
                    </div>
                  </div>
                ))}
                {itemCount > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    ... and {itemCount - 3} more items
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PronunciationSlidesPageEditor;
