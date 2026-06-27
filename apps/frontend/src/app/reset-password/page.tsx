'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resetPassword } from '@/lib/services/auth-service';

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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get('token');
      if (tokenParam) {
        setToken(tokenParam);
      } else {
        setError('Reset token is missing in URL.');
      }
    }
  }, []);

  const dismissToast = () => {
    setToastVisible(false);
    setTimeout(() => {
      setShowToast(false);
      router.push('/login?resetSuccess=true');
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or expired reset token');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, newPassword);
      setShowToast(true);
      setTimeout(() => setToastVisible(true), 10);
      setTimeout(() => dismissToast(), 2800);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg auth-container-seoul" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Toast Notification */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          zIndex: 9999,
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: toastVisible ? 1 : 0,
          transform: toastVisible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
          pointerEvents: toastVisible ? 'auto' : 'none',
        }}>
          <div style={{
            background: '#fefce8',
            border: '2px solid var(--accent)',
            borderRadius: '8px',
            padding: '16px 20px',
            minWidth: '300px',
            maxWidth: '380px',
            boxShadow: '0 8px 32px rgba(255, 158, 66, 0.25), 0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#1a1a1a', fontWeight: 700, fontSize: '15px', marginBottom: '4px', fontFamily: 'Seoul Namsan, Seoul Hangang, Seoul, sans-serif' }}>
                Password reset successfully!
              </p>
              <p style={{ color: '#4a4a4a', fontSize: '13px', fontFamily: 'Seoul Namsan, Seoul Hangang, Seoul, sans-serif' }}>
                Redirecting you to sign in...
              </p>
            </div>
            <button
              onClick={dismissToast}
              style={{
                background: 'transparent',
                border: '1px solid #d4d4d4',
                color: '#666',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '4px',
                flexShrink: 0,
                padding: 0,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
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
        <div className="auth-card animate-fade-in" style={{ borderRadius: '0px', border: '1px solid rgba(255, 158, 66, 0.15)', background: 'var(--surface)' }}>
          <h1 style={{
            color: '#ffffff',
            fontSize: '20px',
            fontWeight: 800,
            marginBottom: '10px',
            textAlign: 'center',
            letterSpacing: '0.5px',
            textShadow: '0 0 8px rgba(255, 158, 66, 0.25)'
          }}>
            New password
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '13px',
            textAlign: 'center',
            lineHeight: '1.5',
            marginBottom: '26px'
          }}>
            Enter your new password to reset access to your account.
          </p>

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

          <form onSubmit={handleSubmit}>
            {/* New Password */}
            <div style={{ marginBottom: '18px' }}>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  className="input-field"
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            {/* Confirm Password */}
            <div style={{ marginBottom: '22px' }}>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '20px'
              }}
            >
              {loading ? 'Resetting password...' : 'Reset password'}
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
