import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, TrendingUp, TrendingDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import type { PeriodFilter, AppSourceFilter } from '../SuperAdminDashboard';
import { useAllUserSessions, useLessonProgress, useUserFlashcards, useKoeFlashcards, useGeniusUsers } from '../hooks/useSuperAdminData';
import { useAppSourceUsers, filterByAppSource } from '../hooks/useAppSourceFilter';

interface Props {
  period: PeriodFilter;
  appSource: AppSourceFilter;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
];

function groupByDay(items: { date: string }[]): { date: string; count: number }[] {
  const map = new Map<string, number>();
  items.forEach((i) => {
    const d = i.date.split('T')[0];
    map.set(d, (map.get(d) || 0) + 1);
  });
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));
}

const AnalyticsTab: React.FC<Props> = ({ period, appSource }) => {
  const { data: allSessions, isLoading: l1 } = useAllUserSessions();
  const { data: allLessons, isLoading: l2 } = useLessonProgress('all');
  const { data: allFlashcards } = useUserFlashcards('all');
  const { data: allKoe } = useKoeFlashcards('all');
  const { data: geniusData } = useGeniusUsers();

  const { phoneSet, userIdSet } = useAppSourceUsers(appSource);

  const sessions = useMemo(() => {
    if (appSource === 'genius_koe') return geniusData || [];
    if (appSource === 'all') return allSessions || [];
    return filterByAppSource(allSessions, phoneSet, userIdSet);
  }, [allSessions, geniusData, appSource, phoneSet, userIdSet]);

  const lessons = useMemo(() => filterByAppSource(allLessons, phoneSet, userIdSet), [allLessons, phoneSet, userIdSet]);

  const signupData = useMemo(() => {
    return groupByDay(sessions.map((s: any) => ({ date: s.created_at })));
  }, [sessions]);

  const dauData = useMemo(() => {
    const dayUsers = new Map<string, Set<string>>();
    sessions.forEach((s: any) => {
      const d = s.last_login.split('T')[0];
      if (!dayUsers.has(d)) dayUsers.set(d, new Set());
      dayUsers.get(d)!.add(s.phone_number);
    });
    return [...dayUsers.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, users]) => ({ date, count: users.size }));
  }, [sessions]);

  const lessonData = useMemo(() => {
    return groupByDay(lessons.map((l) => ({ date: l.completed_at }))).slice(-30);
  }, [lessons]);

  const difficultyPie = useMemo(() => {
    const map = new Map<string, number>();
    lessons.forEach((l) => map.set(l.difficulty, (map.get(l.difficulty) || 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [lessons]);

  const growthStats = useMemo(() => {
    const now = new Date();
    const last7 = new Date(now); last7.setDate(last7.getDate() - 7);
    const prev7 = new Date(now); prev7.setDate(prev7.getDate() - 14);
    const recent = sessions.filter((s: any) => new Date(s.created_at) >= last7).length;
    const previous = sessions.filter((s: any) => {
      const d = new Date(s.created_at);
      return d >= prev7 && d < last7;
    }).length;
    const change = previous === 0 ? (recent > 0 ? 100 : 0) : Math.round(((recent - previous) / previous) * 100);
    return { recent, previous, change };
  }, [sessions]);

  if (l1 || l2) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredFlashcards = filterByAppSource(allFlashcards, phoneSet, userIdSet);
  const filteredKoe = appSource === 'genius_koe' || appSource === 'all' ? (allKoe || []) : [];
  const totalFlashcards = filteredFlashcards.length + filteredKoe.length;

  return (
    <div className="space-y-6">
      {growthStats && (
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-4">
            {growthStats.change >= 0 ? (
              <TrendingUp className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="w-8 h-8 text-destructive" />
            )}
            <div>
              <p className="text-sm text-muted-foreground">New users (last 7d vs previous 7d)</p>
              <p className="text-xl font-bold">
                {growthStats.recent} users
                <span className={`ml-2 text-sm ${growthStats.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                  {growthStats.change >= 0 ? '+' : ''}{growthStats.change}%
                </span>
              </p>
              <p className="text-xs text-muted-foreground">Previous period: {growthStats.previous} users</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">User Signups Over Time</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signupData.slice(-30)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="Signups" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Daily Active Users (Last 30d)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dauData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Active Users" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Lesson Completions (Last 30d)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lessonData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Completions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Difficulty Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={difficultyPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label>
                    {difficultyPie.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">All-Time Totals</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div><p className="text-2xl font-bold">{sessions.length}</p><p className="text-sm text-muted-foreground">Total Users</p></div>
            <div><p className="text-2xl font-bold">{lessons.length}</p><p className="text-sm text-muted-foreground">Lessons Completed</p></div>
            <div><p className="text-2xl font-bold">{totalFlashcards}</p><p className="text-sm text-muted-foreground">Flashcards Created</p></div>
            <div><p className="text-2xl font-bold">{signupData.length}</p><p className="text-sm text-muted-foreground">Active Days</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
