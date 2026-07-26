
export const generateShareableUrl = (
  lessonId: string,
  difficulty: string,
  currentPageIndex: number = 0
): string => {
  const baseUrl = window.location.origin;
  const page1Based = (currentPageIndex ?? 0) + 1;
  return `${baseUrl}/lesson/${encodeURIComponent(lessonId)}?difficulty=${encodeURIComponent(difficulty)}&page=${page1Based}`;
};

export const parseSharedLessonParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    lessonId: urlParams.get('lesson'),
    difficulty: urlParams.get('difficulty'),
    pageIndex: urlParams.get('page') ? parseInt(urlParams.get('page')!) : 0
  };
};
