import React, { useEffect, useState } from 'react';
import { Calendar, User, Clock, FileText, CheckCircle, ShieldAlert } from 'lucide-react';
import { db, getLocalMonthString } from '../lib/db';
import { MEMBERS } from '../lib/members';
import { useAuth } from '../contexts/auth-context';

const DAYS_OF_WEEK = [
  'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
];

export default function InputFormView() {
  const { profile } = useAuth();
  const [selectedMember, setSelectedMember] = useState(profile?.member_name || '');
  const [formType, setFormType] = useState('attendance'); // 'attendance' or 'schedule'
  
  // Attendance state
  const [attendanceStatus, setAttendanceStatus] = useState('Hadir di Posko');
  const [notes, setNotes] = useState('');

  // Schedule state
  const [schedulePeriod, setSchedulePeriod] = useState(getLocalMonthString());
  const [week, setWeek] = useState('1');
  const [selectedDays, setSelectedDays] = useState([]);
  const [shift, setShift] = useState('08:00 - 17:00');

  // Submit Feedback
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message: '' }

  // Attendance lock state
  const [isAlreadyAttended, setIsAlreadyAttended] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (profile?.member_name) {
      setSelectedMember(profile.member_name);
    }
  }, [profile]);

  useEffect(() => {
    if (!selectedMember) {
      setIsAlreadyAttended(false);
      setSubmittedRecord(null);
      return;
    }

    const checkStatus = async () => {
      try {
        const todayAttendance = await db.getTodayAttendance();
        const record = todayAttendance.find(
          (r) => r.member_name === selectedMember
        );
        if (record) {
          setIsAlreadyAttended(true);
          setSubmittedRecord(record);
        } else {
          setIsAlreadyAttended(false);
          setSubmittedRecord(null);
        }
      } catch (err) {
        console.error('Gagal mengecek status presensi:', err);
      }
    };

    void checkStatus();
  }, [selectedMember]);

  const handleDayToggle = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) {
      setFeedback({ type: 'error', message: 'Silakan pilih nama Anda terlebih dahulu!' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const record = await db.submitAttendance(selectedMember, attendanceStatus, notes);
      setFeedback({
        type: 'success',
        message: `Presensi harian untuk ${selectedMember} berhasil dikirim!`
      });
      // Reset form partially
      setNotes('');
      setSubmittedRecord(record);
      setIsAlreadyAttended(true);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Gagal mengirim presensi harian.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) {
      setFeedback({ type: 'error', message: 'Silakan pilih nama Anda terlebih dahulu!' });
      return;
    }
    if (selectedDays.length === 0) {
      setFeedback({ type: 'error', message: 'Silakan pilih minimal satu hari kerja!' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const [periodYear, periodMonth] = schedulePeriod.split('-').map(Number);
      await db.submitSchedule(
        selectedMember,
        periodYear,
        periodMonth,
        week,
        selectedDays,
        shift
      );
      setFeedback({
        type: 'success',
        message: `Jadwal Week ${week} periode ${schedulePeriod} untuk ${selectedMember} berhasil disimpan!`
      });
      // Reset form partially
      setSelectedDays([]);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Gagal mengirim jadwal kerja mingguan.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
      <div className="neo-card p-6">
        <h2 className="text-2xl font-black mb-6 text-center border-b-2 border-brand-accent pb-4 flex items-center justify-center gap-2">
          {formType === 'attendance' ? '📝 Presensi Harian' : '📅 Jadwal Mingguan'}
        </h2>

        {/* Form Type Switcher */}
        <div className="flex bg-brand-bg border-2 border-brand-accent p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setFormType('attendance');
              setFeedback(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              formType === 'attendance'
                ? 'bg-brand-pink border-2 border-brand-accent text-brand-accent'
                : 'text-brand-accent/70 hover:text-brand-accent'
            }`}
          >
            Presensi Kehadiran Harian
          </button>
          <button
            type="button"
            onClick={() => {
              setFormType('schedule');
              setFeedback(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              formType === 'schedule'
                ? 'bg-brand-pink border-2 border-brand-accent text-brand-accent'
                : 'text-brand-accent/70 hover:text-brand-accent'
            }`}
          >
            Input Jadwal Mingguan
          </button>
        </div>

        {/* Feedback Messages */}
        {feedback && (
          <div 
            className={`p-4 rounded-xl border-2 mb-6 font-bold flex items-center gap-2 ${
              feedback.type === 'success' 
                ? 'bg-brand-green/20 border-brand-green text-brand-accent' 
                : 'bg-red-100 border-red-500 text-red-700'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle size={20} className="text-brand-green" /> : <ShieldAlert size={20} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Member Selector (Universal) */}
        <div className="mb-6">
          <label className="block text-sm font-extrabold uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <User size={16} /> Pilih Anggota KKN
          </label>
          {profile ? (
            <div className="w-full neo-input text-base font-bold py-3 bg-brand-pink/20">
              {profile.member_name} — identitas akun terverifikasi
            </div>
          ) : (
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full neo-input text-base font-bold appearance-none cursor-pointer py-3"
            >
              <option value="">-- Pilih Nama Anda --</option>
              {MEMBERS.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.id}. {m.name} ({m.role})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Form 1: Daily Attendance */}
        {formType === 'attendance' ? (
          isAlreadyAttended ? (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 border-2 border-brand-green bg-brand-green/10 rounded-2xl text-center">
                <div className="mx-auto w-12 h-12 rounded-full border-2 border-brand-green bg-brand-green/20 flex items-center justify-center mb-3 text-brand-accent">
                  <CheckCircle size={24} />
                </div>
                <h3 className="text-lg font-black text-brand-accent">Presensi Hari Ini Selesai</h3>
                <p className="text-xs font-semibold text-brand-accent/70 mt-1">
                  Anda sudah mengisi presensi untuk hari ini. Status tidak dapat diubah kembali demi keamanan data.
                </p>
              </div>

              {submittedRecord && (
                <div className="p-5 border-2 border-brand-accent bg-brand-bg rounded-2xl space-y-3 shadow-flat-sm">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-brand-accent/60 border-b border-brand-accent/10 pb-2">Rincian Presensi Anda:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-semibold text-brand-accent/60 text-xs block">Waktu Pengisian:</span>
                      <span className="font-extrabold">{new Date(submittedRecord.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                    </div>
                    <div>
                      <span className="font-semibold text-brand-accent/60 text-xs block">Status:</span>
                      <span className="font-extrabold">
                        {submittedRecord.status === 'Hadir di Posko' && '🏠 Hadir di Posko'}
                        {submittedRecord.status === 'Bekerja (Sesuai Jadwal)' && '🏃 Bekerja'}
                        {submittedRecord.status === 'Izin Darurat/Sakit' && '🤕 Izin/Sakit'}
                      </span>
                    </div>
                    {submittedRecord.notes && (
                      <div className="col-span-1 sm:col-span-2">
                        <span className="font-semibold text-brand-accent/60 text-xs block">Keterangan:</span>
                        <span className="font-medium italic">"{submittedRecord.notes}"</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleAttendanceSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-extrabold uppercase tracking-wide mb-3">
                  Status Kehadiran Hari Ini
                </label>
                
                <div className="grid grid-cols-1 gap-3">
                  {/* Option 1: Hadir */}
                  <button
                    type="button"
                    onClick={() => setAttendanceStatus('Hadir di Posko')}
                    className={`w-full text-left p-4 border-2 rounded-xl transition-all cursor-pointer flex justify-between items-center ${
                      attendanceStatus === 'Hadir di Posko'
                        ? 'border-brand-green bg-brand-green/10 ring-2 ring-brand-green'
                        : 'border-brand-accent bg-brand-surface hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-sm sm:text-base block">🏠 Hadir di Posko</span>
                      <span className="text-xs text-brand-accent/60 block mt-0.5">Standby, piket, atau berkegiatan di basecamp</span>
                    </div>
                    {attendanceStatus === 'Hadir di Posko' && (
                      <span className="w-5 h-5 rounded-full bg-brand-green border-2 border-brand-accent flex items-center justify-center text-xs font-black text-black">✓</span>
                    )}
                  </button>

                  {/* Option 2: Bekerja */}
                  <button
                    type="button"
                    onClick={() => setAttendanceStatus('Bekerja (Sesuai Jadwal)')}
                    className={`w-full text-left p-4 border-2 rounded-xl transition-all cursor-pointer flex justify-between items-center ${
                      attendanceStatus === 'Bekerja (Sesuai Jadwal)'
                        ? 'border-brand-yellow bg-brand-yellow/10 ring-2 ring-brand-yellow'
                        : 'border-brand-accent bg-brand-surface hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-sm sm:text-base block">🏃 Bekerja (Sesuai Jadwal)</span>
                      <span className="text-xs text-brand-accent/60 block mt-0.5">Menjalankan program kerja di luar posko</span>
                    </div>
                    {attendanceStatus === 'Bekerja (Sesuai Jadwal)' && (
                      <span className="w-5 h-5 rounded-full bg-brand-yellow border-2 border-brand-accent flex items-center justify-center text-xs font-black text-black">✓</span>
                    )}
                  </button>

                  {/* Option 3: Izin */}
                  <button
                    type="button"
                    onClick={() => setAttendanceStatus('Izin Darurat/Sakit')}
                    className={`w-full text-left p-4 border-2 rounded-xl transition-all cursor-pointer flex justify-between items-center ${
                      attendanceStatus === 'Izin Darurat/Sakit'
                        ? 'border-brand-accent bg-brand-pink ring-2 ring-brand-accent'
                        : 'border-brand-accent bg-brand-surface hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-sm sm:text-base block">🤕 Izin Darurat</span>
                      <span className="text-xs text-brand-accent/60 block mt-0.5">berhalangan hadir dengan alasan mendesak</span>
                    </div>
                    {attendanceStatus === 'Izin Darurat/Sakit' && (
                      <span className="w-5 h-5 rounded-full bg-brand-pink border-2 border-brand-accent flex items-center justify-center text-xs font-black text-brand-accent">✓</span>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-extrabold uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <FileText size={16} /> Keterangan Tambahan <span className="text-brand-accent/50 font-normal">(Opsional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Sakit demam, Izin ada acara keluarga mendadak, Bekerja di balai desa..."
                  rows={3}
                  className="w-full neo-input text-sm font-medium resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full neo-btn py-3 text-base font-extrabold neo-btn-accent shadow-flat disabled:opacity-50"
              >
                {submitting ? 'Mengirim...' : 'Kirim Presensi'}
              </button>
            </form>
          )
        ) : (
          /* Form 2: Weekly Schedule */
          <form onSubmit={handleScheduleSubmit} className="space-y-6">
            {/* Week Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-extrabold uppercase tracking-wide mb-2">
                  Bulan Jadwal
                </label>
                <input
                  type="month"
                  min="2020-01"
                  max="2100-12"
                  value={schedulePeriod}
                  onChange={(e) => setSchedulePeriod(e.target.value)}
                  className="w-full neo-input text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-extrabold uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Calendar size={16} /> Periode Minggu
                </label>
                <select
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  className="w-full neo-input text-sm font-bold appearance-none cursor-pointer"
                >
                  <option value="1">Minggu (Week) 1</option>
                  <option value="2">Minggu (Week) 2</option>
                  <option value="3">Minggu (Week) 3</option>
                  <option value="4">Minggu (Week) 4</option>
                  <option value="5">Minggu (Week) 5</option>
                </select>
              </div>

              {/* Shift Hours Input */}
              <div>
                <label className="block text-sm font-extrabold uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Clock size={16} /> Shift / Jam Kerja
                </label>
                <input
                  type="text"
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  placeholder="e.g. 08:00 - 17:00"
                  className="w-full neo-input text-sm font-bold"
                  required
                />
              </div>
            </div>

            {/* Days Multiselect */}
            <div>
              <label className="block text-sm font-extrabold uppercase tracking-wide mb-3">
                Pilih Hari Kerja Seminggu (Bisa Multi-select)
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-4 py-2 text-xs sm:text-sm font-bold border-2 rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-brand-pink text-brand-accent border-brand-accent translate-y-[1px] shadow-none'
                          : 'bg-brand-surface border-brand-accent hover:bg-stone-50 shadow-flat-sm'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full neo-btn py-3 text-base font-extrabold neo-btn-accent shadow-flat disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Jadwal Mingguan'}
            </button>
          </form>
        )}
      </div>

      <div className="bg-brand-surface border-2 border-brand-accent p-4 rounded-xl text-xs font-bold text-brand-accent/70 text-center">
        💡 <span className="underline">Tip KKN</span>: Presensi harian diisi setiap hari saat tiba di posko / memulai kegiatan. Jadwal kerja mingguan diajukan paling lambat setiap hari Minggu malam.
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="neo-card bg-brand-surface max-w-md w-full p-6 text-center relative border-2 border-brand-accent shadow-flat animate-fade-in">
            <div className="mx-auto w-16 h-16 rounded-2xl border-2 border-brand-accent bg-brand-green/30 flex items-center justify-center mb-4 text-brand-green">
              <CheckCircle size={32} className="text-brand-accent" />
            </div>
            <h3 className="text-2xl font-black mb-2 text-brand-accent">Presensi Berhasil!</h3>
            <p className="text-sm font-semibold text-brand-accent/80 mb-6">
              Anda telah berhasil mengisi presensi. Terima kasih telah melakukan presensi tepat waktu!
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="neo-btn neo-btn-accent px-8 py-3 text-sm cursor-pointer w-full"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
