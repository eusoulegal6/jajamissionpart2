
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic } from 'lucide-react';

interface TipScreenProps {
  onProceed: () => void;
}

const TipScreen: React.FC<TipScreenProps> = ({ onProceed }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white p-4">
      <div className="w-full max-w-md mx-auto">
        <Card className="shadow-lg border rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-[#202123]">Dica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-2 pb-6 px-6">
            <div className="space-y-5">
              <p className="flex items-center text-base text-gray-700">
                <span className="flex-1">
                  Caso tenha qualquer dúvida clique nesse ícone e pergunte ao tutor
                </span>
                <img src="/lovable-uploads/8fb056c5-eff7-4a39-a6a5-a715bf7d5bbe.png" alt="Pergunte ao professor" className="h-7 w-7 ml-3 flex-shrink-0" />
              </p>
              <p className="flex items-center text-base text-gray-700">
                <span className="flex-1">
                  Experimente clicar no microfone para responder por áudio e corrigir sua pronúncia!
                </span>
                <Mic className="h-6 w-6 text-[#10a37f] ml-3 flex-shrink-0" />
              </p>
            </div>
            <Button 
              onClick={onProceed} 
              className="w-full bg-[#10a37f] hover:bg-[#0e8e6d] rounded-lg py-3 text-lg font-semibold"
              size="lg"
            >
              Okay!
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TipScreen;
