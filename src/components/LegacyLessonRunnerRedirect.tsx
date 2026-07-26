import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const LegacyLessonRunnerRedirect: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    // Support both legacy and new query param names
    const lessonFromQuery = searchParams.get("lesson") || searchParams.get("lessonId") || undefined;
    const difficultyFromQuery = searchParams.get("difficulty") || undefined;
    const pageFromQuery = searchParams.get("page");

    const state: any = location.state || {};

    // Extract lessonId robustly from state (it might come wrapped)
    let stateLessonId: string | undefined = state?.lessonId;
    if (stateLessonId && typeof stateLessonId !== "string") {
      stateLessonId = (stateLessonId as any)?.value || (stateLessonId as any)?.id || undefined;
    }

    const stateDifficulty = state?.selectedDifficulty as string | undefined;
    const statePageIndex = state?.currentPageIndex as number | undefined;

    const lessonId = (stateLessonId || lessonFromQuery) as string | undefined;
    const difficulty = stateDifficulty || difficultyFromQuery;
    // state is 0-based; URL is 1-based
    const page = typeof statePageIndex === "number" ? statePageIndex + 1 : pageFromQuery ? parseInt(pageFromQuery) : 1;

    if (lessonId) {
      const params = new URLSearchParams();
      if (difficulty) params.set("difficulty", difficulty);
      if (page) params.set("page", String(page));
      const query = params.toString();
      const target = query
        ? `/lesson/${encodeURIComponent(lessonId)}?${query}`
        : `/lesson/${encodeURIComponent(lessonId)}`;
      navigate(target, { state: location.state, replace: true });
      return;
    }

    // If we couldn't determine the lesson id, return user to a safe place
    const returnPath = state?.returnPath as string | undefined;
    if (returnPath) {
      navigate(returnPath, { state: state?.returnState, replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <p className="text-gray-700 mb-4">Redirecionando para a lição...</p>
      <Button onClick={() => navigate("/", { replace: true })}>Ir para página inicial</Button>
    </div>
  );
};

export default LegacyLessonRunnerRedirect;