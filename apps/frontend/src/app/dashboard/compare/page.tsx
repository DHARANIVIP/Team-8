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
                {careersList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                {careersList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <button
              className="btn-primary"
              disabled={loading || !careerA || !careerB}
              style={{ fontSize:'14px', padding:'11px 24px', justifyContent:'center', cursor: loading ? 'not-allowed' : 'pointer' }}
              onClick={handleCompare}
            >
              {loading ? 'Comparing...' : 'Compare →'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '20px', background: 'rgba(239,68,68,0.06)', border: '1px solid #ef4444', color: '#ef4444', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {loading && (
          <div className="card" style={{ padding: '48px', textAlign: 'center', opacity: 0.7 }}>
            <p style={{ color: '#ff9e42', fontSize: '15px', fontWeight: 600 }}>Syncing and analyzing O*NET career metrics in the background...</p>
          </div>
        )}

        {/* Results */}
        {compared && careerA !== careerB && (
          <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Overview Row */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'16px', alignItems:'center' }}>
              {/* Career A */}
              <div className="card" style={{ padding:'24px', textAlign:'center' }}>
                <h2 style={{ color:'#ff9e42', fontWeight:800, fontSize:'18px', marginBottom:'6px' }}>{selectedCareerAName}</h2>
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
                <h2 style={{ color:'#ff9757', fontWeight:800, fontSize:'18px', marginBottom:'6px' }}>{selectedCareerBName}</h2>
                <p style={{ color:'#aaaaaa', fontSize:'13px', marginBottom:'10px' }}>{dataB.industry}</p>
                <p style={{ color:'#cccccc', fontWeight:800, fontSize:'22px' }}>{dataB.salary}</p>
                <p style={{ color:'#ff9757', fontSize:'13px', marginTop:'4px' }}>↑ {dataB.growth} growth</p>
              </div>
            </div>

            {/* Salary Bar Chart */}
            <div className="card" style={{ padding:'24px 28px' }}>
              <span className="section-label">SALARY COMPARISON</span>
              <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <SalaryBar label={selectedCareerAName} min={dataA.salaryMin} max={dataA.salaryMax} maxAll={maxSalary} />
                <SalaryBar label={selectedCareerBName} min={dataB.salaryMin} max={dataB.salaryMax} maxAll={maxSalary} />
              </div>
              <p style={{ color:'#555', fontSize:'11px', marginTop:'10px' }}>Values in LPA (Lakhs Per Annum)</p>
            </div>

            {/* Metrics Table */}
            <div className="card" style={{ padding:'24px 28px' }}>
              <span className="section-label">DETAILED METRICS</span>
              <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderBottom:'1px solid #1f1f1f', paddingBottom:'10px', marginBottom:'4px' }}>
                  <span style={{ color:'#aaaaaa', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.08em' }}>Metric</span>
                  <span style={{ color:'#ff9e42', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.08em' }}>{selectedCareerAName}</span>
                  <span style={{ color:'#ff9757', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.08em' }}>{selectedCareerBName}</span>
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
                  Only in {selectedCareerAName} ({uniqueA.length})
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
                  Only in {selectedCareerBName} ({uniqueB.length})
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
