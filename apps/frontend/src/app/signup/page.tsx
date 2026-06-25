'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signup } from '@/lib/services/auth-service';

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

function getStrength(pw: string) {
  if (!pw) return { width: '0%', color: '#2a2a2a' };
  if (pw.length < 6) return { width: '25%', color: '#ef4444' };
  if (pw.length < 10) return { width: '55%', color: '#fb923c' };
  return { width: '100%', color: '#10b981' };
}

export default function SignupPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await signup(name, email, password);
      // Redirect to login with query param to show a success message
      router.push('/login?signupSuccess=true');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>

      <h1 style={{ color: '#ffffff', fontSize: '32px', fontWeight: 800, marginBottom: '18px', textAlign: 'center', zIndex: 1, textShadow: '0 0 8px rgba(255,158,66,0.3)' }}>
        Create your account
      </h1>

      <form onSubmit={handleSubmit} className="auth-card animate-fade-in" style={{ zIndex: 1, border: '1px solid #ff9e42', boxShadow: '0 0 20px rgba(255,158,66,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Link href="/" className="btn-ghost" style={{ fontSize: '12px', padding: '5px 14px', borderColor: '#ff9e42', color: '#ff9e42' }}>
            ← Back to Website
          </Link>
        </div>

        <h2 style={{ textAlign: 'center', fontSize: '20px', fontWeight: 700, color: '#cccccc', marginBottom: '24px' }}>
          Sign up
        </h2>

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

        {/* Full Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#bbbbbb', marginBottom: '6px', fontWeight: 500 }}>
            Full Name
          </label>
          <div className="input-wrapper">
            <span className="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              className="input-field"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ borderColor: '#ff9e42' }}
            />
          </div>
        </div>

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
        <div style={{ marginBottom: '16px' }}>
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
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ borderColor: '#ff9e42' }}
            />
            <span className="input-icon-right" onClick={() => setShowPw(!showPw)} style={{ cursor: 'pointer' }}>
              <EyeIcon open={showPw} />
            </span>
          </div>
          <div className="strength-bar" style={{ marginTop: '8px', background: '#2a2a2a', height: '4px' }}>
            <div className="strength-bar-fill" style={{ width: strength.width, background: strength.color, height: '100%', transition: 'all 0.3s ease' }} />
          </div>
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#bbbbbb', marginBottom: '6px', fontWeight: 500 }}>
            Confirm Password
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
              type={showCpw ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ borderColor: '#ff9e42' }}
            />
            <span className="input-icon-right" onClick={() => setShowCpw(!showCpw)} style={{ cursor: 'pointer' }}>
              <EyeIcon open={showCpw} />
            </span>
          </div>
        </div>

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
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#aaaaaa' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#ff9e42', fontWeight: 600 }}>Sign in</Link>
        </p>
      </form>
    </div>
  );
}
