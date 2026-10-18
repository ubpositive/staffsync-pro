// Drop-in replacement for the Base44 SDK client. Base44 apps call
// `base44.auth.*`, `base44.entities.<Name>.*`, and
// `base44.integrations.Core.UploadFile` against Base44's managed backend;
// this file implements the same shape against our own Express API
// (see /server) so every page that imported `{ base44 }` keeps working
// unmodified.

const TOKEN_KEY = 'auth_token';

function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function setStoredToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore (private browsing, etc.) */ }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error((data && data.message) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function makeEntityClient(name) {
  const base = `/api/entities/${name}`;
  let lastChangeCheck = new Date().toISOString();

  return {
    list: (sort, limit) => {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      return request(`${base}?${params.toString()}`);
    },
    // filter(query, sort) — equality match + optional sort (used throughout
    // the employee detail tabs, e.g. SalaryIncrement.filter({employee_id}, '-effective_date'))
    filter: (query = {}, sort) => {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      return request(`${base}/filter?${params.toString()}`, { method: 'POST', body: query });
    },
    get: (id) => request(`${base}/${id}`),
    create: (payload) => request(base, { method: 'POST', body: payload }),
    update: (id, payload) => request(`${base}/${id}`, { method: 'PUT', body: payload }),
    delete: (id) => request(`${base}/${id}`, { method: 'DELETE' }),
    // Polling stand-in for Base44's websocket-based live updates.
    subscribe: (callback) => {
      let stopped = false;
      const poll = async () => {
        if (stopped) return;
        try {
          const result = await request(`${base}/changed-since?since=${encodeURIComponent(lastChangeCheck)}`);
          lastChangeCheck = result.now;
          if (result.changed) callback();
        } catch { /* ignore transient poll errors */ }
        if (!stopped) setTimeout(poll, 5000);
      };
      poll();
      return () => { stopped = true; };
    },
  };
}

// The `User` "entity" is special-cased server-side (admin-only management,
// password hashing, approval flow) but exposes the same list/update/delete
// shape the Settings/User Management page expects.
const usersEntityClient = {
  list: (sort) => {
    const params = new URLSearchParams();
    if (sort) params.set('sort', sort);
    return request(`/api/users?${params.toString()}`);
  },
  update: (id, payload) => request(`/api/users/${id}`, { method: 'PUT', body: payload }),
  delete: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),
};

export const base44 = {
  auth: {
    me: () => request('/api/auth/me'),
    loginViaEmailPassword: async (email, password) => {
      const result = await request('/api/auth/login', { method: 'POST', body: { email, password } });
      setStoredToken(result.token);
      return result.user;
    },
    register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
    setToken: (token) => setStoredToken(token),
    logout: (returnUrl) => {
      setStoredToken(null);
      const target = returnUrl ? `/login?returnTo=${encodeURIComponent(returnUrl)}` : '/login';
      window.location.href = target;
    },
    redirectToLogin: (returnUrl) => {
      window.location.href = returnUrl ? `/login?returnTo=${encodeURIComponent(returnUrl)}` : '/login';
    },
  },
  entities: {
    Employee: makeEntityClient('Employee'),
    SalaryIncrement: makeEntityClient('SalaryIncrement'),
    Bonus: makeEntityClient('Bonus'),
    TitleHistory: makeEntityClient('TitleHistory'),
    Leave: makeEntityClient('Leave'),
    Evaluation: makeEntityClient('Evaluation'),
    SSNFHistory: makeEntityClient('SSNFHistory'),
    User: usersEntityClient,
  },
  users: {
    inviteUser: (email, role) => request('/api/users/invite', { method: 'POST', body: { email, role } }),
    resetPassword: (id) => request(`/api/users/${id}/reset-password`, { method: 'POST' }),
  },
  integrations: {
    Core: {
      // Stands in for Base44's managed file storage — uploads to our own
      // Express server (see server/uploads.js), which saves to disk and
      // returns a same-origin URL the <img>/<a> tags in DocumentsTab use directly.
      UploadFile: async ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = getToken();
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch('/api/uploads', { method: 'POST', headers, body: formData });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const err = new Error((data && data.message) || `Upload failed (${res.status})`);
          err.status = res.status;
          throw err;
        }
        return data; // { file_url }
      },
    },
  },
};
