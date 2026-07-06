import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, Download } from 'lucide-react';
import { db } from '../lib/db';
import { MEMBERS } from '../lib/members';

export default function DashboardView() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await db.getTodayAttendance();
      setAttendance(data);
      setLastUpdated(Date.now());
      setSecondsAgo(0);
      setError(null);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError("Gagal memperbarui data presensi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  const getStats = () => {
    let present = 0;
    let working = 0;
    let sick = 0;
    
    attendance.forEach(record => {
      if (record.status === 'Hadir di Posko') present++;
      else if (record.status === 'Bekerja (Sesuai Jadwal)') working++;
      else if (record.status === 'Izin Darurat/Sakit') sick++;
    });

    const notCheckedIn = MEMBERS.length - (present + working + sick);
    return { present, working, sick, notCheckedIn };
  };

  const stats = getStats();

  const getLiveText = () => {
    if (secondsAgo < 5) return 'Baru saja';
    if (secondsAgo < 60) return `${secondsAgo}s yang lalu`;
    return `${Math.floor(secondsAgo / 60)}m yang lalu`;
  };

  const getStatusBadge = (memberName) => {
    const record = attendance.find(r => r.member_name === memberName);
    
    if (!record) {
      return {
        text: 'Belum Presensi',
        classes: 'bg-stone-100 text-stone-500 border-stone-300',
        note: null,
        icon: '⏳'
      };
    }

    switch (record.status) {
      case 'Hadir di Posko':
        return {
          text: 'Hadir',
          classes: 'bg-brand-green/20 text-brand-accent border-brand-green',
          note: record.notes,
          icon: '✅'
        };
      case 'Bekerja (Sesuai Jadwal)':
        return {
          text: 'Bekerja',
          classes: 'bg-brand-yellow/20 text-brand-accent border-brand-yellow',
          note: record.notes,
          icon: '🏗️'
        };
      case 'Izin Darurat/Sakit':
        return {
          text: 'Izin / Sakit',
          classes: 'bg-brand-pink/20 text-brand-accent border-brand-pink',
          note: record.notes,
          icon: '🚫'
        };
      default:
        return {
          text: record.status,
          classes: 'bg-stone-200 text-brand-accent border-brand-accent',
          note: record.notes,
          icon: '❓'
        };
    }
  };

  const handleExport = () => {
    const today = new Date().toLocaleDateString('id-ID');
    const csvContent = [
      ['PRESENSI KKN', today].join(' | '),
      ['Nama', 'Status', 'Catatan'],
      ...MEMBERS.map(member => {
        const record = attendance.find(r => r.member_name === member.name);
        return [
          member.name,
          record?.status || 'Belum Presensi',
          record?.notes || ''
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Presensi-${today.replace(/\//g, '-')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center bg-brand-surface border-2 border-brand-accent p-4 rounded-xl shadow-flat-sm no-print">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-green"></span>
          </span>
          <span className="text-sm font-bold tracking-wide">
            Diperbarui {getLiveText()}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="neo-btn px-4 py-2 text-xs flex items-center gap-1.5 active:scale-95"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="neo-btn px-4 py-2 text-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={12} className={`${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Update...' : 'Segarkan'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
        <div className="neo-card p-6 flex flex-col items-center justify-center text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-accent/60">Hadir Posko</p>
          <h3 className="text-4xl font-black text-brand-accent">{stats.present}</h3>
        </div>

        <div className="neo-card p-6 flex flex-col items-center justify-center text-center">
          <div className="text-3xl mb-2">🏗️</div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-accent/60">Bekerja Lapangan</p>
          <h3 className="text-4xl font-black text-brand-accent">{stats.working}</h3>
        </div>

        <div className="neo-card p-6 flex flex-col items-center justify-center text-center">
          <div className="text-3xl mb-2">🚫</div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-accent/60">Izin / Sakit</p>
          <h3 className="text-4xl font-black text-brand-accent">{stats.sick}</h3>
        </div>

        <div className="neo-card p-6 flex flex-col items-center justify-center text-center">
          <div className="text-3xl mb-2">⏳</div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-accent/60">Belum Presensi</p>
          <h3 className="text-4xl font-black text-brand-accent">{stats.notCheckedIn}</h3>
        </div>
      </div>

      {error && (
        <div className="neo-card p-4 bg-red-100 border-2 border-red-500 text-red-700 font-bold flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="neo-card p-6">
        <h3 className="text-lg font-black mb-6 border-b-2 border-brand-accent pb-4">
          📋 Daftar Presensi Hari Ini ({MEMBERS.length} Anggota)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MEMBERS.map((member) => {
            const status = getStatusBadge(member.name);
            return (
              <div 
                key={member.id} 
                className={`p-4 border-2 rounded-xl flex justify-between items-start ${status.classes}`}
              >
                <div className="flex-1">
                  <p className="font-bold text-sm">{status.icon} {member.name}</p>
                  <p className="text-xs opacity-70 mt-0.5">{member.role}</p>
                  {status.note && (
                    <p className="text-xs mt-2 font-medium italic">"{status.note}"</p>
                  )}
                </div>
                <span className="text-xs font-bold whitespace-nowrap ml-2 px-2 py-1 bg-black/10 rounded">
                  {status.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
