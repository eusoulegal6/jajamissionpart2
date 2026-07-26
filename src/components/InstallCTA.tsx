import React, { useEffect, useState } from 'react';
import { pwa } from '../pwa/install-pwa';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function InstallCTA() {
  const [showInstall, setShowInstall] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (pwa.isStandalone()) return;
    if (pwa.isIosSafari()) setShowIosTip(true);
    pwa.onBeforeInstallPrompt(() => setShowInstall(true));
  }, []);

  const handleClick = async () => {
    const result = await pwa.triggerInstall();
    if (result === 'unavailable') {
      alert('Se o botão não aparecer, procure por “Adicionar à tela inicial” no menu do navegador.');
    }
  };

  if (pwa.isStandalone()) return null;

  if (showInstall && isMobile) {
    return (
      <Card className="bg-gradient-to-r from-[#e6f4ff] to-[#ffffff] border border-[#cfe8ff] rounded-2xl shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-6">
          <div className="flex items-center">
            <Download className="h-10 w-10 mr-5 text-[#0d6efd]" />
            <div className="flex-1">
              <h2 className="text-lg font-bold mb-1.5 text-[#202123]">Instale o aplicativo</h2>
              <p className="text-[#6e6e80] text-sm">Use o Fluency Voyage como um app no seu dispositivo.</p>
            </div>
            <Button onClick={handleClick} className="ml-4 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-xl">
              Baixar aplicativo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showIosTip && !showInstall && isMobile) {
    return (
      <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-start">
            <Download className="h-6 w-6 mr-4 mt-1 text-[#10a37f]" />
            <div>
              <h3 className="text-base font-semibold text-[#202123] mb-1">Instalar no iPhone</h3>
              <p className="text-[#6e6e80] text-sm">
                Toque em <em>Compartilhar</em> → <em>Adicionar à Tela de Início</em>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

