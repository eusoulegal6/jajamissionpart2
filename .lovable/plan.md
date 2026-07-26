

## Problem Analysis

The core bug: When opening a PNL complementary lesson (which has an `Avançado_` prefix ID), clicking "back" on the first page navigates to Curso Completo instead of PNL, because LessonNavigation has **two conflicting navigation systems**:

1. **`returnPath`-based** (lines 371-399): Correctly prioritizes `isPNLContext` (`returnPath === '/lessons'`) over `isCursoCompletoContext`.
2. **First-page rendering** (lines 448-476): Bypasses the returnPath logic entirely and checks `isCursoCompletoLesson` (based on lesson ID prefix like `Avançado_`) first, hardcoding "Voltar ao Curso".

Since PNL complementary lessons have `Avançado_` prefixed IDs, `isCursoCompletoLesson` is true even when the lesson was launched from PNL with `returnPath: '/lessons'`.

## Changes Required

### 1. Fix LessonNavigation first-page back button (LessonNavigation.tsx)

Remove the separate `isCursoCompletoLesson` branch in the first-page rendering (lines 448-476). Instead, always use the unified `backButtonHandler` and `backButtonText` that already correctly handle all contexts with proper priority:

```
{isFirstPage ? (
  <Button variant="outline" onClick={backButtonHandler} className="flex items-center gap-2">
    <ChevronLeft className="h-4 w-4" />
    {backButtonText}
  </Button>
) : ( ... )}
```

This removes the special-case `isCursoCompletoLesson` and `isTOEFLContext` branches that duplicate and contradict the returnPath-based logic already computed above.

### 2. Fix `handleComplete` in LessonRunner.tsx — ensure Lições Completas returns with difficulty

The `handleComplete` redirect (lines 1112-1140) and `handleFlashcardsModalClose` (lines 1160-1185) already handle `/curso-completo`, `/lessons`, content paths, and default to `returnPath || "/complete-lessons"` with `selectedDifficulty` in state. This looks correct.

However, verify the default case passes `selectedDifficulty` — it does (line 1136). No change needed here.

### 3. Remove `isCursoCompletoLesson` detection entirely from LessonNavigation

The `isCursoCompletoLesson` detection (lines 349-355) is now redundant because `isCursoCompletoContext` (`returnPath === '/curso-completo'`) already handles this correctly. The ID-prefix-based detection causes false positives for PNL lessons. Remove lines 349-366 and the `isCursoCompletoLesson` reference on line 381, keeping only `isCursoCompletoContext`.

### Summary of files to edit

- **`src/components/lesson-pages/LessonNavigation.tsx`**:
  - Remove `isCursoCompletoLesson` detection logic (lines 349-366)
  - Change line 381 from `isCursoCompletoContext || isCursoCompletoLesson` to just `isCursoCompletoContext`
  - Simplify first-page back button rendering (lines 448-476) to always use `backButtonHandler`/`backButtonText`

No other files need changes — the `returnPath` is correctly set by all entry points (CursoCompletoScreen, CompleteLessonsScreen, ComplementaryLessonsDisplay, content explorer).

