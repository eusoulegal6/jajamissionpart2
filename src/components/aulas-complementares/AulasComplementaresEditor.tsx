import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bold } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Save, Loader2, Upload, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  currentSettings: PageSettings;
}

const emptyClass: Omit<GroupClass, "id"> = {
  title: "",
  description: "",
  level: "",
  badge: "",
  teachers: "",
  days: "",
  display_time: "",
  start_time: "00:00",
  link: "",
  is_active: true,
  sort_priority: 0,
  image_url: "",
  is_american: false,
};

/* ── Bold Textarea ── */
const BoldTextarea: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const toggleBold = () => {
    const ta = ref.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    if (s === e) return;
    const sel = value.substring(s, e);
    if (sel.startsWith('**') && sel.endsWith('**') && sel.length > 4) {
      const newVal = value.substring(0, s) + sel.slice(2, -2) + value.substring(e);
      onChange(newVal);
    } else {
      const newVal = value.substring(0, s) + `**${sel}**` + value.substring(e);
      onChange(newVal);
      setTimeout(() => { ta.focus(); ta.setSelectionRange(s, s + sel.length + 4); }, 0);
    }
  };
  return (
    <div className="relative">
      <Textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} />
      <Button type="button" size="icon" variant="ghost" className="absolute top-1 right-1 h-6 w-6" onClick={toggleBold} title="Negrito">
        <Bold className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

/* ── Teacher Image Uploader with drag & drop ── */
interface UploaderProps {
  classId: string;
  imageUrl: string;
  uploading: boolean;
  onUploadStart: () => void;
  onUploadEnd: () => void;
  onChange: (newUrl: string) => void;
}

const TeacherImageUploader: React.FC<UploaderProps> = ({
  classId, imageUrl, uploading, onUploadStart, onUploadEnd, onChange,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const images = imageUrl ? imageUrl.split(",").map((u) => u.trim()).filter(Boolean) : [];

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }
    onUploadStart();
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `teachers/${classId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("teachers").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("teachers").getPublicUrl(path);
      const newImages = [...images, pub.publicUrl].join(", ");
      onChange(newImages);
      toast({ title: "Foto enviada!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      onUploadEnd();
    }
  }, [images, classId, onChange, onUploadStart, onUploadEnd]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index).join(", ");
    onChange(updated);
  };

  return (
    <div>
      <Label className="text-xs">Fotos dos professores</Label>

      {/* Preview of existing images */}
      {images.length > 0 && (
        <div className="mt-1 mb-2 flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} alt={`Teacher ${i + 1}`} className="h-12 w-12 rounded-full object-cover border-2 border-border" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed p-3 text-xs transition-colors ${
          dragOver ? "border-primary bg-primary/10 text-primary" : "border-muted-foreground/30 text-muted-foreground hover:border-primary/50"
        }`}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {uploading ? "Enviando..." : "Arraste ou clique para adicionar foto"}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};

const AulasComplementaresEditor: React.FC<Props> = ({ open, onClose, onSave, currentSettings }) => {
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [settings, setSettings] = useState<PageSettings>(currentSettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadAll();
    }
  }, [open]);

  const loadAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("group_classes" as any)
      .select("*")
      .order("start_time", { ascending: true })
      .order("sort_priority", { ascending: true });
    if (data) setClasses(data as any as GroupClass[]);
    setSettings(currentSettings);
    setLoading(false);
  };

  const updateClass = (id: string, field: keyof GroupClass, value: any) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const addClass = () => {
    const tempId = `new-${Date.now()}`;
    setClasses((prev) => [...prev, { ...emptyClass, id: tempId } as GroupClass]);
  };

  const deleteClass = async (id: string) => {
    if (id.startsWith("new-")) {
      setClasses((prev) => prev.filter((c) => c.id !== id));
      return;
    }
    await supabase.from("group_classes" as any).delete().eq("id", id);
    setClasses((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Aula removida" });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // Save settings
      if (settings.id) {
        await supabase
          .from("resource_page_settings" as any)
          .update({
            platform_url: settings.platform_url,
            tutorial_url: settings.tutorial_url,
            page_title: settings.page_title,
            page_subtitle: settings.page_subtitle,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", settings.id);
      }

      // Save classes
      for (const cls of classes) {
        const payload = {
          title: cls.title,
          description: cls.description,
          level: cls.level,
          badge: cls.badge,
          teachers: cls.teachers,
          days: cls.days,
          display_time: cls.display_time,
          start_time: cls.start_time,
          link: cls.link,
          is_active: cls.is_active,
          sort_priority: cls.sort_priority,
          image_url: cls.image_url,
          is_american: cls.is_american,
          updated_at: new Date().toISOString(),
        };

        if (cls.id.startsWith("new-")) {
          await supabase.from("group_classes" as any).insert(payload as any);
        } else {
          await supabase.from("group_classes" as any).update(payload as any).eq("id", cls.id);
        }
      }

      toast({ title: "Alterações salvas com sucesso!" });
      onSave();
    } catch (err) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editor de Aulas Complementares</DialogTitle>
          <DialogDescription>Gerencie as aulas em grupo e configurações da página.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="classes" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="classes">Aulas ({classes.length})</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            {/* CLASSES TAB */}
            <TabsContent value="classes" className="mt-4 space-y-4">
              {classes.map((cls) => (
                <Card key={cls.id} className="border border-border">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <Input
                        value={cls.title}
                        onChange={(e) => updateClass(cls.id, "title", e.target.value)}
                        placeholder="Título da aula"
                        className="font-semibold"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2 shrink-0 text-destructive"
                        onClick={() => deleteClass(cls.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <BoldTextarea
                      value={cls.description}
                      onChange={(val) => updateClass(cls.id, "description", val)}
                      placeholder="Descrição"
                    />

                    <div>
                      <Label className="text-xs">Nível (selecione um ou mais)</Label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {["Iniciante", "Intermediário", "Avançado"].map((lvl) => {
                          const levels = cls.level ? cls.level.split(",").map(l => l.trim()).filter(Boolean) : [];
                          const isSelected = levels.includes(lvl);
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => {
                                const newLevels = isSelected
                                  ? levels.filter(l => l !== lvl)
                                  : [...levels, lvl];
                                updateClass(cls.id, "level", newLevels.join(", "));
                              }}
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                isSelected
                                  ? "border-sky-500 bg-sky-100 text-sky-800"
                                  : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
                              }`}
                            >
                              {lvl}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={cls.badge === "100% Inglês"}
                        onCheckedChange={(v) => updateClass(cls.id, "badge", v ? "100% Inglês" : "")}
                      />
                      <Label className="text-xs">100% Inglês</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Dias</Label>
                        <Input
                          value={cls.days}
                          onChange={(e) => updateClass(cls.id, "days", e.target.value)}
                          placeholder="Ex: Segunda a quinta"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Horário (exibição)</Label>
                        <Input
                          value={cls.display_time}
                          onChange={(e) => updateClass(cls.id, "display_time", e.target.value)}
                          placeholder="Ex: 19h (noite)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Horário (ordenação HH:MM)</Label>
                        <Input
                          value={cls.start_time}
                          onChange={(e) => updateClass(cls.id, "start_time", e.target.value)}
                          placeholder="08:00"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Prioridade de ordem</Label>
                        <Input
                          type="number"
                          value={cls.sort_priority}
                          onChange={(e) =>
                            updateClass(cls.id, "sort_priority", parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Professores</Label>
                      <Input
                        value={cls.teachers}
                        onChange={(e) => updateClass(cls.id, "teachers", e.target.value)}
                        placeholder="Ex: Gabby e Maudi"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Link da aula</Label>
                      <Input
                        value={cls.link}
                        onChange={(e) => updateClass(cls.id, "link", e.target.value)}
                        placeholder="https://meet.google.com/..."
                      />
                    </div>

                    <TeacherImageUploader
                      classId={cls.id}
                      imageUrl={cls.image_url}
                      uploading={uploadingFor === cls.id}
                      onUploadStart={() => setUploadingFor(cls.id)}
                      onUploadEnd={() => setUploadingFor(null)}
                      onChange={(newUrl) => updateClass(cls.id, "image_url", newUrl)}
                    />

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={cls.is_american}
                          onCheckedChange={(v) => updateClass(cls.id, "is_american", v)}
                        />
                        <Label className="text-xs">🇺🇸 Bandeira americana</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={cls.is_active}
                          onCheckedChange={(v) => updateClass(cls.id, "is_active", v)}
                        />
                        <Label className="text-xs">{cls.is_active ? "Ativa" : "Inativa"}</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" className="w-full gap-2" onClick={addClass}>
                <Plus className="h-4 w-4" />
                Adicionar aula
              </Button>
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="mt-4 space-y-4">
              <div>
                <Label>Título da página</Label>
                <Input
                  value={settings.page_title}
                  onChange={(e) => setSettings((s) => ({ ...s, page_title: e.target.value }))}
                />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Textarea
                  value={settings.page_subtitle}
                  onChange={(e) => setSettings((s) => ({ ...s, page_subtitle: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label>URL da plataforma</Label>
                <Input
                  value={settings.platform_url}
                  onChange={(e) => setSettings((s) => ({ ...s, platform_url: e.target.value }))}
                />
              </div>
              <div>
                <Label>URL do tutorial</Label>
                <Input
                  value={settings.tutorial_url}
                  onChange={(e) => setSettings((s) => ({ ...s, tutorial_url: e.target.value }))}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={saveAll} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar tudo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AulasComplementaresEditor;
