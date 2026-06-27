'use client';

import { useState, useEffect } from 'react';
import { suggestSkills, updateUserSkillProgress } from '@/lib/services/skill-service';

interface AddSkillModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
  existingNames: string[];
}

export default function AddSkillModal({ open, onClose, onAdded, existingNames }: AddSkillModalProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; category: string }[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [proficiency, setProficiency] = useState('Intermediate');
  const [progress, setProgress] = useState(50);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      try {
        const results = await suggestSkills(query);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open]);

  if (!open) return null;

  const handleAdd = async () => {
    const name = (selectedName || query).trim();
    if (!name) {
      setError('Enter or select a skill name');
      return;
    }
    if (existingNames.some(n => n.toLowerCase() === name.toLowerCase())) {
      setError('This skill is already in your profile');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await updateUserSkillProgress(name, proficiency, progress);
      onAdded();
      onClose();
      setQuery('');
      setSelectedName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add skill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: '420px', padding: '24px' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, marginBottom: '16px', fontFamily: 'Outfit, sans-serif' }}>
          Add Skill
        </h3>

        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
          SEARCH CATALOG OR TYPE CUSTOM
        </label>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setSelectedName(''); }}
          placeholder="e.g. Python, React, SQL..."
          style={{
            width: '100%',
            background: '#0a0a0a',
            border: '1px solid rgba(255,158,66,0.3)',
            color: '#ffffff',
            padding: '10px 12px',
            fontSize: '13px',
            marginBottom: '8px',
          }}
        />

        {suggestions.length > 0 && !selectedName && (
          <div style={{ maxHeight: '120px', overflowY: 'auto', marginBottom: '12px', border: '1px solid rgba(255,158,66,0.15)' }}>
            {suggestions.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => { setSelectedName(s.name); setQuery(s.name); }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,158,66,0.08)',
                  color: '#ffffff',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {s.name} <span style={{ color: 'var(--text-muted)' }}>({s.category})</span>
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>PROFICIENCY</label>
            <select
              value={proficiency}
              onChange={e => setProficiency(e.target.value)}
              style={{ width: '100%', background: '#0a0a0a', border: '1px solid rgba(255,158,66,0.3)', color: '#fff', fontSize: '12px', padding: '6px' }}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>PROGRESS ({progress}%)</label>
            <input type="range" min={10} max={100} step={5} value={progress} onChange={e => setProgress(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
          </div>
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-outline" onClick={onClose} style={{ fontSize: '12px', padding: '8px 16px' }}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleAdd} disabled={saving} style={{ fontSize: '12px', padding: '8px 16px' }}>
            {saving ? 'Adding...' : 'Add Skill'}
          </button>
        </div>
      </div>
    </div>
  );
}
