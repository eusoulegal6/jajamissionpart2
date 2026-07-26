import React, { createContext, useContext, useState, useEffect } from 'react';

interface KrakenContextType {
  isKrakenReleased: boolean;
  releaseKraken: () => void;
}

const KrakenContext = createContext<KrakenContextType | undefined>(undefined);

export const KrakenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use sessionStorage to persist across component re-renders within the same session
  const [isKrakenReleased, setIsKrakenReleased] = useState(false);

  const releaseKraken = () => {
    console.log("🐙 Kraken released temporarily!");
    setIsKrakenReleased(true);
  };

  return (
    <KrakenContext.Provider value={{ isKrakenReleased, releaseKraken }}>
      {children}
    </KrakenContext.Provider>
  );
};

export const useKraken = () => {
  const context = useContext(KrakenContext);
  if (!context) {
    throw new Error('useKraken must be used within a KrakenProvider');
  }
  return context;
};