'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, getCurrentUser, getToken } from '@/lib/services/auth-service';

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
        // 1. Fast local storage check
        const user = getCurrentUser() as any;
        if (user && user.onboardingCompleted) {
          setAuthorized(true);
          setLoading(false);
          return;
        }

        // 2. Fetch live check in case they just completed on another tab
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_URL}/api/onboarding/status`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        
        if (data.completed) {
          // Sync local storage user profile onboarding completed flag
          if (user) {
            user.onboardingCompleted = true;
            localStorage.setItem('user', JSON.stringify(user));
          }
          setAuthorized(true);
        } else {
          router.push('/onboarding');
        }
      } catch (err) {
        console.error('Onboarding layout guard error:', err);
        // Fallback to let user view dashboard on connection failure
        setAuthorized(true);
      } finally {
        setLoading(false);
      }
    }

    checkGuard();
  }, [router, pathname]);

  if (loading) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
