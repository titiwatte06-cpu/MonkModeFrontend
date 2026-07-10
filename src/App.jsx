import { useState } from 'react';
import Dashboard from './components/Dashboard';
import ConsistencyTable from './components/ConsistencyTable';

function App() {
  const [activePage, setActivePage] = useState('dashboard');

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
              onClick={() => setActivePage('dashboard')}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${activePage === 'dashboard'
                ? 'border-amber-400 bg-amber-400 text-slate-950'
                : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500 hover:text-white'}`}
            >
              Habit board
            </button>
            <button
              type="button"
              onClick={() => setActivePage('consistency')}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${activePage === 'consistency'
                ? 'border-amber-400 bg-amber-400 text-slate-950'
                : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500 hover:text-white'}`}
            >
              Consistency grid
            </button>
          </div>
        </div>

        {activePage === 'dashboard' ? <Dashboard /> : <ConsistencyTable />}
      </div>
    </main>
  );
}

export default App;
