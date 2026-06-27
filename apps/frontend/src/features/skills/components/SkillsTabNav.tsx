'use client';

import type { SkillsTab } from '@/lib/types/skills';

const TABS: { id: SkillsTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'profile', label: 'My Profile' },
  { id: 'gap', label: 'Gap Analysis' },
  { id: 'matrix', label: 'Skill Matrix' },
  { id: 'fit', label: 'Career Fit' },
];

interface SkillsTabNavProps {
  activeTab: SkillsTab;
  onTabChange: (tab: SkillsTab) => void;
  skillCount?: number;
}

export default function SkillsTabNav({ activeTab, onTabChange, skillCount }: SkillsTabNavProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        borderBottom: '1px solid var(--border-dark)',
        paddingBottom: '12px',
        flexWrap: 'wrap',
      }}
    >
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            paddingBottom: '8px',
            borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : 'none',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          {tab.label}
          {tab.id === 'profile' && skillCount !== undefined ? ` (${skillCount})` : ''}
        </button>
      ))}
    </div>
  );
}
