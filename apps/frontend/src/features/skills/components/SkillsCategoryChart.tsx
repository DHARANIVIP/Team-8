'use client';

interface SkillsCategoryChartProps {
  domains: { name: string; score: number }[];
}

export default function SkillsCategoryChart({ domains }: SkillsCategoryChartProps) {
  if (!domains.length) {
    return (
      <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>Add skills to see category breakdown.</p>
      </div>
    );
  }

  const maxScore = Math.max(...domains.map(d => d.score), 1);

  return (
    <div
      className="card"
      style={{
        padding: '20px',
        background: 'rgba(18, 18, 18, 0.4)',
        border: '1px solid rgba(255, 158, 66, 0.1)',
      }}
    >
      <h3 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Category Proficiency
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {domains.map(d => (
          <div key={d.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600 }}>{d.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{d.score}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,158,66,0.05)', border: '1px solid rgba(255,158,66,0.1)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(d.score / maxScore) * 100}%`,
                  background: d.score >= 75 ? '#10b981' : 'var(--accent)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
