'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { isAuthenticated, getToken } from '@/lib/services/auth-service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/* ── reusable primitives ── */
function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px 32px' }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, children, action }: { icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: 'var(--color-primary)', fontSize: '18px', display: 'inline-flex' }}>{icon}</span>
        <h2 style={{ color: 'var(--color-text-primary)', fontWeight: 700, fontSize: '18px', margin: 0, fontFamily: 'Outfit, sans-serif' }}>{children}</h2>
      </div>
      {action}
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  const bg = color === 'green' ? 'rgba(16,185,129,0.1)' : color === 'amber' ? 'rgba(245,158,11,0.1)' : 'var(--color-primary-light)';
  const bd = color === 'green' ? 'rgba(16,185,129,0.3)' : color === 'amber' ? 'rgba(245,158,11,0.3)' : 'var(--color-border-light)';
  const tx = color === 'green' ? '#10b981' : color === 'amber' ? '#f59e0b' : 'var(--color-primary)';
  return (
    <span style={{ padding: '4px 10px', background: bg, border: `1px solid ${bd}`, borderRadius: '4px', fontSize: '12px', color: tx, fontWeight: 600 }}>
      {label}
    </span>
  );
}

/* ── interfaces ── */
interface CareerRecommendation {
  careerId: string;
  careerName: string;
  matchPercentage: number;
  reason: string;
  strengths: string[];
  missingSkills: string[];
  salaryRange: string;
  demandLevel: string;
  growthRate: string;
}

/* ── main component ── */
export default function AICareerGuidancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [expandedCareer, setExpandedCareer] = useState<string | null>(null);
  const [analysisDate, setAnalysisDate] = useState<string>('');
  const loadingRef = useRef(false);
  const generatingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    loadRecommendations();
  }, [router]);

  const loadRecommendations = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      setLoading(true);
      setError('');
      const token = getToken();

      // Fetch existing analysis from database
      const analysisRes = await fetch(`${API_URL}/api/career/analysis`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (analysisRes.status === 400) { router.push('/onboarding'); return; }

      const analysisData = await analysisRes.json();

      if (analysisData.recommendations?.saved_careers?.length > 0) {
        setRecommendations(analysisData.recommendations.saved_careers);
        setAnalysisDate(analysisData.analysisDate || '');
      } else {
        // No saved recommendations — auto-generate fresh ones
        await autoGenerateRecommendations();
      }
    } catch (err: any) {
      console.error('Failed to load career data:', err);
      setError('Failed to load career data. Please try again.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const autoGenerateRecommendations = async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    try {
      setGenerating(true);
      setError('');
      const token = getToken();
      const res = await fetch(`${API_URL}/api/career/recommendations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.status === 202 || data.inProgress) {
        setError(data.message || 'Career recommendations are already being generated. Please refresh shortly.');
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to generate recommendations');
      setRecommendations(data.recommendations || []);
      setAnalysisDate(new Date().toISOString());
    } catch (err: any) {
      console.error('Failed to auto-generate recommendations:', err);
      setError(err.message || 'AI analysis failed. Please try again.');
    } finally {
      generatingRef.current = false;
      setGenerating(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setGenerating(true);
      setError('');
      const token = getToken();
      const res = await fetch(`${API_URL}/api/career/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to refresh analysis');
      setRecommendations(data.recommendations || []);
      setAnalysisDate(new Date().toISOString());
    } catch (err: any) {
      setError(err.message || 'Refresh failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  /* ── loading state ── */
  if (loading) {
    return (
      <div style={{ background: 'var(--color-bg-main)', minHeight: '100vh', color: 'var(--color-text-primary)' }}>
        <DashboardNavbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ marginBottom: '24px', borderColor: 'var(--color-primary) transparent transparent transparent' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading your AI career analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = analysisDate
    ? new Date(analysisDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  const refreshBtn = (
    <button
      onClick={handleRefresh}
      disabled={generating}
      className="btn-outline"
      style={{ fontSize: '12px', padding: '6px 14px', fontWeight: 600 }}
    >
      {generating ? 'Analyzing...' : 'Refresh'}
    </button>
  );

  return (
    <div style={{ background: 'var(--color-bg-main)', minHeight: '100vh', color: 'var(--color-text-primary)' }}>
      <DashboardNavbar />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif', color: 'var(--color-text-primary)' }}>
              AI Career Guidance
            </h1>
            {formattedDate && (
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500, padding: '3px 10px', background: 'var(--color-bg-secondary)', borderRadius: '4px', border: '1px solid var(--color-border-light)' }}>
                {formattedDate}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
            Personalized career recommendations powered by AI analysis of your profile and resume
          </p>
        </div>

        {error && (
          <div style={{
            padding: '14px 18px', background: '#FEE2E2',
            border: '1px solid rgba(220, 38, 38, 0.25)', color: '#DC2626',
            fontSize: '13px', borderRadius: '8px', marginBottom: '24px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Recommendations */}
          {generating ? (
            <Section>
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <div className="spinner" style={{ marginBottom: '20px', borderColor: 'var(--color-primary) transparent transparent transparent' }} />
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-primary)' }}>AI is Analyzing Your Profile</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Generating personalized career recommendations...</p>
              </div>
            </Section>
          ) : recommendations.length > 0 ? (
            <Section>
              <SectionTitle icon="💼" action={refreshBtn}>Recommended Career Paths</SectionTitle>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recommendations.map((rec) => {
                  const isExpanded = expandedCareer === rec.careerId;
                  return (
                    <div
                      key={rec.careerId}
                      onClick={() => setExpandedCareer(isExpanded ? null : rec.careerId)}
                      style={{
                        padding: '22px 24px', background: 'var(--color-bg-secondary)',
                        border: isExpanded ? '2px solid var(--color-primary)' : '1px solid var(--color-border-light)',
                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Top row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-primary)' }}>{rec.careerName}</h3>
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: '1.55', margin: 0 }}>{rec.reason}</p>
                        </div>
                        <span style={{ padding: '6px 14px', background: 'var(--color-primary-light)', border: '1px solid var(--color-border-light)', borderRadius: '4px', fontSize: '12px', color: 'var(--color-primary)', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          Top Match
                        </span>
                      </div>

                      {/* Skills row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 700, marginBottom: '8px', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Strengths
                          </p>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {rec.strengths.slice(0, 3).map((s, i) => <Pill key={i} label={s} color="green" />)}
                          </div>
                        </div>
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 700, marginBottom: '8px', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Skills to Develop
                          </p>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {rec.missingSkills.slice(0, 3).map((s, i) => <Pill key={i} label={s} color="amber" />)}
                          </div>
                        </div>
                      </div>

                      {/* Meta row */}
                      <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '14px' }}>
                        <span>{rec.salaryRange}</span>
                        <span>Demand: {rec.demandLevel}</span>
                        <span>Growth: {rec.growthRate}</span>
                      </div>

                      {/* Expanded actions */}
                      {isExpanded && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border-light)', display: 'flex', gap: '10px' }}>
                          <Link href={`/dashboard/roadmaps?career=${rec.careerId}`}>
                            <button className="btn-primary" style={{ fontSize: '12px', padding: '8px 18px', fontWeight: 600 }}>
                              View Learning Roadmap
                            </button>
                          </Link>
                          <Link href="/dashboard/compare">
                            <button className="btn-outline" style={{ fontSize: '12px', padding: '8px 18px', fontWeight: 600 }}>
                              Compare Careers
                            </button>
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          ) : (
            <Section>
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <div className="spinner" style={{ marginBottom: '20px', borderColor: 'var(--color-primary) transparent transparent transparent' }} />
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-primary)' }}>Preparing Your Analysis</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                  AI is generating your personalized career recommendations...
                </p>
              </div>
            </Section>
          )}
        </div>
      </main>
    </div>
  );
}
