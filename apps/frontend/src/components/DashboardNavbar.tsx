'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signout } from '@/lib/services/auth-service';

const navLinks = [
  { href: '/dashboard',            label: 'Dashboard' },
  { href: '/dashboard/categories', label: 'Careers' },
  { href: '/dashboard/skills',     label: 'Skills' },
  { href: '/dashboard/courses',    label: 'Courses' },
  { href: '/dashboard/compare',    label: 'Compare' },
  { href: '/dashboard/roadmaps',   label: 'Roadmaps' },
];

/* ── theme token ── */
const ACCENT = '#ff9e42';
const ACCENT_RGBA = 'rgba(255,158,66,0.10)';
const ACCENT_BORDER = 'rgba(255,158,66,0.55)';

export default function DashboardNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    signout();
    router.push('/login');
  };

  return (
    <nav style={{
      borderBottom: '1px solid #1f1f1f',
      padding: '0 40px',
      height: '58px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#0d0d0d',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>

      {/* ── Left: Logo ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img src="/studentlogo.jpeg" alt="Logo" style={{ height: '36px', objectFit: 'contain', borderRadius: '4px' }} />
        </Link>
      </div>

      {/* ── Center: Navigation ── */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: '6px',
                color: isActive ? '#000000' : '#cccccc',
                background: isActive ? ACCENT : 'transparent',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = ACCENT;
                  (e.currentTarget as HTMLElement).style.background = ACCENT_RGBA;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = '#cccccc';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* ── Right: Profile · Settings · Sign Out ── */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

        {/* Profile */}
        <Link
          href="/dashboard/profile"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            padding: '5px 14px',
            borderRadius: '6px',
            border: `1px solid ${ACCENT_BORDER}`,
            color: '#cccccc',
            background: 'transparent',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = ACCENT_RGBA;
            (e.currentTarget as HTMLElement).style.color = ACCENT;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = '#cccccc';
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Profile
        </Link>

        {/* Settings */}
        <Link
          href="/dashboard/settings"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            padding: '5px 14px',
            borderRadius: '6px',
            border: `1px solid ${ACCENT_BORDER}`,
            color: '#cccccc',
            background: 'transparent',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = ACCENT_RGBA;
            (e.currentTarget as HTMLElement).style.color = ACCENT;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = '#cccccc';
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Settings
        </Link>

        {/* Sign Out */}
        <Link
          href="/login"
          onClick={handleSignOut}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            padding: '5px 14px',
            borderRadius: '6px',
            border: '1px solid rgba(239,68,68,0.55)',
            color: '#ef4444',
            background: 'transparent',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.10)';
            (e.currentTarget as HTMLElement).style.borderColor = '#ef4444';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.55)';
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </Link>
      </div>
    </nav>
  );
}
