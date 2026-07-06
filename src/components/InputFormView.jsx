import React, { useState } from 'react';
import { User, CheckCircle, ShieldAlert } from 'lucide-react';
import { db } from '../lib/db';
import { MEMBERS } from '../lib/members';

export default function InputFormView() {
  const [selectedMember, setSelectedMember] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('Hadir di Posko');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) {
      setFeedback({ type: 'error', message: 'Silakan pilih nama Anda terlebih dahulu!' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      await db.submitAttendance(selectedMember, attendanceStatus, notes);
      setFeedback({
        type: 'success',
        message: `✅ Presensi ${selectedMember} berhasil dicatat!`
      });
      setNotes('');
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: '❌ Gagal mencatat presensi.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="neo-card p-8">
        <h2 className="text-3xl font-black mb-8 text-center border-b-2 border-brand-accent pb-6 flex items-center justify-center gap-3">
          <span className="text-4xl">📝</span> Input Presensi Harian
        </h2>

        {feedback && (
          <div 
            className={`p-4 rounded-xl border-2 mb-6 font-bold flex items-center gap-2 ${
              feedback.type === 'success' 
                ? 'bg-brand-green/20 border-brand-green text-brand-accent' 
                : 'bg-red-100 border-red-500 text-red-700'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle size={20} className="text-brand-green" />
            ) : (
              <ShieldAlert size={20} />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-extrabold uppercase tracking-wide mb-3 flex items-center gap-2">
              <User size={18} /> Pilih Nama Anggota
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full neo-input text-base font-bold appearance-none cursor-pointer py-4 px-4"
              required
            >
              <option value="">-- Pilih Nama Anda --</option>
              {MEMBERS.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} • {m.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-extrabold uppercase tracking-wide mb-3">
              Status Kehadiran
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAttendanceStatus('Hadir di Posko')}
                className={`p-4 border-2 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-2 font-bold ${
                  attendanceStatus === 'Hadir di Posko'
                    ? 'bg-brand-green/30 border-brand-green text-brand-accent'
                    : 'bg-brand-surface border-brand-accent text-brand-accent/70 hover:border-brand-green'
                }`}
              >
                <span className="text-2xl">✅</span>
                <span>Hadir di Posko</span>
              </button>

              <button
                type="button"
                onClick={() => setAttendanceStatus('Bekerja (Sesuai Jadwal)')}
                className={`p-4 border-2 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-2 font-bold ${
                  attendanceStatus === 'Bekerja (Sesuai Jadwal)'
                    ? 'bg-brand-yellow/30 border-brand-yellow text-brand-accent'
                    : 'bg-brand-surface border-brand-accent text-brand-accent/70 hover:border-brand-yellow'
                }`}
              >
                <span className="text-2xl">🏗️</span>
                <span>Bekerja Lapangan</span>
              </button>

              <button
                type="button"
                onClick={() => setAttendanceStatus('Izin Darurat/Sakit')}
                className={`p-4 border-2 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-2 font-bold ${
                  attendanceStatus === 'Izin Darurat/Sakit'
                    ? 'bg-brand-pink/30 border-brand-pink text-brand-accent'
                    : 'bg-brand-surface border-brand-accent text-brand-accent/70 hover:border-brand-pink'
                }`}
              >
                <span className="text-2xl">🚫</span>
                <span>Izin / Sakit</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-extrabold uppercase tracking-wide mb-3">
              Catatan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Bekerja di lapangan desa bersama Tim PDD"
              className="w-full neo-input text-base font-medium p-4 resize-none h-24"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedMember}
            className="w-full neo-btn neo-btn-primary py-4 text-lg font-black uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '⏳ Menyimpan...' : '✅ Kirim Presensi'}
          </button>
        </form>
      </div>

      <div className="neo-card p-6 bg-brand-yellow/10 border-2 border-brand-yellow">
        <p className="text-sm font-bold text-brand-accent">
          💡 <strong>Catatan:</strong> Presensi hanya dapat dicatat sekali per hari. Data disimpan di browser Anda.
        </p>
      </div>
    </div>
  );
}
