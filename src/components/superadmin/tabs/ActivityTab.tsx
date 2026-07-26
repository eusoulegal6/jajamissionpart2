import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader, BookOpen, Brain, Headphones, BookMarked, Star } from 'lucide-react';
import type { PeriodFilter, AppSourceFilter } from '../SuperAdminDashboard';
import {
  useLessonProgress,
  useUserFlashcards,
  useKoeFlashcards,
  useContentProgress,
  useBookProgress,
  useUserPoints,
} from '../hooks/useSuperAdminData';
import { useAppSourceUsers, filterByAppSource } from '../hooks/useAppSourceFilter';

interface Props {
  period: PeriodFilter;
  appSource: AppSourceFilter;
}

const ActivityTab: React.FC<Props> = ({ period, appSource }) => {
  const { data: rawLessons, isLoading: l1 } = useLessonProgress(period);
  const { data: rawFlashcards } = useUserFlashcards(period);
  const { data: rawKoeCards } = useKoeFlashcards(period);
  const { data: rawContent } = useContentProgress(period);
  const { data: rawBookProgress } = useBookProgress(period);
  const { data: rawPoints } = useUserPoints(period);

  const { phoneSet, userIdSet } = useAppSourceUsers(appSource);

  const lessons = filterByAppSource(rawLessons, phoneSet, userIdSet);
  const flashcards = filterByAppSource(rawFlashcards, phoneSet, userIdSet);
  const koeCards = appSource === 'genius_koe' || appSource === 'all' ? (rawKoeCards || []) : [];
  const content = filterByAppSource(rawContent, phoneSet, userIdSet);
  const bookProgress = filterByAppSource(rawBookProgress, phoneSet, userIdSet);
  const points = filterByAppSource(rawPoints, phoneSet, userIdSet);

  if (l1) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const difficultyMap = new Map<string, number>();
  lessons.forEach((l) => difficultyMap.set(l.difficulty, (difficultyMap.get(l.difficulty) || 0) + 1));

  const lessonCountMap = new Map<string, number>();
  lessons.forEach((l) => lessonCountMap.set(l.lesson_id, (lessonCountMap.get(l.lesson_id) || 0) + 1));
  const topLessons = [...lessonCountMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const lessonUsers = new Set(lessons.map((l) => l.phone_number || l.user_id));
  const flashcardUsers = new Set(flashcards.map((f) => f.phone_number || f.user_id));
  const koeUsers = new Set(koeCards.map((k) => k.user_id));
  const contentUsers = new Set(content.map((c) => c.phone_number || c.user_id));
  const bookUsers = new Set(bookProgress.map((b) => b.phone_number || b.user_id));
  const pointUsers = new Set(points.map((p) => p.phone_number || p.user_id));

  const bookCategoryMap = new Map<string, number>();
  bookProgress.forEach((b) => bookCategoryMap.set(b.category, (bookCategoryMap.get(b.category) || 0) + 1));

  const contentItemMap = new Map<string, number>();
  content.forEach((c) => contentItemMap.set(c.content_item_id, (contentItemMap.get(c.content_item_id) || 0) + 1));
  const topContent = [...contentItemMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const pointsDiffMap = new Map<string, number>();
  points.forEach((p) => pointsDiffMap.set(p.difficulty, (pointsDiffMap.get(p.difficulty) || 0) + (p.points || 0)));

  const koeDiffMap = new Map<string, number>();
  koeCards.forEach((k) => koeDiffMap.set(k.difficulty, (koeDiffMap.get(k.difficulty) || 0) + 1));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2 mb-1"><BookOpen className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Lessons</p></div><p className="text-2xl font-bold">{lessons.length}</p><p className="text-xs text-muted-foreground">{lessonUsers.size} users</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2 mb-1"><Brain className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">User Flashcards</p></div><p className="text-2xl font-bold">{flashcards.length}</p><p className="text-xs text-muted-foreground">{flashcardUsers.size} users</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2 mb-1"><Brain className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Koe Flashcards</p></div><p className="text-2xl font-bold">{koeCards.length}</p><p className="text-xs text-muted-foreground">{koeUsers.size} users</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2 mb-1"><Headphones className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Content Items</p></div><p className="text-2xl font-bold">{content.length}</p><p className="text-xs text-muted-foreground">{contentUsers.size} users</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2 mb-1"><BookMarked className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Book Mode</p></div><p className="text-2xl font-bold">{bookProgress.length}</p><p className="text-xs text-muted-foreground">{bookUsers.size} users</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2 mb-1"><Star className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Points Earned</p></div><p className="text-2xl font-bold">{points.reduce((s, p) => s + (p.points || 0), 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">{pointUsers.size} users</p></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">📚 Lessons by Difficulty</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-3">{[...difficultyMap.entries()].map(([diff, count]) => (<div key={diff} className="flex items-center gap-2"><Badge variant="outline">{diff}</Badge><span className="text-sm font-medium">{count}</span></div>))}{difficultyMap.size === 0 && <p className="text-sm text-muted-foreground">No data</p>}</div></CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">📚 Most Popular Lessons</CardTitle></CardHeader><CardContent><div className="space-y-2">{topLessons.map(([id, count]) => (<div key={id} className="flex items-center justify-between"><span className="text-sm truncate max-w-[70%]">{id}</span><Badge>{count} completions</Badge></div>))}{topLessons.length === 0 && <p className="text-sm text-muted-foreground">No lessons completed</p>}</div></CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">🧠 Koe Flashcards by Difficulty</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-3">{[...koeDiffMap.entries()].map(([diff, count]) => (<div key={diff} className="flex items-center gap-2"><Badge variant="outline">{diff}</Badge><span className="text-sm font-medium">{count} cards</span></div>))}{koeDiffMap.size === 0 && <p className="text-sm text-muted-foreground">No data</p>}</div></CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">🧠 Recent User Flashcards</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="pb-2 font-medium text-muted-foreground">User</th><th className="pb-2 font-medium text-muted-foreground">Front</th><th className="pb-2 font-medium text-muted-foreground">Back</th><th className="pb-2 font-medium text-muted-foreground">Created</th></tr></thead><tbody>{flashcards.slice(0, 10).map((f) => (<tr key={f.id} className="border-b last:border-0"><td className="py-2">{f.phone_number || f.user_id || '—'}</td><td className="py-2 truncate max-w-[150px]">{f.front_text}</td><td className="py-2 truncate max-w-[150px] text-muted-foreground">{f.back_text}</td><td className="py-2 text-muted-foreground">{new Date(f.created_at).toLocaleString()}</td></tr>))}{flashcards.length === 0 && (<tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No flashcards created</td></tr>)}</tbody></table></div></CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">📖 Book Mode by Category</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-3 mb-4">{[...bookCategoryMap.entries()].map(([cat, count]) => (<div key={cat} className="flex items-center gap-2"><Badge variant="outline">{cat}</Badge><span className="text-sm font-medium">{count} sessions</span></div>))}{bookCategoryMap.size === 0 && <p className="text-sm text-muted-foreground">No book mode activity</p>}</div>{bookProgress.length > 0 && (<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="pb-2 font-medium text-muted-foreground">User</th><th className="pb-2 font-medium text-muted-foreground">Category</th><th className="pb-2 font-medium text-muted-foreground">Progress</th><th className="pb-2 font-medium text-muted-foreground">Updated</th></tr></thead><tbody>{bookProgress.slice(0, 10).map((b) => (<tr key={b.id} className="border-b last:border-0"><td className="py-2">{b.phone_number || '—'}</td><td className="py-2"><Badge variant="outline">{b.category}</Badge></td><td className="py-2 text-muted-foreground">Lesson {b.current_lesson_index + 1}/{b.total_lessons} · Page {b.current_page_index + 1}</td><td className="py-2 text-muted-foreground">{new Date(b.updated_at).toLocaleString()}</td></tr>))}</tbody></table></div>)}</CardContent></Card>

      {topContent.length > 0 && (<Card><CardHeader><CardTitle className="text-base">🎧 Most Completed Content Items</CardTitle></CardHeader><CardContent><div className="space-y-2">{topContent.map(([id, count]) => (<div key={id} className="flex items-center justify-between"><span className="text-sm truncate max-w-[70%]">{id}</span><Badge>{count} completions</Badge></div>))}</div></CardContent></Card>)}

      <Card><CardHeader><CardTitle className="text-base">⭐ Points by Difficulty</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-3">{[...pointsDiffMap.entries()].map(([diff, pts]) => (<div key={diff} className="flex items-center gap-2"><Badge variant="outline">{diff}</Badge><span className="text-sm font-medium">{pts.toLocaleString()} pts</span></div>))}{pointsDiffMap.size === 0 && <p className="text-sm text-muted-foreground">No points data</p>}</div></CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">📚 Recent Lesson Completions</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="pb-2 font-medium text-muted-foreground">User</th><th className="pb-2 font-medium text-muted-foreground">Lesson ID</th><th className="pb-2 font-medium text-muted-foreground">Difficulty</th><th className="pb-2 font-medium text-muted-foreground">Completed</th></tr></thead><tbody>{lessons.slice(0, 15).map((l) => (<tr key={l.id} className="border-b last:border-0"><td className="py-2">{l.phone_number || l.user_id || '—'}</td><td className="py-2 text-muted-foreground truncate max-w-[200px]">{l.lesson_id}</td><td className="py-2"><Badge variant="outline">{l.difficulty}</Badge></td><td className="py-2 text-muted-foreground">{new Date(l.completed_at).toLocaleString()}</td></tr>))}{lessons.length === 0 && (<tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No activity</td></tr>)}</tbody></table></div></CardContent></Card>
    </div>
  );
};

export default ActivityTab;
