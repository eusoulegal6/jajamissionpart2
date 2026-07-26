export interface SlideshowSlide {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string;
  audioUrl: string;
  order: number;
  type: 'normal' | 'comparison';
}

export interface Slideshow {
  id: string;
  title: string;
  description?: string;
  mobileMode?: boolean;
  slides: SlideshowSlide[];
  created_at?: string;
  updated_at?: string;
}

export interface SlideshowPageData {
  type: "slideshow";
  title: string;
  slideshowId: string;
}