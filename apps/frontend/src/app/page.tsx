'use client';

import Link from 'next/link';

// ── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav style={{
      borderBottom: '1px solid rgba(255, 158, 66, 0.15)',
      padding: '0 24px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(10, 10, 10, 0.8)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.03em', fontFamily: 'Outfit, sans-serif' }}>
          Mastermind
        </span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/login" className="btn-ghost" style={{ fontSize: '13px', padding: '6px 16px' }}>
            Sign In
          </Link>
          <Link href="/signup" className="btn-primary" style={{ fontSize: '13px', padding: '7px 18px' }}>
            Get Started →
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── HeroSection ──────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="card animate-fade-in" style={{ padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 158, 66, 0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '40px',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left Column: Text Content */}
        <div style={{ flex: '1 1 500px', minWidth: '300px' }}>
          <span className="section-label">CAREER GUIDANCE PORTAL</span>
          <h1 style={{ fontSize: '46px', fontWeight: 800, lineHeight: 1.1, marginBottom: '20px', color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>
            Explore Careers,<br />Build Your Future.
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '560px', marginBottom: '32px', lineHeight: 1.7 }}>
            One platform for career roadmaps, skill gap analysis, course recommendations, and side-by-side career comparison. Designed for students who want clarity after graduation.
          </p>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <Link href="/signup" className="btn-primary" style={{ fontSize: '14px' }}>
              Get Started →
            </Link>
            <Link href="/login" className="btn-outline" style={{ fontSize: '14px' }}>
              Sign In
            </Link>
          </div>
        </div>

        {/* Right Column: Illustration Image */}
        <div style={{ flex: '1 1 400px', minWidth: '300px', display: 'flex', justifyContent: 'center' }}>
          <img
            src="/landingpage copy.png"
            alt="Career Guidance Portal Illustration"
            style={{
              width: '100%',
              maxWidth: '480px',
              height: 'auto',
              border: '1px solid rgba(255, 158, 66, 0.15)',
              boxShadow: '0 0 24px rgba(255, 158, 66, 0.1)'
            }}
          />
        </div>
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
    <section className="card" style={{ padding: '36px 40px' }}>
      <span className="section-label">WHAT YOU GET</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {features.map((f) => (
          <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <span style={{ color: 'var(--accent)', fontSize: '20px', marginTop: '1px', textShadow: '0 0 10px var(--accent-glow)' }}>{f.icon}</span>
            <div>
              <p style={{ color: '#ffffff', fontWeight: 600, fontSize: '15px', marginBottom: '3px', fontFamily: 'Outfit, sans-serif' }}>{f.title}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>{f.desc}</p>
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
    <section className="card" style={{ overflow: 'hidden', padding: '18px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
        <span className="section-label" style={{ marginBottom: 0, marginLeft: '24px', marginRight: '24px', whiteSpace: 'nowrap' }}>
          PLATFORM STATS
        </span>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div className="ticker-track">
            {items.map((s, i) => (
              <span key={i} className="ticker-item" style={{ fontFamily: 'Inter, sans-serif' }}>
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
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
      {cards.map((c) => (
        <div key={c.title} className="card card-hover" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <span style={{ fontSize: '28px', color: 'var(--accent)', textShadow: '0 0 10px var(--accent-glow)' }}>{c.icon}</span>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>{c.title}</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65, flex: 1 }}>{c.desc}</p>
          <Link href={c.link} style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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
    <footer className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>© 2026 Mastermind — Team 8 Student Career Guidance Portal</span>
      <div style={{ display: 'flex', gap: '24px' }}>
        <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>GitHub</a>
        <Link href="/dashboard" style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 600 }}>Dashboard</Link>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Navbar />
      <main className="page-container animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '24px', paddingBottom: '40px' }}>
        <HeroSection />
        <FeaturePreview />
        <StatsTicker />
        <FeatureCards />
        <Footer />
      </main>
    </div>
  );
}
