import React from 'react';
import { usePhoneAuth } from '@/contexts/PhoneAuthContext';
import LoginScreen from './LoginScreen';
import { Loader } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = usePhoneAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-auto mb-2">
            <img 
              src="/lovable-uploads/27a9e05b-01c1-4f55-9cc2-6f5e6758c158.png" 
              alt="New Horizons" 
              className="w-full h-auto"
            />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader className="h-5 w-5 animate-spin" />
            <span className="text-base">Verificando autenticação...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;