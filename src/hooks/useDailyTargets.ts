import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { DailyTarget, Priority } from '@/types';

export function useDailyTargets() {
  const { user, session } = useAuth();
  const [targets, setTargets] = useState<DailyTarget[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTargets = useCallback(async () => {
    if (!user || user.isGuest || !session) {
      setLoading(false);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_targets')
      .select('*')
      .eq('user_id', user.id)
      .eq('target_date', today)
      .order('created_at', { ascending: true });

    if (!error && data) setTargets(data);
    setLoading(false);
  }, [user, session]);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  const addTarget = useCallback(async (title: string, priority: Priority) => {
    if (!user || !session) return;
    const today = new Date().toISOString().split('T')[0];
    const newTarget = {
      user_id: user.id,
      title,
      priority,
      completed: false,
      target_date: today,
    };
    const { data, error } = await supabase.from('daily_targets').insert(newTarget).select('*').single();
    if (!error && data) setTargets((prev) => [...prev, data]);
  }, [user, session]);

  const toggleTarget = useCallback(async (id: string, completed: boolean) => {
    setTargets((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t)));
    if (user && !user.isGuest && session) {
      await supabase.from('daily_targets').update({ completed: !completed }).eq('id', id);
    }
  }, [user, session]);

  const deleteTarget = useCallback(async (id: string) => {
    setTargets((prev) => prev.filter((t) => t.id !== id));
    if (user && !user.isGuest && session) {
      await supabase.from('daily_targets').delete().eq('id', id);
    }
  }, [user, session]);

  return { targets, loading, addTarget, toggleTarget, deleteTarget };
}
