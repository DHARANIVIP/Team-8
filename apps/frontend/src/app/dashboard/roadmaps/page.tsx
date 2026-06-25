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
}

const ACCENT = '#ff9e42';
const ACCENT_RGBA = 'rgba(255,158,66,0.10)';
const ACCENT_BORDER = 'rgba(255,158,66,0.30)';

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:3001/api/roadmaps');
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
      const res = await fetch('http://localhost:3001/api/roadmaps/sync', {
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

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  // Group roadmaps by category
  const categories = roadmaps.reduce((acc: Record<string, RoadmapItem[]>, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh', color: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <DashboardNavbar />
      
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 40px' }}>
        
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
              Learning <span style={{ color: ACCENT }}>Roadmaps</span>
            </h1>
            <p style={{ color: '#aaaaaa', fontSize: '13px', margin: 0 }}>
              Curated step-by-step developer paths inspired by roadmap.sh to help you guide your learning.
            </p>
          </div>
          
          <button
            onClick={handleSync}
            disabled={syncing || loading}
            style={{
              padding: '8px 18px',
              background: syncing ? 'transparent' : ACCENT,
              border: `1px solid ${ACCENT}`,
              color: syncing ? ACCENT : '#000000',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              cursor: syncing || loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!syncing && !loading) {
                e.currentTarget.style.boxShadow = `0 0 12px ${ACCENT_RGBA}`;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'none';
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
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            color: '#ef4444',
            fontSize: '13px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="card" style={{ padding: '24px', height: '180px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#121212', border: '1px solid #1f1f1f', borderRadius: '8px' }}>
                <div style={{ height: '18px', width: '60%', background: '#222222', borderRadius: '4px' }}></div>
                <div style={{ height: '12px', width: '40%', background: '#222222', borderRadius: '4px' }}></div>
                <div style={{ height: '36px', width: '100%', background: '#222222', borderRadius: '4px', marginTop: 'auto' }}></div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {Object.entries(categories).map(([category, items]) => (
              <div key={category}>
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#ff9e42', borderBottom: '1px solid #1f1f1f', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {category}
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {items.map((item) => (
                    <Link key={item.id} href={`/dashboard/roadmaps/${item.id}`} style={{ textDecoration: 'none' }}>
                      <div
                        className="card card-hover"
                        style={{
                          padding: '24px',
                          background: '#121212',
                          border: '1px solid #1f1f1f',
                          borderRadius: '8px',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = ACCENT;
                          e.currentTarget.style.boxShadow = `0 0 15px ${ACCENT_RGBA}`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#1f1f1f';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                          {item.name}
                        </h3>
                        
                        <p style={{ fontSize: '12px', color: '#aaaaaa', margin: 0, lineHeight: 1.5, flexGrow: 1 }}>
                          {item.description}
                        </p>

                        <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '8px' }}>
                          <span style={{ fontSize: '10px', background: '#1c1c1e', padding: '3px 8px', borderRadius: '4px', color: '#cccccc', border: '1px solid #2c2c2e' }}>
                            {item.difficulty_level}
                          </span>
                          <span style={{ fontSize: '10px', background: '#1c1c1e', padding: '3px 8px', borderRadius: '4px', color: '#cccccc', border: '1px solid #2c2c2e' }}>
                            ⏱ {item.estimated_duration}
                          </span>
                        </div>
                        
                        <div style={{ color: ACCENT, fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', borderTop: '1px solid #1f1f1f', paddingTop: '12px', marginTop: '8px' }}>
                          View Roadmap path →
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
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
