import { useState } from 'react';
import { GraduationCap, LogOut, ChevronDown, Flame, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onShowAuth: () => void;
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'focus', label: 'Focus Engine' },
  { id: 'vault', label: 'Resource Vault' },
];

export function Header({ activeTab, onTabChange, onShowAuth }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = user
    ? user.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-black tracking-tight leading-none">ExamGrid</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-none mt-0.5">Academic Command Center</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-black hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-xs font-bold">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-black leading-none">{user.full_name}</p>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">{user.target_exam}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-[slideDown_0.15s_ease-out]">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center text-sm font-bold">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-black">{user.full_name}</p>
                          <p className="text-xs text-gray-500">{user.target_exam}</p>
                        </div>
                      </div>
                      {user.isGuest && (
                        <div className="mt-2 px-2.5 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 font-medium">
                          Guest Mode — data won't persist
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        signOut();
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onShowAuth}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all"
            >
              Sign In
            </button>
          )}
        </div>

        <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
