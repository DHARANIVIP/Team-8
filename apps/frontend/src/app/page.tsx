'use client';

import Link from 'next/link';

// ── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav style={{
      border: '1px solid var(--color-border-light)',
      padding: '16px 24px',
      background: 'var(--color-navbar-bg)',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{
        border: '1px solid var(--color-border-medium)',
        padding: '6px 14px',
        background: 'var(--color-bg-secondary)',
        borderRadius: '8px',
      }}>
        <span style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: '14px', letterSpacing: '0.08em', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase' }}>
          Mastermind
        </span>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
    <section className="card animate-fade-in" style={{
      flex: '1.6 1 600px',
      minWidth: '320px',
      padding: '48px 40px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-card)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <span className="section-label" style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--color-primary)' }}>
          CAREER GUIDANCE PORTAL
        </span>
        <h1 style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1.15, marginBottom: '20px', color: 'var(--color-text-primary)', fontFamily: 'Outfit, sans-serif' }}>
          Explore Careers,<br />Build Your Future.
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', maxWidth: '580px', marginBottom: '32px', lineHeight: 1.7 }}>
          One platform for career roadmaps, skill gap analysis, course recommendations, and side-by-side career comparison. Designed for students who want clarity after graduation.
        </p>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <Link href="/signup" className="btn-primary" style={{ fontSize: '14px', padding: '10px 22px' }}>
            Get Started →
          </Link>
          <Link href="/login" className="btn-outline" style={{ fontSize: '14px', padding: '10px 22px' }}>
            Sign In
          </Link>
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

// FeaturePreview Component
function FeaturePreview() {
  return (
    <section className="card animate-fade-in" style={{
      flex: '1 1 380px',
      minWidth: '320px',
      padding: '48px 40px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-card)'
    }}>
      <span className="section-label" style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--color-primary)', marginBottom: '24px' }}>
        WHAT YOU GET
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {features.map((f) => (
          <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <span style={{ color: 'var(--color-primary)', fontSize: '18px', marginTop: '2px' }}>
              {f.icon}
            </span>
            <div>
              <p style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '14.5px', marginBottom: '4px', fontFamily: 'Outfit, sans-serif' }}>
                {f.title}
              </p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
                {f.desc}
              </p>
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
    <section className="card" style={{ overflow: 'hidden', padding: '18px 24px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <span className="section-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
          PLATFORM STATS
        </span>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div className="ticker-track">
            {items.map((s, i) => (
              <span key={i} className="ticker-item" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
                {s.label}: <span className="value" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{s.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── SpotlightShowcase (Extra Showcase Box) ───────────────────────────────────
function SpotlightShowcase() {
  return (
    <section className="card" style={{
      padding: '56px 48px',
      background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-bg-card) 100%)',
      border: '1px solid var(--color-border-card)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '40px', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <div style={{ flex: '1 1 600px', minWidth: '320px' }}>
          <span className="section-label">NEW FEATURE INSIGHT</span>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.01em' }}>
            Interactive PDF Syllabus Reader & Progress HUD
          </h2>
          <p style={{ fontSize: '14.5px', color: 'var(--color-text-secondary)', marginBottom: '28px', lineHeight: 1.75, maxWidth: '640px' }}>
            Get direct access to official Frontend, Backend, DevOps, and Machine Learning curriculum syllabi, now rendered side-by-side with an interactive checklist! Track your learning progress, check off completed milestones, and view your dynamic progress updates in real-time.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
              <span style={{ color: 'var(--color-primary)', fontSize: '16px' }}>✓</span> PDF Dual-View Toggle
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
              <span style={{ color: 'var(--color-primary)', fontSize: '16px' }}>✓</span> Dynamic Progress HUD
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
              <span style={{ color: 'var(--color-primary)', fontSize: '16px' }}>✓</span> Local Persistence Sync
            </div>
          </div>
        </div>
        <div style={{ flex: '1 1 300px', minWidth: '260px', display: 'flex', justifyContent: 'center' }}>
          <Link href="/signup" className="btn-primary" style={{ padding: '14px 32px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Start Tracking Progress →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="card" style={{ padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)' }}>
      <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>© 2026 Mastermind — Team 8 Student Career Guidance Portal</span>
      <div style={{ display: 'flex', gap: '24px' }}>
        <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>GitHub</a>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div style={{ background: 'var(--color-bg-main)', minHeight: '100vh', padding: '32px 0' }}>
      <main className="animate-slide-up" style={{
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        <Navbar />
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'stretch', width: '100%' }}>
          <HeroSection />
          <FeaturePreview />
        </div>
        <StatsTicker />
        <SpotlightShowcase />
        <Footer />
      </main>
    </div>
  );
}
