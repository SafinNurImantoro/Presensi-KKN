import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, Briefcase, ShieldAlert } from 'lucide-react';
import { db } from '../lib/db';
import { MEMBERS } from '../lib/members';

export default function DashboardView() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Fetch data function
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

  // Poll database every 30 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Tick seconds since last update
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Calculations for stats
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

  // Helper to format live-update label
  const getLiveText = () => {
    if (secondsAgo < 5) return 'Updated just now';
    if (secondsAgo < 60) return `Updated ${secondsAgo}s ago`;
    return `Updated ${Math.floor(secondsAgo / 60)}m ago`;
  };

  // Helper to get status details
  const getStatusBadge = (memberName) => {
    const record = attendance.find(r => r.member_name === memberName);
    
    if (!record) {
      return {
        text: 'Belum Presensi',
        classes: 'bg-stone-100 text-stone-500 border-stone-300',
        note: null
      };
    }

    switch (record.status) {
      case 'Hadir di Posko':
        return {
          text: 'Hadir di Posko',
          classes: 'bg-brand-green/20 text-brand-accent border-brand-green',
          note: record.notes
        };
      case 'Bekerja (Sesuai Jadwal)':
        return {
          text: 'Bekerja (Jadwal)',
          classes: 'bg-brand-yellow/20 text-brand-accent border-brand-yellow',
          note: record.notes
        };
      case 'Izin Darurat/Sakit':
        return {
          text: 'Izin / Sakit',
          classes: 'bg-brand-pink text-brand-accent border-brand-accent',
          note: record.notes
        };
      default:
        return {
          text: record.status,
          classes: 'bg-stone-200 text-brand-accent border-brand-accent',
          note: record.notes
        };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Live Polling Status Row */}
      <div className="flex justify-between items-center bg-brand-surface border-2 border-brand-accent p-4 rounded-xl shadow-flat-sm no-print">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-green"></span>
          </span>
          <span className="text-sm font-bold tracking-wide">
            {getLiveText()}
          </span>
        </div>
        
        <button
          onClick={fetchData}
          disabled={loading}
          className="neo-btn px-4 py-2 text-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={12} className={`${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Mengunduh...' : 'Segarkan'}
        </button>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <div className="neo-card p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-accent/60">Hadir di Posko</p>
            <h3 className="text-4xl font-black mt-1 text-brand-accent">{stats.present}</h3>
            <p className="text-xs font-medium text-brand-accent/80 mt-1">Anggota standby di basecamp</p>
          </div>
          <div className="bg-brand-green/20 border-2 border-brand-accent p-4 rounded-xl text-brand-accent">
            <CheckCircle2 size={32} />
          </div>
        </div>

        <div className="neo-card p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-accent/60">Bekerja Lapangan</p>
            <h3 className="text-4xl font-black mt-1 text-brand-accent">{stats.working}</h3>
            <p className="text-xs font-medium text-brand-accent/80 mt-1">Melakukan program kerja luar</p>
          </div>
          <div className="bg-brand-yellow/20 border-2 border-brand-accent p-4 rounded-xl text-brand-accent">
            <Briefcase size={32} />
          </div>
        </div>

        <div className="neo-card p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-accent/60">Izin / Sakit</p>
            <h3 className="text-4xl font-black mt-1 text-brand-accent">{stats.sick}</h3>
            <p className="text-xs font-medium text-brand-accent/80 mt-1">Berhalangan hadir hari ini</p>
          </div>
          <div className="bg-brand-pink border-2 border-brand-accent p-4 rounded-xl text-brand-accent">
            <ShieldAlert size={32} />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded-xl font-bold text-center">
          {error}
        </div>
      )}

      {/* Live Feed List */}
      <div className="neo-card p-6">
        <div className="flex justify-between items-center mb-6 border-b-2 border-brand-accent pb-4">
          <div>
            <h2 className="text-xl font-bold">Daftar Kehadiran Hari Ini</h2>
            <p className="text-xs font-medium text-brand-accent/60 mt-0.5">
              Tanggal: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="neo-badge bg-brand-surface py-1 text-xs">
            {attendance.length} / {MEMBERS.length} Presensi
          </div>
        </div>

        <div className="divide-y-2 divide-brand-accent/10">
          {MEMBERS.map((member) => {
            const badge = getStatusBadge(member.name);
            return (
              <div 
                key={member.id} 
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-brand-bg/50 px-2 rounded-xl transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  {/* Sequence number */}
                  <span className="w-6 h-6 flex items-center justify-center bg-brand-accent text-white font-extrabold text-xs rounded-full">
                    {member.id}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-base flex items-center gap-2">
                      {member.name}
                      <span className="text-xs font-bold text-brand-accent/60 bg-brand-pink/30 px-2 py-0.5 rounded border border-brand-accent/30">
                        {member.role}
                      </span>
                    </h4>
                    {/* Render optional note if present */}
                    {badge.note && (
                      <p className="text-xs font-medium text-brand-accent/70 mt-1 flex items-start gap-1">
                        <span className="italic">"{badge.note}"</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="self-end sm:self-center">
                  <span className={`neo-badge ${badge.classes}`}>
                    {badge.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
