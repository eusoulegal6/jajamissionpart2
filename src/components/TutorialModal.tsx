import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent hideCloseButton aria-describedby={undefined} className="max-w-none h-screen w-screen p-0 border-0 bg-black">
        <VisuallyHidden><DialogTitle>Tutorial</DialogTitle></VisuallyHidden>
        <div className="relative h-full w-full flex items-center justify-center">
          <video
            src="https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/images/tutorial.mp4"
            controls
            autoPlay
            preload="metadata"
            playsInline
            webkit-playsinline="true"
            x5-playsinline="true"
            className="w-full h-full object-contain"
            style={{ maxHeight: "100vh", maxWidth: "100vw" }}
          >
            Seu navegador não suporta o elemento de vídeo.
          </video>
          
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-[9999] bg-black/60 text-white hover:bg-black/80 pointer-events-auto rounded-full"
            style={{ pointerEvents: "auto" }}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TutorialModal;