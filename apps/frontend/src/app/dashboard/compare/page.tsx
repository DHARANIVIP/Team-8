'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardNavbar from '@/components/DashboardNavbar';


// ── Data ─────────────────────────────────────────────────────────────────────
const careerData: Record<string, {
  salary: string; salaryMin: number; salaryMax: number;
  growth: string; industry: string;
  skills: string[]; softSkills: string[];
  education: string; jobOutlook: string;
}> = {
  'Software Engineer': {
    salary:'₹8L – ₹25L', salaryMin:8, salaryMax:25,
    growth:'28%', industry:'Technology',
    skills:['Python','JavaScript','AWS','Docker','Git','React','SQL'],
    softSkills:['Problem Solving','Communication','Team Work'],
    education:'B.Tech / BCA / Bootcamp', jobOutlook:'Excellent',
  },
  'Data Scientist': {
    salary:'₹10L – ₹30L', salaryMin:10, salaryMax:30,
    growth:'36%', industry:'Data & AI',
    skills:['Python','SQL','Machine Learning','TensorFlow','Statistics','Tableau'],
    softSkills:['Analytical Thinking','Communication','Curiosity'],
    education:'B.Tech / B.Sc Statistics / M.Sc', jobOutlook:'Excellent',
  },
  'UX Designer': {
    salary:'₹6L – ₹18L', salaryMin:6, salaryMax:18,
    growth:'22%', industry:'Design',
    skills:['Figma','Prototyping','User Research','CSS','Wireframing','Adobe XD'],
    softSkills:['Empathy','Creativity','Communication'],
    education:'Design Degree / Certification', jobOutlook:'Good',
  },
  'Cybersecurity Analyst': {
    salary:'₹7L – ₹22L', salaryMin:7, salaryMax:22,
    growth:'33%', industry:'Security',
    skills:['Networking','SIEM','Pen Testing','SOC','Risk Analysis','Forensics'],
    softSkills:['Attention to Detail','Problem Solving','Ethics'],
    education:'B.Tech / Security Certification', jobOutlook:'Very Good',
  },
  'Product Manager': {
    salary:'₹12L – ₹35L', salaryMin:12, salaryMax:35,
    growth:'25%', industry:'Business',
    skills:['Roadmapping','Agile','SQL','Market Research','Communication','Jira'],
    softSkills:['Leadership','Strategic Thinking','Empathy'],
    education:'MBA / Engineering Degree', jobOutlook:'Excellent',
  },
  'Cloud Architect': {
    salary:'₹15L – ₹40L', salaryMin:15, salaryMax:40,
    growth:'31%', industry:'Technology',
    skills:['AWS','Azure','Kubernetes','Terraform','Networking','Docker'],
    softSkills:['Architecture Thinking','Communication','Leadership'],
    education:'B.Tech + Cloud Certifications', jobOutlook:'Excellent',
  },
};

const careerOptions = Object.keys(careerData);

// ── Overlap Gauge ─────────────────────────────────────────────────────────────
function OverlapGauge({ pct }: { pct: number }) {
  const r = 44, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#1a1a1a" strokeWidth="10" />
        <circle cx="55" cy="55" r={r} fill="none" stroke="#ff9e42" strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 55 55)" />
        <text x="55" y="60" textAnchor="middle" fill="#cccccc" fontSize="18" fontWeight="800" fontFamily="Segoe UI">
          {pct}%
        </text>
      </svg>
      <p style={{ color:'#aaaaaa', fontSize:'12px' }}>Skill Overlap</p>
    </div>
  );
}

// ── Salary Bar ────────────────────────────────────────────────────────────────
function SalaryBar({ label, min, max, maxAll }: { label:string; min:number; max:number; maxAll:number }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px' }}>
        <span style={{ color:'#cccccc', fontWeight:600 }}>{label}</span>
        <span style={{ color:'#ff9e42', fontWeight:700 }}>₹{min}L – ₹{max}L</span>
      </div>
      <div style={{ height:'8px', background:'#1a1a1a', borderRadius:'999px', overflow:'hidden', position:'relative' }}>
        <div style={{
          position:'absolute', left:`${(min / maxAll) * 100}%`,
          width:`${((max - min) / maxAll) * 100}%`,
          height:'100%', background:'linear-gradient(90deg,#ff9757,#ff9e42)',
          borderRadius:'999px',
        }} />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const [careerA, setCareerA] = useState('Software Engineer');
  const [careerB, setCareerB] = useState('Data Scientist');
  const [compared, setCompared] = useState(false);

  const dataA = careerData[careerA];
  const dataB = careerData[careerB];

  const commonSkills  = dataA.skills.filter((s) => dataB.skills.includes(s));
  const uniqueA       = dataA.skills.filter((s) => !dataB.skills.includes(s));
  const uniqueB       = dataB.skills.filter((s) => !dataA.skills.includes(s));
  const overlapPct    = Math.round((commonSkills.length / Math.max(dataA.skills.length, dataB.skills.length)) * 100);
  const maxSalary     = 45;

  const rows = [
    { label:'Industry',     a: dataA.industry,    b: dataB.industry },
    { label:'Avg Salary',   a: dataA.salary,      b: dataB.salary },
    { label:'Growth Rate',  a: dataA.growth,      b: dataB.growth },
    { label:'Education',    a: dataA.education,   b: dataB.education },
    { label:'Job Outlook',  a: dataA.jobOutlook,  b: dataB.jobOutlook },
  ];

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
              <span className="section-label" style={{ display: 'block', marginBottom: '4px' }}>CAREER COMPARISON</span>
              <h1 style={{ color: '#ffffff', fontWeight: 700, fontSize: '24px', margin: 0, letterSpacing: '0.5px' }}>Compare Career Paths</h1>
              <p style={{ color: '#aaaaaa', fontSize: '14px', margin: '4px 0 0' }}>Side-by-side salary, skills, and growth rate metrics</p>
            </div>
          </div>
        </div>

        {/* Selectors */}
        <div className="card" style={{ marginBottom:'20px', padding:'24px 28px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 48px 1fr 140px', gap:'16px', alignItems:'flex-end' }}>
            <div>
              <p style={{ color:'#aaaaaa', fontSize:'12px', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.08em' }}>Career A</p>
              <select
                value={careerA}
                onChange={(e) => { setCareerA(e.target.value); setCompared(false); }}
                style={{ width:'100%', background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:'6px', padding:'10px 14px', color:'#cccccc', fontSize:'14px', outline:'none', cursor:'pointer' }}
              >
                {careerOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', paddingBottom:'2px' }}>
              <span style={{ color:'#ff9e42', fontSize:'20px', fontWeight:800 }}>VS</span>
            </div>

            <div>
              <p style={{ color:'#aaaaaa', fontSize:'12px', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.08em' }}>Career B</p>
              <select
                value={careerB}
                onChange={(e) => { setCareerB(e.target.value); setCompared(false); }}
                style={{ width:'100%', background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:'6px', padding:'10px 14px', color:'#cccccc', fontSize:'14px', outline:'none', cursor:'pointer' }}
              >
                {careerOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button
              className="btn-primary"
              style={{ fontSize:'14px', padding:'11px 24px', justifyContent:'center' }}
              onClick={() => setCompared(true)}
            >
              Compare →
            </button>
          </div>
        </div>

        {/* Results */}
        {compared && careerA !== careerB && (
          <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Overview Row */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'16px', alignItems:'center' }}>
              {/* Career A */}
              <div className="card" style={{ padding:'24px', textAlign:'center' }}>
                <h2 style={{ color:'#ff9e42', fontWeight:800, fontSize:'18px', marginBottom:'6px' }}>{careerA}</h2>
                <p style={{ color:'#aaaaaa', fontSize:'13px', marginBottom:'10px' }}>{dataA.industry}</p>
                <p style={{ color:'#cccccc', fontWeight:800, fontSize:'22px' }}>{dataA.salary}</p>
                <p style={{ color:'#ff9e42', fontSize:'13px', marginTop:'4px' }}>↑ {dataA.growth} growth</p>
              </div>

              {/* Overlap Gauge */}
              <div className="card" style={{ padding:'24px', textAlign:'center' }}>
                <OverlapGauge pct={overlapPct} />
              </div>

              {/* Career B */}
              <div className="card" style={{ padding:'24px', textAlign:'center' }}>
                <h2 style={{ color:'#ff9757', fontWeight:800, fontSize:'18px', marginBottom:'6px' }}>{careerB}</h2>
                <p style={{ color:'#aaaaaa', fontSize:'13px', marginBottom:'10px' }}>{dataB.industry}</p>
                <p style={{ color:'#cccccc', fontWeight:800, fontSize:'22px' }}>{dataB.salary}</p>
                <p style={{ color:'#ff9757', fontSize:'13px', marginTop:'4px' }}>↑ {dataB.growth} growth</p>
              </div>
            </div>

            {/* Salary Bar Chart */}
            <div className="card" style={{ padding:'24px 28px' }}>
              <span className="section-label">SALARY COMPARISON</span>
              <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <SalaryBar label={careerA} min={dataA.salaryMin} max={dataA.salaryMax} maxAll={maxSalary} />
                <SalaryBar label={careerB} min={dataB.salaryMin} max={dataB.salaryMax} maxAll={maxSalary} />
              </div>
              <p style={{ color:'#555', fontSize:'11px', marginTop:'10px' }}>Values in LPA (Lakhs Per Annum)</p>
            </div>

            {/* Metrics Table */}
            <div className="card" style={{ padding:'24px 28px' }}>
              <span className="section-label">DETAILED METRICS</span>
              <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderBottom:'1px solid #1f1f1f', paddingBottom:'10px', marginBottom:'4px' }}>
                  <span style={{ color:'#aaaaaa', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.08em' }}>Metric</span>
                  <span style={{ color:'#ff9e42', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.08em' }}>{careerA}</span>
                  <span style={{ color:'#ff9757', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.08em' }}>{careerB}</span>
                </div>
                {rows.map((row) => (
                  <div key={row.label} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', padding:'12px 0', borderBottom:'1px solid #111' }}>
                    <span style={{ color:'#aaaaaa', fontSize:'13px' }}>{row.label}</span>
                    <span style={{ color:'#cccccc', fontSize:'13px', fontWeight:600 }}>{row.a}</span>
                    <span style={{ color:'#cccccc', fontSize:'13px', fontWeight:600 }}>{row.b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Breakdown */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px' }}>
              {/* Common */}
              <div className="card" style={{ padding:'20px 22px' }}>
                <p style={{ color:'#50c878', fontSize:'11px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'12px' }}>
                  ✓ Shared Skills ({commonSkills.length})
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {commonSkills.map((s) => (
                    <span key={s} style={{ background:'rgba(80,200,120,0.1)', color:'#50c878', border:'1px solid rgba(80,200,120,0.25)', borderRadius:'999px', padding:'3px 10px', fontSize:'11px' }}>{s}</span>
                  ))}
                </div>
              </div>

              {/* Unique A */}
              <div className="card" style={{ padding:'20px 22px' }}>
                <p style={{ color:'#ff9e42', fontSize:'11px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'12px' }}>
                  Only in {careerA} ({uniqueA.length})
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {uniqueA.map((s) => (
                    <span key={s} style={{ background:'rgba(255,158,66,0.1)', color:'#ff9e42', border:'1px solid rgba(255,158,66,0.25)', borderRadius:'999px', padding:'3px 10px', fontSize:'11px' }}>{s}</span>
                  ))}
                </div>
              </div>

              {/* Unique B */}
              <div className="card" style={{ padding:'20px 22px' }}>
                <p style={{ color:'#ff9757', fontSize:'11px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'12px' }}>
                  Only in {careerB} ({uniqueB.length})
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {uniqueB.map((s) => (
                    <span key={s} style={{ background:'rgba(255,151,87,0.1)', color:'#ff9757', border:'1px solid rgba(255,151,87,0.25)', borderRadius:'999px', padding:'3px 10px', fontSize:'11px' }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {compared && careerA === careerB && (
          <div className="card" style={{ padding:'32px', textAlign:'center' }}>
            <p style={{ color:'#aaaaaa', fontSize:'15px' }}>Please select two <strong style={{ color:'#cccccc' }}>different</strong> careers to compare.</p>
          </div>
        )}

        {!compared && (
          <div className="card" style={{ padding:'48px', textAlign:'center' }}>
            <p style={{ color:'#555', fontSize:'36px', marginBottom:'12px' }}>⊞</p>
            <p style={{ color:'#aaaaaa', fontSize:'15px' }}>Select two careers above and click <strong style={{ color:'#ff9e42' }}>Compare →</strong> to see results.</p>
          </div>
        )}

      </main>
    </div>
  );
}
