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
    <div className="card" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '28px 32px'
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
      <span style={{ color: 'var(--accent)', fontSize: '18px', display: 'inline-flex' }}>{icon}</span>
      <h2 style={{ color: '#ffffff', fontWeight: 700, fontSize: '18px', margin: 0, fontFamily: 'Outfit, sans-serif' }}>{children}</h2>
    </div>
  );
}

function InputField({ label, placeholder, value, type = 'text', onChange }: { label?: string; placeholder: string; value?: string; type?: string; onChange?: (val: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
      {label && <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );
}

/* ── snapshot stat tile ── */
function SnapTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{
      background: 'var(--surface-alt)',
      border: '1px solid rgba(255, 158, 66, 0.1)',
      borderRadius: '6px',
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
        <p style={{ color: '#ffffff', fontWeight: 800, fontSize: '24px', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>{value}</p>
      </div>
      <span style={{ color: 'var(--accent)', fontSize: '20px' }}>{icon}</span>
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
      padding: '12px 16px',
      background: 'var(--surface-alt)',
      border: '1px solid rgba(255, 158, 66, 0.08)',
      borderRadius: '6px',
    }}>
      <div>
        <p style={{ color: '#ffffff', fontSize: '13px', fontWeight: 600, margin: 0, fontFamily: 'Outfit, sans-serif' }}>{label}</p>
        {sub && <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '2px 0 0' }}>{sub}</p>}
      </div>
      <button
        type="button"
        onClick={() => setOn(!on)}
        style={{
          width: '38px', height: '20px', borderRadius: '999px',
          background: on ? 'var(--accent)' : 'var(--border-dark)',
          border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: '2px',
          left: on ? '20px' : '2px',
          width: '16px', height: '16px', borderRadius: '50%',
          background: on ? '#0a0a0a' : '#ffffff', transition: 'left 0.2s',
        }} />
      </button>
    </div>
  );
}

/* ── skill tag ── */
function SkillTag({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span className="skill-pill" style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '5px 12px',
      fontWeight: 600,
    }}>
      {name}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
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
          if (data.target_career) setTargetCareer(data.target_career);
          if (data.salary_goal) setSalaryGoal(data.salary_goal);
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
      await updateProfile({ current_skills: skills, experience_level: experienceLevel, target_career: targetCareer, salary_goal: salaryGoal });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save profile changes:', err);
    }
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <DashboardNavbar />

      <main className="page-container animate-slide-up" style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBottom: '20px', borderBottom: '1px solid rgba(255, 158, 66, 0.15)', marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 style={{ color: '#ffffff', fontWeight: 700, fontSize: '24px', margin: 0, letterSpacing: '0.5px', fontFamily: 'Outfit, sans-serif' }}>My Profile</h1>
          </div>
        </div>

        {loading ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center', opacity: 0.8 }}>
            <p style={{ color: 'var(--accent)', fontSize: '15px', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>Loading profile dashboard...</p>
          </div>
        ) : (
          <>
            {/* ── Hero Card ── */}
            <div className="card animate-fade-in" style={{
              background: 'linear-gradient(135deg, var(--surface) 0%, #0a0a0a 100%)',
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
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-soft))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 800,
                color: '#0a0a0a',
                flexShrink: 0,
                border: '3px solid rgba(255,158,66,0.3)',
                fontFamily: 'Outfit, sans-serif'
              }}>
                {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST'}
              </div>

              <div style={{ flex: 1 }}>
                <h2 style={{ color: '#ffffff', fontWeight: 800, fontSize: '22px', margin: '0 0 4px', fontFamily: 'Outfit, sans-serif' }}>{displayName}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 8px' }}>{email} · Last active: Recently</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="badge badge-accent">
                    🎯 {targetCareer}
                  </span>
                  <span className="badge badge-muted">
                    Member since June 2026
                  </span>
                </div>
              </div>

              <button className="btn-outline" style={{ fontSize: '12px', padding: '6px 14px' }}>
                ↑ Upload Avatar
              </button>
            </div>

            {/* ── Two column layout ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>

              {/* Account Basics */}
              <Section>
                <SectionTitle icon="✎">Account Basics</SectionTitle>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '-10px' }}>Update your identity within the workspace.</p>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Display Name</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="input-field"
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={saveProfile}>Save</button>
                  </div>
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Account Email</label>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 500 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    {email}
                  </p>
                </div>
              </Section>

              {/* Security */}
              <Section>
                <SectionTitle icon="🛡">Security</SectionTitle>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '-10px' }}>Keep your account safe and up to date.</p>
                <div style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-dark)', borderRadius: '6px', padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <p style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Password</p>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Last signed in: Recently</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '18px', letterSpacing: '4px' }}>••••••••</span>
                    <button type="button" className="btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }} onClick={() => router.push('/dashboard/settings')}>Reset</button>
                  </div>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
                  💡 Tip: Enable two-factor authentication from your email provider for additional safety.
                </p>
              </Section>
            </div>

            {/* ── Career Goal ── */}
            <Section>
              <SectionTitle icon="◈">Career Goal & Target</SectionTitle>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '-10px' }}>
                Set your target career path so we can personalise recommendations and skill gap analysis.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Target Career</label>
                  <select
                    value={targetCareer}
                    onChange={(e) => setTargetCareer(e.target.value)}
                    className="input-field"
                    style={{ cursor: 'pointer' }}
                  >
                    {['Software Engineer', 'Data Scientist', 'UX Designer', 'Cybersecurity Analyst', 'Product Manager', 'Cloud Architect'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="input-field"
                    style={{ cursor: 'pointer' }}
                  >
                    {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
                <Link href="/dashboard/skills" style={{ color: 'var(--accent)', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
                  View Skill Gap Analysis →
                </Link>
                <Link href="/dashboard/courses" style={{ color: 'var(--text-secondary)', fontSize: '13px', textDecoration: 'none' }}>
                  Find Courses
                </Link>
              </div>
            </Section>

            {/* ── Career Snapshot ── */}
            <Section>
              <SectionTitle icon="◉">Career &amp; Activity Snapshot</SectionTitle>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '-10px' }}>A quick overview of your activity inside Mastermind.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <SnapTile icon="◈" label="Careers Explored" value="6" />
                <SnapTile icon="◉" label="Skills Mapped" value="12" />
                <SnapTile icon="◎" label="Courses Found" value="8" />
                <SnapTile icon="⊞" label="Comparisons" value="3" />
              </div>
            </Section>

            {/* ── Skills ── */}
            <Section>
              <SectionTitle icon="◎">Your Skills</SectionTitle>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '-10px' }}>Skills you currently have — used for gap analysis against your target career.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {skills.length > 0 ? (
                  skills.map((s) => (
                    <SkillTag key={s} name={s} onRemove={() => setSkills(skills.filter((x) => x !== s))} />
                  ))
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No skills added yet.</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                <input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                  placeholder="Add a skill…"
                  className="input-field"
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={addSkill}>+ Add</button>
              </div>
            </Section>

            {/* ── Notification Prefs ── */}
            <Section>
              <SectionTitle icon="🔔">Notification Preferences</SectionTitle>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '-10px' }}>Choose how you stay informed about your career journey.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <ToggleRow label="Email updates" sub="Weekly digest and product updates" checked={true} />
                <ToggleRow label="Browser push" sub="Real-time alerts while you are signed in" />
                <ToggleRow label="Job alerts" sub="Instant notifications for matching roles" checked={true} />
                <ToggleRow label="Market updates" sub="Daily summaries for your watchlist" />
              </div>
              <button type="button" className="btn-primary" style={{ fontSize: '13px', alignSelf: 'flex-start', marginTop: '4px' }} onClick={saveProfile}>Save notification settings</button>
            </Section>

            {/* ── Save All ── */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', paddingBottom: '20px', flexWrap: 'wrap' }}>
              <button
                onClick={saveProfile}
                className="btn-primary"
                style={{
                  padding: '11px 28px', fontSize: '14px',
                }}
              >
                {saved ? '✓ Saved!' : 'Save All Changes'}
              </button>
              <Link href="/dashboard" style={{ color: 'var(--text-secondary)', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>Cancel</Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
