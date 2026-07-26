import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePhoneAuth } from '@/contexts/PhoneAuthContext';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Globe2,
  Loader,
  MessageCircle,
  Phone,
  Sparkles,
  User,
} from 'lucide-react';

const learningHighlights = [
  { icon: MessageCircle, label: 'Conversação com IA' },
  { icon: BookOpen, label: 'Aulas personalizadas' },
  { icon: Globe2, label: 'Inglês para a vida real' },
];

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
    <main className="min-h-screen bg-[#f7f5ff] text-[#211747] lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#352075] px-10 py-10 text-white lg:flex lg:flex-col xl:px-16 xl:py-12">
        <div className="absolute -left-28 top-[32%] h-72 w-72 rounded-full border border-white/10" />
        <div className="absolute -left-16 top-[38%] h-44 w-44 rounded-full border border-white/10" />
        <div className="absolute -right-28 -top-24 h-96 w-96 rounded-full bg-[#7051dd] opacity-70 blur-2xl" />
        <div className="absolute bottom-[-12rem] right-[-6rem] h-[34rem] w-[34rem] rounded-full bg-[#ffcb77]/15 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3 font-bold tracking-tight">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-lg shadow-black/10">
            <img
              src="/lovable-uploads/27a9e05b-01c1-4f55-9cc2-6f5e6758c158.png"
              alt=""
              className="h-8 w-8 object-contain"
            />
          </div>
          <span className="text-xl">Fluency Voyage</span>
        </div>

        <div className="relative z-10 my-auto max-w-2xl py-12">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#ffdc9d] backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            Sua jornada começa aqui
          </div>
          <h1 className="max-w-xl text-5xl font-black leading-[1.02] tracking-[-0.045em] xl:text-7xl">
            Vá mais longe com o seu <span className="text-[#ffcb77]">inglês.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/70">
            Pratique no seu ritmo, ganhe confiança e transforme cada conversa em uma nova oportunidade.
          </p>

          <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
            {learningHighlights.map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-sm">
                <Icon className="mb-3 h-5 w-5 text-[#ffcb77]" />
                <p className="text-sm font-semibold leading-5 text-white/90">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-sm text-white/60">
          <div className="flex -space-x-2" aria-hidden="true">
            <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#352075] bg-[#ffcb77] text-[10px] font-black text-[#352075]">OL</span>
            <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#352075] bg-[#90d5c3] text-[10px] font-black text-[#352075]">HI</span>
            <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#352075] bg-[#f59e9e] text-[10px] font-black text-[#352075]">HEY</span>
          </div>
          <span>Aprender fica melhor quando você começa.</span>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-8 sm:px-10 lg:bg-white lg:px-12">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#8b5cf6]/10 blur-3xl lg:hidden" />
        <div className="relative w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-sm">
              <img
                src="/lovable-uploads/27a9e05b-01c1-4f55-9cc2-6f5e6758c158.png"
                alt=""
                className="h-8 w-8 object-contain"
              />
            </div>
            <span className="text-lg font-extrabold tracking-tight">Fluency Voyage</span>
          </div>

          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#eee9ff] px-3 py-1.5 text-xs font-bold text-[#6547d9] lg:hidden">
              <Sparkles className="h-3.5 w-3.5" /> Sua jornada começa aqui
            </div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-[#6547d9]">Bem-vindo de volta</p>
            <h2 className="text-3xl font-black tracking-[-0.035em] text-[#211747] sm:text-4xl">Continue sua jornada</h2>
            <p className="mt-3 leading-7 text-[#6f6980]">Entre com seus dados para acessar suas aulas e continuar de onde parou.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-bold text-[#30294a]">Número de telefone</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#807894]" />
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(11) 99999-9999"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading}
                  aria-describedby={error ? 'login-error' : undefined}
                  className="h-14 rounded-2xl border-[#ded9eb] bg-white pl-12 text-base shadow-sm transition focus-visible:border-[#7357dc] focus-visible:ring-4 focus-visible:ring-[#7357dc]/10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="displayName" className="text-sm font-bold text-[#30294a]">Como podemos te chamar?</label>
                <span className="text-xs font-medium text-[#918a9e]">Opcional</span>
              </div>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#807894]" />
                <Input
                  id="displayName"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu primeiro nome"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                  className="h-14 rounded-2xl border-[#ded9eb] bg-white pl-12 text-base shadow-sm transition focus-visible:border-[#7357dc] focus-visible:ring-4 focus-visible:ring-[#7357dc]/10"
                />
              </div>
            </div>

            {error && (
              <div id="login-error" role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="group h-14 w-full rounded-2xl bg-[#6547d9] text-base font-bold text-white shadow-[0_12px_28px_rgba(101,71,217,0.28)] transition hover:-translate-y-0.5 hover:bg-[#5639c8] hover:shadow-[0_16px_32px_rgba(101,71,217,0.34)]"
            >
              {isLoading ? (
                <><Loader className="mr-2 h-5 w-5 animate-spin" /> Entrando...</>
              ) : (
                <>Entrar na plataforma <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></>
              )}
            </Button>
          </form>

          <div className="mt-7 flex items-center justify-center gap-2 text-center text-xs leading-5 text-[#837c91]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#42a58c]" />
            <p>Login seguro. Seus dados ficam protegidos.</p>
          </div>

          <p className="mt-8 border-t border-[#ebe8f1] pt-6 text-center text-xs leading-5 text-[#918a9e]">
            Ao continuar, você concorda com nossos <button type="button" className="font-semibold text-[#5f46bb] hover:underline">Termos de Uso</button> e <button type="button" className="font-semibold text-[#5f46bb] hover:underline">Política de Privacidade</button>.
          </p>
        </div>
      </section>
    </main>
  );
};

export default LoginScreen;
