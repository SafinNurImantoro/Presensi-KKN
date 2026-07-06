import { createClient } from '@supabase/supabase-js';

// Helper to get local date in YYYY-MM-DD format
export const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalMonthString = () => getLocalDateString().slice(0, 7);

const normalizePeriod = (year, month) => {
  const periodYear = Number.parseInt(year, 10);
  const periodMonth = Number.parseInt(month, 10);

  if (
    !Number.isInteger(periodYear) ||
    periodYear < 2020 ||
    periodYear > 2100 ||
    !Number.isInteger(periodMonth) ||
    periodMonth < 1 ||
    periodMonth > 12
  ) {
    throw new Error('Periode tahun dan bulan tidak valid.');
  }

  return { periodYear, periodMonth };
};

const getMonthBounds = (year, month) => {
  const { periodYear, periodMonth } = normalizePeriod(year, month);
  const start = `${periodYear}-${String(periodMonth).padStart(2, '0')}-01`;
  const nextYear = periodMonth === 12 ? periodYear + 1 : periodYear;
  const nextMonth = periodMonth === 12 ? 1 : periodMonth + 1;
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  return { start, end, periodYear, periodMonth };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasPlaceholderValue = (value) =>
  !value ||
  value.includes('your-project') ||
  value.includes('your-anon-key') ||
  value.includes('PROJECT-ID') ||
  value.includes('ANON-PUBLISHABLE-KEY');

const hasValidSupabaseUrl = (() => {
  if (hasPlaceholderValue(supabaseUrl)) return false;
  try {
    return new URL(supabaseUrl).protocol === 'https:';
  } catch {
    return false;
  }
})();

export const isSupabaseConfigured =
  hasValidSupabaseUrl && !hasPlaceholderValue(supabaseAnonKey);

// Local storage is an explicit, development-only mode. It can never be
// enabled in a Vite production build, even if the environment flag is set.
export const isLocalDemoEnabled =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_LOCAL_DEMO === 'true';

export const databaseConfigurationError = isSupabaseConfigured
  ? null
  : 'Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY yang valid.';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Preserve legacy local schedules without creating any sample records.
const migrateLocalStorage = () => {
  // Preserve legacy schedules by assigning them to their creation month.
  const schedules = JSON.parse(localStorage.getItem('kkn_schedules') || '[]');
  let schedulesChanged = false;
  const migratedSchedules = schedules.map((schedule) => {
    if (schedule.period_year && schedule.period_month) return schedule;

    const createdAt = new Date(schedule.created_at);
    const validCreatedAt = !Number.isNaN(createdAt.getTime());
    schedulesChanged = true;
    return {
      ...schedule,
      period_year: validCreatedAt ? createdAt.getFullYear() : new Date().getFullYear(),
      period_month: validCreatedAt ? createdAt.getMonth() + 1 : new Date().getMonth() + 1
    };
  });

  if (schedulesChanged) {
    localStorage.setItem('kkn_schedules', JSON.stringify(migratedSchedules));
  }
};

if (isLocalDemoEnabled) {
  migrateLocalStorage();
}

const requireLocalDemo = () => {
  if (!isLocalDemoEnabled) {
    throw new Error(databaseConfigurationError);
  }
};

// DATABASE API
export const db = {
  async getTodayAttendance() {
    if (isSupabaseConfigured) {
      const today = getLocalDateString();
      const { data, error } = await supabase
        .from('kkn_attendance')
        .select('*')
        .eq('date', today);
      if (error) throw error;
      return data;
    } else {
      const today = getLocalDateString();
      const attendance = JSON.parse(localStorage.getItem('kkn_attendance') || '[]');
      return attendance.filter(item => item.date === today);
    }
  },

  async submitAttendance(memberName, status, notes = '') {
    if (isSupabaseConfigured) {
      const today = getLocalDateString();
      // Try to upsert or update. Check if record exists for today.
      const { data: existing } = await supabase
        .from('kkn_attendance')
        .select('id')
        .eq('member_name', memberName)
        .eq('date', today)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('kkn_attendance')
          .update({ status, notes, created_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select();
        if (error) throw error;
        return data[0];
      } else {
        const { data, error } = await supabase
          .from('kkn_attendance')
          .insert([{ member_name: memberName, date: today, status, notes, created_at: new Date().toISOString() }])
          .select();
        if (error) throw error;
        return data[0];
      }
    } else {
      const today = getLocalDateString();
      const attendance = JSON.parse(localStorage.getItem('kkn_attendance') || '[]');
      const existingIndex = attendance.findIndex(item => item.member_name === memberName && item.date === today);
      
      const record = {
        id: existingIndex !== -1 ? attendance[existingIndex].id : String(Date.now()),
        member_name: memberName,
        date: today,
        status,
        notes,
        created_at: new Date().toISOString()
      };

      if (existingIndex !== -1) {
        attendance[existingIndex] = record;
      } else {
        attendance.push(record);
      }
      localStorage.setItem('kkn_attendance', JSON.stringify(attendance));
      return record;
    }
  },

  async getSchedules(year, month, week) {
    const { periodYear, periodMonth } = normalizePeriod(year, month);
    const weekNum = parseInt(week, 10);
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('kkn_schedules')
        .select('*')
        .eq('period_year', periodYear)
        .eq('period_month', periodMonth)
        .eq('week', weekNum);
      if (error) throw error;
      return data;
    } else {
      const schedules = JSON.parse(localStorage.getItem('kkn_schedules') || '[]');
      return schedules.filter(item =>
        parseInt(item.period_year, 10) === periodYear &&
        parseInt(item.period_month, 10) === periodMonth &&
        parseInt(item.week, 10) === weekNum
      );
    }
  },

  async submitSchedule(memberName, year, month, week, days, shift) {
    const { periodYear, periodMonth } = normalizePeriod(year, month);
    const weekNum = parseInt(week, 10);
    if (isSupabaseConfigured) {
      // Upsert based on member_name and the selected monthly week.
      const { data: existing } = await supabase
        .from('kkn_schedules')
        .select('id')
        .eq('member_name', memberName)
        .eq('period_year', periodYear)
        .eq('period_month', periodMonth)
        .eq('week', weekNum)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('kkn_schedules')
          .update({ days, shift, created_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select();
        if (error) throw error;
        return data[0];
      } else {
        const { data, error } = await supabase
          .from('kkn_schedules')
          .insert([{
            member_name: memberName,
            period_year: periodYear,
            period_month: periodMonth,
            week: weekNum,
            days,
            shift,
            created_at: new Date().toISOString()
          }])
          .select();
        if (error) throw error;
        return data[0];
      }
    } else {
      const schedules = JSON.parse(localStorage.getItem('kkn_schedules') || '[]');
      const existingIndex = schedules.findIndex(item =>
        item.member_name === memberName &&
        parseInt(item.period_year, 10) === periodYear &&
        parseInt(item.period_month, 10) === periodMonth &&
        parseInt(item.week, 10) === weekNum
      );
      
      const record = {
        id: existingIndex !== -1 ? schedules[existingIndex].id : String(Date.now()),
        member_name: memberName,
        period_year: periodYear,
        period_month: periodMonth,
        week: weekNum,
        days,
        shift,
        created_at: new Date().toISOString()
      };

      if (existingIndex !== -1) {
        schedules[existingIndex] = record;
      } else {
        schedules.push(record);
      }
      localStorage.setItem('kkn_schedules', JSON.stringify(schedules));
      return record;
    }
  },

  // Returns all attendance records and schedule records to compute statistics
  async getAdminSummary(year, month) {
    const { start, end, periodYear, periodMonth } = getMonthBounds(year, month);
    if (isSupabaseConfigured) {
      const { data: attendance, error: attError } = await supabase
        .from('kkn_attendance')
        .select('*')
        .gte('date', start)
        .lt('date', end);
      if (attError) throw attError;

      const { data: schedules, error: schedError } = await supabase
        .from('kkn_schedules')
        .select('*')
        .eq('period_year', periodYear)
        .eq('period_month', periodMonth);
      if (schedError) throw schedError;

      return { attendance, schedules };
    } else {
      const attendance = JSON.parse(localStorage.getItem('kkn_attendance') || '[]')
        .filter(item => item.date >= start && item.date < end);
      const schedules = JSON.parse(localStorage.getItem('kkn_schedules') || '[]')
        .filter(item =>
          parseInt(item.period_year, 10) === periodYear &&
          parseInt(item.period_month, 10) === periodMonth
        );
      return { attendance, schedules };
    }
  }
};
