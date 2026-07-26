
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, BookOpen, Headphones, CheckCircle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ArticlesVideosDemoProps {
  level: string;
  onBack: () => void;
  onNext: () => void;
}

const ArticlesVideosDemo: React.FC<ArticlesVideosDemoProps> = ({ level, onBack, onNext }) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-4">
          Nível: {level} • Conteúdo Educativo
        </Badge>
        <h1 className="text-3xl font-bold mb-4 text-[#202123]">
          📚 Artigos e Vídeos Interativos
        </h1>
        <p className="text-[#6e6e80] text-lg max-w-2xl mx-auto">
          Além dos exercícios, oferecemos conteúdo rico para expandir seu aprendizado de forma envolvente.
        </p>
      </div>

      <div className="space-y-8">
        {/* Articles Section */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-700">
              <div className="bg-green-100 rounded-full w-10 h-10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              Artigos com Narração Nativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">🎯 O que você encontrará:</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Artigos escritos especialmente para seu nível</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Narração por professores americanos nativos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Vocabulário destacado com traduções</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Questões de compreensão interativas</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="text-center mb-3">
                  <h5 className="font-medium text-green-800">📖 Exemplo de Artigo</h5>
                  <p className="text-sm text-green-600">Nível {level}</p>
                </div>
                
                <div className="bg-white p-3 rounded border-l-4 border-l-green-400 mb-3">
                  <h6 className="font-medium text-gray-800 mb-2">
                    {level === "Iniciante" && "The Benefits of Morning Exercise"}
                    {level === "Intermediário" && "Remote Work: The Future of Employment"}
                    {level === "Avançado" && "The Psychology of Decision Making in Modern Society"}
                  </h6>
                  <p className="text-sm text-gray-600">
                    {level === "Iniciante" && "Starting your day with exercise can improve your health and mood..."}
                    {level === "Intermediário" && "The global shift towards remote work has transformed how we think about careers..."}
                    {level === "Avançado" && "Understanding the cognitive biases that influence our daily choices..."}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 p-2 bg-gray-50 rounded">
                  <Headphones className="h-5 w-5 text-gray-600" />
                  <Button size="sm" variant="outline">
                    <Play className="h-4 w-4 mr-2" />
                    Ouvir narração
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos Section */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-blue-700">
              <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center">
                <Play className="h-6 w-6 text-blue-600" />
              </div>
              Vídeos Educativos Interativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">🎬 Conteúdo em vídeo:</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Aulas gravadas por instrutores qualificados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Legendas em inglês e português disponíveis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Exercícios práticos integrados no vídeo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Progresso salvo automaticamente</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="text-center mb-3">
                  <h5 className="font-medium text-blue-800">🎥 Exemplo de Vídeo</h5>
                  <p className="text-sm text-blue-600">Nível {level}</p>
                </div>
                
                <div className="bg-white p-3 rounded border-l-4 border-l-blue-400 mb-3">
                  <div className="aspect-video bg-gray-200 rounded flex items-center justify-center mb-2">
                    <div className="text-center">
                      <Play className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        {level === "Iniciante" && "Basic Conversation Skills"}
                        {level === "Intermediário" && "Business English Fundamentals"}
                        {level === "Avançado" && "Advanced Grammar Structures"}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    Duração: {level === "Iniciante" ? "5-7 min" : level === "Intermediário" ? "10-15 min" : "15-20 min"}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    +{level === "Iniciante" ? "1.2k" : level === "Intermediário" ? "980" : "750"} estudantes assistiram
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Features */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-purple-700">
              <div className="bg-purple-100 rounded-full w-10 h-10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              Recursos Interativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📝</span>
                </div>
                <h5 className="font-medium text-purple-800 mb-2">Questões de Compreensão</h5>
                <p className="text-sm text-purple-600">
                  Teste seu entendimento com perguntas interativas após cada conteúdo
                </p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">💡</span>
                </div>
                <h5 className="font-medium text-purple-800 mb-2">Dicas Contextuais</h5>
                <p className="text-sm text-purple-600">
                  Explicações instantâneas sobre gramática e vocabulário durante a leitura
                </p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📊</span>
                </div>
                <h5 className="font-medium text-purple-800 mb-2">Progresso Detalhado</h5>
                <p className="text-sm text-purple-600">
                  Acompanhe seu progresso e identifique áreas para melhorar
                </p>
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
        <Button onClick={onNext}>
          Próximo: Assistente IA
        </Button>
      </div>
    </div>
  );
};

export default ArticlesVideosDemo;
