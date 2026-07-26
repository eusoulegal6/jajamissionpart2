import React, { useState, useEffect, useCallback, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  ExternalLink,
  BookOpen,
  MessageCircle,
  Video,
  GraduationCap,
  ChevronDown,
  Monitor,
} from "lucide-react";
import AulasComplementaresEditor from "@/components/aulas-complementares/AulasComplementaresEditor";
import ScrollDownHint from "@/components/aulas-complementares/ScrollDownHint";
import TutorialModal from "@/components/TutorialModal";
import plataformaImg from "@/assets/plataforma-estudos.png";
import whatsappIcon from "@/assets/whatsapp-icon.png";
import { QRCodeSVG } from "qrcode.react";
import { renderTextWithAnswers } from "@/utils/textHighlightingUtils";

interface GroupClass {
  id: string;
  title: string;
  description: string;
  level: string;
  badge: string;
  teachers: string;
  days: string;
  display_time: string;
  start_time: string;
  link: string;
  is_active: boolean;
  sort_priority: number;
  image_url: string;
  is_american: boolean;
}

interface PageSettings {
  id: string;
  platform_url: string;
  tutorial_url: string;
  page_title: string;
  page_subtitle: string;
}

const defaultSettings: PageSettings = {
  id: "",
  platform_url: "https://tutorvirtualnewhorizons.com.br/",
  tutorial_url: "https://youtu.be/pNy3IstuRZk?si=bqnbRmkg8EsvxdD6",
  page_title: "Aulas complementares e plataforma de estudos",
  page_subtitle:
    "Além das aulas particulares, os alunos da Fluency Voyage também têm acesso à nossa plataforma de estudos e a aulas complementares que acontecem todos os dias",
};

const levelColors: Record<string, string> = {
  Iniciante: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Intermediário: "bg-sky-100 text-sky-800 border-sky-200",
  Avançado: "bg-violet-100 text-violet-800 border-violet-200",
  "100% Inglês": "bg-amber-100 text-amber-800 border-amber-200",
};

const WEEK_DAYS: { key: string; label: string; short: string; matches: string[] }[] = [
  { key: "mon", label: "Segunda-feira", short: "Seg", matches: ["segunda", "monday", "mon"] },
  { key: "tue", label: "Terça-feira", short: "Ter", matches: ["terça", "terca", "tuesday", "tue"] },
  { key: "wed", label: "Quarta-feira", short: "Qua", matches: ["quarta", "wednesday", "wed"] },
  { key: "thu", label: "Quinta-feira", short: "Qui", matches: ["quinta", "thursday", "thu"] },
  { key: "fri", label: "Sexta-feira", short: "Sex", matches: ["sexta", "friday", "fri"] },
];

const dayAccents: Record<string, { grad: string; ring: string; text: string; chip: string; soft: string }> = {
  mon: { grad: "from-rose-400 to-orange-400", ring: "ring-rose-200", text: "text-rose-600", chip: "bg-rose-50 text-rose-700", soft: "bg-rose-50/40" },
  tue: { grad: "from-amber-400 to-yellow-400", ring: "ring-amber-200", text: "text-amber-600", chip: "bg-amber-50 text-amber-700", soft: "bg-amber-50/40" },
  wed: { grad: "from-emerald-400 to-teal-400", ring: "ring-emerald-200", text: "text-emerald-600", chip: "bg-emerald-50 text-emerald-700", soft: "bg-emerald-50/40" },
  thu: { grad: "from-sky-400 to-cyan-400", ring: "ring-sky-200", text: "text-sky-600", chip: "bg-sky-50 text-sky-700", soft: "bg-sky-50/40" },
  fri: { grad: "from-indigo-400 to-violet-400", ring: "ring-indigo-200", text: "text-indigo-600", chip: "bg-indigo-50 text-indigo-700", soft: "bg-indigo-50/40" },
  sat: { grad: "from-fuchsia-400 to-pink-400", ring: "ring-fuchsia-200", text: "text-fuchsia-600", chip: "bg-fuchsia-50 text-fuchsia-700", soft: "bg-fuchsia-50/40" },
  sun: { grad: "from-purple-400 to-violet-500", ring: "ring-purple-200", text: "text-purple-600", chip: "bg-purple-50 text-purple-700", soft: "bg-purple-50/40" },
};

const classesForDay = (classes: GroupClass[], dayMatches: string[]) => {
  return classes
    .filter((c) => {
      const d = (c.days || "").toLowerCase();
      return dayMatches.some((m) => d.includes(m));
    })
    .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
};

const WeeklySchedule: React.FC<{ classes: GroupClass[]; onSelect: (cls: GroupClass) => void }> = ({ classes, onSelect }) => {
  const todayIdx = (new Date().getDay() + 6) % 7; // Monday = 0

  return (
    <section className="px-4 pb-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          Cronograma semanal
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {WEEK_DAYS.map((day, idx) => {
            const dayClasses = classesForDay(classes, day.matches);
            const accent = dayAccents[day.key];
            const isToday = idx === todayIdx;

            return (
              <div
                key={day.key}
                className={`group relative overflow-hidden rounded-3xl bg-white shadow-[0_4px_30px_-10px_rgba(0,0,0,0.08)] ring-1 ring-gray-100 transition-all duration-300 hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1 ${
                  isToday ? `ring-2 ${accent.ring}` : ""
                }`}
              >
                {/* Gradient header */}
                <div className={`h-2 w-full bg-gradient-to-r ${accent.grad}`} />

                {/* Day header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <div>
                    <p className={`text-[11px] font-bold uppercase tracking-wider ${accent.text}`}>
                      {day.short}
                    </p>
                    <h3 className="mt-0.5 text-lg font-extrabold text-gray-900">
                      {day.label.replace("-feira", "")}
                    </h3>
                  </div>
                  {isToday && (
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${accent.chip}`}>
                      Hoje
                    </span>
                  )}
                </div>

                {/* Classes list */}
                <div className={`px-5 pb-5 ${accent.soft}`}>
                  {dayClasses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 py-8 text-center">
                      <p className="text-xs text-gray-400">Sem aulas neste dia</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {dayClasses.map((cls, clsIdx) => {
                        const hour = parseInt((cls.start_time || "00:00").split(":")[0], 10);
                        let period: "morning" | "afternoon" | "evening" = "morning";
                        if (hour >= 18) period = "evening";
                        else if (hour >= 12) period = "afternoon";

                        const prevHour = clsIdx > 0
                          ? parseInt((dayClasses[clsIdx - 1].start_time || "00:00").split(":")[0], 10)
                          : -1;
                        let prevPeriod: "morning" | "afternoon" | "evening" = "morning";
                        if (prevHour >= 18) prevPeriod = "evening";
                        else if (prevHour >= 12) prevPeriod = "afternoon";

                        const showSpacer = clsIdx > 0 && period !== prevPeriod;

                        return (
                          <React.Fragment key={cls.id}>
                            {showSpacer && <div className="h-3" />}
                            <button
                              type="button"
                              onClick={() => onSelect(cls)}
                              className="group/item w-full text-left flex items-start gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-gray-100 transition-all hover:ring-2 hover:ring-sky-200 hover:shadow-md"
                            >
                              {/* Time badge */}
                              <div className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${accent.chip}`}>
                                {(cls.display_time || "").replace(/\s*\(?\s*(manhã|tarde|noite)\s*\)?/gi, "").trim()}
                              </div>

                              {/* Content */}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold leading-snug text-gray-900 group-hover/item:text-sky-700 transition-colors break-words">
                                  {cls.title}
                                  {cls.is_american && <span className="ml-1.5">🇺🇸</span>}
                                </p>
                                {cls.level && cls.level.trim() !== "" && (
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {cls.level.split(",").map(l => l.trim()).filter(Boolean).map((lvl) => (
                                      <Badge
                                        key={lvl}
                                        variant="outline"
                                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                          levelColors[lvl] || "bg-gray-100 text-gray-600 border-gray-200"
                                        }`}
                                      >
                                        {lvl}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Click indicator */}
                              <div className="shrink-0 mt-0.5 rounded-full bg-gray-50 p-2 text-gray-400 transition-all group-hover/item:bg-sky-50 group-hover/item:text-sky-500">
                                <ExternalLink className="h-4 w-4" />
                              </div>
                            </button>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const AulasComplementares: React.FC = () => {
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [settings, setSettings] = useState<PageSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedClass, setSelectedClass] = useState<GroupClass | null>(null);
  const [hintVisible, setHintVisible] = useState(true);
  const scheduleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scheduleRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setHintVisible(false);
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    const timeout = window.setTimeout(() => setHintVisible(false), 6000);
    return () => {
      obs.disconnect();
      window.clearTimeout(timeout);
    };
  }, [loading]);

  // Secret code listener: "abcdefg"
  useEffect(() => {
    let buffer = "";
    const handler = (e: KeyboardEvent) => {
      buffer = (buffer + e.key).slice(-7);
      if (buffer === "abcdefg") {
        setEditorOpen(true);
        buffer = "";
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [classesRes, settingsRes] = await Promise.all([
      supabase
        .from("group_classes" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_priority", { ascending: true })
        .order("start_time", { ascending: true }),
      supabase
        .from("resource_page_settings" as any)
        .select("*")
        .limit(1)
        .single(),
    ]);

    if (classesRes.data) {
      setClasses(classesRes.data as any as GroupClass[]);
    }
    if (settingsRes.data) {
      setSettings(settingsRes.data as any as PageSettings);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const scrollToClasses = () => {
    document.getElementById("aulas-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToPlatform = () => {
    document.getElementById("plataforma-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-50/30">
      <Helmet>
        <title>Aulas Complementares - Fluency Voyage</title>
        <meta property="og:title" content="Aulas Complementares - Fluency Voyage" />
        <meta property="og:description" content="Confira as aulas complementares disponíveis na Fluency Voyage. Aulas em grupo para todos os níveis!" />
        <meta property="og:image" content={`${window.location.origin}/og-aulas-complementares.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={`${window.location.origin}/aulas-complementares`} />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Top-right navigation */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={scrollToPlatform}
          className="rounded-full bg-white/90 backdrop-blur-sm border border-sky-200/60 px-4 py-2 text-sm font-semibold text-sky-700 shadow-md hover:bg-sky-50 hover:shadow-lg transition-all"
        >
          Plataforma de estudos
        </button>
        <button
          onClick={scrollToClasses}
          className="rounded-full bg-white/90 backdrop-blur-sm border border-sky-200/60 px-4 py-2 text-sm font-semibold text-sky-700 shadow-md hover:bg-sky-50 hover:shadow-lg transition-all"
        >
          Aulas ao vivo
        </button>
      </div>
      {/* HERO */}
      <section className="relative overflow-hidden px-4 pt-16 pb-8 sm:pt-24 sm:pb-12">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-8 w-40 sm:w-52">
            <img
              src="/lovable-uploads/fd26bb69-cb53-49fe-95d0-fa9a31c08976.png"
              alt="Fluency Voyage"
              className="w-full h-auto drop-shadow-md"
            />
          </div>

          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
            {settings.page_title}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            {settings.page_subtitle}
          </p>
        </div>
      </section>

      {/* NATIVE TUTORS NOTICE */}
      <section className="px-4 pb-10">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200/60 shadow-md">
            <div className="flex items-center gap-5 px-8 py-7 sm:px-10">
              <span className="text-5xl sm:text-6xl flex-shrink-0" role="img" aria-label="American flag">🇺🇸</span>
              <p className="text-base sm:text-lg leading-relaxed text-gray-700">
                <span className="font-semibold text-gray-900">Atenção:</span>{" "}
                Nossas aulas são, em maioria, com{" "}
                <span className="font-bold text-sky-700 bg-sky-100/80 px-2 py-1 rounded-md text-lg sm:text-xl">
                  tutores americanos
                </span>{" "}
                (nativos)!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PLATAFORMA DE ESTUDOS */}
      <section id="plataforma-section" className="px-4 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-white shadow-[0_8px_60px_-12px_rgba(0,0,0,0.12)] ring-1 ring-gray-100">
            {/* Soft gradient accent bar at top */}
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />

            <div className="relative grid items-center gap-0 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_400px]">
              {/* Text content */}
              <div className="p-8 sm:p-10 lg:px-14 lg:py-12">

                <h2 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
                  Plataforma de Estudos
                </h2>

                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-gray-500">
                  Uma plataforma completa para o aprendizado de idiomas, com recursos interativos para diferentes níveis.
                </p>

                <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    { icon: MessageCircle, text: "Professor virtual interativo", color: "text-sky-500 bg-sky-50" },
                    { icon: GraduationCap, text: "Pronúncia e gramática", color: "text-violet-500 bg-violet-50" },
                    { icon: Video, text: "Vídeos para todos os níveis", color: "text-amber-500 bg-amber-50" },
                    { icon: BookOpen, text: "Lições interativas completas", color: "text-emerald-500 bg-emerald-50" },
                  ].map(({ icon: Icon, text, color }) => (
                    <li key={text} className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="text-sm font-medium text-gray-700">{text}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-10 flex flex-wrap gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-7 font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:brightness-105"
                  >
                    <a href={settings.platform_url} target="_blank" rel="noopener noreferrer">
                      Acessar plataforma
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full border-gray-200 px-7 font-bold text-gray-600 hover:bg-gray-50"
                    onClick={() => setShowTutorial(true)}
                  >
                    Ver tutorial
                    <Video className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Image side */}
              <div className="hidden md:flex items-end justify-center self-end">
                <div className="relative">
                  {/* Warm glow behind image */}
                  <div className="absolute -bottom-6 left-1/2 h-32 w-64 -translate-x-1/2 rounded-full bg-amber-200/40 blur-3xl" />
                  <img
                    src={plataformaImg}
                    alt="Estudante em aula online"
                    className="relative h-[380px] w-auto object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
                  />
                </div>
              </div>

              {/* Mobile image */}
              <div className="flex justify-center px-8 pb-8 md:hidden">
                <img
                  src={plataformaImg}
                  alt="Estudante em aula online"
                  className="h-[220px] w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHATSAPP GROUP */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-[0_8px_60px_-12px_rgba(0,0,0,0.1)] ring-1 ring-gray-100">
            <div className="flex flex-col items-center gap-8 p-8 sm:p-10 md:flex-row md:gap-12">
              {/* Left: Icon + Text + Button */}
              <div className="flex-1 text-center md:text-left">
                <div className="mb-5 flex justify-center md:justify-start">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                    <img src={whatsappIcon} alt="WhatsApp" className="h-9 w-9" />
                  </div>
                </div>

                <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                  Grupo do WhatsApp
                </h2>

                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-gray-500">
                  Fique por dentro das novidades, receba materiais extras e conecte-se com outros alunos da Fluency Voyage.
                </p>

                <Button
                  asChild
                  size="lg"
                  className="mt-7 rounded-full bg-[#25D366] px-8 font-bold text-white shadow-md shadow-emerald-500/15 transition-all hover:scale-[1.02] hover:bg-[#22c55e]"
                >
                  <a href="https://chat.whatsapp.com/LHKgvGUKxLkCwurxFWDE03?mode=ac_t" target="_blank" rel="noopener noreferrer">
                    Entrar no grupo
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>

              {/* Right: QR Code */}
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                  <QRCodeSVG
                    value="https://chat.whatsapp.com/LHKgvGUKxLkCwurxFWDE03?mode=ac_t"
                    size={150}
                    level="M"
                    fgColor="#1f2937"
                  />
                </div>
                <span className="text-xs font-medium text-gray-400">Escaneie para entrar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="aulas-section" className="px-4 pb-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Aulas complementares</h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-500">
            Participe de forma <span className="font-bold text-gray-700">ilimitada</span>!
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-gray-600">
            Aulas <span className="font-semibold text-sky-700">ao vivo de conversação</span> incríveis com{" "}
            <span className="font-semibold text-sky-700">professores nativos</span> 🇺🇸 — uma oportunidade única
            para praticar inglês de verdade, em tempo real.
          </p>
          <div
            className={`mt-6 inline-flex items-center gap-2 rounded-full bg-sky-50 px-5 py-2.5 text-sm font-semibold text-sky-700 ring-1 ring-sky-200 shadow-sm transition-all duration-500 ${
              hintVisible ? "opacity-100 animate-bounce" : "opacity-0 -translate-y-1 pointer-events-none"
            }`}
          >
            👇 Clique em uma aula abaixo para ver os detalhes e participar
          </div>
        </div>
      </section>

      {/* WEEKLY SCHEDULE VIEW */}
      <div ref={scheduleRef}>
        <WeeklySchedule classes={classes} onSelect={setSelectedClass} />
      </div>

      {/* CLASS DETAIL DIALOG */}
      <Dialog open={!!selectedClass} onOpenChange={(o) => !o && setSelectedClass(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
          {selectedClass && (
            <div className="flex flex-col p-6 sm:p-8">
              {/* Avatars */}
              <div className="mb-4 flex justify-center">
                {(() => {
                  const images = selectedClass.image_url
                    ? selectedClass.image_url.split(",").map((u) => u.trim()).filter(Boolean)
                    : [];
                  if (images.length === 0) {
                    return (
                      <div className="relative">
                        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-sky-100 text-sky-600 font-bold text-2xl border-2 border-white shadow-sm">
                          {selectedClass.title.charAt(0)}
                        </div>
                        {selectedClass.is_american && (
                          <span className="absolute -bottom-1.5 -right-1.5 text-3xl">🇺🇸</span>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div className="relative flex items-center">
                      {images.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Professor ${i + 1}`}
                          className="h-28 w-28 rounded-full object-cover border-2 border-white shadow-sm"
                          style={{ marginLeft: i > 0 ? "-12px" : "0", zIndex: images.length - i }}
                        />
                      ))}
                      {selectedClass.is_american && (
                        <span
                          className="absolute text-3xl"
                          style={{ bottom: "-6px", right: "-8px", zIndex: images.length + 1 }}
                          title="100% Inglês"
                        >
                          🇺🇸
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Badges */}
              <div className="mb-3 flex flex-wrap justify-center gap-1.5">
                {selectedClass.badge && selectedClass.badge.trim() !== "" && (
                  <Badge
                    variant="outline"
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      levelColors[selectedClass.badge] || "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    {selectedClass.badge}
                  </Badge>
                )}
                {selectedClass.level && selectedClass.level.trim() !== "" && (
                  selectedClass.level.split(",").map(l => l.trim()).filter(Boolean).map((lvl) => (
                    <Badge
                      key={lvl}
                      variant="outline"
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        levelColors[lvl] || "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {lvl}
                    </Badge>
                  ))
                )}
              </div>

              <h3 className="text-center text-xl font-bold text-gray-900">{selectedClass.title}</h3>
              <p className="mt-2 text-center text-sm leading-relaxed text-gray-600">
                {renderTextWithAnswers(selectedClass.description)}
              </p>

              <div className="mt-5 rounded-xl bg-sky-50/80 px-5 py-4 ring-1 ring-sky-100">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-100">
                    <Calendar className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{selectedClass.days}</p>
                    <p className="text-lg font-semibold text-sky-700">{selectedClass.display_time}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Users className="h-4 w-4 text-gray-400" />
                {selectedClass.teachers}
              </div>

              <div className="mt-6">
                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-xl bg-sky-600 text-base font-bold shadow-sm hover:bg-sky-700 py-6"
                >
                  <a href={selectedClass.link} target="_blank" rel="noopener noreferrer">
                    Acessar aula
                    <ExternalLink className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>




      {/* Hidden editor */}
      {editorOpen && (
        <AulasComplementaresEditor
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSave={fetchData}
          currentSettings={settings}
        />
      )}

      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
      <ScrollDownHint />
    </div>
  );
};

export default AulasComplementares;
