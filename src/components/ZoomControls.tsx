import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Users, RotateCcw } from 'lucide-react';
import { usePDFZoom } from '@/contexts/PDFZoomContext';
import TeacherProgressPanel from './teacher/TeacherProgressPanel';

const ZoomControls: React.FC = () => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const { isPDFActive } = usePDFZoom();
  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const hasMountedRef = useRef(false);

  const BASE_FONT_PX = 16;

  const applyFontScale = (scale: number) => {
    // Strategy: only enlarge text font-size. No zoom, no transform — so layout,
    // images and word-click hit-testing stay correct.
    // 1) Scale rem-based text via root font-size (covers Tailwind text-base/lg/xl/etc.)
    document.documentElement.style.fontSize = `${BASE_FONT_PX * scale}px`;

    // 2) Override fixed-px text classes used in chat / lesson pages so they scale too.
    let styleEl = document.getElementById('teacher-font-scale-style') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'teacher-font-scale-style';
      document.head.appendChild(styleEl);
    }
    const px = (n: number) => `${Math.round(n * scale)}px`;
    styleEl.textContent = `
      /* Chat messages */
      [class*="text-[17px]"] { font-size: ${px(17)} !important; }
      /* TTS / Article pages */
      [class*="text-[18px]"] { font-size: ${px(18)} !important; }
      [class*="text-[20px]"] { font-size: ${px(20)} !important; }
      [class*="text-[28px]"] { font-size: ${px(28)} !important; }
      [class*="text-[32px]"] { font-size: ${px(32)} !important; }
      [class*="text-[36px]"] { font-size: ${px(36)} !important; }
      [class*="text-[38px]"] { font-size: ${px(38)} !important; }
      [class*="text-[42px]"] { font-size: ${px(42)} !important; }
      /* Prose article body */
      .prose { font-size: ${scale * 1.125}rem !important; }
      /* Keep teacher UI toolbar at its normal size */
      [data-teacher-ui], [data-teacher-ui] * { font-size: revert !important; }
    `;
    // Make sure no legacy zoom is applied
    document.body.style.zoom = '1';
    (document.getElementById('root') as HTMLElement | null)?.style.removeProperty('zoom');
  };

  const resetFontScale = () => {
    document.documentElement.style.fontSize = '';
    document.body.style.zoom = '1';
    const rootEl = document.getElementById('root') as HTMLElement | null;
    if (rootEl) rootEl.style.removeProperty('zoom');
    const styleEl = document.getElementById('teacher-font-scale-style');
    if (styleEl) styleEl.remove();
  };

  // Reset only after leaving a PDF page, not immediately when teacher mode mounts.
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (!isPDFActive) {
      setZoomLevel(1);
      resetFontScale();
    }
  }, [isPDFActive]);

  useEffect(() => {
    return () => {
      resetFontScale();
    };
  }, []);

  const handleZoomIn = () => {
    if (isPDFActive) return;
    const newZoom = Math.min(zoomLevel + 0.1, 2);
    setZoomLevel(newZoom);
    applyFontScale(newZoom);
  };

  const handleZoomOut = () => {
    if (isPDFActive) return;
    const newZoom = Math.max(zoomLevel - 0.1, 0.5);
    setZoomLevel(newZoom);
    applyFontScale(newZoom);
  };

  const handleResetZoom = () => {
    if (isPDFActive) return;
    setZoomLevel(1);
    resetFontScale();
  };

  return (
    <>
      <div data-teacher-ui data-zoom-controls className="fixed top-4 left-4 z-[2000] pointer-events-auto flex flex-col gap-2">
        <Button
          onClick={handleResetZoom}
          size="sm"
          variant="outline"
          className="h-10 w-10 p-0"
          title={isPDFActive ? "Zoom locked on PDF" : "Reset zoom"}
          disabled={isPDFActive}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleZoomIn}
          size="sm"
          variant="outline"
          className="h-10 w-10 p-0"
          title={isPDFActive ? "Zoom locked on PDF" : "Zoom in"}
          disabled={isPDFActive}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleZoomOut}
          size="sm"
          variant="outline"
          className="h-10 w-10 p-0"
          title={isPDFActive ? "Zoom locked on PDF" : "Zoom out"}
          disabled={isPDFActive}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => setShowProgressPanel(true)}
          size="sm"
          variant="outline"
          className="h-10 w-10 p-0"
          title="Student progress panel"
        >
          <Users className="h-4 w-4" />
        </Button>
      </div>

      {showProgressPanel && (
        <TeacherProgressPanel
          isOpen={showProgressPanel}
          onClose={() => setShowProgressPanel(false)}
        />
      )}
    </>
  );
};

export default ZoomControls;