import React from 'react';
import { Wifi, AlertTriangle, LogOut, UserRound } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/db';
import { useAuth } from '../contexts/auth-context';

export default function Layout({ children, currentTab, setCurrentTab }) {
  const { profile, user, isAdmin, signOut } = useAuth();
  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'input', label: '📝 Presensi & Jadwal' },
    { id: 'admin', label: '⚙️ Admin Panel' },
  ].filter((tab) => tab.id !== 'admin' || isAdmin);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-accent pb-12 px-4 sm:px-6 lg:px-8">
      {/* Header Container */}
      <header className="max-w-6xl mx-auto pt-6 pb-4 no-print">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-brand-surface border-2 border-brand-accent p-6 rounded-2xl shadow-flat">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight select-none">
              POSKO SARIMULYA <span className="bg-brand-pink px-2 py-0.5 rounded-lg border border-brand-accent">KKN</span>
            </h1>
            <p className="text-sm font-semibold text-brand-accent/80 mt-1">
              Sistem Presensi & Penjadwalan Kelompok KKN
            </p>
          </div>
          
          {/* DB Connection Badge */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
            {isSupabaseConfigured && profile && (
              <div
                className="neo-badge bg-brand-pink/30 text-brand-accent text-xs"
                title={user?.email || ''}
              >
                <UserRound size={14} />
                <span>{profile.member_name}</span>
                {isAdmin && <span>• Admin</span>}
              </div>
            )}
            {isSupabaseConfigured ? (
              <div 
                className="neo-badge bg-brand-green/20 text-brand-accent text-xs" 
                title="Sistem terhubung ke database cloud Supabase dengan sinkronisasi waktu nyata."
              >
                <Wifi size={14} className="text-brand-green animate-pulse" />
                <span>Supabase Cloud Active</span>
              </div>
            ) : (
              <div 
                className="neo-badge bg-brand-yellow/20 text-brand-accent text-xs"
                title="Sistem berjalan dalam mode penyimpanan lokal (LocalStorage). Buat file .env dengan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY untuk menghubungkan ke Supabase."
              >
                <AlertTriangle size={14} className="text-brand-yellow" />
                <span>Local Storage Fallback</span>
              </div>
            )}
            {isSupabaseConfigured && (
              <button
                type="button"
                onClick={signOut}
                className="neo-btn px-3 py-1.5 text-xs flex items-center gap-1.5"
              >
                <LogOut size={14} />
                Keluar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="max-w-6xl mx-auto mb-8 no-print">
        <div className="flex border-2 border-brand-accent rounded-2xl p-1 bg-brand-accent gap-1">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex-1 py-3 text-center font-bold text-sm sm:text-base rounded-xl transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-brand-pink text-brand-accent border-2 border-brand-accent translate-y-[-2px] shadow-flat-sm'
                    : 'bg-transparent text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto">
        <div className="print-container">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto mt-12 text-center text-xs font-bold text-brand-accent/60 no-print">
        <p>© 2026 KKN DESA SARIMULYA</p>
        {!isSupabaseConfigured && (
          <p className="mt-1 text-[10px] text-brand-accent/40">
           
          </p>
        )}
      </footer>
    </div>
  );
}
