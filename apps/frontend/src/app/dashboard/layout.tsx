'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, getCurrentUser, getToken } from '@/lib/services/auth-service';
import { parseResponse } from '@/lib/services/fetch-utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    async function checkGuard() {
      try {
        // 1. Fast local storage check — if localStorage says completed, trust it
        const user = getCurrentUser() as any;
        if (user && user.onboardingCompleted) {
          setAuthorized(true);
          setLoading(false);
          return;
        }

        // 2. Fetch live check to sync with DB
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_URL}/api/onboarding/status`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await parseResponse(res);
        
        if (data.completed) {
          // Sync localStorage
          if (user) {
            user.onboardingCompleted = true;
            localStorage.setItem('user', JSON.stringify(user));
          }
          setAuthorized(true);
        } else {
          // API says not completed — only redirect if localStorage also doesn't say completed
          // This prevents redirect loops when localStorage and DB are out of sync
          const freshUser = getCurrentUser() as any;
          if (freshUser && freshUser.onboardingCompleted) {
            setAuthorized(true);
          } else {
            router.push('/onboarding');
          }
        }
      } catch (err) {
        console.error('Onboarding layout guard error:', err);
        // On error: trust localStorage to avoid false redirects
        const user = getCurrentUser() as any;
        if (user && user.onboardingCompleted) {
          setAuthorized(true);
        } else {
          router.push('/onboarding');
        }
      } finally {
        setLoading(false);
      }
    }

    checkGuard();
  }, [router, pathname]);

  if (loading) {
    return (
      <div style={{ background: 'var(--color-bg-main)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="dashboard-theme">
      {children}
    </div>
  );
}
