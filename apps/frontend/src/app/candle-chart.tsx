"use client";

import { useState, useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';

const intervals = ['1m', '5m', '15m'];

export function CandleChart() {
  const [interval, setInterval] = useState('1m');
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 400,
      layout: {
        background: { color: '#000000' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#334158' },
        horzLines: { color: '#334158' },
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    fetch(`http://localhost:3000/candles?asset=solana&interval=${interval}`)
      .then(res => {
        if (!res.ok) {
          return res.json().then(errorBody => {
            throw new Error(`API Error: ${errorBody.message || res.statusText}`);
          });
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const formattedData: CandlestickData<Time>[] = data.map((d: any) => ({
            time: (new Date(d.timestamp).getTime() / 1000) as Time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          }));
          candlestickSeries.setData(formattedData);
        } else {
          console.error("API did not return an array:", data);
        }
      })
      .catch(error => {
        console.error("Failed to fetch candle data:", error);
      });
    
    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [interval]);

  return (
    <div className="flex flex-col items-center p-4 w-full">
      <div className="mb-4">
        <label htmlFor="interval-select" className="mr-2 font-medium text-gray-300">
          Interval:
        </label>
        <select
          id="interval-select"
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          className="p-2 border rounded bg-gray-800 text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {intervals.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>
      <div ref={chartContainerRef} className="w-full max-w-4xl" />
    </div>
  );
}