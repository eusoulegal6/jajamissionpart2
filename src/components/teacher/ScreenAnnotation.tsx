import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, IText, PencilBrush } from 'fabric';
import { Button } from '@/components/ui/button';
import { X, Pen, Type } from 'lucide-react';

interface ScreenAnnotationProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'pen' | 'text';
}

const ScreenAnnotation: React.FC<ScreenAnnotationProps> = ({ isOpen, onClose, mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<'pen' | 'text'>(mode);

  useEffect(() => {
    setActiveTool(mode);
  }, [mode]);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      selection: false,
    });

    // Ensure a brush exists for free drawing
    if (!canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush = new PencilBrush(canvas);
    }
    canvas.freeDrawingBrush.color = '#FF0000';
    canvas.freeDrawingBrush.width = 3;
    
    // Set to correct initial mode
    canvas.isDrawingMode = activeTool === 'pen';

    setFabricCanvas(canvas);

    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, [isOpen]);

  // Enable scrolling in drawing mode by forwarding wheel events to the underlying scroller
  useEffect(() => {
    if (!isOpen) return;

    let restoreTimeout: number | null = null;

    const handleWheel = (e: WheelEvent) => {
      if (!fabricCanvas) return;

      // Prevent Fabric/Canvas from blocking the native scroll
      e.preventDefault();

      // Temporarily pause drawing so Fabric doesn't swallow gestures while scrolling
      const wasDrawing = fabricCanvas.isDrawingMode;
      if (wasDrawing) {
        fabricCanvas.isDrawingMode = false;
      }

      // Temporarily ignore overlay to detect the underlying element
      const canvas = canvasRef.current;
      const restore = canvas ? canvas.style.pointerEvents : '';
      if (canvas) canvas.style.pointerEvents = 'none';
      const underlying = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (canvas) canvas.style.pointerEvents = restore || '';

      // Find nearest scrollable ancestor of the underlying element
      const findScrollableParent = (el: HTMLElement | null): HTMLElement | null => {
        let node: HTMLElement | null = el;
        while (node && node !== document.body && node !== document.documentElement) {
          const style = window.getComputedStyle(node);
          const canScroll = (/(auto|scroll)/).test(style.overflowY) && node.scrollHeight > node.clientHeight;
          if (canScroll) return node;
          node = node.parentElement;
        }
        return null;
      };

      const scrollEl = findScrollableParent(underlying);
      const deltaX = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      const deltaY = e.deltaY;

      if (scrollEl) {
        scrollEl.scrollLeft += deltaX;
        scrollEl.scrollTop += deltaY;
      } else {
        window.scrollBy({ top: deltaY, left: deltaX, behavior: 'auto' });
      }

      // Restore drawing shortly after scrolling settles
      if (wasDrawing) {
        if (restoreTimeout) window.clearTimeout(restoreTimeout);
        restoreTimeout = window.setTimeout(() => {
          if (activeTool === 'pen') {
            fabricCanvas.isDrawingMode = true;
          }
        }, 150);
      }
    };

    // Listen at capture phase to beat Fabric's internal handlers
    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => {
      window.removeEventListener('wheel', handleWheel as unknown as EventListener, true);
    };
  }, [isOpen, fabricCanvas, activeTool]);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === 'pen';

    if (activeTool === 'pen' && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.selection = false;
      fabricCanvas.freeDrawingBrush.color = '#FF0000';
      fabricCanvas.freeDrawingBrush.width = 3;
    } else {
      fabricCanvas.selection = true;
    }
  }, [activeTool, fabricCanvas]);

  const createTextBox = () => {
    if (!fabricCanvas) return;

    const text = new IText('Your text here', {
      left: window.innerWidth / 2 - 50,
      top: window.innerHeight / 2 - 12,
      fontSize: 24,
      fill: '#FF0000',
      fontFamily: 'Arial',
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.requestRenderAll();
    
    // Enter editing mode immediately after render
    requestAnimationFrame(() => {
      text.enterEditing();
      text.selectAll();
    });
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = 'transparent';
    fabricCanvas.renderAll();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 cursor-crosshair touch-pan-y pointer-events-auto" />
      
      <div className="fixed top-4 right-4 flex gap-2 pointer-events-auto" data-teacher-ui>
        <Button
          onClick={() => setActiveTool('pen')}
          variant={activeTool === 'pen' ? 'default' : 'outline'}
          size="lg"
          className="rounded-full h-12 w-12"
          title="Draw"
        >
          <Pen className="h-6 w-6" />
        </Button>
        
        <Button
          onClick={() => {
            setActiveTool('text');
            createTextBox();
          }}
          variant={activeTool === 'text' ? 'default' : 'outline'}
          size="lg"
          className="rounded-full h-12 w-12"
          title="Add text"
        >
          <Type className="h-6 w-6" />
        </Button>

        <Button
          onClick={handleClear}
          variant="outline"
          size="lg"
          className="rounded-full h-12 w-12"
          title="Clear all"
        >
          <X className="h-6 w-6" />
        </Button>

        <Button
          onClick={onClose}
          variant="destructive"
          size="lg"
          className="rounded-full h-12 w-12"
          title="Exit annotation mode"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default ScreenAnnotation;
