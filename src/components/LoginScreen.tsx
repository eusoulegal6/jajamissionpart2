import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { usePhoneAuth } from '@/contexts/PhoneAuthContext';
import { Loader, Phone, User } from 'lucide-react';

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = usePhoneAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      setError('Por favor, insira seu número de telefone');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await login(phoneNumber, displayName || undefined);

    if (!result.success) {
      setError(result.error || 'Erro ao fazer login');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-auto mb-6 mx-auto">
            <img 
              src="/lovable-uploads/27a9e05b-01c1-4f55-9cc2-6f5e6758c158.png" 
              alt="Fluency Voyage"
              className="w-full h-auto"
            />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Bem-vindo ao Fluency Voyage
          </h1>
          <p className="text-muted-foreground">
            Entre com seu número de telefone para continuar
          </p>
        </div>

        <Card className="shadow-lg border-border">
          <CardHeader className="space-y-1">
            <h2 className="text-xl font-medium text-center text-foreground">
              Fazer Login
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Número de Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 input-focus"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium text-foreground">
                  Nome (opcional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Seu nome"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 input-focus"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base button-hover"
              >
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>
            Ao entrar, você aceita nossos termos de uso e política de privacidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;