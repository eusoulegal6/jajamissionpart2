import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { getVoiceArtist } from '@/utils/voiceArtists';
import OptimizedImg from '@/components/common/OptimizedImg';

interface CreditsPageProps {
  narrator: string;
  onContinue: () => void;
}

const CreditsPage: React.FC<CreditsPageProps> = ({ narrator, onContinue }) => {
  console.log('🎭 CreditsPage received narrator:', narrator);
  const voiceArtist = getVoiceArtist(narrator);
  console.log('🎨 Voice artist found:', voiceArtist);

  if (!narrator || !voiceArtist) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-muted-foreground mb-4">Informações do narrador não encontradas</p>
        <Button onClick={onContinue}>
          Continuar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {/* Title */}
          <h2 className="text-2xl font-bold text-foreground mb-8">
            Narrado por:
          </h2>
          
          {/* Voice Artist Image */}
          <div className="relative mb-6">
            <div className="w-32 h-32 mx-auto rounded-full overflow-hidden shadow-lg">
              <OptimizedImg 
                src={voiceArtist.image} 
                alt={voiceArtist.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Flag positioned over the image */}
            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl">
              {voiceArtist.flag}
            </div>
          </div>
          
          {/* Voice Artist Name */}
          <h3 className="text-xl font-semibold text-foreground mb-8">
            {voiceArtist.name}
          </h3>
          
          {/* Continue Button */}
          <Button 
            onClick={onContinue}
            className="w-full"
            size="lg"
          >
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditsPage;