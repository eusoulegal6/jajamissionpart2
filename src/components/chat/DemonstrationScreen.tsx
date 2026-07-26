import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Headphones, MessageSquare, CheckCircle, Mic, Play, Pause, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TestExercise from "./TestExercise";
import ArticlesVideosDemo from "./ArticlesVideosDemo";
import AssistantDemo from "./AssistantDemo";
import AssistantTest from "./AssistantTest";

interface DemonstrationScreenProps {
  onBack: () => void;
}

const DemonstrationScreen: React.FC<DemonstrationScreenProps> = ({ onBack }) => {
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<string>(""); // "listening", "aiFeedback", "articles", "assistant", "test-listening", "test-ai", "test-assistant"
  const [showMicAnimation, setShowMicAnimation] = useState(false);
  const [showTyping, setShowTyping] = useState(false);

  const levels = [
    { id: "beginner", name: "Iniciante", description: "A1-A2" },
    { id: "intermediate", name: "Intermediário", description: "B1-B2" },
    { id: "advanced", name: "Avançado", description: "C1-C2" }
  ];

  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level);
  };

  const handleStepSelect = (step: string) => {
    setCurrentStep(step);
    if (step === "listening") {
      // Start mic animation for listening demo
      setTimeout(() => setShowMicAnimation(true), 1000);
      setTimeout(() => setShowMicAnimation(false), 3000);
    } else if (step === "aiFeedback") {
      // Start typing animation for AI feedback demo
      setTimeout(() => setShowTyping(true), 1000);
      setTimeout(() => setShowTyping(false), 4000);
    }
  };

  const handleCompleteDemo = () => {
    setSelectedLevel("");
    setCurrentStep("");
    setShowMicAnimation(false);
    setShowTyping(false);
  };

  const renderLevelSelection = () => (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 text-[#202123] animate-fade-in">
          🎭 Demonstração dos Exercícios
        </h1>
        <p className="text-[#6e6e80] text-lg max-w-2xl mx-auto">
          Veja como funcionam os exercícios das lições completas. Primeiro, escolha seu nível:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
        {levels.map((level) => (
          <Card
            key={level.id}
            className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 hover:border-[#10a37f]"
            onClick={() => handleLevelSelect(level.id)}
          >
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold mb-2 text-[#202123]">{level.name}</h3>
              <Badge variant="outline" className="mb-4">{level.description}</Badge>
              <p className="text-[#6e6e80] text-sm">
                {level.id === "beginner" && "Exercícios simples com vocabulário básico"}
                {level.id === "intermediate" && "Exercícios moderados com gramática intermediária"}
                {level.id === "advanced" && "Exercícios complexos com conteúdo avançado"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStepSelection = () => (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-4">
          Nível: {levels.find(l => l.id === selectedLevel)?.name}
        </Badge>
        <h1 className="text-3xl font-bold mb-4 text-[#202123]">
          Conheça Todos os Recursos
        </h1>
        <p className="text-[#6e6e80] text-lg max-w-2xl mx-auto">
          Explore cada tipo de conteúdo disponível na plataforma:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
        <Card
          className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 hover:border-[#10a37f]"
          onClick={() => handleStepSelect("listening")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-[#202123]">
              <Headphones className="h-8 w-8 text-[#10a37f]" />
              Exercício de Escuta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#6e6e80] mb-4">
              Escute um áudio e digite o que ouviu. Perfeito para melhorar sua compreensão auditiva.
            </p>
            <div className="flex items-center gap-2 text-sm text-[#10a37f]">
              <Mic className="h-4 w-4" />
              <span>Inclui gravação de voz para comparação</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 hover:border-[#10a37f]"
          onClick={() => handleStepSelect("translation")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-[#202123]">
              <MessageSquare className="h-8 w-8 text-[#10a37f]" />
              Exercício de Tradução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#6e6e80] mb-4">
              Pratique tradução e receba feedback personalizado sobre gramática e pronúncia.
            </p>
            <div className="flex items-center gap-2 text-sm text-[#10a37f]">
              <CheckCircle className="h-4 w-4" />
              <span>Correções automáticas e sugestões</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 hover:border-[#10a37f]"
          onClick={() => handleStepSelect("articles")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-[#202123]">
              <BookOpen className="h-8 w-8 text-[#10a37f]" />
              Artigos e Vídeos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#6e6e80] mb-4">
              Conteúdo rico com narração de professores americanos e questões de compreensão.
            </p>
            <div className="flex items-center gap-2 text-sm text-[#10a37f]">
              <Play className="h-4 w-4" />
              <span>Áudio e vídeo com qualidade nativa</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 hover:border-[#10a37f]"
          onClick={() => handleStepSelect("assistant")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-[#202123]">
              <MessageSquare className="h-8 w-8 text-[#10a37f]" />
              Assistente IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#6e6e80] mb-4">
              Assistente disponível 24/7 para tirar dúvidas durante qualquer exercício.
            </p>
            <div className="flex items-center gap-2 text-sm text-[#10a37f]">
              <MessageSquare className="h-4 w-4" />
              <span>Respostas personalizadas para seu nível</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-8">
        <Button variant="outline" onClick={() => setSelectedLevel("")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Seleção de Nível
        </Button>
      </div>
    </div>
  );

  const renderListeningDemo = () => (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-4">
          {levels.find(l => l.id === selectedLevel)?.name} • Exercício de Escuta
        </Badge>
        <h1 className="text-3xl font-bold mb-4 text-[#202123]">
          Como funciona o Exercício de Escuta
        </h1>
      </div>

      <div className="space-y-8">
        {/* Step 1 */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-blue-700">
              <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</div>
              Você escuta um áudio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-center gap-4">
                <Play className="h-8 w-8 text-blue-600" />
                <div className="text-center">
                  <p className="font-medium">🔊 Reproduzindo áudio...</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedLevel === "beginner" && '"Hello, my name is Sarah."'}
                    {selectedLevel === "intermediate" && '"I went to the grocery store yesterday to buy some vegetables."'}
                    {selectedLevel === "advanced" && '"The implementation of sustainable practices requires comprehensive planning."'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-700">
              <div className="bg-green-100 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</div>
              Você digita o que ouviu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg text-center">
                {showTyping ? (
                  <p className="animate-pulse">Digitando: "Hello, my name is Sara"</p>
                ) : (
                  <p className="text-gray-500">Digite aqui o que você ouviu...</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-purple-700">
              <div className="bg-purple-100 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</div>
              Você pode gravar sua pronúncia
              {showMicAnimation && (
                <Mic className="h-6 w-6 text-red-500 animate-pulse" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-center">
                {showMicAnimation ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="bg-red-100 rounded-full p-3 animate-pulse">
                      <Mic className="h-6 w-6 text-red-600" />
                    </div>
                    <p className="text-red-600 font-medium">🎙️ Gravando sua pronúncia...</p>
                  </div>
                ) : (
                  <Button variant="outline" className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Clique para gravar sua pronúncia
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 4 */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-orange-700">
              <div className="bg-orange-100 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</div>
              Você recebe feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">✅ Correto:</h4>
                  <p className="text-sm text-green-700">"Hello, my name is Sarah"</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ Sua resposta:</h4>
                  <p className="text-sm text-yellow-700">"Hello, my name is Sara"</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                💡 <strong>Dica:</strong> Atenção à grafia correta: "Sarah" com 'h' no final.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-8 space-x-4">
        <Button variant="outline" onClick={() => setCurrentStep("")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Recursos
        </Button>
        <Button onClick={() => setCurrentStep("test-listening")} className="bg-green-600 hover:bg-green-700">
          Testar exercício de escuta
        </Button>
      </div>
    </div>
  );

  const renderAIFeedbackDemo = () => (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-4">
          {levels.find(l => l.id === selectedLevel)?.name} • Exercício com IA
        </Badge>
        <h1 className="text-3xl font-bold mb-4 text-[#202123]">
          Como funciona o Exercício com IA
        </h1>
      </div>

      <div className="space-y-8">
        {/* Step 1 */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-blue-700">
              <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</div>
              Você recebe uma pergunta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">❓ Pergunta:</h4>
              <p className="text-blue-700">
                {selectedLevel === "beginner" && "What is your favorite color?"}
                {selectedLevel === "intermediate" && "Describe your typical morning routine."}
                {selectedLevel === "advanced" && "What are your thoughts on the impact of technology on modern communication?"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-700">
              <div className="bg-green-100 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</div>
              Você responde por escrito ou áudio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                {showTyping ? (
                  <p className="animate-pulse text-green-600">
                    Digitando: "My favorite color is blue because it remind me of the ocean..."
                  </p>
                ) : (
                  <p className="text-gray-500">Escreva sua resposta aqui...</p>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">ou</p>
                <Button variant="outline" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Gravar resposta em áudio
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-purple-700">
              <div className="bg-purple-100 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</div>
              A IA analisa sua resposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <p className="text-purple-600 font-medium">🤖 IA analisando gramática, relevância e pronúncia...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 4 */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-orange-700">
              <div className="bg-orange-100 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</div>
              Você recebe feedback detalhado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-center">
                  <h4 className="font-medium text-green-800 mb-1">Pontuação</h4>
                  <p className="text-2xl font-bold text-green-600">8/10</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
                  <h4 className="font-medium text-blue-800 mb-1">Relevância</h4>
                  <p className="text-sm text-blue-700">Resposta adequada</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-center">
                  <h4 className="font-medium text-yellow-800 mb-1">Gramática</h4>
                  <p className="text-sm text-yellow-700">Pequenos erros</p>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">📝 Versão Corrigida:</h4>
                <p className="text-gray-700">
                  "My favorite color is blue because it reminds me of the ocean."
                </p>
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ Correção: "remind" → "reminds" (terceira pessoa do singular)
                </p>
              </div>

              {/* Audio comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg text-center">
                  <h4 className="font-medium text-orange-800 mb-2">🎤 Sua pronúncia</h4>
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Reproduzir
                  </Button>
                </div>
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-center">
                  <h4 className="font-medium text-green-800 mb-2">🗣️ Pronúncia nativa</h4>
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Reproduzir
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-8 space-x-4">
        <Button variant="outline" onClick={() => setCurrentStep("")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Recursos
        </Button>
        <Button onClick={() => setCurrentStep("test-ai")} className="bg-green-600 hover:bg-green-700">
          Testar exercício com IA
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Início
          </Button>
          <h2 className="text-xl font-semibold text-[#202123]">Demonstração dos Exercícios</h2>
          <div className="w-20"></div> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        {!selectedLevel && renderLevelSelection()}
        {selectedLevel && !currentStep && renderStepSelection()}
        {currentStep === "listening" && renderListeningDemo()}
        {currentStep === "translation" && renderAIFeedbackDemo()}
        {currentStep === "articles" && (
          <ArticlesVideosDemo
            level={levels.find(l => l.id === selectedLevel)?.name || ""}
            onBack={() => setCurrentStep("")}
            onNext={() => setCurrentStep("assistant")}
          />
        )}
        {currentStep === "assistant" && (
          <AssistantDemo
            level={levels.find(l => l.id === selectedLevel)?.name || ""}
            onBack={() => setCurrentStep("")}
            onTest={() => setCurrentStep("test-assistant")}
          />
        )}
        {currentStep === "test-listening" && (
          <TestExercise
            exerciseType="listening"
            onBack={() => setCurrentStep("listening")}
            onComplete={handleCompleteDemo}
          />
        )}
        {currentStep === "test-translation" && (
          <TestExercise
            exerciseType="translation"
            onBack={() => setCurrentStep("translation")}
            onComplete={handleCompleteDemo}
          />
        )}
        {currentStep === "test-assistant" && (
          <AssistantTest
            level={levels.find(l => l.id === selectedLevel)?.name || ""}
            onBack={() => setCurrentStep("assistant")}
            onComplete={handleCompleteDemo}
          />
        )}
      </div>
    </div>
  );
};

export default DemonstrationScreen;
