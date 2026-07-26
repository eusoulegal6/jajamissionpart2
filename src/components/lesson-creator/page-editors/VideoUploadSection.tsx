import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Video, Loader2, X, Film } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { getVideoUploadContentType, isIPhoneCompatibleUpload } from '@/utils/videoCompatibility';

interface VideoUploadSectionProps {
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
}

const VideoUploadSection: React.FC<VideoUploadSectionProps> = ({ videoUrl, onVideoUrlChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const uploadVideoToSupabase = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const fileName = `article-videos/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          contentType: getVideoUploadContentType(file),
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      setUploadProgress(100);
      onVideoUrlChange(urlData.publicUrl);
      toast({ title: "Vídeo enviado com sucesso!" });
    } catch (error) {
      console.error('Video upload error:', error);
      toast({
        title: "Erro ao enviar vídeo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast({ title: "Arquivo inválido", description: "Selecione um arquivo de vídeo.", variant: "destructive" });
      return;
    }
    if (!isIPhoneCompatibleUpload(file)) {
      toast({
        title: "Formato não compatível com iPhone",
        description: "Envie em MP4/H.264 para garantir reprodução no iPhone.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O vídeo deve ter no máximo 500MB.", variant: "destructive" });
      return;
    }
    uploadVideoToSupabase(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const removeVideo = () => {
    onVideoUrlChange('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="h-5 w-5" />
          Vídeo do Artigo (opcional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Adicione um vídeo ao invés da imagem. Quando um vídeo está presente, o áudio é desabilitado automaticamente.
          <br />
          <span className="text-xs">
            Aceita upload direto, YouTube, ou <strong>Bunny Stream</strong> (cole a URL do iframe embed:{" "}
            <code>https://iframe.mediadelivery.net/embed/&lt;libraryId&gt;/&lt;videoGuid&gt;</code>).
          </span>
        </p>

        <div>
          <Label htmlFor="videoUrl">URL do Vídeo</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="videoUrl"
              value={videoUrl || ''}
              onChange={(e) => onVideoUrlChange(e.target.value)}
              placeholder="https://iframe.mediadelivery.net/embed/... ou faça upload abaixo"
            />
            {videoUrl && (
              <Button variant="outline" size="icon" onClick={removeVideo} title="Remover vídeo">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Drag & Drop / Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Enviando vídeo... {uploadProgress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">
                Arraste um vídeo aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MP4, M4V, MOV • Máximo 500MB
              </p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
            accept="video/mp4,video/x-m4v,video/quicktime,.mp4,.m4v,.mov"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = '';
          }}
          className="hidden"
        />

        {/* Video Preview */}
        {videoUrl && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <Label className="text-sm font-medium mb-2 block">Preview do Vídeo</Label>
            {(() => {
              const isBunny =
                /iframe\.mediadelivery\.net|mediadelivery\.net\/(embed|play)\/|video\.bunnycdn\.com\/(play|embed)\//i.test(
                  videoUrl
                );
              if (isBunny) {
                const embed = videoUrl
                  .replace(/\/play\//, '/embed/')
                  .replace(/^https?:\/\/video\.bunnycdn\.com/i, 'https://iframe.mediadelivery.net');
                return (
                  <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe
                      src={embed}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                      allowFullScreen
                    />
                  </div>
                );
              }
              return (
                <video
                  src={videoUrl}
                  className="w-full max-h-48 rounded-lg"
                  controls
                  preload="metadata"
                  playsInline
                  webkit-playsinline="true"
                  x5-playsinline="true"
                />
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoUploadSection;
