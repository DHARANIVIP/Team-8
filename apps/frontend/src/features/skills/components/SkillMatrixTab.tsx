'use client';

import type { UserSkill } from '@/lib/types/skills';
import { groupSkillsByCategory } from '@/lib/utils/skillMatching';

interface SkillMatrixTabProps {
  skills: UserSkill[];
}

const LEVELS = ['Beginner', 'Intermediate', 'Expert'] as const;

export default function SkillMatrixTab({ skills }: SkillMatrixTabProps) {
  const grouped = groupSkillsByCategory(skills);
  const categories = Array.from(grouped.keys()).sort();

  if (skills.length === 0) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Add skills to view your proficiency matrix.</p>
      </div>
    );
  }

  const matrix: Record<string, Record<string, number>> = {};
  for (const cat of categories) {
    matrix[cat] = { Beginner: 0, Intermediate: 0, Expert: 0 };
    for (const skill of grouped.get(cat) || []) {
      const level = skill.proficiency || 'Intermediate';
      if (matrix[cat][level] !== undefined) matrix[cat][level] += 1;
    }
  }

  const maxCell = Math.max(
    ...categories.flatMap(cat => LEVELS.map(l => matrix[cat][l])),
    1
  );

  return (
    <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
      <h3 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 700, marginBottom: '20px', fontFamily: 'Outfit, sans-serif' }}>
        Proficiency Matrix
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '360px' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', padding: '8px', borderBottom: '1px solid rgba(37, 99, 235,0.15)' }}>Category</th>
            {LEVELS.map(level => (
              <th key={level} style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', padding: '8px', borderBottom: '1px solid rgba(37, 99, 235,0.15)' }}>{level}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat}>
              <td style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600, padding: '10px 8px', borderBottom: '1px solid rgba(37, 99, 235,0.08)' }}>{cat}</td>
              {LEVELS.map(level => {
                const count = matrix[cat][level];
                const intensity = count / maxCell;
                return (
                  <td key={level} style={{ textAlign: 'center', padding: '10px 8px', borderBottom: '1px solid rgba(37, 99, 235,0.08)' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '36px',
                        height: '36px',
                        borderRadius: '4px',
                        background: count > 0 ? `rgba(37, 99, 235, ${0.15 + intensity * 0.55})` : 'rgba(37, 99, 235,0.03)',
                        border: `1px solid rgba(37, 99, 235, ${count > 0 ? 0.3 : 0.08})`,
                        color: count > 0 ? '#ffffff' : 'var(--text-muted)',
                        fontWeight: 700,
                        fontSize: '13px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {count}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
