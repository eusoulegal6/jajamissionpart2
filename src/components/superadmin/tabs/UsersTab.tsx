import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader, Search } from 'lucide-react';
import type { PeriodFilter, AppSourceFilter } from '../SuperAdminDashboard';
import { useAllUserSessions, useLessonProgress, useUserPoints, useUserSessions, useGeniusUsers } from '../hooks/useSuperAdminData';
import { useAppSourceUsers, filterByAppSource } from '../hooks/useAppSourceFilter';

interface Props {
  period: PeriodFilter;
  appSource: AppSourceFilter;
}

const UsersTab: React.FC<Props> = ({ period, appSource }) => {
  const [search, setSearch] = useState('');
  const { data: allSessions } = useAllUserSessions();
  const { data: filteredSessions, isLoading } = useUserSessions(period);
  const { data: lessons } = useLessonProgress(period);
  const { data: points } = useUserPoints(period);
  const { data: geniusData } = useGeniusUsers();

  const { phoneSet, userIdSet } = useAppSourceUsers(appSource);

  const filteredPhones = useMemo(() => {
    if (!filteredSessions) return null;
    return new Set(filteredSessions.map((s) => s.phone_number));
  }, [filteredSessions]);

  const enrichedUsers = useMemo(() => {
    const filteredLessons = filterByAppSource(lessons, phoneSet, userIdSet);
    const filteredPoints = filterByAppSource(points, phoneSet, userIdSet);

    const lessonsByUser = new Map<string, number>();
    filteredLessons.forEach((l) => {
      const key = l.phone_number || l.user_id || '';
      lessonsByUser.set(key, (lessonsByUser.get(key) || 0) + 1);
    });

    const pointsByUser = new Map<string, number>();
    filteredPoints.forEach((p) => {
      const key = p.phone_number || p.user_id || '';
      pointsByUser.set(key, (pointsByUser.get(key) || 0) + (p.points || 0));
    });

    // For genius/koe source, use genius table
    if (appSource === 'genius_koe') {
      const geniusPhones = geniusData
        ? (filteredPhones
          ? geniusData.filter((g) => filteredPhones.has(g.phone_number))
          : geniusData)
        : [];
      return geniusPhones.map((g) => ({
        id: g.id,
        phone_number: g.phone_number,
        display_name: g.display_name,
        last_login: g.last_login,
        created_at: g.created_at,
        lessonsCompleted: lessonsByUser.get(g.phone_number) || 0,
        totalPoints: pointsByUser.get(g.phone_number) || 0,
      }));
    }

    // For other sources, use user_sessions
    let base = allSessions || [];
    if (filteredPhones) {
      base = base.filter((s) => filteredPhones.has(s.phone_number));
    }
    // Apply app source filter
    if (phoneSet) {
      base = base.filter((s) => phoneSet.has(s.phone_number));
    }

    return base.map((s) => ({
      ...s,
      lessonsCompleted: lessonsByUser.get(s.phone_number) || 0,
      totalPoints: pointsByUser.get(s.phone_number) || 0,
    }));
  }, [allSessions, filteredPhones, lessons, points, appSource, geniusData, phoneSet, userIdSet]);

  const filtered = useMemo(() => {
    if (!search) return enrichedUsers;
    const q = search.toLowerCase();
    return enrichedUsers.filter(
      (u) =>
        u.phone_number.toLowerCase().includes(q) ||
        (u.display_name && u.display_name.toLowerCase().includes(q))
    );
  }, [enrichedUsers, search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Badge variant="secondary">{filtered.length} users</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Name</th>
                  <th className="pb-2 font-medium text-muted-foreground">Phone</th>
                  <th className="pb-2 font-medium text-muted-foreground">Lessons</th>
                  <th className="pb-2 font-medium text-muted-foreground">Points</th>
                  <th className="pb-2 font-medium text-muted-foreground">Last Login</th>
                  <th className="pb-2 font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 font-medium">{u.display_name || '—'}</td>
                    <td className="py-2 text-muted-foreground">{u.phone_number}</td>
                    <td className="py-2">
                      <Badge variant={u.lessonsCompleted > 0 ? 'default' : 'secondary'}>
                        {u.lessonsCompleted}
                      </Badge>
                    </td>
                    <td className="py-2">{u.totalPoints.toLocaleString()}</td>
                    <td className="py-2 text-muted-foreground">{new Date(u.last_login).toLocaleString()}</td>
                    <td className="py-2 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersTab;
