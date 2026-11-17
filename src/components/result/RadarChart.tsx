'use client';

import React from 'react';
import { RadarRubric } from '@/types/wawancara';
import { BarChart3 } from 'lucide-react';

interface RadarChartProps {
  rubric: RadarRubric;
}

export function RadarChart({ rubric }: RadarChartProps) {
  const axes = [
    { key: 'relevansi', label: 'Relevansi', value: rubric.relevansi },
    { key: 'strukturSTAR', label: 'Struktur STAR', value: rubric.strukturSTAR },
    { key: 'kejelasan', label: 'Kejelasan', value: rubric.kejelasan },
    { key: 'kepercayaanDiri', label: 'Kepercayaan Diri', value: rubric.kepercayaanDiri },
    { key: 'contohNyata', label: 'Contoh Nyata', value: rubric.contohNyata },
  ];

  // Ukuran radar chart SVG
  const size = 320;
  const center = size / 2;
  const radius = 100;
  const totalAxes = axes.length;

  // Hitung koordinat (x, y) dari sudut & nilai (0-100)
  const getCoordinates = (index: number, val: number) => {
    // Sudut rotasi: mulai dari atas (-90 derajat atau -PI/2)
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const r = (val / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Titik poligon data pengguna
  const pointsString = axes
    .map((axis, i) => {
      const { x, y } = getCoordinates(i, axis.value);
      return `${x},${y}`;
    })
    .join(' ');

  // Grid lingkaran konsentris (20, 40, 60, 80, 100)
  const levels = [20, 40, 60, 80, 100];

  return (
    <div className="w-full rounded-3xl bg-white border border-[#2F67BB]/15 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-[#1B2A41] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#4A8DF0]" />
            Grafik Radar 5 Rubrik Kompetensi
          </h3>
          <p className="text-xs text-slate-500">
            Penilaian mendalam berdasarkan standar industri rekrutmen profesional
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        {/* SVG Radar Chart */}
        <div className="relative w-[300px] h-[300px] flex-shrink-0">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full h-full overflow-visible"
            aria-label="Grafik Radar Penilaian Kompetensi Wawancara"
          >
            {/* Grid level poligon */}
            {levels.map((lvl) => {
              const gridPoints = axes
                .map((_, i) => {
                  const { x, y } = getCoordinates(i, lvl);
                  return `${x},${y}`;
                })
                .join(' ');

              return (
                <polygon
                  key={lvl}
                  points={gridPoints}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray={lvl === 100 ? undefined : '2,2'}
                />
              );
            })}

            {/* Garis sumbu dari titik pusat */}
            {axes.map((_, i) => {
              const { x, y } = getCoordinates(i, 100);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="#CBD5E1"
                  strokeWidth="1.2"
                />
              );
            })}

            {/* Poligon Data Skor Pengguna */}
            <polygon
              points={pointsString}
              fill="rgba(74, 141, 240, 0.25)"
              stroke="#2F67BB"
              strokeWidth="2.5"
            />

            {/* Titik data point & Nilai */}
            {axes.map((axis, i) => {
              const { x, y } = getCoordinates(i, axis.value);
              return (
                <g key={axis.key}>
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill="#F26A2B"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                </g>
              );
            })}

            {/* Label nama sumbu di luar lingkaran */}
            {axes.map((axis, i) => {
              // Posisi label lebih ke luar dari r=100 (misal r=120)
              const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
              const labelRadius = radius + 24;
              const lx = center + labelRadius * Math.cos(angle);
              const ly = center + labelRadius * Math.sin(angle);

              return (
                <text
                  key={axis.key}
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[11px] font-bold fill-[#1B2A41]"
                >
                  {axis.label} ({axis.value})
                </text>
              );
            })}
          </svg>
        </div>

        {/* Legend & Rincian Nilai per Rubrik */}
        <div className="w-full sm:max-w-xs space-y-2.5">
          {axes.map((axis) => (
            <div
              key={axis.key}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4A8DF0]"></span>
                <span className="text-xs font-semibold text-[#1B2A41]">
                  {axis.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#4A8DF0] to-[#F26A2B] rounded-full"
                    style={{ width: `${axis.value}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[#1B2A41] w-7 text-right">
                  {axis.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
