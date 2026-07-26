import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Users, Activity, TrendingUp } from 'lucide-react';
import OverviewTab from './tabs/OverviewTab';
import UsersTab from './tabs/UsersTab';
import ActivityTab from './tabs/ActivityTab';
import AnalyticsTab from './tabs/AnalyticsTab';

export type PeriodFilter = 'today' | 'yesterday' | '7days' | '30days' | 'all';
export type AppSourceFilter = 'all' | 'tutor_virtual' | 'genius_koe' | 'app_email' | 'app2';

const SuperAdminDashboard: React.FC = () => {
  const [period, setPeriod] = useState<PeriodFilter>('7days');
  const [appSource, setAppSource] = useState<AppSourceFilter>('all');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Super Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Platform analytics & user management</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={appSource} onValueChange={(v) => setAppSource(v as AppSourceFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Apps</SelectItem>
                <SelectItem value="tutor_virtual">Tutor Virtual</SelectItem>
                <SelectItem value="genius_koe">Genius / Koe</SelectItem>
                <SelectItem value="app_email">App Email</SelectItem>
                <SelectItem value="app2">App 2</SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
            <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4 hidden sm:block" /> Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5 text-xs sm:text-sm">
              <Users className="w-4 h-4 hidden sm:block" /> Users
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5 text-xs sm:text-sm">
              <Activity className="w-4 h-4 hidden sm:block" /> Activity
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5 text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4 hidden sm:block" /> Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab period={period} appSource={appSource} />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab period={period} appSource={appSource} />
          </TabsContent>
          <TabsContent value="activity">
            <ActivityTab period={period} appSource={appSource} />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab period={period} appSource={appSource} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
