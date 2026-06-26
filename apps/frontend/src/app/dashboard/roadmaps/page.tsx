'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardNavbar from '@/components/DashboardNavbar';

interface RoadmapItem {
  id: string;
  name: string;
  category: string;
  description: string;
  difficulty_level: string;
  estimated_duration: string;
  source?: string;
  source_slug?: string;
}

const ACCENT = '#ff9e42';

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/roadmaps`);
      if (!res.ok) throw new Error('Failed to load roadmap index');
      const data = await res.json();
      setRoadmaps(data);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/roadmaps/sync`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Sync request failed');
      await fetchRoadmaps();
    } catch (err: any) {
      setError('Sync failed: ' + (err.message || 'unknown network error'));
    } finally {
      setSyncing(false);
    }
  };

  const renderRoadmapCard = (item: RoadmapItem) => {
    const isRoadmapSh = item.source === 'roadmap.sh' || item.id === 'frontend' || item.id === 'backend' || item.name.toLowerCase().includes('frontend') || item.name.toLowerCase().includes('backend');
    const targetLink = isRoadmapSh 
      ? `/dashboard/roadmaps/${item.id === 'frontend' || item.id === 'backend' ? item.id : item.name.toLowerCase().includes('frontend') ? 'frontend' : 'backend'}`
      : `/dashboard/roadmaps/${item.id}`;

    return (
      <Link key={item.id} href={targetLink} style={{ textDecoration: 'none' }}>
        <div
          className="card card-hover"
          style={{
            padding: '24px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              {item.name}
            </h3>
            {isRoadmapSh && (
              <span className="badge badge-accent" style={{ fontSize: '9px', padding: '2px 8px' }}>roadmap.sh</span>
            )}
          </div>
          
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, flexGrow: 1 }}>
            {item.description}
          </p>

          <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-muted" style={{ fontSize: '10px', background: 'rgba(255, 158, 66, 0.05)', color: 'var(--accent)', border: '1px solid rgba(255, 158, 66, 0.2)' }}>
              {item.category}
            </span>
            <span className="badge badge-muted" style={{ fontSize: '10px' }}>
              {item.difficulty_level}
            </span>
            <span className="badge badge-muted" style={{ fontSize: '10px' }}>
              ⏱ {item.estimated_duration}
            </span>
          </div>
          
          <div style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', borderTop: '1px solid var(--border-dark)', paddingTop: '12px', marginTop: '8px' }}>
            View Roadmap path →
          </div>
        </div>
      </Link>
    );
  };

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#ffffff' }}>
      <DashboardNavbar />
      
      <main className="page-container animate-slide-up" style={{ padding: '24px 0' }}>
        
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid rgba(255, 158, 66, 0.15)', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="section-label" style={{ display: 'block', marginBottom: '2px' }}>OFFICIAL PARTNERSHIPS</span>
            <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px', fontFamily: 'Outfit, sans-serif' }}>
              Learning <span style={{ color: ACCENT }}>Roadmaps</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>
              Curated step-by-step developer paths inspired by roadmap.sh to help you guide your learning.
            </p>
          </div>
          
          <button
            onClick={handleSync}
            disabled={syncing || loading}
            className={syncing ? 'btn-ghost' : 'btn-primary'}
            style={{
              fontSize: '12px',
              padding: '8px 18px',
              cursor: syncing || loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {syncing ? (
              <>
                <span className="spinner" style={{
                  width: '12px',
                  height: '12px',
                  border: `2px solid ${ACCENT}`,
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite'
                }}></span>
                Syncing...
              </>
            ) : 'Sync with Source'}
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '24px',
            color: '#ef4444',
            fontSize: '13px',
            fontFamily: 'Outfit, sans-serif'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="card" style={{ padding: '24px', height: '180px', display: 'flex', flexDirection: 'column', gap: '12px', opacity: 0.6 }}>
                <div style={{ height: '18px', width: '60%', background: 'var(--border-dark)', borderRadius: '4px' }}></div>
                <div style={{ height: '12px', width: '40%', background: 'var(--border-dark)', borderRadius: '4px' }}></div>
                <div style={{ height: '36px', width: '100%', background: 'var(--border-dark)', borderRadius: '4px', marginTop: 'auto' }}></div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)', borderBottom: '1px solid var(--border-dark)', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'Outfit, sans-serif' }}>
                Role-Based Roadmaps
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {roadmaps.filter(r => r.category !== 'AI Tools').map(renderRoadmapCard)}
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)', borderBottom: '1px solid var(--border-dark)', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'Outfit, sans-serif' }}>
                Skill-Based Roadmaps
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {roadmaps.filter(r => r.category === 'AI Tools').map(renderRoadmapCard)}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global CSS for spin animations */}
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
