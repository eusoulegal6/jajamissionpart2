import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Slideshow } from '@/types/slideshow';
import { toast } from 'sonner';

export const useSlideshows = () => {
  const [slideshows, setSlideshows] = useState<Slideshow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSlideshows = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('slideshows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching slideshows:', error);
        toast.error('Failed to fetch slideshows');
        return;
      }

      setSlideshows((data || []).map(item => ({
        ...item,
        mobileMode: (item as any).mobile_mode ?? false,
        slides: Array.isArray(item.slides) ? (item.slides as any[]) : []
      })));
    } catch (error) {
      console.error('Error fetching slideshows:', error);
      toast.error('Failed to fetch slideshows');
    } finally {
      setLoading(false);
    }
  };

  const createSlideshow = async (slideshow: Omit<Slideshow, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const payload: any = {
        title: slideshow.title,
        description: slideshow.description ?? null,
        slides: slideshow.slides as any,
        mobile_mode: (slideshow as any).mobileMode ?? false,
      };

      const { data, error } = await supabase
        .from('slideshows')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Error creating slideshow:', error);
        toast.error('Failed to create slideshow');
        return null;
      }

      toast.success('Slideshow created successfully');
      await fetchSlideshows();
      return data;
    } catch (error) {
      console.error('Error creating slideshow:', error);
      toast.error('Failed to create slideshow');
      return null;
    }
  };

  const updateSlideshow = async (id: string, updates: Partial<Slideshow>) => {
    try {
      const payload: any = {
        // only map known fields
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.slides !== undefined ? { slides: updates.slides as any } : {}),
        ...(Object.prototype.hasOwnProperty.call(updates as any, 'mobileMode') ? { mobile_mode: (updates as any).mobileMode } : {}),
      };

      const { error } = await supabase
        .from('slideshows')
        .update(payload)
        .eq('id', id);

      if (error) {
        console.error('Error updating slideshow:', error);
        toast.error('Failed to update slideshow');
        return false;
      }

      toast.success('Slideshow updated successfully');
      await fetchSlideshows();
      return true;
    } catch (error) {
      console.error('Error updating slideshow:', error);
      toast.error('Failed to update slideshow');
      return false;
    }
  };

  const deleteSlideshow = async (id: string) => {
    try {
      const { error } = await supabase
        .from('slideshows')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting slideshow:', error);
        toast.error('Failed to delete slideshow');
        return false;
      }

      toast.success('Slideshow deleted successfully');
      await fetchSlideshows();
      return true;
    } catch (error) {
      console.error('Error deleting slideshow:', error);
      toast.error('Failed to delete slideshow');
      return false;
    }
  };

  useEffect(() => {
    fetchSlideshows();
  }, []);

  return {
    slideshows,
    loading,
    createSlideshow,
    updateSlideshow,
    deleteSlideshow,
    refetch: fetchSlideshows
  };
};