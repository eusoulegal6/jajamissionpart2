import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SlideshowPageData } from '@/types/slideshow';
import { useSlideshows } from '@/hooks/useSlideshows';

interface SlideshowPageEditorProps {
  data: SlideshowPageData;
  onChange: (updates: Partial<SlideshowPageData>) => void;
}

const SlideshowPageEditor: React.FC<SlideshowPageEditorProps> = ({ data, onChange }) => {
  const { slideshows, loading } = useSlideshows();

  const handleTitleChange = (title: string) => {
    onChange({ title });
  };

  const handleSlideshowChange = (slideshowId: string) => {
    onChange({ slideshowId });
  };

  const selectedSlideshow = slideshows.find(s => s.id === data.slideshowId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Slideshow Page Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              value={data.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter page title"
            />
          </div>

          <div>
            <Label htmlFor="slideshow">Select Slideshow</Label>
            <Select value={data.slideshowId} onValueChange={handleSlideshowChange}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading slideshows..." : "Select a slideshow"} />
              </SelectTrigger>
              <SelectContent>
                {slideshows.map((slideshow) => (
                  <SelectItem key={slideshow.id} value={slideshow.id}>
                    {slideshow.title} ({slideshow.slides?.length || 0} slides)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSlideshow && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Selected Slideshow Preview</h4>
              <p className="text-sm text-gray-600 mb-2">
                <strong>{selectedSlideshow.title}</strong>
              </p>
              {selectedSlideshow.description && (
                <p className="text-sm text-gray-600 mb-2">{selectedSlideshow.description}</p>
              )}
              <p className="text-sm text-gray-600">
                {selectedSlideshow.slides?.length || 0} slides
              </p>
              
              {selectedSlideshow.slides && selectedSlideshow.slides.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">First slide preview:</p>
                  <img
                    src={selectedSlideshow.slides[0].imageUrl}
                    alt="First slide"
                    className="w-32 h-20 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {!loading && slideshows.length === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                No slideshows available. You need to create a slideshow first using the slideshow creator.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SlideshowPageEditor;