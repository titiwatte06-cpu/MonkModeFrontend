import { useCallback, useEffect, useMemo, useState } from 'react';
import { getActivities, getActivityHistory } from '../api/activities';
import { getBangkokDateKey } from '../utils/date';

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatMonthLabel(year, month) {
  const date = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00+07:00`);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  }).format(date);
}

function getBangkokWeekdayIndex(year, month, day) {
  const date = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00+07:00`);
  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'Asia/Bangkok',
  }).format(date);

  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(weekday);
}

function getMonthDateKeys(year, month) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });
}

function getMonthCalendar(year, month) {
  const initialOffset = getBangkokWeekdayIndex(year, month, 1);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const weeks = [];
  let week = Array(7).fill(null);
  let dayIndex = initialOffset;

  for (let day = 1; day <= daysInMonth; day += 1) {
    week[dayIndex] = {
      day,
      dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    };

    if (dayIndex === 6) {
      weeks.push(week);
      week = Array(7).fill(null);
      dayIndex = 0;
      continue;
    }

    dayIndex += 1;
  }

  if (week.some(Boolean)) {
    weeks.push(week);
  }

  return weeks;
}

function ConsistencyTable() {
  const todayKey = getBangkokDateKey();
  const [currentYear, currentMonth] = todayKey.split('-').map(Number);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonthValue, setSelectedMonthValue] = useState(currentMonth);
  const [activities, setActivities] = useState([]);
  const [historyByDate, setHistoryByDate] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const dateKeys = useMemo(
    () => getMonthDateKeys(selectedYear, selectedMonthValue),
    [selectedYear, selectedMonthValue],
  );

  const calendarWeeks = useMemo(
    () => getMonthCalendar(selectedYear, selectedMonthValue),
    [selectedYear, selectedMonthValue],
  );

  const isCurrentMonth = selectedYear === currentYear && selectedMonthValue === currentMonth;
  const currentDay = Number(todayKey.slice(-2));

  const loadConsistency = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [activityList, ...histories] = await Promise.all([
        getActivities(),
        ...dateKeys.map((dateKey) => getActivityHistory(dateKey)),
      ]);

      const historyMap = dateKeys.reduce((map, dateKey, index) => {
        map[dateKey] = histories[index] || [];
        return map;
      }, {});

      setActivities(activityList || []);
      setHistoryByDate(historyMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load consistency data right now.');
    } finally {
      setIsLoading(false);
    }
  }, [dateKeys]);

  useEffect(() => {
    void loadConsistency();
  }, [loadConsistency]);

  const activitiesById = useMemo(
    () => new Map(activities.map((activity) => [activity.id, activity.name])),
    [activities],
  );

  const getCheckedCount = (dateKey) => {
    const entries = historyByDate[dateKey] || [];
    return entries.filter((entry) => entry.checkedIn).length;
  };

  const getCheckedActivityNames = (dateKey) => {
    const entries = historyByDate[dateKey] || [];
    return entries
      .filter((entry) => entry.checkedIn)
      .map((entry) => activitiesById.get(entry.id) || entry.name || `#${entry.id}`);
  };

  const dayHasCheck = (dateKey) => getCheckedCount(dateKey) > 0;

  const totalCheckups = dateKeys.reduce((sum, dateKey) => sum + getCheckedCount(dateKey), 0);
  const checkedDays = dateKeys.filter((dateKey) => dayHasCheck(dateKey)).length;

  const computeMonthStreak = () => {
    const lastDay = isCurrentMonth ? currentDay : dateKeys.length;
    let streak = 0;

    for (let day = lastDay; day >= 1; day -= 1) {
      const dateKey = `${selectedYear}-${String(selectedMonthValue).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (!dayHasCheck(dateKey)) {
        break;
      }

      streak += 1;
    }

    return streak;
  };

  const currentStreak = computeMonthStreak();

  const goToPreviousMonth = () => {
    if (selectedMonthValue === 1) {
      setSelectedMonthValue(12);
      setSelectedYear(selectedYear - 1);
      return;
    }
    setSelectedMonthValue(selectedMonthValue - 1);
  };

  const goToNextMonth = () => {
    if (!isCurrentMonth) {
      if (selectedMonthValue === 12) {
        setSelectedMonthValue(1);
        setSelectedYear(selectedYear + 1);
        return;
      }
      setSelectedMonthValue(selectedMonthValue + 1);
    }
  };

  const canGoNext = !isCurrentMonth;

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[#1b1b1b] bg-[#111111] p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Consistency check</p>
        <h2 className="mt-4 text-4xl font-heading uppercase tracking-[0.16em] text-white sm:text-5xl">
          Monthly consistency calendar
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
          Review your logged checkups across a full month. Navigate back to prior months and compare how many times you checked in.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Activities</p>
            <p className="mt-3 text-3xl font-heading text-white">{activities.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Checked days</p>
            <p className="mt-3 text-3xl font-heading text-amber-400">{checkedDays}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Total checkups</p>
            <p className="mt-3 text-3xl font-heading text-amber-400">{totalCheckups}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Month streak</p>
            <p className="mt-3 text-3xl font-heading text-amber-400">{currentStreak}</p>
          </div>
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-md border border-red-200 bg-white p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-md border border-slate-300 bg-white p-6 text-sm text-slate-700">
          Loading consistency calendar...
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-300 bg-white text-slate-950 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Month</p>
              <p className="mt-2 text-2xl font-semibold uppercase tracking-[0.14em] text-white">
                {formatMonthLabel(selectedYear, selectedMonthValue)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-500 hover:bg-slate-800"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={goToNextMonth}
                disabled={!canGoNext}
                className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="min-w-full border-separate border-spacing-2 text-left text-sm">
              <thead>
                <tr>
                  {weekdayLabels.map((label) => (
                    <th key={label} className="px-3 py-2 text-left text-xs uppercase tracking-[0.4em] text-slate-500">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calendarWeeks.map((week, weekIndex) => (
                  <tr key={weekIndex}>
                    {week.map((cell, cellIndex) => {
                      if (!cell) {
                        return <td key={cellIndex} className="h-24 rounded-3xl bg-slate-100 px-3 py-4" />;
                      }

                      const { dateKey, day } = cell;
                      const checkedCount = getCheckedCount(dateKey);
                      const checkedActivityNames = getCheckedActivityNames(dateKey);
                      const isFuture = isCurrentMonth && day > currentDay;
                      const isFilled = checkedCount > 0;

                      return (
                        <td key={dateKey} className="px-3 py-3 align-top">
                          <div className={`min-h-[104px] rounded-3xl border p-4 ${isFuture ? 'border-slate-200 bg-slate-100 text-slate-400' : isFilled ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">{day}</span>
                              {isFuture ? (
                                <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] uppercase tracking-[0.32em] text-slate-500">
                                  Future
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-4 text-sm font-semibold">
                              {isFuture ? '—' : isFilled ? `${checkedCount} check${checkedCount > 1 ? 's' : ''}` : 'No checks'}
                            </div>
                            {!isFuture && checkedActivityNames.length > 0 ? (
                              <ul className="mt-3 space-y-1 text-xs text-slate-700">
                                {checkedActivityNames.map((name) => (
                                  <li key={name} className="truncate">• {name}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default ConsistencyTable;
