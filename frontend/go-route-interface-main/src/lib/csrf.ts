// src/utils/csrf.ts

/**
 * Reads the CSRF token Django sets as a cookie.
 * Django sets 'csrftoken' by default (CSRF_COOKIE_NAME setting).
 * This works because CSRF_COOKIE_HTTPONLY = False in your settings.py ✅
 */
export function getCsrfToken(): string {
  const name = "csrftoken";
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) {
      return decodeURIComponent(value);
    }
  }

  // Cookie not found — user likely hasn't hit any Django page yet.
  // This shouldn't happen after login, but fail loudly if it does.
  console.warn("CSRF token cookie not found. Is the user logged in?");
  return "";
}