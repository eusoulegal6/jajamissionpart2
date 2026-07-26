import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Volume2, Mic, Headphones, MessageCircle, BookOpen } from 'lucide-react';

interface PNLInstructionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  variant: 'normal' | 'recording';
}

const PNLInstructionPopup: React.FC<PNLInstructionPopupProps> = ({
  isOpen,
  onClose,
  variant,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-0 overflow-hidden" hideCloseButton>
        <div className={`p-6 ${variant === 'normal' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'}`}>
          <div className="flex justify-center mb-4">
            {variant === 'normal' ? (
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-3">
                  <Headphones className="h-8 w-8 text-white" />
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-3">
                  <Mic className="h-8 w-8 text-white" />
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <Volume2 className="h-8 w-8 text-white" />
                </div>
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-white text-center mb-2">
            {variant === 'normal' ? 'Exercício de Escuta' : 'Exercício de Pronúncia'}
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          {variant === 'normal' ? (
            <>
              <p className="text-gray-700 text-center leading-relaxed">
                Neste exercício, você vai <strong>ouvir</strong> a pronúncia de cada palavra ou frase.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <p className="text-gray-700 flex items-start gap-2">
                  <span className="text-blue-500 font-bold">1.</span>
                  <span><strong>Escute</strong> com atenção clicando no botão de áudio</span>
                </p>
                <p className="text-gray-700 flex items-start gap-2">
                  <span className="text-blue-500 font-bold">2.</span>
                  <span><strong>Repita</strong> em voz alta o que ouviu</span>
                </p>
              </div>
              <p className="text-sm text-gray-500 text-center italic">
                Preste atenção na pronúncia e no significado de cada palavra!
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-700 text-center leading-relaxed">
                Neste exercício, você vai <strong>gravar</strong> sua pronúncia para receber feedback.
              </p>
              <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                <p className="text-gray-700 flex items-start gap-2">
                  <span className="text-purple-500 font-bold">1.</span>
                  <span><strong>Clique no microfone</strong> para começar a gravar</span>
                </p>
                <p className="text-gray-700 flex items-start gap-2">
                  <span className="text-purple-500 font-bold">2.</span>
                  <span><strong>Repita</strong> a palavra ou frase em inglês</span>
                </p>
                <p className="text-gray-700 flex items-start gap-2">
                  <span className="text-purple-500 font-bold">3.</span>
                  <span><strong>Receba feedback</strong> sobre sua pronúncia</span>
                </p>
              </div>
              <div className="text-sm text-gray-500 text-center italic flex flex-col items-center gap-1">
                <span>Em último caso, se tiver dúvidas sobre uma palavra, clique no ícone</span>
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span>para consultar o vocabulário da lição.</span>
                </span>
              </div>
            </>
          )}
          
          <Button 
            onClick={onClose}
            className={`w-full ${variant === 'normal' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            Entendi, vamos começar!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PNLInstructionPopup;
