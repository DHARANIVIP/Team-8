'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { isAuthenticated } from '@/lib/services/auth-service';
import { getCategories, getPersonalizedCategories, toggleSavedCareer, getCareerInsights, generateLiveRecommendations } from '@/lib/services/career-service';
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
  const [liveRecommendations, setLiveRecommendations] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveRecommendationError, setLiveRecommendationError] = useState('');
  const [isGeneratingLiveRecommendations, setIsGeneratingLiveRecommendations] = useState(false);
  const [liveRecommendationStep, setLiveRecommendationStep] = useState(0);

  const [activeInsightsCareer, setActiveInsightsCareer] = useState<any | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsData, setInsightsData] = useState<any>(null);

  const handleToggleBookmark = async (careerId: string) => {
    try {
      const result = await toggleSavedCareer(careerId);
      setCareersList(prev => prev.map(c => c.id === careerId ? { ...c, isSaved: result.saved } : c));
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleOpenDeepDive = async (career: any) => {
    setActiveInsightsCareer(career);
    setInsightsData(null);

    if (career.cachedInsights) {
      setInsightsData(career.cachedInsights);
      return;
    }

    try {
      setLoadingInsights(true);
      const res = await getCareerInsights(career.id);
      setInsightsData(res.insights);
      setCareersList(prev => prev.map(c => c.id === career.id ? { ...c, cachedInsights: res.insights } : c));
    } catch (err) {
      console.error('Failed to fetch deep-dive insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

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
  const getSkillMatchDetails = (career: any): { matched: string[]; gaps: string[] } => {
    // If pre-computed by backend, use them
    if (career.matchedSkills && career.gapSkills) {
      return {
        matched: career.matchedSkills as string[],
        gaps: career.gapSkills as string[],
      };
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
    const liveMatch = liveRecommendations.find((rec: any) => 
      rec.career_id === career.id || rec.career_name?.toLowerCase() === career.name.toLowerCase()
    );
    if (liveMatch) return liveMatch.match_percentage;

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
  const topRecommendations = liveRecommendations.length > 0
    ? [...liveRecommendations].sort((a: any, b: any) => b.match_percentage - a.match_percentage).slice(0, 3)
    : recommendations?.suggestedCareers
      ? [...recommendations.suggestedCareers].sort((a: any, b: any) => b.matchScore - a.matchScore).slice(0, 3)
      : [];

  const topCareerMeta = topRecommendations[0];
  const topCareerObj = topCareerMeta
    ? careersList.find((c: any) => c.id === topCareerMeta.career_id || c.id === topCareerMeta.id || c.name.toLowerCase() === (topCareerMeta.career_name || topCareerMeta.name || '').toLowerCase())
    : null;
  const topSkillMatch = topCareerObj ? getSkillMatchDetails(topCareerObj) : null;

  const liveRecommendationSteps = [
    'Fetching student profile from DB...',
    'Retrieving available industry roles...',
    'Compiling structured prompt for AI...',
    'Querying Gemini generative models...',
    'Validating and parsing AI response...',
    'Saving matches to database...'
  ];

  const handleGenerateLiveRecommendations = async () => {
    setLiveRecommendationError('');
    setIsGeneratingLiveRecommendations(true);
    setLiveRecommendationStep(0);

    try {
      for (let i = 0; i < liveRecommendationSteps.length; i += 1) {
        setLiveRecommendationStep(i);
        await new Promise((resolve) => setTimeout(resolve, 120));
      }

      const response = await generateLiveRecommendations();
      setLiveRecommendations(response.recommendations || []);
      setLiveRecommendationStep(liveRecommendationSteps.length);
      setError('');
    } catch (err: any) {
      setLiveRecommendationError(err.message || 'Unable to generate AI career recommendations.');
      console.error('Live recommendation generation failed:', err);
    } finally {
      setIsGeneratingLiveRecommendations(false);
    }
  };

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
              {liveRecommendations.length > 0
                ? 'Your live AI career recommendations are ready.'
                : recommendations 
                  ? 'Your career matching dashboard, updated with AI recommendations from your resume' 
                  : 'Browse industry roadmaps and skill requirements for every career'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleGenerateLiveRecommendations}
              disabled={isGeneratingLiveRecommendations}
              className="btn-primary"
              style={{ padding: '10px 18px', fontSize: '12px', minWidth: '200px' }}
            >
              {isGeneratingLiveRecommendations ? 'Generating AI Career Matches...' : 'Generate AI Career Match'}
            </button>
          </div>
        </div>

        {/* ── AI Live Recommendation Progress ── */}
        {isGeneratingLiveRecommendations && (
          <div style={{ marginBottom: '24px', padding: '22px', background: 'rgba(20, 20, 20, 0.85)', border: '1px solid rgba(255, 158, 66, 0.2)', borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <p style={{ color: 'var(--accent)', fontSize: '12px', margin: 0, fontWeight: 700 }}>Live AI Recommendation Pipeline</p>
                <p style={{ color: '#ffffff', fontSize: '13px', margin: '6px 0 0' }}>Delivering career matches in real time with Gemini and structured scoring.</p>
              </div>
              <span style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: 700 }}>{liveRecommendationStep + 1}/{liveRecommendationSteps.length}</span>
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {liveRecommendationSteps.map((step, idx) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: idx <= liveRecommendationStep ? 'var(--accent)' : 'rgba(255,255,255,0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: idx <= liveRecommendationStep ? '#0a0a0a' : '#999' }}>{idx + 1}</span>
                  <span style={{ color: idx <= liveRecommendationStep ? '#ffffff' : 'var(--text-secondary)', fontSize: '12px' }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {liveRecommendationError && (
          <div style={{ marginBottom: '24px', padding: '18px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '12px' }}>
            {liveRecommendationError}
          </div>
        )}

        {liveRecommendations.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="section-label" style={{ display: 'block', marginBottom: '4px' }}>AI RECOMMENDED CAREERS</span>
                <h2 style={{ color: '#ffffff', fontSize: '20px', margin: 0, fontWeight: 700 }}>Top Live Matches</h2>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{liveRecommendations.length} recommendations generated</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              {liveRecommendations.map((rec: any) => (
                <div key={rec.career_id || rec.career_name} className="card" style={{ padding: '18px', background: 'rgba(18, 18, 18, 0.9)', border: '1px solid rgba(255, 158, 66, 0.12)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                    <strong style={{ color: '#ffffff', fontSize: '14px' }}>{rec.career_name}</strong>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{rec.match_percentage}%</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.6, marginBottom: '10px' }}>{rec.reason}</p>
                  {rec.missing_skills && rec.missing_skills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {rec.missing_skills.slice(0, 3).map((skill: string) => (
                        <span key={skill} style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255, 158, 66, 0.1)', borderRadius: '999px', color: 'var(--accent)' }}>{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
                  {topRecommendations.map((career: any, index: number) => {
                    const name = career.name || career.career_name || 'Career Match';
                    const score = career.matchScore ?? career.match_percentage ?? 0;
                    return (
                      <div key={career.id || career.career_id || name} style={{
                        background: 'var(--surface-alt)',
                        border: '1px solid rgba(255, 158, 66, 0.1)',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '13px' }}>{index + 1}. {name}</span>
                          <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '12px' }}>{score}% Match</span>
                        </div>
                        <div style={{ background: 'rgba(255, 158, 66, 0.1)', height: '6px', border: '1px solid rgba(255, 158, 66, 0.15)', overflow: 'hidden' }}>
                          <div style={{ background: 'var(--accent)', height: '100%', width: `${score}%` }} />
                        </div>
                      </div>
                    );
                  })}
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
                  
                  {/* Title & Growth rate & Save */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <h3 style={{ color:'#ffffff', fontWeight:700, fontSize:'16px', marginBottom:'4px', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {c.icon || '💼'} {c.name}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleBookmark(c.id); }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                          title={c.isSaved ? "Saved" : "Save Career"}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={c.isSaved ? "var(--accent)" : "none"} stroke={c.isSaved ? "var(--accent)" : "var(--text-muted)"} strokeWidth="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>
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

                  {/* AI Why Recommended explanation */}
                  {c.cachedInsights?.why_recommended && (
                    <div style={{ background: 'rgba(255, 158, 66, 0.04)', borderLeft: '2px solid var(--accent)', padding: '8px 12px', fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '-8px' }}>
                      💡 {c.cachedInsights.why_recommended}
                    </div>
                  )}

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
                      <button 
                        onClick={() => handleOpenDeepDive(c)}
                        className="btn-outline" 
                        style={{ 
                          fontSize:'11px', 
                          padding:'6px 12px', 
                          border: '1px solid var(--accent)', 
                          color: 'var(--accent)',
                          cursor: 'pointer',
                          background: 'transparent'
                        }}
                      >
                        AI Insights
                      </button>
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

      {/* Sliding AI Deep-Dive Insights Drawer */}
      {activeInsightsCareer && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '460px',
          height: '100vh',
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255, 158, 66, 0.2)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.8)',
          zIndex: 9999,
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255, 158, 66, 0.15)', paddingBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                AI Guidance deep-dive
              </span>
              <h2 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 700, margin: '2px 0 0', fontFamily: 'Outfit, sans-serif' }}>
                {activeInsightsCareer.name}
              </h2>
            </div>
            <button 
              onClick={() => setActiveInsightsCareer(null)}
              style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
            >
              ✕
            </button>
          </div>

          {/* Loading state */}
          {loadingInsights && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px' }}>
              <div className="spinner" />
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
                Analyzing resume against {activeInsightsCareer.name} requirements...
              </p>
            </div>
          )}

          {/* Insights Display */}
          {!loadingInsights && insightsData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              
              {/* Why Recommended */}
              <div>
                <h4 style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Why Recommended
                </h4>
                <p style={{ color: '#ffffff', fontSize: '13px', lineHeight: 1.6, margin: 0, fontStyle: 'italic', background: 'rgba(255, 158, 66, 0.03)', padding: '12px', borderLeft: '3px solid var(--accent)' }}>
                  "{insightsData.why_recommended}"
                </p>
              </div>

              {/* Strengths & Gaps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ color: '#10b981', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Your Strengths
                  </h4>
                  <ul style={{ padding: 0, margin: 0, listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {insightsData.strengths?.map((str: string, i: number) => (
                      <li key={i} style={{ color: '#ffffff', fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <span style={{ color: '#10b981' }}>✓</span> {str}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Missing Skill Gaps
                  </h4>
                  <ul style={{ padding: 0, margin: 0, listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {insightsData.gaps?.map((gap: string, i: number) => (
                      <li key={i} style={{ color: '#ffffff', fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <span style={{ color: 'var(--accent)' }}>⚠</span> {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Learning Priorities */}
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Learning Priorities
                </h4>
                <ul style={{ padding: 0, margin: 0, listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {insightsData.learning_priorities?.map((pri: string, i: number) => (
                    <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ background: 'rgba(255, 158, 66, 0.1)', color: 'var(--accent)', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      <span>{pri}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Certifications */}
              {insightsData.certifications && insightsData.certifications.length > 0 && (
                <div>
                  <h4 style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Demanded Certifications
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {insightsData.certifications.map((cert: string) => (
                      <span key={cert} style={{ fontSize: '10px', padding: '4px 10px', background: 'rgba(255, 158, 66, 0.08)', border: '1px solid rgba(255, 158, 66, 0.25)', color: 'var(--accent)', fontWeight: 600 }}>
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Industry Trends */}
              {insightsData.industry_trends && (
                <div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Industry Trends
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
                    {insightsData.industry_trends}
                  </p>
                </div>
              )}

              {/* Timeline Roadmap */}
              {insightsData.roadmap && insightsData.roadmap.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,158,66,0.15)', paddingTop: '16px', marginTop: '8px' }}>
                  <h4 style={{ color: '#ffffff', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                    Personal Growth Roadmap
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', paddingLeft: '16px', borderLeft: '1px solid rgba(255, 158, 66, 0.2)' }}>
                    {insightsData.roadmap.map((step: string, i: number) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-21px', top: '3px', width: '9px', height: '9px', borderRadius: '50%', background: 'var(--accent)' }} />
                        <p style={{ color: '#ffffff', fontSize: '12px', fontWeight: 600, margin: '0 0 2px 0' }}>
                          Phase {i + 1}
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.4, margin: 0 }}>
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Close button at bottom */}
          <button 
            onClick={() => setActiveInsightsCareer(null)}
            className="btn-primary" 
            style={{ width: '100%', padding: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 'auto', border: 'none', cursor: 'pointer' }}
          >
            Close Deep-Dive
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </div>
  );
}
