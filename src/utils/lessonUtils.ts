
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

type Page = {
  type: string;
  audioUrl?: string;
  imageUrl?: string;
  [key: string]: any;
};

const isUUID = (id: string) => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const updateLessonPageAudioUrl = async (lessonId: string, pageIndex: number, newAudioUrl: string): Promise<boolean> => {
  console.log('lessonUtils - updateLessonPageAudioUrl called:', { 
    lessonId, 
    pageIndex, 
    newAudioUrl,
    environment: typeof window !== 'undefined' ? window.location.hostname : 'server'
  });
  
  try {
    let tableName: 'content_items' | 'lessons' | 'lessons_spanish' | null = null;
    let item: { content: Json } | null = null;

    if (isUUID(lessonId)) {
      console.log('lessonUtils - Checking content_items table for UUID:', lessonId);
      tableName = 'content_items';
      const { data, error } = await supabase
        .from(tableName)
        .select('content')
        .eq('id', lessonId)
        .single();
      if (error) {
        console.error('lessonUtils - Error fetching from content_items:', error);
        throw error;
      }
      item = data;
      console.log('lessonUtils - Found content_items record:', item);
    } else {
      console.log('lessonUtils - Checking lessons tables for non-UUID:', lessonId);
      const tablesToTry = ['lessons', 'lessons_spanish'] as const;
      for (const tbl of tablesToTry) {
        console.log(`lessonUtils - Checking table: ${tbl}`);
        const { data, error } = await supabase
          .from(tbl)
          .select('content')
          .eq('id', lessonId)
          .maybeSingle();

        if (error) {
          console.warn(`lessonUtils - Error while checking table ${tbl} for lesson ${lessonId}:`, error);
          continue;
        }

        if (data) {
          console.log(`lessonUtils - Found data in table ${tbl}:`, data);
          tableName = tbl;
          item = data;
          break;
        }
      }
    }

    if (!tableName || !item) {
      console.error('lessonUtils - Lesson not found:', { lessonId, tableName, item });
      throw new Error(`Lesson with id ${lessonId} not found.`);
    }

    let originalContent: Json = item.content;
    let newContent: Json;

    console.log('lessonUtils - Original content structure:', originalContent);

    if (Array.isArray(originalContent)) {
      console.log('lessonUtils - Content is array, updating page at index:', pageIndex);
      const pages = [...originalContent] as Page[];
      if (pages[pageIndex]) {
        console.log('lessonUtils - Updating audioUrl for page:', pages[pageIndex]);
        pages[pageIndex].audioUrl = newAudioUrl;
        newContent = pages;
      } else {
        console.error('lessonUtils - Page index out of bounds:', { pageIndex, totalPages: pages.length });
        throw new Error('Page index out of bounds.');
      }
    } else if (originalContent && typeof originalContent === 'object' && 'pages' in originalContent && Array.isArray((originalContent as any).pages)) {
      console.log('lessonUtils - Content has pages array, updating page at index:', pageIndex);
      const contentObj = { ...(originalContent as any) };
      const pages = [...contentObj.pages] as Page[];
      if (pages[pageIndex]) {
        console.log('lessonUtils - Updating audioUrl for page:', pages[pageIndex]);
        pages[pageIndex].audioUrl = newAudioUrl;
        contentObj.pages = pages;
        newContent = contentObj;
      } else {
        console.error('lessonUtils - Page index out of bounds:', { pageIndex, totalPages: pages.length });
        throw new Error('Page index out of bounds.');
      }
    } else {
      console.error('lessonUtils - Unsupported content structure:', originalContent);
      throw new Error('Unsupported content structure.');
    }

    console.log('lessonUtils - Updating database with new content...', {
      tableName,
      lessonId,
      environment: typeof window !== 'undefined' ? window.location.hostname : 'server'
    });
    
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ content: newContent })
      .eq('id', lessonId);

    if (updateError) {
      console.error('lessonUtils - Database update error:', updateError);
      throw updateError;
    }

    console.log('lessonUtils - Successfully updated audioUrl in database');
    return true;
  } catch (error) {
    console.error('lessonUtils - Error updating lesson page audio URL:', {
      error,
      lessonId,
      pageIndex,
      environment: typeof window !== 'undefined' ? window.location.hostname : 'server'
    });
    return false;
  }
};

export const updateLessonPageImageUrl = async (lessonId: string, pageIndex: number, newImageUrl: string): Promise<boolean> => {
  console.log('lessonUtils - updateLessonPageImageUrl called:', { 
    lessonId, 
    pageIndex, 
    newImageUrl,
    environment: typeof window !== 'undefined' ? window.location.hostname : 'server'
  });
  
  try {
    let tableName: 'content_items' | 'lessons' | 'lessons_spanish' | null = null;
    let item: { content: Json } | null = null;

    if (isUUID(lessonId)) {
      console.log('lessonUtils - Checking content_items table for UUID:', lessonId);
      tableName = 'content_items';
      const { data, error } = await supabase
        .from(tableName)
        .select('content')
        .eq('id', lessonId)
        .single();
      if (error) {
        console.error('lessonUtils - Error fetching from content_items:', error);
        throw error;
      }
      item = data;
      console.log('lessonUtils - Found content_items record:', item);
    } else {
      console.log('lessonUtils - Checking lessons tables for non-UUID:', lessonId);
      const tablesToTry = ['lessons', 'lessons_spanish'] as const;
      for (const tbl of tablesToTry) {
        console.log(`lessonUtils - Checking table: ${tbl}`);
        const { data, error } = await supabase
          .from(tbl)
          .select('content')
          .eq('id', lessonId)
          .maybeSingle();

        if (error) {
          console.warn(`lessonUtils - Error while checking table ${tbl} for lesson ${lessonId}:`, error);
          continue;
        }

        if (data) {
          console.log(`lessonUtils - Found data in table ${tbl}:`, data);
          tableName = tbl;
          item = data;
          break;
        }
      }
    }

    if (!tableName || !item) {
      console.error('lessonUtils - Lesson not found:', { lessonId, tableName, item });
      throw new Error(`Lesson with id ${lessonId} not found.`);
    }

    let originalContent: Json = item.content;
    let newContent: Json;

    console.log('lessonUtils - Original content structure:', originalContent);

    if (Array.isArray(originalContent)) {
      console.log('lessonUtils - Content is array, updating page at index:', pageIndex);
      const pages = [...originalContent] as Page[];
      if (pages[pageIndex]) {
        console.log('lessonUtils - Updating imageUrl for page:', pages[pageIndex]);
        pages[pageIndex].imageUrl = newImageUrl;
        newContent = pages;
      } else {
        console.error('lessonUtils - Page index out of bounds:', { pageIndex, totalPages: pages.length });
        throw new Error('Page index out of bounds.');
      }
    } else if (originalContent && typeof originalContent === 'object' && 'pages' in originalContent && Array.isArray((originalContent as any).pages)) {
      console.log('lessonUtils - Content has pages array, updating page at index:', pageIndex);
      const contentObj = { ...(originalContent as any) };
      const pages = [...contentObj.pages] as Page[];
      if (pages[pageIndex]) {
        console.log('lessonUtils - Updating imageUrl for page:', pages[pageIndex]);
        pages[pageIndex].imageUrl = newImageUrl;
        contentObj.pages = pages;
        newContent = contentObj;
      } else {
        console.error('lessonUtils - Page index out of bounds:', { pageIndex, totalPages: pages.length });
        throw new Error('Page index out of bounds.');
      }
    } else {
      console.error('lessonUtils - Unsupported content structure:', originalContent);
      throw new Error('Unsupported content structure.');
    }

    console.log('lessonUtils - Updating database with new content...');
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ content: newContent })
      .eq('id', lessonId);

    if (updateError) {
      console.error('lessonUtils - Database update error:', updateError);
      throw updateError;
    }

    console.log('lessonUtils - Successfully updated imageUrl in database');
    return true;
  } catch (error) {
    console.error('lessonUtils - Error updating lesson page image URL:', error);
    return false;
  }
};
