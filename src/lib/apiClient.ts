export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const userStr = localStorage.getItem('crm_auth_user');
    const token = localStorage.getItem('crm_auth_token');
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        'x-user-id': user.id || '',
        'x-user-role': user.role || 'employee',
        'x-user-email': user.email || '',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      };
    }
  } catch (_) {}
  return {};
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = getAuthHeaders();
  const headers = {
    ...authHeaders,
    ...(options.headers || {}),
  };
  return fetch(url, { ...options, headers });
}
