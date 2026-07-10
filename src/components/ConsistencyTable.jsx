import { useCallback, useEffect, useMemo, useState } from 'react';
import { getActivities, getActivityHistory } from '../api/activities';
import { getBangkokDateKey } from '../utils/date';

function getRecentDateKeys(days = 7) {
  const result = [];
  const now = Date.now();

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(now - index * 24 * 60 * 60 * 1000);
    result.push(getBangkokDateKey(date));
  }

  return result;
}

function formatDayLabel(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    weekday: 'short',
  }).format(date);
}

function ConsistencyTable() {
  const [activities, setActivities] = useState([]);
  const [historyByDate, setHistoryByDate] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const dateKeys = useMemo(() => getRecentDateKeys(7), []);

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

  const getCellState = (activityId, dateKey) => {
    const row = historyByDate[dateKey] || [];
    return row.some((item) => item.id === activityId && item.checkedIn);
  };

  const totalStreakDays = activities.reduce((sum, activity) => {
    const checkedDays = dateKeys.filter((dateKey) => getCellState(activity.id, dateKey)).length;
    return sum + checkedDays;
  }, 0);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-[#1b1b1b] bg-[#111111] p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Consistency check</p>
        <h2 className="mt-4 text-4xl font-heading uppercase tracking-[0.16em] text-white sm:text-5xl">
          Weekly consistency grid
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
          Review the last 7 days across your activities and see where your streaks are strongest.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Activities</p>
            <p className="mt-3 text-3xl font-heading text-white">{activities.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Checked days</p>
            <p className="mt-3 text-3xl font-heading text-amber-400">{totalStreakDays}</p>
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
          Loading consistency table...
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-300 bg-white text-slate-950 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="whitespace-nowrap border-b border-slate-300 px-4 py-4 text-xs uppercase tracking-[0.4em] text-slate-500">Activity</th>
                  {dateKeys.map((dateKey) => (
                    <th key={dateKey} className="whitespace-nowrap border-b border-slate-300 px-4 py-4 text-xs uppercase tracking-[0.3em] text-slate-400">
                      <div className="text-slate-200">{formatDayLabel(dateKey)}</div>
                      <div className="mt-1 text-base font-semibold text-white">{dateKey.slice(-2)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id} className="even:bg-slate-50">
                    <td className="border-b border-slate-200 px-4 py-4 font-medium uppercase tracking-[0.12em] text-slate-900">
                      {activity.name}
                    </td>
                    {dateKeys.map((dateKey) => {
                      const checked = getCellState(activity.id, dateKey);
                      return (
                        <td key={dateKey} className="border-b border-slate-200 px-4 py-4">
                          <div className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${checked ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-400'}`}>
                            {checked ? '●' : '–'}
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
