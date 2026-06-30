'use client';

import React from 'react';

interface Domain {
  name: string;
  score: number;
}

interface DomainRadarChartProps {
  domains: Domain[];
}

export default function DomainRadarChart({ domains = [] }: DomainRadarChartProps) {
  const safeDomains = Array.isArray(domains) ? domains : [];
  // Define the standard 5 domains in order to keep coordinates consistent
  const standardDomains = ['Technology', 'Data & AI', 'Design', 'Security', 'Business'];
  
  // Merge input domains with default order and scores
  const chartData = standardDomains.map(name => {
    const matched = safeDomains.find(d => d && d.name.toLowerCase() === name.toLowerCase());
    return {
      name,
      score: matched ? Math.max(10, Math.min(100, matched.score)) : 20 // Default score fallback
    };
  });

  const numPoints = chartData.length;
  const radius = 80;
  const center = 120;
  const width = 240;
  const height = 240;

  // Calculate coordinates for the radar points
  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 / numPoints) * index - Math.PI / 2;
    const x = center + radius * (value / 100) * Math.cos(angle);
    const y = center + radius * (value / 100) * Math.sin(angle);
    return { x, y };
  };

  // Generate web background grid polygons (100%, 75%, 50%, 25%)
  const gridLevels = [1.0, 0.75, 0.5, 0.25];
  const gridPolygons = gridLevels.map(level => {
    const points = chartData.map((_, i) => {
      const { x, y } = getCoordinates(i, level * 100);
      return `${x},${y}`;
    }).join(' ');
    return points;
  });

  // Generate the actual user score polygon points
  const scorePoints = chartData.map((d, i) => {
    const { x, y } = getCoordinates(i, d.score);
    return `${x},${y}`;
  }).join(' ');

  // Get labels coordinates
  const getLabelCoordinates = (index: number): { x: number; y: number; textAnchor: 'start' | 'middle' | 'end' } => {
    const angle = (Math.PI * 2 / numPoints) * index - Math.PI / 2;
    // Offset slightly further out than maximum radius
    const x = center + (radius + 24) * Math.cos(angle);
    const y = center + (radius + 12) * Math.sin(angle);
    const textAnchor: 'start' | 'middle' | 'end' =
      Math.abs(x - center) < 10 ? 'middle' : x < center ? 'end' : 'start';
    return { x, y, textAnchor };
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(18, 18, 18, 0.4)',
      border: '1px solid rgba(37, 99, 235, 0.1)',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: 'inset 0 0 12px rgba(37, 99, 235, 0.03)'
    }}>
      <h3 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Domain Profile Map
      </h3>
      
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {/* Glow Filters */}
        <defs>
          <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Background Grid Polygon Levels */}
        {gridPolygons.map((points, idx) => (
          <polygon
            key={idx}
            points={points}
            fill="none"
            stroke="rgba(37, 99, 235, 0.08)"
            strokeWidth="1"
          />
        ))}

        {/* Web Axes Lines */}
        {chartData.map((_, i) => {
          const outerPoint = getCoordinates(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={outerPoint.x}
              y2={outerPoint.y}
              stroke="rgba(37, 99, 235, 0.08)"
              strokeWidth="1"
            />
          );
        })}

        {/* User Match Score Polygon Area */}
        <polygon
          points={scorePoints}
          fill="rgba(37, 99, 235, 0.18)"
          stroke="var(--accent)"
          strokeWidth="2"
          filter="url(#radar-glow)"
          style={{ transition: 'all 0.5s ease-in-out' }}
        />

        {/* Score Corner Points (Interactive Dots) */}
        {chartData.map((d, i) => {
          const { x, y } = getCoordinates(i, d.score);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="#0a0a0a"
              stroke="var(--accent)"
              strokeWidth="2"
              style={{ transition: 'all 0.5s ease-in-out' }}
            />
          );
        })}

        {/* Outer Text Labels */}
        {chartData.map((d, i) => {
          const coord = getLabelCoordinates(i);
          return (
            <g key={i}>
              <text
                x={coord.x}
                y={coord.y}
                fill="#ffffff"
                fontSize="10px"
                fontWeight="700"
                textAnchor={coord.textAnchor}
                fontFamily="Outfit, sans-serif"
              >
                {d.name}
              </text>
              <text
                x={coord.x}
                y={coord.y + 11}
                fill="var(--accent)"
                fontSize="9px"
                fontWeight="bold"
                textAnchor={coord.textAnchor}
                fontFamily="monospace"
              >
                {d.score}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
