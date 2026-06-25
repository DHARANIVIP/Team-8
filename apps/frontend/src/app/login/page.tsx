'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signin } from '@/lib/services/auth-service';

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useState(() => {
    // Note: React 18+ can run this during initial hook declaration or useEffect
  });

  const [useEffectHasRun, setUseEffectHasRun] = useState(false);
  
  // Safe client-side check for URL parameters
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const checkQueryParams = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('signupSuccess') === 'true') {
        setIsSuccess(true);
        setSuccessMsg('Account created successfully! Please sign in below.');
      }
    }
  };

  if (!useEffectHasRun) {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('signupSuccess') === 'true' && !isSuccess) {
        setIsSuccess(true);
        setSuccessMsg('Account created successfully! Please sign in below.');
      } else if (params.get('resetSuccess') === 'true' && !isSuccess) {
        setIsSuccess(true);
        setSuccessMsg('Password has been reset successfully! Please sign in below.');
      }
    }
    setUseEffectHasRun(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSuccess(false);
    setLoading(true);

    try {
      await signin(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>

      <h1 style={{ color: '#ffffff', fontSize: '32px', fontWeight: 800, marginBottom: '18px', textAlign: 'center', zIndex: 1, textShadow: '0 0 8px rgba(255,158,66,0.3)' }}>
        Welcome back
      </h1>

      <form onSubmit={handleSubmit} className="auth-card animate-fade-in" style={{ zIndex: 1, border: '1px solid #ff9e42', boxShadow: '0 0 20px rgba(255,158,66,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Link href="/" className="btn-ghost" style={{ fontSize: '12px', padding: '5px 14px', borderColor: '#ff9e42', color: '#ff9e42' }}>
            ← Back to Website
          </Link>
        </div>

        <h2 style={{ textAlign: 'center', fontSize: '20px', fontWeight: 700, color: '#cccccc', marginBottom: '24px' }}>
          Sign in
        </h2>

        {isSuccess && (
          <div style={{
            background: 'rgba(255,158,66,0.1)',
            border: '1px solid #ff9e42',
            color: '#ff9e42',
            padding: '10px',
            fontSize: '12px',
            marginBottom: '16px',
            textAlign: 'center',
          }}>
            {successMsg}
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid #ef4444',
            color: '#ef4444',
            padding: '10px',
            fontSize: '12px',
            marginBottom: '16px',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#bbbbbb', marginBottom: '6px', fontWeight: 500 }}>
            Email
          </label>
          <div className="input-wrapper">
            <span className="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </span>
            <input
              className="input-field"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ borderColor: '#ff9e42' }}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: '6px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#bbbbbb', marginBottom: '6px', fontWeight: 500 }}>
            Password
          </label>
          <div className="input-wrapper">
            <span className="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              className="input-field"
              type={showPw ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ borderColor: '#ff9e42' }}
            />
            <span className="input-icon-right" onClick={() => setShowPw(!showPw)} style={{ cursor: 'pointer' }}>
              <EyeIcon open={showPw} />
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
          <Link href="/forget-password" style={{ color: '#ff9e42', fontSize: '12px', textShadow: '0 0 4px rgba(255,158,66,0.2)' }}>
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          className="btn-primary"
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            justifyContent: 'center',
            fontSize: '14px',
            padding: '12px',
            background: '#ff9e42',
            color: '#0d0d0d',
            border: 'none',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 0 10px rgba(255,158,66,0.4)',
          }}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        {/* Divider */}
        <div className="divider" style={{ margin: '20px 0' }}>OR CONTINUE WITH</div>

        {/* OAuth */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button type="button" className="btn-ghost" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', borderColor: '#ff9e42', color: '#ff9e42' }}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button type="button" className="btn-ghost" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', borderColor: '#ff9e42', color: '#ff9e42' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff9e42">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#aaaaaa' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#ff9e42', fontWeight: 600 }}>Sign up</Link>
        </p>
      </form>
    </div>
  );
}
