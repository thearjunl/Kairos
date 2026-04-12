"use client";

import { Shield, AlertTriangle, AlertOctagon } from "lucide-react";
import type { Metrics } from "@/lib/api";

interface SLARiskPredictorProps {
  metrics: Metrics | null;
}

function getHealthColor(score: number): string {
  if (score > 70) return "#00d4ff";
  if (score > 40) return "#ffaa00";
  return "#ff3333";
}

function getRiskState(metrics: Metrics | null) {
  if (!metrics) return { level: "SAFE" as const, msg: "Initializing..." };
  if (metrics.health_score > 70) {
    return {
      level: "SAFE" as const,
      msg: "SLA Compliant — All metrics nominal",
    };
  }
  if (metrics.health_score > 40) {
    return {
      level: "WARNING" as const,
      msg: "Elevated Risk — Latency trending up",
    };
  }
  return {
    level: "DANGER" as const,
    msg: "SLA BREACH IMMINENT — Escalate to L2",
  };
}

export default function SLARiskPredictor({ metrics }: SLARiskPredictorProps) {
  const score = metrics?.health_score ?? 0;
  const color = getHealthColor(score);
  const risk = getRiskState(metrics);

  // Ring gauge calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const riskStyles: Record<string, string> = {
    SAFE: "border-s-green/40 bg-s-green/5",
    WARNING: "border-s-amber/40 bg-s-amber/5",
    DANGER: "border-s-red/40 bg-s-red/5 danger-pulse",
  };

  const riskIcons: Record<string, React.ReactNode> = {
    SAFE: <Shield className="w-5 h-5 text-s-green" />,
    WARNING: <AlertTriangle className="w-5 h-5 text-s-amber" />,
    DANGER: <AlertOctagon className="w-5 h-5 text-s-red" />,
  };

  const riskTextColors: Record<string, string> = {
    SAFE: "text-s-green",
    WARNING: "text-s-amber",
    DANGER: "text-s-red",
  };

  return (
    <div className="sentinel-card p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-s-cyan" />
        <h2 className="font-display font-semibold text-sm uppercase tracking-[0.15em]">
          SLA Risk Predictor
        </h2>
      </div>

      {/* Ring Gauge */}
      <div className="flex justify-center mb-4">
        <div className="relative w-44 h-44">
          <svg
            viewBox="0 0 160 160"
            className="w-full h-full transform -rotate-90"
          >
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#1e2d3d"
              strokeWidth="8"
            />
            {/* Value ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="ring-transition"
              style={{
                filter: `drop-shadow(0 0 6px ${color}40)`,
              }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-4xl font-bold font-mono"
              style={{ color }}
            >
              {score}
            </span>
            <span className="text-[10px] text-s-muted uppercase tracking-widest">
              Health
            </span>
          </div>
        </div>
      </div>

      {/* Risk Status Card */}
      <div
        className={`border rounded-lg p-3 mb-4 ${riskStyles[risk.level]}`}
      >
        <div className="flex items-center gap-2 mb-1">
          {riskIcons[risk.level]}
          <span
            className={`text-xs font-bold uppercase tracking-wider ${riskTextColors[risk.level]}`}
          >
            {risk.level}
          </span>
        </div>
        <p className="text-xs text-s-text/80 font-mono">{risk.msg}</p>
      </div>

      {/* Per-Region Health Bars */}
      <div className="space-y-2 flex-1">
        <p className="section-header text-[10px] mb-2">Region Health</p>
        {metrics?.region_health &&
          Object.entries(metrics.region_health).map(([region, data]) => {
            const barColor =
              data.success_rate > 85
                ? "bg-s-green"
                : data.success_rate > 60
                ? "bg-s-amber"
                : "bg-s-red";
            return (
              <div key={region} className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-s-muted">{region}</span>
                  <span className="text-s-text">{data.success_rate}%</span>
                </div>
                <div className="h-1.5 bg-s-border/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${data.success_rate}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
