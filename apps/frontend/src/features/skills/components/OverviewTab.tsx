'use client';

import Link from 'next/link';
import type { GapAnalysisResponse, SkillsAdvisorResponse, SkillsOverview } from '@/lib/types/skills';
import SkillsCategoryChart from './SkillsCategoryChart';

interface OverviewTabProps {
  overview: SkillsOverview | null;
  gap: GapAnalysisResponse | null;
  advisor: SkillsAdvisorResponse | null;
  onGoToGap: () => void;
  onAnalyze: () => void;
  aiAnalyzing: boolean;
}

export default function OverviewTab({
  overview,
  gap,
  advisor,
  onGoToGap,
  onAnalyze,
  aiAnalyzing,
}: OverviewTabProps) {
  const topGaps = gap?.skills.filter(s => !s.acquired).slice(0, 3) || [];
  const hasSkills = (overview?.totalSkills ?? 0) > 0;

  if (!hasSkills) {
    return (
      <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
        <p style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>
          No skills in your profile yet
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px' }}>
          Run AI resume analysis or add skills manually to start tracking your career readiness.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={onAnalyze} disabled={aiAnalyzing} style={{ fontSize: '12px', padding: '10px 20px' }}>
            {aiAnalyzing ? 'Analyzing...' : '🤖 Analyze Resume Skills'}
          </button>
          <Link href="/onboarding" className="btn-ghost" style={{ fontSize: '12px', padding: '10px 20px', textDecoration: 'none' }}>
            Complete Onboarding
          </Link>
        </div>
      </div>
    );
  }

  const radarDomains = overview?.domainScores || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <SkillsCategoryChart domains={radarDomains} />

        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span className="section-label">READINESS SNAPSHOT</span>
          <p style={{ color: '#ffffff', fontSize: '28px', fontWeight: 800, margin: 0, fontFamily: 'monospace' }}>
            {overview?.targetReadiness ?? 0}%
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
            Alignment with <strong style={{ color: '#ffffff' }}>{overview?.targetCareerName || 'your target career'}</strong>
          </p>
          {overview?.lastAnalyzedAt && (
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: 0 }}>
              Last analyzed: {new Date(overview.lastAnalyzedAt).toLocaleDateString()}
            </p>
          )}
          <button className="btn-ghost" onClick={onGoToGap} style={{ fontSize: '11px', padding: '8px', marginTop: 'auto' }}>
            View full gap analysis →
          </button>
        </div>
      </div>

      {topGaps.length > 0 && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ color: '#ffffff', fontSize: '14px', fontWeight: 700, marginBottom: '16px', fontFamily: 'Outfit, sans-serif' }}>
            Top Priority Gaps
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topGaps.map(skill => (
              <div key={skill.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '13px' }}>{skill.name}</span>
                  <span className="badge badge-muted" style={{ fontSize: '9px', marginLeft: '8px' }}>{skill.category}</span>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Priority score: {skill.priorityScore}</p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {skill.recommendedCourses?.[0] ? (
                    <a
                      href={skill.recommendedCourses[0].url || `/dashboard/courses?skill=${encodeURIComponent(skill.name)}`}
                      target={skill.recommendedCourses[0].url ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="btn-ghost"
                      style={{ fontSize: '10px', padding: '4px 10px', textDecoration: 'none' }}
                    >
                      Find Course
                    </a>
                  ) : (
                    <Link href={`/dashboard/courses?skill=${encodeURIComponent(skill.name)}`} className="btn-ghost" style={{ fontSize: '10px', padding: '4px 10px', textDecoration: 'none' }}>
                      Find Course
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {advisor && advisor.criticalGaps.length > 0 && (
        <div style={{ background: 'rgba(255, 158, 66, 0.04)', borderLeft: '2px solid var(--accent)', padding: '12px 16px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            <strong style={{ color: 'var(--accent)' }}>Focus areas:</strong> {advisor.criticalGaps.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
