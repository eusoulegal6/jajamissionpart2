import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AppSourceFilter } from '../SuperAdminDashboard';

/** Returns a Set of phone_numbers and a Set of user_ids belonging to the selected app source.
 *  When appSource is 'all', returns null (meaning no filtering). */
export function useAppSourceUsers(appSource: AppSourceFilter) {
  const { data: tutorUsers } = useQuery({
    queryKey: ['superadmin', 'tutor_phones'],
    queryFn: async () => {
      const { data } = await supabase.from('user_sessions').select('phone_number');
      return data?.map((d) => d.phone_number) || [];
    },
    enabled: appSource === 'tutor_virtual',
  });

  const { data: geniusUsers } = useQuery({
    queryKey: ['superadmin', 'genius_phones'],
    queryFn: async () => {
      const { data } = await supabase.from('genius').select('phone_number');
      return data?.map((d) => d.phone_number) || [];
    },
    enabled: appSource === 'genius_koe',
  });

  const { data: emailUsers } = useQuery({
    queryKey: ['superadmin', 'email_user_ids'],
    queryFn: async () => {
      const { data } = await supabase.from('app_email_users').select('user_id, email');
      return data || [];
    },
    enabled: appSource === 'app_email',
  });

  const { data: app2Users } = useQuery({
    queryKey: ['superadmin', 'app2_user_ids'],
    queryFn: async () => {
      const { data } = await supabase.from('app2_user_profiles').select('user_id, email');
      return data || [];
    },
    enabled: appSource === 'app2',
  });

  return useMemo(() => {
    if (appSource === 'all') return { phoneSet: null, userIdSet: null };

    if (appSource === 'tutor_virtual' && tutorUsers) {
      return { phoneSet: new Set(tutorUsers), userIdSet: null };
    }
    if (appSource === 'genius_koe' && geniusUsers) {
      return { phoneSet: new Set(geniusUsers), userIdSet: null };
    }
    if (appSource === 'app_email' && emailUsers) {
      return {
        phoneSet: null,
        userIdSet: new Set(emailUsers.map((u) => u.user_id).filter(Boolean) as string[]),
      };
    }
    if (appSource === 'app2' && app2Users) {
      return {
        phoneSet: null,
        userIdSet: new Set(app2Users.map((u) => u.user_id).filter(Boolean) as string[]),
      };
    }

    return { phoneSet: null, userIdSet: null };
  }, [appSource, tutorUsers, geniusUsers, emailUsers, app2Users]);
}

/** Filter an array of records by the app source sets.
 *  Records must have optional phone_number and user_id fields. */
export function filterByAppSource<T extends { phone_number?: string | null; user_id?: string | null }>(
  data: T[] | undefined | null,
  phoneSet: Set<string> | null,
  userIdSet: Set<string> | null,
): T[] {
  if (!data) return [];
  if (!phoneSet && !userIdSet) return data;

  return data.filter((item) => {
    if (phoneSet && item.phone_number && phoneSet.has(item.phone_number)) return true;
    if (userIdSet && item.user_id && userIdSet.has(item.user_id)) return true;
    return false;
  });
}
