'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgetPassword } from '@/lib/services/auth-service';

export default function ForgetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetToken('');
    setLoading(true);

    try {
      const data = await forgetPassword(email);
      setMessage('Password reset token generated successfully!');
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background ambient glowing spheres */}
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(255, 158, 66, 0.08) 0%, rgba(255, 158, 66, 0) 70%)',
        top: '15%',
        left: '15%',
        borderRadius: '50%',
        filter: 'blur(50px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(255, 158, 66, 0.06) 0%, rgba(255, 158, 66, 0) 70%)',
        bottom: '15%',
        right: '10%',
        borderRadius: '50%',
        filter: 'blur(60px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div className="auth-card animate-fade-in">
          <h1 style={{
            color: '#ffffff',
            fontSize: '28px',
            fontWeight: 800,
            marginBottom: '10px',
            textAlign: 'center',
            letterSpacing: '0.5px',
            textShadow: '0 0 8px rgba(255, 158, 66, 0.25)'
          }}>
            Reset password
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '13px',
            textAlign: 'center',
            lineHeight: '1.5',
            marginBottom: '26px'
          }}>
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              color: '#ef4444',
              padding: '12px',
              fontSize: '13px',
              marginBottom: '16px',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{
              background: 'rgba(255, 158, 66, 0.08)',
              border: '1px solid rgba(255, 158, 66, 0.3)',
              borderRadius: '6px',
              color: 'var(--accent)',
              padding: '12px',
              fontSize: '13px',
              marginBottom: '16px',
              textAlign: 'center',
              lineHeight: 1.5
            }}>
              <p style={{ margin: '0 0 8px 0' }}>{message}</p>
              {resetToken && (
                <div style={{ borderTop: '1px solid rgba(255, 158, 66, 0.15)', paddingTop: '8px', marginTop: '8px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '4px 0' }}>Development Mode Reset Link:</p>
                  <Link
                    href={`/reset-password?token=${resetToken}`}
                    style={{
                      color: 'var(--accent)',
                      textDecoration: 'underline',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      wordBreak: 'break-all'
                    }}
                  >
                    Click here to Reset Password
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '22px' }}>
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
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    paddingLeft: '40px'
                  }}
                />
              </div>
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
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '20px'
              }}
            >
              {loading ? 'Sending link...' : 'Send reset link'}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <Link href="/login" style={{ color: 'var(--accent)', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
