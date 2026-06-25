'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { isAuthenticated, getCurrentUser, updateAccount, signout } from '@/lib/services/auth-service';
import { getProfile, updateProfile } from '@/lib/services/profile-service';
import { getCategories } from '@/lib/services/career-service';

/* ─── helpers ─── */
function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#111111',
      border: '1px solid #1f1f1f',
      borderRadius: '10px',
      padding: '28px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '8px', borderBottom: '1px solid #1a1a1a' }}>
      <span style={{ color: '#ff9e42', fontSize: '20px' }}>{icon}</span>
      <h2 style={{ color: '#cccccc', fontWeight: 800, fontSize: '20px', margin: 0 }}>{children}</h2>
    </div>
  );
}

function FieldInput({
  label, placeholder, value, type = 'text', readOnly, onChange,
}: { label?: string; placeholder: string; value?: string; type?: string; readOnly?: boolean; onChange?: (val: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
      {label && <label style={{ color: '#aaaaaa', fontSize: '12px', fontWeight: 500 }}>{label}</label>}
      <input
        type={type}
        value={value ?? ''}
        readOnly={readOnly}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: '#0d0d0d',
          border: '1px solid #2a2a2a',
          borderRadius: '6px',
          padding: '9px 14px',
          color: readOnly ? '#666' : '#cccccc',
          fontSize: '14px',
          outline: 'none',
          width: '100%',
          transition: 'border-color 0.2s',
          cursor: readOnly ? 'default' : 'text',
        }}
        onFocus={(e) => !readOnly && (e.target.style.borderColor = '#ff9e42')}
        onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
      />
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked?: boolean; onChange?: (checked: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
      <span
        onClick={() => onChange && onChange(!checked)}
        style={{
          width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
          border: `1px solid ${checked ? '#ff9e42' : '#2a2a2a'}`,
          background: checked ? '#ff9e42' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        {checked && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="1.5 6 4.5 9 10.5 3" stroke="#0d0d0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
      <span style={{ color: '#bbbbbb', fontSize: '13px' }}>{label}</span>
    </label>
  );
}

/* ════════════════════════════════════
   PAGE
════════════════════════════════════ */
export default function SettingsPage() {
  const router = useRouter();

  // Load state
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  // Profile data state
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skills, setSkills] = useState('');
  const [targetCareer, setTargetCareer] = useState('Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Junior (1–3y)');
  const [salaryGoal, setSalaryGoal] = useState('₹15L+');

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

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    async function loadSettingsData() {
      try {
        setLoading(true);
        setGlobalError('');

        // Load account metadata
        const user = getCurrentUser();
        if (user) {
          setDisplayName(user.name || '');
          setNewEmail(user.email || '');
        }

        // Load Supabase profile details
        const profile = await getProfile();
        if (profile) {
          setSkills((profile.current_skills || []).join(', '));
          setTargetCareer(profile.target_career || 'Software Engineer');
          setExperienceLevel(profile.experience_level || 'Junior (1–3y)');
          setSalaryGoal(profile.salary_goal || '₹15L+');
          
          setEmailUpdates(profile.email_updates !== false);
          setMarketAlerts(profile.market_alerts === true);
          setWeeklyDigest(profile.weekly_digest !== false);
          setCompactMode(profile.compact_mode === true);
        }

        // Load Categories choices
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

  // Actions
  async function saveProfileData() {
    try {
      setGlobalError('');
      // Parse skills into array
      const parsedSkills = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // Save Supabase profile details
      await updateProfile({
        current_skills: parsedSkills,
        target_career: targetCareer,
        experience_level: experienceLevel,
        salary_goal: salaryGoal,
      });

      // Save name update to MongoDB
      if (displayName) {
        await updateAccount({ name: displayName });
      }

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setGlobalError(err.message || 'Failed to update profile settings.');
    }
  }

  async function savePrefData() {
    try {
      setGlobalError('');
      await updateProfile({
        email_updates: emailUpdates,
        market_alerts: marketAlerts,
        weekly_digest: weeklyDigest,
        compact_mode: compactMode,
      });

      setPrefSaved(true);
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
      setTimeout(() => setPasswordUpdated(false), 3000);
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to change password.');
    }
  }

  function handleAccountDelete() {
    // Client-side simulation of account deletion
    signout();
    router.push('/login?message=Account deleted successfully');
  }

  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh' }}>
      <DashboardNavbar />

      <main style={{ maxWidth: '780px', margin: '0 auto', padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Page header ── */}
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
            <h1 style={{ color: '#ffffff', fontWeight: 700, fontSize: '24px', margin: 0, letterSpacing: '0.5px' }}>Settings</h1>
          </div>
        </div>

        {globalError && (
          <div style={{ padding: '16px', background: 'rgba(239,68,68,0.06)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '14px', borderRadius: '6px', textAlign: 'center' }}>
            {globalError}
          </div>
        )}

        {loading ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center', opacity: 0.7 }}>
            <p style={{ color: '#ff9e42', fontSize: '15px', fontWeight: 600 }}>Loading settings profile...</p>
          </div>
        ) : (
          <>
            {/* ══ PROFILE ══ */}
            <Section>
              <SectionTitle icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              }>Profile Settings</SectionTitle>

              <div style={{ display: 'flex', gap: '14px' }}>
                <FieldInput label="Display name" placeholder="Your name" value={displayName} onChange={setDisplayName} />
                <FieldInput label="Avatar URL" placeholder="https://…" value={avatarUrl} onChange={setAvatarUrl} />
              </div>

              <div>
                <label style={{ color: '#aaaaaa', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Skills <span style={{ color: '#555' }}>(comma separated)</span>
                </label>
                <input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Python, Machine Learning, SQL"
                  style={{
                    width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a',
                    borderRadius: '6px', padding: '9px 14px', color: '#cccccc', fontSize: '14px', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#ff9e42')}
                  onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ color: '#aaaaaa', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Target Career</label>
                  <select
                    value={targetCareer}
                    onChange={(e) => setTargetCareer(e.target.value)}
                    style={{
                      width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a',
                      borderRadius: '6px', padding: '9px 14px', color: '#cccccc', fontSize: '14px', outline: 'none', cursor: 'pointer',
                    }}
                  >
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))
                    ) : (
                      ['Software Engineer', 'Data Scientist', 'UX Designer', 'Cybersecurity Analyst', 'Product Manager', 'Cloud Architect'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ color: '#aaaaaa', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    style={{
                      width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a',
                      borderRadius: '6px', padding: '9px 14px', color: '#cccccc', fontSize: '14px', outline: 'none', cursor: 'pointer',
                    }}
                  >
                    {['Student', 'Fresher (0–1y)', 'Junior (1–3y)', 'Mid-level (3–5y)', 'Senior (5y+)'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ color: '#aaaaaa', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Salary Goal</label>
                <select
                  value={salaryGoal}
                  onChange={(e) => setSalaryGoal(e.target.value)}
                  style={{
                    width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a',
                    borderRadius: '6px', padding: '9px 14px', color: '#cccccc', fontSize: '14px', outline: 'none', cursor: 'pointer',
                  }}
                >
                  {['₹5L–₹10L', '₹10L–₹15L', '₹15L+', '₹25L+', '₹40L+'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  onClick={saveProfileData}
                  style={{
                    background: '#ff9e42', color: '#0d0d0d', border: 'none', borderRadius: '6px',
                    padding: '9px 22px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'background 0.18s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#ff9757')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#ff9e42')}
                >
                  {profileSaved ? '✓ Profile Saved!' : 'Save profile'}
                </button>
              </div>
            </Section>

            {/* ══ PREFERENCES ══ */}
            <Section>
              <SectionTitle icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
                </svg>
              }>Preferences</SectionTitle>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <CheckRow label="Email alerts for job/news updates" checked={emailUpdates} onChange={setEmailUpdates} />
                <CheckRow label="Market movement alerts" checked={marketAlerts} onChange={setMarketAlerts} />
                <CheckRow label="Weekly summary digest" checked={weeklyDigest} onChange={setWeeklyDigest} />
                <CheckRow label="Compact dashboard mode" checked={compactMode} onChange={setCompactMode} />
              </div>

              {/* Theme */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaaaaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                  <span style={{ color: '#aaaaaa', fontSize: '13px', fontWeight: 500 }}>Theme preference</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['Dark', 'Light'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      style={{
                        padding: '7px 22px',
                        borderRadius: '6px',
                        border: `1px solid ${theme === t ? '#ff9e42' : '#2a2a2a'}`,
                        background: theme === t ? '#ff9e42' : 'transparent',
                        color: theme === t ? '#0d0d0d' : '#aaaaaa',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  onClick={savePrefData}
                  style={{
                    background: '#ff9e42', color: '#0d0d0d', border: 'none', borderRadius: '6px',
                    padding: '9px 22px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'background 0.18s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#ff9757')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#ff9e42')}
                >
                  {prefSaved ? '✓ Preferences Saved!' : 'Save preferences'}
                </button>
              </div>
            </Section>

            {/* ══ SECURITY & ACCOUNT ══ */}
            <Section>
              <SectionTitle icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="m12 16 .01 0"/>
                </svg>
              }>Security &amp; Account</SectionTitle>

              {/* Change Email */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaaaaa" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <span style={{ color: '#aaaaaa', fontSize: '12px', fontWeight: 600 }}>Change Email Address</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    value={newEmail}
                    type="email"
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{
                      flex: 1, background: '#0d0d0d', border: '1px solid #2a2a2a',
                      borderRadius: '6px', padding: '9px 14px', color: '#cccccc', fontSize: '14px', outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#ff9e42')}
                    onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
                  />
                  <button
                    onClick={handleEmailUpdate}
                    style={{
                      background: '#ff9e42', color: '#0d0d0d', border: 'none', borderRadius: '6px', padding: '7px 16px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'background 0.18s'
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#ff9757')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#ff9e42')}
                  >
                    {emailUpdated ? 'Updated!' : 'Update'}
                  </button>
                </div>
              </div>

              {/* Change Password */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaaaaa" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span style={{ color: '#aaaaaa', fontSize: '12px', fontWeight: 600 }}>Change Password</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    style={{
                      flex: 1, background: '#0d0d0d', border: '1px solid #2a2a2a',
                      borderRadius: '6px', padding: '9px 14px', color: '#cccccc', fontSize: '14px', outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#ff9e42')}
                    onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    style={{
                      flex: 1, background: '#0d0d0d', border: '1px solid #2a2a2a',
                      borderRadius: '6px', padding: '9px 14px', color: '#cccccc', fontSize: '14px', outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#ff9e42')}
                    onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
                  />
                  <button
                    onClick={handlePasswordUpdate}
                    style={{
                      background: '#ff9e42', color: '#0d0d0d', border: 'none', borderRadius: '6px', padding: '7px 16px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'background 0.18s'
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#ff9757')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#ff9e42')}
                  >
                    {passwordUpdated ? 'Updated!' : 'Update'}
                  </button>
                </div>
              </div>

              {/* Session */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaaaaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span style={{ color: '#aaaaaa', fontSize: '12px', fontWeight: 600 }}>Session Control</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => { signout(); router.push('/login'); }}
                    style={{
                      background: 'transparent', color: '#ff9e42', border: '1px solid #ff9e4255', borderRadius: '6px', padding: '7px 18px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.18s'
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,158,66,0.1)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    Sign out
                  </button>
                  <Link href="/dashboard/profile" style={{ textDecoration: 'none' }}>
                    <button
                      style={{
                        background: 'transparent', color: '#ff9e42', border: '1px solid #ff9e4255', borderRadius: '6px', padding: '7px 18px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.18s'
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,158,66,0.1)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      Open profile page
                    </button>
                  </Link>
                </div>
              </div>

              {/* Danger Zone */}
              <div style={{
                marginTop: '8px',
                padding: '18px 20px',
                background: 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.18)',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <span style={{ color: '#ef4444', fontSize: '14px' }}>🗑</span>
                  <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '14px' }}>Danger Zone</span>
                </div>
                <p style={{ color: '#666', fontSize: '12px', marginBottom: '12px', lineHeight: 1.6 }}>
                  Deletes your local authentication token and signs you out of all devices. This cannot be undone.
                </p>
                {!showDelete ? (
                  <button
                    onClick={() => setShowDelete(true)}
                    style={{
                      background: 'rgba(239,68,68,0.12)',
                      color: '#ef4444',
                      border: '1px solid rgba(239,68,68,0.4)',
                      borderRadius: '6px',
                      padding: '8px 20px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.22)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)')}
                  >
                    Delete account
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ color: '#ef4444', fontSize: '13px' }}>Are you sure?</span>
                    <button
                      onClick={handleAccountDelete}
                      style={{
                        background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px',
                        padding: '7px 18px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                      }}
                    >
                      Yes, delete
                    </button>
                    <button
                      onClick={() => setShowDelete(false)}
                      style={{
                        background: 'transparent', color: '#aaaaaa', border: '1px solid #2a2a2a', borderRadius: '6px',
                        padding: '7px 18px', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </Section>
          </>
        )}

        {/* bottom padding */}
        <div style={{ height: '20px' }} />
      </main>
    </div>
  );
}
