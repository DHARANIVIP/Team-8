'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { isAuthenticated } from '@/lib/services/auth-service';
import { getRecommendedCareers, compareCareers } from '@/lib/services/compare-service';
import { toast } from 'sonner';

interface Career {
  id: string;
  name: string;
  description: string;
  icon?: string;
  salary_range: string;
  average_salary: number;
  growth_rate: string;
  demand_level: string;
  matchPercentage: number;
  reason: string;
}

interface ComparisonResult {
  careerId: string;
  title: string;
  overallScore: number;
  matchPercent: number;
  matchedSkills: { name: string; proficiency: string }[];
  missingSkills: string[];
  expertSkillsUsed: string[];
  courses: { id: string; title: string; provider: string; url: string; difficulty: string; price: string }[];
  growth: string;
  industry: string;
  avgSalary: number;
  roadmap?: {
    duration: string;
    level: string;
    milestonesCount: number;
  } | null;
}

interface AISummary {
  bestCareer: string;
  reason: string;
  strengths: Record<string, string[]>;
  challenges: Record<string, string[]>;
  skillsToDevelop: Record<string, string[]>;
  recommendedPath: string[];
}

export default function ComparePage() {
  const router = useRouter();
  const [recommended, setRecommended] = useState<Career[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [results, setResults] = useState<{
    summary: AISummary;
    comparisons: ComparisonResult[];
    comparisonOrder: string[];
  } | null>(null);
  
  const [error, setError] = useState('');

  // 1. Fetch recommended careers on load
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        const data = await getRecommendedCareers();
        setRecommended(data.careers || []);
      } catch (err: any) {
        console.error('Failed to load recommended careers:', err);
        setError('Failed to retrieve your career recommendations. Please complete onboarding first.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  // Handle card selection click
  const toggleSelectCareer = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (prev.length >= 3) {
        toast.warning('You can compare a maximum of 3 careers at once.');
        return prev;
      }
      return [...prev, id];
    });
  };

  // Run the side-by-side comparison
  const handleCompare = async () => {
    if (selectedIds.length < 2 || selectedIds.length > 3) {
      toast.error('Please select 2 or 3 careers to compare.');
      return;
    }

    setComparing(true);
    setError('');
    try {
      const data = await compareCareers(selectedIds);
      setResults(data);
    } catch (err: any) {
      console.error('Failed to run comparison:', err);
      setError(err.message || 'Error occurred while computing comparison.');
    } finally {
      setComparing(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setSelectedIds([]);
  };

  // Helper formatting for salary
  const formatSalary = (val: number) => {
    if (!val) return '₹10L';
    return `₹${Math.round(val / 100000)}L`;
  };

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <DashboardNavbar />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBottom: '20px', borderBottom: '1px solid rgba(255, 158, 66, 0.15)', marginBottom: '32px'
        }}>
          <div>
            <span className="section-label" style={{ display: 'block', marginBottom: '4px' }}>CAREER INSIGHTS</span>
            <h1 style={{ color: '#ffffff', fontWeight: 800, fontSize: '32px', margin: 0, letterSpacing: '0.5px', fontFamily: 'Outfit, sans-serif' }}>
              Compare Career Paths
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '6px 0 0' }}>
              Side-by-side suitability, skill overlap, roadmap details, and course matches
            </p>
          </div>
          {results && (
            <button className="btn-outline" onClick={handleReset} style={{ fontSize: '13px', padding: '8px 18px' }}>
              ← Compare Others
            </button>
          )}
        </div>

        {error && (
          <div style={{
            padding: '16px 20px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid #ef4444',
            color: '#ef4444', borderRadius: '8px', marginBottom: '24px', textAlign: 'center', fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {(loading || comparing) && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div className="spinner" style={{ margin: '0 auto 24px', borderColor: 'var(--accent) transparent transparent transparent' }} />
            <p style={{ color: 'var(--text-secondary)' }}>
              {loading ? 'Retrieving recommendations...' : 'Analyzing skill alignment and synthesizing AI comparison...'}
            </p>
          </div>
        )}

        {/* SECTION 1: SELECTION PANEL */}
        {!loading && !comparing && !results && (
          <div className="animate-slide-up">
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,158,66,0.05) 0%, rgba(10,10,10,0) 100%)',
              border: '1px solid rgba(255,158,66,0.15)', padding: '24px 28px', borderRadius: '12px', marginBottom: '32px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>
                Select Career Alternatives
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                Choose 2 or 3 recommended careers from your profile to compare alignment compatibility.
              </p>
            </div>

            {recommended.length === 0 ? (
              <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px' }}>
                  No recommended careers found. You need to complete onboarding to generate matches first!
                </p>
                <Link href="/dashboard/career" className="btn-primary" style={{ padding: '10px 24px' }}>
                  Go to Career Guidance
                </Link>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '20px', marginBottom: '32px'
                }}>
                  {recommended.map((career) => {
                    const isSelected = selectedIds.includes(career.id);
                    return (
                      <div
                        key={career.id}
                        onClick={() => toggleSelectCareer(career.id)}
                        className="card"
                        style={{
                          padding: '24px', cursor: 'pointer', position: 'relative',
                          border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                          background: isSelected ? 'rgba(255,158,66,0.03)' : 'var(--surface-alt)',
                          boxShadow: isSelected ? '0 0 15px rgba(255,158,66,0.08)' : 'none',
                          transition: 'all 0.2s ease',
                          display: 'flex', flexDirection: 'column', height: '100%'
                        }}
                      >
                        {/* Selector indicator */}
                        <div style={{
                          position: 'absolute', top: '20px', right: '20px', width: '20px', height: '20px',
                          borderRadius: '4px', border: '2px solid var(--border)',
                          background: isSelected ? 'var(--accent)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#000000', fontWeight: 'bold', fontSize: '12px'
                        }}>
                          {isSelected && '✓'}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                          <span style={{ fontSize: '32px' }}>{career.icon || '💼'}</span>
                          <div>
                            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>
                              {career.name}
                            </h3>
                            <span style={{
                              color: 'var(--accent)', fontSize: '12px', fontWeight: 700,
                              background: 'var(--accent-glow)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px'
                            }}>
                              {career.matchPercentage}% Match
                            </span>
                          </div>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 16px', flex: 1, lineHeight: '1.5' }}>
                          {career.description}
                        </p>

                        <div style={{
                          borderTop: '1px solid var(--border-dark)', paddingTop: '14px',
                          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px'
                        }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block' }}>AVG SALARY</span>
                            <span style={{ color: '#ffffff', fontWeight: 600 }}>{career.salary_range}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block' }}>GROWTH RATE</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{career.growth_rate}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={handleCompare}
                    disabled={selectedIds.length < 2}
                    className="btn-primary"
                    style={{
                      padding: '12px 32px', fontSize: '15px', fontWeight: 700,
                      opacity: selectedIds.length >= 2 ? 1 : 0.5,
                      cursor: selectedIds.length >= 2 ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Compare Selected ({selectedIds.length}) →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* SECTION 2: COMPARISON RESULTS VIEW */}
        {!loading && !comparing && results && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Final Suitability Rankings */}
            <div className="card" style={{ padding: '24px 28px' }}>
              <span className="section-label">OVERALL SUITABILITY RANKINGS</span>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
                {results.comparisons.map((c, index) => {
                  const placeColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
                  const placeLabels = ['1st', '2nd', '3rd'];
                  return (
                    <div key={c.careerId} style={{
                      flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '14px',
                      background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--border)'
                    }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%', background: `${placeColors[index]}20`,
                        color: placeColors[index], display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '14px', border: `1px solid ${placeColors[index]}`
                      }}>
                        {placeLabels[index]}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', color: '#ffffff', fontWeight: 700 }}>{c.title}</h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Score: <strong style={{ color: 'var(--accent)' }}>{c.overallScore}</strong> / 100
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Side-by-Side Detail Grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: `repeat(${results.comparisons.length}, minmax(0, 1fr))`,
              gap: '20px', alignItems: 'stretch'
            }}>
              {results.comparisons.map((item) => {
                return (
                  <div key={item.careerId} className="card" style={{
                    padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px',
                    border: '1px solid var(--border)', background: 'var(--surface-alt)'
                  }}>
                    
                    {/* Header */}
                    <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-dark)' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>
                        {item.title}
                      </h3>
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{item.industry}</span>
                    </div>

                    {/* Compatibility Score */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '90px', height: '90px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,158,66,0.12) 0%, rgba(0,0,0,0) 80%)',
                        border: '3px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 15px rgba(255,158,66,0.2)'
                      }}>
                        <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', fontFamily: 'Inter, sans-serif' }}>
                          {item.overallScore}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Compatibility Score
                      </span>
                    </div>

                    {/* Skill Match Percentage */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Skill Match</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{item.matchPercent}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--border-dark)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${item.matchPercent}%`, height: '100%', background: 'var(--accent)', borderRadius: '3px' }} />
                      </div>
                    </div>

                    {/* Key Stats (Salary / Growth) */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
                      background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border-dark)'
                    }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>AVG SALARY</span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{formatSalary(item.avgSalary)}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>GROWTH RATE</span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>{item.growth}</span>
                      </div>
                    </div>

                    {/* Expert Skills */}
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                        Expert Skills ({item.expertSkillsUsed.length})
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {item.expertSkillsUsed.length > 0 ? (
                          item.expertSkillsUsed.map(s => (
                            <span key={s} style={{
                              fontSize: '11px', background: 'rgba(80,200,120,0.1)', color: '#50c878',
                              border: '1px solid rgba(80,200,120,0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: 500
                            }}>
                              {s}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>None matches expert level</span>
                        )}
                      </div>
                    </div>

                    {/* Matched Skills */}
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                        Matched Skills ({item.matchedSkills.length})
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {item.matchedSkills.length > 0 ? (
                          item.matchedSkills.map(s => (
                            <span key={s.name} style={{
                              fontSize: '11px', background: 'rgba(255,255,255,0.03)', color: '#ffffff',
                              border: '1px solid var(--border-dark)', padding: '2px 8px', borderRadius: '4px', fontWeight: 500
                            }}>
                              {s.name} <strong style={{ color: 'var(--accent)', fontSize: '10px' }}>{s.proficiency[0]}</strong>
                            </span>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No matches</span>
                        )}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                        Skills to Develop ({item.missingSkills.length})
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {item.missingSkills.length > 0 ? (
                          item.missingSkills.slice(0, 8).map(s => (
                            <span key={s} style={{
                              fontSize: '11px', background: 'rgba(239,68,68,0.06)', color: '#ef4444',
                              border: '1px solid rgba(239,68,68,0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: 500
                            }}>
                              {s}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#50c878', fontSize: '12px', fontWeight: 600 }}>✓ All skills acquired!</span>
                        )}
                        {item.missingSkills.length > 8 && (
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', alignSelf: 'center' }}>
                            +{item.missingSkills.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Roadmap Summary */}
                    <div style={{
                      borderTop: '1px solid var(--border-dark)', paddingTop: '16px',
                      display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px'
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Roadmap Details
                      </span>
                      {item.roadmap ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffffff' }}>
                          <span>⏱ {item.roadmap.duration}</span>
                          <span>📶 {item.roadmap.level}</span>
                          <span>📍 {item.roadmap.milestonesCount} milestones</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No roadmap synced yet</span>
                      )}
                    </div>

                    {/* Stored Course Recommendations */}
                    <div style={{ borderTop: '1px solid var(--border-dark)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Top Recommended Courses
                      </span>
                      {item.courses.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {item.courses.map(course => (
                            <a
                              key={course.id} href={course.url || '#'} target="_blank" rel="noopener noreferrer"
                              style={{
                                display: 'block', padding: '10px 12px', background: 'var(--surface)',
                                border: '1px solid var(--border-dark)', borderRadius: '4px', textDecoration: 'none',
                                transition: 'all 0.2s ease', cursor: 'pointer'
                              }}
                              className="course-link-hover"
                            >
                              <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {course.title}
                              </span>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                <span>{course.provider}</span>
                                <span style={{ color: 'var(--accent)' }}>{course.difficulty}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>No courses stored for gaps</span>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

            {/* AI Recommendation Summary Section */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,158,66,0.06) 0%, rgba(10,10,10,0.5) 100%)',
              border: '1px solid rgba(255,158,66,0.2)', padding: '30px', borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px' }}>🤖</span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                  AI Guidance Summary
                </h3>
              </div>

              {/* Best Career Fit */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '16px', color: 'var(--accent)', fontWeight: 700 }}>
                  Recommended Focus: {results.summary.bestCareer}
                </h4>
                <p style={{ margin: 0, color: '#ffffff', fontSize: '14px', lineHeight: '1.6' }}>
                  {results.summary.reason}
                </p>
              </div>

              {/* Strengths & Challenges per career */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px', borderTop: '1px solid rgba(255,158,66,0.15)', paddingTop: '20px' }}>
                <div>
                  <h4 style={{ color: '#50c878', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                    ✓ Key Strengths
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {results.comparisons.map(item => {
                      const list = results.summary.strengths[item.title] || results.summary.strengths[item.careerId] || [];
                      return (
                        <div key={item.careerId}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', display: 'block', marginBottom: '4px' }}>{item.title}</span>
                          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                            {list.map((str, i) => <li key={i} style={{ marginBottom: '2px' }}>{str}</li>)}
                            {list.length === 0 && <li>Acquired matching foundational skills</li>}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 style={{ color: '#ef4444', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                    ⚠ Primary Challenges
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {results.comparisons.map(item => {
                      const list = results.summary.challenges[item.title] || results.summary.challenges[item.careerId] || [];
                      return (
                        <div key={item.careerId}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', display: 'block', marginBottom: '4px' }}>{item.title}</span>
                          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                            {list.map((ch, i) => <li key={i} style={{ marginBottom: '2px' }}>{ch}</li>)}
                            {list.length === 0 && <li>Requires mastering missing technologies</li>}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recommended learning path */}
              <div style={{ borderTop: '1px solid rgba(255,158,66,0.15)', paddingTop: '20px' }}>
                <h4 style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  → Recommended Step-by-Step Learning Sequence
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {results.summary.recommendedPath.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '13px' }}>
                      <span style={{
                        flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%', background: 'var(--accent)',
                        color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '11px'
                      }}>
                        {idx + 1}
                      </span>
                      <p style={{ margin: 0, color: '#ffffff', paddingTop: '2px' }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
