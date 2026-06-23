'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardNavbar from '@/components/DashboardNavbar';


const careerOptions = ['Software Engineer', 'Data Scientist', 'UX Designer', 'Cybersecurity Analyst', 'Product Manager', 'Cloud Architect'];

const skillsByCareer: Record<string, { name: string; category: string; level: number }[]> = {
  'Software Engineer': [
    { name:'Python',     category:'Technical', level:85 },
    { name:'JavaScript', category:'Technical', level:80 },
    { name:'AWS',        category:'Technical', level:60 },
    { name:'Docker',     category:'Technical', level:55 },
    { name:'Git',        category:'Technical', level:90 },
    { name:'Communication', category:'Soft Skill', level:70 },
    { name:'Problem Solving', category:'Soft Skill', level:88 },
  ],
  'Data Scientist': [
    { name:'Python',     category:'Technical', level:90 },
    { name:'SQL',        category:'Technical', level:75 },
    { name:'Machine Learning', category:'Domain', level:70 },
    { name:'Statistics', category:'Domain', level:80 },
    { name:'TensorFlow', category:'Technical', level:55 },
    { name:'Data Visualisation', category:'Technical', level:65 },
  ],
  'UX Designer': [
    { name:'Figma',       category:'Technical', level:90 },
    { name:'Prototyping', category:'Technical', level:80 },
    { name:'User Research', category:'Domain', level:75 },
    { name:'CSS',         category:'Technical', level:60 },
    { name:'Empathy',     category:'Soft Skill', level:88 },
    { name:'Visual Design', category:'Technical', level:82 },
  ],
  'Cybersecurity Analyst': [
    { name:'Networking',  category:'Technical', level:80 },
    { name:'SIEM',        category:'Technical', level:65 },
    { name:'Pen Testing', category:'Technical', level:55 },
    { name:'SOC',         category:'Domain', level:70 },
    { name:'Risk Analysis', category:'Domain', level:72 },
  ],
  'Product Manager': [
    { name:'Roadmapping', category:'Domain', level:80 },
    { name:'Agile',       category:'Technical', level:85 },
    { name:'SQL',         category:'Technical', level:50 },
    { name:'Communication', category:'Soft Skill', level:92 },
    { name:'Strategy',    category:'Domain', level:78 },
  ],
  'Cloud Architect': [
    { name:'AWS',        category:'Technical', level:88 },
    { name:'Azure',      category:'Technical', level:70 },
    { name:'Kubernetes', category:'Technical', level:75 },
    { name:'Terraform',  category:'Technical', level:65 },
    { name:'Networking', category:'Technical', level:80 },
  ],
};

function levelColor(l: number) {
  if (l >= 80) return '#ff9e42';
  if (l >= 55) return '#ff9757';
  return '#aaaaaa';
}

export default function SkillsPage() {
  const [selected, setSelected] = useState('Software Engineer');
  const [filter, setFilter] = useState('All');
  const skills = skillsByCareer[selected] || [];
  const categories = ['All', ...Array.from(new Set(skills.map((s) => s.category)))];
  const filtered = filter === 'All' ? skills : skills.filter((s) => s.category === filter);

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
              <span className="section-label" style={{ display: 'block', marginBottom: '4px' }}>SKILL MAPPING</span>
              <h1 style={{ color: '#ffffff', fontWeight: 700, fontSize: '24px', margin: 0, letterSpacing: '0.5px' }}>Skill Proficiency Matrix</h1>
              <p style={{ color: '#aaaaaa', fontSize: '14px', margin: '4px 0 0' }}>Select a career to see required skills and your gap areas</p>
            </div>
          </div>
        </div>

        {/* Career Selector */}
        <div className="card" style={{ marginBottom:'20px', padding:'20px 24px' }}>
          <p style={{ color:'#bbbbbb', fontSize:'13px', marginBottom:'10px', fontWeight:500 }}>Select Target Career</p>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {careerOptions.map((c) => (
              <button key={c} onClick={() => { setSelected(c); setFilter('All'); }}
                className={selected === c ? 'btn-primary' : 'btn-ghost'}
                style={{ fontSize:'12px', padding:'6px 14px' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'20px' }}>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={filter === cat ? 'btn-primary' : 'btn-ghost'}
              style={{ fontSize:'12px', padding:'5px 14px' }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Skill Matrix */}
        <div className="card" style={{ padding:'24px 28px' }}>
          <p style={{ color:'#aaaaaa', fontSize:'12px', marginBottom:'16px' }}>
            Showing <span style={{ color:'#ff9e42', fontWeight:600 }}>{filtered.length}</span> skills for <span style={{ color:'#cccccc', fontWeight:600 }}>{selected}</span>
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {filtered.map((s) => (
              <div key={s.name}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <span style={{ color:'#cccccc', fontSize:'14px', fontWeight:600 }}>{s.name}</span>
                    <span className="badge badge-muted" style={{ fontSize:'10px' }}>{s.category}</span>
                  </div>
                  <span style={{ color: levelColor(s.level), fontWeight:700, fontSize:'13px' }}>{s.level}%</span>
                </div>
                <div style={{ height:'6px', background:'#1a1a1a', borderRadius:'999px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${s.level}%`, background: levelColor(s.level), borderRadius:'999px', transition:'width 0.4s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop:'20px' }}>
          <Link href="/dashboard/courses" className="btn-primary" style={{ fontSize:'13px' }}>
            Find Courses for These Skills →
          </Link>
        </div>
      </main>
    </div>
  );
}
