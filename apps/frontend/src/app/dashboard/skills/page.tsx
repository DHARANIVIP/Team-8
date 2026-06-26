'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { isAuthenticated } from '@/lib/services/auth-service';
import { getProfile } from '@/lib/services/profile-service';
import { getCategories } from '@/lib/services/career-service';
import { getSkillsByCareer } from '@/lib/services/skill-service';

function levelColor(l: number, acquired: boolean) {
  if (acquired) return '#50c878'; // Green for acquired
  if (l >= 80) return '#ff9e42'; // Amber for high importance gap
  return '#ffb066'; // Orange/gold for medium importance gap
}

export default function SkillsPage() {
  const router = useRouter();
  const [careersList, setCareersList] = useState<any[]>([]);
  const [selectedCareerId, setSelectedCareerId] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    async function loadInitialData() {
      try {
        setLoading(true);
        setError('');

        const profile = await getProfile();
        setUserProfile(profile);

        const categoriesResponse = await getCategories();
        const list = categoriesResponse.categories || [];
        setCareersList(list);

        if (list.length > 0) {
          // Default to profile's target career
          const matched = list.find((c: any) => c.name.toLowerCase() === (profile.target_career || '').toLowerCase());
          if (matched) {
            setSelectedCareerId(matched.id);
          } else {
            setSelectedCareerId(list[0].id);
          }
        }
      } catch (err: any) {
        console.error('Failed to load skills matrix base data:', err);
        setError('Failed to retrieve user profile and career choices.');
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [router]);

  // Fetch skills when selected career changes
  useEffect(() => {
    if (!selectedCareerId) return;

    async function fetchCareerSkills() {
      try {
        setSkillsLoading(true);
        const fetchedSkills = await getSkillsByCareer(selectedCareerId);
        setSkills(fetchedSkills || []);
      } catch (err) {
        console.error('Failed to load career skills:', err);
      } finally {
        setSkillsLoading(false);
      }
    }

    fetchCareerSkills();
  }, [selectedCareerId]);

  const selectedCareerName = careersList.find(c => c.id === selectedCareerId)?.name || '';

  // Process skills to calculate match status and required importance
  const processedSkills = skills.map((s) => {
    const userSkills = userProfile?.current_skills || [];
    const hasSkill = userSkills.some((us: string) => us.toLowerCase() === s.name.toLowerCase());
    
    // Map O*NET difficulty level to importance percentages
    let importance = 70;
    if (s.difficulty_level === 'Hard') importance = 90;
    if (s.difficulty_level === 'Easy') importance = 50;

    return {
      id: s.id,
      name: s.name,
      category: s.category || 'Technical',
      importance,
      acquired: hasSkill
    };
  });

  const categories = ['All', ...Array.from(new Set(processedSkills.map((s) => s.category)))];
  const filtered = filter === 'All' ? processedSkills : processedSkills.filter((s) => s.category === filter);

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
              <span className="section-label" style={{ display: 'block', marginBottom: '2px' }}>SKILL MAPPING</span>
              <h1 style={{ color: '#ffffff', fontWeight: 700, fontSize: '24px', margin: 0, letterSpacing: '0.5px', fontFamily: 'Outfit, sans-serif' }}>Skill Proficiency Matrix</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>Select a career to see required skills and your gap areas</p>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: '24px', background: 'rgba(239,68,68,0.06)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '14px', textAlign: 'center', marginBottom: '20px', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', opacity: 0.8, display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="card">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Career Selector */}
            <div className="card" style={{ marginBottom:'20px', padding:'20px 24px' }}>
              <p style={{ color:'var(--text-secondary)', fontSize:'13px', marginBottom:'12px', fontWeight:600, letterSpacing: '0.02em' }}>SELECT TARGET CAREER</p>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {careersList.map((c) => (
                  <button key={c.id} onClick={() => { setSelectedCareerId(c.id); setFilter('All'); }}
                    className={selectedCareerId === c.id ? 'btn-primary' : 'btn-ghost'}
                    style={{ fontSize:'12px', padding:'6px 14px' }}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button key={cat} onClick={() => setFilter(cat)}
                  className={filter === cat ? 'btn-primary' : 'btn-ghost'}
                  style={{ fontSize:'12px', padding:'6px 14px' }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Skill Matrix */}
            <div className="card" style={{ padding:'28px' }}>
              <p style={{ color:'var(--text-secondary)', fontSize:'13px', marginBottom:'20px', fontWeight: 500 }}>
                Showing <span style={{ color:'var(--accent)', fontWeight:700 }}>{filtered.length}</span> skills for <span style={{ color:'#ffffff', fontWeight:600 }}>{selectedCareerName}</span>
              </p>
              
              {skillsLoading ? (
                <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div className="spinner" />
                </div>
              ) : filtered.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No skills associated with this category yet.</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  {filtered.map((s) => (
                    <div key={s.name}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap: 'wrap' }}>
                          <span style={{ color:'#ffffff', fontSize:'14px', fontWeight:600, fontFamily: 'Outfit, sans-serif' }}>{s.name}</span>
                          <span className="badge badge-muted" style={{ fontSize:'10px' }}>{s.category}</span>
                          {s.acquired ? (
                            <span className="badge" style={{ background: 'rgba(80,200,120,0.1)', color: '#50c878', border: '1px solid rgba(80,200,120,0.2)' }}>Acquired</span>
                          ) : (
                            <span className="badge badge-accent">Gap Area</span>
                          )}
                        </div>
                        <span style={{ color: levelColor(s.importance, s.acquired), fontWeight:700, fontSize:'13px', fontFamily: 'Inter, sans-serif' }}>
                          Importance: {s.importance}%
                        </span>
                      </div>
                      <div className="strength-bar">
                        <div style={{ height:'100%', width:`${s.importance}%`, background: levelColor(s.importance, s.acquired) }} className="strength-bar-fill" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop:'24px' }}>
              <Link href="/dashboard/courses" className="btn-primary" style={{ fontSize:'13px', padding: '10px 22px' }}>
                Find Courses for These Skills →
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
