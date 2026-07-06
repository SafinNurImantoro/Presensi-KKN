import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import DashboardView from './components/DashboardView';
import InputFormView from './components/InputFormView';
import AdminPanelView from './components/AdminPanelView';
import LoginView from './components/LoginView';
import { useAuth } from './contexts/auth-context';
import { db, isSupabaseConfigured } from './lib/db';
import { AlertTriangle } from 'lucide-react';

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [showAttendanceAlert, setShowAttendanceAlert] = useState(false);
  const { session, profile, loading, error, isAdmin, signOut } = useAuth();

  useEffect(() => {
    if (isSupabaseConfigured && profile && profile.is_active) {
      const checkAttendance = async () => {
        try {
          const todayAttendance = await db.getTodayAttendance();
          const hasAttended = todayAttendance.some(
            (record) => record.member_name === profile.member_name
          );
          if (!hasAttended) {
            setShowAttendanceAlert(true);
          }
        } catch (err) {
          console.error('Gagal mengecek presensi harian:', err);
        }
      };
      void checkAttendance();
    } else {
      setShowAttendanceAlert(false);
    }
  }, [profile]);

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

      {/* Attendance Alert Modal */}
      {showAttendanceAlert && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="neo-card bg-brand-surface max-w-md w-full p-6 text-center relative border-2 border-brand-accent shadow-flat animate-fade-in">
            <div className="absolute top-3 right-3">
              <button 
                onClick={() => setShowAttendanceAlert(false)}
                className="w-8 h-8 rounded-full border-2 border-brand-accent flex items-center justify-center font-bold hover:bg-brand-pink/50 cursor-pointer text-brand-accent"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <div className="mx-auto w-16 h-16 rounded-2xl border-2 border-brand-accent bg-brand-yellow/30 flex items-center justify-center mb-4 text-brand-accent">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-2xl font-black mb-2 text-brand-accent">Belum Presensi Hari Ini!</h3>
            <p className="text-sm font-semibold text-brand-accent/80 mb-6">
              Halo <span className="text-brand-accent font-extrabold">{profile?.member_name}</span>, Anda belum mengisi presensi kehadiran untuk hari ini. Silakan isi presensi terlebih dahulu.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setCurrentTab('input');
                  setShowAttendanceAlert(false);
                }}
                className="neo-btn neo-btn-accent px-6 py-3 text-sm flex-1 cursor-pointer"
              >
                📝 Isi Presensi Sekarang
              </button>
              <button
                onClick={() => setShowAttendanceAlert(false)}
                className="neo-btn px-6 py-3 text-sm flex-1 hover:bg-stone-50 cursor-pointer"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;
