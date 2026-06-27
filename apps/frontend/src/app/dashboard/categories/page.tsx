'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { isAuthenticated } from '@/lib/services/auth-service';
import { getCategories, getPersonalizedCategories } from '@/lib/services/career-service';
import { getRecommendations } from '@/lib/services/onboarding-service';
import { getProfile } from '@/lib/services/profile-service';
import { DomainRadarChart, SkillGapPanel } from '@/features/categories';

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
  const [recommendations, setRecommendations] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
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
        setLoading(true);
        setError('');

        // 1. Try to fetch personalized categories
        try {
          const persData = await getPersonalizedCategories();
          if (persData && persData.categories && persData.categories.length > 0) {
            setCareersList(persData.categories);
          } else {
            const careersData = await getCategories();
            setCareersList(careersData.categories || []);
          }
        } catch (persErr) {
          console.warn('Personalized categories fetch failed, falling back to standard list:', persErr);
          const careersData = await getCategories();
          setCareersList(careersData.categories || []);
        }

        // 2. Fetch user profile
        try {
          const profile = await getProfile();
          setUserProfile(profile);
        } catch (profileErr) {
          console.warn('Failed to load user profile:', profileErr);
        }

        // 3. Fetch recommendations for the HUD panel
        try {
          const recData = await getRecommendations();
          setRecommendations(recData);
        } catch (recErr) {
          console.log('No onboarding recommendations found, proceeding without HUD personalization.');
        }
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

  // Helper to match skills from career details
  const getSkillMatchDetails = (career: any) => {
    // If pre-computed by backend, use them
    if (career.matchedSkills && career.gapSkills) {
      return { matched: career.matchedSkills, gaps: career.gapSkills };
    }

    const userSkills: string[] = userProfile?.current_skills || [];
    const skillsToUse = (career.skills && career.skills.length > 0) 
      ? career.skills 
      : [
          { name: 'Python' }, { name: 'SQL' }, { name: 'Machine Learning' }, 
          { name: 'Data Structures' }, { name: 'Algorithms' }
        ];

    const matched: string[] = [];
    const gaps: string[] = [];

    skillsToUse.forEach((s: any) => {
      const isMatch = userSkills.some(us => us.toLowerCase() === s.name.toLowerCase());
      if (isMatch) {
        matched.push(s.name);
      } else {
        gaps.push(s.name);
      }
    });

    return { matched, gaps };
  };

  // Find match score
  const getCareerMatchScore = (career: any) => {
    if (career.matchScore !== undefined && career.matchScore !== null) {
      return career.matchScore;
    }
    if (!recommendations || !recommendations.suggestedCareers) return null;
    const matched = recommendations.suggestedCareers.find((sc: any) => 
      sc.id === career.id || sc.name.toLowerCase() === career.name.toLowerCase()
    );
    return matched ? matched.matchScore : null;
  };

  // Find recommended courses
  const getCareerSuggestedCourses = (career: any) => {
    if (career.suggestedCourses && career.suggestedCourses.length > 0) {
      // Map format if returned by backend
      return career.suggestedCourses.map((course: any) => ({
        id: course.id,
        name: course.title || course.name,
        provider: course.provider
      }));
    }

    if (!recommendations || !recommendations.suggestedCourses) return [];
    const skillIds = (career.skills || []).map((s: any) => s.id);
    return recommendations.suggestedCourses.filter((course: any) => 
      skillIds.includes(course.skill_id)
    );
  };

  // Get sorted top recommended careers for HUD
  const topRecommendations = recommendations?.suggestedCareers 
    ? [...recommendations.suggestedCareers].sort((a: any, b: any) => b.matchScore - a.matchScore).slice(0, 3)
    : [];

  const topCareerMeta = topRecommendations[0];
  const topCareerObj = topCareerMeta
    ? careersList.find((c: any) => c.id === topCareerMeta.id || c.name.toLowerCase() === topCareerMeta.name.toLowerCase())
    : null;
  const topSkillMatch = topCareerObj ? getSkillMatchDetails(topCareerObj) : null;

  return (
    <div style={{ background:'#0a0a0a', minHeight:'100vh' }}>
      <DashboardNavbar />
      <main className="page-container animate-slide-up" style={{ padding:'24px 0', maxWidth: '1100px', margin: '0 auto' }}>
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBottom: '20px', borderBottom: '1px solid rgba(255, 158, 66, 0.15)', marginBottom: '24px'
        }}>
          <div>
            <span className="section-label" style={{ display: 'block', marginBottom: '2px' }}>CAREER CATEGORIES</span>
            <h1 style={{ color: '#ffffff', fontWeight: 700, fontSize: '24px', margin: 0, letterSpacing: '0.5px', fontFamily: 'Outfit, sans-serif' }}>Explore Career Paths</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>
              {recommendations 
                ? 'Your career matching dashboard, updated with AI recommendations from your resume' 
                : 'Browse industry roadmaps and skill requirements for every career'}
            </p>
          </div>
        </div>

        {/* ── AI Career Matcher HUD & Insights ── */}
        {recommendations && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            
            {/* Domain Strength Radar Map */}
            <DomainRadarChart domains={recommendations.matched_domains || []} />

            {/* Target Skill Gap Panel */}
            {topCareerObj && topSkillMatch && (
              <SkillGapPanel
                careerName={topCareerObj.name}
                matchedSkills={topSkillMatch.matched}
                gapSkills={topSkillMatch.gaps}
              />
            )}

            {/* HUD Matcher */}
            {topRecommendations.length > 0 && (
              <div className="card" style={{
                padding: '24px',
                background: 'rgba(18, 18, 18, 0.7)',
                border: '1px solid var(--accent)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>🤖</span>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', fontFamily: 'Outfit, sans-serif', margin: 0 }}>AI Career Matcher</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
                      Top career domain alignments from your resume:
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
                  {topRecommendations.map((career: any, index: number) => (
                    <div key={career.id} style={{
                      background: 'var(--surface-alt)',
                      border: '1px solid rgba(255, 158, 66, 0.1)',
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '13px' }}>{index + 1}. {career.name}</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '12px' }}>{career.matchScore}% Match</span>
                      </div>
                      <div style={{ background: 'rgba(255, 158, 66, 0.1)', height: '6px', border: '1px solid rgba(255, 158, 66, 0.15)', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--accent)', height: '100%', width: `${career.matchScore}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Advisor Insights (Certifications & Growth Suggestions) */}
            <div className="card" style={{
              padding: '24px',
              background: 'rgba(18, 18, 18, 0.7)',
              border: '1px solid var(--accent)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>💡</span>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', fontFamily: 'Outfit, sans-serif', margin: 0 }}>AI Development Insights</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
                    Personalized advice and targeted certifications:
                  </p>
                </div>
              </div>

              {recommendations.growth_suggestions && (
                <div>
                  <p style={{ color: 'var(--text-primary)', fontSize: '12px', lineHeight: '1.5', margin: 0, fontStyle: 'italic' }}>
                    "{recommendations.growth_suggestions}"
                  </p>
                </div>
              )}

              {recommendations.certifications && recommendations.certifications.length > 0 && (
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.05em' }}>RECOMMENDED CERTIFICATIONS</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {recommendations.certifications.map((cert: string) => (
                      <span key={cert} style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        background: 'rgba(255, 158, 66, 0.1)',
                        border: '1px solid rgba(255, 158, 66, 0.3)',
                        color: 'var(--accent)',
                        fontWeight: 600
                      }}>
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        )}

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="card" style={{ height: '240px', opacity: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading specifications...</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ padding: '24px', background: 'rgba(239,68,68,0.06)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '14px', textAlign: 'center', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        {/* Career Cards Grid */}
        {!loading && !error && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(340px, 1fr))', gap:'16px' }}>
            {filteredCareers.map((c) => {
              const industry = getIndustryForCareer(c.name);
              const matchScore = getCareerMatchScore(c);
              const { matched, gaps } = getSkillMatchDetails(c);
              const careerSuggestedCourses = getCareerSuggestedCourses(c);

              const roadmap = c.education_requirement 
                ? [c.education_requirement, c.work_environment || 'Entry-level details', c.future_outlook || 'Outlook details']
                : ['CS Degree or Bootcamp', 'Junior Level Role', 'Senior Technical Lead'];

              return (
                <div key={c.id || c.name} className="card card-hover" style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'16px' }}>
                  
                  {/* Title & Growth rate */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <h3 style={{ color:'#ffffff', fontWeight:700, fontSize:'16px', marginBottom:'4px', fontFamily: 'Outfit, sans-serif' }}>
                        {c.icon || '💼'} {c.name}
                      </h3>
                      <span className="badge badge-muted" style={{ fontSize:'11px' }}>{industry}</span>
                    </div>
                    <span style={{ color:'var(--accent)', fontWeight:700, fontSize:'12px', whiteSpace:'nowrap' }}>↑ {c.growth_rate || '25%'}</span>
                  </div>

                  {/* Compatibility Score progress bar if recommendations loaded */}
                  {matchScore !== null && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '-4px 0 4px 0' }}>
                      <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>
                        Compatibility score: {matchScore}%
                      </span>
                      <div style={{ background: 'rgba(255, 158, 66, 0.05)', height: '6px', border: '1px solid rgba(255, 158, 66, 0.1)', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--accent)', height: '100%', width: `${matchScore}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <p style={{ color:'var(--text-secondary)', fontSize:'13px', lineHeight: 1.6 }}>{c.description}</p>
                  </div>

                  {/* Match Insights: user matching skills and gap skills */}
                  <div style={{ borderTop: '1px solid rgba(255, 158, 66, 0.08)', paddingTop: '12px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.05em' }}>MATCH INSIGHTS</p>
                    
                    {/* Skills we have */}
                    {matched.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Skills you have:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {matched.map(s => (
                            <span key={s} style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              background: 'var(--accent)',
                              color: '#0a0a0a',
                              fontWeight: 700
                            }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skill gaps */}
                    {gaps.length > 0 && (
                      <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Skill gaps to acquire:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {gaps.map(s => (
                            <span key={s} style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              border: '1px solid rgba(255, 158, 66, 0.4)',
                              color: '#ffffff'
                            }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Suggested courses */}
                  {careerSuggestedCourses.length > 0 && (
                    <div style={{ background: 'rgba(255, 158, 66, 0.03)', borderLeft: '2px solid var(--accent)', padding: '10px 12px' }}>
                      <p style={{ color: 'var(--accent)', fontSize: '10px', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.05em' }}>SUGGESTED COURSES</p>
                      <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {careerSuggestedCourses.map((course: any) => (
                          <li key={course.id} style={{ fontSize: '11px', color: '#ffffff' }}>
                            • {course.name} <span style={{ color: 'var(--text-muted)' }}>({course.provider || 'Udemy'})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Top Employers */}
                  {c.top_companies && (
                    <div>
                      <p style={{ color:'var(--text-muted)', fontSize:'10px', fontWeight: 700, marginBottom:'4px', letterSpacing: '0.05em' }}>TOP EMPLOYERS</p>
                      <p style={{ color:'#cccccc', fontSize:'12px' }}>{c.top_companies}</p>
                    </div>
                  )}

                  {/* Roadmap progression steps */}
                  <div>
                    <p style={{ color:'var(--text-muted)', fontSize:'10px', fontWeight: 700, marginBottom:'6px', letterSpacing: '0.05em' }}>ROADMAP SPECIFICATION</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                      {roadmap.map((step, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'8px' }}>
                          <span style={{ width:'18px', height:'18px', borderRadius:'50%', background: i === 0 ? 'var(--accent)' : 'var(--border-dark)', border: i === 0 ? 'none' : '1px solid var(--border-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', color: i === 0 ? '#0a0a0a' : 'var(--text-muted)', fontWeight: 700, flexShrink:0, marginTop: '2px' }}>{i + 1}</span>
                          <span style={{ color: i === 0 ? '#ffffff' : 'var(--text-secondary)', fontSize:'12px', lineHeight: 1.4 }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Actions Row */}
                  <div style={{ paddingTop:'16px', borderTop:'1px solid var(--border-dark)', display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 'auto', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ color:'var(--accent)', fontWeight:700, fontSize:'14px', fontFamily: 'Inter, sans-serif' }}>{c.salary_range || '₹8L – ₹22L'}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Link href="/dashboard/compare" className="btn-outline" style={{ fontSize:'11px', padding:'6px 12px' }}>Compare</Link>
                      <Link href="/dashboard/roadmaps" className="btn-primary" style={{ fontSize:'11px', padding:'6px 12px' }}>Roadmap</Link>
                    </div>
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
