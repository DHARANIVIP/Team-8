'use client';

interface ReadinessRingProps {
  percentage: number;
  size?: number;
  label?: string;
}

export default function ReadinessRing({ percentage, size = 100, label }: ReadinessRingProps) {
  const r = 40;
  const strokeDasharray = 2 * Math.PI * r;
  const strokeDashoffset = strokeDasharray - (percentage / 100) * strokeDasharray;

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="transparent" stroke="rgba(37, 99, 235, 0.05)" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="transparent"
          stroke="var(--accent)"
          strokeWidth="6"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50px 50px',
            transition: 'stroke-dashoffset 0.5s ease',
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
          {percentage}%
        </span>
        {label && (
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</span>
        )}
      </div>
    </div>
  );
}
