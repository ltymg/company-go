export const AUTH_TOKEN_KEY = 'token';
export const AUTH_ROLE_KEY = 'role';
export const AUTH_SUPER_ADMIN_KEY = 'isSuperAdmin';

export function isAuthed(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(AUTH_TOKEN_KEY);
}

// 简单解析 JWT payload（不做安全校验，仅用于前端显示角色）
function decodeJwt(token: string): any | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);

  const payload = decodeJwt(token);
  if (payload?.role) {
    localStorage.setItem(AUTH_ROLE_KEY, payload.role);
  }
  if (payload?.isSuperAdmin !== undefined) {
    localStorage.setItem(AUTH_SUPER_ADMIN_KEY, String(payload.isSuperAdmin));
  }

  window.dispatchEvent(new Event('auth-changed'));
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
  localStorage.removeItem(AUTH_SUPER_ADMIN_KEY);
  window.dispatchEvent(new Event('auth-changed'));
}
