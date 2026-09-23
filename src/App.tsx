import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { AuthModal } from '@/components/AuthModal';
import { Dashboard } from '@/components/Dashboard';
import { FocusEngine } from '@/components/FocusEngine';
import { ResourceVault } from '@/components/ResourceVault';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuth, setShowAuth] = useState(false);

  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading ExamGrid...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeTab={activeTab} onTabChange={setActiveTab} onShowAuth={() => setShowAuth(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'focus' && <FocusEngine />}
        {activeTab === 'vault' && <ResourceVault />}
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-8 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">ExamGrid · Student Life OS & Academic Command Center</p>
          <p className="text-xs text-gray-400">Built for focused students</p>
        </div>
      </footer>

      {showAuth && !user && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}

export default App;
