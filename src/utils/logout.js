export function logoutAndRedirect() {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('auth');
  } catch {}
  window.location.href = '/login';
}
