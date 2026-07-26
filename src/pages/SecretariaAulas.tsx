import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Copy,
  Check,
  ExternalLink,
  CalendarDays,
  Clock,
  Filter,
  Trash2,
  MessageCircle,
  Youtube,
  Sparkles,
  ArrowLeft,
  BellRing,
  Users,
  UserPlus,
  GraduationCap,
} from "lucide-react";

interface GroupClass {
  id: string;
  title: string;
  level: string;
  badge: string;
  days: string;
  display_time: string;
  start_time: string;
  link: string;
  is_active: boolean;
  is_american: boolean;
}
interface Scheduled {
  id: string;
  classId: string;
  classTitle: string;
  classDays: string;
  classTime: string;
  classLink: string;
  classStartTime?: string; // HH:MM (24h) of the class start
  scheduledFor?: number;   // exact ms timestamp of the upcoming occurrence (frozen at creation)
  studentNumber: string;
  createdAt: number;
}

const TUTORIAL_URL = "https://youtu.be/qtFRsvi9mRs?si=SV0E0cLYFNC93DmW";
const TRIAL_TUTORIAL_URL = "https://youtu.be/qtFRsvi9mRs?si=1WliE9wn7-l3B14-";
const PLATFORM_URL = "https://tutorvirtualnewhorizons.com.br/aulas-complementares";
const STORAGE_KEY = "secretaria_aulas_scheduled_v1";
const PRIVATE_STORAGE_KEY = "secretaria_aulas_particular_v1";
const TRIAL_STORAGE_KEY = "secretaria_aulas_trial_v1";

interface PrivateScheduled {
  id: string;
  studentNumber: string;
  teacherName: string;
  isAmerican: boolean;
  isMale: boolean;
  createdAt: number;
}

interface TrialScheduled {
  id: string;
  studentNumber: string;
  createdAt: number;
}

const buildTrialInvitationText = (): string => {
  return `🎉 *PERÍODO DE EXPERIMENTAÇÃO — Aulas em grupo + Plataforma*

Seja muito bem-vindo! 💙

Você está convidado a participar gratuitamente de *todas as nossas aulas complementares em grupo* e a utilizar *toda a nossa plataforma de estudos* durante o seu período experimental. ✨

*As aulas acontecem todos os dias*, em vários horários:
🌅 Manhã
☀️ Tarde
🌙 Noite

✅ *Não é necessário agendamento* — basta entrar no horário que preferir!

👉 Acesse aqui para ver todos os horários e entrar nas aulas:
${PLATFORM_URL}

❓ *Ficou com alguma dúvida?* Assista a esse tutorial rapidinho que explica tudo:
${TRIAL_TUTORIAL_URL}

Te esperamos! 🎓💙
— Fluency Voyage`;
};

const buildPrivateInvitationText = (p: { teacherName: string; isAmerican: boolean; isMale: boolean }): string => {
  // Default feminine; switch to masculine when isMale is true
  const article = p.isMale ? "o" : "a";
  const noun = p.isMale ? "professor" : "professora";
  const nationality = p.isAmerican ? (p.isMale ? " americano" : " americana") : "";
  const pronoun = p.isMale ? "ele" : "ela";
  const welcome = p.isMale ? "bem-vindo" : "bem-vinda"; // student is the reader — keeping neutral default feminine-less; switch by teacher gender per spec
  // (Per request, the masculine switch transforms everything in masculine — including the student greeting word.)
  const teacherLabel = `${article} ${noun}${nationality} *${p.teacherName}*`;
  const teacherLabelCap = teacherLabel.charAt(0).toUpperCase() + teacherLabel.slice(1);

  return `🎓 *AULA PARTICULAR*

Tudo certo para iniciarmos a sua *aula particular*! 🙌

👨‍🏫 ${teacherLabelCap} entrará em contato com você em breve, diretamente pelo WhatsApp, para combinar o melhor dia e horário da sua *aula particular experimental*.

⏳ Aguarde só um pouquinho que ${pronoun} já vai te chamar para marcar a sua *aula particular*.

━━━━━━━━━━━━━━━━━━━━
✨ *ENQUANTO ISSO — Aulas Complementares (em grupo)*

Enquanto a sua *aula particular* não começa, você já está convidado a participar das nossas *aulas complementares em grupo*, que acontecem *todos os dias*, em vários horários e níveis!

👉 Acesse e entre em qualquer aula, sem agendamento:
${PLATFORM_URL}

⚠️ *MUITO IMPORTANTE:* as *aulas complementares* são um *COMPLEMENTO GRATUITO* — elas *NÃO substituem* a sua *aula particular*. A sua *aula particular* continua sendo o foco principal, e ${teacherLabel} vai te procurar normalmente para combiná-la. As aulas complementares servem apenas para você praticar ainda mais enquanto aguarda. 💙

Seja muito ${welcome}(a)! 🎉`;
};



const WEEKDAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const levelColors: Record<string, string> = {
  Iniciante: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Intermediário: "bg-sky-100 text-sky-800 border-sky-200",
  Avançado: "bg-violet-100 text-violet-800 border-violet-200",
  "100% Inglês": "bg-amber-100 text-amber-800 border-amber-200",
};

const normalizeDay = (d: string): string => {
  const x = d.trim().toLowerCase().replace("-feira", "");
  const map: Record<string, string> = {
    segunda: "Segunda",
    terça: "Terça",
    terca: "Terça",
    quarta: "Quarta",
    quinta: "Quinta",
    sexta: "Sexta",
    sábado: "Sábado",
    sabado: "Sábado",
    domingo: "Domingo",
  };
  return map[x] || d.trim();
};

const splitDays = (days: string): string[] =>
  days.split(/[,/&]| e /i).map(normalizeDay).filter(Boolean);

const splitLevels = (level: string): string[] =>
  level.split(",").map((l) => l.trim()).filter(Boolean);

const timeBucket = (start: string): "manhã" | "tarde" | "noite" | "outro" => {
  const [h] = start.split(":").map(Number);
  if (isNaN(h) || h === 0) return "outro";
  if (h < 12) return "manhã";
  if (h < 18) return "tarde";
  return "noite";
};

const parseHour = (start: string): number => {
  const [h, m] = start.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const PT_DAY_INDEX: Record<string, number> = {
  Segunda: 1,
  Terça: 2,
  Quarta: 3,
  Quinta: 4,
  Sexta: 5,
  Sábado: 6,
  Domingo: 0,
};

const parseStartHHMM = (start: string, fallback: string): { h: number; m: number } => {
  if (start && /^\d{1,2}:\d{2}/.test(start)) {
    const [h, m] = start.split(":").map(Number);
    return { h: h || 0, m: m || 0 };
  }
  const mm = (fallback || "").match(/(\d{1,2})[h:](\d{0,2})/);
  if (mm) return { h: parseInt(mm[1] || "0", 10), m: parseInt(mm[2] || "0", 10) };
  return { h: 0, m: 0 };
};

const computeNextOccurrence = (daysStr: string, startHHMM: string, displayTime: string, fromTs: number = Date.now(), preferredDow?: number | null): number => {
  const { h, m } = parseStartHHMM(startHHMM, displayTime);
  let days = splitDays(daysStr).map((d) => PT_DAY_INDEX[d]).filter((d) => d !== undefined) as number[];
  if (preferredDow !== undefined && preferredDow !== null && days.includes(preferredDow)) {
    days = [preferredDow];
  }
  if (days.length === 0) return fromTs;
  const now = new Date(fromTs);
  let best = Infinity;
  for (const targetDow of days) {
    for (let add = 0; add < 8; add++) {
      const dt = new Date(now);
      dt.setDate(now.getDate() + add);
      if (dt.getDay() === targetDow) {
        dt.setHours(h, m, 0, 0);
        // skip if already past the active window (>1h ago)
        if (dt.getTime() < now.getTime() - 60 * 60 * 1000) continue;
        if (dt.getTime() < best) best = dt.getTime();
        break;
      }
    }
  }
  return best === Infinity ? fromTs : best;
};

const ACTIVE_BEFORE_MS = 5 * 60 * 1000;
const ACTIVE_AFTER_MS = 60 * 60 * 1000;

type SchedStatus = "active" | "upcoming" | "past";
const statusOf = (scheduledFor: number, now: number): SchedStatus => {
  if (now >= scheduledFor - ACTIVE_BEFORE_MS && now <= scheduledFor + ACTIVE_AFTER_MS) return "active";
  if (now < scheduledFor - ACTIVE_BEFORE_MS) return "upcoming";
  return "past";
};

const formatDateTimePT = (ts: number): string => {
  const d = new Date(ts);
  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  return `${days[d.getDay()]}, ${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};

const formatLongDatePT = (ts: number): string => {
  const d = new Date(ts);
  const days = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const dayName = days[d.getDay()];
  const cap = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  return `${cap}, ${d.getDate()} de ${months[d.getMonth()]}`;
};

const formatRelative = (ts: number, now: number): string => {
  const diff = ts - now;
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  if (mins < 1) return diff >= 0 ? "agora" : "agora mesmo";
  if (mins < 60) return diff >= 0 ? `em ${mins} min` : `há ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return diff >= 0 ? `em ${hours}h` : `há ${hours}h`;
  const days = Math.round(hours / 24);
  return diff >= 0 ? `em ${days}d` : `há ${days}d`;
};

const SecretariaAulas: React.FC = () => {
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("aulas");

  // Filters
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [dayFilter, setDayFilter] = useState<string>("all");
  const [bucketFilter, setBucketFilter] = useState<string>("all");
  const [americanOnly, setAmericanOnly] = useState(false);
  const [view, setView] = useState<"list" | "grid">("list");

  // Scheduling
  const [selectedClass, setSelectedClass] = useState<GroupClass | null>(null);
  const [previewClass, setPreviewClass] = useState<GroupClass | null>(null);
  const [previewPreferredDow, setPreviewPreferredDow] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [studentNumber, setStudentNumber] = useState("");

  const [scheduled, setScheduled] = useState<Scheduled[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  // Master mode: aula em grupo vs aula particular
  const [mode, setMode] = useState<"grupo" | "particular">("grupo");

  // Private classes
  const [privateScheduled, setPrivateScheduled] = useState<PrivateScheduled[]>([]);
  const [privateTab, setPrivateTab] = useState<"novo" | "agendados">("novo");
  const [pStudentNumber, setPStudentNumber] = useState("");
  const [pTeacherName, setPTeacherName] = useState("");
  const [pIsAmerican, setPIsAmerican] = useState(false);
  const [pIsMale, setPIsMale] = useState(false);

  // Trial invitations (generic — all group classes)
  const [trialScheduled, setTrialScheduled] = useState<TrialScheduled[]>([]);
  const [trialDialogOpen, setTrialDialogOpen] = useState(false);
  const [trialStudentNumber, setTrialStudentNumber] = useState("");

  // Post-schedule popup with the message to copy
  const [postPopup, setPostPopup] = useState<null | { title: string; message: string; number: string; kind: "grupo" | "particular" | "trial" }>(null);

  // Tick every 20s so active window + countdown stay fresh
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 20_000);
    return () => clearInterval(id);
  }, []);

  // Load all schedule kinds from Supabase (shared across all secretárias)
  const reloadAllSchedules = useCallback(async () => {
    const { data, error } = await supabase
      .from("secretaria_schedules" as any)
      .select("id, kind, data, created_at")
      .order("created_at", { ascending: false });
    if (error || !data) return;
    const grupo: Scheduled[] = [];
    const part: PrivateScheduled[] = [];
    const trial: TrialScheduled[] = [];
    for (const row of data as any[]) {
      const merged = { ...(row.data || {}), id: row.id, createdAt: row.data?.createdAt ?? new Date(row.created_at).getTime() };
      if (row.kind === "grupo") {
        const s = merged as Scheduled;
        if (!s.scheduledFor) {
          s.scheduledFor = computeNextOccurrence(s.classDays, s.classStartTime || "", s.classTime, s.createdAt);
        }
        grupo.push(s);
      } else if (row.kind === "particular") {
        part.push(merged as PrivateScheduled);
      } else if (row.kind === "trial") {
        trial.push(merged as TrialScheduled);
      }
    }
    setScheduled(grupo);
    setPrivateScheduled(part);
    setTrialScheduled(trial);
  }, []);

  // One-time migration: upload any old localStorage entries to Supabase
  const migrateLocalStorage = useCallback(async () => {
    const MIGRATION_FLAG = "secretaria_aulas_migrated_to_supabase_v1";
    if (localStorage.getItem(MIGRATION_FLAG)) return;
    try {
      const sources: Array<{ key: string; kind: "grupo" | "particular" | "trial" }> = [
        { key: STORAGE_KEY, kind: "grupo" },
        { key: PRIVATE_STORAGE_KEY, kind: "particular" },
        { key: TRIAL_STORAGE_KEY, kind: "trial" },
      ];
      const rows: Array<{ kind: string; data: any }> = [];
      for (const { key, kind } of sources) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            for (const item of arr) {
              if (item && typeof item === "object") {
                const { id: _omit, ...data } = item as any;
                rows.push({ kind, data });
              }
            }
          }
        } catch {}
      }
      if (rows.length > 0) {
        const { error } = await supabase.from("secretaria_schedules" as any).insert(rows);
        if (error) {
          console.error("[secretaria] migration failed:", error);
          return; // don't set flag — will retry next load
        }
        toast({ title: "Agendamentos antigos migrados", description: `${rows.length} item(ns) enviado(s) para a nuvem.` });
      }
      localStorage.setItem(MIGRATION_FLAG, "1");
    } catch (e) {
      console.error("[secretaria] migration error:", e);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await migrateLocalStorage();
      await reloadAllSchedules();
    })();
    // Realtime: refresh when anyone adds/removes anywhere
    const channel = supabase
      .channel("secretaria_schedules_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "secretaria_schedules" }, () => {
        reloadAllSchedules();
      })
      .subscribe();
    // Fallback poll every 30s in case realtime disconnects
    const poll = setInterval(reloadAllSchedules, 30_000);
    const onFocus = () => reloadAllSchedules();
    window.addEventListener("focus", onFocus);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
      window.removeEventListener("focus", onFocus);
    };
  }, [reloadAllSchedules, migrateLocalStorage]);

  const insertSchedule = async (kind: "grupo" | "particular" | "trial", data: any): Promise<string | null> => {
    const { data: row, error } = await supabase
      .from("secretaria_schedules" as any)
      .insert({ kind, data })
      .select("id")
      .single();
    if (error || !row) {
      toast({ title: "Erro ao salvar", description: error?.message || "Tente novamente.", variant: "destructive" });
      return null;
    }
    return (row as any).id as string;
  };

  const deleteSchedule = async (id: string) => {
    const { error } = await supabase.from("secretaria_schedules" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  };

  const removeTrial = async (id: string) => {
    if (!window.confirm("Excluir este convite de experimentação?")) return;
    if (await deleteSchedule(id)) {
      setTrialScheduled((prev) => prev.filter((t) => t.id !== id));
    }
  };
  const addTrial = async (): Promise<TrialScheduled | null> => {
    const num = trialStudentNumber.trim();
    if (!num) {
      toast({ title: "Informe o número do aluno", variant: "destructive" });
      return null;
    }
    const payload = { studentNumber: num, createdAt: Date.now() };
    const id = await insertSchedule("trial", payload);
    if (!id) return null;
    const entry: TrialScheduled = { id, ...payload };
    setTrialScheduled((prev) => [entry, ...prev]);
    toast({ title: "Convite de experimentação registrado!", description: "Salvo em Agendados." });
    return entry;
  };
  const removePrivate = async (id: string) => {
    if (!window.confirm("Excluir este agendamento de aula particular?")) return;
    if (await deleteSchedule(id)) {
      setPrivateScheduled((prev) => prev.filter((p) => p.id !== id));
    }
  };
  const addPrivate = async (): Promise<PrivateScheduled | null> => {
    const num = pStudentNumber.trim();
    const teacher = pTeacherName.trim();
    if (!num || !teacher) {
      toast({ title: "Preencha número e professor", variant: "destructive" });
      return null;
    }
    const payload = {
      studentNumber: num,
      teacherName: teacher,
      isAmerican: pIsAmerican,
      isMale: pIsMale,
      createdAt: Date.now(),
    };
    const id = await insertSchedule("particular", payload);
    if (!id) return null;
    const entry: PrivateScheduled = { id, ...payload };
    setPrivateScheduled((prev) => [entry, ...prev]);
    toast({ title: "Aluno particular registrado!", description: "Salvo em Agendados." });
    return entry;
  };
  const resetPrivateForm = () => {
    setPStudentNumber(""); setPTeacherName(""); setPIsAmerican(false); setPIsMale(false);
  };

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("group_classes" as any)
      .select("*")
      .eq("is_active", true)
      .order("start_time", { ascending: true });
    if (data) setClasses(data as any as GroupClass[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const filtered = useMemo(() => {
    return classes.filter((c) => {
      if (americanOnly && !c.is_american) return false;
      if (levelFilter !== "all") {
        const lvls = [...splitLevels(c.level), c.badge].filter(Boolean);
        if (!lvls.includes(levelFilter)) return false;
      }
      if (dayFilter !== "all" && !splitDays(c.days).includes(dayFilter)) return false;
      if (bucketFilter !== "all" && timeBucket(c.start_time) !== bucketFilter) return false;
      return true;
    });
  }, [classes, levelFilter, dayFilter, bucketFilter, americanOnly]);

  const byDay = useMemo(() => {
    const m: Record<string, GroupClass[]> = {};
    WEEKDAYS.forEach((d) => (m[d] = []));
    filtered.forEach((c) => {
      splitDays(c.days).forEach((d) => {
        if (m[d]) m[d].push(c);
      });
    });
    Object.keys(m).forEach((k) =>
      m[k].sort((a, b) => parseHour(a.start_time) - parseHour(b.start_time))
    );
    return m;
  }, [filtered]);

  const buildInvitationText = (c: GroupClass): string => {
    const lvlText = [c.badge, c.level].filter(Boolean).join(" • ");
    const linkBlock = c.link?.trim() ? `\n🔗 Link da aula:\n${c.link.trim()}\n` : "";
    return `🎉 A sua aula está marcada!

📚 *${c.title}*
${lvlText ? `🎯 ${lvlText}\n` : ""}${c.days}
🕒 ${c.display_time}
${linkBlock}
✨ Você também está convidado a participar de *todas as outras aulas complementares* e a conhecer nossa plataforma de estudos!

👉 Acesse aqui:
${PLATFORM_URL}

Te esperamos! 💙
— Fluency Voyage`;
  };

  const buildReminderText = (s: Scheduled): string => {
    const linkBlock = s.classLink?.trim() ? `\n🔗 Entre por aqui:\n${s.classLink.trim()}\n` : "";
    const dateLine = s.scheduledFor ? `${formatLongDatePT(s.scheduledFor)} — 🕒 ${s.classTime}` : `${s.classDays} — 🕒 ${s.classTime}`;
    return `🔔 Lembrete da sua aula!

📚 *${s.classTitle}*
${dateLine}
${linkBlock}
Te esperamos! 💙
— Fluency Voyage`;
  };

  const buildInvitationFromScheduled = (s: Scheduled): string => {
    const linkBlock = s.classLink?.trim() ? `\n🔗 Link da aula:\n${s.classLink.trim()}\n` : "";
    let dateLine: string;
    if (s.scheduledFor) {
      dateLine = `🗓️ ${formatLongDatePT(s.scheduledFor)}\n🕒 ${s.classTime}`;
    } else {
      dateLine = `${s.classDays}\n🕒 ${s.classTime}`;
    }
    return `🎉 A sua aula está marcada!

📚 *${s.classTitle}*
${dateLine}
${linkBlock}
✨ Você também está convidado a participar de *todas as outras aulas complementares* e a conhecer nossa plataforma de estudos!

👉 Acesse aqui:
${PLATFORM_URL}

Te esperamos! 💙
— Fluency Voyage`;
  };




  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast({ title: "Copiado!", description: "Texto copiado para a área de transferência." });
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const onlyDigits = (s: string) => s.replace(/\D/g, "");

  const waLink = (number: string, text: string) => {
    const num = onlyDigits(number);
    return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  };

  const confirmSchedule = async (): Promise<Scheduled | null> => {
    if (!selectedClass) return null;
    const n = studentNumber.trim();
    if (!n) {
      toast({ title: "Informe o número do aluno", variant: "destructive" });
      return null;
    }
    if (!selectedDate) {
      toast({ title: "Escolha uma data no calendário", variant: "destructive" });
      return null;
    }
    const { h, m } = parseStartHHMM(selectedClass.start_time, selectedClass.display_time);
    const dt = new Date(selectedDate);
    dt.setHours(h, m, 0, 0);
    const payload = {
      classId: selectedClass.id,
      classTitle: selectedClass.title,
      classDays: selectedClass.days,
      classTime: selectedClass.display_time,
      classLink: selectedClass.link,
      classStartTime: selectedClass.start_time,
      scheduledFor: dt.getTime(),
      studentNumber: n,
      createdAt: Date.now(),
    };
    const id = await insertSchedule("grupo", payload);
    if (!id) return null;
    const entry: Scheduled = { id, ...payload };
    setScheduled((prev) => [entry, ...prev]);
    toast({ title: "Agendado!", description: "O agendamento foi salvo." });
    return entry;
  };

  const removeScheduled = async (id: string) => {
    if (await deleteSchedule(id)) {
      setScheduled((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const closeDialog = () => {
    setSelectedClass(null);
    setStudentNumber("");
    setSelectedDate(undefined);
  };

  // Classify scheduled into active / upcoming / past based on `now`
  const { activeList, upcomingList, pastList } = useMemo(() => {
    const active: Scheduled[] = [];
    const upcoming: Scheduled[] = [];
    const past: Scheduled[] = [];
    for (const s of scheduled) {
      const sf = s.scheduledFor ?? s.createdAt;
      const st = statusOf(sf, now);
      if (st === "active") active.push(s);
      else if (st === "upcoming") upcoming.push(s);
      else past.push(s);
    }
    active.sort((a, b) => (a.scheduledFor ?? 0) - (b.scheduledFor ?? 0));
    upcoming.sort((a, b) => (a.scheduledFor ?? 0) - (b.scheduledFor ?? 0));
    past.sort((a, b) => (b.scheduledFor ?? 0) - (a.scheduledFor ?? 0));
    return { activeList: active, upcomingList: upcoming, pastList: past };
  }, [scheduled, now]);

  // Browser notification when an item enters the active window
  useEffect(() => {
    if (activeList.length === 0) return;
    try {
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    } catch {}
  }, [activeList.length]);

  const notifiedRef = React.useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    for (const s of activeList) {
      if (notifiedRef.current.has(s.id)) continue;
      notifiedRef.current.add(s.id);
      try {
        new Notification("Aula começando!", {
          body: `${s.classTitle} — aluno ${s.studentNumber}`,
          tag: `sec-${s.id}`,
        });
      } catch {}
    }
  }, [activeList]);


  const renderClassCard = (c: GroupClass, compact = false, preferredDow: number | null = null) => {
    const openPreview = () => {
      setPreviewPreferredDow(preferredDow);
      setPreviewClass(c);
    };
    if (compact) {
      return (
        <button
          key={c.id}
          onClick={openPreview}
          title={c.title}
          className="group w-full rounded-lg border bg-white px-2 py-1.5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-sky-400 hover:bg-sky-50 flex flex-col items-center gap-0.5 text-center"
        >
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-sky-600 shrink-0" />
            <span className="font-bold text-gray-900 text-sm tabular-nums">
              {c.display_time}
            </span>
            {c.is_american && <span className="text-xs" title="100% Inglês">🇺🇸</span>}
          </div>
          <span className="text-[11px] leading-tight text-gray-600 line-clamp-2 w-full">
            {c.title}
          </span>
        </button>
      );
    }
    return (
      <button
        key={c.id}
        onClick={openPreview}
        className="group relative w-full text-left rounded-xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-sky-300 shadow-sm"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-[15px] leading-snug">
            {c.title} {c.is_american && <span title="100% Inglês">🇺🇸</span>}
          </h3>
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 text-sky-800 px-3 py-1.5 text-base font-bold">
            <Clock className="h-5 w-5" />
            {c.display_time}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 text-gray-700 px-3 py-1.5 text-sm font-semibold">
            <CalendarDays className="h-4 w-4" />
            {c.days}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.badge && (
            <Badge variant="outline" className={`rounded-full px-2 py-0.5 text-[11px] ${levelColors[c.badge] || "bg-gray-100"}`}>
              {c.badge}
            </Badge>
          )}
          {splitLevels(c.level).map((l) => (
            <Badge key={l} variant="outline" className={`rounded-full px-2 py-0.5 text-[11px] ${levelColors[l] || "bg-gray-100"}`}>
              {l}
            </Badge>
          ))}
        </div>
      </button>
    );
  };

  const renderScheduledCard = (s: Scheduled, status: SchedStatus) => {
    const reminder = buildReminderText(s);
    const invitation = buildInvitationFromScheduled(s);

    const sf = s.scheduledFor ?? s.createdAt;
    const statusStyles =
      status === "active"
        ? "border-emerald-300 bg-emerald-50/40"
        : status === "past"
        ? "border-gray-200 bg-gray-50 opacity-90"
        : "";
    const statusBadge =
      status === "active" ? (
        <Badge className="bg-emerald-600 text-white text-[11px]">🔔 Agora</Badge>
      ) : status === "past" ? (
        <Badge variant="outline" className="text-[11px] bg-gray-100 text-gray-600">Passado</Badge>
      ) : (
        <Badge variant="outline" className="text-[11px] bg-sky-50 text-sky-700 border-sky-200">{formatRelative(sf, now)}</Badge>
      );
    return (
      <Card key={s.id} className={statusStyles}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900">{s.classTitle}</h3>
                {statusBadge}
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <span className="inline-flex items-center gap-2 font-bold text-gray-900 text-2xl sm:text-3xl leading-tight">
                  {s.studentNumber}
                </span>
                <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-emerald-600" /> {formatDateTimePT(sf)}
                </span>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-500">
                  <CalendarDays className="h-4 w-4" /> {s.classDays} • {s.classTime}
                </span>
                <span className="text-xs text-gray-400">
                  agendado {new Date(s.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>

              {s.classLink && (
                <a
                  href={s.classLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-sky-600 hover:underline break-all"
                >
                  <ExternalLink className="h-3 w-3" /> {s.classLink}
                </a>
              )}
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copy(s.classLink || "", `link-${s.id}`)}
                disabled={!s.classLink}
              >
                {copiedKey === `link-${s.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copy(invitation, `inv-${s.id}`)}
              >
                {copiedKey === `inv-${s.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Convite
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copy(reminder, `rem-${s.id}`)}
              >
                {copiedKey === `rem-${s.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Lembrete
              </Button>
              <Button
                size="sm"
                className="bg-[#25D366] hover:bg-[#22c55e] text-white"
                asChild
              >
                <a href={waLink(s.studentNumber, status === "active" ? reminder : invitation)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (window.confirm("Excluir este agendamento?")) removeScheduled(s.id);
                }}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Helmet>
        <title>Secretaria - Agendar Aulas</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-sky-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Secretaria — Agendamentos</h1>
              <p className="text-xs text-gray-500">Selecione uma aula e gere o convite do aluno</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <a href="/aulas-complementares" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" /> Página de aulas
            </a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* MASTER SECTION SWITCHER */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode("grupo")}
            className={`rounded-2xl border-2 p-5 text-left transition-all ${
              mode === "grupo"
                ? "border-sky-500 bg-sky-50 shadow-md"
                : "border-gray-200 bg-white hover:border-sky-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2.5 ${mode === "grupo" ? "bg-sky-500 text-white" : "bg-sky-100 text-sky-700"}`}>
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-gray-900">Aula em grupo</div>
                <div className="text-xs text-gray-500">Aulas complementares — agendar convite por horário</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => setMode("particular")}
            className={`rounded-2xl border-2 p-5 text-left transition-all ${
              mode === "particular"
                ? "border-violet-500 bg-violet-50 shadow-md"
                : "border-gray-200 bg-white hover:border-violet-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2.5 ${mode === "particular" ? "bg-violet-500 text-white" : "bg-violet-100 text-violet-700"}`}>
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-gray-900">Aula particular</div>
                <div className="text-xs text-gray-500">Cadastrar aluno + professor — gera mensagem de boas-vindas</div>
              </div>
            </div>
          </button>
        </div>

        {mode === "grupo" && <>
        {/* Trial invitation CTA */}
        <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="shrink-0 rounded-full bg-amber-500 text-white p-2.5">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-extrabold text-amber-900">Convite de experimentação</h2>
              <p className="text-sm text-amber-900/80 mt-0.5">
                Envie um convite genérico para o aluno experimentar <strong>todas as aulas em grupo</strong> e a plataforma — sem aula específica.
              </p>
            </div>
          </div>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
            onClick={() => { setTrialStudentNumber(""); setTrialDialogOpen(true); }}
          >
            <Sparkles className="h-4 w-4" /> Agendar convite de experimentação
          </Button>
        </div>

        {activeList.length > 0 && (
          <div className="mb-6 rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-5 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-emerald-400/5" />

            <div className="relative flex items-start gap-4">
              <div className="shrink-0 rounded-full bg-emerald-500 text-white p-3 shadow-md">
                <BellRing className="h-6 w-6 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-900">
                    🔔 Aula{activeList.length > 1 ? "s" : ""} acontecendo agora!
                  </h2>
                  <Badge className="bg-emerald-600 text-white text-[11px]">{activeList.length} ativa{activeList.length > 1 ? "s" : ""}</Badge>
                </div>
                <p className="text-sm text-emerald-800/80 mt-0.5">
                  Lembre o aluno — janela ativa de 5 min antes até 1h depois do início.
                </p>

                <div className="mt-4 flex flex-col gap-3">
                  {activeList.map((s) => {
                    const sf = s.scheduledFor ?? s.createdAt;
                    const reminder = buildReminderText(s);
                    return (
                      <div
                        key={s.id}
                        className="rounded-xl bg-white border border-emerald-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-lg">{s.classTitle}</h3>
                            <Badge variant="outline" className="text-[11px] border-emerald-300 text-emerald-800 bg-emerald-50">
                              📱 {s.studentNumber}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-900">
                              <Clock className="h-4 w-4" /> {formatDateTimePT(sf)}
                            </span>
                            <span className="text-xs text-emerald-700 font-medium">
                              ({formatRelative(sf, now)})
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          {s.classLink && (
                            <Button size="sm" variant="outline" onClick={() => copy(s.classLink, `alert-link-${s.id}`)}>
                              {copiedKey === `alert-link-${s.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              Link
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="bg-[#25D366] hover:bg-[#22c55e] text-white"
                            asChild
                          >
                            <a href={waLink(s.studentNumber, reminder)} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="h-3.5 w-3.5 mr-1" /> Lembrar no WhatsApp
                            </a>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="aulas">Aulas</TabsTrigger>
            <TabsTrigger value="agendados">
              Agendados {(activeList.length + upcomingList.length + trialScheduled.length) > 0 && <span className="ml-1.5 rounded-full bg-sky-100 text-sky-700 px-1.5 text-[11px]">{activeList.length + upcomingList.length + trialScheduled.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="passados">
              Passados {pastList.length > 0 && <span className="ml-1.5 rounded-full bg-gray-200 text-gray-700 px-1.5 text-[11px]">{pastList.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="tutorial">Tutorial</TabsTrigger>
          </TabsList>

          {/* AULAS TAB */}
          <TabsContent value="aulas">
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
                  <Filter className="h-4 w-4" /> Filtros
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Label className="text-xs">Nível</Label>
                    <select
                      value={levelFilter}
                      onChange={(e) => setLevelFilter(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 h-9 text-sm"
                    >
                      <option value="all">Todos os níveis</option>
                      <option value="Iniciante">Iniciante</option>
                      <option value="Intermediário">Intermediário</option>
                      <option value="Avançado">Avançado</option>
                      <option value="100% Inglês">100% Inglês</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Dia</Label>
                    <select
                      value={dayFilter}
                      onChange={(e) => setDayFilter(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 h-9 text-sm"
                    >
                      <option value="all">Todos os dias</option>
                      {WEEKDAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Período</Label>
                    <select
                      value={bucketFilter}
                      onChange={(e) => setBucketFilter(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 h-9 text-sm"
                    >
                      <option value="all">Manhã / Tarde / Noite</option>
                      <option value="manhã">🌅 Manhã (até 12h)</option>
                      <option value="tarde">☀️ Tarde (12h–18h)</option>
                      <option value="noite">🌙 Noite (18h+)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={americanOnly}
                      onChange={(e) => setAmericanOnly(e.target.checked)}
                      className="rounded"
                    />
                    🇺🇸 Apenas com tutor americano
                  </label>
                  {(levelFilter !== "all" || dayFilter !== "all" || bucketFilter !== "all" || americanOnly) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setLevelFilter("all");
                        setDayFilter("all");
                        setBucketFilter("all");
                        setAmericanOnly(false);
                      }}
                    >
                      Limpar filtros
                    </Button>
                  )}
                  <span className="ml-auto text-xs text-gray-500">
                    {filtered.length} aula{filtered.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed py-12 text-center text-gray-400">
                Nenhuma aula encontrada com esses filtros.
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {WEEKDAYS.filter((d) => byDay[d].length > 0).map((d) => (
                  <div key={d} className="rounded-xl bg-white border p-3 min-w-0">
                    <div className="mb-2 pb-2 border-b">
                      <h3 className="font-bold text-gray-900 text-sm">{d}</h3>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {byDay[d].map((c) => renderClassCard(c, true, PT_DAY_INDEX[d] ?? null))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* AGENDADOS TAB */}
          <TabsContent value="agendados">
            {(() => {
              const list = [...activeList, ...upcomingList];
              const hasAny = list.length > 0 || trialScheduled.length > 0;
              if (!hasAny) {
                return (
                  <div className="rounded-xl border border-dashed py-16 text-center text-gray-400">
                    Nenhum agendamento ativo ou futuro. Selecione uma aula na aba "Aulas" ou envie um convite de experimentação.
                  </div>
                );
              }
              return (
                <div className="flex flex-col gap-6">
                  {trialScheduled.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-bold text-amber-900 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" /> Convites de experimentação ({trialScheduled.length})
                      </h3>
                      <div className="flex flex-col gap-3">
                        {trialScheduled.map((t) => {
                          const msg = buildTrialInvitationText();
                          return (
                            <Card key={t.id} className="border-amber-200 bg-amber-50/30">
                              <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className="font-bold text-gray-900 text-lg">📱 {t.studentNumber}</h3>
                                      <Badge className="bg-amber-500 text-white text-[11px]">Experimentação — todas as aulas</Badge>
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">
                                      cadastrado {new Date(t.createdAt).toLocaleString("pt-BR")}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2 shrink-0">
                                    <Button size="sm" variant="outline" onClick={() => copy(msg, `trial-${t.id}`)}>
                                      {copiedKey === `trial-${t.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                      Mensagem
                                    </Button>
                                    <Button size="sm" className="bg-[#25D366] hover:bg-[#22c55e] text-white" asChild>
                                      <a href={waLink(t.studentNumber, msg)} target="_blank" rel="noopener noreferrer">
                                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                                      </a>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => removeTrial(t.id)}
                                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {list.length > 0 && (
                    <div>
                      {trialScheduled.length > 0 && (
                        <h3 className="mb-2 text-sm font-bold text-sky-900 flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-sky-500" /> Aulas agendadas ({list.length})
                        </h3>
                      )}
                      <div className="flex flex-col gap-3">
                        {list.map((s) => renderScheduledCard(s, statusOf(s.scheduledFor ?? s.createdAt, now)))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </TabsContent>


          {/* PASSADOS TAB */}
          <TabsContent value="passados">
            {pastList.length === 0 ? (
              <div className="rounded-xl border border-dashed py-16 text-center text-gray-400">
                Nenhum agendamento passado ainda.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pastList.map((s) => renderScheduledCard(s, "past"))}
              </div>
            )}
          </TabsContent>


          {/* TUTORIAL TAB */}
          <TabsContent value="tutorial">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Youtube className="h-6 w-6 text-red-500" />
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Vídeo Tutorial</h2>
                    <p className="text-sm text-gray-500">
                      Link rápido para enviar aos alunos junto com o convite.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border bg-gray-50 p-3 flex items-center gap-2 mb-4">
                  <code className="text-xs flex-1 break-all text-gray-700">{TUTORIAL_URL}</code>
                  <Button
                    size="sm"
                    onClick={() => copy(TUTORIAL_URL, "tutorial")}
                  >
                    {copiedKey === "tutorial" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    Copiar link
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={TUTORIAL_URL} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>

                <div className="aspect-video rounded-lg overflow-hidden border bg-black">
                  <iframe
                    src="https://www.youtube.com/embed/qtFRsvi9mRs"
                    title="Tutorial"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </>}

        {mode === "particular" && (
          <div>
            {/* Big disclaimer / context banner */}
            <div className="mb-6 rounded-2xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 via-white to-violet-50 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-full bg-violet-500 text-white p-2.5">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-violet-900">Aula particular</h2>
                  <p className="text-sm text-violet-800/80 mt-1">
                    Cadastre o aluno e o professor responsável. Geramos a mensagem dizendo que o(a) professor(a) entrará em contato em breve para combinar a aula particular experimental, e também convidando para as aulas complementares (como complemento, nunca substituição).
                  </p>
                </div>
              </div>
            </div>

            <Tabs value={privateTab} onValueChange={(v) => setPrivateTab(v as any)}>
              <TabsList className="mb-4">
                <TabsTrigger value="novo">
                  <UserPlus className="h-4 w-4 mr-1" /> Cadastrar aluno
                </TabsTrigger>
                <TabsTrigger value="agendados">
                  Agendados {privateScheduled.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-violet-100 text-violet-700 px-1.5 text-[11px]">{privateScheduled.length}</span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="novo">
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="pStudentNumber">Número do aluno (WhatsApp)</Label>
                        <Input id="pStudentNumber" value={pStudentNumber} onChange={(e) => setPStudentNumber(e.target.value)} placeholder="Ex: 5511999999999" className="mt-1" />
                        <p className="mt-1 text-xs text-gray-500">Inclua o código do país (55 para Brasil).</p>
                      </div>
                      <div>
                        <Label htmlFor="pTeacherName">Nome do(a) professor(a)</Label>
                        <Input id="pTeacherName" value={pTeacherName} onChange={(e) => setPTeacherName(e.target.value)} placeholder="Ex: Mariana" className="mt-1" />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-3">
                        <div>
                          <Label htmlFor="pIsAmerican" className="cursor-pointer">🇺🇸 É americano(a)?</Label>
                          <p className="text-xs text-gray-500">Se sim, a mensagem dirá "professora americana" (ou "americano" se masculino).</p>
                        </div>
                        <Switch id="pIsAmerican" checked={pIsAmerican} onCheckedChange={setPIsAmerican} />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-3">
                        <div>
                          <Label htmlFor="pIsMale" className="cursor-pointer">👨 Professor homem?</Label>
                          <p className="text-xs text-gray-500">Por padrão a mensagem é feminina (professora). Ative para masculino.</p>
                        </div>
                        <Switch id="pIsMale" checked={pIsMale} onCheckedChange={setPIsMale} />
                      </div>
                    </div>

                    <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3 text-xs text-violet-900">
                      💡 Após salvar o agendamento, a mensagem de boas-vindas ficará disponível para copiar e enviar pelo WhatsApp na aba <strong>Agendados</strong>.
                    </div>

                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button
                        onClick={async () => {
                          const created = await addPrivate();
                          if (created) {
                            const msg = buildPrivateInvitationText(created);
                            resetPrivateForm();
                            setPrivateTab("agendados");
                            setPostPopup({ title: "Aula particular registrada! ✅", message: msg, number: created.studentNumber, kind: "particular" });
                          }
                        }}
                      >
                        <Check className="h-4 w-4" /> Salvar agendamento
                      </Button>

                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="agendados">
                {privateScheduled.length === 0 ? (
                  <div className="rounded-xl border border-dashed py-16 text-center text-gray-400">
                    Nenhuma aula particular cadastrada ainda.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {privateScheduled.map((p) => {
                      // Backfill isMale for legacy entries
                      const pp = { ...p, isMale: (p as any).isMale ?? false };
                      const text = buildPrivateInvitationText(pp);
                      return (
                        <Card key={pp.id} className="border-violet-200">
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-gray-900 text-lg">📱 {pp.studentNumber}</h3>
                                  <Badge className="bg-violet-600 text-white text-[11px]">Aula particular</Badge>
                                  {pp.isAmerican && <Badge variant="outline" className="text-[11px]">🇺🇸 {pp.isMale ? "Americano" : "Americana"}</Badge>}
                                </div>
                                <div className="mt-2 text-sm text-gray-700">
                                  <span className="font-semibold">{pp.isMale ? "Professor:" : "Professora:"}</span> {pp.teacherName}
                                </div>
                                <div className="mt-1 text-xs text-gray-400">
                                  cadastrado {new Date(p.createdAt).toLocaleString("pt-BR")}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 shrink-0">
                                <Button size="sm" variant="outline" onClick={() => copy(text, `priv-${p.id}`)}>
                                  {copiedKey === `priv-${p.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                  Mensagem
                                </Button>
                                <Button size="sm" className="bg-[#25D366] hover:bg-[#22c55e] text-white" asChild>
                                  <a href={waLink(p.studentNumber, text)} target="_blank" rel="noopener noreferrer">
                                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                                  </a>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removePrivate(p.id)}
                                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>


      {/* CLASS PREVIEW DIALOG — shows details before moving to scheduling */}
      <Dialog open={!!previewClass} onOpenChange={(o) => { if (!o) setPreviewClass(null); }}>
        <DialogContent className="max-w-md">
          {previewClass && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  {previewClass.title}
                  {previewClass.is_american && <span>🇺🇸</span>}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2 rounded-lg bg-sky-50 border border-sky-200 px-3 py-2.5">
                    <Clock className="h-5 w-5 text-sky-700" />
                    <span className="font-bold text-sky-900 text-lg">{previewClass.display_time}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-gray-50 border px-3 py-2.5">
                    <CalendarDays className="h-5 w-5 text-gray-700" />
                    <span className="font-semibold text-gray-800">{previewClass.days}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {previewClass.badge && (
                    <Badge variant="outline" className={`rounded-full px-2.5 py-1 text-xs ${levelColors[previewClass.badge] || "bg-gray-100"}`}>
                      {previewClass.badge}
                    </Badge>
                  )}
                  {splitLevels(previewClass.level).map((l) => (
                    <Badge key={l} variant="outline" className={`rounded-full px-2.5 py-1 text-xs ${levelColors[l] || "bg-gray-100"}`}>
                      {l}
                    </Badge>
                  ))}
                </div>
                {previewClass.link && (
                  <a
                    href={previewClass.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline break-all"
                  >
                    <ExternalLink className="h-3 w-3" /> {previewClass.link}
                  </a>
                )}
                <div className="flex flex-wrap gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={() => setPreviewClass(null)}>
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </Button>
                  <Button
                    onClick={() => {
                      const c = previewClass;
                      setPreviewClass(null);
                      setSelectedClass(c);
                      setStudentNumber("");
                      const next = computeNextOccurrence(c.days, c.start_time, c.display_time, Date.now(), previewPreferredDow);
                      const nd = new Date(next);
                      nd.setHours(0, 0, 0, 0);
                      setSelectedDate(nd);
                    }}
                  >
                    <CalendarDays className="h-4 w-4" /> Agendar esta aula
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* SCHEDULING DIALOG */}
      <Dialog open={!!selectedClass} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedClass && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedClass.title}
                  {selectedClass.is_american && <span>🇺🇸</span>}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
                    <CalendarDays className="h-3.5 w-3.5" /> {selectedClass.days}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
                    <Clock className="h-3.5 w-3.5" /> {selectedClass.display_time}
                  </span>
                  {selectedClass.badge && (
                    <Badge variant="outline" className={levelColors[selectedClass.badge] || ""}>
                      {selectedClass.badge}
                    </Badge>
                  )}
                  {splitLevels(selectedClass.level).map((l) => (
                    <Badge key={l} variant="outline" className={levelColors[l] || ""}>
                      {l}
                    </Badge>
                  ))}
                </div>

                <div>
                  <Label htmlFor="studentNumber">Número do aluno (WhatsApp)</Label>
                  <Input
                    id="studentNumber"
                    autoFocus
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    placeholder="Ex: 5511999999999"
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Inclua o código do país (55 para Brasil) para o botão do WhatsApp funcionar.
                  </p>
                </div>

                <div>
                  <Label className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" /> Escolha a data da aula
                  </Label>
                  <p className="mt-1 text-xs text-gray-500">
                    Só estão habilitados os dias em que esta aula acontece ({selectedClass.days}). Hoje aparece destacado. Você pode escolher uma data nesta semana, na próxima ou em semanas seguintes — use as setas do calendário para avançar.
                  </p>
                  <div className="mt-2 rounded-lg border bg-white inline-block">
                    {(() => {
                      const allowedDows = splitDays(selectedClass.days)
                        .map((d) => PT_DAY_INDEX[d])
                        .filter((d) => d !== undefined) as number[];
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return (
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(d) => d && setSelectedDate(d)}
                          disabled={(date) => {
                            const dd = new Date(date);
                            dd.setHours(0, 0, 0, 0);
                            if (dd.getTime() < today.getTime()) return true;
                            return !allowedDows.includes(date.getDay());
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      );
                    })()}
                  </div>
                  {selectedDate && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 text-sm font-semibold">
                      <Check className="h-4 w-4" />
                      {formatLongDatePT(selectedDate.getTime())} às {selectedClass.display_time}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3 text-xs text-sky-900">
                  💡 Após confirmar o agendamento, a mensagem de convite ficará disponível para copiar e enviar pelo WhatsApp na aba <strong>Agendados</strong>.
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <Button variant="outline" onClick={closeDialog}>
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </Button>

                  <Button onClick={async () => {
                    const created = await confirmSchedule();
                    if (created) {
                      const msg = buildInvitationFromScheduled(created);
                      closeDialog();
                      setTab("agendados");
                      setPostPopup({ title: "Aula agendada! ✅", message: msg, number: created.studentNumber, kind: "grupo" });
                    }
                  }}>
                    <Check className="h-4 w-4" /> Confirmar agendamento
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* TRIAL INVITATION DIALOG */}
      <Dialog open={trialDialogOpen} onOpenChange={(o) => { if (!o) { setTrialDialogOpen(false); setTrialStudentNumber(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" /> Convite de experimentação
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900">
              Será gerado um convite genérico para o aluno participar de <strong>todas as aulas em grupo</strong> e da plataforma durante o período experimental. Sem aula nem horário específicos.
            </div>
            <div>
              <Label htmlFor="trialStudentNumber">Número do aluno (WhatsApp)</Label>
              <Input
                id="trialStudentNumber"
                autoFocus
                value={trialStudentNumber}
                onChange={(e) => setTrialStudentNumber(e.target.value)}
                placeholder="Ex: 5511999999999"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-gray-500">
                Inclua o código do país (55 para Brasil) para o botão do WhatsApp funcionar.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="outline" onClick={() => { setTrialDialogOpen(false); setTrialStudentNumber(""); }}>
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-white"
                onClick={async () => {
                  const created = await addTrial();
                  if (created) {
                    const msg = buildTrialInvitationText();
                    setTrialDialogOpen(false);
                    setTrialStudentNumber("");
                    setTab("agendados");
                    setPostPopup({ title: "Convite de experimentação salvo! ✅", message: msg, number: created.studentNumber, kind: "trial" });
                  }
                }}
              >
                <Check className="h-4 w-4" /> Confirmar e gerar mensagem
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Post-schedule popup: shows the message immediately after agendamento */}
      <Dialog open={!!postPopup} onOpenChange={(o) => { if (!o) setPostPopup(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{postPopup?.title}</DialogTitle>
          </DialogHeader>
          {postPopup && (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-900">
                ✅ Agendamento salvo! Agora copie a mensagem abaixo e envie pelo WhatsApp para finalizar o processo.
              </div>
              <Textarea
                readOnly
                value={postPopup.message}
                className="min-h-[260px] font-mono text-sm whitespace-pre-wrap"
                onFocus={(e) => e.currentTarget.select()}
              />
              <div className="flex flex-wrap gap-2 justify-end">
                <Button variant="outline" onClick={() => setPostPopup(null)}>
                  Fechar
                </Button>
                <Button
                  onClick={() => copy(postPopup.message, `popup-${Date.now()}`)}
                >
                  <Copy className="h-4 w-4" /> Copiar mensagem
                </Button>
                <Button
                  asChild
                  className="bg-[#25D366] hover:bg-[#1ebe5b] text-white"
                >
                  <a
                    href={waLink(postPopup.number, postPopup.message)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" /> Abrir no WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecretariaAulas;
