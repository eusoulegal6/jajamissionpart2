import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAccent } from '@/contexts/AccentContext';

interface AccentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccentSelected: () => void;
}

const AccentSelectionModal: React.FC<AccentSelectionModalProps> = ({
  isOpen,
  onClose,
  onAccentSelected
}) => {
  const { selectedAccent, setSelectedAccent } = useAccent();

  const handleAccentSelect = (accent: 'american' | 'british') => {
    setSelectedAccent(accent);
    onAccentSelected();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Escolha o sotaque:</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-6">
          <div className="grid grid-cols-2 gap-6">
            <Button
              variant={selectedAccent === 'american' ? 'default' : 'outline'}
              onClick={() => handleAccentSelect('american')}
              className="flex flex-col items-center justify-center p-8 h-28 text-5xl gap-2"
            >
              🇺🇸
              <span className="text-sm font-semibold">Americano</span>
            </Button>
            <Button
              variant={selectedAccent === 'british' ? 'default' : 'outline'}
              onClick={() => handleAccentSelect('british')}
              className="flex flex-col items-center justify-center p-8 h-28 text-5xl gap-2"
            >
              🇬🇧
              <span className="text-sm font-semibold">Britânico</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccentSelectionModal;