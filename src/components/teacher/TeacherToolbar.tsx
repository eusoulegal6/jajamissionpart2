import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StickyNote, Type, ALargeSmall } from 'lucide-react';
import sharedAudioIcon from '@/assets/shared-audio-icon.png';
import { useTeacherMode } from '@/contexts/TeacherModeContext';
import { useAudioInput } from '@/contexts/AudioInputContext';
import { usePDFZoom } from '@/contexts/PDFZoomContext';
import TeacherNotesModal from './TeacherNotesModal';
import TeacherProgressPanel from './TeacherProgressPanel';
import WordSaverModal from './WordSaverModal';
import ScreenAnnotation from './ScreenAnnotation';
import TranslatorModal from './TranslatorModal';
import TranslationOptionsPopup from './TranslationOptionsPopup';
import tradutorIcon from '@/assets/tradutor-icon.png';

const TeacherToolbar: React.FC = () => {
  const { 
    isNotesOpen, 
    setIsNotesOpen, 
    isAnnotationOpen, 
    setIsAnnotationOpen, 
    annotationMode, 
    setAnnotationMode,
    isFontLarge,
    toggleFontSize
  } = useTeacherMode();
  const { isTabAudioActive, activateTabAudio, deactivateTabAudio } = useAudioInput();
  const { isPDFActive } = usePDFZoom();
  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const [showTranslationOptions, setShowTranslationOptions] = useState(false);
  const [showTranslator, setShowTranslator] = useState(false);

  const handleAudioToggle = () => {
    if (isTabAudioActive) {
      deactivateTabAudio();
    } else {
      activateTabAudio();
    }
  };

  return (
    <>
      <div data-teacher-ui className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {/* Translator button - special tool at top */}
        <button
          onClick={() => setShowTranslationOptions(true)}
          className="rounded-full h-12 w-12 bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-primary/30 hover:border-primary/50 hover:from-blue-200 hover:to-purple-200 flex items-center justify-center shadow-md transition-all duration-200"
          title="Translation Options"
        >
          <img src={tradutorIcon} alt="Translation" className="h-8 w-8 object-contain" />
        </button>

        <div className="h-1" /> {/* Spacer */}

        {/* Shared audio button - hidden temporarily, keep for future use */}
        {false && (
          <button
            onClick={handleAudioToggle}
            className={`rounded-full h-12 w-12 flex items-center justify-center transition-all duration-200 ${
              isTabAudioActive 
                ? 'ring-2 ring-red-500 bg-red-100' 
                : ''
            }`}
            title={isTabAudioActive ? "Disable shared audio" : "Enable shared audio"}
          >
            <img src={sharedAudioIcon} alt="Shared audio" className="h-10 w-10 object-contain" />
          </button>
        )}
        
        <Button
          onClick={() => setIsNotesOpen(true)}
          variant="outline"
          size="lg"
          className="rounded-full h-12 w-12"
          title="Open notes"
        >
          <StickyNote className="h-6 w-6" />
        </Button>
        


        <Button
          onClick={toggleFontSize}
          variant="outline"
          size="lg"
          className={`rounded-full h-12 w-12 ${isFontLarge ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
          title={isFontLarge ? "Normal font size" : "Large font size"}
        >
          {isFontLarge ? (
            <ALargeSmall className="h-6 w-6" />
          ) : (
            <Type className="h-6 w-6" />
          )}
        </Button>

      </div>

      {isNotesOpen && (
        <TeacherNotesModal 
          isOpen={isNotesOpen} 
          onClose={() => setIsNotesOpen(false)} 
        />
      )}
      
      {showProgressPanel && (
        <TeacherProgressPanel
          isOpen={showProgressPanel}
          onClose={() => setShowProgressPanel(false)}
        />
      )}

      {isAnnotationOpen && (
        <ScreenAnnotation
          isOpen={isAnnotationOpen}
          onClose={() => setIsAnnotationOpen(false)}
          mode={annotationMode}
        />
      )}

      {showTranslationOptions && (
        <TranslationOptionsPopup
          isOpen={showTranslationOptions}
          onClose={() => setShowTranslationOptions(false)}
          onOpenTranslator={() => setShowTranslator(true)}
        />
      )}

      {showTranslator && (
        <TranslatorModal
          isOpen={showTranslator}
          onClose={() => setShowTranslator(false)}
        />
      )}
    </>
  );
};

export default TeacherToolbar;