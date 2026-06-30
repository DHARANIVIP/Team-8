'use client';

import Link from 'next/link';
import type { GapAnalysisResponse, SkillsAdvisorResponse } from '@/lib/types/skills';
import { urgencyColor } from '@/lib/utils/skillMatching';
import ReadinessRing from './ReadinessRing';

interface SkillsSidebarProps {
  gap: GapAnalysisResponse | null;
  advisor: SkillsAdvisorResponse | null;
  advisorLoading: boolean;
}

export default function SkillsSidebar({ gap, advisor, advisorLoading }: SkillsSidebarProps) {
  const readiness = gap?.readiness ?? advisor?.readiness ?? 0;
  const careerName = gap?.careerName ?? advisor?.careerName ?? 'Target Career';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        className="card"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          border: '1px solid rgba(37, 99, 235, 0.15)',
        }}
      >
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Target Readiness
        </span>
        <ReadinessRing percentage={readiness} />
        <p style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600, margin: '12px 0 4px' }}>{careerName}</p>
        {gap && (
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
            {gap.skills.filter(s => s.acquired).length} of {gap.skills.length} required skills acquired
          </p>
        )}
      </div>

      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Learning Advisor
        </h4>
        {advisorLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}><div className="spinner" /></div>
        ) : advisor ? (
          <>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>{advisor.summary}</p>
            {advisor.strengths.length > 0 && (
              <div>
                <p style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, marginBottom: '6px' }}>STRENGTHS</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {advisor.strengths.map(s => (
                    <span key={s} style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0, borderLeft: '2px solid var(--accent)', paddingLeft: '10px' }}>
              {advisor.weeklyFocus}
            </p>
          </>
        ) : (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Advisor insights will appear once your profile is loaded.</p>
        )}
      </div>

      {advisor && advisor.nextActions.length > 0 && (
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Next Actions
          </h4>
          {advisor.nextActions.map((action, i) => (
            <div key={i} style={{ borderLeft: `2px solid ${urgencyColor(action.urgency)}`, paddingLeft: '10px' }}>
              <p style={{ fontSize: '11px', color: '#ffffff', margin: '0 0 2px', fontWeight: 600 }}>{action.skill}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>{action.action}</p>
              {action.courseUrl && (
                <a href={action.courseUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '10px', color: 'var(--accent)' }}>
                  Open course →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>Quick Links</h4>
        <Link href="/dashboard/courses" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>Browse Courses →</Link>
        <Link href="/dashboard/roadmaps" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>View Roadmaps →</Link>
        <Link href="/dashboard/compare" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>Compare Careers →</Link>
      </div>
    </div>
  );
}
