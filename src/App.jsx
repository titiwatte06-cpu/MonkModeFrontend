import { useEffect, useMemo, useState } from 'react';
import Dashboard from './components/Dashboard';
import ConsistencyTable from './components/ConsistencyTable';

const PAGE_KEYS = {
  dashboard: 'dashboard',
  consistency: 'consistency',
};

function getPageFromPath(pathname) {
  const normalized = pathname.replace(/\/+$/u, '');
  if (normalized === '/consistency') {
    return PAGE_KEYS.consistency;
  }
  return PAGE_KEYS.dashboard;
}

function App() {
  const initialPage = useMemo(() => {
    if (typeof window === 'undefined') {
      return PAGE_KEYS.dashboard;
    }

    return getPageFromPath(window.location.pathname);
  }, []);

  const [activePage, setActivePage] = useState(initialPage);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handlePopState = () => {
      setActivePage(getPageFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const changePage = (page) => {
    if (page === activePage) {
      return;
    }

    const targetPath = page === PAGE_KEYS.consistency ? '/consistency' : '/';
    window.history.pushState(null, '', targetPath);
    setActivePage(page);
  };

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">SaintMode</p>
            <h1 className="mt-3 text-3xl font-heading uppercase tracking-[0.18em] text-white sm:text-5xl">
              Habit tracking + consistency grid
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => changePage(PAGE_KEYS.dashboard)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${activePage === PAGE_KEYS.dashboard
                ? 'border-amber-400 bg-amber-400 text-slate-950'
                : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500 hover:text-white'}`}
            >
              Habit board
            </button>
            <button
              type="button"
              onClick={() => changePage(PAGE_KEYS.consistency)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${activePage === PAGE_KEYS.consistency
                ? 'border-amber-400 bg-amber-400 text-slate-950'
                : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500 hover:text-white'}`}
            >
              Consistency grid
            </button>
          </div>
        </div>

        {activePage === PAGE_KEYS.dashboard ? <Dashboard /> : <ConsistencyTable />}
      </div>
    </main>
  );
}

export default App;
