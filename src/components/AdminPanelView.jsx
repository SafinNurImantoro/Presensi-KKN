import React, { useState, useEffect, useCallback } from 'react';
import { Download, Printer, Calendar, AlertCircle, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { db, getLocalDateString, getLocalMonthString } from '../lib/db';
import { MEMBERS } from '../lib/members';
import { useAuth } from '../contexts/auth-context';

export default function AdminPanelView() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="neo-card bg-brand-surface p-6 text-center">
        <h2 className="text-xl font-black">Akses Ditolak</h2>
        <p className="text-sm font-semibold text-brand-accent/70 mt-2">
          Rekapitulasi hanya dapat dibuka oleh koordinator atau sekretaris yang diberi peran admin.
        </p>
      </div>
    );
  }

  return <AdminPanelContent />;
}

function AdminPanelContent() {
  const [data, setData] = useState({ attendance: [], schedules: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected week for schedule inspector
  const [selectedMonth, setSelectedMonth] = useState(getLocalMonthString());
  const [selectedWeek, setSelectedWeek] = useState('1');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [year, month] = selectedMonth.split('-').map(Number);
      const summary = await db.getAdminSummary(year, month);
      setData(summary);
      setError(null);
    } catch (err) {
      console.error("Error loading admin summary:", err);
      setError("Gagal memuat rekap data admin.");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [selectedYear, selectedMonthNumber] = selectedMonth.split('-').map(Number);
  const selectedMonthLabel = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric'
  }).format(new Date(selectedYear, selectedMonthNumber - 1, 1));

  // Compute all unique dates present in the attendance database
  const getUniqueDates = () => {
    return [...new Set(data.attendance.map(item => item.date))].sort();
  };

  const uniqueDates = getUniqueDates();
  const totalDays = uniqueDates.length;

  // Calculate H, B, I, A, % for each member
  const getMemberStats = (name) => {
    let H = 0; // Hadir
    let B = 0; // Bekerja
    let I = 0; // Izin

    data.attendance.forEach(record => {
      if (record.member_name === name) {
        if (record.status === 'Hadir di Posko') H++;
        else if (record.status === 'Bekerja (Sesuai Jadwal)') B++;
        else if (record.status === 'Izin Darurat/Sakit') I++;
      }
    });

    // Alpha is any active date where the member did NOT check in
    const checkedInDates = data.attendance
      .filter(record => record.member_name === name)
      .map(record => record.date);

    let A = 0;
    uniqueDates.forEach(date => {
      if (!checkedInDates.includes(date)) {
        A++;
      }
    });

    const activeDaysCount = H + B + I + A;
    const percentage = activeDaysCount > 0
      ? Math.round(((H + B) / activeDaysCount) * 100)
      : 0;

    return { H, B, I, A, percentage };
  };

  // Excel Export Handler
  const handleExportExcel = () => {
    if (MEMBERS.length === 0) return;

    const dataToExport = MEMBERS.map((member, index) => {
      const stats = getMemberStats(member.name);
      return {
        'No': index + 1,
        'Nama': member.name,
        'Jabatan / Divisi': member.role,
        'Hadir (H)': stats.H,
        'Kerja (B)': stats.B,
        'Izin (I)': stats.I,
        'Alpha (A)': stats.A,
        'Persentase Kehadiran (%)': stats.percentage
      };
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Fit column widths
    const colWidths = [
      { wch: 5 },   // No
      { wch: 20 },  // Nama
      { wch: 20 },  // Jabatan
      { wch: 10 },  // H
      { wch: 10 },  // B
      { wch: 10 },  // I
      { wch: 10 },  // A
      { wch: 25 },  // %
    ];
    worksheet['!cols'] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Presensi KKN');

    // Trigger download
    XLSX.writeFile(
      workbook,
      `Laporan_Presensi_KKN_${selectedMonth}_${getLocalDateString()}.xlsx`
    );
  };

  // PDF Print Handler
  const handlePrintPDF = () => {
    window.print();
  };

  // Schedule Lookup for current selected week
  const getScheduleForMember = (name) => {
    const record = data.schedules.find(
      s => s.member_name === name && parseInt(s.week, 10) === parseInt(selectedWeek, 10)
    );
    return record || null;
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Loading State */}
      {loading && (
        <div className="bg-brand-surface border-2 border-brand-accent p-6 rounded-xl text-center font-bold no-print">
          Memuat data admin...
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded-xl font-bold flex items-center gap-2 no-print">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Tabulation Section */}
      {!loading && !error && (
        <div className="neo-card p-6 print-container bg-brand-surface">
          {/* Admin Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b-2 border-brand-accent pb-4">
            <div>
              <h2 className="text-2xl font-black text-brand-accent">
                Rekapitulasi Presensi {selectedMonthLabel}
              </h2>
              <p className="text-xs font-semibold text-brand-accent/60 mt-1">
                Total Hari Terdaftar: {totalDays} hari ({uniqueDates.join(', ') || 'Belum ada data'})
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 w-full md:w-auto no-print">
              <input
                type="month"
                min="2020-01"
                max="2100-12"
                value={selectedMonth}
                onChange={(e) => {
                  if (e.target.value) setSelectedMonth(e.target.value);
                }}
                aria-label="Pilih bulan rekapitulasi"
                className="neo-input py-2 px-3 text-xs sm:text-sm font-extrabold"
              />
              <button
                onClick={handleExportExcel}
                className="neo-btn neo-btn-accent px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5"
              >
                <Download size={16} />
                Export to Excel
              </button>
              <button
                onClick={handlePrintPDF}
                className="neo-btn neo-btn-primary px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5"
              >
                <Printer size={16} />
                Print / Save PDF
              </button>
            </div>
          </div>

          {/* Tabulation Table */}
          <div className="overflow-x-auto border-2 border-brand-accent rounded-xl bg-brand-surface">
            <table className="min-w-full divide-y-2 divide-brand-accent text-left text-sm font-bold">
              <thead className="bg-brand-bg text-brand-accent">
                <tr>
                  <th className="px-4 py-3 text-center border-r-2 border-brand-accent">No</th>
                  <th className="px-4 py-3 border-r-2 border-brand-accent">Nama Anggota</th>
                  <th className="px-4 py-3 border-r-2 border-brand-accent">Divisi / Jabatan</th>
                  <th className="px-3 py-3 text-center border-r-2 border-brand-accent bg-brand-green/10">H</th>
                  <th className="px-3 py-3 text-center border-r-2 border-brand-accent bg-brand-yellow/10">B</th>
                  <th className="px-3 py-3 text-center border-r-2 border-brand-accent bg-brand-pink/20">I</th>
                  <th className="px-3 py-3 text-center border-r-2 border-brand-accent bg-stone-100">A</th>
                  <th className="px-4 py-3 text-center">Kehadiran %</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-brand-accent/20 bg-brand-surface">
                {MEMBERS.map((member, index) => {
                  const stats = getMemberStats(member.name);
                  return (
                    <tr key={member.id} className="hover:bg-brand-bg/30">
                      <td className="px-4 py-3 text-center border-r-2 border-brand-accent/20">{index + 1}</td>
                      <td className="px-4 py-3 font-extrabold border-r-2 border-brand-accent/20">{member.name}</td>
                      <td className="px-4 py-3 font-medium text-brand-accent/70 border-r-2 border-brand-accent/20">{member.role}</td>
                      <td className="px-3 py-3 text-center font-extrabold border-r-2 border-brand-accent/20 bg-brand-green/5">{stats.H}</td>
                      <td className="px-3 py-3 text-center font-extrabold border-r-2 border-brand-accent/20 bg-brand-yellow/5">{stats.B}</td>
                      <td className="px-3 py-3 text-center font-extrabold border-r-2 border-brand-accent/20 bg-brand-pink/10">{stats.I}</td>
                      <td className="px-3 py-3 text-center font-extrabold border-r-2 border-brand-accent/20 bg-stone-50/50">{stats.A}</td>
                      <td className="px-4 py-3 text-center font-black">
                        <span className={`px-2 py-0.5 rounded border-2 ${stats.percentage >= 80
                            ? 'bg-brand-green/20 border-brand-green'
                            : stats.percentage >= 50
                              ? 'bg-brand-yellow/20 border-brand-yellow'
                              : 'bg-brand-pink border-brand-accent text-brand-accent'
                          }`}>
                          {stats.percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-xs font-semibold text-brand-accent/60 flex gap-4 justify-end no-print">
            <span><strong>H</strong>: Hadir di Posko</span>
            <span><strong>B</strong>: Bekerja (Jadwal)</span>
            <span><strong>I</strong>: Izin</span>
            <span><strong>A</strong>: Alpha (Absen)</span>
          </div>
        </div>
      )}

      {/* Weekly Schedule Inspector Section */}
      {!loading && !error && (
        <div className="neo-card p-6 bg-brand-surface no-print">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b-2 border-brand-accent pb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="text-brand-accent" size={22} />
                Inspeksi Jadwal Kerja Mingguan
              </h2>
              <p className="text-xs font-medium text-brand-accent/60 mt-0.5">
                Jadwal anggota periode {selectedMonthLabel}.
              </p>
            </div>

            {/* Week Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase">Periode:</span>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="neo-input py-1.5 px-3 text-xs font-extrabold appearance-none cursor-pointer"
              >
                <option value="1">Minggu 1</option>
                <option value="2">Minggu 2</option>
                <option value="3">Minggu 3</option>
                <option value="4">Minggu 4</option>
                <option value="5">Minggu 5</option>
              </select>
            </div>
          </div>

          {/* Grid display of weekly schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MEMBERS.map((member) => {
              const schedule = getScheduleForMember(member.name);
              return (
                <div key={member.id} className="border-2 border-brand-accent p-4 rounded-xl bg-brand-bg flex flex-col justify-between h-36">
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-extrabold text-sm truncate">{member.name}</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-brand-accent text-white rounded">
                        {member.role.split(' ')[0]}
                      </span>
                    </div>

                    {schedule ? (
                      <div className="mt-2 space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {schedule.days.map(d => (
                            <span key={d} className="text-[10px] font-extrabold bg-brand-pink px-1.5 py-0.2 rounded border border-brand-accent/30">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 text-xs font-bold text-brand-accent/40 italic">
                        Belum mengajukan jadwal
                      </div>
                    )}
                  </div>

                  {schedule && (
                    <div className="border-t border-brand-accent/20 pt-2 flex items-center gap-1 text-[10px] font-bold text-brand-accent/70 mt-2">
                      <Clock size={10} />
                      <span>{schedule.shift}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
