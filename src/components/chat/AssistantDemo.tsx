
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, Lightbulb, HelpCircle, Zap, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AssistantDemoProps {
  level: string;
  onBack: () => void;
  onTest: () => void;
}

const AssistantDemo: React.FC<AssistantDemoProps> = ({ level, onBack, onTest }) => {
  const [showChatExample, setShowChatExample] = useState(false);

  const suggestions = [
    "Como se fala o nome da minha profissão em inglês?",
    "Qual é a diferença entre 'a' e 'an'?",
    "Como posso melhorar minha pronúncia?",
    "Pode me dar exemplos de phrasal verbs?",
    "Como se diz 'saudade' em inglês?"
  ];

  const toggleChatExample = () => {
    setShowChatExample(!showChatExample);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-4">
          Nível: {level} • Assistente IA
        </Badge>
        <h1 className="text-3xl font-bold mb-4 text-[#202123]">
          🤖 Seu Assistente Pessoal de Inglês
        </h1>
        <p className="text-[#6e6e80] text-lg max-w-2xl mx-auto">
          Em todos os exercícios, você tem acesso a um assistente inteligente que pode responder qualquer dúvida instantaneamente.
        </p>
      </div>

      <div className="space-y-8">
        {/* Always Available */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-700">
              <div className="bg-green-100 rounded-full w-10 h-10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              Sempre Disponível Durante os Exercícios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">🎯 Quando usar o assistente:</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span>Durante exercícios de escuta quando não entender uma palavra</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span>Nos exercícios com IA quando precisar de ajuda com gramática</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span>Ao ler artigos quando encontrar vocabulário novo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span>Assistindo vídeos quando quiser exemplos extras</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="text-center mb-3">
                  <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h5 className="font-medium text-green-800">Chat do Assistente</h5>
                </div>
                
                <div className="bg-white rounded-lg p-3 border shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600 font-medium">ONLINE</span>
                  </div>
                  <p className="text-sm text-gray-600 italic">
                    "Estou aqui para ajudar! Pode perguntar qualquer coisa sobre inglês."
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Intelligent Responses */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-blue-700">
              <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              Respostas Inteligentes e Personalizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                O assistente conhece seu nível e adapta as explicações para você. Veja alguns exemplos:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">❓ Pergunta:</h5>
                  <p className="text-blue-700 mb-3">"Qual a diferença entre 'make' e 'do'?"</p>
                  
                  <h5 className="font-medium text-blue-800 mb-2">🤖 Resposta para nível {level}:</h5>
                  <p className="text-sm text-blue-600">
                    {level === "Iniciante" && "Use 'make' para criar algo (make coffee, make a cake) e 'do' para ações gerais (do homework, do exercise). Exemplo simples: I make breakfast / I do my homework."}
                    {level === "Intermediário" && "'Make' é usado para produção/criação física (make dinner, make a decision), enquanto 'do' é para atividades/tarefas (do business, do research). Há algumas expressões fixas que você deve memorizar."}
                    {level === "Avançado" && "'Make' implica criação ou produção de algo tangível/conceitual, enquanto 'do' refere-se à execução de atividades. Note collocations específicas: make progress vs do research, make an effort vs do your best."}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">❓ Pergunta:</h5>
                  <p className="text-blue-700 mb-3">"Como se fala 'saudade' em inglês?"</p>
                  
                  <h5 className="font-medium text-blue-800 mb-2">🤖 Resposta:</h5>
                  <p className="text-sm text-blue-600">
                    Não existe uma tradução exata para 'saudade', mas você pode usar: 'I miss you' (sinto sua falta), 'I long for...' (tenho saudade de...), ou 'nostalgia' para sentimentos do passado. É uma das palavras únicas do português!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Example */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-purple-700">
              <div className="bg-purple-100 rounded-full w-10 h-10 flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-purple-600" />
              </div>
              Experimente uma Conversa com o Assistente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Clique no botão abaixo para ver como seria uma conversa real com o assistente:
              </p>

              <div className="text-center">
                <Button onClick={toggleChatExample} variant="outline">
                  {showChatExample ? "Fechar exemplo" : "Ver exemplo de conversa"}
                </Button>
              </div>

              {showChatExample && (
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg animate-fade-in">
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <div className="bg-blue-500 text-white p-3 rounded-lg max-w-sm">
                        <p className="text-sm">Como se fala "estou com fome" em inglês?</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-start">
                      <div className="bg-white border p-3 rounded-lg max-w-sm">
                        <p className="text-sm">
                          Você pode dizer <strong>"I'm hungry"</strong> (mais comum) ou <strong>"I'm starving"</strong> (quando está com muita fome). 
                          <br/><br/>
                          Exemplos:
                          <br/>• "I'm hungry. Let's eat!" 
                          <br/>• "I'm starving! I haven't eaten all day."
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="bg-blue-500 text-white p-3 rounded-lg max-w-sm">
                        <p className="text-sm">E "estou satisfeito" depois de comer?</p>
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <div className="bg-white border p-3 rounded-lg max-w-sm">
                        <p className="text-sm">
                          Perfeita pergunta! Use <strong>"I'm full"</strong> quando estiver satisfeito.
                          <br/><br/>
                          Exemplo: "Thank you, I'm full!" (Obrigado, estou satisfeito!)
                          <br/><br/>
                          Outras opções: "I'm satisfied" (mais formal) ou "I've had enough" (já comi o suficiente).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Suggestions */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-orange-700">
              <div className="bg-orange-100 rounded-full w-10 h-10 flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-orange-600" />
              </div>
              Sugestões de Perguntas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Não sabe o que perguntar? Aqui estão algumas sugestões populares:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                  <p className="text-sm text-orange-800">💡 {suggestion}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-orange-800 mb-1">💡 Sugestão Especial para Você:</h5>
                  <p className="text-orange-700 font-medium">
                    "Pergunte como falar o nome da sua profissão em inglês"
                  </p>
                  <p className="text-sm text-orange-600 mt-1">
                    Uma das perguntas mais úteis para conversações do dia a dia!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-8 space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={onTest} className="bg-green-600 hover:bg-green-700">
          <MessageSquare className="mr-2 h-4 w-4" />
          Testar o Assistente
        </Button>
      </div>
    </div>
  );
};

export default AssistantDemo;
