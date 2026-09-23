import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { StudyStreak } from '@/types';

export function useStudyStreak() {
  const { user, session } = useAuth();
  const [streak, setStreak] = useState<StudyStreak | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStreak = useCallback(async () => {
    if (!user || user.isGuest || !session) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('study_streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setStreak(data);
    } else if (!data) {
      const { data: inserted, error: insError } = await supabase
        .from('study_streaks')
        .insert({ user_id: user.id, current_streak: 0, longest_streak: 0, total_study_days: 0 })
        .select('*')
        .maybeSingle();
      if (!insError && inserted) setStreak(inserted);
    }
    setLoading(false);
  }, [user, session]);

  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  const recordStudyDay = useCallback(async () => {
    if (!user || user.isGuest || !session || !streak) return;
    const today = new Date().toISOString().split('T')[0];
    if (streak.last_study_date === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newCurrent = streak.last_study_date === yesterday ? streak.current_streak + 1 : 1;
    const newLongest = Math.max(streak.longest_streak, newCurrent);
    const newTotal = streak.total_study_days + 1;

    const updated = {
      ...streak,
      current_streak: newCurrent,
      longest_streak: newLongest,
      total_study_days: newTotal,
      last_study_date: today,
      updated_at: new Date().toISOString(),
    };
    setStreak(updated);
    await supabase.from('study_streaks').update({
      current_streak: newCurrent,
      longest_streak: newLongest,
      total_study_days: newTotal,
      last_study_date: today,
      updated_at: new Date().toISOString(),
    }).eq('id', streak.id);
  }, [user, session, streak]);

  return { streak, loading, recordStudyDay };
}
