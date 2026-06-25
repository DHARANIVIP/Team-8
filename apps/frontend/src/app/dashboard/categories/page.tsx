'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { isAuthenticated } from '@/lib/services/auth-service';


import { getCategories } from '@/lib/services/career-service';

const industries = ['All', 'Technology', 'Design', 'Business', 'Security', 'Data & AI'];

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

export default function CategoriesPage() {
  const router = useRouter();
  const [careersList, setCareersList] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    async function loadData() {
      try {
        const data = await getCategories();
        setCareersList(data.categories || []);
      } catch (err: any) {
        setError('Failed to load career categories. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const filteredCareers = careersList.filter((c) => {
    if (activeFilter === 'All') return true;
    return getIndustryForCareer(c.name) === activeFilter;
  });

  return (
    <div style={{ background:'#0d0d0d', minHeight:'100vh' }}>
      <DashboardNavbar />
      <main style={{ maxWidth:'1100px', margin:'0 auto', padding:'24px 40px' }}>
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyBetween: 'space-between',
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
            <button
              key={ind}
              onClick={() => setActiveFilter(ind)}
              className={ind === activeFilter ? 'btn-primary' : 'btn-ghost'}
              style={{ fontSize:'12px', padding:'6px 16px' }}
            >
              {ind}
            </button>
          ))}
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="card" style={{ height: '240px', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#666', fontSize: '14px' }}>Loading specifications...</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ padding: '24px', background: 'rgba(239,68,68,0.06)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Career Cards Grid */}
        {!loading && !error && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px' }}>
            {filteredCareers.map((c) => {
              const industry = getIndustryForCareer(c.name);
              const roadmap = c.education_requirement 
                ? [c.education_requirement, c.work_environment || 'Entry-level details', c.future_outlook || 'Outlook details']
                : ['CS Degree or Bootcamp', 'Junior Level Role', 'Senior Technical Lead'];

              return (
                <div key={c.id || c.name} className="card card-hover" style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <h3 style={{ color:'#cccccc', fontWeight:700, fontSize:'15px', marginBottom:'4px' }}>
                        {c.icon || '💼'} {c.name}
                      </h3>
                      <span className="badge badge-muted" style={{ fontSize:'11px' }}>{industry}</span>
                    </div>
                    <span style={{ color:'#ff9e42', fontWeight:700, fontSize:'12px', whiteSpace:'nowrap' }}>↑ {c.growth_rate || '25%'}</span>
                  </div>

                  <div>
                    <p style={{ color:'#aaaaaa', fontSize:'13px', lineHeight: 1.5, minHeight: '60px' }}>{c.description}</p>
                  </div>

                  {c.top_companies && (
                    <div>
                      <p style={{ color:'#aaaaaa', fontSize:'11px', marginBottom:'4px' }}>TOP EMPLOYERS</p>
                      <p style={{ color:'#cccccc', fontSize:'12px' }}>{c.top_companies}</p>
                    </div>
                  )}

                  <div>
                    <p style={{ color:'#aaaaaa', fontSize:'11px', marginBottom:'6px' }}>ROADMAP SPECIFICATION</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                      {roadmap.map((step, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'8px' }}>
                          <span style={{ width:'18px', height:'18px', borderRadius:'50%', background: i === 0 ? '#ff9e42' : '#2a2a2a', border: i === 0 ? 'none' : '1px solid #333', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', color: i === 0 ? '#000' : '#666', flexShrink:0, marginTop: '2px' }}>{i + 1}</span>
                          <span style={{ color: i === 0 ? '#cccccc' : '#aaaaaa', fontSize:'12px', lineHeight: 1.4 }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ paddingTop:'12px', borderTop:'1px solid #1f1f1f', display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 'auto' }}>
                    <span style={{ color:'#ff9e42', fontWeight:700, fontSize:'13px' }}>{c.salary_range || '₹8L – ₹22L'}</span>
                    <Link href="/dashboard/compare" className="btn-outline" style={{ fontSize:'11px', padding:'5px 12px' }}>Compare →</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
