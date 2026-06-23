'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardNavbar from '@/components/DashboardNavbar';


const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const providers = ['All', 'Coursera', 'Udemy', 'edX', 'YouTube', 'Official Docs'];

const diffColor: Record<string, string> = {
  Beginner: '#50c878',
  Intermediate: '#ff9e42',
  Advanced: '#e55',
};

const courses = [
  { title:'Python for Everybody',              provider:'Coursera',      skill:'Python',    difficulty:'Beginner',     weeks:8,  recommended: true },
  { title:'The Complete JavaScript Course',   provider:'Udemy',         skill:'JavaScript',difficulty:'Beginner',     weeks:10, recommended: true },
  { title:'AWS Cloud Practitioner',           provider:'Official Docs', skill:'AWS',        difficulty:'Intermediate', weeks:6,  recommended: false },
  { title:'Machine Learning Specialisation',  provider:'Coursera',      skill:'ML',         difficulty:'Advanced',     weeks:16, recommended: true },
  { title:'Docker & Kubernetes Bootcamp',     provider:'Udemy',         skill:'Docker',     difficulty:'Intermediate', weeks:8,  recommended: false },
  { title:'SQL for Data Analysis',            provider:'edX',           skill:'SQL',        difficulty:'Beginner',     weeks:5,  recommended: false },
  { title:'Figma UI/UX Design',              provider:'Udemy',         skill:'Figma',      difficulty:'Beginner',     weeks:6,  recommended: false },
  { title:'Cybersecurity Fundamentals',       provider:'edX',           skill:'Security',   difficulty:'Intermediate', weeks:10, recommended: false },
  { title:'TensorFlow Developer Certificate', provider:'Coursera',      skill:'TensorFlow', difficulty:'Advanced',     weeks:20, recommended: false },
  { title:'React — The Complete Guide',       provider:'Udemy',         skill:'React',      difficulty:'Intermediate', weeks:12, recommended: true },
];

export default function CoursesPage() {
  const [diffFilter, setDiffFilter] = useState('All');
  const [provFilter, setProvFilter] = useState('All');

  const filtered = courses.filter((c) =>
    (diffFilter === 'All' || c.difficulty === diffFilter) &&
    (provFilter === 'All' || c.provider === provFilter)
  );

  const recommended = filtered.filter((c) => c.recommended);
  const rest = filtered.filter((c) => !c.recommended);

  return (
    <div style={{ background:'#0d0d0d', minHeight:'100vh' }}>
      <DashboardNavbar />
      <main style={{ maxWidth:'1100px', margin:'0 auto', padding:'24px 40px' }}>
        {/* ── Header ── */}
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
            <div>
              <span className="section-label" style={{ display: 'block', marginBottom: '4px' }}>COURSE SUGGESTIONS</span>
              <h1 style={{ color: '#ffffff', fontWeight: 700, fontSize: '24px', margin: 0, letterSpacing: '0.5px' }}>Find Your Next Course</h1>
              <p style={{ color: '#aaaaaa', fontSize: '14px', margin: '4px 0 0' }}>Curated courses filtered by skill, difficulty, and provider</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom:'20px', padding:'20px 24px', display:'flex', gap:'24px', alignItems:'flex-start' }}>
          <div>
            <p style={{ color:'#aaaaaa', fontSize:'11px', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.08em' }}>Difficulty</p>
            <div style={{ display:'flex', gap:'6px' }}>
              {difficulties.map((d) => (
                <button key={d} onClick={() => setDiffFilter(d)} className={diffFilter === d ? 'btn-primary' : 'btn-ghost'} style={{ fontSize:'12px', padding:'5px 12px' }}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ color:'#aaaaaa', fontSize:'11px', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.08em' }}>Provider</p>
            <div style={{ display:'flex', gap:'6px' }}>
              {providers.map((p) => (
                <button key={p} onClick={() => setProvFilter(p)} className={provFilter === p ? 'btn-primary' : 'btn-ghost'} style={{ fontSize:'12px', padding:'5px 12px' }}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Recommended */}
        {recommended.length > 0 && (
          <section style={{ marginBottom:'24px' }}>
            <span className="section-label">⭐ RECOMMENDED FOR YOU</span>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'14px' }}>
              {recommended.map((c) => (
                <div key={c.title} className="card card-hover" style={{ padding:'20px 22px', borderLeft:`3px solid ${diffColor[c.difficulty] || '#ff9e42'}`, display:'flex', flexDirection:'column', gap:'10px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <h3 style={{ color:'#cccccc', fontWeight:700, fontSize:'14px', flex:1, marginRight:'10px' }}>{c.title}</h3>
                    <span className="badge badge-accent" style={{ whiteSpace:'nowrap', fontSize:'10px' }}>Recommended</span>
                  </div>
                  <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                    <span className="badge badge-muted">{c.provider}</span>
                    <span className="badge" style={{ background:`${diffColor[c.difficulty]}20`, color:diffColor[c.difficulty], border:`1px solid ${diffColor[c.difficulty]}40`, fontSize:'10px' }}>{c.difficulty}</span>
                    <span style={{ color:'#aaaaaa', fontSize:'12px' }}>{c.weeks}w</span>
                  </div>
                  <a href="#" className="btn-primary" style={{ fontSize:'12px', padding:'7px 14px', alignSelf:'flex-start' }}>Start Course →</a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Courses */}
        <section>
          <span className="section-label">ALL COURSES ({rest.length})</span>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {rest.map((c) => (
              <div key={c.title} className="card card-hover" style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderLeft:`3px solid ${diffColor[c.difficulty] || '#aaaaaa'}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                  <div>
                    <p style={{ color:'#cccccc', fontWeight:600, fontSize:'14px' }}>{c.title}</p>
                    <div style={{ display:'flex', gap:'6px', marginTop:'4px' }}>
                      <span className="badge badge-muted" style={{ fontSize:'10px' }}>{c.provider}</span>
                      <span className="badge badge-muted" style={{ fontSize:'10px' }}>{c.skill}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <span className="badge" style={{ background:`${diffColor[c.difficulty]}20`, color:diffColor[c.difficulty], border:`1px solid ${diffColor[c.difficulty]}40`, fontSize:'10px' }}>{c.difficulty}</span>
                  <span style={{ color:'#aaaaaa', fontSize:'12px', whiteSpace:'nowrap' }}>{c.weeks} weeks</span>
                  <a href="#" className="btn-outline" style={{ fontSize:'11px', padding:'5px 12px' }}>View →</a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
