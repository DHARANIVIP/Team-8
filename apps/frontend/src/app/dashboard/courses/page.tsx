'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { getCourseRecommendations } from '@/lib/services/course-service';
import type { CourseRecommendation, CourseRecommendationResponse } from '@/lib/services/course-service';

// ── Helpers ────────────────────────────────────────────────────────────────────
const DIFF_COLORS: Record<string, { bg: string; bd: string; tx: string }> = {
  Beginner: { bg: 'rgba(16,185,129,0.1)', bd: 'rgba(16,185,129,0.3)', tx: '#10b981' },
  Intermediate: { bg: 'rgba(245,158,11,0.1)', bd: 'rgba(245,158,11,0.3)', tx: '#f59e0b' },
  Advanced: { bg: 'rgba(239,68,68,0.1)', bd: 'rgba(239,68,68,0.3)', tx: '#ef4444' },
};

const ALL = 'All';
const categories = [ALL, 'Software Development', 'Data Science', 'Cloud & DevOps', 'Cybersecurity', 'Business & Management', 'Design & UX', 'Mobile Development', 'Blockchain & Web3', 'Productivity & Soft Skills'];
const difficulties = [ALL, 'Beginner', 'Intermediate', 'Advanced'];
const providers = [ALL, 'Coursera', 'Udemy', 'edX'];

// ── Extract course data from recommendation ────────────────────────────────────
function getCourse(rec: CourseRecommendation) {
  return rec.courses || null;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CoursesPage() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);
  const [skillGap, setSkillGap] = useState<string[]>([]);
  const [careerName, setCareerName] = useState('');
  const [totalCourses, setTotalCourses] = useState(0);
  const [cached, setCached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [catFilter, setCatFilter] = useState(ALL);
  const [diffFilter, setDiffFilter] = useState(ALL);
  const [provFilter, setProvFilter] = useState(ALL);
  const recommendationsRequestRef = useRef(false);

  // ── Load recommendations ─────────────────────────────────────────────────────
  const loadRecommendations = useCallback(async (force = false) => {
    if (recommendationsRequestRef.current) return;
    recommendationsRequestRef.current = true;
    try {
      setGenerating(true);
      setError('');
      const data = await getCourseRecommendations(force);
      setRecommendations(data.recommendations || []);
      setSkillGap(data.skillGap || []);
      setTotalCourses(data.totalCourses || 0);
      setCached(data.cached || false);
      if (data.career) setCareerName(data.career.name || '');
    } catch (err: any) {
      console.error('Error loading course recommendations:', err);
      if (err.message?.includes('Not authenticated')) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }
      setError(err.message || 'Failed to load course recommendations');
      setRecommendations([]);
    } finally {
      recommendationsRequestRef.current = false;
      setGenerating(false);
    }
  }, [router]);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }
        await loadRecommendations(false);
      } catch (err: any) {
        console.error('Init error:', err);
        setError(err.message || 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router, loadRecommendations]);

  const handleRefresh = async () => {
    await loadRecommendations(true);
  };

  // ── Filtered recommendations ─────────────────────────────────────────────────
  const filtered = recommendations.filter(rec => {
    const course = getCourse(rec);
    if (!course) return false;
    if (catFilter !== ALL && (course.category || '') !== catFilter) return false;
    if (diffFilter !== ALL && course.difficulty !== diffFilter) return false;
    if (provFilter !== ALL && course.provider !== provFilter) return false;
    return true;
  });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <DashboardNavbar />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              Course Recommendations
            </h1>
            {careerName && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, padding: '3px 10px', background: 'var(--accent-glow)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                {careerName}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            AI-curated courses to close your skill gaps and advance your career
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div className="spinner" style={{ marginBottom: '24px', borderColor: 'var(--accent) transparent transparent transparent' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading your course recommendations...</p>
          </div>
        )}

        {/* Error / empty state */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Action Required</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '440px', margin: '0 auto 24px' }}>
              {error}
            </p>
            {error.includes('onboarding') && (
              <button onClick={() => router.push('/onboarding')} className="btn-primary" style={{ fontSize: '13px', padding: '10px 24px' }}>
                Complete Onboarding
              </button>
            )}
            {error.includes('career') && (
              <button onClick={() => router.push('/dashboard/career')} className="btn-primary" style={{ fontSize: '13px', padding: '10px 24px' }}>
                Go to AI Career Guidance
              </button>
            )}
          </div>
        )}

        {/* Main content */}
        {!loading && !error && (
          <>
            {/* Skill gap context */}
            {skillGap.length > 0 && (
              <div style={{
                padding: '20px 24px', background: 'var(--accent-glow)', border: '1px solid var(--border)',
                borderRadius: '8px', marginBottom: '24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 700 }}>Why these courses?</span>
                  {cached && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '2px 8px', background: 'var(--surface)', borderRadius: '4px' }}>cached</span>
                  )}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 10px' }}>
                  These courses are recommended because you need to build skills in:
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {skillGap.map((skill, i) => (
                    <span key={i} style={{
                      padding: '4px 12px', background: 'rgba(255,158,66,0.08)', border: '1px solid var(--border)',
                      borderRadius: '4px', fontSize: '12px', color: 'var(--accent)', fontWeight: 600,
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats bar */}
            <div className="card" style={{ padding: '18px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '32px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent)' }}>{filtered.length}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Recommended</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{totalCourses}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Available</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b' }}>{skillGap.length}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Skill Gaps</div>
                </div>
              </div>
              <button onClick={handleRefresh} disabled={generating} className="btn-outline" style={{ fontSize: '12px', padding: '8px 16px' }}>
                {generating ? 'Generating...' : '↻ Regenerate'}
              </button>
            </div>

            {/* Generating state */}
            {generating && recommendations.length === 0 && (
              <div style={{ textAlign: 'center', padding: '64px 20px' }}>
                <div className="spinner" style={{ marginBottom: '16px', borderColor: 'var(--accent) transparent transparent transparent' }} />
                <p style={{ color: 'var(--text-secondary)' }}>AI is analyzing your profile and selecting the best courses...</p>
              </div>
            )}

            {/* Filters */}
            {recommendations.length > 0 && (
              <div className="card" style={{ marginBottom: '24px', padding: '20px 24px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {categories.map(c => (
                      <button key={c} onClick={() => setCatFilter(c)} className={catFilter === c ? 'btn-primary' : 'btn-ghost'} style={{ fontSize: '11px', padding: '5px 10px' }}>{c}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Difficulty</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {difficulties.map(d => (
                      <button key={d} onClick={() => setDiffFilter(d)} className={diffFilter === d ? 'btn-primary' : 'btn-ghost'} style={{ fontSize: '11px', padding: '5px 10px' }}>{d}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Provider</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {providers.map(p => (
                      <button key={p} onClick={() => setProvFilter(p)} className={provFilter === p ? 'btn-primary' : 'btn-ghost'} style={{ fontSize: '11px', padding: '5px 10px' }}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Course cards */}
            {filtered.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filtered.map((rec, index) => {
                  const course = getCourse(rec);
                  if (!course) return null;
                  const d = DIFF_COLORS[course.difficulty || 'Intermediate'] || DIFF_COLORS.Intermediate;
                  const seq = rec.priority_order || index + 1;

                  return (
                    <div key={rec.id || course.id || index} className="card" style={{
                      padding: '24px 28px',
                      borderLeft: `3px solid ${d.tx}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}>
                      {/* Top row: sequence + title + badges */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                        <div style={{
                          flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '14px', fontWeight: 700,
                          background: 'rgba(255,158,66,0.08)', color: 'var(--accent)',
                        }}>
                          {seq}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, fontFamily: 'Outfit, sans-serif', lineHeight: 1.4 }}>
                            {course.title}
                          </h3>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px' }}>
                            <span style={{ padding: '3px 10px', background: d.bg, border: `1px solid ${d.bd}`, borderRadius: '4px', fontSize: '11px', color: d.tx, fontWeight: 600 }}>
                              {course.difficulty}
                            </span>
                            {course.category && (
                              <span style={{ padding: '3px 10px', background: 'var(--accent-glow)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '11px', color: 'var(--accent)', fontWeight: 500 }}>
                                {course.category}
                              </span>
                            )}
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{course.provider}</span>
                            {course.rating && (
                              <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>★ {course.rating}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {course.description && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                          {course.description}
                        </p>
                      )}

                      {/* Details row */}
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {course.duration_weeks && (
                          <span>⏱ {course.duration_weeks} weeks</span>
                        )}
                        {course.instructor && (
                          <span>👤 {course.instructor}</span>
                        )}
                        {course.language && course.language !== 'English' && (
                          <span>🌐 {course.language}</span>
                        )}
                        {course.price && (
                          <span style={{ color: course.price === 'Free' ? '#10b981' : 'var(--text-muted)', fontWeight: course.price === 'Free' ? 600 : 400 }}>
                            {course.price}
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {course.tags && course.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {course.tags.slice(0, 6).map((tag, i) => (
                            <span key={i} style={{ padding: '2px 8px', background: 'var(--surface-alt)', border: '1px solid var(--border-dark)', borderRadius: '3px', fontSize: '10px', color: 'var(--text-muted)' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Learning outcomes */}
                      {course.learning_outcomes && course.learning_outcomes.length > 0 && (
                        <div style={{ fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>You will learn: </span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {course.learning_outcomes.slice(0, 3).join(' • ')}
                          </span>
                        </div>
                      )}

                      {/* AI reason */}
                      {rec.reason && (
                        <div style={{
                          padding: '12px 16px', background: 'var(--accent-glow)', border: '1px solid var(--border)',
                          borderRadius: '6px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5',
                        }}>
                          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>AI Recommendation: </span>
                          {rec.reason}
                        </div>
                      )}

                      {/* CTA */}
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
                        {course.url && (
                          <a href={course.url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: '12px', padding: '10px 22px', fontWeight: 600 }}>
                            Start Course →
                          </a>
                        )}
                        {rec.skill_gap && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Addresses: {rec.skill_gap}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No filtered results */}
            {!generating && recommendations.length > 0 && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No courses match the selected filters.</p>
                <button onClick={() => { setCatFilter(ALL); setDiffFilter(ALL); setProvFilter(ALL); }} className="btn-outline" style={{ marginTop: '16px', fontSize: '12px', padding: '8px 18px' }}>
                  Clear Filters
                </button>
              </div>
            )}

            {/* No recommendations at all */}
            {!generating && recommendations.length === 0 && (
              <div style={{ textAlign: 'center', padding: '64px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No Course Recommendations Yet</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '400px', margin: '0 auto 24px' }}>
                  Complete onboarding and generate career recommendations to get personalized course suggestions.
                </p>
                <button onClick={handleRefresh} className="btn-primary" style={{ fontSize: '13px', padding: '10px 24px' }}>
                  Generate Recommendations
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
