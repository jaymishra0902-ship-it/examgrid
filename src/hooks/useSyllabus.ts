import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { DEFAULT_SYLLABUS, SUBJECTS } from '@/lib/constants';
import type { SyllabusTopic, TopicStatus } from '@/types';

const STATUS_CYCLE: Record<TopicStatus, TopicStatus> = {
  not_started: 'in_progress',
  in_progress: 'mastered',
  mastered: 'not_started',
};

export function useSyllabus() {
  const { user, session } = useAuth();
  const [topics, setTopics] = useState<SyllabusTopic[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTopics = useCallback(async () => {
    if (!user || user.isGuest || !session) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('syllabus_topics')
      .select('*')
      .eq('user_id', user.id)
      .order('subject', { ascending: true })
      .order('topic_name', { ascending: true });

    if (error) {
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      const newTopics = SUBJECTS.flatMap((subject) =>
        DEFAULT_SYLLABUS[subject].map((topic_name) => ({ subject, topic_name, status: 'not_started' as TopicStatus }))
      );
      const { data: inserted, error: insertError } = await supabase
        .from('syllabus_topics')
        .insert(newTopics.map((t) => ({ ...t, user_id: user.id })))
        .select('*');
      if (!insertError && inserted) {
        setTopics(inserted);
      }
      setLoading(false);
      return;
    }

    setTopics(data);
    setLoading(false);
  }, [user, session]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const cycleStatus = useCallback(async (topicId: string, currentStatus: TopicStatus) => {
    const next = STATUS_CYCLE[currentStatus];
    setTopics((prev) => prev.map((t) => (t.id === topicId ? { ...t, status: next } : t)));
    if (user && !user.isGuest && session) {
      await supabase.from('syllabus_topics').update({ status: next, updated_at: new Date().toISOString() }).eq('id', topicId);
    }
  }, [user, session]);

  return { topics, loading, cycleStatus };
}
