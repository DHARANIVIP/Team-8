'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardNavbar from '@/components/DashboardNavbar';
import { getSkillRecommendations, updateSkillRecommendationStatus } from '@/lib/services/skill-service';
import type { SkillRecommendation, SkillRecStatus } from '@/lib/types/skills';
import { toast } from 'sonner';

interface CareerOption {
  id: string;
  name: string;
  matchPercentage?: number;
}

const DIFF_COLORS: Record<string, { bg: string; bd: string; tx: string }> = {
  Easy: { bg: 'rgba(16,185,129,0.06)', bd: 'rgba(16,185,129,0.3)', tx: '#10b981' },
  Medium: { bg: 'rgba(245,158,11,0.06)', bd: 'rgba(245,158,11,0.3)', tx: '#f59e0b' },
  Hard: { bg: 'rgba(239,68,68,0.06)', bd: 'rgba(239,68,68,0.3)', tx: '#ef4444' },
};

export default function SkillsPage() {
  const router = useRouter();

  const [availableCareers, setAvailableCareers] = useState<CareerOption[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<CareerOption | null>(null);
  
  const [recommendations, setRecommendations] = useState<SkillRecommendation[]>([]);
  const [careerName, setCareerName] = useState('');
  const [gapSummary, setGapSummary] = useState<{ missing: number; weak: number; total: number } | null>(null);
  const [currentSkills, setCurrentSkills] = useState<any[]>([]);
  const [recentlyCompleted, setRecentlyCompleted] = useState<any[]>([]);
  const [nextRecommended, setNextRecommended] = useState<any | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [highlightedSkillId, setHighlightedSkillId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // 1. Core Loader
  const loadRoadmap = useCallback(async (careerId: string, force = false) => {
    try {
      if (force) setRefreshing(true);
      setError('');
      const data = await getSkillRecommendations(careerId, force);
      
      setRecommendations(data.recommendations || []);
      setCareerName(data.career || '');
      setGapSummary(data.gapSummary || null);
      
      // Extended fields from enriched backend response
      setCurrentSkills((data as any).currentSkills || []);
      setRecentlyCompleted((data as any).recentlyCompleted || []);
      setNextRecommended((data as any).nextRecommended || null);
    } catch (err: any) {
      console.error('Failed to load roadmap data:', err);
      setError(err.message || 'Failed to load skill roadmap.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Initialize Page
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
          if (analysisRes.status === 401) { router.push('/login'); return; }
          setError('Failed to load profile. Please complete onboarding first.');
          setLoading(false);
          return;
        }

        const analysisData = await analysisRes.json();
        const savedCareers = analysisData?.recommendations?.saved_careers || [];

        if (savedCareers.length === 0) {
          setError('Please complete onboarding and generate recommended careers first!');
          setLoading(false);
          return;
        }

        const careerOptions: CareerOption[] = savedCareers.map((c: any) => ({
          id: c.careerId || c.career_id || c.id,
          name: c.careerName || c.career_name || c.name || 'Unknown Career',
          matchPercentage: c.matchPercentage || c.match_percentage || 0,
        }));

        setAvailableCareers(careerOptions);
        
        // Load roadmap for the top recommended career by default
        const topCareer = careerOptions.reduce((top, c) => ((c.matchPercentage ?? 0) > (top.matchPercentage ?? 0) ? c : top), careerOptions[0]);
        if (topCareer) {
          setSelectedCareer(topCareer);
          await loadRoadmap(topCareer.id);
        }
      } catch (err: any) {
        console.error('Init error:', err);
        setError(err.message || 'Initialization failed.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router, loadRoadmap]);

  // Handle Mark as Learned / Start Learning status updates
  const handleStatusChange = async (recId: string, newStatus: SkillRecStatus) => {
    if (!selectedCareer) return;
    setUpdatingId(recId);
    try {
      await updateSkillRecommendationStatus(recId, newStatus);
      toast.success(newStatus === 'completed' ? 'Skill marked as mastered!' : 'Learning path updated.');
      
      // Recalculate gap in backend and refresh roadmap data immediately
      await loadRoadmap(selectedCareer.id);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update skill progression.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCareerChange = async (careerId: string) => {
    const career = availableCareers.find(c => c.id === careerId);
    if (!career) return;
    setSelectedCareer(career);
    await loadRoadmap(careerId);
  };

  const handleRefresh = async () => {
    if (selectedCareer) await loadRoadmap(selectedCareer.id, true);
  };

  // Group current user skills by category
  const getSkillsByCategory = () => {
    const grouped: Record<string, any[]> = {};
    currentSkills.forEach(s => {
      const cat = s.category || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(s);
    });
    return grouped;
  };

  // Highlight a skill node when clicking its prerequisite
  const scrollToSkill = (skillName: string) => {
    const target = recommendations.find(r => r.skill_name.toLowerCase() === skillName.toLowerCase());
    if (target) {
      setHighlightedSkillId(target.id);
      setTimeout(() => setHighlightedSkillId(null), 3000);
      const element = document.getElementById(`skill-node-${target.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      toast.info(`"${skillName}" is already completed or in your active profile.`);
    }
  };

  // Compute overall progress metrics
  const completedCount = recommendations.filter(r => r.status === 'completed').length;
  const totalCount = recommendations.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  return (
    <div style={{ background: 'var(--color-bg-main)', minHeight: '100vh', color: 'var(--color-text-primary)' }}>
      <DashboardNavbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        
        {/* Career Context Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBottom: '20px', borderBottom: '1px solid var(--color-border-light)', marginBottom: '32px'
        }}>
          <div>
            <span className="section-label" style={{ display: 'block', marginBottom: '4px' }}>LEARNING ROADMAP</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '30px', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                Skills Path: {careerName || 'Career Roadmap'}
              </h1>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', margin: '6px 0 0' }}>
              Target career context: <strong style={{ color: 'var(--color-primary)' }}>{careerName}</strong>. Not your target?{' '}
              <Link href="/dashboard/career" style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: 600 }}>
                Update in Career Guidance
              </Link>
            </p>
          </div>
          {selectedCareer && (
            <button onClick={handleRefresh} disabled={refreshing} className="btn-outline" style={{ fontSize: '12px', padding: '8px 16px' }}>
              {refreshing ? 'Recalculating Gaps...' : '↻ Re-Analyze Path'}
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div className="spinner" style={{ margin: '0 auto 24px', borderColor: 'var(--color-primary) transparent transparent transparent' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>Mapping skill gaps and aligning learning pathway...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && (error || (!selectedCareer && recommendations.length === 0)) && (
          <div className="card" style={{ textAlign: 'center', padding: '80px 24px', maxWidth: '600px', margin: '0 auto' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🎯</span>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Action Required</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              {error || 'Select a career recommendation path to begin dynamic skill alignment.'}
            </p>
            <Link href="/dashboard/career" className="btn-primary" style={{ padding: '10px 24px', textDecoration: 'none' }}>
              Go to Career Guidance
            </Link>
          </div>
        )}

        {/* Main Content Layout */}
        {!loading && !error && selectedCareer && (
          <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '32px', alignItems: 'flex-start' }}>
            
            {/* LEFT COLUMN: ACTIVE SEQUENCE & NEXT CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Next Recommended Skill CTA Card */}
              {nextRecommended && !allCompleted && (
                <div style={{
                  background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-bg-card) 100%)',
                  border: '1px solid var(--color-primary)', padding: '24px', borderRadius: '12px',
                  boxShadow: '0 0 15px rgba(59, 130, 246, 0.05)', position: 'relative'
                }}>
                  <span style={{
                    position: 'absolute', top: '20px', right: '20px', fontSize: '11px', fontWeight: 700,
                    background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px'
                  }}>
                    TOP ACTION FOCUS
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--color-primary)', fontSize: '18px', fontWeight: 800 }}>⚡ Next Recommended:</span>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                      {nextRecommended.skill_name}
                    </h3>
                  </div>

                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', margin: '0 0 16px', lineHeight: '1.5', opacity: 0.9 }}>
                    {nextRecommended.reason}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
                    <span style={{
                      padding: '2px 8px', background: DIFF_COLORS[nextRecommended.skill_difficulty]?.bg || 'rgba(255,255,255,0.03)',
                      color: DIFF_COLORS[nextRecommended.skill_difficulty]?.tx || 'var(--color-text-primary)', border: `1px solid ${DIFF_COLORS[nextRecommended.skill_difficulty]?.bd || 'var(--color-border-light)'}`,
                      borderRadius: '4px', fontSize: '11px', fontWeight: 600
                    }}>
                      Level: {nextRecommended.recommended_level}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Category: {nextRecommended.skill_category}
                    </span>
                    
                    {nextRecommended.prerequisites?.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Prerequisites:</span>
                        {nextRecommended.prerequisites.map((pre: string) => (
                          <span
                            key={pre} onClick={() => scrollToSkill(pre)}
                            style={{
                              fontSize: '10px', background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                              padding: '1px 6px', borderRadius: '3px', border: '1px solid var(--color-border-light)', cursor: 'pointer'
                            }}
                          >
                            {pre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    {nextRecommended.status === 'in_progress' ? (
                      <button
                        onClick={() => handleStatusChange(nextRecommended.id, 'completed')}
                        disabled={updatingId === nextRecommended.id}
                        className="btn-primary"
                        style={{ fontSize: '13px', padding: '8px 20px', fontWeight: 700 }}
                      >
                        {updatingId === nextRecommended.id ? '...' : "✓ Mark as Mastered"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(nextRecommended.id, 'in_progress')}
                        disabled={updatingId === nextRecommended.id}
                        className="btn-primary"
                        style={{ fontSize: '13px', padding: '8px 20px', fontWeight: 700 }}
                      >
                        {updatingId === nextRecommended.id ? '...' : '▶ Start Learning'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Recommended Sequenced learning order View */}
              <div className="card" style={{ padding: '24px 28px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px', color: 'var(--color-text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                  Recommended Learning Path
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', position: 'relative' }}>
                  {recommendations.map((rec, index) => {
                    const isCompleted = rec.status === 'completed';
                    const isInProgress = rec.status === 'in_progress';
                    const isPending = !rec.status || rec.status === 'pending';
                    
                    const isHighlighted = highlightedSkillId === rec.id;
                    
                    const nextActionable = isPending && !recommendations.slice(0, index).some(r => r.status === 'pending');
                    const d = DIFF_COLORS[rec.skill_difficulty] || DIFF_COLORS.Medium;

                    return (
                      <div
                        id={`skill-node-${rec.id}`}
                        key={rec.id}
                        style={{
                          display: 'flex', gap: '20px', position: 'relative', paddingBottom: index === recommendations.length - 1 ? '0' : '28px',
                          opacity: isCompleted ? 0.7 : 1, transition: 'all 0.3s ease'
                        }}
                      >
                        {/* Connecting Line */}
                        {index < recommendations.length - 1 && (
                          <div style={{
                            position: 'absolute', left: '16px', top: '32px', bottom: '0', width: '2px',
                            background: isCompleted ? '#10b981' : 'var(--color-border-medium)', zIndex: 1
                          }} />
                        )}

                        {/* Interactive Dot Indicator */}
                        <div style={{
                          zIndex: 2, flexShrink: 0, width: '34px', height: '34px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 800,
                          background: isCompleted ? 'rgba(16,185,129,0.15)' : isInProgress ? 'var(--color-primary-light)' : 'var(--color-bg-secondary)',
                          color: isCompleted ? '#10b981' : isInProgress ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          border: `2px solid ${isCompleted ? '#10b981' : isInProgress ? 'var(--color-primary)' : 'var(--color-border-medium)'}`
                        }}>
                          {isCompleted ? '✓' : rec.priority_order}
                        </div>

                        {/* Main Info Card */}
                        <div style={{
                          flex: 1, padding: '16px 20px', background: isHighlighted ? 'var(--color-primary-light)' : 'var(--color-bg-secondary)',
                          border: isHighlighted ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border-light)', borderRadius: '8px',
                          boxShadow: isHighlighted ? '0 0 10px rgba(59, 130, 246, 0.1)' : 'none', transition: 'all 0.2s ease',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px'
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                              <h3 style={{
                                fontSize: '15px', fontWeight: 700, margin: 0, color: isCompleted ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                                textDecoration: isCompleted ? 'line-through' : 'none'
                              }}>
                                {rec.skill_name}
                              </h3>
                              <span style={{
                                fontSize: '9px', background: d.bg, color: d.tx, border: `1px solid ${d.bd}`,
                                padding: '1px 6px', borderRadius: '3px', fontWeight: 700
                              }}>
                                {rec.skill_difficulty}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{rec.skill_category}</span>
                            </div>

                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: '0 0 8px', lineHeight: '1.4' }}>
                              {rec.reason}
                            </p>

                            {/* Prerequisites links */}
                            {(rec as any).prerequisites?.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', fontSize: '11px', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Requires:</span>
                                {(rec as any).prerequisites.map((pre: string) => (
                                  <span
                                    key={pre} onClick={() => scrollToSkill(pre)}
                                    style={{
                                      background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                                      padding: '1px 6px', borderRadius: '3px', border: '1px solid var(--color-border-light)', cursor: 'pointer'
                                    }}
                                  >
                                    {pre}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                              <span>Recommended level: <strong style={{ color: 'var(--color-text-primary)' }}>{rec.recommended_level}</strong></span>
                              <span>•</span>
                              <span style={{ color: isCompleted ? '#10b981' : isInProgress ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                                {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Locked'}
                              </span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div style={{ flexShrink: 0 }}>
                            {isCompleted && (
                              <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                🏆 Mastered
                              </span>
                            )}
                            {isInProgress && (
                              <button
                                onClick={() => handleStatusChange(rec.id, 'completed')}
                                disabled={updatingId === rec.id}
                                className="btn-primary"
                                style={{ fontSize: '11px', padding: '6px 12px' }}
                              >
                                {updatingId === rec.id ? '...' : 'Complete'}
                              </button>
                            )}
                            {isPending && (nextActionable || !nextRecommended) && (
                              <button
                                onClick={() => handleStatusChange(rec.id, 'in_progress')}
                                disabled={updatingId === rec.id}
                                className="btn-outline"
                                style={{ fontSize: '11px', padding: '6px 12px', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                              >
                                {updatingId === rec.id ? '...' : 'Start'}
                              </button>
                            )}
                            {isPending && !nextActionable && nextRecommended && (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Locked</span>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: PROGRESS & CURRENT MATRIX */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Target Career Selection Context */}
              {availableCareers.length > 1 && (
                <div className="card" style={{ padding: '20px 24px' }}>
                  <label style={{
                    display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)',
                    marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    Switch Target Career Context
                  </label>
                  <select
                    value={selectedCareer.id}
                    onChange={(e) => handleCareerChange(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', background: 'var(--color-bg-main)',
                      border: '1px solid var(--color-border-light)', borderRadius: '6px', color: 'var(--color-text-primary)',
                      fontSize: '14px', outline: 'none', cursor: 'pointer'
                    }}
                  >
                    {availableCareers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Progress Tracker Card */}
              <div className="card" style={{ padding: '24px' }}>
                <span className="section-label">ROADMAP SUITABILITY METRIC</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 10px' }}>
                  <div>
                    <h3 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)', fontFamily: 'Inter, sans-serif' }}>
                      {progressPercent}%
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Overall Completeness</span>
                  </div>
                  {gapSummary && (
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', textAlign: 'center' }}>
                      <div>
                        <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '16px' }}>{gapSummary.missing}</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>Missing</div>
                      </div>
                      <div>
                        <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '16px' }}>{gapSummary.weak}</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>Weak</div>
                      </div>
                      <div>
                        <div style={{ color: '#10b981', fontWeight: 800, fontSize: '16px' }}>{completedCount}</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>Mastered</div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ height: '8px', background: 'var(--color-border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>

              {/* Recently Completed Skills */}
              {recentlyCompleted.length > 0 && (
                <div className="card" style={{ padding: '20px 24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px', color: 'var(--color-text-primary)', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Recently Completed Skills
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {recentlyCompleted.slice(0, 8).map((skill) => (
                      <span key={skill.id} style={{
                        fontSize: '11px', background: 'rgba(16,185,129,0.06)', color: '#10b981',
                        border: '1px solid rgba(16,185,129,0.2)', padding: '2px 8px', borderRadius: '4px'
                      }}>
                        ✓ {skill.skill_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Skills Panel Grouped by Category */}
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px', color: 'var(--color-text-primary)', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Your Current Skills
                </h3>

                {currentSkills.length === 0 ? (
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', margin: 0 }}>
                    No skills mapped to your profile yet. Mark roadmaps complete or complete onboarding to populate your skills profile.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {Object.entries(getSkillsByCategory()).map(([category, skills]) => (
                      <div key={category}>
                        <h4 style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {category}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {skills.map((skill) => (
                            <div key={skill.id} style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                              <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{skill.skill_name}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  fontSize: '10px', color: skill.proficiency === 'Expert' ? '#50c878' : skill.proficiency === 'Intermediate' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                  background: skill.proficiency === 'Expert' ? 'rgba(80,200,120,0.08)' : 'transparent', padding: '1px 6px', borderRadius: '3px'
                                }}>
                                  {skill.proficiency}
                                </span>
                                <div style={{ width: '50px', height: '4px', background: 'var(--color-border-light)', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{
                                    width: `${skill.progress_percentage || 50}%`, height: '100%',
                                    background: skill.proficiency === 'Expert' ? '#50c878' : 'var(--color-primary)'
                                  }} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
