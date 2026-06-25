'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { getCurrentUser, isAuthenticated } from '@/lib/services/auth-service';
import { getProfile, updateProfile } from '@/lib/services/profile-service';

/* ── tiny reusable section card ── */
function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#111111',
      border: '1px solid #1f1f1f',
      borderRadius: '10px',
      padding: '28px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
      <span style={{ color: '#ff9e42', fontSize: '18px' }}>{icon}</span>
      <h2 style={{ color: '#cccccc', fontWeight: 800, fontSize: '20px', margin: 0 }}>{children}</h2>
    </div>
  );
}

function InputField({ label, placeholder, value, type = 'text', onChange }: { label?: string; placeholder: string; value?: string; type?: string; onChange?: (val: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
      {label && <label style={{ color: '#aaaaaa', fontSize: '12px', fontWeight: 500 }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: '#0d0d0d',
          border: '1px solid #2a2a2a',
          borderRadius: '6px',
          padding: '9px 14px',
          color: '#cccccc',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.2s',
          width: '100%',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#ff9e42')}
        onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
      />
    </div>
  );
}

function AccentBtn({ children, small, onClick, type = 'button' }: { children: React.ReactNode; small?: boolean; onClick?: () => void; type?: 'button' | 'submit' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        background: '#ff9e42',
        color: '#0d0d0d',
        border: 'none',
        borderRadius: '6px',
        padding: small ? '7px 16px' : '9px 22px',
        fontWeight: 700,
        fontSize: small ? '12px' : '13px',
        cursor: 'pointer',
        whiteSpace: 'nowrap' as const,
        transition: 'background 0.18s',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#ff9757')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#ff9e42')}
    >{children}</button>
  );
}

function OutlineBtn({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  const c = danger ? '#ef4444' : '#ff9e42';
  return (
    <button style={{
      background: 'transparent',
      color: c,
      border: `1px solid ${c}55`,
      borderRadius: '6px',
      padding: '7px 16px',
      fontWeight: 600,
      fontSize: '12px',
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
      transition: 'all 0.18s',
    }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = `${c}15`;
        (e.currentTarget as HTMLElement).style.borderColor = c;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
        (e.currentTarget as HTMLElement).style.borderColor = `${c}55`;
      }}
    >{children}</button>
  );
}

/* ── snapshot stat tile ── */
function SnapTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{
      background: '#0d0d0d',
      border: '1px solid #1f1f1f',
      borderRadius: '8px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div>
        <p style={{ color: '#aaaaaa', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <p style={{ color: '#cccccc', fontWeight: 800, fontSize: '24px', lineHeight: 1 }}>{value}</p>
      </div>
      <span style={{ color: '#ff9e42', fontSize: '20px' }}>{icon}</span>
    </div>
  );
}

/* ── toggle row ── */
function ToggleRow({ label, sub, checked }: { label: string; sub?: string; checked?: boolean }) {
  const [on, setOn] = useState(checked ?? false);
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 14px',
      background: '#0d0d0d',
      border: '1px solid #1f1f1f',
      borderRadius: '7px',
    }}>
      <div>
        <p style={{ color: '#cccccc', fontSize: '13px', fontWeight: 600, margin: 0 }}>{label}</p>
        {sub && <p style={{ color: '#666', fontSize: '11px', margin: '2px 0 0' }}>{sub}</p>}
      </div>
      <button
        onClick={() => setOn(!on)}
        style={{
          width: '38px', height: '20px', borderRadius: '999px',
          background: on ? '#ff9e42' : '#2a2a2a',
          border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: '2px',
          left: on ? '20px' : '2px',
          width: '16px', height: '16px', borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
        }} />
      </button>
    </div>
  );
}

/* ── skill tag ── */
function SkillTag({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: 'rgba(255,158,66,0.10)',
      border: '1px solid rgba(255,158,66,0.30)',
      borderRadius: '999px',
      padding: '4px 12px',
      color: '#ff9e42',
      fontSize: '12px',
      fontWeight: 600,
    }}>
      {name}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff9e42', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
    </span>
  );
}

/* ══════════════════════════════════════
   PAGE
   ══════════════════════════════════════ */
export default function ProfilePage() {
  const router = useRouter();
  
  const [displayName, setDisplayName] = useState('Student');
  const [email, setEmail] = useState('email@example.com');
  const [skills, setSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('Beginner');
  const [newSkill, setNewSkill] = useState('');
  const [targetCareer, setTargetCareer] = useState('Software Engineer');
  const [salaryGoal, setSalaryGoal] = useState('₹15L+');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Client-side authentication check and initial state loading
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const user = getCurrentUser();
    if (user) {
      setDisplayName(user.name);
      setEmail(user.email);
    }

    async function loadProfile() {
      try {
        const data = await getProfile();
        if (data) {
          setSkills(data.current_skills || []);
          setExperienceLevel(data.experience_level || 'Beginner');
        }
      } catch (err) {
        console.error('Failed to load profile details from DB:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  function addSkill() {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setNewSkill('');
  }

  async function saveProfile() {
    try {
      await updateProfile({ current_skills: skills, experience_level: experienceLevel });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save profile changes:', err);
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <DashboardNavbar />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBottom: '16px', borderBottom: '1px solid #1f1f1f', marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              color: '#cccccc', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
              border: '1px solid #ff9e42', borderRadius: '4px', padding: '8px 16px',
              background: 'transparent', transition: 'all 0.18s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,158,66,0.1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              ← Back to Dashboard
            </Link>
            <h1 style={{ color: '#ffffff', fontWeight: 700, fontSize: '24px', margin: 0, letterSpacing: '0.5px' }}>My Profile</h1>
          </div>
        </div>

        {/* ── Hero Card ── */}
        <div style={{
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* decorative glow */}
          <div style={{
            position: 'absolute', top: '-40px', right: '-40px',
            width: '180px', height: '180px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,158,66,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Avatar */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff9e42, #ff9757)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 800, color: '#0d0d0d',
            flexShrink: 0, border: '3px solid rgba(255,158,66,0.3)',
          }}>
            {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST'}
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#cccccc', fontWeight: 800, fontSize: '22px', margin: '0 0 4px' }}>{displayName}</h2>
            <p style={{ color: '#666', fontSize: '13px', margin: '0 0 8px' }}>{email} · Last active: Recently</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(255,158,66,0.12)', border: '1px solid rgba(255,158,66,0.3)', borderRadius: '999px', padding: '3px 10px', color: '#ff9e42', fontSize: '11px', fontWeight: 700 }}>
                🎯 {targetCareer}
              </span>
              <span style={{ background: 'rgba(255,158,66,0.08)', border: '1px solid #2a2a2a', borderRadius: '999px', padding: '3px 10px', color: '#aaaaaa', fontSize: '11px' }}>
                Member since June 2026
              </span>
            </div>
          </div>

          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'transparent', border: '1px solid rgba(255,158,66,0.4)',
            borderRadius: '6px', padding: '7px 16px',
            color: '#ff9e42', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.18s',
          }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(255,158,66,0.1)'}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            ↑ Upload Avatar
          </button>
        </div>

        {/* ── Two column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Account Basics */}
          <Section>
            <SectionTitle icon="✎">Account Basics</SectionTitle>
            <p style={{ color: '#666', fontSize: '13px', marginTop: '-10px' }}>Update your identity within the workspace.</p>
            <div>
              <label style={{ color: '#aaaaaa', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Display Name</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{
                    flex: 1, background: '#0d0d0d', border: '1px solid #2a2a2a',
                    borderRadius: '6px', padding: '9px 14px', color: '#cccccc', fontSize: '14px', outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#ff9e42')}
                  onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
                />
                <AccentBtn small onClick={saveProfile}>Save</AccentBtn>
              </div>
            </div>
            <div>
              <label style={{ color: '#aaaaaa', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Account Email</label>
              <p style={{ color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff9e42" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                {email}
              </p>
            </div>
          </Section>

          {/* Security */}
          <Section>
            <SectionTitle icon="🛡">Security</SectionTitle>
            <p style={{ color: '#666', fontSize: '13px', marginTop: '-10px' }}>Keep your account safe and up to date.</p>
            <div style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ color: '#cccccc', fontWeight: 600, fontSize: '14px', margin: 0 }}>Password</p>
                <span style={{ color: '#666', fontSize: '11px' }}>Last signed in: Recently</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#555', fontSize: '18px', letterSpacing: '4px' }}>••••••••</span>
                <AccentBtn small>Reset</AccentBtn>
              </div>
            </div>
            <p style={{ color: '#555', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
              💡 Tip: Enable two-factor authentication from your email provider for additional safety.
            </p>
          </Section>
        </div>

        {/* ── Career Goal ── */}
        <Section>
          <SectionTitle icon="◈">Career Goal & Target</SectionTitle>
          <p style={{ color: '#666', fontSize: '13px', marginTop: '-10px' }}>
            Set your target career path so we can personalise recommendations and skill gap analysis.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ color: '#aaaaaa', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Target Career</label>
              <select
                value={targetCareer}
                onChange={(e) => setTargetCareer(e.target.value)}
                style={{
                  width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a',
                  borderRadius: '6px', padding: '9px 14px', color: '#cccccc', fontSize: '14px',
                  outline: 'none', cursor: 'pointer',
                }}
              >
                {['Software Engineer', 'Data Scientist', 'UX Designer', 'Cybersecurity Analyst', 'Product Manager', 'Cloud Architect'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ color: '#aaaaaa', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                style={{
                  width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a',
                  borderRadius: '6px', padding: '9px 14px', color: '#cccccc', fontSize: '14px',
                  outline: 'none', cursor: 'pointer',
                }}
              >
                {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
            <Link href="/dashboard/skills" style={{ color: '#ff9e42', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
              View Skill Gap Analysis →
            </Link>
            <Link href="/dashboard/courses" style={{ color: '#aaaaaa', fontSize: '13px', textDecoration: 'none' }}>
              Find Courses
            </Link>
          </div>
        </Section>

        {/* ── Career Snapshot ── */}
        <Section>
          <SectionTitle icon="◉">Career &amp; Activity Snapshot</SectionTitle>
          <p style={{ color: '#666', fontSize: '13px', marginTop: '-10px' }}>A quick overview of your activity inside Mastermind.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <SnapTile icon="◈" label="Careers Explored" value="6" />
            <SnapTile icon="◉" label="Skills Mapped" value="12" />
            <SnapTile icon="◎" label="Courses Found" value="8" />
            <SnapTile icon="⊞" label="Comparisons" value="3" />
          </div>
        </Section>

        {/* ── Skills ── */}
        <Section>
          <SectionTitle icon="◎">Your Skills</SectionTitle>
          <p style={{ color: '#666', fontSize: '13px', marginTop: '-10px' }}>Skills you currently have — used for gap analysis against your target career.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {skills.map((s) => (
              <SkillTag key={s} name={s} onRemove={() => setSkills(skills.filter((x) => x !== s))} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSkill()}
              placeholder="Add a skill…"
              style={{
                flex: 1, background: '#0d0d0d', border: '1px solid #2a2a2a',
                borderRadius: '6px', padding: '9px 14px', color: '#cccccc', fontSize: '14px', outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#ff9e42')}
              onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
            />
            <AccentBtn small onClick={addSkill}>+ Add</AccentBtn>
          </div>
        </Section>

        {/* ── Notification Prefs ── */}
        <Section>
          <SectionTitle icon="🔔">Notification Preferences</SectionTitle>
          <p style={{ color: '#666', fontSize: '13px', marginTop: '-10px' }}>Choose how you stay informed about your career journey.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <ToggleRow label="Email updates" sub="Weekly digest and product updates" checked={true} />
            <ToggleRow label="Browser push" sub="Real-time alerts while you are signed in" />
            <ToggleRow label="Job alerts" sub="Instant notifications for matching roles" checked={true} />
            <ToggleRow label="Market updates" sub="Daily summaries for your watchlist" />
          </div>
          <AccentBtn>Save notification settings</AccentBtn>
        </Section>

        {/* ── Save All ── */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingBottom: '20px' }}>
          <button
            onClick={saveProfile}
            style={{
              background: '#ff9e42', color: '#0d0d0d', border: 'none', borderRadius: '7px',
              padding: '11px 28px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', transition: 'background 0.18s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#ff9757')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#ff9e42')}
          >
            {saved ? '✓ Saved!' : 'Save All Changes'}
          </button>
          <Link href="/dashboard" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }}>Cancel</Link>
        </div>
      </main>
    </div>
  );
}
