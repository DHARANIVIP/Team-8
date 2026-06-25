'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  if (pw.length < 6) return { width: '25%', color: '#e55' };
  if (pw.length < 10) return { width: '55%', color: '#f90' };
  return { width: '100%', color: '#ff9e42' };
}

export default function SignupPage() {
  const [showPw, setShowPw]      = useState(false);
  const [showCpw, setShowCpw]    = useState(false);
  const [password, setPassword]  = useState('');
  const strength = getStrength(password);
  const router = useRouter();

  return (
    <div className="auth-bg">
      <h1 style={{ color: '#cccccc', fontSize: '30px', fontWeight: 800, marginBottom: '18px', textAlign: 'center' }}>
        Create your account
      </h1>

      <div className="auth-card animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Link href="/" className="btn-ghost" style={{ fontSize: '12px', padding: '5px 14px' }}>
            ← Back to Website
          </Link>
        </div>

        <h2 style={{ textAlign: 'center', fontSize: '20px', fontWeight: 700, color: '#cccccc', marginBottom: '24px' }}>
          Sign up
        </h2>

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
            <input className="input-field" type="text" placeholder="Enter your full name" />
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
            <input className="input-field" type="email" placeholder="Enter your email" />
          </div>
        </div>

        {/* DOB */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#bbbbbb', marginBottom: '6px', fontWeight: 500 }}>
            Date of Birth
          </label>
          <div className="input-wrapper">
            <span className="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <input className="input-field" type="date" />
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
            />
            <span className="input-icon-right" onClick={() => setShowPw(!showPw)}>
              <EyeIcon open={showPw} />
            </span>
          </div>
          <div className="strength-bar">
            <div className="strength-bar-fill" style={{ width: strength.width, background: strength.color }} />
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
            />
            <span className="input-icon-right" onClick={() => setShowCpw(!showCpw)}>
              <EyeIcon open={showCpw} />
            </span>
          </div>
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '14px', padding: '12px' }}
          onClick={() => router.push('/mentor')}
        >
          Create account
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#aaaaaa' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#ff9e42', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
