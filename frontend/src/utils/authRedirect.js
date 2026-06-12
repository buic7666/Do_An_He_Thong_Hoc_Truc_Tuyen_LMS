export function getRoleHomePath(role) {
  if (role === 'admin') {
    return '/admin/dashboard';
  }

  if (role === 'teacher') {
    return '/teacher/dashboard';
  }

  if (role === 'student') {
    return '/dashboard';
  }

  return '/';
}

export function getCurrentUserSafely() {
  try {
    const rawUser = sessionStorage.getItem('currentUser');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (_error) {
    return null;
  }
}

export function getAuthenticatedHomePath() {
  const user = getCurrentUserSafely();
  return getRoleHomePath(user?.role);
}
