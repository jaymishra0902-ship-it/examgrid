import { useMemo, useState } from 'react';
import { Search, Copy, Check, FileText, Code2, FlaskConical, Calculator, Cpu, Filter } from 'lucide-react';
import { FORMULAS, SUBJECTS } from '@/lib/constants';
import type { Subject } from '@/types';

const SUBJECT_ICONS: Record<string, typeof FileText> = {
  Physics: FlaskConical,
  Chemistry: FlaskConical,
  Mathematics: Calculator,
  'Computer Science': Cpu,
};

export function ResourceVault() {
  const [search, setSearch] = useState('');
  const [activeSubject, setActiveSubject] = useState<Subject | 'All'>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return FORMULAS.filter((f) => {
      const matchesSearch =
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.content.toLowerCase().includes(search.toLowerCase()) ||
        f.category.toLowerCase().includes(search.toLowerCase());
      const matchesSubject = activeSubject === 'All' || f.subject === activeSubject;
      return matchesSearch && matchesSubject;
    });
  }, [search, activeSubject]);

  const handleCopy = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and filter bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search formulas, code snippets, topics..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <button
              onClick={() => setActiveSubject('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeSubject === 'All' ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
              All
            </button>
            {SUBJECTS.map((subject) => (
              <button
                key={subject}
                onClick={() => setActiveSubject(subject)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeSubject === subject ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
              >
                {subject === 'Computer Science' ? 'CS' : subject}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-black">{filtered.length}</span> of {FORMULAS.length} resources
        </p>
      </div>

      {/* Formula cards grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">No resources found. Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((formula) => {
            const Icon = SUBJECT_ICONS[formula.subject] || FileText;
            const isCode = formula.subject === 'Computer Science';
            return (
              <div
                key={formula.id}
                className="group bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-gray-300 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      {isCode ? <Code2 className="w-4 h-4 text-black" /> : <Icon className="w-4 h-4 text-black" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-black leading-tight">{formula.title}</h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{formula.subject} · {formula.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(formula.id, formula.content)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-black hover:text-white hover:border-black transition-all opacity-0 group-hover:opacity-100"
                    title="Copy to clipboard"
                  >
                    {copiedId === formula.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <pre className={`text-xs leading-relaxed font-mono whitespace-pre-wrap break-words p-3 rounded-lg ${isCode ? 'bg-black text-gray-100' : 'bg-gray-50 text-gray-700'}`}>
                  {formula.content}
                </pre>

                <button
                  onClick={() => handleCopy(formula.id, formula.content)}
                  className="w-full mt-3 py-2 flex items-center justify-center gap-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                >
                  {copiedId === formula.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
