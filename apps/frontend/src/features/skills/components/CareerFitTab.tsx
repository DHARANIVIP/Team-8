'use client';

import type { CareerReadiness, SkillsTab } from '@/lib/types/skills';

interface CareerFitTabProps {
  readiness: CareerReadiness[];
  loading: boolean;
  onSelectCareer: (careerId: string) => void;
  onGoToGap: (tab: SkillsTab) => void;
}

export default function CareerFitTab({ readiness, loading, onSelectCareer, onGoToGap }: CareerFitTabProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (readiness.length === 0) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No careers found in the database.</p>
      </div>
    );
  }

  const maxReadiness = Math.max(...readiness.map(r => r.readiness), 1);

  return (
    <div className="card" style={{ padding: '24px' }}>
      <h3 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 700, marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>
        Career Readiness Comparison
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '24px' }}>
        How your current skills align with each career path in the catalog.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {readiness.map(item => (
          <div key={item.careerId}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                onClick={() => { onSelectCareer(item.careerId); onGoToGap('gap'); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif',
                  padding: 0,
                  textAlign: 'left',
                }}
              >
                {item.careerName}
              </button>
              <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>
                {item.readiness}%
              </span>
            </div>
            <div style={{ height: '10px', background: 'rgba(37, 99, 235,0.05)', border: '1px solid rgba(37, 99, 235,0.1)', overflow: 'hidden', borderRadius: '2px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(item.readiness / maxReadiness) * 100}%`,
                  background: item.readiness >= 70 ? '#10b981' : 'var(--accent)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {item.acquiredCount}/{item.totalRequired} skills · Gaps: {item.topGaps.length ? item.topGaps.join(', ') : 'none'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
