import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Bell, BellOff, Plus, Trash2, CheckCircle2, Circle, Target, Flame } from 'lucide-react';
import { useDailyTargets } from '@/hooks/useDailyTargets';
import { useStudyStreak } from '@/hooks/useStudyStreak';
import type { Priority } from '@/types';

type TimerMode = 'study' | 'break';

const STUDY_MINUTES = 25;
const BREAK_MINUTES = 5;

const PRIORITY_CONFIG: Record<Priority, { label: string; bg: string; text: string; border: string }> = {
  high: { label: 'High', bg: 'bg-black', text: 'text-white', border: 'border-black' },
  medium: { label: 'Medium', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  low: { label: 'Low', bg: 'bg-white', text: 'text-gray-500', border: 'border-gray-200' },
};

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio not available
  }
}

export function FocusEngine() {
  const { targets, loading, addTarget, toggleTarget, deleteTarget } = useDailyTargets();
  const { recordStudyDay } = useStudyStreak();

  const [mode, setMode] = useState<TimerMode>('study');
  const [secondsLeft, setSecondsLeft] = useState(STUDY_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [newTarget, setNewTarget] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  const totalSeconds = mode === 'study' ? STUDY_MINUTES * 60 : BREAK_MINUTES * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (soundOn) playBeep();
            if (mode === 'study' && !completedRef.current) {
              completedRef.current = true;
              recordStudyDay();
            }
            const nextMode: TimerMode = mode === 'study' ? 'break' : 'study';
            setMode(nextMode);
            setRunning(false);
            return nextMode === 'study' ? STUDY_MINUTES * 60 : BREAK_MINUTES * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode, soundOn, recordStudyDay]);

  const handleStart = useCallback(() => {
    if (mode === 'study') completedRef.current = false;
    setRunning(true);
  }, [mode]);

  const handlePause = useCallback(() => setRunning(false), []);

  const handleReset = useCallback(() => {
    setRunning(false);
    setMode('study');
    setSecondsLeft(STUDY_MINUTES * 60);
    completedRef.current = false;
  }, []);

  const handleAddTarget = useCallback(() => {
    if (!newTarget.trim()) return;
    addTarget(newTarget.trim(), newPriority);
    setNewTarget('');
    setNewPriority('medium');
  }, [newTarget, newPriority, addTarget]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  const sortedTargets = [...targets].sort((a, b) => {
    const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pomodoro Timer */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-black uppercase tracking-wide">Pomodoro Timer</h3>
            <p className="text-xs text-gray-500 mt-0.5">25 min study · 5 min break</p>
          </div>
          <button
            onClick={() => setSoundOn(!soundOn)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
            title={soundOn ? 'Sound on' : 'Sound off'}
          >
            {soundOn ? <Bell className="w-4 h-4 text-black" /> : <BellOff className="w-4 h-4 text-gray-400" />}
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
          <button
            onClick={() => { setMode('study'); setSecondsLeft(STUDY_MINUTES * 60); setRunning(false); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'study' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
          >
            Study
          </button>
          <button
            onClick={() => { setMode('break'); setSecondsLeft(BREAK_MINUTES * 60); setRunning(false); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'break' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'}`}
          >
            Break
          </button>
        </div>

        {/* Timer ring */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="w-64 h-64 -rotate-90" viewBox="0 0 280 280">
              <circle cx="140" cy="140" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
              <circle
                cx="140" cy="140" r={radius} fill="none"
                stroke={mode === 'study' ? '#000000' : '#9ca3af'}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-black tabular-nums tracking-tight">
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </span>
              <span className="text-xs text-gray-500 uppercase tracking-widest mt-2">
                {mode === 'study' ? 'Focus Time' : 'Break Time'}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!running ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm"
            >
              <Play className="w-4 h-4" />
              Start
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-black text-black rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Today's Top 3 Targets */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-black" />
          <h3 className="text-sm font-bold text-black uppercase tracking-wide">Today's Top 3 Targets</h3>
        </div>

        {/* Add target form */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddTarget(); }}
            placeholder="Add a study target..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as Priority)}
            className="px-2 py-2 border border-gray-200 rounded-lg text-sm text-black bg-white focus:outline-none focus:border-black transition-all cursor-pointer"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            onClick={handleAddTarget}
            className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Target list */}
        <div className="space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
            </div>
          )}
          {!loading && sortedTargets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No targets yet. Add one above to get started.</p>
            </div>
          )}
          {!loading && sortedTargets.map((target) => {
            const cfg = PRIORITY_CONFIG[target.priority];
            return (
              <div
                key={target.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${target.completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 hover:shadow-sm'}`}
              >
                <button
                  onClick={() => toggleTarget(target.id, target.completed)}
                  className="shrink-0"
                >
                  {target.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-black" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400 transition-colors" />
                  )}
                </button>
                <span className={`flex-1 text-sm ${target.completed ? 'text-gray-400 line-through' : 'text-black font-medium'}`}>
                  {target.title}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cfg.bg} ${cfg.text} ${cfg.border} border`}>
                  {cfg.label}
                </span>
                <button
                  onClick={() => deleteTarget(target.id)}
                  className="p-1 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {targets.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              {targets.filter((t) => t.completed).length} of {targets.length} completed
            </span>
            <span>{Math.round((targets.filter((t) => t.completed).length / targets.length) * 100)}% done</span>
          </div>
        )}
      </div>
    </div>
  );
}
