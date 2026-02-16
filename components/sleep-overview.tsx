"use client";

import cx from "classnames";
import { useState } from "react";

type SleepAnalysisData = {
  periodCovered?: string;
  dataPoints?: number;
  summary?: {
    overallScore: number;
    overallTrend: string;
    primaryConcerns: string[];
    keyMetrics: {
      avgSleepScore: number;
      avgDuration: number;
      avgDeepPct: number;
      avgRemPct: number;
      avgHrv: number;
      avgRhr: number;
      avgSpo2: number;
    };
    monthlyTrend?: Record<string, { score: number; deepPct: number; remPct: number; hrv: number; rhr: number }>;
  };
  analysis?: string;
  error?: string;
};

function SleepBar({ label, value, optimal, color }: { label: string; value: number; optimal: string; color: string }) {
  const width = Math.min(value, 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-white/60 text-xs">{label}</span>
        <span className="text-white text-xs font-semibold">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className={cx("h-full rounded-full", color)} style={{ width: `${width}%` }} />
      </div>
      <span className="text-white/30 text-xs">Optimal: {optimal}</span>
    </div>
  );
}

export function SleepOverview({ sleepData }: { sleepData?: SleepAnalysisData }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!sleepData || sleepData.error) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-4 shadow-lg">
        <div className="text-white/60 text-sm">{sleepData?.error || "No sleep data available"}</div>
      </div>
    );
  }

  const s = sleepData.summary;
  const km = s?.keyMetrics;

  return (
    <div className="relative flex w-full flex-col gap-3 overflow-hidden rounded-2xl p-4 shadow-lg backdrop-blur-sm bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-white font-semibold text-sm">Sleep Analysis</div>
            <div className="text-white/60 text-xs">{sleepData.periodCovered} ({sleepData.dataPoints} nights)</div>
          </div>
          {s && (
            <div className={cx("rounded-full px-3 py-1 text-sm font-bold", {
              "bg-red-500/30 text-red-300": s.overallScore < 60,
              "bg-amber-500/30 text-amber-300": s.overallScore >= 60 && s.overallScore < 75,
              "bg-emerald-500/30 text-emerald-300": s.overallScore >= 75,
            })}>
              {s.overallScore}/100
            </div>
          )}
        </div>

        {/* Key Metrics */}
        {km && (
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col rounded-lg bg-white/5 px-3 py-2">
              <span className="text-white/50 text-xs">Avg Duration</span>
              <span className="text-white text-lg font-semibold">{km.avgDuration.toFixed(1)}<span className="text-xs text-white/50"> h</span></span>
            </div>
            <div className="flex flex-col rounded-lg bg-white/5 px-3 py-2">
              <span className="text-white/50 text-xs">HRV</span>
              <span className="text-white text-lg font-semibold">{km.avgHrv}<span className="text-xs text-white/50"> ms</span></span>
            </div>
            <div className="flex flex-col rounded-lg bg-white/5 px-3 py-2">
              <span className="text-white/50 text-xs">RHR</span>
              <span className="text-white text-lg font-semibold">{km.avgRhr.toFixed(1)}<span className="text-xs text-white/50"> bpm</span></span>
            </div>
            <div className="flex flex-col rounded-lg bg-white/5 px-3 py-2">
              <span className="text-white/50 text-xs">SpO2</span>
              <span className="text-white text-lg font-semibold">{km.avgSpo2.toFixed(1)}<span className="text-xs text-white/50"> %</span></span>
            </div>
          </div>
        )}

        {/* Sleep Architecture */}
        {km && (
          <div className="mb-3 rounded-xl bg-white/10 p-3">
            <div className="mb-2 font-medium text-white/80 text-xs">Sleep Architecture</div>
            <div className="flex flex-col gap-3">
              <SleepBar label="Deep Sleep" value={km.avgDeepPct} optimal="16-33%" color="bg-indigo-500" />
              <SleepBar label="REM Sleep" value={km.avgRemPct} optimal="21-31%" color="bg-purple-500" />
              <SleepBar label="Light Sleep" value={100 - km.avgDeepPct - km.avgRemPct} optimal="30-64%" color="bg-sky-400" />
            </div>
          </div>
        )}

        {/* Concerns */}
        {s?.primaryConcerns && s.primaryConcerns.length > 0 && (
          <div className="mb-2">
            <div className="mb-1 text-white/60 text-xs font-medium">Key Concerns</div>
            <div className="flex flex-col gap-1">
              {s.primaryConcerns.map((concern, i) => (
                <div key={i} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-300 text-xs">
                  {concern}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Trend */}
        {s?.monthlyTrend && (
          <div className="mt-2">
            <button onClick={() => setShowDetails(!showDetails)} className="text-white/50 text-xs hover:text-white/70">
              {showDetails ? "▾ Hide" : "▸ Show"} monthly trends
            </button>
            {showDetails && (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-xs text-white/70">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-1 text-left font-medium">Month</th>
                      <th className="py-1 text-right font-medium">Score</th>
                      <th className="py-1 text-right font-medium">Deep%</th>
                      <th className="py-1 text-right font-medium">REM%</th>
                      <th className="py-1 text-right font-medium">HRV</th>
                      <th className="py-1 text-right font-medium">RHR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(s.monthlyTrend).map(([month, data]) => (
                      <tr key={month} className="border-b border-white/5">
                        <td className="py-1 capitalize">{month}</td>
                        <td className="py-1 text-right">{data.score}</td>
                        <td className="py-1 text-right">{data.deepPct}%</td>
                        <td className="py-1 text-right">{data.remPct}%</td>
                        <td className="py-1 text-right">{data.hrv}ms</td>
                        <td className="py-1 text-right">{data.rhr}bpm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
