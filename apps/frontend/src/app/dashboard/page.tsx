'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { isAuthenticated } from '@/lib/services/auth-service';
import { getProfile } from '@/lib/services/profile-service';
import { getCategories } from '@/lib/services/career-service';
import { getSkills } from '@/lib/services/skill-service';
import { getCourses } from '@/lib/services/course-service';

// ── Helpers ──
const parseSalaryMax = (salaryStr: string) => {
  if (!salaryStr) return 0;
  const matches = salaryStr.match(/\d+/g);
  if (matches && matches.length >= 2) {
    return parseInt(matches[1]);
  } else if (matches && matches.length === 1) {
    return parseInt(matches[0]);
  }
  return 0;
};

export default function DashboardPage() {
  const router = useRouter();

  // Load state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data states
  const [userProfile, setUserProfile] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [skillsCount, setSkillsCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);
  const [trendingSkills, setTrendingSkills] = useState<string[]>([]);
  
  // Daily Focus goals states
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    async function loadDashboardData() {
      try {
        setLoading(true);
        setError('');

        // 1. Fetch user profile
        const profile = await getProfile();
        setUserProfile(profile);

        if (!profile.onboarding_completed) {
          router.push('/onboarding');
          return;
        }

        // 2. Fetch categories
        const catsData = await getCategories();
        const catsList = catsData.categories || [];
        setCategories(catsList);

        // 3. Fetch skills to get dynamic count
        const allSkills = await getSkills();
        setSkillsCount(allSkills.length || 0);

        // Set trending skills dynamically from the database
        const skillNames = Array.from(new Set(allSkills.map((s: any) => s.name))) as string[];
        setTrendingSkills(skillNames.slice(0, 14));

        // 4. Fetch courses to get dynamic count
        const allCourses = await getCourses();
        setCoursesCount(allCourses.length || 0);

        // Load daily goals from local storage
        if (typeof window !== 'undefined') {
          const savedGoals = localStorage.getItem('dashboard_goals');
          if (savedGoals) {
            setGoals(JSON.parse(savedGoals));
          }
        }
      } catch (err: any) {
        console.error('Failed to load dashboard metrics:', err);
        setError('Failed to fetch real-time dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [router]);

  // Goal handlers
  const addGoal = () => {
    const trimmed = newGoal.trim();
    if (!trimmed) return;
    const updated = [...goals, trimmed];
    setGoals(updated);
    setNewGoal('');
    localStorage.setItem('dashboard_goals', JSON.stringify(updated));
  };

  const removeGoal = (index: number) => {
    const updated = goals.filter((_, i) => i !== index);
    setGoals(updated);
    localStorage.setItem('dashboard_goals', JSON.stringify(updated));
  };

  // Dynamic values computation
  const stats = [
    { icon: '◈', label: 'Career Paths', value: categories.length > 0 ? `${categories.length}` : '50+' },
    { icon: '◉', label: 'Skills Tracked', value: skillsCount > 0 ? `${skillsCount}` : '200+' },
    { icon: '◎', label: 'Courses Available', value: coursesCount > 0 ? `${coursesCount}` : '100+' },
    { icon: '⊞', label: 'User Skills', value: userProfile?.current_skills?.length || 0 },
  ];

  // Highest Paying and Most Popular Career Calculations
  let highestPayingCareer = { name: 'Data Scientist', salary: '₹10L – ₹30L/year' };
  let mostPopularCareer = { name: 'Software Engineer', salary: '₹8L – ₹25L/year' };

  if (categories.length > 0) {
    // Find career with highest salary maximum
    const sortedBySalary = [...categories].sort((a, b) => {
      const maxA = parseSalaryMax(a.salary_range);
      const maxB = parseSalaryMax(b.salary_range);
      return maxB - maxA;
    });
    highestPayingCareer = {
      name: sortedBySalary[0].name,
      salary: `${sortedBySalary[0].salary_range}/year`
    };

    // Find career with highest growth rate or demand
    const sortedByGrowth = [...categories].sort((a, b) => {
      const valA = parseInt(a.growth_rate) || 0;
      const valB = parseInt(b.growth_rate) || 0;
      return valB - valA;
    });
    mostPopularCareer = {
      name: sortedByGrowth[0].name,
      salary: `${sortedByGrowth[0].salary_range}/year`
    };
  }

  // Recommended careers selection
  const recommendedCareers = categories.slice(0, 4).map((c) => {
    const isTarget = userProfile?.target_career?.toLowerCase() === c.name.toLowerCase();
    return {
      name: c.name,
      tags: c.top_companies ? c.top_companies.split(', ').slice(0, 3) : ['Tech', 'Global'],
      salary: c.salary_range,
      badge: isTarget ? 'Target Career' : c.demand_level === 'High' ? 'High Demand' : 'Recommended'
    };
  });

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <DashboardNavbar />
      <main className="page-container animate-slide-up" style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {error && (
          <div style={{ padding: '16px', background: 'rgba(239,68,68,0.06)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', textAlign: 'center', fontFamily: 'Outfit, sans-serif' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="card" style={{ padding: '64px', textAlign: 'center', opacity: 0.8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button onClick={() => router.push('/dashboard')} className="btn-primary" style={{ padding: '10px 18px', fontSize: '14px' }}>
                Launch AI Analysis
              </button>
            </div>
            {/* ── Stats Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {stats.map((s) => (
                <div key={s.label} className="card card-hover" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '6px',
                    border: '1px solid rgba(37, 99, 235, 0.25)',
                    background: 'rgba(37, 99, 235, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                    fontSize: '22px',
                    textShadow: '0 0 8px var(--accent-glow)'
                  }}>
                    {s.icon}
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '2px', fontWeight: 500 }}>{s.label}</p>
                    <p style={{ color: '#ffffff', fontSize: '24px', fontWeight: 800, lineHeight: 1, fontFamily: 'Outfit, sans-serif' }}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Recommended Careers ── */}
            <section className="card" style={{ padding: '28px' }}>
              <span className="section-label">RECOMMENDED FOR YOU</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recommendedCareers.map((c) => (
                  <div key={c.name} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 18px', background: 'var(--surface-alt)', borderRadius: '6px',
                    border: '1px solid rgba(37, 99, 235, 0.08)',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px', fontFamily: 'Outfit, sans-serif' }}>{c.name}</span>
                      <span className="badge" style={{
                        background: 'rgba(37, 99, 235, 0.12)',
                        color: 'var(--accent)',
                        border: '1px solid rgba(37, 99, 235, 0.3)'
                      }}>
                        {c.badge}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {c.tags.map((t: string) => (
                          <span key={t} className="badge badge-muted">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>{c.salary}</span>
                      <Link href="/dashboard/categories" style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1 }}>↗</Link>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '20px' }}>
                <Link href="/dashboard/categories" className="btn-outline" style={{ fontSize: '12px', padding: '8px 18px' }}>
                  Explore All →
                </Link>
              </div>
            </section>

            {/* ── Trending Skills ── */}
            <section className="card" style={{ padding: '28px' }}>
              <span className="section-label">TRENDING SKILLS</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                {trendingSkills.length > 0 ? (
                  trendingSkills.map((s) => (
                    <span key={s} className="skill-pill">{s}</span>
                  ))
                ) : (
                  ['Python', 'Machine Learning', 'React', 'Node.js', 'AWS', 'SQL', 'Docker'].map((s) => (
                    <span key={s} className="skill-pill">{s}</span>
                  ))
                )}
              </div>
              <Link href="/dashboard/skills" className="btn-outline" style={{ fontSize: '12px', padding: '8px 18px' }}>
                View Skill Map →
              </Link>
            </section>

            {/* ── Quick Actions ── */}
            <section className="card" style={{ padding: '28px' }}>
              <span className="section-label">QUICK ACTIONS</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                {[
                  { icon: '◈', title: 'Career Categories', sub: 'Browse all career paths',   link: '/dashboard/categories' },
                  { icon: '◉', title: 'Skill Map',          sub: 'Find your skill gaps',      link: '/dashboard/skills' },
                  { icon: '◎', title: 'Courses',            sub: 'Recommended learning',      link: '/dashboard/courses' },
                  { icon: '⊞', title: 'Compare Careers',   sub: 'Side-by-side metrics',      link: '/dashboard/compare' },
                  { icon: '🗺', title: 'Learning Roadmaps',  sub: 'Step-by-step developer guides', link: '/dashboard/roadmaps' },
                ].map((a) => (
                  <Link key={a.title} href={a.link} style={{ textDecoration: 'none' }}>
                    <div className="card card-hover" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', height: '100%', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        border: '1px solid rgba(37, 99, 235, 0.2)',
                        background: 'rgba(37, 99, 235, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent)',
                        fontSize: '18px'
                      }}>
                        {a.icon}
                      </div>
                      <div>
                        <p style={{ color: '#ffffff', fontWeight: 600, fontSize: '14px', margin: 0, fontFamily: 'Outfit, sans-serif' }}>{a.title}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '4px 0 0', lineHeight: 1.4 }}>{a.sub}</p>
                      </div>
                      <span style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: 600, marginTop: 'auto', paddingTop: '8px', display: 'inline-flex', alignItems: 'center' }}>Go Now →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* ── Daily Focus ── */}
            <section className="card" style={{ padding: '28px' }}>
              <span className="section-label">DAILY FOCUS</span>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '14px' }}>Set your goal for today</p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Add a goal..."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                  style={{ flex: 1, background: 'var(--surface-alt)', border: '1px solid var(--border-dark)', color: '#ccc', borderRadius: '6px', height: '42px', outline: 'none' }}
                />
                <button onClick={addGoal} className="btn-primary" style={{ height: '42px', padding: '0 20px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>

              {goals.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '16px', textAlign: 'center' }}>
                  No goals added today.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {goals.map((g, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-alt)', padding: '10px 16px', borderRadius: '6px', border: '1px solid rgba(37, 99, 235, 0.08)' }}>
                      <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{g}</span>
                      <button onClick={() => removeGoal(i)} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '4px' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Career Snapshot ── */}
            <section className="card" style={{ padding: '28px' }}>
              <span className="section-label">CAREER SNAPSHOT</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--surface-alt)', borderRadius: '6px', padding: '18px 20px', border: '1px solid rgba(37, 99, 235, 0.08)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px', fontWeight: 500 }}>Most Promising Career</p>
                  <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '16px', fontFamily: 'Outfit, sans-serif' }}>{mostPopularCareer.name}</p>
                  <p style={{ color: 'var(--accent)', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>{mostPopularCareer.salary}</p>
                </div>
                <div style={{ background: 'var(--surface-alt)', borderRadius: '6px', padding: '18px 20px', border: '1px solid rgba(37, 99, 235, 0.08)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px', fontWeight: 500 }}>Highest Paying Career</p>
                  <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '16px', fontFamily: 'Outfit, sans-serif' }}>{highestPayingCareer.name}</p>
                  <p style={{ color: 'var(--accent)', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>{highestPayingCareer.salary}</p>
                </div>
              </div>
              <Link href="/dashboard/categories" className="btn-outline" style={{ fontSize: '12px', padding: '8px 18px' }}>
                View All Careers →
              </Link>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
