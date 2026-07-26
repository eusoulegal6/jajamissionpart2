import '@/polyfills/pdfjs-polyfills';
import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { usePDFZoom } from '@/contexts/PDFZoomContext';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';


interface PDFPageProps {
  pdfUrl: string;
  title?: string;
}

export const PDFPage: React.FC<PDFPageProps> = ({ pdfUrl, title }) => {
  const { setIsPDFActive, pdfScale, setPDFScale, resetZoom } = usePDFZoom();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Activate PDF mode and reset zoom on mount
  useEffect(() => {
    setIsPDFActive(true);
    resetZoom();
    
    return () => {
      setIsPDFActive(false);
    };
  }, [setIsPDFActive, resetZoom]);

  // Dynamically load react-pdf after polyfills are in place
  const [reactPdf, setReactPdf] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import('react-pdf');
        // Configure worker to match runtime and let Vite resolve from node_modules (no CDN)
        // Configure worker to match runtime and let Vite resolve from node_modules (no CDN)
        mod.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          '../../workers/pdfjs-worker-wrapper.mjs',
          import.meta.url,
        ).toString();
        if (mounted) setReactPdf(mod);
      } catch (e: any) {
        console.error('Failed to load react-pdf:', e);
        if (mounted) {
          setErrorMessage(e?.message || String(e));
          setIsLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setErrorMessage(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setErrorMessage(error?.message || String(error));
    setIsLoading(false);
  };

  const goToPreviousPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  };

  const zoomIn = () => {
    setPDFScale(Math.min(3.0, pdfScale + 0.2));
  };

  const zoomOut = () => {
    setPDFScale(Math.max(0.5, pdfScale - 0.2));
  };

  const rotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Memoize file prop to prevent unnecessary re-renders
  const fileConfig = useMemo(() => ({ url: pdfUrl }), [pdfUrl]);

  return (
    <div className="flex flex-col h-full bg-background">
      {title && (
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        </div>
      )}

      {/* Page Navigation - Top Center */}
      <div className="flex items-center justify-center p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <Button
            onClick={goToPreviousPage}
            disabled={pageNumber <= 1}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-foreground min-w-[100px] text-center">
            Page {pageNumber} of {numPages || '...'}
          </span>
          <Button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            variant="outline"
            size="sm"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto p-4 flex items-start justify-center bg-muted/30">
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading PDF...</div>
          </div>
        )}
        <Card className="shadow-lg overflow-hidden">
          {reactPdf ? (
            <reactPdf.Document
              file={fileConfig}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center p-8 min-h-[600px]">
                  <div className="text-muted-foreground">Loading document...</div>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-8 min-h-[600px]">
                  <div className="space-y-2 text-center">
                    <div className="text-destructive font-medium">Failed to load PDF.</div>
                    {errorMessage && (
                      <div className="text-muted-foreground text-sm break-all">{errorMessage}</div>
                    )}
                    <div className="text-muted-foreground text-xs break-all">Source: {pdfUrl}</div>
                  </div>
                </div>
              }
            >
              <reactPdf.Page
                pageNumber={pageNumber}
                scale={pdfScale}
                rotate={rotation}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={
                  <div className="flex items-center justify-center p-8 min-h-[600px]">
                    <div className="text-muted-foreground">Loading page...</div>
                  </div>
                }
              />
            </reactPdf.Document>
          ) : (
            <div className="flex items-center justify-center p-8 min-h-[600px]">
              <div className="text-muted-foreground">Inicializando visualizador de PDF...</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
