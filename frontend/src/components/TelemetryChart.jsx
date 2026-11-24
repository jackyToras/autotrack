import React, { useState } from 'react';
import { Activity, IndianRupee, Gauge } from 'lucide-react';

export default function TelemetryChart({ services = [], currentOdometer = 0 }) {
  const [metric, setMetric] = useState('cost');
  const [activePoint, setActivePoint] = useState(null);

  const sortedLogs = [...services].sort((a, b) => new Date(a.service_date) - new Date(b.service_date));

  let chartData = [];
  if (sortedLogs.length === 0) {
    chartData = [
      { label: 'Start', value: 0, date: 'Baseline', type: 'Delivery' },
      { label: 'Target', value: metric === 'cost' ? 5000 : 5000, date: 'Projected', type: 'Interval 1' },
      { label: 'Future', value: metric === 'cost' ? 12000 : 10000, date: 'Horizon', type: 'Interval 2' },
    ];
  } else {
    let runningCost = 0;
    chartData = sortedLogs.map((log) => {
      runningCost += log.cost;
      return {
        label: new Date(log.service_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: metric === 'cost' ? runningCost : log.odometer_at_service,
        date: new Date(log.service_date).toLocaleDateString(),
        type: log.service_type,
        cost: log.cost,
        odometer: log.odometer_at_service,
      };
    });
  }

  const values = chartData.map((d) => d.value);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, metric === 'cost' ? 5000 : currentOdometer || 10000);
  const range = maxVal - minVal || 1;

  const width = 640;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const points = chartData.map((d, i) => {
    const x = paddingX + (i / Math.max(chartData.length - 1, 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((d.value - minVal) / range) * (height - paddingY * 2);
    return { ...d, x, y };
  });

  const pathD = points.length === 1
    ? `M ${paddingX} ${points[0].y} L ${width - paddingX} ${points[0].y}`
    : points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');

  const areaD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div className="bg-[#0A0B10]/80 border border-white/[0.08] rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl group hover:border-red-500/30 transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[11px] font-bold tracking-widest uppercase text-red-500">Telemetry Analysis</span>
          </div>
          <h3 className="text-base font-semibold text-white mt-1">
            {metric === 'cost' ? 'Cumulative Maintenance Expenditure' : 'Vehicle Mileage Progression'}
          </h3>
        </div>

        <div className="flex items-center bg-[#12141D] p-1 rounded-xl border border-white/[0.06]">
          <button
            onClick={() => setMetric('cost')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              metric === 'cost'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" /> Capital Outlay
          </button>
          <button
            onClick={() => setMetric('mileage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              metric === 'mileage'
                ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" /> Mileage Arc
          </button>
        </div>
      </div>

      <div className="relative w-full h-[180px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="telemetryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#DC2626" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {[0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = height - paddingY - pct * (height - paddingY * 2);
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#1B1E2B"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            );
          })}

          {areaD && <path d={areaD} fill="url(#telemetryGradient)" />}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#EF4444"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
          )}

          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                className="fill-black stroke-red-500 stroke-2 hover:fill-red-500 cursor-pointer transition-all"
                onMouseEnter={() => setActivePoint(p)}
                onMouseLeave={() => setActivePoint(null)}
              />
              <text
                x={p.x}
                y={height - 6}
                textAnchor="middle"
                className="fill-slate-500 text-[10px] font-mono tracking-wider select-none"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>

        {activePoint && (
          <div
            className="absolute z-20 pointer-events-none bg-[#131520] border border-red-500/50 text-white rounded-xl p-3 shadow-2xl text-xs backdrop-blur-md -translate-x-1/2 -translate-y-full mb-3"
            style={{ left: `${(activePoint.x / width) * 100}%`, top: `${(activePoint.y / height) * 100}%` }}
          >
            <div className="font-bold text-red-400">{activePoint.type}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{activePoint.date}</div>
            <div className="text-sm font-extrabold text-white mt-1">
              {metric === 'cost' ? `₹${activePoint.value.toLocaleString()}` : `${activePoint.value.toLocaleString()} km`}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-white/[0.06] pt-3 mt-2">
        <span>MIN: {metric === 'cost' ? '₹0' : `${minVal.toLocaleString()} km`}</span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <Activity className="w-3.5 h-3.5 text-red-500" />
          Active Telemetry Stream
        </span>
        <span>PEAK: {metric === 'cost' ? `₹${maxVal.toLocaleString()}` : `${maxVal.toLocaleString()} km`}</span>
      </div>
    </div>
  );
}
