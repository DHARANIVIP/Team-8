/**
 * Resolve backend API base URL.
 * - Uses NEXT_PUBLIC_API_URL when set
 * - In browser: same-origin (proxied via next.config rewrites to port 3001)
 * - On server: defaults to localhost:3001
 */
export function getApiUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (env) {
    // Common misconfig: API URL pointing at the Next.js dev server instead of Express
    if (/localhost:3000\b/.test(env) || /127\.0\.0\.1:3000\b/.test(env)) {
      return env.replace(':3000', ':3001').replace(/\/$/, '');
    }
    return env.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return '';
  }
  return 'http://localhost:3001';
}
