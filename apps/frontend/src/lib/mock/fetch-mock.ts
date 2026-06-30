// Client-side fetch mock for development UI-only mode
type FetchInput = RequestInfo | URL;

export function initMockFetch() {
  if (typeof window === 'undefined') return;
  // Only enable in development on the local host
  if (process.env.NODE_ENV === 'production') return;

  const originalFetch = window.fetch.bind(window);
  (window as any).__originalFetch = (window as any).__originalFetch || originalFetch;

  window.fetch = async (input: FetchInput, init?: RequestInit): Promise<Response> => {
    try {
      const url = typeof input === 'string' ? input : (input as URL).toString ? (input as URL).toString() : (input as RequestInfo as any).url;
      const method = (init && init.method) || 'GET';

      // Simple helpers to respond
      const jsonResponse = (obj: any, status = 200) =>
        new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

      // Auth: signup
      if (url.includes('/api/auth/signup') && method.toUpperCase() === 'POST') {
        // emulate latency
        await new Promise((r) => setTimeout(r, 250));
        return jsonResponse({ message: 'Mock signup ok' }, 201);
      }

      // Auth: signin (accept any credentials)
      if (url.includes('/api/auth/signin') && method.toUpperCase() === 'POST') {
        await new Promise((r) => setTimeout(r, 200));
        const mockUser = { id: 'mock-user-1', email: 'demo@example.com', name: 'Demo User' };
        const mockToken = 'mock-token-1234567890';
        return jsonResponse({ token: mockToken, user: mockUser }, 200);
      }

      // OAuth redirects: allow navigation to external auth endpoints by delegating
      if (url.includes('/api/auth/google') || url.includes('/api/auth/github')) {
        // simulate a redirect response (the UI code simply sets window.location.href)
        return new Response(null, { status: 204 });
      }

      // Generic API catch-all for any /api request (GET, POST, PUT, DELETE)
      if (url.includes('/api/')) {
        await new Promise((r) => setTimeout(r, 120));
        // return small stub depending on path
        if (url.includes('/api/profile')) {
          return jsonResponse({ id: 'mock-user-1', email: 'demo@example.com', name: 'Demo User', skills: [], career: 'Software Engineer' });
        }
        if (url.includes('/api/categories')) {
          return jsonResponse([{ id: 'cat-1', name: 'Software' }, { id: 'cat-2', name: 'Design' }]);
        }
        if (url.includes('/api/skills')) {
          return jsonResponse([{ id: 'skill-1', name: 'JavaScript' }, { id: 'skill-2', name: 'UI Design' }]);
        }
        if (url.includes('/api/courses')) {
          return jsonResponse([{ id: 'course-1', title: 'Intro to React' }]);
        }
        if (url.includes('/api/roadmaps')) {
          return jsonResponse([{ id: 'roadmap-1', title: 'Frontend Developer' }]);
        }
        
        // default generic payload for any other /api/ call
        return jsonResponse({ success: true, mock: true });
      }

      // For other requests (like Next.js assets, pages), fall back to real network fetch
      return originalFetch(input as any, init);
    } catch (e) {
        // In case the mock throws, fall back to original fetch
        return (window as any).__originalFetch ? (window as any).__originalFetch(input as any, init) : Promise.reject(e);
    }
  };
    // keep a reference to original (already set above)
}

export default initMockFetch;
