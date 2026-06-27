'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { isAuthenticated } from '@/lib/services/auth-service';
import { getProfile } from '@/lib/services/profile-service';
import { getCategories } from '@/lib/services/career-service';
import {
  getUserSkills,
  getSkillGapAnalysis,
  getSkillsOverview,
  getSkillsAdvisor,
  getCareerReadiness,
  triggerAISkillsAnalysis,
} from '@/lib/services/skill-service';
import type {
  CareerReadiness,
  GapAnalysisResponse,
  SkillsAdvisorResponse,
  SkillsOverview,
  SkillsTab,
  UserSkill,
} from '@/lib/types/skills';
import {
  SkillsKpiStrip,
  SkillsTabNav,
  AddSkillModal,
  SkillsSidebar,
  OverviewTab,
  ProfileTab,
  GapAnalysisTab,
  SkillMatrixTab,
  CareerFitTab,
} from '@/features/skills';

export default function SkillsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<SkillsTab>('overview');
  const [initialLoading, setInitialLoading] = useState(true);
  const [gapLoading, setGapLoading] = useState(false);
  const [fitLoading, setFitLoading] = useState(false);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [careersList, setCareersList] = useState<{ id: string; name: string }[]>([]);
  const [selectedCareerId, setSelectedCareerId] = useState('');
  const [mySkills, setMySkills] = useState<UserSkill[]>([]);
  const [overview, setOverview] = useState<SkillsOverview | null>(null);
  const [gap, setGap] = useState<GapAnalysisResponse | null>(null);
  const [advisor, setAdvisor] = useState<SkillsAdvisorResponse | null>(null);
  const [careerReadiness, setCareerReadiness] = useState<CareerReadiness[]>([]);

  const loadSkills = useCallback(async () => {
    const skills = await getUserSkills();
    setMySkills(skills);
    return skills;
  }, []);

  const loadGap = useCallback(async (careerId: string) => {
    if (!careerId) return;
    setGapLoading(true);
    try {
      const data = await getSkillGapAnalysis(careerId);
      setGap(data);
    } catch (err) {
      console.error('Gap load failed:', err);
    } finally {
      setGapLoading(false);
    }
  }, []);

  const loadOverviewAndAdvisor = useCallback(async (careerId: string) => {
    setAdvisorLoading(true);
    try {
      const [overviewResult, advisorResult] = await Promise.allSettled([
        getSkillsOverview(careerId || undefined),
        getSkillsAdvisor(careerId || undefined),
      ]);

      if (overviewResult.status === 'fulfilled') {
        setOverview(overviewResult.value);
      } else {
        console.error('Overview load failed:', overviewResult.reason);
      }

      if (advisorResult.status === 'fulfilled') {
        setAdvisor(advisorResult.value);
      } else {
        console.error('Advisor load failed:', advisorResult.reason);
      }

      if (overviewResult.status === 'rejected' && advisorResult.status === 'rejected') {
        console.warn('Overview and advisor unavailable, page will use partial data');
      }
    } catch (err) {
      console.error('Overview/advisor load failed:', err);
    } finally {
      setAdvisorLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async (careerId: string) => {
    await loadSkills();
    await Promise.all([
      loadGap(careerId),
      loadOverviewAndAdvisor(careerId),
    ]);
  }, [loadSkills, loadGap, loadOverviewAndAdvisor]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    async function init() {
      try {
        setInitialLoading(true);
        setError('');

        const profile = await getProfile();
        if (!profile.onboarding_completed) {
          router.push('/onboarding');
          return;
        }

        const categoriesResponse = await getCategories();
        const list = categoriesResponse.categories || [];
        setCareersList(list);

        let careerId = '';
        if (list.length > 0) {
          const matched = list.find(
            (c: { name: string }) =>
              c.name.toLowerCase() === (profile.target_career || '').toLowerCase()
          );
          careerId = matched?.id || list[0].id;
          setSelectedCareerId(careerId);
        }

        await loadSkills();
        if (careerId) {
          await Promise.all([
            loadGap(careerId),
            loadOverviewAndAdvisor(careerId),
          ]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load skills data');
      } finally {
        setInitialLoading(false);
      }
    }

    init();
  }, [router, loadSkills, loadGap, loadOverviewAndAdvisor]);

  useEffect(() => {
    if (!selectedCareerId || initialLoading) return;
    loadGap(selectedCareerId);
    loadOverviewAndAdvisor(selectedCareerId);
  }, [selectedCareerId, initialLoading, loadGap, loadOverviewAndAdvisor]);

  useEffect(() => {
    if (activeTab !== 'fit' || careerReadiness.length > 0) return;

    async function loadFit() {
      setFitLoading(true);
      try {
        const scores = await getCareerReadiness();
        setCareerReadiness(scores);
      } catch (err) {
        console.error('Career fit load failed:', err);
      } finally {
        setFitLoading(false);
      }
    }

    loadFit();
  }, [activeTab, careerReadiness.length]);

  const handleAnalyze = async () => {
    try {
      setAiAnalyzing(true);
      setError('');
      await triggerAISkillsAnalysis();
      await refreshAll(selectedCareerId);
      if (activeTab === 'fit') {
        const scores = await getCareerReadiness();
        setCareerReadiness(scores);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI analysis failed');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleRefresh = () => refreshAll(selectedCareerId);

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#ffffff' }}>
      <DashboardNavbar />

      <main className="page-container animate-slide-up" style={{ padding: '24px 0', maxWidth: '1100px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '20px',
            borderBottom: '1px solid rgba(255, 158, 66, 0.15)',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <span className="section-label" style={{ display: 'block', marginBottom: '2px' }}>SKILL INTELLIGENCE</span>
            <h1 style={{ color: '#ffffff', fontWeight: 700, fontSize: '24px', margin: 0, letterSpacing: '0.5px', fontFamily: 'Outfit, sans-serif' }}>
              Skills Hub
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>
              Track proficiencies, analyze gaps, and plan your learning path with real career data.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowAddModal(true)}
              style={{ fontSize: '12px', padding: '10px 16px' }}
            >
              + Add Skill
            </button>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={aiAnalyzing}
              className="btn-primary"
              style={{ fontSize: '12px', padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              {aiAnalyzing ? (
                <>
                  <span className="spinner" style={{ width: '12px', height: '12px', border: '2px solid #000', borderTop: '2px solid transparent' }} />
                  Analyzing...
                </>
              ) : (
                <>🤖 Analyze via AI</>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '16px', background: 'rgba(239,68,68,0.06)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '13px', borderRadius: '4px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {initialLoading ? (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            <SkillsKpiStrip overview={overview} />

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '24px', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
                <SkillsTabNav activeTab={activeTab} onTabChange={setActiveTab} skillCount={mySkills.length} />

                {activeTab === 'overview' && (
                  <OverviewTab
                    overview={overview}
                    gap={gap}
                    advisor={advisor}
                    onGoToGap={() => setActiveTab('gap')}
                    onAnalyze={handleAnalyze}
                    aiAnalyzing={aiAnalyzing}
                  />
                )}
                {activeTab === 'profile' && (
                  <ProfileTab skills={mySkills} onRefresh={handleRefresh} />
                )}
                {activeTab === 'gap' && (
                  <GapAnalysisTab
                    careers={careersList}
                    selectedCareerId={selectedCareerId}
                    onCareerChange={setSelectedCareerId}
                    gap={gap}
                    loading={gapLoading}
                    onRefresh={handleRefresh}
                  />
                )}
                {activeTab === 'matrix' && <SkillMatrixTab skills={mySkills} />}
                {activeTab === 'fit' && (
                  <CareerFitTab
                    readiness={careerReadiness}
                    loading={fitLoading}
                    onSelectCareer={setSelectedCareerId}
                    onGoToGap={setActiveTab}
                  />
                )}
              </div>

              <SkillsSidebar gap={gap} advisor={advisor} advisorLoading={advisorLoading} />
            </div>
          </>
        )}
      </main>

      <AddSkillModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={handleRefresh}
        existingNames={mySkills.map(s => s.skill_name)}
      />
    </div>
  );
}
