import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, ArrowUp, ArrowDown, Save, Edit, Trash2, Eye, Smartphone, Wand2, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { SlideshowSlide, Slideshow } from '@/types/slideshow';
import { useSlideshows } from '@/hooks/useSlideshows';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SlideshowManager: React.FC = () => {
  const { slideshows, loading, createSlideshow, updateSlideshow, deleteSlideshow } = useSlideshows();
  const [editingSlideshow, setEditingSlideshow] = useState<Slideshow | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openEditor = (slideshow?: Slideshow) => {
    if (slideshow) {
      setEditingSlideshow(slideshow);
    } else {
      setEditingSlideshow({
        id: '',
        title: '',
        description: '',
        slides: [],
        created_at: '',
        updated_at: ''
      });
    }
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingSlideshow(null);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteSlideshow(id);
    if (success) {
      setDeleteConfirmId(null);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Carregando slideshows...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gerenciar Slideshows</CardTitle>
          <Button onClick={() => openEditor()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Slideshow
          </Button>
        </CardHeader>
        <CardContent>
          {slideshows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum slideshow criado ainda. Clique em "Novo Slideshow" para começar.
            </div>
          ) : (
            <div className="space-y-4">
              {slideshows.map((slideshow) => (
                <div key={slideshow.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{slideshow.title}</h3>
                    {slideshow.description && (
                      <p className="text-sm text-muted-foreground mt-1">{slideshow.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      {slideshow.slides.length} slide{slideshow.slides.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditor(slideshow)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteConfirmId(slideshow.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor Dialog */}
      {editingSlideshow && (
        <SlideshowEditorDialog
          slideshow={editingSlideshow}
          isOpen={isEditorOpen}
          onClose={closeEditor}
          onCreate={createSlideshow}
          onUpdate={updateSlideshow}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o slideshow.
              Note que as lições que usam este slideshow continuarão referenciando-o.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

interface SlideshowEditorDialogProps {
  slideshow: Slideshow;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (slideshow: Omit<Slideshow, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onUpdate: (id: string, updates: Partial<Slideshow>) => Promise<boolean>;
}

const SlideshowEditorDialog: React.FC<SlideshowEditorDialogProps> = ({
  slideshow,
  isOpen,
  onClose,
  onCreate,
  onUpdate,
}) => {
  const [title, setTitle] = useState(slideshow.title);
  const [description, setDescription] = useState(slideshow.description || '');
  const [slides, setSlides] = useState<SlideshowSlide[]>(slideshow.slides);
  const [mobileMode, setMobileMode] = useState(slideshow.mobileMode || false);
  const [saving, setSaving] = useState(false);
  const [generatingMobile, setGeneratingMobile] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);

  const slidesNeedingMobileImages = slides.filter(s => s.imageUrl && !s.mobileImageUrl);

  const generateMobileImagesForSlides = async () => {
    if (slidesNeedingMobileImages.length === 0) {
      toast.info('Todos os slides já têm imagens mobile');
      return;
    }

    setGeneratingMobile(true);
    setGenerationProgress({ current: 0, total: slidesNeedingMobileImages.length });

    for (let i = 0; i < slidesNeedingMobileImages.length; i++) {
      const slide = slidesNeedingMobileImages[i];
      setGenerationProgress({ current: i + 1, total: slidesNeedingMobileImages.length });

      try {
        const response = await fetch(
          'https://arxgiyxqxrupidoqkoee.supabase.co/functions/v1/ai_image_generate',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: 'Create a vertical/portrait version of this image, keeping the same content, information, text and style, but adapted for reading on mobile phones in a 9:16 aspect ratio. Maintain all visual elements and text legibility.',
              appId: 'slideshow-mobile-generator',
              imageUrls: [slide.imageUrl]
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API error for slide ${i + 1}:`, response.status, errorText);
          toast.error(`Erro no slide ${i + 1}: Erro do servidor (${response.status})`);
          continue; // Skip to next slide instead of stopping
        }

        const data = await response.json();

        if (data.imageUrl) {
          setSlides(prevSlides => 
            prevSlides.map(s => 
              s.id === slide.id ? { ...s, mobileImageUrl: data.imageUrl } : s
            )
          );
          toast.success(`Slide ${i + 1} gerado com sucesso`);
        } else {
          toast.error(`Erro no slide ${i + 1}: ${data.error || 'Sem imagem gerada'}`);
        }
      } catch (error) {
        console.error('Error generating mobile image:', error);
        toast.error(`Erro ao gerar imagem mobile para slide ${i + 1}`);
        // Continue to next slide instead of stopping
      }
    }

    setGeneratingMobile(false);
    setGenerationProgress(null);
    toast.success('Geração de imagens mobile concluída!');
  };

  const isEditing = !!slideshow.id;

  const addSlide = () => {
    const newSlide: SlideshowSlide = {
      id: Date.now().toString(),
      imageUrl: '',
      mobileImageUrl: '',
      audioUrl: '',
      order: slides.length,
      type: 'normal'
    };
    setSlides([...slides, newSlide]);
  };

  const removeSlide = (id: string) => {
    setSlides(slides.filter(slide => slide.id !== id));
  };

  const updateSlide = (id: string, field: keyof SlideshowSlide, value: string) => {
    setSlides(slides.map(slide =>
      slide.id === id ? { ...slide, [field]: value } : slide
    ));
  };

  const moveSlide = (id: string, direction: 'up' | 'down') => {
    const currentIndex = slides.findIndex(slide => slide.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;

    const newSlides = [...slides];
    [newSlides[currentIndex], newSlides[newIndex]] = [newSlides[newIndex], newSlides[currentIndex]];

    // Update order values
    newSlides.forEach((slide, index) => {
      slide.order = index;
    });

    setSlides(newSlides);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Por favor, insira um título para o slideshow');
      return;
    }

    if (slides.length === 0) {
      toast.error('Por favor, adicione pelo menos um slide');
      return;
    }

    const invalidSlides = slides.filter(slide => !slide.imageUrl.trim());
    if (invalidSlides.length > 0) {
      toast.error('Todos os slides devem ter uma URL de imagem');
      return;
    }

    if (mobileMode) {
      const missingMobileImages = slides.filter(slide => !slide.mobileImageUrl?.trim());
      if (missingMobileImages.length > 0) {
        toast.error('Todos os slides devem ter uma imagem mobile quando o modo mobile está ativado');
        return;
      }
    }

    setSaving(true);
    try {
      const slideshowData = {
        title: title.trim(),
        description: description.trim() || undefined,
        mobileMode,
        slides: slides.map((slide, index) => ({
          ...slide,
          order: index
        }))
      };

      if (isEditing) {
        const success = await onUpdate(slideshow.id, slideshowData);
        if (success) {
          onClose();
        }
      } else {
        const result = await onCreate(slideshowData);
        if (result) {
          onClose();
        }
      }
    } catch (error) {
      console.error('Error saving slideshow:', error);
      toast.error('Falha ao salvar slideshow');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Slideshow' : 'Criar Novo Slideshow'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'As alterações serão aplicadas a todas as lições que usam este slideshow.'
              : 'Crie um slideshow com imagens e áudio que pode ser usado em lições.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite o título do slideshow"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Digite a descrição do slideshow (opcional)"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="mobileMode" className="cursor-pointer">Modo Mobile</Label>
                  <p className="text-sm text-muted-foreground">Usar imagens verticais separadas para dispositivos móveis</p>
                </div>
              </div>
              <Switch
                id="mobileMode"
                checked={mobileMode}
                onCheckedChange={setMobileMode}
              />
            </div>

            {mobileMode && (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Wand2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Gerar Imagens Mobile com IA</p>
                    <p className="text-sm text-muted-foreground">
                      {slidesNeedingMobileImages.length === 0 
                        ? 'Todos os slides já têm imagens mobile'
                        : `${slidesNeedingMobileImages.length} slide(s) sem imagem mobile`
                      }
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateMobileImagesForSlides}
                  disabled={generatingMobile || slidesNeedingMobileImages.length === 0}
                  className="flex items-center gap-2"
                >
                  {generatingMobile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {generationProgress?.current}/{generationProgress?.total}
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Gerar
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Slides */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Slides ({slides.length})</h3>
              <Button onClick={addSlide} size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Slide
              </Button>
            </div>

            {slides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                Nenhum slide adicionado ainda. Clique em "Adicionar Slide" para começar.
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {slides.map((slide, index) => (
                  <div key={slide.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Slide {index + 1}</h4>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveSlide(slide.id, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveSlide(slide.id, 'down')}
                          disabled={index === slides.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeSlide(slide.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`type-${slide.id}`}>Tipo de Slide</Label>
                        <Select
                          value={slide.type}
                          onValueChange={(value: 'normal' | 'comparison') => updateSlide(slide.id, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Slide Normal</SelectItem>
                            <SelectItem value="comparison">Slide de Comparação</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`image-${slide.id}`}>URL da Imagem Desktop *</Label>
                            <Input
                              id={`image-${slide.id}`}
                              value={slide.imageUrl}
                              onChange={(e) => updateSlide(slide.id, 'imageUrl', e.target.value)}
                              placeholder="https://exemplo.com/imagem.jpg"
                            />
                            {slide.imageUrl && (
                              <div className="mt-2">
                                <img
                                  src={slide.imageUrl}
                                  alt={`Preview desktop do slide ${index + 1}`}
                                  className="w-full h-32 object-cover rounded border"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder.svg';
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          {mobileMode && (
                            <div>
                              <Label htmlFor={`mobile-image-${slide.id}`}>URL da Imagem Mobile (Vertical) *</Label>
                              <Input
                                id={`mobile-image-${slide.id}`}
                                value={slide.mobileImageUrl || ''}
                                onChange={(e) => updateSlide(slide.id, 'mobileImageUrl', e.target.value)}
                                placeholder="https://exemplo.com/imagem-mobile.jpg"
                              />
                              {slide.mobileImageUrl && (
                                <div className="mt-2">
                                  <img
                                    src={slide.mobileImageUrl}
                                    alt={`Preview mobile do slide ${index + 1}`}
                                    className="w-full h-32 object-cover rounded border"
                                    onError={(e) => {
                                      e.currentTarget.src = '/placeholder.svg';
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <Label htmlFor={`audio-${slide.id}`}>
                            URL do Áudio {slide.type === 'comparison' && '(para comparação)'}
                          </Label>
                          <Input
                            id={`audio-${slide.id}`}
                            value={slide.audioUrl}
                            onChange={(e) => updateSlide(slide.id, 'audioUrl', e.target.value)}
                            placeholder="https://exemplo.com/audio.mp3"
                          />
                          {slide.audioUrl && (
                            <div className="mt-2">
                              <audio controls className="w-full">
                                <source src={slide.audioUrl} type="audio/mpeg" />
                                Seu navegador não suporta o elemento de áudio.
                              </audio>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !title.trim() || slides.length === 0}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Slideshow'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SlideshowManager;
