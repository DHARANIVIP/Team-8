'use client';

import Link from 'next/link';
import type { CareerOption, GapAnalysisResponse } from '@/lib/types/skills';
import { updateUserSkillProgress } from '@/lib/services/skill-service';

interface GapAnalysisTabProps {
  careers: CareerOption[];
  selectedCareerId: string;
  onCareerChange: (id: string) => void;
  gap: GapAnalysisResponse | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function GapAnalysisTab({
  careers,
  selectedCareerId,
  onCareerChange,
  gap,
  loading,
  onRefresh,
}: GapAnalysisTabProps) {
  const handleMarkAcquired = async (name: string) => {
    await updateUserSkillProgress(name, 'Intermediate', 60);
    onRefresh();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card" style={{ padding: '20px 24px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.02em' }}>
          COMPARE WITH TARGET CAREER
        </span>
        <select
          value={selectedCareerId}
          onChange={e => onCareerChange(e.target.value)}
          style={{
            width: '100%',
            marginTop: '8px',
            background: '#0a0a0a',
            border: '1px solid rgba(37, 99, 235, 0.3)',
            padding: '10px 14px',
            color: '#ffffff',
            fontSize: '13px',
          }}
        >
          {careers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 700, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
            Required Skills for <span style={{ color: 'var(--accent)' }}>{gap?.careerName || '...'}</span>
          </h3>
          {gap && gap.skills.length > 0 && (
            <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>
              {gap.readiness}% ready
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}><div className="spinner" /></div>
        ) : !gap || gap.skills.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
            {gap?.message || 'No skills registered for this career path in the database.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {gap.skills.map(skill => (
              <div key={skill.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>{skill.name}</span>
                    <span className="badge badge-muted" style={{ fontSize: '9px' }}>{skill.category}</span>
                    {skill.acquired ? (
                      <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', fontSize: '9px' }}>
                        Acquired ({skill.proficiency})
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', fontSize: '9px' }}>
                        Gap · Priority {skill.priorityScore}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Importance: <strong style={{ color: '#ffffff' }}>{skill.importance}%</strong>
                  </span>
                </div>

                <div style={{ height: '6px', background: 'rgba(37, 99, 235,0.03)', border: '1px solid rgba(37, 99, 235,0.08)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${skill.acquired ? skill.progress_percentage || 60 : 8}%`,
                    background: skill.acquired ? '#10b981' : 'rgba(239,68,68,0.6)',
                  }} />
                </div>

                {!skill.acquired && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn-ghost" style={{ fontSize: '9px', padding: '2px 8px', border: '1px dashed var(--accent)' }} onClick={() => handleMarkAcquired(skill.name)}>
                      + Mark Acquired
                    </button>
                    {skill.recommendedCourses?.[0] ? (
                      <a href={skill.recommendedCourses[0].url || '#'} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: '9px', padding: '2px 8px', color: 'var(--accent)', textDecoration: 'none' }}>
                        {skill.recommendedCourses[0].title} ({skill.recommendedCourses[0].provider})
                      </a>
                    ) : (
                      <Link href={`/dashboard/courses?skill=${encodeURIComponent(skill.name)}`} className="btn-ghost" style={{ fontSize: '9px', padding: '2px 8px', color: 'var(--accent)', textDecoration: 'none' }}>
                        Browse courses
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
