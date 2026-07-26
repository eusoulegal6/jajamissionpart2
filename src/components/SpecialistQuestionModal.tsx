import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface SpecialistQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWordQuestion: () => void;
  onOtherQuestion: () => void;
}

const SpecialistQuestionModal: React.FC<SpecialistQuestionModalProps> = ({
  isOpen,
  onClose,
  onWordQuestion,
  onOtherQuestion,
}) => {
  const { t } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col gap-3 mt-2">
          <Button
            onClick={onWordQuestion}
            className="w-full py-6 text-base"
            variant="default"
          >
            {t('duvida_palavra')}
          </Button>
          <Button
            onClick={onOtherQuestion}
            className="w-full py-6 text-base"
            variant="outline"
          >
            {t('outra_duvida')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpecialistQuestionModal;