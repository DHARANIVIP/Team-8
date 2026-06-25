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
  Advanced: '#e55',
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

        {/* Loading and Error States */}
        {loading && (
          <div style={{ padding: '48px', textAlign: 'center', opacity: 0.7 }} className="card">
            <p style={{ color: '#ff9e42', fontSize: '15px', fontWeight: 600 }}>Syncing course suggestions from O*NET and Google Gemini AI in the background...</p>
          </div>
        )}

        {error && (
          <div style={{ padding: '24px', background: 'rgba(239,68,68,0.06)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '14px', textAlign: 'center', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Recommended */}
        {!loading && !error && filteredRecommended.length > 0 && (
          <section style={{ marginBottom:'24px' }}>
            <span className="section-label">⭐ RECOMMENDED FOR YOU</span>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'14px' }}>
              {filteredRecommended.map((c, index) => (
                <div key={c.id || c.title || index} className="card card-hover" style={{ padding:'20px 22px', borderLeft:`3px solid ${diffColor[c.difficulty] || '#ff9e42'}`, display:'flex', flexDirection:'column', gap:'10px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <h3 style={{ color:'#cccccc', fontWeight:700, fontSize:'14px', flex:1, marginRight:'10px' }}>{c.title}</h3>
                    <span className="badge badge-accent" style={{ whiteSpace:'nowrap', fontSize:'10px' }}>{c.skillName || 'Missing Skill'}</span>
                  </div>
                  <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                    <span className="badge badge-muted">{c.provider}</span>
                    <span className="badge" style={{ background:`${diffColor[c.difficulty]}20`, color:diffColor[c.difficulty], border:`1px solid ${diffColor[c.difficulty]}40`, fontSize:'10px' }}>{c.difficulty}</span>
                    <span style={{ color:'#aaaaaa', fontSize:'12px' }}>{c.duration_weeks || c.weeks || 6}w</span>
                    {c.rating && <span style={{ color:'#ff9e42', fontSize:'12px' }}>★ {c.rating}</span>}
                  </div>
                  <a href={c.url || '#'} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize:'12px', padding:'7px 14px', alignSelf:'flex-start' }}>Start Course →</a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Courses */}
        {!loading && !error && (
          <section>
            <span className="section-label">ALL AVAILABLE COURSES ({filteredAll.length})</span>
            {filteredAll.length === 0 ? (
              <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                No courses found matching selected filters.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {filteredAll.map((c, index) => (
                  <div key={c.id || c.title || index} className="card card-hover" style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderLeft:`3px solid ${diffColor[c.difficulty] || '#aaaaaa'}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
                      <div>
                        <p style={{ color:'#cccccc', fontWeight:600, fontSize:'14px' }}>{c.title}</p>
                        <div style={{ display:'flex', gap:'6px', marginTop:'4px' }}>
                          <span className="badge badge-muted" style={{ fontSize:'10px' }}>{c.provider}</span>
                          <span className="badge badge-muted" style={{ fontSize:'10px' }}>{c.skillName || 'General'}</span>
                          {c.rating && <span className="badge badge-muted" style={{ fontSize:'10px', color: '#ff9e42' }}>★ {c.rating}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <span className="badge" style={{ background:`${diffColor[c.difficulty]}20`, color:diffColor[c.difficulty], border:`1px solid ${diffColor[c.difficulty]}40`, fontSize:'10px' }}>{c.difficulty}</span>
                      <span style={{ color:'#aaaaaa', fontSize:'12px', whiteSpace:'nowrap' }}>{c.duration_weeks || c.weeks || 6} weeks</span>
                      <a href={c.url || '#'} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ fontSize:'11px', padding:'5px 12px' }}>View →</a>
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
