import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePhoneAuth } from '@/contexts/PhoneAuthContext';

interface TOEFLProgress {
  content_item_id: string;
  completed_at: string;
}

export const useTOEFLProgress = () => {
  const { user } = usePhoneAuth();
  const [completedTOEFLItems, setCompletedTOEFLItems] = useState<TOEFLProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTOEFLProgress();
    } else {
      setCompletedTOEFLItems([]);
      setLoading(false);
    }
  }, [user]);

  const fetchTOEFLProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('content_progress')
        .select('content_item_id, completed_at')
        .eq('phone_number', user.phone_number);

      if (error) {
        console.error('Error fetching TOEFL progress:', error);
      } else {
        setCompletedTOEFLItems(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching TOEFL progress:', error);
    }

    setLoading(false);
  };

  const markTOEFLItemComplete = async (itemId: string) => {
    if (!user) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('content_progress')
        .upsert({
          phone_number: user.phone_number,
          user_id: null,
          content_item_id: itemId,
          completed_at: new Date().toISOString()
        }, { onConflict: 'phone_number,content_item_id' });

      if (error) {
        console.error('Error marking TOEFL item complete:', error);
        return false;
      }

      // Update local state
      setCompletedTOEFLItems(prev => {
        const filtered = prev.filter(p => p.content_item_id !== itemId);
        const updated = [...filtered, { content_item_id: itemId, completed_at: new Date().toISOString() }];
        return updated;
      });

      return true;
    } catch (error) {
      console.error('Unexpected error marking TOEFL item complete:', error);
      return false;
    }
  };

  const isTOEFLItemComplete = (itemId: string) => {
    return completedTOEFLItems.some(p => p.content_item_id === itemId);
  };

  const toggleTOEFLItemCompletion = async (itemId: string) => {
    if (!user) return false;

    const isCurrentlyComplete = isTOEFLItemComplete(itemId);
    
    if (isCurrentlyComplete) {
      // Remove completion
      try {
        const { error } = await supabase
          .from('content_progress')
          .delete()
          .eq('phone_number', user.phone_number)
          .eq('content_item_id', itemId);

        if (error) {
          console.error('Error removing TOEFL completion:', error);
          return false;
        }

        // Update local state
        setCompletedTOEFLItems(prev => prev.filter(p => p.content_item_id !== itemId));
        return true;
      } catch (error) {
        console.error('Unexpected error removing TOEFL completion:', error);
        return false;
      }
    } else {
      // Mark as complete
      return await markTOEFLItemComplete(itemId);
    }
  };

  return {
    completedTOEFLItems,
    loading,
    markTOEFLItemComplete,
    isTOEFLItemComplete,
    toggleTOEFLItemCompletion,
    refreshProgress: fetchTOEFLProgress
  };
};