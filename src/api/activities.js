import { getBangkokDateKey } from '../utils/date';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const { method = 'GET', body, headers = {} } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload = {};

  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok || payload.status === 'error') {
    const message = payload.message || payload.error || 'Request failed.';
    throw new Error(message);
  }

  return payload;
}

export async function getActivities() {
  const payload = await request('/activities');
  return payload.data || [];
}

export async function getActivityHistory(date) {
  const dateKey = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? date
    : getBangkokDateKey(date);

  const payload = await request(`/activities/history?date=${dateKey}`);
  return payload.data || [];
}

export async function createActivity(name, category) {
  const payload = await request('/activities', {
    method: 'POST',
    body: { name, category },
  });

  return payload.data;
}

export async function updateActivity(id, updates) {
  const payload = await request(`/activities/${id}`, {
    method: 'PATCH',
    body: updates,
  });

  return payload.data;
}

export async function deleteActivity(id) {
  const payload = await request(`/activities/${id}`, {
    method: 'DELETE',
  });

  return payload.data;
}

export async function checkInActivity(id, logDate) {
  const payload = await request(`/activities/${id}/logs`, {
    method: 'POST',
    body: { log_date: logDate },
  });

  return payload.data;
}

export async function undoCheckIn(id, logDate) {
  const payload = await request(`/activities/${id}/logs`, {
    method: 'DELETE',
    body: { log_date: logDate },
  });

  return payload.data;
}
