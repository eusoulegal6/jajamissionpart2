import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PageEditorWrapper from './lesson-creator/page-editors/PageEditorWrapper';
import { LessonPage } from './lesson-creator/LessonCreatorWizard';

interface InlinePageEditorProps {
  lessonId: string;
  currentPage: any;
  pageIndex: number;
  onClose: () => void;
  onSave: () => void;
}

const InlinePageEditor: React.FC<InlinePageEditorProps> = ({
  lessonId,
  currentPage,
  pageIndex,
  onClose,
  onSave
}) => {
  // Log the original page structure
  console.log('📝 InlinePageEditor - Original currentPage:', currentPage);
  
  // Normalize the page structure for the editor
  // The editor expects: { type, title, content: {...actual data} }
  // Extract the deepest level of actual content data
  
  const { type, title, id, content: pageContent, ...restOfPage } = currentPage;
  
  // Find the actual content by unwrapping nested content objects
  let actualContent = pageContent || {};
  while (actualContent.content && typeof actualContent.content === 'object' && !Array.isArray(actualContent.content)) {
    actualContent = { ...actualContent, ...actualContent.content };
    delete actualContent.content;
  }
  
  // Merge with any top-level fields that aren't type/title/id/content
  actualContent = { ...actualContent, ...restOfPage };
  
  const normalizedPage: LessonPage = {
    id: id || `page-${pageIndex}`,
    type: type,
    title: title || '',
    content: actualContent
  };
  
  console.log('📝 InlinePageEditor - Normalized page:', normalizedPage);
  
  const [editedPage, setEditedPage] = useState<LessonPage>(normalizedPage);
  const [isSaving, setIsSaving] = useState(false);

  const handlePageChange = (updatedPage: LessonPage) => {
    console.log('📝 InlinePageEditor - Page changed:', updatedPage);
    setEditedPage(updatedPage);
  };

  const handleSave = async () => {
    setIsSaving(true);
    console.log('💾 Saving edited page:', editedPage);
    
    try {
      // Determine which table to update
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId);
      console.log('💾 Is UUID?', isUUID, 'LessonId:', lessonId);
      
      let tableName: 'content_items' | 'lessons' | 'lessons_spanish' | 'toefl_items' | null = null;
      let lessonData: any = null;

      if (isUUID) {
        // Try toefl_items first, then content_items
        console.log('💾 Trying toefl_items...');
        const toeflResult = await supabase
          .from('toefl_items')
          .select('content')
          .eq('id', lessonId)
          .maybeSingle();
        
        console.log('💾 TOEFL result:', { data: toeflResult.data, error: toeflResult.error });
        
        if (!toeflResult.error && toeflResult.data) {
          tableName = 'toefl_items';
          lessonData = toeflResult.data;
          console.log('✅ Found in toefl_items');
        } else {
          console.log('💾 Trying content_items...');
          const contentResult = await supabase
            .from('content_items')
            .select('content')
            .eq('id', lessonId)
            .single();
          
          console.log('💾 Content result:', { data: contentResult.data, error: contentResult.error });
          
          if (contentResult.error) throw contentResult.error;
          tableName = 'content_items';
          lessonData = contentResult.data;
          console.log('✅ Found in content_items');
        }
      } else {
        // Try lessons tables
        console.log('💾 Trying lessons tables...');
        const tablesToTry = ['lessons', 'lessons_spanish'] as const;
        for (const tbl of tablesToTry) {
          const { data, error } = await supabase
            .from(tbl)
            .select('content')
            .eq('id', lessonId)
            .maybeSingle();

          console.log(`💾 ${tbl} result:`, { data, error });

          if (!error && data) {
            tableName = tbl;
            lessonData = data;
            console.log(`✅ Found in ${tbl}`);
            break;
          }
        }
      }

      if (!tableName || !lessonData) {
        console.error('❌ Lesson not found in any table');
        throw new Error('Lesson not found');
      }
      
      console.log('💾 Will update table:', tableName);

      // Reconstruct the page in the original format
      // Keep it flat - don't create nested content objects
      const savedPage = {
        type: editedPage.type,
        title: editedPage.title,
        id: editedPage.id,
        ...editedPage.content
      };
      
      console.log('💾 Saving page in format:', savedPage);

      // Update the specific page in the content
      let content = lessonData.content;
      let updatedContent;

      if (Array.isArray(content)) {
        const pages = [...content];
        pages[pageIndex] = savedPage;
        updatedContent = pages;
      } else if (content && typeof content === 'object' && 'pages' in content && Array.isArray(content.pages)) {
        const contentObj = { ...content };
        const pages = [...contentObj.pages];
        pages[pageIndex] = savedPage;
        contentObj.pages = pages;
        updatedContent = contentObj;
      } else {
        throw new Error('Unsupported content structure');
      }

      console.log('💾 Final content to save:', updatedContent);

      // Save to database
      console.log('💾 Updating table:', tableName, 'with id:', lessonId);
      const { data: updateData, error: updateError } = await supabase
        .from(tableName as any)
        .update({ content: updatedContent })
        .eq('id', lessonId);

      console.log('💾 Update result:', { data: updateData, error: updateError });

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }

      toast({
        title: "Saved!",
        description: "Page updated successfully",
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving page:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit Page {pageIndex + 1}</h2>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>

        <PageEditorWrapper
          page={editedPage}
          onChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default InlinePageEditor;
