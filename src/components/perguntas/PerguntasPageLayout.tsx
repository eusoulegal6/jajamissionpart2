
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PerguntasPageLayoutProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  children: React.ReactNode;
  className?: string;
}

const PerguntasPageLayout: React.FC<PerguntasPageLayoutProps> = ({
  title = "Perguntas",
  subtitle,
  onBack,
  children,
  className
}) => {
  return (
    <div className="flex flex-col h-screen bg-white w-full relative overflow-hidden">
      {/* Fixed header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 w-full">
        {onBack && (
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="mr-2"
            aria-label="Voltar"
          >
            {/* Use allowed Lucide icon: arrow-left */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Button>
        )}
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && (
          <span className="ml-4 text-gray-500 font-normal">{subtitle}</span>
        )}
      </div>
      {/* Main Content */}
      <div className={cn("flex-1 flex items-center justify-center px-2 md:px-0 py-4 w-full", className)}>
        <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 h-full">
          {/* Card container matches lições completas style */}
          <Card className="w-full flex-1 h-fit bg-white shadow-lg">
            {children}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PerguntasPageLayout;

