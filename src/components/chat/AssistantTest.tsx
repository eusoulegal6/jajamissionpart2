
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, Send, Lightbulb, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AssistantTestProps {
  level: string;
  onBack: () => void;
  onComplete: () => void;
}

const AssistantTest: React.FC<AssistantTestProps> = ({ level, onBack, onComplete }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Olá! Sou seu assistente de inglês. Pode me perguntar qualquer coisa sobre a língua inglesa. Estou aqui para ajudar! 😊"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(true);

  const suggestions = [
    "Como se fala o nome da minha profissão em inglês?",
    "Qual é a diferença entre 'a' e 'an'?",
    "Como posso melhorar minha pronúncia?",
    "Pode me dar exemplos de phrasal verbs?",
    "Como se diz 'saudade' em inglês?"
  ];

  const getResponseForMessage = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes("profissão") || lowerMessage.includes("profession") || lowerMessage.includes("job")) {
      return `Claro! Aqui estão algumas profissões comuns em inglês:

👨‍💻 **Área de TI:**
• Developer/Programmer - Desenvolvedor
• Designer - Designer  
• Data Analyst - Analista de dados

👩‍⚕️ **Área da Saúde:**
• Doctor - Médico(a)
• Nurse - Enfermeiro(a)
• Dentist - Dentista

👨‍🏫 **Educação:**
• Teacher - Professor(a)
• Principal - Diretor(a)

💼 **Negócios:**
• Manager - Gerente
• Accountant - Contador(a)
• Lawyer - Advogado(a)

Qual é a sua profissão? Posso te ajudar com a tradução específica!`;
    }

    if (lowerMessage.includes("saudade")) {
      return `Ah, a famosa palavra "saudade"! 💔

Não existe uma tradução exata em inglês, mas você pode usar:

🎯 **Traduções próximas:**
• **"I miss you"** - Sinto sua falta
• **"I long for..."** - Tenho saudade de...
• **"Nostalgia"** - Para saudade de tempos passados

📝 **Exemplos:**
• "I miss my family" (Sinto saudade da minha família)
• "I long for the days when..." (Tenho saudade dos tempos quando...)
• "I feel nostalgic about my childhood" (Sinto saudade da minha infância)

É uma das palavras mais lindas e únicas do português! 🇧🇷`;
    }

    if (lowerMessage.includes("a") && lowerMessage.includes("an")) {
      return `Ótima pergunta sobre artigos indefinidos! 📚

🔤 **Regra simples:**
• **"A"** - antes de sons de consoante
• **"AN"** - antes de sons de vogal

⚠️ **Atenção:** É pelo SOM, não pela letra!

✅ **Exemplos com "A":**
• A car (som de "c")
• A university (som de "yu")
• A European (som de "yu")

✅ **Exemplos com "AN":**
• An apple (som de "a")
• An hour (som de "a" - h mudo)
• An honest person (som de "o" - h mudo)

💡 **Dica:** Fale a palavra em voz alta e veja se o som inicial é de vogal ou consoante!`;
    }

    if (lowerMessage.includes("pronúncia") || lowerMessage.includes("pronunciation")) {
      return `Excelente pergunta! A pronúncia é fundamental! 🗣️

🎯 **Dicas para melhorar:**

1. **Escute nativos diariamente**
   • Podcasts, séries, filmes
   • YouTube com legendas em inglês

2. **Pratique diariamente**
   • Leia em voz alta 10 min/dia
   • Grave-se falando e compare

3. **Foque nos sons difíceis**
   • TH (think, that)
   • R americano vs brasileiro
   • Vogais longas vs curtas

4. **Use aplicativos**
   • Google Tradutor (botão do microfone)
   • Elsa Speak
   • Sounds Pronunciation

💡 **Dica especial:** Imite um ator/atriz que você gosta! Escolha alguém e tente copiar exatamente como eles falam.`;
    }

    if (lowerMessage.includes("phrasal verbs") || lowerMessage.includes("phrasal")) {
      return `Phrasal verbs são essenciais! 🚀

🎯 **Phrasal Verbs mais comuns:**

💼 **Trabalho/Estudos:**
• **Look up** - Pesquisar (I need to look up this word)
• **Give up** - Desistir (Don't give up!)
• **Take off** - Decolar/tirar (The plane takes off at 6)

🏠 **Casa/Rotina:**
• **Wake up** - Acordar
• **Get up** - Levantar da cama  
• **Turn on/off** - Ligar/desligar
• **Clean up** - Limpar

👥 **Relacionamentos:**
• **Get along** - Se dar bem (We get along great)
• **Break up** - Terminar relacionamento
• **Make up** - Fazer as pazes

💡 **Dica:** Aprenda em contexto! Uma frase vale mais que 10 definições soltas.`;
    }

    // Default response
    return `Entendi sua pergunta! Como assistente, posso ajudar com:

📚 **Gramática** - Regras, tempos verbais, estruturas
🗣️ **Pronúncia** - Dicas para falar melhor
📝 **Vocabulário** - Palavras novas e traduções  
💬 **Conversação** - Frases úteis para o dia a dia
🎯 **Expressões** - Phrasal verbs, idioms, gírias

Qual dessas áreas te interessa mais? Ou tem alguma dúvida específica? 

Estou aqui para tornar seu aprendizado mais fácil! 😊`;
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setInputMessage("");
    setShowSuggestion(false);

    // Add user message
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    // Simulate typing delay and add assistant response
    setTimeout(() => {
      const response = getResponseForMessage(userMessage);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    }, 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    setShowSuggestion(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-4">
          Teste • Assistente IA
        </Badge>
        <h1 className="text-3xl font-bold mb-4 text-[#202123]">
          🤖 Teste o Assistente
        </h1>
        <p className="text-[#6e6e80] text-lg max-w-2xl mx-auto">
          Faça qualquer pergunta sobre inglês e veja como o assistente pode te ajudar!
        </p>
      </div>

      {/* Suggestion Card */}
      {showSuggestion && (
        <Card className="mb-6 border-green-200 bg-green-50 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-700 text-lg">
              <Lightbulb className="h-6 w-6" />
              💡 Sugestão: Pergunte como falar o nome da sua profissão em inglês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-600 mb-4">
              Esta é uma das perguntas mais úteis para conversações do dia a dia! Clique em uma sugestão abaixo ou digite sua própria pergunta:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left justify-start text-green-700 border-green-300 hover:bg-green-100"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-[#202123]">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            Chat com o Assistente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Messages */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 border'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-3">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta sobre inglês..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-gray-600"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-2 text-center">
            💡 Pressione Enter para enviar, Shift+Enter para nova linha
          </p>
        </CardContent>
      </Card>

      <div className="text-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar à explicação
        </Button>
        <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
          Finalizar demonstração
        </Button>
      </div>
    </div>
  );
};

export default AssistantTest;
