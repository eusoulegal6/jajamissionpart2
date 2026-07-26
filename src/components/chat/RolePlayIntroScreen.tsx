
import React from "react";
import { ArrowLeft, ArrowRight, Coffee, Hotel, Users, ShoppingBag, Plane, MapPin, Globe, Briefcase, Footprints, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RolePlayIntroScreenProps {
  situation: string;
  difficulty: string;
  imageUrl?: string;
  onStart: () => void;
  onBack: () => void;
}

const situationDetails: Record<string, {
  icon: React.ElementType;
  gradient: string;
  characterName: string;
  characterRole: string;
  instructions: string[];
}> = {
  "Pedindo comida em um restaurante": {
    icon: Coffee,
    gradient: "from-orange-500 to-red-500",
    characterName: "Garçom",
    characterRole: "Atendente do restaurante",
    instructions: [
      "Você está em um restaurante e vai interagir com o garçom",
      "Peça sua comida, faça perguntas sobre o cardápio",
      "Pratique vocabulário de comidas e bebidas",
    ],
  },
  "Fazendo check-in em um hotel": {
    icon: Hotel,
    gradient: "from-blue-500 to-indigo-500",
    characterName: "Recepcionista",
    characterRole: "Recepcionista do hotel",
    instructions: [
      "Você chegou ao hotel após uma longa viagem",
      "Faça o check-in, pergunte sobre o quarto e serviços",
      "Pratique vocabulário de hospedagem e viagem",
    ],
  },
  "Conhecendo alguém novo": {
    icon: Users,
    gradient: "from-pink-500 to-rose-500",
    characterName: "Desconhecido(a)",
    characterRole: "Alguém novo em uma festa",
    instructions: [
      "Você está em um evento social conhecendo pessoas novas",
      "Apresente-se, faça perguntas e mantenha uma conversa casual",
      "Pratique apresentações e small talk",
    ],
  },
  "Comprando roupas em uma loja": {
    icon: ShoppingBag,
    gradient: "from-violet-500 to-purple-500",
    characterName: "Vendedor(a)",
    characterRole: "Atendente da loja",
    instructions: [
      "Você está em uma loja de roupas procurando algo para comprar",
      "Peça tamanhos, cores e preços",
      "Pratique vocabulário de compras e vestuário",
    ],
  },
  "Resolvendo um problema no aeroporto": {
    icon: Plane,
    gradient: "from-sky-500 to-cyan-500",
    characterName: "Funcionário(a)",
    characterRole: "Funcionário do aeroporto",
    instructions: [
      "Você está no aeroporto com um problema no voo ou bagagem",
      "Explique seu problema e peça ajuda",
      "Pratique vocabulário de viagem e resolução de problemas",
    ],
  },
  "Pedindo informação na rua": {
    icon: MapPin,
    gradient: "from-emerald-500 to-green-500",
    characterName: "Morador Local",
    characterRole: "Alguém da cidade",
    instructions: [
      "Você está perdido e precisa de direções",
      "Peça informações sobre como chegar ao seu destino",
      "Pratique vocabulário de localização e direções",
    ],
  },
  "Conversando com um estrangeiro sobre cultura brasileira": {
    icon: Globe,
    gradient: "from-amber-500 to-yellow-500",
    characterName: "Turista",
    characterRole: "Turista curioso sobre o Brasil",
    instructions: [
      "Um turista quer saber mais sobre a cultura brasileira",
      "Compartilhe informações sobre comidas, festas e tradições",
      "Pratique como descrever sua cultura em outro idioma",
    ],
  },
  "Participando de uma reunião de trabalho em inglês": {
    icon: Briefcase,
    gradient: "from-slate-600 to-zinc-700",
    characterName: "Gerente",
    characterRole: "Gerente da empresa",
    instructions: [
      "Você está em uma reunião de trabalho internacional",
      "Apresente seu progresso e discuta projetos",
      "Pratique vocabulário corporativo e formal",
    ],
  },
  "Fazendo um passeio com alguém que você acabou de conhecer": {
    icon: Footprints,
    gradient: "from-teal-500 to-cyan-500",
    characterName: "Novo Amigo(a)",
    characterRole: "Alguém mostrando a cidade",
    instructions: [
      "Alguém se ofereceu para mostrar a cidade a você",
      "Converse sobre os lugares, faça perguntas e opine",
      "Pratique conversação casual e expressão de opiniões",
    ],
  },
};

const RolePlayIntroScreen: React.FC<RolePlayIntroScreenProps> = ({
  situation,
  difficulty,
  imageUrl,
  onStart,
  onBack,
}) => {
  const details = situationDetails[situation] || {
    icon: MessageCircle,
    gradient: "from-slate-500 to-slate-600",
    characterName: "Parceiro(a)",
    characterRole: "Parceiro de conversa",
    instructions: ["Prepare-se para praticar em uma situação real"],
  };

  const SitIcon = details.icon;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col md:flex-row bg-gradient-to-b md:bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 overflow-y-auto md:overflow-hidden">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={onBack}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Hero Image — full width on mobile, left column on desktop */}
      <div className="relative w-full h-[35vh] md:h-full md:w-[45%] shrink-0 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={situation}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className={cn("w-full h-full bg-gradient-to-br", details.gradient)} />
        )}
        {/* Gradient overlay — bottom on mobile, right on desktop */}
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />

        {/* Scenario badge over image — visible on mobile only */}
        <div className="absolute bottom-6 left-0 right-0 px-6 md:hidden">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center justify-center h-12 w-12 rounded-2xl text-white shadow-lg",
              `bg-gradient-to-br ${details.gradient}`
            )}>
              <SitIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-white/60 text-sm font-medium uppercase tracking-wider">
                {difficulty}
              </p>
              <h1 className="text-white text-xl font-black leading-tight">
                {situation}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content — right column on desktop */}
      <div className="flex-1 flex flex-col md:overflow-y-auto">
        <div className="flex-1 px-6 py-6 md:py-12 md:px-12 max-w-lg mx-auto w-full md:max-w-2xl">
          {/* Scenario header — desktop only */}
          <div className="hidden md:flex items-center gap-5 mb-10">
            <div className={cn(
              "flex items-center justify-center h-16 w-16 rounded-2xl text-white shadow-lg",
              `bg-gradient-to-br ${details.gradient}`
            )}>
              <SitIcon className="h-8 w-8" />
            </div>
            <div>
              <p className="text-white/60 text-base font-medium uppercase tracking-wider">
                {difficulty}
              </p>
              <h1 className="text-white text-3xl font-black leading-tight">
                {situation}
              </h1>
            </div>
          </div>

          {/* Character card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 md:p-7 border border-white/10 mb-6 md:mb-8">
            <div className="flex items-center gap-4 mb-3 md:mb-4">
              <div className={cn(
                "flex items-center justify-center h-14 w-14 md:h-16 md:w-16 rounded-full text-white shadow-lg",
                `bg-gradient-to-br ${details.gradient}`
              )}>
                <SitIcon className="h-7 w-7 md:h-8 md:w-8" />
              </div>
              <div>
                <p className="text-white text-lg md:text-xl font-bold">{details.characterName}</p>
                <p className="text-white/50 text-sm md:text-base">{details.characterRole}</p>
              </div>
            </div>
            <p className="text-white/70 text-sm md:text-base leading-relaxed">
              Você vai conversar com <strong className="text-white">{details.characterName}</strong> nesta simulação. Responda naturalmente como se fosse uma situação real.
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-3 md:space-y-4 mb-8 md:mb-10">
            <h3 className="text-white/80 text-sm md:text-base font-bold uppercase tracking-wider">
              Como funciona
            </h3>
            {details.instructions.map((instruction, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex items-center justify-center h-6 w-6 md:h-8 md:w-8 rounded-full bg-emerald-500/20 text-emerald-400 text-xs md:text-sm font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-white/70 text-sm md:text-base leading-relaxed">{instruction}</p>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 md:p-5 mb-6">
            <p className="text-emerald-300 text-sm md:text-base leading-relaxed">
              💡 Após algumas mensagens, você receberá um <strong>feedback detalhado</strong> com correções gramaticais e de contexto.
            </p>
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="sticky bottom-0 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 px-6 py-5">
          <div className="max-w-lg mx-auto md:max-w-xl">
            <button
              onClick={onStart}
              className="w-full flex items-center justify-center gap-3 py-4 md:py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-lg md:text-xl font-bold shadow-xl shadow-emerald-500/20 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99]"
            >
              Começar Simulação
              <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePlayIntroScreen;
