import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ConversationMenuScreenProps {
  onSelectChat: () => void;
  onSelectPerguntas: () => void;
  onBack: () => void;
}

const chatMessages = [
  { text: "Hello! 👋", from: "left", delay: 300 },
  { text: "Hi! How are you?", from: "right", delay: 1200 },
  { text: "I'm great, thanks!", from: "left", delay: 2200 },
  { text: "What do you do?", from: "right", delay: 3200 },
  { text: "I'm a teacher 📚", from: "left", delay: 4200 },
  { text: "That's cool!", from: "right", delay: 5200 },
];

const ChatBubbleAnimation = () => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    const timers: ReturnType<typeof setTimeout>[] = [];

    chatMessages.forEach((msg, i) => {
      timers.push(
        setTimeout(() => setVisibleCount(i + 1), msg.delay)
      );
    });

    // Reset and loop after all messages shown
    timers.push(
      setTimeout(() => {
        setCycle((c) => c + 1);
      }, 7000)
    );

    return () => timers.forEach(clearTimeout);
  }, [cycle]);

  // Only show the last 3 visible messages to simulate scrolling
  const visible = chatMessages.slice(0, visibleCount);
  const displayed = visible.slice(-3);

  return (
    <div className="relative w-16 h-16 flex flex-col justify-end overflow-hidden rounded-xl bg-gradient-to-b from-white to-gray-50 p-1.5 gap-[3px]">
      {/* Typing indicator dot */}
      <div className="absolute top-1 right-1.5 flex gap-[2px]">
        <span className="w-[3px] h-[3px] rounded-full bg-[#10a37f] animate-[pulse_1s_ease-in-out_infinite]" />
        <span className="w-[3px] h-[3px] rounded-full bg-[#10a37f] animate-[pulse_1s_ease-in-out_0.2s_infinite]" />
        <span className="w-[3px] h-[3px] rounded-full bg-[#10a37f] animate-[pulse_1s_ease-in-out_0.4s_infinite]" />
      </div>

      {displayed.map((msg, i) => (
        <div
          key={`${cycle}-${visibleCount}-${i}`}
          className={`
            max-w-[85%] px-1.5 py-[2px] text-[6px] font-medium rounded-lg leading-tight
            animate-[fade-in_0.25s_ease-out_both]
            ${msg.from === "left"
              ? "bg-[#10a37f] text-white self-start rounded-bl-sm"
              : "bg-[#e8e8e8] text-[#202123] self-end rounded-br-sm"
            }
          `}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
};

const ConversationMenuScreen: React.FC<ConversationMenuScreenProps> = ({
  onSelectChat,
  onSelectPerguntas,
  onBack,
}) => {
  const { t } = useLanguage();

  return (
    <div className="h-full w-full flex flex-col items-center">
      <div className="w-full max-w-2xl p-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <h1 className="text-2xl font-bold mb-2 text-[#202123]">{t('pratica_conversacao')}</h1>
        <p className="text-muted-foreground mb-6">Escolha como quer praticar</p>

        <div className="grid grid-cols-1 gap-4">
          {/* Chat option */}
          <Card
            className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md group"
            onClick={onSelectChat}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="mr-5 flex-shrink-0 overflow-hidden rounded-xl border border-[#e8e8e8] bg-white group-hover:scale-105 transition-transform duration-300">
                  <ChatBubbleAnimation />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-1 text-[#202123]">Chat</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Converse ao vivo com o professor virtual sobre qualquer tema
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Perguntas option */}
          <Card
            className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] hover:bg-gradient-to-r hover:from-[#f0f0f5] hover:to-[#fafafa] transition-all duration-300 cursor-pointer rounded-2xl shadow-sm hover:shadow-md group"
            onClick={onSelectPerguntas}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="mr-5 flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-xl border border-[#e8e8e8] bg-white group-hover:scale-105 transition-transform duration-300">
                  <img src="/lovable-uploads/366d67d6-53af-4a58-935d-5443882eb8ff.png" alt="Questions" className="h-10 w-10" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-1 text-[#202123]">{t('perguntas')}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Responda perguntas específicas e receba correções detalhadas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConversationMenuScreen;
