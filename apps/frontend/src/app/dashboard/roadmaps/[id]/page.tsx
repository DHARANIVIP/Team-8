'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/DashboardNavbar';

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

  const fetchRoadmapDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`http://localhost:3001/api/roadmaps/${id}`);
      if (!res.ok) throw new Error('Failed to retrieve roadmap details');
      const data = await res.json();
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

  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh', color: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <DashboardNavbar />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px 40px' }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <Link href="/dashboard/roadmaps" style={{ color: ACCENT, textDecoration: 'none', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            ← Back to Roadmaps
          </Link>
        </div>

        {/* Error State */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            color: '#ef4444',
            fontSize: '13px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ height: '32px', width: '40%', background: '#222222', borderRadius: '4px' }}></div>
            <div style={{ height: '14px', width: '60%', background: '#222222', borderRadius: '4px' }}></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginTop: '16px' }}>
              <div style={{ height: '400px', background: '#121212', border: '1px solid #1f1f1f', borderRadius: '8px' }}></div>
              <div style={{ height: '400px', background: '#121212', border: '1px solid #1f1f1f', borderRadius: '8px' }}></div>
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        {!loading && roadmap && (
          <div>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #1f1f1f', paddingBottom: '24px', marginBottom: '28px' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: ACCENT, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>
                  {roadmap.category} PATHWAY
                </span>
                <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                  {roadmap.name}
                </h1>
                <p style={{ color: '#aaaaaa', fontSize: '13px', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
                  {roadmap.description}
                </p>
              </div>

              {/* Progress Panel */}
              <div className="card" style={{ background: '#121212', padding: '16px 20px', border: '1px solid #1f1f1f', borderRadius: '8px', minWidth: '220px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                  <span>YOUR PROGRESS</span>
                  <span style={{ color: ACCENT }}>{calculateProgress()}%</span>
                </div>
                <div style={{ height: '6px', background: '#1f1f1f', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ height: '100%', background: ACCENT, width: `${calculateProgress()}%`, transition: 'width 0.3s ease' }}></div>
                </div>
                <span style={{ fontSize: '10px', color: '#888888' }}>
                  {roadmap.nodes.filter(n => completedNodes.includes(n.id)).length} of {roadmap.nodes.length} steps completed
                </span>
              </div>
            </div>

            {/* Split timeline layout */}
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
                          borderLeft: isCompleted ? `2px solid ${ACCENT}` : '2px dashed #2c2c2e',
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
                          background: isCompleted ? ACCENT : isSelected ? '#1c1c1e' : '#121212',
                          border: `2px solid ${isCompleted || isSelected ? ACCENT : '#2c2c2e'}`,
                          color: isCompleted ? '#000000' : isSelected ? ACCENT : '#888888',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          zIndex: 2,
                          userSelect: 'none',
                          boxShadow: isSelected ? `0 0 10px ${ACCENT_RGBA}` : 'none',
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
                          background: isSelected ? 'rgba(255,158,66,0.03)' : '#121212',
                          border: `1px solid ${isSelected ? ACCENT : '#1f1f1f'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          marginBottom: '20px',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? ACCENT : '#ffffff', margin: 0 }}>
                            {node.title}
                          </h3>
                          <span style={{ fontSize: '10px', color: isCompleted ? ACCENT : '#555555', fontWeight: 600 }}>
                            {isCompleted ? 'ACQUIRED' : 'IN PROGRESS'}
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#aaaaaa', margin: 0, lineHeight: 1.5 }}>
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
                  <div className="card" style={{ padding: '24px 28px', background: '#121212', border: '1px solid #1f1f1f', borderRadius: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: ACCENT, letterSpacing: '1px', textTransform: 'uppercase' }}>
                      STEP {selectedNode.sequence_order} SYLLABUS
                    </span>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '6px 0 12px 0', borderBottom: '1px solid #1f1f1f', paddingBottom: '12px' }}>
                      {selectedNode.title}
                    </h2>
                    
                    <p style={{ fontSize: '12px', color: '#aaaaaa', margin: '0 0 20px 0', lineHeight: 1.6 }}>
                      {selectedNode.description}
                    </p>

                    <div style={{ marginBottom: '24px' }}>
                      <button
                        onClick={() => toggleNodeCompletion(selectedNode.id)}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          background: completedNodes.includes(selectedNode.id) ? 'rgba(239, 68, 68, 0.1)' : ACCENT_RGBA,
                          border: `1px solid ${completedNodes.includes(selectedNode.id) ? '#ef4444' : ACCENT}`,
                          color: completedNodes.includes(selectedNode.id) ? '#ef4444' : ACCENT,
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
                      <h4 style={{ fontSize: '11px', fontWeight: 600, color: '#ff9e42', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
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
                                background: '#1a1a1c',
                                border: '1px solid #2c2c2e',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                color: '#ffffff',
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
                                <span style={{ fontSize: '9px', color: '#888888' }}>
                                  {res.resource_type} • External resource
                                </span>
                              </div>
                              <span style={{ color: ACCENT, fontSize: '11px', fontWeight: 600 }}>Open ↗</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '16px', background: '#1c1c1e', border: '1px dashed #2c2c2e', borderRadius: '6px', color: '#888888', fontSize: '11px' }}>
                          No direct links available. Search Coursera/Udemy for "{selectedNode.title}".
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', background: '#121212', border: '1px dashed #1f1f1f', borderRadius: '8px', color: '#888888', fontSize: '12px' }}>
                    Select a learning path step on the left to see details.
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
