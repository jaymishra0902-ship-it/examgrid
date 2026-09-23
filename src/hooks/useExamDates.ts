import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { ExamDate } from '@/types';

const DEFAULT_EXAMS = [
  { exam_name: 'Physics Board Exam', exam_date: getFutureDate(120) },
  { exam_name: 'Chemistry Board Exam', exam_date: getFutureDate(135) },
  { exam_name: 'Mathematics Board Exam', exam_date: getFutureDate(150) },
];

function getFutureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function useExamDates() {
  const { user, session } = useAuth();
  const [exams, setExams] = useState<ExamDate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExams = useCallback(async () => {
    if (!user || user.isGuest || !session) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('exam_dates')
      .select('*')
      .eq('user_id', user.id)
      .order('exam_date', { ascending: true });

    if (!error && data && data.length > 0) {
      setExams(data);
    } else if (!data || data.length === 0) {
      const { data: inserted, error: insError } = await supabase
        .from('exam_dates')
        .insert(DEFAULT_EXAMS.map((e) => ({ ...e, user_id: user.id })))
        .select('*');
      if (!insError && inserted) setExams(inserted);
    }
    setLoading(false);
  }, [user, session]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  return { exams, loading };
}
