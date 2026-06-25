'use client';

import Link from 'next/link';

// ── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav style={{
      borderBottom: '1px solid #1f1f1f',
      padding: '0 40px',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#0d0d0d',
    }}>
      <span style={{ color: '#cccccc', fontWeight: 700, fontSize: '16px', letterSpacing: '-0.02em' }}>
        Mastermind
      </span>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Link href="/login" className="btn-ghost" style={{ fontSize: '13px', padding: '6px 16px' }}>
          Sign In
        </Link>
        <Link href="/signup" className="btn-primary" style={{ fontSize: '13px', padding: '7px 18px' }}>
          Get Started →
        </Link>
      </div>
    </nav>
  );
}

// ── HeroSection ──────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="card" style={{ margin: '20px 40px', padding: '40px 48px' }}>
      <span className="section-label">CAREER GUIDANCE PORTAL</span>
      <h1 style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1.15, marginBottom: '18px', color: '#cccccc' }}>
        Explore Careers,<br />Build Your Future.
      </h1>
      <p style={{ fontSize: '15px', color: '#aaaaaa', maxWidth: '520px', marginBottom: '30px', lineHeight: 1.7 }}>
        One platform for career roadmaps, skill gap analysis, course recommendations, and side-by-side career comparison. Designed for students who want clarity after graduation.
      </p>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Link href="/signup" className="btn-primary" style={{ fontSize: '14px' }}>
          Get Started →
        </Link>
        <Link href="/login" className="btn-outline" style={{ fontSize: '14px' }}>
          Sign In
        </Link>
      </div>
    </section>
  );
}

// ── FeaturePreview ────────────────────────────────────────────────────────────
const features = [
  { icon: '◈', title: 'Career Categories', desc: 'Browse industry panels with interactive career roadmaps and growth paths.' },
  { icon: '◉', title: 'Skill Mapping',     desc: 'Visualise your skill gaps against any target career with a proficiency matrix.' },
  { icon: '◎', title: 'Course Suggestions',desc: 'Get curated course recommendations filtered by difficulty and provider.' },
  { icon: '⊞', title: 'Career Comparison', desc: 'Side-by-side metrics — salary, skill overlap, and growth rate.' },
];

function FeaturePreview() {
  return (
    <section className="card" style={{ margin: '0 40px', padding: '32px 48px' }}>
      <span className="section-label">WHAT YOU GET</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {features.map((f) => (
          <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <span style={{ color: '#ff9e42', fontSize: '18px', marginTop: '1px' }}>{f.icon}</span>
            <div>
              <p style={{ color: '#cccccc', fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{f.title}</p>
              <p style={{ color: '#aaaaaa', fontSize: '13px', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── StatsTicker ───────────────────────────────────────────────────────────────
const stats = [
  { label: 'Career Paths',        value: '50+' },
  { label: 'Skills Tracked',      value: '200+' },
  { label: 'Courses Available',   value: '100+' },
  { label: 'Industries Covered',  value: '12' },
  { label: 'Career Comparisons',  value: 'Unlimited' },
  { label: 'Active Students',     value: '1,000+' },
];

function StatsTicker() {
  const items = [...stats, ...stats]; // duplicate for seamless loop
  return (
    <section className="card" style={{ margin: '0 40px', overflow: 'hidden', padding: '16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
        <span className="section-label" style={{ marginBottom: 0, marginLeft: '24px', marginRight: '24px', whiteSpace: 'nowrap' }}>
          PLATFORM STATS
        </span>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div className="ticker-track">
            {items.map((s, i) => (
              <span key={i} className="ticker-item">
                {s.label}: <span className="value">{s.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── FeatureCards ──────────────────────────────────────────────────────────────
const cards = [
  {
    icon: '◈', title: 'Career Paths',
    desc: 'Explore 50+ structured career roadmaps across tech, design, business, and security.',
    link: '/dashboard/categories', cta: 'Explore Careers',
  },
  {
    icon: '◉', title: 'Skill Gaps',
    desc: 'Select a target career and instantly see which skills you need to develop.',
    link: '/dashboard/skills', cta: 'Map My Skills',
  },
  {
    icon: '◎', title: 'Course Finder',
    desc: 'Find hand-picked courses from top providers, filtered by skill and difficulty.',
    link: '/dashboard/courses', cta: 'Find Courses',
  },
];

function FeatureCards() {
  return (
    <section style={{ margin: '0 40px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
      {cards.map((c) => (
        <div key={c.title} className="card card-hover" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '24px', color: '#ff9e42' }}>{c.icon}</span>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#cccccc' }}>{c.title}</h3>
          <p style={{ fontSize: '13px', color: '#aaaaaa', lineHeight: 1.65, flex: 1 }}>{c.desc}</p>
          <Link href={c.link} style={{ color: '#ff9e42', fontSize: '13px', fontWeight: 600 }}>
            {c.cta} →
          </Link>
        </div>
      ))}
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="card" style={{ margin: '0 40px 40px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ color: '#aaaaaa', fontSize: '13px' }}>© 2026 Mastermind — Team 8 Student Career Guidance Portal</span>
      <div style={{ display: 'flex', gap: '20px' }}>
        <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: '#aaaaaa', fontSize: '13px' }}>GitHub</a>
        <Link href="/dashboard" style={{ color: '#ff9e42', fontSize: '13px' }}>Dashboard</Link>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '20px' }}>
        <HeroSection />
        <FeaturePreview />
        <StatsTicker />
        <FeatureCards />
        <Footer />
      </main>
    </div>
  );
}
