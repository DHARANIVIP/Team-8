'use client';

import { useState, useEffect, useRef } from 'react';
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

function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let intervalId: NodeJS.Timeout;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const charArr = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ'.split('');
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize) + 1;
    const drops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(255, 158, 66, 0.15)'; // Mild orange matrix code rain
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArr[Math.floor(Math.random() * charArr.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    intervalId = setInterval(draw, 33);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.8,
      }}
    />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const handleGithubLogin = () => {
    window.location.href = `${API_URL}/api/auth/github`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const userParam = params.get('user');

    if (tokenParam && userParam) {
      localStorage.setItem('token', tokenParam);
      localStorage.setItem('user', decodeURIComponent(userParam));
      router.push('/dashboard');
      return;
    }

    if (params.get('signupSuccess') === 'true') {
      setIsSuccess(true);
      setSuccessMsg('Account created successfully! Please sign in below.');
    } else if (params.get('resetSuccess') === 'true') {
      setIsSuccess(true);
      setSuccessMsg('Password has been reset successfully! Please sign in below.');
    } else if (params.get('error') === 'oauth_failed') {
      setError('Authentication failed via social credentials. Please try again.');
    }
  }, []);

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
    <div className="auth-bg auth-container-seoul" style={{ position: 'relative', overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .auth-container-seoul, 
        .auth-container-seoul h1, 
        .auth-container-seoul h2, 
        .auth-container-seoul p, 
        .auth-container-seoul label, 
        .auth-container-seoul input, 
        .auth-container-seoul button, 
        .auth-container-seoul a, 
        .auth-container-seoul span {
          font-family: 'Seoul Namsan', 'Seoul Hangang', 'Seoul', sans-serif !important;
        }
      `}} />
      <MatrixBackground />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <h1 style={{ color: '#ffffff', fontSize: '24px', fontWeight: 800, marginBottom: '18px', textAlign: 'center', textShadow: '0 0 8px rgba(255, 158, 66, 0.25)' }}>
          Welcome back
        </h1>

        <form onSubmit={handleSubmit} className="auth-card animate-fade-in" style={{ borderRadius: '0px', border: '1px solid rgba(255, 158, 66, 0.15)', background: 'var(--surface)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Link href="/" style={{
              border: '1px solid rgba(255, 158, 66, 0.3)',
              background: 'rgba(255, 158, 66, 0.05)',
              padding: '8px 18px',
              color: 'var(--accent)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'inline-block',
              textDecoration: 'none',
              cursor: 'pointer',
              borderRadius: '0px'
            }}>
              Back to Website
            </Link>
          </div>

          <h2 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 700, color: '#cccccc', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sign in
          </h2>

          {isSuccess && (
            <div style={{
              background: 'rgba(255, 158, 66, 0.08)',
              border: '1px solid rgba(255, 158, 66, 0.3)',
              borderRadius: '0px',
              color: 'var(--accent)',
              padding: '12px',
              fontSize: '13px',
              marginBottom: '16px',
              textAlign: 'center',
            }}>
              {successMsg}
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0px',
              color: '#ef4444',
              padding: '12px',
              fontSize: '13px',
              marginBottom: '16px',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
              Email Address
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
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  paddingLeft: '40px',
                  borderRadius: '0px',
                  border: '1px solid rgba(255, 158, 66, 0.3)',
                  background: 'rgba(10, 10, 10, 0.7)'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  paddingLeft: '40px',
                  paddingRight: '40px',
                  borderRadius: '0px',
                  border: '1px solid rgba(255, 158, 66, 0.3)',
                  background: 'rgba(10, 10, 10, 0.7)'
                }}
              />
              <span className="input-icon-right" onClick={() => setShowPw(!showPw)}>
                <EyeIcon open={showPw} />
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '22px' }}>
            <Link href="/forget-password" style={{ color: 'var(--accent)', fontSize: '13px', textDecoration: 'none' }}>
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
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '12px',
              borderRadius: '0px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          {/* Divider */}
          <div className="divider" style={{ margin: '22px 0' }}>Or continue with</div>

          {/* OAuth */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={handleGoogleLogin}
              style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                width: '50%',
                justifyContent: 'center',
                border: '1px solid rgba(255, 158, 66, 0.3)',
                background: 'rgba(10, 10, 10, 0.6)',
                color: '#ffffff',
                fontWeight: 600,
                borderRadius: '0px',
                cursor: 'pointer'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={handleGithubLogin}
              style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                width: '50%',
                justifyContent: 'center',
                border: '1px solid rgba(255, 158, 66, 0.3)',
                background: 'rgba(10, 10, 10, 0.6)',
                color: '#ffffff',
                fontWeight: 600,
                borderRadius: '0px',
                cursor: 'pointer'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
