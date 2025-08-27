// src/app/candle-chart-wrapper.tsx

"use client"; // This is the most important line

import dynamic from 'next/dynamic';

// Dynamically import CandleChart here, inside a Client Component
const CandleChart = dynamic(
  () => import('./candle-chart').then((mod) => mod.CandleChart),
  { 
    ssr: false, // This is now allowed because we are in a Client Component
    loading: () => <p>Loading chart...</p> 
  }
);

export function CandleChartWrapper() {
  // This component simply returns the dynamically loaded chart
  return <CandleChart />;
}