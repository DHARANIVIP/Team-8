'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { isAuthenticated, getCurrentUser, getToken } from '@/lib/services/auth-service';
import { getProfile } from '@/lib/services/profile-service';
import { getCategories } from '@/lib/services/career-service';
import { getSkills } from '@/lib/services/skill-service';
import { getCourses } from '@/lib/services/course-service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [skillsCount, setSkillsCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);
  const [userSkillsCount, setUserSkillsCount] = useState(0);
  const [careerRecs, setCareerRecs] = useState<any[]>([]);
  const [readinessScore, setReadinessScore] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const profile = await getProfile();
      setUserProfile(profile);
      // Only redirect to onboarding if BOTH DB and localStorage say not completed
      // This prevents redirect loops when DB is out of sync
      if (!profile.onboarding_completed) {
        const user = getCurrentUser() as any;
        if (!user || !user.onboardingCompleted) {
          router.push('/onboarding');
          return;
        }
      }

      const [catsData, allSkills, allCourses] = await Promise.all([
        getCategories(),
        getSkills(),
        getCourses()
      ]);
      setCategories(catsData.categories || []);
      setSkillsCount(allSkills.length || 0);
      setCoursesCount(allCourses.length || 0);
      setUserSkillsCount(profile.current_skills?.length || 0);

      // Fetch career readiness scores
      try {
        const token = getToken();
        const readRes = await fetch(`${API_URL}/api/skills/readiness`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (readRes.ok) {
          const readData = await readRes.json();
          const scores = readData.careers || {};
          const maxScore = Math.max(0, ...Object.values(scores).map((v: any) => typeof v === 'number' ? v : 0));
          setReadinessScore(maxScore);
        }
      } catch { /* ignore */ }

      // Fetch career recommendations
      try {
        const token = getToken();
        const recRes = await fetch(`${API_URL}/api/career/analysis`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (recRes.ok) {
          const recData = await recRes.json();
          if (recData.recommendations?.saved_careers) {
            setCareerRecs(recData.recommendations.saved_careers.slice(0, 3));
          }
        }
      } catch { /* ignore */ }
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Career Paths', value: categories.length || 6, icon: '◈', color: '#ff9e42' },
    { label: 'Skills Available', value: skillsCount || 200, icon: '◉', color: '#50c878' },
    { label: 'Courses', value: coursesCount || 100, icon: '◎', color: '#60a5fa' },
    { label: 'Your Skills', value: userSkillsCount, icon: '⊞', color: '#c084fc' },
  ];

  // Determine next action based on user state
  const getNextAction = () => {
    if (careerRecs.length === 0) return { title: 'Get AI Career Guidance', desc: 'AI will analyze your profile and suggest top career matches', link: '/dashboard/career', icon: '◈' };
    if (userSkillsCount < 3) return { title: 'Build Your Skill Profile', desc: 'Add your skills to get personalized gap analysis', link: '/dashboard/skills', icon: '◉' };
    return { title: 'Explore Skill Roadmap', desc: 'See your personalized learning path for your target career', link: '/dashboard/skills', icon: '→' };
  };
  const nextAction = getNextAction();

  if (loading) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
        <DashboardNavbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ marginBottom: '24px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <DashboardNavbar />
      <main className="page-container animate-slide-up" style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {error && (
          <div style={{ padding: '14px', background: 'rgba(239,68,68,0.06)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', textAlign: 'center', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* ── Hero: Readiness Score + Next Action ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Career Readiness Score */}
          <div className="card" style={{ padding: '28px', display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{
              width: '90px', height: '90px', borderRadius: '50%',
              border: `4px solid ${readinessScore >= 70 ? '#50c878' : readinessScore >= 40 ? '#ff9e42' : '#ef4444'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', flexShrink: 0,
              background: `rgba(${readinessScore >= 70 ? '80,200,120' : readinessScore >= 40 ? '255,158,66' : '239,68,68'}, 0.08)`
            }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{readinessScore}%</span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ready</span>
            </div>
            <div>
              <span className="section-label" style={{ marginBottom: '4px' }}>CAREER READINESS</span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                {readinessScore >= 70 ? 'Great progress!' : readinessScore >= 40 ? 'Building momentum' : 'Just getting started'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
                {userSkillsCount > 0
                  ? `You have ${userSkillsCount} skills tracked. ${readinessScore < 100 ? 'Keep learning to boost your score.' : 'You\'re career-ready!'}`
                  : 'Add your skills to see your career readiness score.'}
              </p>
            </div>
          </div>

          {/* Next Action CTA */}
          <Link href={nextAction.link} style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{ padding: '28px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px', borderColor: 'rgba(255, 158, 66, 0.3)' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>NEXT ACTION</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px', color: 'var(--accent)' }}>{nextAction.icon}</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{nextAction.title}</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>{nextAction.desc}</p>
              <span className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '4px', fontSize: '12px', padding: '8px 18px' }}>Get Started →</span>
            </div>
          </Link>
        </div>

        {/* ── Stats Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {stats.map((s) => (
            <div key={s.label} className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '8px',
                background: `${s.color}10`, border: `1px solid ${s.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: s.color, fontSize: '18px'
              }}>
                {s.icon}
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{s.label}</p>
                <p style={{ color: '#ffffff', fontSize: '22px', fontWeight: 800, lineHeight: 1, fontFamily: 'Outfit, sans-serif' }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── AI Career Recommendations ── */}
        <section className="card" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="section-label" style={{ marginBottom: 0 }}>AI CAREER MATCHES</span>
            <Link href="/dashboard/career" style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: 600 }}>View All →</Link>
          </div>
          {careerRecs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {careerRecs.map((rec: any, idx: number) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', background: 'var(--surface-alt)', borderRadius: '6px',
                  border: '1px solid rgba(255, 158, 66, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 800, color: 'var(--accent)', flexShrink: 0
                    }}>
                      {rec.matchPercentage || rec.match_percentage || '?'}%
                    </div>
                    <div>
                      <p style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px', margin: 0 }}>{rec.careerName || rec.career_name || 'Career'}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '2px 0 0' }}>{rec.reason || 'AI-matched career'}</p>
                    </div>
                  </div>
                  <Link href="/dashboard/career" style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>Explore →</Link>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>No career recommendations yet</p>
              <Link href="/dashboard/career" className="btn-primary" style={{ fontSize: '12px', padding: '8px 18px' }}>Get AI Career Guidance →</Link>
            </div>
          )}
        </section>

        {/* ── Two Column: Skills + Quick Actions ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Your Skills Snapshot */}
          <section className="card" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="section-label" style={{ marginBottom: 0 }}>YOUR SKILLS</span>
              <Link href="/dashboard/skills" style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: 600 }}>Manage →</Link>
            </div>
            {userProfile?.current_skills?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {userProfile.current_skills.slice(0, 10).map((s: string) => (
                  <span key={s} className="skill-pill">{s}</span>
                ))}
                {userProfile.current_skills.length > 10 && (
                  <span className="skill-pill" style={{ color: 'var(--accent)', borderColor: 'rgba(255,158,66,0.2)' }}>+{userProfile.current_skills.length - 10} more</span>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No skills added yet. <Link href="/dashboard/skills" style={{ color: 'var(--accent)' }}>Add skills →</Link></p>
            )}
          </section>

          {/* Quick Actions */}
          <section className="card" style={{ padding: '24px 28px' }}>
            <span className="section-label">QUICK ACTIONS</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { title: 'AI Career Guidance', link: '/dashboard/career', icon: '◈' },
                { title: 'Skill Gap Analysis', link: '/dashboard/skills', icon: '◉' },
                { title: 'Find Courses', link: '/dashboard/courses', icon: '◎' },
                { title: 'Compare Careers', link: '/dashboard/compare', icon: '⊞' },
                { title: 'Learning Roadmaps', link: '/dashboard/roadmaps', icon: '🗺' },
              ].map((a) => (
                <Link key={a.title} href={a.link} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                    background: 'var(--surface-alt)', borderRadius: '6px', border: '1px solid rgba(255,158,66,0.06)',
                    transition: 'all 0.2s ease'
                  }}>
                    <span style={{ color: 'var(--accent)', fontSize: '16px' }}>{a.icon}</span>
                    <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 500, flex: 1 }}>{a.title}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* ── Career Snapshot ── */}
        <section className="card" style={{ padding: '24px 28px' }}>
          <span className="section-label">CAREER SNAPSHOT</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {categories.slice(0, 3).map((c) => (
              <div key={c.id} style={{
                background: 'var(--surface-alt)', borderRadius: '6px', padding: '18px 20px',
                border: '1px solid rgba(255,158,66,0.08)'
              }}>
                <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '15px', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>{c.name}</p>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{c.salary_range}</span>
                  <span>•</span>
                  <span>{c.growth_rate} growth</span>
                  <span>•</span>
                  <span>{c.demand_level}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
