'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { getSkillRecommendations, updateSkillRecommendationStatus } from '@/lib/services/skill-service';
import type { SkillRecommendation, SkillRecStatus, SkillRecommendationResponse } from '@/lib/types/skills';

// ── Types ──────────────────────────────────────────────────────────────────────
interface CareerOption {
  id: string;
  name: string;
  matchPercentage?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const DIFF_COLORS: Record<string, { bg: string; bd: string; tx: string }> = {
  Easy: { bg: 'rgba(16,185,129,0.1)', bd: 'rgba(16,185,129,0.3)', tx: '#10b981' },
  Medium: { bg: 'rgba(245,158,11,0.1)', bd: 'rgba(245,158,11,0.3)', tx: '#f59e0b' },
  Hard: { bg: 'rgba(239,68,68,0.1)', bd: 'rgba(239,68,68,0.3)', tx: '#ef4444' },
};

function getTopCareer(careers: CareerOption[]): CareerOption | null {
  if (!careers?.length) return null;
  return careers.reduce((top, c) => ((c.matchPercentage ?? 0) > (top.matchPercentage ?? 0) ? c : top), careers[0]);
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SkillsPage() {
  const router = useRouter();

  const [availableCareers, setAvailableCareers] = useState<CareerOption[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<CareerOption | null>(null);
  const [recommendations, setRecommendations] = useState<SkillRecommendation[]>([]);
  const [careerName, setCareerName] = useState('');
  const [gapSummary, setGapSummary] = useState<{ missing: number; weak: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Load recommendations ─────────────────────────────────────────────────────
  const loadRecommendations = useCallback(async (careerId: string, force = false) => {
    try {
      setGenerating(true);
      setError('');
      const data = await getSkillRecommendations(careerId, force);
      setRecommendations(data.recommendations || []);
      setCareerName(data.career || '');
      setGapSummary(data.gapSummary || null);
    } catch (err: any) {
      console.error('Error loading skill recommendations:', err);
      setError(err.message || 'Failed to load skill recommendations');
      setRecommendations([]);
    } finally {
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        const analysisRes = await fetch('/api/career/analysis', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!analysisRes.ok) {
          if (analysisRes.status === 401) { localStorage.removeItem('token'); router.push('/login'); return; }
          setError('Failed to load career data.');
          setLoading(false);
          return;
        }

        const analysisData = await analysisRes.json();
        const savedCareers = analysisData?.recommendations?.saved_careers || [];

        if (savedCareers.length === 0) {
          setError('No career recommendations found. Please visit AI Career Guidance first.');
          setLoading(false);
          return;
        }

        const careerOptions: CareerOption[] = savedCareers.map((c: any) => ({
          id: c.careerId || c.career_id || c.id,
          name: c.careerName || c.career_name || c.name || 'Unknown Career',
          matchPercentage: c.matchPercentage || c.match_percentage || 0,
        }));

        setAvailableCareers(careerOptions);
        const topCareer = getTopCareer(careerOptions);
        if (topCareer) {
          setSelectedCareer(topCareer);
          await loadRecommendations(topCareer.id);
        } else {
          setError('No career selected.');
        }
      } catch (err: any) {
        console.error('Init error:', err);
        setError(err.message || 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router, loadRecommendations]);

  // ── Sequential learning: advance to next skill ──────────────────────────────
  const handleLearned = async (recId: string) => {
    try {
      setUpdatingId(recId);
      // Mark current skill as completed
      const updated = await updateSkillRecommendationStatus(recId, 'completed');
      if (updated) {
        setRecommendations(prev =>
          prev.map(r => r.id === recId ? { ...r, status: 'completed' as SkillRecStatus, skill_name: updated.skill_name || r.skill_name } : r)
        );
        // Auto-start the next pending skill
        const nextPending = recommendations.find(r => (r.id !== recId) && (r.status || 'pending') === 'pending');
        if (nextPending) {
          await updateSkillRecommendationStatus(nextPending.id, 'in_progress');
          setRecommendations(prev =>
            prev.map(r => r.id === nextPending.id ? { ...r, status: 'in_progress' as SkillRecStatus } : r)
          );
        }
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStartFirst = async (recId: string) => {
    try {
      setUpdatingId(recId);
      const updated = await updateSkillRecommendationStatus(recId, 'in_progress');
      if (updated) {
        setRecommendations(prev =>
          prev.map(r => r.id === recId ? { ...r, status: 'in_progress' as SkillRecStatus } : r)
        );
      }
    } catch (err: any) {
      console.error('Error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCareerChange = async (careerId: string) => {
    const career = availableCareers.find(c => c.id === careerId);
    if (!career) return;
    setSelectedCareer(career);
    await loadRecommendations(careerId);
  };

  const handleRefresh = async () => {
    if (selectedCareer) await loadRecommendations(selectedCareer.id, true);
  };

  // ── Computed ─────────────────────────────────────────────────────────────────
  const completedCount = recommendations.filter(r => (r.status || 'pending') === 'completed').length;
  const totalCount = recommendations.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted = totalCount > 0 && completedCount === totalCount;
  const currentSkill = recommendations.find(r => (r.status || 'pending') === 'in_progress');
  const nextSkill = recommendations.find(r => (r.status || 'pending') === 'pending');

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <DashboardNavbar />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              Skill Roadmap
            </h1>
            {selectedCareer && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, padding: '3px 10px', background: 'var(--accent-glow)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                {careerName}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Your personalized learning path — master each skill to complete your roadmap
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div className="spinner" style={{ marginBottom: '24px', borderColor: 'var(--accent) transparent transparent transparent' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading your skill roadmap...</p>
          </div>
        )}

        {/* Error / empty state */}
        {!loading && (error || (!selectedCareer && recommendations.length === 0)) && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{error ? 'Action Required' : 'No Recommendations Yet'}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '400px', margin: '0 auto 24px' }}>
              {error || 'Complete your profile and generate career recommendations first.'}
            </p>
            {!error && (
              <button onClick={() => router.push('/dashboard/career')} className="btn-primary" style={{ fontSize: '13px', padding: '10px 24px' }}>
                Go to AI Career Guidance
              </button>
            )}
          </div>
        )}

        {/* Main content */}
        {!loading && !error && selectedCareer && (
          <>
            {/* Career selector */}
            {availableCareers.length > 1 && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Career</label>
                <select
                  value={selectedCareer.id}
                  onChange={(e) => handleCareerChange(e.target.value)}
                  style={{ width: '320px', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                >
                  {availableCareers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Progress bar */}
            <div className="card" style={{ padding: '24px 28px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Learning Progress</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>
                    {completedCount} of {totalCount} skills mastered ({progressPercent}%)
                  </p>
                </div>
                {gapSummary && (
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#ef4444' }}>{gapSummary.missing}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Missing</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b' }}>{gapSummary.weak}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Weak</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }}>{completedCount}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mastered</div>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ height: '8px', background: 'rgba(255,158,66,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
              </div>
            </div>

            {/* All completed banner */}
            {allCompleted && (
              <div style={{
                padding: '28px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '8px', textAlign: 'center', marginBottom: '24px',
              }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏆</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', margin: '0 0 6px' }}>Roadmap Complete!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                  You've mastered all {totalCount} skills for {careerName}. Great job!
                </p>
              </div>
            )}

            {/* Current skill focus */}
            {(currentSkill || nextSkill) && !allCompleted && (
              <div style={{
                padding: '24px', background: 'var(--accent-glow)', border: '1px solid var(--border)',
                borderRadius: '8px', marginBottom: '24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--accent)', fontSize: '16px' }}>{currentSkill ? '◐' : '→'}</span>
                  <h3 style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '14px', margin: 0 }}>
                    {currentSkill ? 'Currently Learning' : 'Next to Learn'}
                  </h3>
                </div>
                <p style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px' }}>
                  {(currentSkill || nextSkill)?.skill_name}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 10px' }}>
                  {(currentSkill || nextSkill)?.reason}
                </p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {(() => {
                    const d = DIFF_COLORS[(currentSkill || nextSkill)?.skill_difficulty || 'Medium'] || DIFF_COLORS.Medium;
                    return (
                      <>
                        <span style={{ padding: '3px 8px', background: d.bg, border: `1px solid ${d.bd}`, borderRadius: '4px', fontSize: '11px', color: d.tx, fontWeight: 600 }}>
                          {(currentSkill || nextSkill)?.skill_difficulty}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{(currentSkill || nextSkill)?.skill_category}</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Generating */}
            {generating && recommendations.length === 0 && (
              <div style={{ textAlign: 'center', padding: '64px 20px' }}>
                <div className="spinner" style={{ marginBottom: '16px', borderColor: 'var(--accent) transparent transparent transparent' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Analyzing your skills and generating roadmap...</p>
              </div>
            )}

            {/* Skill roadmap list */}
            {recommendations.length > 0 && (
              <div className="card" style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Learning Path</h2>
                  <button onClick={handleRefresh} disabled={generating} className="btn-outline" style={{ fontSize: '12px', padding: '6px 14px' }}>
                    {generating ? 'Refreshing...' : '↻ Refresh'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recommendations.map((rec, index) => {
                    const status = (rec.status || 'pending') as SkillRecStatus;
                    const isCompleted = status === 'completed';
                    const isCurrent = status === 'in_progress';
                    const isPending = status === 'pending';
                    const isNext = isPending && !recommendations.slice(0, index).some(r => (r.status || 'pending') === 'pending');
                    const isUpdating = updatingId === rec.id;
                    const d = DIFF_COLORS[rec.skill_difficulty || 'Medium'] || DIFF_COLORS.Medium;

                    return (
                      <div key={rec.id} style={{
                        padding: '18px 20px',
                        background: isCompleted ? 'rgba(16,185,129,0.04)' : isCurrent ? 'var(--accent-glow)' : 'var(--surface-alt)',
                        border: `1px solid ${isCompleted ? 'rgba(16,185,129,0.25)' : isCurrent ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: '6px',
                        opacity: isCompleted ? 0.75 : 1,
                        transition: 'all 0.2s ease',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                          {/* Priority number */}
                          <div style={{
                            flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 700,
                            background: isCompleted ? 'rgba(16,185,129,0.15)' : 'rgba(255,158,66,0.08)',
                            color: isCompleted ? '#10b981' : 'var(--text-muted)',
                          }}>
                            {isCompleted ? '✓' : rec.priority_order}
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <h3 style={{
                                fontSize: '15px', fontWeight: 600, margin: 0,
                                color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                                textDecoration: isCompleted ? 'line-through' : 'none',
                              }}>
                                {rec.skill_name}
                              </h3>
                              <span style={{ padding: '2px 8px', background: d.bg, border: `1px solid ${d.bd}`, borderRadius: '4px', fontSize: '10px', color: d.tx, fontWeight: 600 }}>
                                {rec.skill_difficulty}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rec.skill_category}</span>
                            </div>

                            {rec.reason && (
                              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '4px 0 0', lineHeight: '1.5' }}>{rec.reason}</p>
                            )}

                            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                              <span>Level: {rec.recommended_level}</span>
                              <span>•</span>
                              <span style={{ color: isCompleted ? '#10b981' : isCurrent ? 'var(--accent)' : 'var(--text-muted)' }}>
                                {isCompleted ? '● Mastered' : isCurrent ? '◐ In Progress' : '○ To Learn'}
                              </span>
                            </div>
                          </div>

                          {/* Action — sequential: only current/next skill is actionable */}
                          <div style={{ flexShrink: 0 }}>
                            {isCurrent && (
                              <button
                                onClick={() => handleLearned(rec.id)}
                                disabled={isUpdating}
                                className="btn-primary"
                                style={{ fontSize: '12px', padding: '8px 18px', fontWeight: 600 }}
                              >
                                {isUpdating ? '...' : "I've Learned This"}
                              </button>
                            )}
                            {isNext && !currentSkill && (
                              <button
                                onClick={() => handleStartFirst(rec.id)}
                                disabled={isUpdating}
                                className="btn-outline"
                                style={{ fontSize: '12px', padding: '8px 18px', fontWeight: 600, borderColor: 'var(--accent)', color: 'var(--accent)' }}
                              >
                                {isUpdating ? '...' : 'Start Learning'}
                              </button>
                            )}
                            {isCompleted && (
                              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>✓ Done</span>
                            )}
                            {isPending && !isNext && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Locked</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No recommendations */}
            {!generating && recommendations.length === 0 && selectedCareer && (
              <div style={{ textAlign: 'center', padding: '64px 20px' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No skill recommendations yet for {careerName}.</p>
                <button onClick={handleRefresh} className="btn-primary" style={{ marginTop: '16px', fontSize: '13px', padding: '10px 24px' }}>
                  Generate Skill Roadmap
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
