'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';
import { parseResponse } from '@/lib/services/fetch-utils';

interface ResourceItem {
  id: string;
  title: string;
  url: string;
  resource_type: string;
}

interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  sequence_order: number;
  resources: ResourceItem[];
}

interface RoadmapDetail {
  id: string;
  name: string;
  category: string;
  description: string;
  difficulty_level: string;
  estimated_duration: string;
  nodes: RoadmapNode[];
}

const ACCENT = '#ff9e42';
const ACCENT_RGBA = 'rgba(255,158,66,0.10)';
const ACCENT_BORDER = 'rgba(255,158,66,0.30)';

export default function RoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [roadmap, setRoadmap] = useState<RoadmapDetail | null>(null);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'interactive' | 'pdf'>('interactive');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchRoadmapDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/roadmaps/${id}`);
      const data = await parseResponse(res);
      setRoadmap(data);
      
      // Select first node by default
      if (data.nodes && data.nodes.length > 0) {
        setSelectedNode(data.nodes[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Server timeout or connection failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRoadmapDetails();
      
      // Load completed nodes checklist state from LocalStorage
      const savedCompleted = localStorage.getItem(`roadmap_completed_${id}`);
      if (savedCompleted) {
        setCompletedNodes(JSON.parse(savedCompleted));
      }
    }
  }, [id]);

  const toggleNodeCompletion = (nodeId: string) => {
    let updated;
    if (completedNodes.includes(nodeId)) {
      updated = completedNodes.filter(i => i !== nodeId);
    } else {
      updated = [...completedNodes, nodeId];
    }
    setCompletedNodes(updated);
    localStorage.setItem(`roadmap_completed_${id}`, JSON.stringify(updated));
  };

  const calculateProgress = () => {
    if (!roadmap || !roadmap.nodes || roadmap.nodes.length === 0) return 0;
    const completed = roadmap.nodes.filter(n => completedNodes.includes(n.id)).length;
    return Math.round((completed / roadmap.nodes.length) * 100);
  };

  const pdfFilename = 
    id === 'frontend' || (roadmap && roadmap.name.toLowerCase().includes('frontend')) ? 'frontend.pdf' :
    id === 'backend' || (roadmap && roadmap.name.toLowerCase().includes('backend')) ? 'backend.pdf' :
    id === 'devops' || (roadmap && roadmap.name.toLowerCase().includes('devops')) ? 'devops.pdf' :
    id === 'ai-ml' || (roadmap && (roadmap.name.toLowerCase().includes('ai') || roadmap.name.toLowerCase().includes('machine') || roadmap.name.toLowerCase().includes('learning'))) ? 'machine-learning.pdf' :
    id === 'claude-code' || (roadmap && roadmap.name.toLowerCase().includes('claude')) ? 'claude-code.pdf' :
    id === 'vibe-coding' || (roadmap && roadmap.name.toLowerCase().includes('vibe')) ? 'vibe-coding.pdf' : null;

  return (
    <div style={{ background: 'var(--color-bg-main)', minHeight: '100vh' }}>
      <DashboardNavbar />

      <main className="page-container animate-slide-up" style={{ padding: '24px 0' }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <Link href="/dashboard/roadmaps" style={{
            color: 'var(--color-primary)',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            border: '1px solid var(--color-primary)',
            borderRadius: '6px',
            background: 'var(--color-primary-light)',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--color-primary-light)';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'var(--color-primary-light)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            ← Back to Roadmaps
          </Link>
        </div>

        {/* Error State */}
        {error && (
          <div style={{
            background: '#FEE2E2',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            borderRadius: '8px',
            padding: '16px',
            color: '#DC2626',
            fontSize: '13px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ height: '32px', width: '40%', background: 'var(--color-border-light)', borderRadius: '4px' }}></div>
            <div style={{ height: '14px', width: '60%', background: 'var(--color-border-light)', borderRadius: '4px' }}></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginTop: '16px' }}>
              <div style={{ height: '400px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: '8px' }}></div>
              <div style={{ height: '400px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: '8px' }}></div>
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        {!loading && roadmap && (
          <div>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '24px', marginBottom: '28px' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>
                  {roadmap.category} PATHWAY
                </span>
                <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.5px', color: 'var(--color-text-primary)' }}>
                  {roadmap.name}
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
                  {roadmap.description}
                </p>
              </div>

              {/* Progress Panel */}
              <div className="card" style={{ background: 'var(--color-bg-card)', padding: '16px 20px', border: '1px solid var(--color-border-card)', borderRadius: '12px', minWidth: '220px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                  <span>YOUR PROGRESS</span>
                  <span style={{ color: 'var(--color-primary)' }}>{calculateProgress()}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--color-primary-light)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ height: '100%', background: 'var(--color-primary)', width: `${calculateProgress()}%`, transition: 'width 0.3s ease' }}></div>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  {roadmap.nodes.filter(n => completedNodes.includes(n.id)).length} of {roadmap.nodes.length} steps completed
                </span>
              </div>
            </div>

            {/* Tab Switcher (Only if PDF is available) */}
            {pdfFilename && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px' }}>
                <button
                  onClick={() => setActiveTab('interactive')}
                  style={{
                    padding: '8px 18px',
                    background: activeTab === 'interactive' ? 'var(--color-primary-light)' : 'transparent',
                    border: `1px solid ${activeTab === 'interactive' ? 'var(--color-primary)' : 'var(--color-border-medium)'}`,
                    color: activeTab === 'interactive' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  🗺️ Interactive Path
                </button>
                <button
                  onClick={() => setActiveTab('pdf')}
                  style={{
                    padding: '8px 18px',
                    background: activeTab === 'pdf' ? 'var(--color-primary-light)' : 'transparent',
                    border: `1px solid ${activeTab === 'pdf' ? 'var(--color-primary)' : 'var(--color-border-medium)'}`,
                    color: activeTab === 'pdf' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📄 Official PDF Roadmap
                </button>
              </div>
            )}

            {activeTab === 'pdf' && pdfFilename ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-light)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Viewing original PDF roadmap: <strong>{pdfFilename}</strong></span>
                  <a 
                    href={`/${pdfFilename}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      padding: '8px 16px',
                      background: 'var(--color-primary)',
                      color: 'var(--color-bg-main)',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'opacity 0.2s'
                    }}
                  >
                    <span>📥</span> Open / Download PDF
                  </a>
                </div>
                
                <div style={{ border: '1px solid var(--color-border-light)', borderRadius: '8px', overflow: 'hidden', height: '80vh', background: 'var(--color-bg-secondary)' }}>
                  <iframe
                    src={`/${pdfFilename}#toolbar=1`}
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                  />
                </div>
              </div>
            ) : (
              /* Split timeline layout */
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
              
              {/* Left Column: Timeline list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
                {roadmap.nodes.map((node, index) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isCompleted = completedNodes.includes(node.id);
                  const hasNext = index < roadmap.nodes.length - 1;

                  return (
                    <div key={node.id} style={{ display: 'flex', gap: '20px', position: 'relative' }}>
                      
                      {/* Vertical connector line */}
                      {hasNext && (
                        <div style={{
                          position: 'absolute',
                          left: '17px',
                          top: '36px',
                          bottom: '-16px',
                          width: '2px',
                          borderLeft: isCompleted ? '2px solid var(--color-primary)' : '2px dashed var(--color-border-medium)',
                          zIndex: 1
                        }}></div>
                      )}

                      {/* Timeline circle node */}
                      <div
                        onClick={() => toggleNodeCompletion(node.id)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isCompleted ? 'var(--color-primary)' : isSelected ? 'var(--color-primary-light)' : 'var(--color-bg-secondary)',
                          border: `2px solid ${isCompleted || isSelected ? 'var(--color-primary)' : 'var(--color-border-medium)'}`,
                          color: isCompleted ? 'var(--color-bg-main)' : isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          zIndex: 2,
                          userSelect: 'none',
                          boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.1)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isCompleted ? '✓' : node.sequence_order}
                      </div>

                      {/* Content block */}
                      <div
                        onClick={() => setSelectedNode(node)}
                        className="card-hover"
                        style={{
                          flexGrow: 1,
                          padding: '16px 20px',
                          background: isSelected ? 'var(--color-primary-light)' : 'var(--color-bg-card)',
                          border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border-card)'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          marginBottom: '20px',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)', margin: 0 }}>
                            {node.title}
                          </h3>
                          <span style={{ fontSize: '10px', color: isCompleted ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: 600 }}>
                            {isCompleted ? 'ACQUIRED' : 'IN PROGRESS'}
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                          {node.description}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Right Column: Node details & resources panel */}
              <div style={{ position: 'sticky', top: '80px' }}>
                {selectedNode ? (
                  <div className="card" style={{ padding: '24px 28px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border-card)', borderRadius: '12px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      STEP {selectedNode.sequence_order} SYLLABUS
                    </span>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0 12px 0', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', color: 'var(--color-text-primary)' }}>
                      {selectedNode.title}
                    </h2>
                    
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 20px 0', lineHeight: 1.6 }}>
                      {selectedNode.description}
                    </p>

                    <div style={{ marginBottom: '24px' }}>
                      <button
                        onClick={() => toggleNodeCompletion(selectedNode.id)}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          background: completedNodes.includes(selectedNode.id) ? '#FEE2E2' : 'var(--color-primary-light)',
                          border: `1px solid ${completedNodes.includes(selectedNode.id) ? '#EF4444' : 'var(--color-primary)'}`,
                          color: completedNodes.includes(selectedNode.id) ? '#DC2626' : 'var(--color-primary)',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {completedNodes.includes(selectedNode.id) ? '✕ Mark Step Incomplete' : '✓ Mark Step Acquired'}
                      </button>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
                        LEARNING RESOURCES
                      </h4>
                      
                      {selectedNode.resources && selectedNode.resources.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {selectedNode.resources.map((res) => (
                            <a
                              key={res.id}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="card-hover"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 14px',
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border-light)',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                color: 'var(--color-text-primary)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span style={{ fontSize: '16px' }}>
                                {res.resource_type === 'Video' ? '📹' : res.resource_type === 'Course' ? '🎓' : '📄'}
                              </span>
                              <div style={{ flexGrow: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '12px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {res.title}
                                </p>
                                <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>
                                  {res.resource_type} • External resource
                                </span>
                              </div>
                              <span style={{ color: 'var(--color-primary)', fontSize: '11px', fontWeight: 600 }}>Open ↗</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '16px', background: 'var(--color-bg-secondary)', border: '1px dashed var(--color-border-medium)', borderRadius: '6px', color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                          No direct links available. Search Coursera/Udemy for "{selectedNode.title}".
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', background: 'var(--color-bg-card)', border: '1px dashed var(--color-border-light)', borderRadius: '8px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                    Select a learning path step on the left to see details.
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
