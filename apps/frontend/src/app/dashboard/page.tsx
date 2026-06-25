'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { isAuthenticated, getCurrentUser } from '@/lib/services/auth-service';
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
    <div style={{ background: '#0d0d0d', minHeight: '100vh' }}>
      <DashboardNavbar />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {error && (
          <div style={{ padding: '16px', background: 'rgba(239,68,68,0.06)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="card" style={{ padding: '64px', textAlign: 'center', opacity: 0.7 }}>
            <p style={{ color: '#ff9e42', fontSize: '16px', fontWeight: 600 }}>Syncing and fetching real-time dashboard data...</p>
          </div>
        ) : (
          <>
            {/* ── Stats Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              {stats.map((s) => (
                <div key={s.label} className="card card-hover" style={{ padding: '20px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <span style={{ fontSize: '22px', color: '#ff9e42' }}>{s.icon}</span>
                  <div>
                    <p style={{ color: '#aaaaaa', fontSize: '12px', marginBottom: '4px' }}>{s.label}</p>
                    <p style={{ color: '#cccccc', fontSize: '22px', fontWeight: 800, lineHeight: 1 }}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Recommended Careers ── */}
            <section className="card" style={{ padding: '24px 28px' }}>
              <span className="section-label">RECOMMENDED FOR YOU</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recommendedCareers.map((c) => (
                  <div key={c.name} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', background: '#1a1a1a', borderRadius: '6px',
                    border: '1px solid #1f1f1f',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ color: '#cccccc', fontWeight: 600, fontSize: '14px' }}>{c.name}</span>
                      <span className="badge badge-accent" style={{ background: c.badge === 'Target Career' ? 'rgba(80,200,120,0.1)' : undefined, color: c.badge === 'Target Career' ? '#50c878' : undefined, border: c.badge === 'Target Career' ? '1px solid rgba(80,200,120,0.2)' : undefined }}>
                        {c.badge}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {c.tags.map((t: string) => (
                          <span key={t} className="badge badge-muted">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ color: '#ff9e42', fontSize: '13px', fontWeight: 600 }}>{c.salary}</span>
                      <Link href="/dashboard/categories" style={{ color: '#aaaaaa', fontSize: '18px', lineHeight: 1 }}>↗</Link>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px' }}>
                <Link href="/dashboard/categories" className="btn-outline" style={{ fontSize: '12px', padding: '7px 16px' }}>
                  Explore All →
                </Link>
              </div>
            </section>

            {/* ── Trending Skills ── */}
            <section className="card" style={{ padding: '24px 28px' }}>
              <span className="section-label">TRENDING SKILLS</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
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
              <Link href="/dashboard/skills" className="btn-outline" style={{ fontSize: '12px', padding: '7px 16px' }}>
                View Skill Map →
              </Link>
            </section>

            {/* ── Quick Actions ── */}
            <section className="card" style={{ padding: '24px 28px' }}>
              <span className="section-label">QUICK ACTIONS</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                {[
                  { icon: '◈', title: 'Career Categories', sub: 'Browse all career paths',   link: '/dashboard/categories' },
                  { icon: '◉', title: 'Skill Map',          sub: 'Find your skill gaps',      link: '/dashboard/skills' },
                  { icon: '◎', title: 'Courses',            sub: 'Recommended learning',      link: '/dashboard/courses' },
                  { icon: '⊞', title: 'Compare Careers',   sub: 'Side-by-side metrics',      link: '/dashboard/compare' },
                  { icon: '🗺', title: 'Learning Roadmaps',  sub: 'Step-by-step developer guides', link: '/dashboard/roadmaps' },
                ].map((a) => (
                  <Link key={a.title} href={a.link} style={{ textDecoration: 'none' }}>
                    <div className="card card-hover" style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer', height: '100%' }}>
                      <span style={{ fontSize: '20px', color: '#ff9e42' }}>{a.icon}</span>
                      <p style={{ color: '#cccccc', fontWeight: 600, fontSize: '13px', margin: 0 }}>{a.title}</p>
                      <p style={{ color: '#aaaaaa', fontSize: '12px', margin: 0 }}>{a.sub}</p>
                      <span style={{ color: '#ff9e42', fontSize: '12px', fontWeight: 600, marginTop: 'auto', paddingTop: '4px' }}>Go Now →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* ── Daily Focus ── */}
            <section className="card" style={{ padding: '24px 28px' }}>
              <span className="section-label">DAILY FOCUS</span>
              <p style={{ color: '#aaaaaa', fontSize: '13px', marginBottom: '14px' }}>Set your goal for today</p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Add a goal..."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                  style={{ paddingLeft: '14px', flex: 1, background: '#0d0d0d', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: '6px', height: '40px', outline: 'none' }}
                />
                <button onClick={addGoal} className="btn-primary" style={{ height: '40px', padding: '0 18px', fontSize: '18px', lineHeight: 1 }}>+</button>
              </div>

              {goals.length === 0 ? (
                <p style={{ color: '#555555', fontSize: '13px', marginTop: '14px', textAlign: 'center' }}>
                  No goals added today.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {goals.map((g, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#131313', padding: '8px 14px', borderRadius: '6px', border: '1px solid #1c1c1c' }}>
                      <span style={{ color: '#cccccc', fontSize: '13px' }}>{g}</span>
                      <button onClick={() => removeGoal(i)} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Career Snapshot ── */}
            <section className="card" style={{ padding: '24px 28px' }}>
              <span className="section-label">CAREER SNAPSHOT</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ background: '#1a1a1a', borderRadius: '6px', padding: '16px 18px', border: '1px solid #1f1f1f' }}>
                  <p style={{ color: '#aaaaaa', fontSize: '12px', marginBottom: '6px' }}>Most Promising Career</p>
                  <p style={{ color: '#cccccc', fontWeight: 700, fontSize: '15px' }}>{mostPopularCareer.name}</p>
                  <p style={{ color: '#ff9e42', fontSize: '12px', marginTop: '4px' }}>{mostPopularCareer.salary}</p>
                </div>
                <div style={{ background: '#1a1a1a', borderRadius: '6px', padding: '16px 18px', border: '1px solid #1f1f1f' }}>
                  <p style={{ color: '#aaaaaa', fontSize: '12px', marginBottom: '6px' }}>Highest Paying Career</p>
                  <p style={{ color: '#cccccc', fontWeight: 700, fontSize: '15px' }}>{highestPayingCareer.name}</p>
                  <p style={{ color: '#ff9e42', fontSize: '12px', marginTop: '4px' }}>{highestPayingCareer.salary}</p>
                </div>
              </div>
              <Link href="/dashboard/categories" className="btn-outline" style={{ fontSize: '12px', padding: '7px 16px' }}>
                View All Careers →
              </Link>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
