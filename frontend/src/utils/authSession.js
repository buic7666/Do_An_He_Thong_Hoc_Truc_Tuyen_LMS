export function clearAuthSession() {
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('currentUser');

  // Clean up legacy persistent keys from old versions.
  localStorage.removeItem('accessToken');
  localStorage.removeItem('currentUser');
}

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;

  const segments = token.split('.');
  if (segments.length < 2) return null;

  try {
    const normalized = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const payloadJson = atob(padded);
    return JSON.parse(payloadJson);
  } catch (_error) {
    return null;
  }
};

export function isAccessTokenValid(token) {
  if (!token) return false;

  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return false;

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return Number(payload.exp) > nowInSeconds;
}

export function logout(options = {}) {
  const { navigate, redirectPath = '/login', replace = true } = options;

  clearAuthSession();

  if (typeof navigate === 'function') {
    navigate(redirectPath, { replace });
    return;
  }

  if (typeof window !== 'undefined' && window.location.pathname !== redirectPath) {
    window.location.assign(redirectPath);
  }
}
