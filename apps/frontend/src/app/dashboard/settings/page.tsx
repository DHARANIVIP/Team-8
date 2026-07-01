'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { isAuthenticated, getCurrentUser, updateAccount, signout } from '@/lib/services/auth-service';
import { getProfile, updateProfile } from '@/lib/services/profile-service';
import { getCategories } from '@/lib/services/career-service';

/* â”€â”€â”€ helpers â”€â”€â”€ */
function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px 32px' }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border-light)' }}>
      <span style={{ color: 'var(--color-primary)', fontSize: '20px', display: 'inline-flex' }}>{icon}</span>
      <h2 style={{ color: 'var(--color-text-primary)', fontWeight: 700, fontSize: '18px', margin: 0, fontFamily: 'Outfit, sans-serif' }}>{children}</h2>
    </div>
  );
}

function FieldInput({ label, placeholder, value, type = 'text', readOnly, onChange }: { label?: string; placeholder: string; value?: string; type?: string; readOnly?: boolean; onChange?: (val: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
      {label && <label style={{ color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 600 }}>{label}</label>}
      <input
        type={type}
        value={value ?? ''}
        readOnly={readOnly}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
        style={{ color: readOnly ? 'var(--color-text-muted)' : 'var(--color-text-primary)', cursor: readOnly ? 'default' : 'text' }}
      />
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked?: boolean; onChange?: (checked: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
      <span
        onClick={() => onChange && onChange(!checked)}
        style={{
          width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
          border: `1px solid ${checked ? 'var(--color-primary)' : 'var(--color-border-medium)'}`,
          background: checked ? 'var(--color-primary)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        {checked && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="1.5 6 4.5 9 10.5 3" stroke="var(--color-bg-main)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
      <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 500 }}>{label}</span>
    </label>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PAGE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  // Profile data state
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skills, setSkills] = useState('');
  const [targetCareer, setTargetCareer] = useState('Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Junior (1â€“3y)');
  const [salaryGoal, setSalaryGoal] = useState('â‚¹15L+');

  // Preferences state
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [marketAlerts, setMarketAlerts] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [theme, setTheme] = useState<'Dark' | 'Light'>('Dark');

  // Security credentials state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI feedback states
  const [profileSaved, setProfileSaved] = useState(false);
  const [prefSaved, setPrefSaved] = useState(false);
  const [emailUpdated, setEmailUpdated] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }

    async function loadSettingsData() {
      try {
        setLoading(true);
        setGlobalError('');
        const user = getCurrentUser();
        if (user) {
          setDisplayName(user.name || '');
          setNewEmail(user.email || '');
        }
        const profile = await getProfile();
        if (profile) {
          setSkills((profile.current_skills || []).join(', '));
          setTargetCareer(profile.target_career || 'Software Engineer');
          setExperienceLevel(profile.experience_level || 'Junior (1â€“3y)');
          setSalaryGoal(profile.salary_goal || 'â‚¹15L+');
          setEmailUpdates(profile.email_updates !== false);
          setMarketAlerts(profile.market_alerts === true);
          setWeeklyDigest(profile.weekly_digest !== false);
          setCompactMode(profile.compact_mode === true);
        }
        const catsData = await getCategories();
        setCategories(catsData.categories || []);
      } catch (err: any) {
        console.error('Failed to load settings:', err);
        setGlobalError('Failed to fetch settings from servers.');
      } finally {
        setLoading(false);
      }
    }
    loadSettingsData();
  }, [router]);

  function showSuccess(msg: string) {
    setGlobalSuccess(msg);
    setTimeout(() => setGlobalSuccess(''), 2500);
  }

  async function saveProfileData() {
    try {
      setGlobalError('');
      const parsedSkills = skills.split(',').map((s) => s.trim()).filter(Boolean);
      await updateProfile({ current_skills: parsedSkills, target_career: targetCareer, experience_level: experienceLevel, salary_goal: salaryGoal });
      if (displayName) await updateAccount({ name: displayName });
      setProfileSaved(true);
      showSuccess('Profile settings saved successfully!');
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setGlobalError(err.message || 'Failed to update profile settings.');
    }
  }

  async function savePrefData() {
    try {
      setGlobalError('');
      await updateProfile({ email_updates: emailUpdates, market_alerts: marketAlerts, weekly_digest: weeklyDigest, compact_mode: compactMode });
      setPrefSaved(true);
      showSuccess('Preferences saved successfully!');
      setTimeout(() => setPrefSaved(false), 2000);
    } catch (err: any) {
      console.error('Failed to save preferences:', err);
      setGlobalError(err.message || 'Failed to update preferences.');
    }
  }

  async function handleEmailUpdate() {
    try {
      setGlobalError('');
      if (!newEmail) return;
      await updateAccount({ email: newEmail });
      setEmailUpdated(true);
      showSuccess('Email address updated successfully!');
      setTimeout(() => setEmailUpdated(false), 3000);
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to update email address.');
    }
  }

  async function handlePasswordUpdate() {
    try {
      setGlobalError('');
      if (!newPassword || newPassword !== confirmPassword) {
        setGlobalError('Passwords do not match or are empty.');
        return;
      }
      await updateAccount({ password: newPassword });
      setPasswordUpdated(true);
      setNewPassword('');
      setConfirmPassword('');
      showSuccess('Password changed successfully!');
      setTimeout(() => setPasswordUpdated(false), 3000);
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to change password.');
    }
  }

  function handleAccountDelete() {
    signout();
    router.push('/login?message=Account deleted successfully');
  }

  return (
    <div style={{ background: 'var(--color-bg-main)', minHeight: '100vh' }}>
      <DashboardNavbar />
      <main className="page-container animate-slide-up" style={{ maxWidth: '780px', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid var(--color-border-light)' }}>
          <h1 style={{ color: 'var(--color-text-primary)', fontWeight: 700, fontSize: '24px', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Settings</h1>
          <Link href="/dashboard/profile" className="btn-outline" style={{ fontSize: '12px', padding: '6px 14px' }}>My Profile →</Link>
        </div>

        {globalError && (
          <div style={{ padding: '14px', background: '#FEE2E2', border: '1px solid rgba(220, 38, 38, 0.25)', color: '#DC2626', fontSize: '13px', borderRadius: '6px', textAlign: 'center' }}>
            {globalError}
          </div>
        )}

        {globalSuccess && (
          <div style={{ padding: '14px', background: '#D1FAE5', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#047857', fontSize: '13px', borderRadius: '6px', textAlign: 'center' }}>
            {globalSuccess}
          </div>
        )}

        {loading ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <div className="spinner" style={{ marginBottom: '16px', borderColor: 'var(--color-primary) transparent transparent transparent' }} />
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Loading settings...</p>
          </div>
        ) : (
          <>
            {/* ── PROFILE ── */}
            <Section>
              <SectionTitle icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              }>Profile Settings</SectionTitle>

              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <FieldInput label="Display name" placeholder="Your name" value={displayName} onChange={setDisplayName} />
                <FieldInput label="Avatar URL" placeholder="https://..." value={avatarUrl} onChange={setAvatarUrl} />
              </div>

              <div>
                <label style={{ color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Skills <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>(comma separated)</span>
                </label>
                <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. Python, Machine Learning, SQL" className="input-field" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Target Career</label>
                  <select value={targetCareer} onChange={(e) => setTargetCareer(e.target.value)} className="input-field" style={{ cursor: 'pointer' }}>
                    {categories.length > 0 ? categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>) :
                      ['Software Engineer', 'Data Scientist', 'UX Designer', 'Cybersecurity Analyst', 'Product Manager', 'Cloud Architect'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Experience Level</label>
                  <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className="input-field" style={{ cursor: 'pointer' }}>
                    {['Student', 'Fresher (0–1y)', 'Junior (1–3y)', 'Mid-level (3–5y)', 'Senior (5y+)'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Salary Goal</label>
                <select value={salaryGoal} onChange={(e) => setSalaryGoal(e.target.value)} className="input-field" style={{ cursor: 'pointer' }}>
                  {['₹5L–₹10L', '₹10L–₹15L', '₹15L+', '₹25L+', '₹40L+'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <button onClick={saveProfileData} className="btn-primary" style={{ fontSize: '13px' }}>
                  {profileSaved ? '✓ Profile Saved!' : 'Save Profile'}
                </button>
              </div>
            </Section>

            {/* ── PREFERENCES ── */}
            <Section>
              <SectionTitle icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
                </svg>
              }>Preferences</SectionTitle>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <CheckRow label="Email alerts for job/news updates" checked={emailUpdates} onChange={setEmailUpdates} />
                <CheckRow label="Market movement alerts" checked={marketAlerts} onChange={setMarketAlerts} />
                <CheckRow label="Weekly summary digest" checked={weeklyDigest} onChange={setWeeklyDigest} />
                <CheckRow label="Compact dashboard mode" checked={compactMode} onChange={setCompactMode} />
              </div>

              {/* Theme */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: 600 }}>Theme preference</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['Dark', 'Light'] as const).map((t) => (
                    <button key={t} onClick={() => setTheme(t)} className={theme === t ? 'btn-primary' : 'btn-ghost'} style={{ padding: '7px 22px', fontSize: '13px' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button onClick={savePrefData} className="btn-primary" style={{ fontSize: '13px' }}>
                  {prefSaved ? '✓ Preferences Saved!' : 'Save Preferences'}
                </button>
              </div>
            </Section>

            {/* ── SECURITY ── */}
            <Section>
              <SectionTitle icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              }>Security</SectionTitle>

              {/* Change Email */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 600 }}>Change Email Address</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input value={newEmail} type="email" onChange={(e) => setNewEmail(e.target.value)} className="input-field" style={{ flex: 1, minWidth: '200px' }} />
                  <button onClick={handleEmailUpdate} className="btn-primary" style={{ fontSize: '12px', padding: '8px 18px' }}>
                    {emailUpdated ? '✓ Updated!' : 'Update'}
                  </button>
                </div>
              </div>

              {/* Change Password */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 600 }}>Change Password</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="input-field" style={{ flex: 1, minWidth: '180px' }} />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="input-field" style={{ flex: 1, minWidth: '180px' }} />
                  <button onClick={handlePasswordUpdate} className="btn-primary" style={{ fontSize: '12px', padding: '8px 18px' }}>
                    {passwordUpdated ? '✓ Updated!' : 'Update'}
                  </button>
                </div>
              </div>
            </Section>

            {/* ── DATA & PRIVACY ── */}
            <Section>
              <SectionTitle icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              }>Data & Privacy</SectionTitle>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--color-bg-secondary)', borderRadius: '6px', border: '1px solid var(--color-border-light)' }}>
                  <div>
                    <p style={{ color: 'var(--color-text-primary)', fontSize: '13px', fontWeight: 600, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Export Your Data</p>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '11px', margin: '2px 0 0' }}>Download a copy of your profile, skills, and recommendations</p>
                  </div>
                  <button className="btn-outline" style={{ fontSize: '12px', padding: '6px 14px' }}>Export</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--color-bg-secondary)', borderRadius: '6px', border: '1px solid var(--color-border-light)' }}>
                  <div>
                    <p style={{ color: 'var(--color-text-primary)', fontSize: '13px', fontWeight: 600, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Clear Recommendation History</p>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '11px', margin: '2px 0 0' }}>Reset AI-generated career and skill recommendations</p>
                  </div>
                  <button className="btn-outline" style={{ fontSize: '12px', padding: '6px 14px' }}>Clear</button>
                </div>
              </div>
            </Section>

            {/* ── SESSION & ACCOUNT ── */}
            <Section>
              <SectionTitle icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="m12 16 .01 0"/>
                </svg>
              }>Session & Account</SectionTitle>

              {/* Session */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 600 }}>Session Control</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => { signout(); router.push('/login'); }} className="btn-outline" style={{ fontSize: '13px', padding: '7px 18px' }}>
                    Sign out
                  </button>
                  <Link href="/dashboard/profile" style={{ textDecoration: 'none' }}>
                    <button className="btn-outline" style={{ fontSize: '13px', padding: '7px 18px' }}>
                      Open profile page
                    </button>
                  </Link>
                </div>
              </div>

              {/* Danger Zone */}
              <div style={{ padding: '18px 20px', background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ color: '#ef4444', fontSize: '14px', display: 'inline-flex' }}>⚠</span>
                  <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '14px', fontFamily: 'Outfit, sans-serif' }}>Danger Zone</span>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '16px', lineHeight: 1.6 }}>
                  Permanently deletes your account, profile data, and all recommendations. This cannot be undone.
                </p>
                {!showDelete ? (
                  <button onClick={() => setShowDelete(true)} style={{
                    background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '6px', padding: '8px 20px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.22)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.12)')}
                  >
                    Delete account
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>Are you sure?</span>
                    <button onClick={handleAccountDelete} style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '7px 18px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                      Yes, delete
                    </button>
                    <button onClick={() => setShowDelete(false)} className="btn-ghost" style={{ padding: '7px 18px', fontSize: '13px' }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </Section>
          </>
        )}

        <div style={{ height: '20px' }} />
      </main>
    </div>
  );
}
