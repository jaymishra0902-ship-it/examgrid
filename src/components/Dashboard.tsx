import { useMemo } from 'react';
import { Flame, TrendingUp, CheckCircle2, Circle, Clock, BookOpen, Award, Zap } from 'lucide-react';
import { useSyllabus } from '@/hooks/useSyllabus';
import { useStudyStreak } from '@/hooks/useStudyStreak';
import { useExamDates } from '@/hooks/useExamDates';
import { SUBJECTS } from '@/lib/constants';
import type { Subject, TopicStatus } from '@/types';

const STATUS_CONFIG: Record<TopicStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  not_started: { label: 'Not Started', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', dot: 'bg-gray-300' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' },
  mastered: { label: 'Mastered', bg: 'bg-black', text: 'text-white', border: 'border-black', dot: 'bg-white' },
};

function ProgressRing({ percentage }: { percentage: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={radius} fill="none" stroke="#000000" strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-black">{Math.round(percentage)}%</span>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Complete</span>
      </div>
    </div>
  );
}

function getCountdown(targetDate: string) {
  const now = new Date();
  const target = new Date(targetDate + 'T00:00:00');
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, passed: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  return { days, hours, passed: false };
}

export function Dashboard() {
  const { topics, loading: topicsLoading, cycleStatus } = useSyllabus();
  const { streak, loading: streakLoading } = useStudyStreak();
  const { exams, loading: examsLoading } = useExamDates();

  const overallProgress = useMemo(() => {
    if (topics.length === 0) return 0;
    const mastered = topics.filter((t) => t.status === 'mastered').length;
    const inProgress = topics.filter((t) => t.status === 'in_progress').length;
    return (mastered + inProgress * 0.5) / topics.length * 100;
  }, [topics]);

  const subjectStats = useMemo(() => {
    return SUBJECTS.map((subject) => {
      const subjectTopics = topics.filter((t) => t.subject === subject);
      const mastered = subjectTopics.filter((t) => t.status === 'mastered').length;
      const inProgress = subjectTopics.filter((t) => t.status === 'in_progress').length;
      const total = subjectTopics.length;
      const pct = total > 0 ? (mastered + inProgress * 0.5) / total * 100 : 0;
      return { subject, mastered, inProgress, notStarted: total - mastered - inProgress, total, pct };
    });
  }, [topics]);

  const streakBadge = useMemo(() => {
    const s = streak?.current_streak ?? 0;
    if (s === 0) return { label: 'Ready to Start', icon: Circle, color: 'text-gray-400' };
    if (s < 3) return { label: 'Getting Started', icon: Zap, color: 'text-amber-500' };
    if (s < 7) return { label: 'On Fire', icon: Flame, color: 'text-orange-500' };
    if (s < 14) return { label: 'Unstoppable', icon: Flame, color: 'text-red-500' };
    return { label: 'Legendary', icon: Award, color: 'text-black' };
  }, [streak]);

  const loading = topicsLoading || streakLoading || examsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Study Streak</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-bold text-black">{streak?.current_streak ?? 0}</span>
                <span className="text-sm text-gray-500">days</span>
              </div>
            </div>
            <div className={`p-2.5 bg-gray-50 rounded-xl ${streakBadge.color}`}>
              <streakBadge.icon className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${streakBadge.color} bg-gray-50 border border-gray-200`}>
              <streakBadge.icon className="w-3 h-3" />
              {streakBadge.label}
            </span>
            <span className="text-xs text-gray-400">Best: {streak?.longest_streak ?? 0} days</span>
          </div>
        </div>

        {/* Progress ring card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between hover:shadow-lg transition-shadow">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Overall Progress</p>
            <p className="text-sm text-gray-600 mt-1">Syllabus completion</p>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-gray-500">{topics.filter((t) => t.status === 'mastered').length} mastered</p>
              <p className="text-xs text-gray-500">{topics.filter((t) => t.status === 'in_progress').length} in progress</p>
              <p className="text-xs text-gray-500">{topics.filter((t) => t.status === 'not_started').length} not started</p>
            </div>
          </div>
          <ProgressRing percentage={overallProgress} />
        </div>

        {/* Exam countdown card */}
        <div className="bg-black text-white rounded-2xl p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Next Exam</p>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          {exams.length > 0 ? (
            <>
              <p className="text-lg font-bold leading-tight">{exams[0].exam_name}</p>
              <div className="flex items-baseline gap-3 mt-3">
                <div>
                  <span className="text-3xl font-bold">{getCountdown(exams[0].exam_date).days}</span>
                  <span className="text-xs text-gray-400 ml-1">days</span>
                </div>
                <div>
                  <span className="text-2xl font-bold">{getCountdown(exams[0].exam_date).hours}</span>
                  <span className="text-xs text-gray-400 ml-1">hrs</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">No exams scheduled</p>
          )}
        </div>
      </div>

      {/* Exam countdown cards */}
      {exams.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {exams.map((exam) => {
            const cd = getCountdown(exam.exam_date);
            return (
              <div key={exam.id} className={`border rounded-xl p-4 transition-all hover:shadow-md ${cd.passed ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200'}`}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">{exam.exam_name}</p>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className={`text-2xl font-bold ${cd.passed ? 'text-gray-400' : 'text-black'}`}>{cd.days}</span>
                  <span className="text-xs text-gray-400">days</span>
                  <span className={`text-lg font-bold ml-2 ${cd.passed ? 'text-gray-400' : 'text-gray-600'}`}>{cd.hours}</span>
                  <span className="text-xs text-gray-400">hrs</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{new Date(exam.exam_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Subject progress bars */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-black" />
          <h3 className="text-sm font-bold text-black uppercase tracking-wide">Subject Progress</h3>
        </div>
        <div className="space-y-4">
          {subjectStats.map((stat) => (
            <div key={stat.subject}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-black">{stat.subject}</span>
                <span className="text-xs text-gray-500">{stat.mastered}/{stat.total} mastered · {Math.round(stat.pct)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${stat.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Syllabus matrix */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-black" />
          <h3 className="text-sm font-bold text-black uppercase tracking-wide">Syllabus Completion Matrix</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {SUBJECTS.map((subject) => {
            const subjectTopics = topics.filter((t) => t.subject === subject);
            return (
              <div key={subject}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-black">{subject}</h4>
                  <span className="text-xs text-gray-400">{subjectTopics.length} topics</span>
                </div>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-2">
                  {subjectTopics.map((topic) => {
                    const cfg = STATUS_CONFIG[topic.status];
                    return (
                      <button
                        key={topic.id}
                        onClick={() => cycleStatus(topic.id, topic.status)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border ${cfg.bg} ${cfg.border} hover:shadow-sm transition-all group`}
                      >
                        <span className={`text-sm font-medium ${cfg.text} text-left truncate`}>{topic.topic_name}</span>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cfg.text} shrink-0 ml-2`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </button>
                    );
                  })}
                  {subjectTopics.length === 0 && (
                    <p className="text-xs text-gray-400 italic px-3 py-2">No topics loaded</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-300" /> Not Started</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> In Progress</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-black" /> Mastered</span>
          <span className="ml-auto">Click any topic to cycle status</span>
        </div>
      </div>
    </div>
  );
}
