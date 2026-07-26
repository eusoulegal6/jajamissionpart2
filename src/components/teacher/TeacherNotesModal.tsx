import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pen, Type, Eraser, Download, Trash2, Plus, MousePointer, Speech, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { base64ToAudioBlob } from '@/utils/base64Utils';
import { useToast } from '@/hooks/use-toast';

interface TeacherNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TeacherNotesModal: React.FC<TeacherNotesModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState('');
  const [fontSize, setFontSize] = useState(60); // Default bigger font size
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penSize, setPenSize] = useState(3);
  const [penColor, setPenColor] = useState('#000000');
  const [drawingMode, setDrawingMode] = useState<'draw' | 'text' | 'select'>('draw');
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [textObjects, setTextObjects] = useState<Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    size: number;
    color: string;
  }>>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState(0);
  const [resizeStartY, setResizeStartY] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  // Store the drawing layer as image data to preserve it during text redraws
  const [drawingImageData, setDrawingImageData] = useState<ImageData | null>(null);
  // Flag to ignore dialog close when clicking zoom controls
  const ignoreCloseRef = useRef(false);

  useEffect(() => {
    const handlePointerDownCapture = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.closest('[data-zoom-controls]'))) {
        ignoreCloseRef.current = true;
        // reset after this tick so only the immediate close is prevented
        setTimeout(() => {
          ignoreCloseRef.current = false;
        }, 0);
      }
    };

    // Use capture phase to catch before Radix processes outside clicks
    document.addEventListener('pointerdown', handlePointerDownCapture, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownCapture, true);
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current && isOpen) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        setCtx(context);
        console.log('Canvas initialized:', canvas.width, 'x', canvas.height);
      }
    }
  }, [isOpen]);

  // Additional effect to ensure context is always available
  useEffect(() => {
    const initCanvas = () => {
      if (canvasRef.current && !ctx) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
          context.lineCap = 'round';
          context.lineJoin = 'round';
          context.fillStyle = 'white';
          context.fillRect(0, 0, canvas.width, canvas.height);
          setCtx(context);
          console.log('Canvas re-initialized:', canvas.width, 'x', canvas.height);
        }
      }
    };

    if (isOpen) {
      initCanvas();
      // Also try to reinitialize after a small delay to handle any timing issues
      const timeout = setTimeout(initCanvas, 100);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, ctx]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingMode === 'text') {
      handleTextClick(e);
    } else if (drawingMode === 'select') {
      handleSelectClick(e);
    } else {
      startDrawing(e);
    }
  };

  const handleTextClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setTextPosition({ x, y });
    setShowTextInput(true);
  };

  const handleSelectClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Check if clicking on a resize handle first
    const selectedText = textObjects.find(textObj => textObj.id === selectedTextId);
    if (selectedText) {
      const context = canvas.getContext('2d');
      if (context) {
        context.font = `${selectedText.size}px Arial`;
        const textWidth = context.measureText(selectedText.text).width;
        const textHeight = selectedText.size;
        
        // Check resize handles (corners of the text box)
        const handleSize = 8;
        const handles = [
          { x: selectedText.x + textWidth, y: selectedText.y - textHeight }, // top-right
          { x: selectedText.x + textWidth, y: selectedText.y }, // bottom-right
        ];
        
        for (const handle of handles) {
          if (x >= handle.x - handleSize/2 && x <= handle.x + handleSize/2 &&
              y >= handle.y - handleSize/2 && y <= handle.y + handleSize/2) {
            setIsResizing(true);
            setInitialSize(selectedText.size);
            setResizeStartY(y);
            return;
          }
        }
      }
    }
    
    // Find clicked text object
    const clickedText = textObjects.find(textObj => {
      const context = canvas.getContext('2d');
      if (!context) return false;
      
      context.font = `${textObj.size}px Arial`;
      const textWidth = context.measureText(textObj.text).width;
      const textHeight = textObj.size;
      
      return x >= textObj.x && x <= textObj.x + textWidth &&
             y >= textObj.y - textHeight && y <= textObj.y;
    });
    
    if (clickedText) {
      setSelectedTextId(clickedText.id);
      setIsDragging(true);
      setDragOffset({
        x: x - clickedText.x,
        y: y - clickedText.y
      });
    } else {
      setSelectedTextId(null);
    }
  };

  const redrawCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Clear canvas and fill with white background
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Restore drawing layer if it exists
    if (drawingImageData) {
      context.putImageData(drawingImageData, 0, 0);
    }
    
    // Redraw all text objects on top
    textObjects.forEach(textObj => {
      context.font = `${textObj.size}px Arial`;
      context.fillStyle = textObj.color;
      context.fillText(textObj.text, textObj.x, textObj.y);
      
      // Draw selection outline and resize handles if selected
      if (selectedTextId === textObj.id) {
        context.strokeStyle = '#007bff';
        context.lineWidth = 2;
        context.setLineDash([5, 5]);
        const textWidth = context.measureText(textObj.text).width;
        const textHeight = textObj.size;
        context.strokeRect(textObj.x - 2, textObj.y - textHeight - 2, textWidth + 4, textHeight + 4);
        context.setLineDash([]);
        
        // Draw resize handles
        context.fillStyle = '#007bff';
        const handleSize = 8;
        const handles = [
          { x: textObj.x + textWidth, y: textObj.y - textHeight }, // top-right
          { x: textObj.x + textWidth, y: textObj.y }, // bottom-right
        ];
        
        handles.forEach(handle => {
          context.fillRect(
            handle.x - handleSize/2, 
            handle.y - handleSize/2, 
            handleSize, 
            handleSize
          );
        });
      }
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingMode === 'draw') {
      draw(e);
    } else if (drawingMode === 'select' && selectedTextId) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      
      if (isResizing) {
        // Handle resizing - invert deltaY for intuitive behavior
        const deltaY = y - resizeStartY;
        const newSize = Math.max(8, initialSize - deltaY); // Subtract deltaY to invert direction
        
        setTextObjects(prev => prev.map(textObj => 
          textObj.id === selectedTextId 
            ? { ...textObj, size: newSize }
            : textObj
        ));
      } else if (isDragging) {
        // Handle dragging
        setTextObjects(prev => prev.map(textObj => 
          textObj.id === selectedTextId 
            ? { ...textObj, x: x - dragOffset.x, y: y - dragOffset.y }
            : textObj
        ));
      }
    }
  };

  const handleMouseUp = () => {
    if (drawingMode === 'draw') {
      stopDrawing();
    } else if (drawingMode === 'select') {
      setIsDragging(false);
      setIsResizing(false);
    }
  };

  const addTextToCanvas = () => {
    if (!textInput.trim()) return;
    
    // Capture drawing layer before adding text
    captureDrawingLayer();
    
    const newTextObject = {
      id: Math.random().toString(36).substr(2, 9),
      text: textInput,
      x: textPosition.x,
      y: textPosition.y,
      size: penSize * 12, // Made text even bigger (12x instead of 8x)
      color: penColor
    };
    
    setTextObjects(prev => [...prev, newTextObject]);
    setTextInput('');
    setShowTextInput(false);
  };

  // Function to capture only the drawing layer (without text)
  const captureDrawingLayer = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Get the current canvas image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    setDrawingImageData(imageData);
  };

  // Redraw canvas when text objects change
  useEffect(() => {
    redrawCanvas();
  }, [textObjects, selectedTextId]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingMode === 'text') return;
    if (!canvasRef.current) return;
    
    // Get fresh context each time
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set up context properties
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = penSize;
    context.strokeStyle = penColor;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    console.log('Starting drawing at:', x, y, 'with context:', !!context);
    
    context.beginPath();
    context.moveTo(x, y);
    
    // Store the context for the current drawing session
    setCtx(context);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    // Get context fresh or use stored one
    let context = ctx;
    if (!context) {
      context = canvasRef.current.getContext('2d');
      if (!context) return;
      setCtx(context);
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    context.lineWidth = penSize;
    context.strokeStyle = penColor;
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!ctx || !canvasRef.current) return;
    setIsDrawing(false);
    ctx.beginPath();
    
    // Capture the drawing layer (without text objects) to preserve it
    captureDrawingLayer();
  };

  const clearCanvas = () => {
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    // Clear all text objects, reset selection, and clear drawing layer
    setTextObjects([]);
    setSelectedTextId(null);
    setDrawingImageData(null);
  };

  const downloadCanvas = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'teacher-notes.png';
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };


  const handleGenerateAudio = async () => {
    if (!notes.trim()) {
      toast({
        title: "No text to read",
        description: "Please write some notes first",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingAudio(true);

    try {
      const { data, error } = await supabase.functions.invoke('speak-elevenlabs', {
        body: { text: notes }
      });

      if (error) {
        throw new Error(`Failed to generate audio: ${error.message || 'Unknown error'}`);
      }

      if (!data || !data.audioContent) {
        throw new Error("Invalid response from audio service");
      }

      // Convert base64 to blob and play
      const audioBlob = base64ToAudioBlob(data.audioContent);
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.play();
    } catch (error) {
      console.error("Error generating audio:", error);
      toast({
        title: "Error generating audio",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (ignoreCloseRef.current) {
        return; // Ignore close triggered by zoom controls click
      }
    }
    onClose();
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={handleOpenChange}
      modal={false}
    >
      <DialogContent 
        className="max-w-4xl h-[80vh]"
        onKeyDown={(e) => e.stopPropagation()}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement | null;
          const path = (e as any).detail?.originalEvent?.composedPath?.() || [];
          const hitZoom =
            target?.closest?.('[data-zoom-controls]') ||
            path?.some?.((el: any) => el instanceof HTMLElement && el.closest?.('[data-zoom-controls]'));
          if (hitZoom) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement | null;
          const path = (e as any).detail?.originalEvent?.composedPath?.() || [];
          const hitZoom =
            target?.closest?.('[data-zoom-controls]') ||
            path?.some?.((el: any) => el instanceof HTMLElement && el.closest?.('[data-zoom-controls]'));
          if (hitZoom) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Teacher Notes</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="text" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="draw" className="flex items-center gap-2">
              <Pen className="h-4 w-4" />
              Drawing
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="flex-1 flex flex-col">
            <div className="flex items-center gap-4 p-4 border-b">
              <div className="flex items-center gap-2">
                <label htmlFor="font-size">Font size:</label>
                <input
                  id="font-size"
                  type="range"
                  min="14"
                  max="96"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-gray-600 min-w-[40px]">{fontSize}px</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGenerateAudio}
                disabled={isGeneratingAudio || !notes.trim()}
                title="Read notes aloud"
                className="ml-auto"
              >
                {isGeneratingAudio ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Speech className="h-5 w-5" />
                )}
              </Button>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type your notes here..."
              className="flex-1 min-h-[400px] resize-none border-0 focus-visible:ring-0"
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
              spellCheck={false}
            />
          </TabsContent>
          
          <TabsContent value="draw" className="flex-1 flex flex-col">
            <div className="flex items-center gap-4 p-4 border-b">
              <div className="flex items-center gap-2 bg-gray-100 rounded-md p-1">
                <Button
                  size="sm"
                  variant={drawingMode === 'draw' ? 'default' : 'ghost'}
                  onClick={() => setDrawingMode('draw')}
                  className="h-8"
                >
                  <Pen className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={drawingMode === 'text' ? 'default' : 'ghost'}
                  onClick={() => setDrawingMode('text')}
                  className="h-8"
                >
                  <Type className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={drawingMode === 'select' ? 'default' : 'ghost'}
                  onClick={() => setDrawingMode('select')}
                  className="h-8"
                >
                  <MousePointer className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="pen-color">Color:</label>
                <input
                  id="pen-color"
                  type="color"
                  value={penColor}
                  onChange={(e) => setPenColor(e.target.value)}
                  className="w-8 h-8 rounded border"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="pen-size">Size:</label>
                <input
                  id="pen-size"
                  type="range"
                  min="1"
                  max="20"
                  value={penSize}
                  onChange={(e) => setPenSize(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">{penSize}px</span>
              </div>
              <Button onClick={clearCanvas} variant="outline" size="sm">
                <Eraser className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
            
            <div className="flex-1 border border-gray-200 rounded relative">
              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className={`w-full h-full ${drawingMode === 'text' ? 'cursor-text' : 'cursor-crosshair'}`}
                onMouseDown={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              
              {/* Text Input Modal */}
              {showTextInput && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="bg-white p-4 rounded-lg shadow-lg">
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Add text:</label>
                      <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Type the text..."
                        className="w-full px-3 py-2 border rounded-md"
                        autoFocus
                        spellCheck={false}
                        onKeyPress={(e) => e.key === 'Enter' && addTextToCanvas()}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setShowTextInput(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={addTextToCanvas}
                        disabled={!textInput.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherNotesModal;