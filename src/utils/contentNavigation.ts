export const validateContentPath = (path: string): boolean => {
  if (!path || !path.startsWith('/content/')) {
    return false;
  }
  
  // Basic pattern validation for content paths
  const pathParts = path.split('/').filter(Boolean);
  
  // Should be ["content"] or ["content", "categoryId"] or ["content", "categoryId", "chapterId"]
  if (pathParts.length === 1 && pathParts[0] === 'content') {
    return true; // Root content path
  }
  
  if (pathParts.length >= 2 && pathParts[0] === 'content') {
    return true; // Category or chapter path
  }
  
  return false;
};

export const buildContentReturnPath = (categoryId?: string, chapterId?: string): string => {
  if (chapterId && categoryId) {
    return `/content/${categoryId}/${chapterId}`;
  }
  
  if (categoryId) {
    return `/content/${categoryId}`;
  }
  
  return '/content';
};

export const parseContentPath = (path: string) => {
  if (!path || !path.startsWith('/content/')) {
    return { isContentPath: false };
  }
  
  const pathParts = path.split('/').filter(Boolean);
  
  if (pathParts.length === 1) {
    return { isContentPath: true, isRoot: true };
  }
  
  if (pathParts.length === 2) {
    return { 
      isContentPath: true, 
      isCategory: true, 
      categoryId: pathParts[1] 
    };
  }
  
  if (pathParts.length === 3) {
    return { 
      isContentPath: true, 
      isChapter: true, 
      categoryId: pathParts[1], 
      chapterId: pathParts[2] 
    };
  }
  
  return { isContentPath: false };
};