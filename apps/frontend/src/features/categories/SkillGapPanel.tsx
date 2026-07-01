'use client';

import React from 'react';

interface SkillGapPanelProps {
  careerName: string;
  matchedSkills: string[];
  gapSkills: string[];
}

export default function SkillGapPanel({ careerName, matchedSkills = [], gapSkills = [] }: SkillGapPanelProps) {
  const total = matchedSkills.length + gapSkills.length;
  const coverage = total > 0 ? Math.round((matchedSkills.length / total) * 100) : 0;

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-card)',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: 'inset 0 0 12px rgba(59, 130, 246, 0.01)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div>
        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          SKILL GAP METRIC
        </span>
        <h3 style={{ fontSize: '15px', color: 'var(--color-text-primary)', fontWeight: 700, margin: '2px 0 0', fontFamily: 'Outfit, sans-serif' }}>
          Target: {careerName || 'Software Engineer'}
        </h3>
      </div>

      {/* Coverage Progress Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>Skill Coverage</span>
          <span style={{ color: coverage > 60 ? '#10b981' : 'var(--color-primary)', fontWeight: 700, fontSize: '12px' }}>
            {coverage}% Acquired
          </span>
        </div>
        <div style={{ background: 'var(--color-primary-light)', height: '8px', border: '1px solid var(--color-border-light)', overflow: 'hidden', borderRadius: '4px' }}>
          <div style={{ 
            background: coverage > 60 ? '#10b981' : 'var(--color-primary)', 
            height: '100%', 
            width: `${coverage}%`,
            transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
          }} />
        </div>
      </div>

      {/* Detailed Skill Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--color-border-light)', paddingTop: '14px' }}>
        {/* Acquired Skills */}
        <div>
          <p style={{ color: '#10b981', fontSize: '11px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>✓</span> Acquired ({matchedSkills.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {matchedSkills.length > 0 ? (
              matchedSkills.map(skill => (
                <span key={skill} style={{
                  fontSize: '10px',
                  padding: '3px 8px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: '#10b981',
                  fontWeight: 600,
                  borderRadius: '4px'
                }}>
                  {skill}
                </span>
              ))
            ) : (
              <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontStyle: 'italic' }}>None yet</span>
            )}
          </div>
        </div>

        {/* Skill Gaps */}
        <div>
          <p style={{ color: 'var(--color-primary)', fontSize: '11px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>⚠</span> Skill Gaps ({gapSkills.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {gapSkills.length > 0 ? (
              gapSkills.map(skill => (
                <span key={skill} style={{
                  fontSize: '10px',
                  padding: '3px 8px',
                  background: 'var(--color-primary-light)',
                  border: '1px solid var(--color-border-light)',
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  borderRadius: '4px'
                }}>
                  {skill}
                </span>
              ))
            ) : (
              <span style={{ color: '#10b981', fontSize: '11px', fontStyle: 'italic' }}>Complete match!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
