import React, { useState } from 'react';
import Layout from './components/Layout';
import DashboardView from './components/DashboardView';
import InputFormView from './components/InputFormView';
import AdminPanelView from './components/AdminPanelView';
import LoginView from './components/LoginView';
import { useAuth } from './contexts/auth-context';
import { isSupabaseConfigured } from './lib/db';

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const { session, profile, loading, error, isAdmin, signOut } = useAuth();

  if (isSupabaseConfigured && loading) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-accent flex items-center justify-center p-6">
        <div className="neo-card bg-brand-surface p-6 font-extrabold">
          Memeriksa sesi anggota...
        </div>
      </div>
    );
  }

  if (isSupabaseConfigured && !session) {
    return <LoginView />;
  }

  if (isSupabaseConfigured && (!profile || !profile.is_active)) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-accent flex items-center justify-center p-6">
        <div className="neo-card bg-brand-surface w-full max-w-md p-6 text-center">
          <h1 className="text-xl font-black">Akun Belum Terdaftar</h1>
          <p className="text-sm font-semibold text-brand-accent/70 my-4">
            {error || 'Akun login ini belum dihubungkan ke profil anggota KKN yang aktif.'}
          </p>
          <button onClick={signOut} className="neo-btn neo-btn-primary px-5 py-2">
            Keluar
          </button>
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'input':
        return <InputFormView />;
      case 'admin':
        return isAdmin ? <AdminPanelView /> : <DashboardView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {renderActiveView()}
    </Layout>
  );
}

export default App;
