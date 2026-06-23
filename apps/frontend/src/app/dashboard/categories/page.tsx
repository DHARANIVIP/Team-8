'use client';

import Link from 'next/link';
import DashboardNavbar from '@/components/DashboardNavbar';


const industries = ['All', 'Technology', 'Design', 'Business', 'Security', 'Data & AI'];

const careers = [
  { name:'Software Engineer',       industry:'Technology', salary:'₹8L – ₹25L',  growth:'28%', skills:['Python','JavaScript','AWS','Docker','Git'], roadmap:['CS Degree / Bootcamp','Junior Dev (0-2y)','Mid-Level Dev (2-5y)','Senior Engineer (5y+)','Tech Lead / Architect'] },
  { name:'Data Scientist',          industry:'Data & AI',  salary:'₹10L – ₹30L', growth:'36%', skills:['Python','ML','SQL','TensorFlow','Statistics'], roadmap:['Math/Stats Background','Junior Analyst','Data Scientist','Senior Data Scientist','ML Engineer / Head of Data'] },
  { name:'UX Designer',             industry:'Design',     salary:'₹6L – ₹18L',  growth:'22%', skills:['Figma','Prototyping','User Research','CSS'], roadmap:['Design Fundamentals','Junior UX','Mid UX Designer','Senior UX','Design Lead / Director'] },
  { name:'Cybersecurity Analyst',   industry:'Security',   salary:'₹7L – ₹22L',  growth:'33%', skills:['Networking','SIEM','Pen Testing','SOC'], roadmap:['IT/Network Basics','SOC Analyst','Security Analyst','Senior Analyst','CISO / Security Architect'] },
  { name:'Product Manager',         industry:'Business',   salary:'₹12L – ₹35L', growth:'25%', skills:['Roadmapping','Agile','SQL','Communication'], roadmap:['Domain Expertise','Associate PM','Product Manager','Senior PM','VP Product / CPO'] },
  { name:'Cloud Architect',         industry:'Technology', salary:'₹15L – ₹40L', growth:'31%', skills:['AWS','Azure','Kubernetes','Terraform','Networking'], roadmap:['Cloud Fundamentals','Cloud Admin','Cloud Engineer','Solutions Architect','Cloud Architect'] },
];

export default function CategoriesPage() {
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
              <span className="section-label" style={{ display: 'block', marginBottom: '4px' }}>CAREER CATEGORIES</span>
              <h1 style={{ color: '#ffffff', fontWeight: 700, fontSize: '24px', margin: 0, letterSpacing: '0.5px' }}>Explore Career Paths</h1>
              <p style={{ color: '#aaaaaa', fontSize: '14px', margin: '4px 0 0' }}>Browse industry roadmaps and skill requirements for every career</p>
            </div>
          </div>
        </div>

        {/* Industry Filter */}
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'24px' }}>
          {industries.map((ind) => (
            <button key={ind} className={ind === 'All' ? 'btn-primary' : 'btn-ghost'} style={{ fontSize:'12px', padding:'6px 16px' }}>
              {ind}
            </button>
          ))}
        </div>

        {/* Career Cards Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px' }}>
          {careers.map((c) => (
            <div key={c.name} className="card card-hover" style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <h3 style={{ color:'#cccccc', fontWeight:700, fontSize:'15px', marginBottom:'4px' }}>{c.name}</h3>
                  <span className="badge badge-muted" style={{ fontSize:'11px' }}>{c.industry}</span>
                </div>
                <span style={{ color:'#ff9e42', fontWeight:700, fontSize:'12px', whiteSpace:'nowrap' }}>↑ {c.growth}</span>
              </div>

              <div>
                <p style={{ color:'#aaaaaa', fontSize:'11px', marginBottom:'6px' }}>KEY SKILLS</p>
                <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                  {c.skills.map((s) => <span key={s} className="badge badge-muted" style={{ fontSize:'11px' }}>{s}</span>)}
                </div>
              </div>

              <div>
                <p style={{ color:'#aaaaaa', fontSize:'11px', marginBottom:'6px' }}>ROADMAP</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  {c.roadmap.map((step, i) => (
                    <div key={step} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ width:'18px', height:'18px', borderRadius:'50%', background: i === 0 ? '#ff9e42' : '#2a2a2a', border: i === 0 ? 'none' : '1px solid #333', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', color: i === 0 ? '#000' : '#666', flexShrink:0 }}>{i + 1}</span>
                      <span style={{ color: i === 0 ? '#cccccc' : '#aaaaaa', fontSize:'12px' }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ paddingTop:'6px', borderTop:'1px solid #1f1f1f', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'#ff9e42', fontWeight:700, fontSize:'13px' }}>{c.salary}</span>
                <Link href="/dashboard/compare" className="btn-outline" style={{ fontSize:'11px', padding:'5px 12px' }}>Compare →</Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
