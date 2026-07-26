import React, { createContext, useContext, useState, useCallback } from 'react';

interface PDFZoomContextType {
  isPDFActive: boolean;
  setIsPDFActive: (active: boolean) => void;
  pdfScale: number;
  setPDFScale: (scale: number) => void;
  resetZoom: () => void;
}

const PDFZoomContext = createContext<PDFZoomContextType | undefined>(undefined);

export const PDFZoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPDFActive, setIsPDFActive] = useState(false);
  const [pdfScale, setPDFScale] = useState(2.5);

  const resetZoom = useCallback(() => {
    // Reset body zoom to 1
    document.body.style.zoom = '1';
    // Reset PDF scale to default
    setPDFScale(2.5);
    // Reset teacher UI elements transforms
    const teacherElements = document.querySelectorAll('[data-teacher-ui]');
    teacherElements.forEach(element => {
      const el = element as HTMLElement;
      el.style.transform = '';
      el.style.transformOrigin = '';
      el.style.zoom = '';
    });
  }, []);

  return (
    <PDFZoomContext.Provider value={{ isPDFActive, setIsPDFActive, pdfScale, setPDFScale, resetZoom }}>
      {children}
    </PDFZoomContext.Provider>
  );
};

export const usePDFZoom = () => {
  const context = useContext(PDFZoomContext);
  if (context === undefined) {
    throw new Error('usePDFZoom must be used within a PDFZoomProvider');
  }
  return context;
};
