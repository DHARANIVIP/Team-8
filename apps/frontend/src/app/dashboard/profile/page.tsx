'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { getCurrentUser, isAuthenticated, getToken } from '@/lib/services/auth-service';
import { getProfile, updateProfile } from '@/lib/services/profile-service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/* ── reusable primitives ── */
function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px 32px' }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
      <span style={{ color: 'var(--color-primary)', fontSize: '18px', display: 'inline-flex' }}>{icon}</span>
      <h2 style={{ color: 'var(--color-text-primary)', fontWeight: 700, fontSize: '18px', margin: 0, fontFamily: 'Outfit, sans-serif' }}>{children}</h2>
    </div>
  );
}

function SnapTile({ icon, label, value, color }: { icon: string; label: string; value: string | number; color?: string }) {
  const c = color || 'var(--color-primary)';
  return (
    <div style={{
      background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-light)',
      borderRadius: '6px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
        <p style={{ color: 'var(--color-text-primary)', fontWeight: 800, fontSize: '26px', lineHeight: 1, fontFamily: 'Outfit, sans-serif' }}>{value}</p>
      </div>
      <span style={{ color: c, fontSize: '22px' }}>{icon}</span>
    </div>
  );
}

function SkillTag({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span className="skill-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', fontWeight: 600 }}>
      {name}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
    </span>
  );
}

function ToggleRow({ label, sub, checked }: { label: string; sub?: string; checked?: boolean }) {
  const [on, setOn] = useState(checked ?? false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', background: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border-light)', borderRadius: '6px',
    }}>
      <div>
        <p style={{ color: 'var(--color-text-primary)', fontSize: '13px', fontWeight: 600, margin: 0, fontFamily: 'Outfit, sans-serif' }}>{label}</p>
        {sub && <p style={{ color: 'var(--color-text-secondary)', fontSize: '11px', margin: '2px 0 0' }}>{sub}</p>}
      </div>
      <button type="button" onClick={() => setOn(!on)} style={{
        width: '38px', height: '20px', borderRadius: '999px',
        background: on ? 'var(--color-primary)' : 'var(--color-border-medium)',
        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <span style={{ position: 'absolute', top: '2px', left: on ? '20px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: on ? 'var(--color-bg-main)' : 'var(--color-text-primary)', transition: 'left 0.2s' }} />
      </button>
    </div>
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

  // New: dynamic data from recommendation engines
  const [readinessScore, setReadinessScore] = useState(0);
  const [skillRecs, setSkillRecs] = useState<any[]>([]);
  const [careerRecs, setCareerRecs] = useState<any[]>([]);
  const [coursesCompleted, setCoursesCompleted] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    const user = getCurrentUser();
    if (user) { setDisplayName(user.name); setEmail(user.email); }
    loadProfile();
  }, [router]);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      if (data) {
        setSkills(data.current_skills || []);
        setExperienceLevel(data.experience_level || 'Beginner');
        if (data.target_career) setTargetCareer(data.target_career);
        if (data.salary_goal) setSalaryGoal(data.salary_goal);
      }
    } catch (err) { console.error('Profile load error:', err); }
    finally { setLoading(false); }

    // Load supplementary data in parallel
    loadSupplementaryData();
  };

  const loadSupplementaryData = async () => {
    const token = getToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const [readRes, recRes] = await Promise.all([
        fetch(`${API_URL}/api/skills/readiness`, { headers }).catch(() => null),
        fetch(`${API_URL}/api/career/analysis`, { headers }).catch(() => null),
      ]);
      if (readRes?.ok) {
        const rd = await readRes.json();
        const scores = rd.careers || {};
        const max = Math.max(0, ...Object.values(scores).map((v: any) => typeof v === 'number' ? v : 0));
        setReadinessScore(max);
      }
      if (recRes?.ok) {
        const rec = await recRes.json();
        if (rec.recommendations?.saved_careers) setCareerRecs(rec.recommendations.saved_careers.slice(0, 3));
      }
    } catch { /* ignore */ }

    // Load skill recommendations
    try {
      const token = getToken();
      const srRes = await fetch(`${API_URL}/api/skills/recommendation/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (srRes.ok) {
        const srData = await srRes.json();
        setSkillRecs((srData.recommendations || []).slice(0, 5));
      }
    } catch { /* ignore */ }
  };

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
    } catch (err) { console.error('Save error:', err); }
  }

  const readinessColor = readinessScore >= 70 ? '#50c878' : readinessScore >= 40 ? '#ff9e42' : '#ef4444';

  if (loading) {
    return (
      <div style={{ background: 'var(--color-bg-main)', minHeight: '100vh' }}>
        <DashboardNavbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ marginBottom: '24px', borderColor: 'var(--color-primary) transparent transparent transparent' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--color-bg-main)', minHeight: '100vh' }}>
      <DashboardNavbar />
      <main className="page-container animate-slide-up" style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid var(--color-border-light)' }}>
          <h1 style={{ color: 'var(--color-text-primary)', fontWeight: 700, fontSize: '24px', margin: 0, fontFamily: 'Outfit, sans-serif' }}>My Profile</h1>
          <Link href="/dashboard/settings" className="btn-outline" style={{ fontSize: '12px', padding: '6px 14px' }}>⚙ Settings</Link>
        </div>

        {/* ── Hero Card + Readiness ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px' }}>
          {/* Identity Card */}
          <div className="card" style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, var(--color-primary-light) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', fontWeight: 800, color: 'var(--color-bg-main)', flexShrink: 0,
              border: '3px solid var(--color-border-medium)', fontFamily: 'Outfit, sans-serif'
            }}>
              {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST'}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ color: 'var(--color-text-primary)', fontWeight: 800, fontSize: '22px', margin: '0 0 4px', fontFamily: 'Outfit, sans-serif' }}>{displayName}</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', margin: '0 0 8px' }}>{email}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge badge-accent">🎯 {targetCareer}</span>
                <span className="badge badge-muted">{experienceLevel}</span>
                <span className="badge badge-muted">{salaryGoal}</span>
              </div>
            </div>
          </div>

          {/* Readiness Score */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%',
              border: `4px solid ${readinessColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              background: readinessScore >= 70 ? 'rgba(16, 185, 129, 0.06)' : readinessScore >= 40 ? 'var(--color-primary-light)' : 'rgba(239, 68, 68, 0.06)'
            }}>
              <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text-primary)', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{readinessScore}%</span>
              <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ready</span>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', textAlign: 'center', margin: 0 }}>Career Readiness Score</p>
            <Link href="/dashboard/skills" style={{ color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600 }}>Improve Score →</Link>
          </div>
        </div>

        {/* ── Activity Snapshot ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <SnapTile icon="◈" label="Skills Tracked" value={skills.length} color="#c084fc" />
          <SnapTile icon="◉" label="Career Matches" value={careerRecs.length} color="var(--color-primary)" />
          <SnapTile icon="◎" label="Skill Recs" value={skillRecs.length} color="#60a5fa" />
          <SnapTile icon="⊞" label="Readiness" value={`${readinessScore}%`} color={readinessColor} />
        </div>

        {/* ── Two Column: Account + Security ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Account Basics */}
          <Section>
            <SectionTitle icon="✎">Account Basics</SectionTitle>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '-10px' }}>Update your identity within the workspace.</p>
            <div>
              <label style={{ color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Display Name</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input-field" style={{ flex: 1 }} />
                <button type="button" className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={saveProfile}>Save</button>
              </div>
            </div>
            <div>
              <label style={{ color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Account Email</label>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 500 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                {email}
              </p>
            </div>
          </Section>

          {/* Security */}
          <Section>
            <SectionTitle icon="🛡">Security</SectionTitle>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '-10px' }}>Keep your account safe and up to date.</p>
            <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-light)', borderRadius: '6px', padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '14px', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Password</p>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Last changed: N/A</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '18px', letterSpacing: '4px' }}>••••••••</span>
                <button type="button" className="btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }} onClick={() => router.push('/dashboard/settings')}>Reset</button>
              </div>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
              Tip: Use a strong, unique password. Enable 2FA from your email provider for extra safety.
            </p>
          </Section>
        </div>

        {/* ── Career Goal ── */}
        <Section>
          <SectionTitle icon="◈">Career Goal & Target</SectionTitle>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '-10px' }}>Set your target career path so we can personalise recommendations and skill gap analysis.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Target Career</label>
              <select value={targetCareer} onChange={(e) => setTargetCareer(e.target.value)} className="input-field" style={{ cursor: 'pointer' }}>
                {['Software Engineer', 'Data Scientist', 'UX Designer', 'Cybersecurity Analyst', 'Product Manager', 'Cloud Architect'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Experience Level</label>
              <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className="input-field" style={{ cursor: 'pointer' }}>
                {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
            <Link href="/dashboard/skills" style={{ color: 'var(--color-primary)', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>View Skill Gap Analysis →</Link>
            <Link href="/dashboard/courses" style={{ color: 'var(--color-text-secondary)', fontSize: '13px', textDecoration: 'none' }}>Find Courses</Link>
            <Link href="/dashboard/roadmaps" style={{ color: 'var(--color-text-secondary)', fontSize: '13px', textDecoration: 'none' }}>Learning Roadmaps</Link>
          </div>
        </Section>

        {/* ── Skill Recommendations (from new engine) ── */}
        {skillRecs.length > 0 && (
          <Section>
            <SectionTitle icon="⊞">Recommended Skills for You</SectionTitle>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '-10px' }}>AI-analyzed skills to boost your career readiness for {targetCareer}.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {skillRecs.map((rec: any, idx: number) => (
                <div key={rec.id || idx} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', background: 'var(--color-bg-secondary)', borderRadius: '6px',
                  border: '1px solid var(--color-border-light)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{
                      width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #60a5fa',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 800, color: '#60a5fa', flexShrink: 0
                    }}>{idx + 1}</span>
                    <div>
                      <p style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '14px', margin: 0 }}>{rec.skill_name || rec.skill?.name || 'Skill'}</p>
                      {rec.reason && <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: '2px 0 0' }}>{rec.reason}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-muted" style={{ fontSize: '11px' }}>{rec.recommended_level || 'Beginner'}</span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Priority #{rec.priority_order || idx + 1}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/dashboard/skills" className="btn-outline" style={{ fontSize: '12px', padding: '8px 18px', alignSelf: 'flex-start' }}>Manage Skills →</Link>
          </Section>
        )}

        {/* ── Your Skills ── */}
        <Section>
          <SectionTitle icon="◎">Your Skills</SectionTitle>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '-10px' }}>Skills you currently have — used for gap analysis against your target career.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {skills.length > 0 ? (
              skills.map((s) => (
                <SkillTag key={s} name={s} onRemove={() => setSkills(skills.filter((x) => x !== s))} />
              ))
            ) : (
              <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No skills added yet.</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
            <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSkill()} placeholder="Add a skill..." className="input-field" style={{ flex: 1 }} />
            <button type="button" className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={addSkill}>+ Add</button>
          </div>
        </Section>

        {/* ── Career Matches ── */}
        {careerRecs.length > 0 && (
          <Section>
            <SectionTitle icon="◈">Your Career Matches</SectionTitle>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '-10px' }}>AI-recommended careers based on your profile and skills.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {careerRecs.map((rec: any, idx: number) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', background: 'var(--color-bg-secondary)', borderRadius: '6px',
                  border: '1px solid var(--color-border-light)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--color-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 800, color: 'var(--color-primary)', flexShrink: 0
                    }}>
                      {rec.match_percentage || rec.match_percentage || '?'}%
                    </div>
                    <div>
                      <p style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '14px', margin: 0 }}>{rec.careerName || rec.career_name || 'Career'}</p>
                      {rec.reason && <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: '2px 0 0' }}>{rec.reason}</p>}
                    </div>
                  </div>
                  <Link href="/dashboard/career" style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: 600 }}>Explore →</Link>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Notification Prefs ── */}
        <Section>
          <SectionTitle icon="🔔">Notification Preferences</SectionTitle>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '-10px' }}>Choose how you stay informed about your career journey.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <ToggleRow label="Email updates" sub="Weekly digest and product updates" checked={true} />
            <ToggleRow label="Browser push" sub="Real-time alerts while signed in" />
            <ToggleRow label="Job alerts" sub="Instant notifications for matching roles" checked={true} />
            <ToggleRow label="Market updates" sub="Daily summaries for your watchlist" />
          </div>
          <button type="button" className="btn-primary" style={{ fontSize: '13px', alignSelf: 'flex-start' }} onClick={saveProfile}>Save notification settings</button>
        </Section>

        {/* ── Save All ── */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', paddingBottom: '20px', flexWrap: 'wrap' }}>
          <button onClick={saveProfile} className="btn-primary" style={{ padding: '11px 28px', fontSize: '14px' }}>
            {saved ? '✓ Saved!' : 'Save All Changes'}
          </button>
          <Link href="/dashboard" style={{ color: 'var(--color-text-secondary)', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>Back to Dashboard</Link>
        </div>
      </main>
    </div>
  );
}
