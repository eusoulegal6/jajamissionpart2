import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, ArrowUp, ArrowDown, Save, Eye } from 'lucide-react';
import { SlideshowSlide, Slideshow } from '@/types/slideshow';
import { useSlideshows } from '@/hooks/useSlideshows';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SlideshowCreator: React.FC = () => {
  const navigate = useNavigate();
  const { createSlideshow } = useSlideshows();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slides, setSlides] = useState<SlideshowSlide[]>([]);
  const [saving, setSaving] = useState(false);

  const addSlide = () => {
    const newSlide: SlideshowSlide = {
      id: Date.now().toString(),
      imageUrl: '',
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
      toast.error('Please enter a title for the slideshow');
      return;
    }

    if (slides.length === 0) {
      toast.error('Please add at least one slide');
      return;
    }

    const invalidSlides = slides.filter(slide => !slide.imageUrl.trim());
    if (invalidSlides.length > 0) {
      toast.error('All slides must have an image URL');
      return;
    }

    setSaving(true);
    try {
      const slideshowData: Omit<Slideshow, 'id' | 'created_at' | 'updated_at'> = {
        title: title.trim(),
        description: description.trim() || undefined,
        slides: slides.map((slide, index) => ({
          ...slide,
          order: index
        }))
      };

      const result = await createSlideshow(slideshowData);
      if (result) {
        toast.success('Slideshow saved successfully!');
        navigate('/');
      }
    } catch (error) {
      console.error('Error saving slideshow:', error);
      toast.error('Failed to save slideshow');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create Slideshow</h1>
        <p className="text-muted-foreground">
          Create a slideshow with images and audio that can be used in lessons.
        </p>
      </div>

      {/* Basic Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter slideshow title"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter slideshow description (optional)"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Slides */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Slides ({slides.length})</CardTitle>
          <Button onClick={addSlide} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Slide
          </Button>
        </CardHeader>
        <CardContent>
          {slides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No slides added yet. Click "Add Slide" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {slides.map((slide, index) => (
                <div key={slide.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Slide {index + 1}</h3>
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
                      <Label htmlFor={`type-${slide.id}`}>Slide Type</Label>
                      <Select 
                        value={slide.type} 
                        onValueChange={(value: 'normal' | 'comparison') => updateSlide(slide.id, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal Slide</SelectItem>
                          <SelectItem value="comparison">Comparison Slide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`image-${slide.id}`}>Image URL *</Label>
                        <Input
                          id={`image-${slide.id}`}
                          value={slide.imageUrl}
                          onChange={(e) => updateSlide(slide.id, 'imageUrl', e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                        {slide.imageUrl && (
                          <div className="mt-2">
                            <img
                              src={slide.imageUrl}
                              alt={`Slide ${index + 1} preview`}
                              className="w-full h-32 object-cover rounded border"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`audio-${slide.id}`}>
                          Audio URL {slide.type === 'comparison' && '(for comparison)'}
                        </Label>
                        <Input
                          id={`audio-${slide.id}`}
                          value={slide.audioUrl}
                          onChange={(e) => updateSlide(slide.id, 'audioUrl', e.target.value)}
                          placeholder="https://example.com/audio.mp3"
                        />
                        {slide.audioUrl && (
                          <div className="mt-2">
                            <audio controls className="w-full">
                              <source src={slide.audioUrl} type="audio/mpeg" />
                              Your browser does not support the audio element.
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
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/')}>
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim() || slides.length === 0}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Slideshow'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SlideshowCreator;