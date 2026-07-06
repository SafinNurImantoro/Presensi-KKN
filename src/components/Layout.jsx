import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Layout({ children, currentTab, setCurrentTab }) {
  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'input', label: '📝 Presensi' },
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-accent pb-12 px-4 sm:px-6 lg:px-8">
      {/* Header Container */}
      <header className="max-w-6xl mx-auto pt-6 pb-4 no-print">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-brand-surface border-2 border-brand-accent p-6 rounded-2xl shadow-flat">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight select-none">
              POSKO <span className="bg-brand-pink px-2 py-0.5 rounded-lg border border-brand-accent">KKN</span>
            </h1>
            <p className="text-sm font-semibold text-brand-accent/80 mt-1">
              Sistem Presensi Harian Kelompok KKN
            </p>
          </div>
          
          {/* Status Badge */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
            <div 
              className="neo-badge bg-brand-yellow/20 text-brand-accent text-xs"
              title="Mode Local Storage - Data tersimpan di browser ini"
            >
              <AlertTriangle size={14} className="text-brand-yellow" />
              <span>Mode Demo</span>
            </div>
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
        <p>© 2026 KKN Kelompok Mandiri</p>
        <p className="mt-1 text-[10px] text-brand-accent/40">
          Data disimpan di perangkat ini (Browser Local Storage)
        </p>
      </footer>
    </div>
  );
}
