export function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

export function getSession() {
  const raw = localStorage.getItem('user');
  if (!raw || !localStorage.getItem('token')) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem('token', session.token);
  localStorage.setItem('user', JSON.stringify(session.user));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && token && !path.endsWith('/signin')) {
    clearSession();
    window.location.assign('/signin');
  }
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}
