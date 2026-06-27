'use client';

import type { SkillsOverview } from '@/lib/types/skills';

interface SkillsKpiStripProps {
  overview: SkillsOverview | null;
}

export default function SkillsKpiStrip({ overview }: SkillsKpiStripProps) {
  const items = [
    { label: 'Total Skills', value: overview?.totalSkills ?? '—', sub: 'tracked in profile' },
    { label: 'Expert Level', value: overview?.expertCount ?? '—', sub: 'mastery tier' },
    {
      label: 'Target Readiness',
      value: overview ? `${overview.targetReadiness}%` : '—',
      sub: overview?.targetCareerName || 'set target career',
    },
    { label: 'Priority Gaps', value: overview?.priorityGapCount ?? '—', sub: 'skills to acquire' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
        marginBottom: '20px',
      }}
    >
      {items.map(item => (
        <div
          key={item.label}
          className="card"
          style={{
            padding: '16px 18px',
            background: 'rgba(18, 18, 18, 0.4)',
            border: '1px solid rgba(255, 158, 66, 0.1)',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {item.label}
          </span>
          <p
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#ffffff',
              margin: '4px 0 2px',
              fontFamily: 'monospace',
            }}
          >
            {item.value}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>{item.sub}</p>
        </div>
      ))}
    </div>
  );
}
