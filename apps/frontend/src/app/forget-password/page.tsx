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
    <div className="auth-bg" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>

      <div className="auth-card animate-fade-in" style={{
        zIndex: 1,
        border: '1px solid #ff9e42',
        boxShadow: '0 0 25px rgba(255,158,66,0.15)',
        width: '440px',
        padding: '40px',
        background: 'rgba(13,13,13,0.92)'
      }}>
        <h1 style={{
          color: '#ffffff',
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '10px',
          textAlign: 'center',
          letterSpacing: '0.5px'
        }}>
          Reset password
        </h1>

        <p style={{
          color: '#888888',
          fontSize: '13px',
          textAlign: 'center',
          lineHeight: '1.5',
          marginBottom: '26px'
        }}>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

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

        {message && (
          <div style={{
            background: 'rgba(255,158,66,0.1)',
            border: '1px solid #ff9e42',
            color: '#ff9e42',
            padding: '12px',
            fontSize: '13px',
            marginBottom: '16px',
            textAlign: 'center',
            lineHeight: 1.5
          }}>
            <p style={{ margin: '0 0 8px 0' }}>{message}</p>
            {resetToken && (
              <div>
                <p style={{ color: '#888', fontSize: '11px', margin: '4px 0' }}>Development Mode Reset Link:</p>
                <Link
                  href={`/reset-password?token=${resetToken}`}
                  style={{
                    color: '#ff9e42',
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
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ff9e42" strokeWidth="2">
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
                  borderColor: '#ff9e42',
                  background: '#090909',
                  paddingLeft: '40px',
                  color: '#ffffff'
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
              background: '#ff9e42',
              color: '#0d0d0d',
              border: 'none',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 10px rgba(255,158,66,0.3)',
              marginBottom: '20px'
            }}
          >
            {loading ? 'Sending link...' : 'Send reset link'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <Link href="/login" style={{ color: '#ff9e42', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
