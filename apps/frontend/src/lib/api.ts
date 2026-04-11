// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

async function refreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('accessToken', data.access_token);
      if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiFetch(endpoint: string, options: RequestInit = {}, skipAuth = false) {
  const token = !skipAuth ? localStorage.getItem('accessToken') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const makeRequest = async (retryToken?: string): Promise<Response> => {
    const reqHeaders = { ...headers };
    if (retryToken) {
      reqHeaders['Authorization'] = `Bearer ${retryToken}`;
    }
    return fetch(`${API_BASE}${endpoint}`, { ...options, headers: reqHeaders });
  };

  let response = await makeRequest();

  // Token expired – try refresh
  if (response.status === 401 && !skipAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshToken();
      isRefreshing = false;
      if (newToken) {
        onRefreshed(newToken);
        response = await makeRequest(newToken);
      } else {
        // Refresh failed – logout
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    } else {
      // Wait for refresh to complete
      await new Promise<void>((resolve) => {
        refreshSubscribers.push(() => resolve());
      });
      const newToken = localStorage.getItem('accessToken');
      response = await makeRequest(newToken || undefined);
    }
  }

  return response;
}