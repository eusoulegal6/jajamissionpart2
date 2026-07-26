import React, { createContext, useContext, useState, ReactNode } from 'react';

type AccentType = 'american' | 'british';

interface AccentContextType {
  selectedAccent: AccentType;
  setSelectedAccent: (accent: AccentType) => void;
  getVoiceId: () => string;
  resetToDefault: () => void;
}

const AccentContext = createContext<AccentContextType | undefined>(undefined);

export const VOICE_IDS = {
  american: 'aMSt68OGf4xUZAnLpTU8',
  british: 'zNsotODqUhvbJ5wMG7Ei'
};

export const AccentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedAccent, setSelectedAccent] = useState<AccentType>('american');

  const getVoiceId = () => VOICE_IDS[selectedAccent];

  const resetToDefault = () => setSelectedAccent('american');

  return (
    <AccentContext.Provider value={{
      selectedAccent,
      setSelectedAccent,
      getVoiceId,
      resetToDefault
    }}>
      {children}
    </AccentContext.Provider>
  );
};

export const useAccent = () => {
  const context = useContext(AccentContext);
  if (context === undefined) {
    throw new Error('useAccent must be used within an AccentProvider');
  }
  return context;
};