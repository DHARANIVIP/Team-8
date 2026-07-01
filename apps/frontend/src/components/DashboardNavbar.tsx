'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signout } from '@/lib/services/auth-service';

const navLinks = [
  { href: '/dashboard',            label: 'Dashboard' },
  { href: '/dashboard/career',     label: 'AI Career' },
  { href: '/dashboard/skills',     label: 'Skills' },
  { href: '/dashboard/courses',    label: 'Courses' },
  { href: '/dashboard/compare',    label: 'Compare' },
  { href: '/dashboard/roadmaps',   label: 'Roadmaps' },
];

/* ── theme tokens (Consistent Blue Theme) ── */
const ACCENT = 'var(--color-primary)';
const ACCENT_RGBA = 'var(--color-menu-hover-bg)';
const ACCENT_BORDER = 'var(--color-border-card)';

export default function DashboardNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    signout();
    router.push('/login');
  };

  const isOnboarding = pathname === '/onboarding';

  return (
    <nav style={{
      borderBottom: '1px solid var(--color-border-light)',
      padding: '0 24px',
      height: '58px',
      display: 'flex',
      alignItems: 'center',
      background: 'var(--color-navbar-bg)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1100px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* ── Left: Logo ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href={isOnboarding ? '#' : '/dashboard'} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/studentlogo.jpeg" alt="Logo" style={{ height: '36px', objectFit: 'contain', borderRadius: '6px' }} />
          </Link>
        </div>

        {!isOnboarding ? (
          <>
            {/* ── Center: Navigation ── */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      fontSize: '13px',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-menu-inactive)',
                      background: isActive ? 'var(--color-primary-light)' : 'transparent',
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      fontFamily: 'Outfit, sans-serif'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)';
                        (e.currentTarget as HTMLElement).style.background = 'var(--color-menu-hover-bg)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = 'var(--color-menu-inactive)';
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
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Profile */}
              <Link
                href="/dashboard/profile"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border-medium)',
                  color: 'var(--color-text-secondary)',
                  background: 'transparent',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Outfit, sans-serif'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--color-menu-hover-bg)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-medium)';
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
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border-medium)',
                  color: 'var(--color-text-secondary)',
                  background: 'transparent',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Outfit, sans-serif'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--color-menu-hover-bg)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-medium)';
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
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: 'var(--color-error)',
                  background: 'transparent',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Outfit, sans-serif'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#FEE2E2';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-error)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)';
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
          </>
        ) : (
          /* Simplified sign out button for onboarding page */
          <div>
            <Link
              href="/login"
              onClick={handleSignOut}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(239,68,68,0.3)',
                color: 'var(--color-error)',
                background: 'transparent',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                fontFamily: 'Outfit, sans-serif'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#FEE2E2';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-error)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)';
              }}
            >
              Sign Out
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
