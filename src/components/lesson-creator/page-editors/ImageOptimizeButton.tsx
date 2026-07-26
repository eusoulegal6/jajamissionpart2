import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Minimize2, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isOptimizableUrl } from '@/lib/imageOptimization';

interface ImageOptimizeButtonProps {
  imageUrl: string | undefined | null;
  onOptimized: (newUrl: string) => void;
}

const ImageOptimizeButton: React.FC<ImageOptimizeButtonProps> = ({ imageUrl, onOptimized }) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOptimized, setIsOptimized] = useState(false);

  // Check if already optimized
  const isAlreadyOptimized = imageUrl?.includes('/compressed-images/') || imageUrl?.includes('/tinified/');
  
  // Check if URL can be optimized
  const canOptimize = isOptimizableUrl(imageUrl);

  const handleOptimize = async () => {
    if (!imageUrl || isOptimizing || isAlreadyOptimized) return;

    setIsOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('compress-image-v2', {
        body: { originalUrl: imageUrl, minBytes: 0 }, // minBytes: 0 means always compress
      });

      if (error) {
        throw new Error(error.message || 'Compression failed');
      }

      if (data?.status === 'done' && data?.optimizedUrl) {
        onOptimized(data.optimizedUrl);
        setIsOptimized(true);
        toast.success(`Image optimized! Saved ${data.savedPercent || 0}%`);
      } else if (data?.status === 'skipped') {
        toast.info('Image is already small enough, no optimization needed');
        setIsOptimized(true);
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Unexpected response from optimization service');
      }
    } catch (err: any) {
      console.error('Image optimization error:', err);
      toast.error(`Failed to optimize: ${err.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Don't show button if no URL or URL can't be optimized
  if (!imageUrl || !canOptimize) {
    return null;
  }

  // Show success state if already optimized
  if (isAlreadyOptimized || isOptimized) {
    return (
      <Button
        variant="outline"
        className="shrink-0 text-green-600 border-green-600"
        disabled
        title="Image already optimized"
      >
        <Check className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleOptimize}
      disabled={isOptimizing}
      className="shrink-0"
      title="Optimize image (reduce file size)"
    >
      {isOptimizing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Minimize2 className="h-4 w-4" />
      )}
    </Button>
  );
};

export default ImageOptimizeButton;
