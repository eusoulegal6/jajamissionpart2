import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface TeacherModeContextType {
  isTeacherMode: boolean;
  enableTeacherMode: () => void;
  disableTeacherMode: () => void;
  isNotesOpen: boolean;
  setIsNotesOpen: (open: boolean) => void;
  isAnnotationOpen: boolean;
  setIsAnnotationOpen: (open: boolean) => void;
  annotationMode: 'pen' | 'text';
  setAnnotationMode: (mode: 'pen' | 'text') => void;
  isSaveProgressOpen: boolean;
  setIsSaveProgressOpen: (open: boolean) => void;
  isFontLarge: boolean;
  toggleFontSize: () => void;
}

const TeacherModeContext = createContext<TeacherModeContextType | undefined>(undefined);

export const TeacherModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isAnnotationOpen, setIsAnnotationOpen] = useState(false);
  const [annotationMode, setAnnotationMode] = useState<'pen' | 'text'>('pen');
  const [isSaveProgressOpen, setIsSaveProgressOpen] = useState(false);
  const [isFontLarge, setIsFontLarge] = useState(false);

  const enableTeacherMode = useCallback(() => {
    setIsTeacherMode(true);
    setIsNotesOpen(false);
    setIsAnnotationOpen(false);
    setAnnotationMode('pen');
    setIsSaveProgressOpen(false);
  }, []);

  const disableTeacherMode = useCallback(() => {
    setIsTeacherMode(false);
    setIsNotesOpen(false);
    setIsAnnotationOpen(false);
    setAnnotationMode('pen');
    setIsSaveProgressOpen(false);
  }, []);
  
  const toggleFontSize = useCallback(() => setIsFontLarge(prev => !prev), []);

  return (
    <TeacherModeContext.Provider value={{
      isTeacherMode,
      enableTeacherMode,
      disableTeacherMode,
      isNotesOpen,
      setIsNotesOpen,
      isAnnotationOpen,
      setIsAnnotationOpen,
      annotationMode,
      setAnnotationMode,
      isSaveProgressOpen,
      setIsSaveProgressOpen,
      isFontLarge,
      toggleFontSize
    }}>
      {children}
    </TeacherModeContext.Provider>
  );
};

export const useTeacherMode = () => {
  const context = useContext(TeacherModeContext);
  if (context === undefined) {
    throw new Error('useTeacherMode must be used within a TeacherModeProvider');
  }
  return context;
};