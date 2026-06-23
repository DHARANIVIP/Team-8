'use client';

import Link from 'next/link';
import DashboardNavbar from '@/components/DashboardNavbar';

// ── Stats Cards ───────────────────────────────────────────────────────────────
const stats = [
  { icon: '◈', label: 'Career Paths', value: '50+' },
  { icon: '◉', label: 'Skills Tracked', value: '200+' },
  { icon: '◎', label: 'Courses Available', value: '100+' },
  { icon: '⊞', label: 'Comparisons Done', value: '0' },
];

function StatsCards() {
  return (
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
  );
}

// ── Recommended Careers ───────────────────────────────────────────────────────
const recommended = [
  { name: 'Software Engineer',              tags: ['Python', 'JavaScript', 'AWS'], salary: '₹8L – ₹25L', hot: true },
  { name: 'Data Scientist',                 tags: ['Python', 'ML', 'SQL'],         salary: '₹10L – ₹30L', hot: false },
  { name: 'UX Designer',                   tags: ['Figma', 'Prototyping'],        salary: '₹6L – ₹18L', hot: false },
  { name: 'Cybersecurity Analyst',          tags: ['Networking', 'SIEM'],          salary: '₹7L – ₹22L', hot: false },
];

function RecommendedCareers() {
  return (
    <section className="card" style={{ padding: '24px 28px' }}>
      <span className="section-label">RECOMMENDED CAREERS</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {recommended.map((c) => (
          <div key={c.name} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', background: '#1a1a1a', borderRadius: '6px',
            border: '1px solid #1f1f1f',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ color: '#cccccc', fontWeight: 600, fontSize: '14px' }}>{c.name}</span>
              {c.hot && <span className="badge badge-accent">AI Recommended</span>}
              <div style={{ display: 'flex', gap: '6px' }}>
                {c.tags.map((t) => (
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
  );
}

// ── Trending Skills ───────────────────────────────────────────────────────────
const trendingSkills = ['Python', 'Machine Learning', 'React', 'Node.js', 'AWS', 'SQL', 'Docker', 'Kubernetes', 'Figma', 'Cybersecurity', 'Data Analysis', 'TypeScript', 'Go', 'DevOps'];

function TrendingSkills() {
  return (
    <section className="card" style={{ padding: '24px 28px' }}>
      <span className="section-label">TRENDING SKILLS</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {trendingSkills.map((s) => (
          <span key={s} className="skill-pill">{s}</span>
        ))}
      </div>
      <Link href="/dashboard/skills" className="btn-outline" style={{ fontSize: '12px', padding: '7px 16px' }}>
        View Skill Map →
      </Link>
    </section>
  );
}

// ── Quick Actions ──────────────────────────────────────────────────────────────
const actions = [
  { icon: '◈', title: 'Career Categories', sub: 'Browse all career paths',   link: '/dashboard/categories' },
  { icon: '◉', title: 'Skill Map',          sub: 'Find your skill gaps',      link: '/dashboard/skills' },
  { icon: '◎', title: 'Courses',            sub: 'Recommended learning',      link: '/dashboard/courses' },
  { icon: '⊞', title: 'Compare Careers',   sub: 'Side-by-side metrics',      link: '/dashboard/compare' },
];

function QuickActions() {
  return (
    <section className="card" style={{ padding: '24px 28px' }}>
      <span className="section-label">QUICK ACTIONS</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {actions.map((a) => (
          <Link key={a.title} href={a.link} style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}>
              <span style={{ fontSize: '20px', color: '#ff9e42' }}>{a.icon}</span>
              <p style={{ color: '#cccccc', fontWeight: 600, fontSize: '13px', margin: 0 }}>{a.title}</p>
              <p style={{ color: '#aaaaaa', fontSize: '12px', margin: 0 }}>{a.sub}</p>
              <span style={{ color: '#ff9e42', fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>Go Now →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Daily Focus ───────────────────────────────────────────────────────────────
function DailyFocus() {
  return (
    <section className="card" style={{ padding: '24px 28px' }}>
      <span className="section-label">DAILY FOCUS</span>
      <p style={{ color: '#aaaaaa', fontSize: '13px', marginBottom: '14px' }}>Set your goal for today</p>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          className="input-field"
          type="text"
          placeholder="Add a goal..."
          style={{ paddingLeft: '14px', flex: 1 }}
        />
        <button className="btn-primary" style={{ padding: '11px 18px', fontSize: '18px', lineHeight: 1 }}>+</button>
      </div>
      <p style={{ color: '#555555', fontSize: '13px', marginTop: '14px', textAlign: 'center' }}>
        No goals added today.
      </p>
    </section>
  );
}

// ── Career Snapshot ───────────────────────────────────────────────────────────
function CareerSnapshot() {
  return (
    <section className="card" style={{ padding: '24px 28px' }}>
      <span className="section-label">CAREER SNAPSHOT</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div style={{ background: '#1a1a1a', borderRadius: '6px', padding: '16px 18px', border: '1px solid #1f1f1f' }}>
          <p style={{ color: '#aaaaaa', fontSize: '12px', marginBottom: '6px' }}>Most Popular Career</p>
          <p style={{ color: '#cccccc', fontWeight: 700, fontSize: '15px' }}>Software Engineer</p>
          <p style={{ color: '#ff9e42', fontSize: '12px', marginTop: '4px' }}>₹8L – ₹25L/year</p>
        </div>
        <div style={{ background: '#1a1a1a', borderRadius: '6px', padding: '16px 18px', border: '1px solid #1f1f1f' }}>
          <p style={{ color: '#aaaaaa', fontSize: '12px', marginBottom: '6px' }}>Highest Paying Career</p>
          <p style={{ color: '#cccccc', fontWeight: 700, fontSize: '15px' }}>Data Scientist</p>
          <p style={{ color: '#ff9e42', fontSize: '12px', marginTop: '4px' }}>₹10L – ₹30L/year</p>
        </div>
      </div>
      <Link href="/dashboard/categories" className="btn-outline" style={{ fontSize: '12px', padding: '7px 16px' }}>
        View All Careers →
      </Link>
    </section>
  );
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh' }}>
      <DashboardNavbar />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <StatsCards />
        <RecommendedCareers />
        <TrendingSkills />
        <QuickActions />
        <DailyFocus />
        <CareerSnapshot />
      </main>
    </div>
  );
}
