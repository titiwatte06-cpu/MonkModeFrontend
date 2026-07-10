import { useState } from 'react';
import { createActivity } from '../api/activities';

function AddActivityForm({ onAdded }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('Please enter an activity name.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await createActivity(name.trim(), category);
      setName('');
      setCategory('other');
      if (onAdded) {
        await onAdded();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add this activity right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-2 block text-sm font-medium text-gray-700">Activity name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Walk for 20 minutes"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none ring-0 transition focus:border-gray-400 focus:bg-white"
          />
        </label>

        <label className="sm:w-44">
          <span className="mb-2 block text-sm font-medium text-gray-700">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white"
          >
            <option value="workout">Workout</option>
            <option value="reading">Reading</option>
            <option value="hygiene">Hygiene</option>
            <option value="other">Other</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isSubmitting ? 'Saving…' : 'Add activity'}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export default AddActivityForm;
