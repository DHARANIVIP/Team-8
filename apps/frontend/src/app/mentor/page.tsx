'use client';

import { useRouter } from 'next/navigation';

export default function MentorPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0b', margin: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 30px', background: '#090909', borderBottom: '1px solid #1a1a1a' }}>
        <div>
          <h1 style={{ color: '#ff9e42', fontSize: '20px', margin: 0 }}>AI Mentor</h1>
          <p style={{ color: '#aaaaaa', fontSize: '13px', margin: '6px 0 0' }}>Your mentor page opens first after login.</p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ border: '1px solid #ff9e42', color: '#ff9e42', background: 'transparent', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', cursor: 'pointer' }}
        >
          Go to Dashboard
        </button>
      </div>
      <iframe
        src="/ai-mentor/index.html"
        title="AI Mentor"
        style={{ width: '100%', height: 'calc(100vh - 72px)', border: 'none' }}
      >
        Your browser does not support iframes. Open the mentor directly at <a href="/ai-mentor/index.html">AI Mentor</a>.
      </iframe>
    </div>
  );
}
