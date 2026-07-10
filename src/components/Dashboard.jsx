import { useCallback, useEffect, useState } from 'react';
import { checkInActivity, deleteActivity, getActivities, getActivityHistory, undoCheckIn } from '../api/activities';
import { getBangkokDateKey } from '../utils/date';
import AddActivityForm from './AddActivityForm';

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
  const [pendingDelete, setPendingDelete] = useState(null);
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

  const promptDeleteActivity = (activity) => {
    setPendingDelete(activity);
    setError('');
  };

  const handleDeleteActivity = async () => {
    if (!pendingDelete) {
      return;
    }

    try {
      setBusyId(pendingDelete.id);
      await deleteActivity(pendingDelete.id);
      setPendingDelete(null);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete this activity right now.');
    } finally {
      setBusyId(null);
    }
  };

  const cancelDelete = () => {
    setPendingDelete(null);
  };

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-[#1b1b1b] bg-[#111111]">
        <div className="px-6 py-8 sm:px-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                Today <span className="mx-2 text-amber-400">·</span> {today}
              </p>
              <h1 className="mt-4 text-4xl font-heading uppercase tracking-[0.15em] text-white sm:text-6xl">
                SaintMode habit discipline
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                Focused streak tracking for a disciplined daily rhythm, built to stay sharp and intentional.
              </p>
            </div>

            <div className="text-sm uppercase tracking-[0.42em] text-slate-500">
              Habit discipline
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 px-6 py-4 sm:px-10">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-400">SaintMode</p>
        </div>
      </div>

      <AddActivityForm onAdded={loadDashboard} />

      {error ? (
        <div role="alert" className="rounded-md border border-red-200 bg-white p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-md border border-slate-300 bg-white p-6 text-sm text-slate-700">
          Loading your activities...
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-700">
          No activities yet. Add one above to begin.
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))]">
          {activities.map((activity) => {
            const activityCategory = String(activity.category || 'other').toLowerCase();
            const categoryText = categoryLabels[activityCategory] ?? activity.category;
            const streakValue = activity.streak ?? 0;
            const streakActive = streakValue > 0;

            return (
              <article key={activity.id} className="relative overflow-hidden rounded-md border border-slate-200 bg-white p-6">

                <div className="flex items-start justify-between gap-6">
                  <div className="max-w-[60%]">
                    <p className="text-xs uppercase tracking-[0.34em] text-slate-500">
                      <span className="mr-2 inline-block h-px w-6 rounded-full bg-amber-400/70" />
                      {categoryText}
                    </p>
                    <h3 className="mt-4 text-2xl font-heading uppercase tracking-[0.08em] text-slate-950">
                      {activity.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <p className={`text-5xl font-heading ${streakActive ? 'text-amber-400' : 'text-slate-400'}`}>
                      {streakValue}
                    </p>
                    <p className={`mt-1 text-xs uppercase tracking-[0.4em] ${streakActive ? 'text-slate-500' : 'text-slate-400'}`}>
                      {streakActive ? 'STREAK' : '0 DAYS'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">
                    {activity.checkedInToday ? 'You checked in today.' : 'Not checked in today yet.'}
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleCheckIn(activity)}
                      disabled={busyId === activity.id}
                      className="rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {busyId === activity.id
                        ? 'Working…'
                        : activity.checkedInToday
                          ? 'Undo'
                          : 'Check in'}
                    </button>

                    <button
                      type="button"
                      onClick={() => promptDeleteActivity(activity)}
                      disabled={busyId === activity.id}
                      className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pendingDelete ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4 py-6">
          <div className="max-w-md rounded-3xl border border-slate-700 bg-slate-950 p-6 text-white">
            <h3 className="text-lg font-heading uppercase tracking-[0.18em] text-amber-400">Delete activity?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Are you sure you want to remove <span className="font-semibold text-white">{pendingDelete.name}</span>? This cannot be undone.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelDelete}
                className="rounded-full border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteActivity}
                disabled={busyId === pendingDelete.id}
                className="rounded-full bg-amber-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busyId === pendingDelete.id ? 'Deleting…' : 'Delete forever'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default Dashboard;
