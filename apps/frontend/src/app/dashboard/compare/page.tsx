'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { isAuthenticated } from '@/lib/services/auth-service';

// ── Overlap Gauge ─────────────────────────────────────────────────────────────
function OverlapGauge({ pct }: { pct: number }) {
  const r = 44, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="var(--border-dark)" strokeWidth="10" />
        <circle cx="55" cy="55" r={r} fill="none" stroke="var(--accent)" strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 55 55)" />
        <text x="55" y="60" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="800" fontFamily="Outfit, sans-serif">
          {pct}%
        </text>
      </svg>
      <p style={{ color:'var(--text-secondary)', fontSize:'12px', fontWeight: 600 }}>Skill Overlap</p>
    </div>
  );
}

// ── Salary Bar ────────────────────────────────────────────────────────────────
function SalaryBar({ label, min, max, maxAll }: { label:string; min:number; max:number; maxAll:number }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px' }}>
        <span style={{ color:'#ffffff', fontWeight:600, fontFamily: 'Outfit, sans-serif' }}>{label}</span>
        <span style={{ color:'var(--accent)', fontWeight:700, fontFamily: 'Inter, sans-serif' }}>₹{min}L – ₹{max}L</span>
      </div>
      <div style={{ height:'8px', background:'var(--border-dark)', borderRadius:'4px', overflow:'hidden', position:'relative' }}>
        <div style={{
          position:'absolute', left:`${(min / maxAll) * 100}%`,
          width:`${((max - min) / maxAll) * 100}%`,
          height:'100%', background:'linear-gradient(90deg, #ffb066, var(--accent))',
          borderRadius:'4px',
        }} />
      </div>
    </div>
  );
}

import { getCategories } from '@/lib/services/career-service';
import { calculateComparisonMetrics } from '@/lib/services/compare-service';

const parseSalaryLPA = (salaryStr: string) => {
  if (!salaryStr) return { min: 6, max: 15 };
  const matches = salaryStr.match(/\d+/g);
  if (matches && matches.length >= 2) {
    return { min: parseInt(matches[0]), max: parseInt(matches[1]) };
  } else if (matches && matches.length === 1) {
    return { min: parseInt(matches[0]), max: Math.round(parseInt(matches[0]) * 1.5) };
  }
  return { min: 6, max: 15 };
};

const getIndustryForCareer = (careerName: string) => {
  const name = careerName.toLowerCase();
  if (name.includes('software') || name.includes('cloud') || name.includes('architect') || name.includes('engineer')) {
    if (name.includes('data')) return 'Data & AI';
    return 'Technology';
  }
  if (name.includes('data') || name.includes('scientist') || name.includes('ai') || name.includes('analyst')) {
    if (name.includes('cyber') || name.includes('security')) return 'Security';
    return 'Data & AI';
  }
  if (name.includes('design') || name.includes('ux') || name.includes('ui') || name.includes('designer')) return 'Design';
  if (name.includes('product') || name.includes('manager') || name.includes('business')) return 'Business';
  return 'Technology';
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const router = useRouter();
  const [careersList, setCareersList] = useState<any[]>([]);
  const [careerA, setCareerA] = useState('');
  const [careerB, setCareerB] = useState('');
  const [compared, setCompared] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Results State
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    async function loadCareers() {
      try {
        const data = await getCategories();
        const list = data.categories || [];
        setCareersList(list);
        if (list.length >= 2) {
          setCareerA(list[0].id);
          setCareerB(list[1].id);
        }
      } catch (err: any) {
        console.error('Failed to load career choices:', err);
      }
    }
    loadCareers();
  }, [router]);

  const handleCompare = async () => {
    if (!careerA || !careerB) return;
    setLoading(true);
    setError('');
    try {
      const data = await calculateComparisonMetrics(careerA, careerB);
      setMetrics(data);
      setCompared(true);
    } catch (err: any) {
      setError('Failed to compute comparison profiles. Please check database tables.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCareerAName = careersList.find(c => c.id === careerA)?.name || 'Career A';
  const selectedCareerBName = careersList.find(c => c.id === careerB)?.name || 'Career B';

  const career1Data = metrics?.career1 || {};
  const career2Data = metrics?.career2 || {};
  const commonSkills = metrics?.commonSkills || [];
  const uniqueA = metrics?.uniqueSkillsCareer1 || [];
  const uniqueB = metrics?.uniqueSkillsCareer2 || [];
  const overlapPct = metrics?.skillOverlap ?? 0;

  const salA = parseSalaryLPA(career1Data.salary);
  const salB = parseSalaryLPA(career2Data.salary);
  const maxSalary = Math.max(salA.max, salB.max, 45);

  const dataA = {
    industry: getIndustryForCareer(career1Data.title || selectedCareerAName),
    salary: career1Data.salary || '₹6L – ₹15L',
    growth: career1Data.growth || '20%',
    salaryMin: salA.min,
    salaryMax: salA.max
  };
  const dataB = {
    industry: getIndustryForCareer(career2Data.title || selectedCareerBName),
    salary: career2Data.salary || '₹6L – ₹15L',
    growth: career2Data.growth || '20%',
    salaryMin: salB.min,
    salaryMax: salB.max
  };

  const rows = [
    { label:'Education standard',  a: career1Data.education || 'Bachelor\'s Degree', b: career2Data.education || 'Bachelor\'s Degree' },
    { label:'Work Environment',    a: career1Data.environment || 'Hybrid/Office',    b: career2Data.environment || 'Hybrid/Office' },
    { label:'Growth Rate',         a: career1Data.growth || '25%',                  b: career2Data.growth || '25%' },
    { label:'Demand outlook',      a: career1Data.demand || 'High',                  b: career2Data.demand || 'High' },
    { label:'Growth prospect',     a: career1Data.outlook || 'Favorable',             b: career2Data.outlook || 'Favorable' },
  ];

  return (
    <div style={{ background:'#0a0a0a', minHeight:'100vh' }}>
      <DashboardNavbar />
      <main className="page-container animate-slide-up" style={{ padding:'24px 0' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBottom: '20px', borderBottom: '1px solid rgba(255, 158, 66, 0.15)', marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div>
              <span className="section-label" style={{ display: 'block', marginBottom: '2px' }}>CAREER COMPARISON</span>
              <h1 style={{ color: '#ffffff', fontWeight: 700, fontSize: '24px', margin: 0, letterSpacing: '0.5px', fontFamily: 'Outfit, sans-serif' }}>Compare Career Paths</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>Side-by-side salary, skills, and growth rate metrics</p>
            </div>
          </div>
        </div>

        {/* Selectors */}
        <div className="card" style={{ marginBottom:'20px', padding:'24px 28px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px', alignItems:'flex-end' }}>
            <div>
              <p style={{ color:'var(--text-secondary)', fontSize:'12px', marginBottom:'8px', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Career A</p>
              <select
                value={careerA}
                onChange={(e) => { setCareerA(e.target.value); setCompared(false); }}
                className="input-field"
                style={{ cursor:'pointer', padding: '10px 14px' }}
              >
                {careersList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', paddingBottom:'10px', height: '42px' }}>
              <span style={{ color:'var(--accent)', fontSize:'20px', fontWeight:800, fontFamily: 'Outfit, sans-serif' }}>VS</span>
            </div>

            <div>
              <p style={{ color:'var(--text-secondary)', fontSize:'12px', marginBottom:'8px', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Career B</p>
              <select
                value={careerB}
                onChange={(e) => { setCareerB(e.target.value); setCompared(false); }}
                className="input-field"
                style={{ cursor:'pointer', padding: '10px 14px' }}
              >
                {careersList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <button
              className="btn-primary"
              disabled={loading || !careerA || !careerB}
              style={{ fontSize:'14px', height: '42px', padding:'0 24px', justifyContent:'center', cursor: loading ? 'not-allowed' : 'pointer' }}
              onClick={handleCompare}
            >
              {loading ? 'Comparing...' : 'Compare →'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '20px', background: 'rgba(239,68,68,0.06)', border: '1px solid #ef4444', color: '#ef4444', marginBottom: '20px', textAlign: 'center', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        {loading && (
          <div className="card" style={{ padding: '48px', textAlign: 'center', opacity: 0.8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="spinner" />
          </div>
        )}

        {/* Results */}
        {compared && careerA !== careerB && (
          <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

            {/* Overview Row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'16px', alignItems:'center' }}>
              {/* Career A */}
              <div className="card" style={{ padding:'24px', textAlign:'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <h2 style={{ color:'var(--accent)', fontWeight:800, fontSize:'18px', marginBottom:'6px', fontFamily: 'Outfit, sans-serif' }}>{selectedCareerAName}</h2>
                <p style={{ color:'var(--text-secondary)', fontSize:'13px', marginBottom:'12px' }}>{dataA.industry}</p>
                <p style={{ color:'#ffffff', fontWeight:800, fontSize:'24px', fontFamily: 'Inter, sans-serif' }}>{dataA.salary}</p>
                <p style={{ color:'var(--accent)', fontSize:'13px', marginTop:'6px', fontWeight: 600 }}>↑ {dataA.growth} growth</p>
              </div>

              {/* Overlap Gauge */}
              <div className="card" style={{ padding:'24px', textAlign:'center', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <OverlapGauge pct={overlapPct} />
              </div>

              {/* Career B */}
              <div className="card" style={{ padding:'24px', textAlign:'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <h2 style={{ color:'#ffb066', fontWeight:800, fontSize:'18px', marginBottom:'6px', fontFamily: 'Outfit, sans-serif' }}>{selectedCareerBName}</h2>
                <p style={{ color:'var(--text-secondary)', fontSize:'13px', marginBottom:'12px' }}>{dataB.industry}</p>
                <p style={{ color:'#ffffff', fontWeight:800, fontSize:'24px', fontFamily: 'Inter, sans-serif' }}>{dataB.salary}</p>
                <p style={{ color:'#ffb066', fontSize:'13px', marginTop:'6px', fontWeight: 600 }}>↑ {dataB.growth} growth</p>
              </div>
            </div>

            {/* Salary Bar Chart */}
            <div className="card" style={{ padding:'24px 28px' }}>
              <span className="section-label">SALARY COMPARISON</span>
              <div style={{ display:'flex', flexDirection:'column', gap:'16px', marginTop: '4px' }}>
                <SalaryBar label={selectedCareerAName} min={dataA.salaryMin} max={dataA.salaryMax} maxAll={maxSalary} />
                <SalaryBar label={selectedCareerBName} min={dataB.salaryMin} max={dataB.salaryMax} maxAll={maxSalary} />
              </div>
              <p style={{ color:'var(--text-muted)', fontSize:'11px', marginTop:'12px', fontWeight: 500 }}>Values in LPA (Lakhs Per Annum)</p>
            </div>

            {/* Metrics Table */}
            <div className="card" style={{ padding:'24px 28px' }}>
              <span className="section-label">DETAILED METRICS</span>
              <div style={{ display:'flex', flexDirection:'column', gap:'0', marginTop: '8px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderBottom:'1px solid var(--border-dark)', paddingBottom:'12px', marginBottom:'6px' }}>
                  <span style={{ color:'var(--text-muted)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight: 700 }}>Metric</span>
                  <span style={{ color:'var(--accent)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight: 700 }}>{selectedCareerAName}</span>
                  <span style={{ color:'#ffb066', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight: 700 }}>{selectedCareerBName}</span>
                </div>
                {rows.map((row, index) => (
                  <div key={row.label} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', padding:'12px 0', borderBottom: index === rows.length - 1 ? 'none' : '1px solid var(--border-dark)' }}>
                    <span style={{ color:'var(--text-secondary)', fontSize:'13px', fontWeight: 500 }}>{row.label}</span>
                    <span style={{ color:'#ffffff', fontSize:'13px', fontWeight:600 }}>{row.a}</span>
                    <span style={{ color:'#ffffff', fontSize:'13px', fontWeight:600 }}>{row.b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Breakdown */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'16px' }}>
              {/* Common */}
              <div className="card" style={{ padding:'20px 22px' }}>
                <p style={{ color:'#50c878', fontSize:'11px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'14px' }}>
                  ✓ Shared Skills ({commonSkills.length})
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                  {commonSkills.length > 0 ? (
                    commonSkills.map((s: string) => (
                      <span key={s} className="skill-pill" style={{ color: '#50c878', borderColor: 'rgba(80,200,120,0.2)', background: 'rgba(80,200,120,0.04)' }}>{s}</span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>None</span>
                  )}
                </div>
              </div>

              {/* Unique A */}
              <div className="card" style={{ padding:'20px 22px' }}>
                <p style={{ color:'var(--accent)', fontSize:'11px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'14px' }}>
                  Only in {selectedCareerAName} ({uniqueA.length})
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                  {uniqueA.length > 0 ? (
                    uniqueA.map((s: string) => (
                      <span key={s} className="skill-pill">{s}</span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>None</span>
                  )}
                </div>
              </div>

              {/* Unique B */}
              <div className="card" style={{ padding:'20px 22px' }}>
                <p style={{ color:'#ffb066', fontSize:'11px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'14px' }}>
                  Only in {selectedCareerBName} ({uniqueB.length})
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                  {uniqueB.length > 0 ? (
                    uniqueB.map((s: string) => (
                      <span key={s} className="skill-pill" style={{ color: '#ffb066', borderColor: 'rgba(255,176,102,0.2)', background: 'rgba(255,176,102,0.04)' }}>{s}</span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>None</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {compared && careerA === careerB && (
          <div className="card" style={{ padding:'32px', textAlign:'center' }}>
            <p style={{ color:'var(--text-secondary)', fontSize:'15px' }}>Please select two <strong style={{ color:'#ffffff' }}>different</strong> careers to compare.</p>
          </div>
        )}

        {!compared && (
          <div className="card" style={{ padding:'48px 24px', textAlign:'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color:'var(--accent)', fontSize:'40px', marginBottom:'12px', textShadow: '0 0 10px var(--accent-glow)' }}>⊞</p>
            <p style={{ color:'var(--text-secondary)', fontSize:'15px' }}>Select two careers above and click <strong style={{ color:'var(--accent)' }}>Compare →</strong> to see results.</p>
          </div>
        )}

      </main>
    </div>
  );
}
