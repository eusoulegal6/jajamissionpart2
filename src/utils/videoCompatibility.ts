export const sanitizeVideoUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const cleanedPath = parsed.pathname
      .replace(/\/+/g, '/')
      .split('/')
      .map(segment => encodeURIComponent(decodeURIComponent(segment)))
      .join('/');
    parsed.pathname = cleanedPath;
    return parsed.toString();
  } catch {
    return url;
  }
};

export const isIOSLikeDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

export const hasIPhoneUnsupportedVideoExtension = (url: string) => {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return /\.(webm|ogv|ogg)(?:$|[?#])/.test(pathname);
  } catch {
    return /\.(webm|ogv|ogg)(?:$|[?#])/.test(url.toLowerCase());
  }
};

export const isYouTubeUrl = (url: string) => /youtube\.com|youtu\.be/i.test(url);

export const getYouTubeEmbedUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0` : url;
    }
    if (parsed.pathname.includes('/embed/')) {
      parsed.searchParams.set('playsinline', '1');
      return parsed.toString();
    }
    const videoId = parsed.searchParams.get('v');
    return videoId ? `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0` : url;
  } catch {
    return url;
  }
};

export const isVimeoUrl = (url: string) => /vimeo\.com/i.test(url);

export const getVimeoEmbedUrl = (url: string) => {
  const match = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i);
  return match?.[1]
    ? `https://player.vimeo.com/video/${match[1]}?title=0&byline=0&portrait=0&dnt=1&responsive=1`
    : url;
};

export const isIPhoneCompatibleUpload = (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return ['mp4', 'm4v', 'mov'].includes(extension || '') || ['video/mp4', 'video/x-m4v', 'video/quicktime'].includes(file.type);
};

export const getVideoUploadContentType = (file: File) => {
  if (file.type) return file.type;
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'mov') return 'video/quicktime';
  if (extension === 'm4v') return 'video/x-m4v';
  return 'video/mp4';
};