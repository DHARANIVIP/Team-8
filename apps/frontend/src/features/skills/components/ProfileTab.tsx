'use client';

import { useState } from 'react';
import type { UserSkill } from '@/lib/types/skills';
import { proficiencyColor } from '@/lib/utils/skillMatching';
import { deleteUserSkill, updateUserSkillProgress } from '@/lib/services/skill-service';

interface ProfileTabProps {
  skills: UserSkill[];
  onRefresh: () => void;
}

export default function ProfileTab({ skills, onRefresh }: ProfileTabProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [editingSkillName, setEditingSkillName] = useState('');
  const [editingProficiency, setEditingProficiency] = useState('Intermediate');
  const [editingProgress, setEditingProgress] = useState(50);

  const categories = ['All', ...Array.from(new Set(skills.map(s => s.category || 'General')))];
  const filtered = activeCategory === 'All'
    ? skills
    : skills.filter(s => (s.category || 'General') === activeCategory);

  const handleSave = async (name: string) => {
    await updateUserSkillProgress(name, editingProficiency, editingProgress);
    setEditingSkillName('');
    onRefresh();
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Remove "${name}" from your profile?`)) return;
    await deleteUserSkill(name);
    onRefresh();
  };

  if (skills.length === 0) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center', opacity: 0.8 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No skills in your profile. Use AI analysis or Add Skill to get started.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={activeCategory === cat ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: '11px', padding: '5px 12px' }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {filtered.map(skill => {
          const colors = proficiencyColor(skill.proficiency);
          const isEditing = editingSkillName === skill.skill_name;

          return (
            <div
              key={skill.skill_name}
              className="card card-hover"
              style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(18, 18, 18, 0.4)', border: '1px solid rgba(37, 99, 235, 0.08)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: 700, margin: 0, fontFamily: 'Outfit, sans-serif' }}>{skill.skill_name}</h4>
                  <span className="badge badge-muted" style={{ fontSize: '9px', marginTop: '4px' }}>{skill.category || 'General'}</span>
                </div>
                <span className="badge" style={{ ...colors, fontSize: '10px' }}>{skill.proficiency}</span>
              </div>

              <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Source: {skill.source || 'user'}
              </span>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>Progress</span>
                  <span>{skill.progress_percentage || 0}%</span>
                </div>
                <div style={{ background: 'rgba(37, 99, 235,0.05)', height: '6px', border: '1px solid rgba(37, 99, 235,0.1)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${skill.progress_percentage || 0}%`, background: skill.proficiency === 'Expert' ? '#10b981' : 'var(--accent)' }} />
                </div>
              </div>

              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(37, 99, 235,0.1)' }}>
                  <select value={editingProficiency} onChange={e => setEditingProficiency(e.target.value)} style={{ width: '100%', background: '#0a0a0a', border: '1px solid rgba(37, 99, 235,0.3)', color: '#fff', fontSize: '11px', padding: '4px' }}>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Expert">Expert</option>
                  </select>
                  <input type="range" min={10} max={100} step={5} value={editingProgress} onChange={e => setEditingProgress(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button className="btn-outline" style={{ fontSize: '10px', padding: '4px 10px' }} onClick={() => setEditingSkillName('')}>Cancel</button>
                    <button className="btn-primary" style={{ fontSize: '10px', padding: '4px 10px' }} onClick={() => handleSave(skill.skill_name)}>Save</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn-ghost"
                    style={{ flex: 1, fontSize: '10px', padding: '5px', border: '1px dashed rgba(37, 99, 235,0.2)' }}
                    onClick={() => {
                      setEditingSkillName(skill.skill_name);
                      setEditingProficiency(skill.proficiency || 'Intermediate');
                      setEditingProgress(skill.progress_percentage || 50);
                    }}
                  >
                    Adjust
                  </button>
                  <button className="btn-ghost" style={{ fontSize: '10px', padding: '5px 10px', color: '#ef4444', border: '1px dashed rgba(239,68,68,0.3)' }} onClick={() => handleDelete(skill.skill_name)}>
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
