import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Brain, Star, Loader } from 'lucide-react';
import type { PeriodFilter, AppSourceFilter } from '../SuperAdminDashboard';
import {
  useUserSessions,
  useLessonProgress,
  useUserFlashcards,
  useKoeFlashcards,
  useUserPoints,
  useContentProgress,
  useAllUserSessions,
  useGeniusUsers,
} from '../hooks/useSuperAdminData';
import { useAppSourceUsers, filterByAppSource } from '../hooks/useAppSourceFilter';

interface Props {
  period: PeriodFilter;
  appSource: AppSourceFilter;
}

const StatCard = ({ title, value, icon: Icon, sub }: { title: string; value: string | number; icon: React.ElementType; sub?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </CardContent>
  </Card>
);

const OverviewTab: React.FC<Props> = ({ period, appSource }) => {
  const { data: sessions, isLoading: l1 } = useUserSessions(period);
  const { data: allSessions } = useAllUserSessions();
  const { data: lessons, isLoading: l2 } = useLessonProgress(period);
  const { data: flashcards } = useUserFlashcards(period);
  const { data: koeCards } = useKoeFlashcards(period);
  const { data: points } = useUserPoints(period);
  const { data: content } = useContentProgress(period);
  const { data: geniusData } = useGeniusUsers();

  const { phoneSet, userIdSet } = useAppSourceUsers(appSource);

  if (l1 || l2) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // For genius/koe, use genius table as the user source; for tutor_virtual use user_sessions
  const getFilteredSessions = () => {
    if (appSource === 'genius_koe') {
      // Show genius users instead
      return geniusData?.map((g) => ({
        ...g,
        created_at: g.created_at,
        last_login: g.last_login,
      })) || [];
    }
    if (appSource === 'all') return sessions || [];
    return filterByAppSource(sessions, phoneSet, userIdSet);
  };

  const filteredSessions = getFilteredSessions();
  const filteredLessons = filterByAppSource(lessons, phoneSet, userIdSet);
  const filteredFlashcards = filterByAppSource(flashcards, phoneSet, userIdSet);
  const filteredKoe = appSource === 'genius_koe' || appSource === 'all'
    ? (koeCards || [])
    : [];
  const filteredPoints = filterByAppSource(points, phoneSet, userIdSet);
  const filteredContent = filterByAppSource(content, phoneSet, userIdSet);

  const uniqueActiveUsers = new Set(filteredSessions.map((s: any) => s.phone_number)).size;
  const totalAllSessions = appSource === 'all'
    ? new Set(allSessions?.map((s) => s.phone_number) || []).size
    : uniqueActiveUsers;
  const lessonsCompleted = filteredLessons.length;
  const flashcardsCreated = filteredFlashcards.length + filteredKoe.length;
  const totalPoints = filteredPoints.reduce((sum, p) => sum + (p.points || 0), 0);
  const contentCompleted = filteredContent.length;
  const uniqueLessonUsers = new Set(filteredLessons.map((l) => l.phone_number || l.user_id)).size;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Users" value={uniqueActiveUsers} icon={Users} sub={`of ${totalAllSessions} total`} />
        <StatCard title="Lessons Completed" value={lessonsCompleted} icon={BookOpen} sub={`by ${uniqueLessonUsers} users`} />
        <StatCard title="Flashcards Created" value={flashcardsCreated} icon={Brain} />
        <StatCard title="Points Earned" value={totalPoints.toLocaleString()} icon={Star} sub={`${contentCompleted} content items completed`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground">User</th>
                  <th className="pb-2 font-medium text-muted-foreground">Phone</th>
                  <th className="pb-2 font-medium text-muted-foreground">Last Login</th>
                  <th className="pb-2 font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.slice(0, 10).map((s: any) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2">{s.display_name || '—'}</td>
                    <td className="py-2 text-muted-foreground">{s.phone_number}</td>
                    <td className="py-2 text-muted-foreground">{new Date(s.last_login).toLocaleString()}</td>
                    <td className="py-2 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {filteredSessions.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No sessions in this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
