'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { isAuthenticated } from '@/lib/services/auth-service';
import { getProfile } from '@/lib/services/profile-service';
import { getCategories } from '@/lib/services/career-service';
import { getSkillsByCareer } from '@/lib/services/skill-service';
import { getCourses, getRecommendedCourses } from '@/lib/services/course-service';

const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const providers = ['All', 'Coursera', 'Udemy', 'edX', 'YouTube', 'Official Docs'];

const diffColor: Record<string, string> = {
  Beginner: '#50c878',
  Intermediate: '#ff9e42',
  Advanced: '#ef4444',
};

export default function CoursesPage() {
  const router = useRouter();
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [recommendedList, setRecommendedList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [diffFilter, setDiffFilter] = useState('All');
  const [provFilter, setProvFilter] = useState('All');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    async function loadCoursesData() {
      try {
        setLoading(true);
        setError('');

        // 1. Fetch profile to find user's current skills and target career
        const profile = await getProfile();
        const userSkills = profile.current_skills || [];
        const targetCareerName = profile.target_career || 'Software Engineer';

        // 2. Fetch categories to find matching career ID
        const categoriesData = await getCategories();
        const categories = categoriesData.categories || [];
        const targetCareer = categories.find((c: any) => c.name.toLowerCase() === targetCareerName.toLowerCase());

        let missingSkillIds: string[] = [];
        let skillIdToName: Record<string, string> = {};

        if (targetCareer) {
          // 3. Fetch skills for target career
          const skills = await getSkillsByCareer(targetCareer.id);
          skillIdToName = skills.reduce((acc: any, s: any) => {
            acc[s.id] = s.name;
            return acc;
          }, {});

          // Determine gaps (skills not in user's current_skills)
          const missingSkills = skills.filter((s: any) => {
            const hasSkill = userSkills.some((us: string) => us.toLowerCase() === s.name.toLowerCase());
            return !hasSkill;
          });
          missingSkillIds = missingSkills.map((s: any) => s.id);
        }

        // 4. Fetch recommended courses if there are missing skills
        let recommended: any[] = [];
        if (missingSkillIds.length > 0) {
          const recResponse = await getRecommendedCourses(missingSkillIds);
          recommended = recResponse.courses || [];
        }

        // 5. Fetch all courses
        const allCourses = await getCourses();

        // Standardize skill names in courses if needed
        const mappedRecommended = recommended.map((c: any) => ({
          ...c,
          skillName: skillIdToName[c.skill_id] || c.skill || 'Recommended Skill',
          recommended: true
        }));

        // Filter out recommended courses from "all courses" to avoid duplicates
        const mappedAll = allCourses
          .filter((c: any) => !recommended.some((r: any) => r.id === c.id || r.title === c.title))
          .map((c: any) => ({
            ...c,
            skillName: c.skill || 'General'
          }));

        setRecommendedList(mappedRecommended);
        setCoursesList(mappedAll);
      } catch (err: any) {
        console.error('Failed to load courses:', err);
        setError('Failed to retrieve course recommendations. Please verify database tables.');
      } finally {
        setLoading(false);
      }
    }

    loadCoursesData();
  }, [router]);

  const filteredRecommended = recommendedList.filter((c) =>
    (diffFilter === 'All' || c.difficulty === diffFilter) &&
    (provFilter === 'All' || c.provider === provFilter)
  );

  const filteredAll = coursesList.filter((c) =>
    (diffFilter === 'All' || c.difficulty === diffFilter) &&
    (provFilter === 'All' || c.provider === provFilter)
  );

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
              <span className="section-label" style={{ display: 'block', marginBottom: '2px' }}>COURSE SUGGESTIONS</span>
              <h1 style={{ color: '#ffffff', fontWeight: 700, fontSize: '24px', margin: 0, letterSpacing: '0.5px', fontFamily: 'Outfit, sans-serif' }}>Find Your Next Course</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>Curated courses filtered by skill, difficulty, and provider</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom:'20px', padding:'20px 24px', display:'flex', gap:'24px', flexWrap: 'wrap', alignItems:'flex-start' }}>
          <div>
            <p style={{ color:'var(--text-muted)', fontSize:'10px', fontWeight: 700, marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.08em' }}>Difficulty</p>
            <div style={{ display:'flex', gap:'6px', flexWrap: 'wrap' }}>
              {difficulties.map((d) => (
                <button key={d} onClick={() => setDiffFilter(d)} className={diffFilter === d ? 'btn-primary' : 'btn-ghost'} style={{ fontSize:'12px', padding:'5px 12px' }}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ color:'var(--text-muted)', fontSize:'10px', fontWeight: 700, marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.08em' }}>Provider</p>
            <div style={{ display:'flex', gap:'6px', flexWrap: 'wrap' }}>
              {providers.map((p) => (
                <button key={p} onClick={() => setProvFilter(p)} className={provFilter === p ? 'btn-primary' : 'btn-ghost'} style={{ fontSize:'12px', padding:'5px 12px' }}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div style={{ padding: '48px', textAlign: 'center', opacity: 0.8, display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="card">
            <div className="spinner" />
          </div>
        )}

        {error && (
          <div style={{ padding: '24px', background: 'rgba(239,68,68,0.06)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '14px', textAlign: 'center', marginBottom: '20px', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        {/* Recommended */}
        {!loading && !error && filteredRecommended.length > 0 && (
          <section style={{ marginBottom:'28px' }}>
            <span className="section-label" style={{ display: 'block', marginBottom: '14px' }}>⭐ RECOMMENDED FOR YOU</span>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:'16px' }}>
              {filteredRecommended.map((c, index) => (
                <div key={c.id || c.title || index} className="card card-hover" style={{ padding:'20px 22px', borderLeft:`3px solid ${diffColor[c.difficulty] || 'var(--accent)'}`, display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: '10px' }}>
                    <h3 style={{ color:'#ffffff', fontWeight:700, fontSize:'14px', flex:1, margin: 0, fontFamily: 'Outfit, sans-serif', lineHeight: 1.4 }}>{c.title}</h3>
                    <span className="badge badge-accent" style={{ whiteSpace:'nowrap', fontSize:'10px' }}>{c.skillName || 'Missing Skill'}</span>
                  </div>
                  <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap: 'wrap' }}>
                    <span className="badge badge-muted">{c.provider}</span>
                    <span className="badge" style={{ background:`${diffColor[c.difficulty]}18`, color:diffColor[c.difficulty], border:`1px solid ${diffColor[c.difficulty]}35`, fontSize:'10px' }}>{c.difficulty}</span>
                    <span style={{ color:'var(--text-secondary)', fontSize:'12px', fontFamily: 'Inter, sans-serif' }}>{c.duration_weeks || c.weeks || 6}w</span>
                    {c.rating && <span style={{ color:'var(--accent)', fontSize:'12px', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>★ {c.rating}</span>}
                  </div>
                  <a href={c.url || '#'} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize:'12px', padding:'8px 16px', alignSelf:'flex-start', marginTop: '4px' }}>Start Course →</a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Courses */}
        {!loading && !error && (
          <section>
            <span className="section-label" style={{ display: 'block', marginBottom: '14px' }}>ALL AVAILABLE COURSES ({filteredAll.length})</span>
            {filteredAll.length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No courses found matching selected filters.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {filteredAll.map((c, index) => (
                  <div key={c.id || c.title || index} className="card card-hover" style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap: 'wrap', gap: '14px', borderLeft:`3px solid ${diffColor[c.difficulty] || 'var(--text-muted)'}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'16px', flex: 1, minWidth: '240px' }}>
                      <div>
                        <p style={{ color:'#ffffff', fontWeight:600, fontSize:'14px', fontFamily: 'Outfit, sans-serif' }}>{c.title}</p>
                        <div style={{ display:'flex', gap:'6px', marginTop:'6px', flexWrap: 'wrap' }}>
                          <span className="badge badge-muted" style={{ fontSize:'10px' }}>{c.provider}</span>
                          <span className="badge badge-muted" style={{ fontSize:'10px' }}>{c.skillName || 'General'}</span>
                          {c.rating && <span className="badge badge-muted" style={{ fontSize:'10px', color: 'var(--accent)' }}>★ {c.rating}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                      <span className="badge" style={{ background:`${diffColor[c.difficulty]}18`, color:diffColor[c.difficulty], border:`1px solid ${diffColor[c.difficulty]}35`, fontSize:'10px' }}>{c.difficulty}</span>
                      <span style={{ color:'var(--text-secondary)', fontSize:'12px', whiteSpace:'nowrap', fontFamily: 'Inter, sans-serif' }}>{c.duration_weeks || c.weeks || 6} weeks</span>
                      <a href={c.url || '#'} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ fontSize:'11px', padding:'6px 14px' }}>View →</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
