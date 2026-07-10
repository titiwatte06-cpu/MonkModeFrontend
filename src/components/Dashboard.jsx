import { useCallback, useEffect, useState } from 'react';
import { checkInActivity, getActivities, getActivityHistory, undoCheckIn } from '../api/activities';
import { getBangkokDateKey } from '../utils/date';
import AddActivityForm from './AddActivityForm';
import DoveIcon from './DoveIcon';

const categoryLabels = {
  workout: 'Workout',
  reading: 'Reading',
  hygiene: 'Hygiene',
  other: 'Other',
};

function Dashboard() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [today] = useState(getBangkokDateKey());

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      // Temporary workaround: the backend does not yet return a per-day logged status,
      // so we fetch history for today separately and merge the checkedIn value by id.
      const [activityList, history] = await Promise.all([
        getActivities(),
        getActivityHistory(today),
      ]);

      const historyById = new Map(
        (history || []).map((entry) => [entry.id, entry.checkedIn ?? false]),
      );

      const mergedActivities = (activityList || []).map((activity) => ({
        ...activity,
        checkedInToday: historyById.get(activity.id) ?? false,
      }));

      setActivities(mergedActivities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load activities right now.');
    } finally {
      setIsLoading(false);
    }
  }, [today]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleToggleCheckIn = async (activity) => {
    try {
      setBusyId(activity.id);

      if (activity.checkedInToday) {
        await undoCheckIn(activity.id, today);
      } else {
        await checkInActivity(activity.id, today);
      }

      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this activity right now.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Today</p>
            <h2 className="mt-2 text-2xl font-light text-gray-900">Your calm habit board</h2>
            <p className="mt-1 text-sm text-gray-600">
              Check in, keep your streaks, and stay gently consistent.
            </p>
          </div>

          <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600">
            {today}
          </div>
        </div>
      </div>

      <AddActivityForm onAdded={loadDashboard} />

      {error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Loading your activities...
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
          No activities yet. Add one above to begin.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {activities.map((activity) => (
            <article key={activity.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-gray-900">{activity.name}</h3>
                    {activity.category === 'workout' ? <DoveIcon className="h-5 w-5" /> : null}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {categoryLabels[activity.category] ?? activity.category}
                  </p>
                </div>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                  🔥 {activity.streak ?? 0}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                  {activity.checkedInToday ? 'You checked in today.' : 'Not checked in today yet.'}
                </p>

                <button
                  type="button"
                  onClick={() => handleToggleCheckIn(activity)}
                  disabled={busyId === activity.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {busyId === activity.id
                    ? 'Working…'
                    : activity.checkedInToday
                      ? 'Undo'
                      : 'Check in'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Dashboard;
