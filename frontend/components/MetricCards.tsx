"use client";

import { useEffect, useRef } from "react";
import { Activity, CheckCircle, Clock, AlertTriangle, Zap } from "lucide-react";
import type { Metrics } from "@/lib/api";

interface MetricCardsProps {
  metrics: Metrics | null;
}

interface CardConfig {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  getValue: (m: Metrics) => string;
}

const cards: CardConfig[] = [
  {
    id: "health",
    label: "Global Health",
    subtitle: "Composite Score",
    icon: <Activity className="w-4 h-4" />,
    color: "text-s-cyan",
    borderColor: "border-t-s-cyan",
    getValue: (m) => String(m.health_score),
  },
  {
    id: "success",
    label: "Success Rate",
    subtitle: "Last 100 TXNs",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-s-green",
    borderColor: "border-t-s-green",
    getValue: (m) => `${m.success_rate}%`,
  },
  {
    id: "latency",
    label: "Avg Latency",
    subtitle: "Milliseconds",
    icon: <Clock className="w-4 h-4" />,
    color: "text-s-amber",
    borderColor: "border-t-s-amber",
    getValue: (m) => `${m.avg_latency}`,
  },
  {
    id: "breaches",
    label: "SLA Breaches",
    subtitle: "> 200ms Threshold",
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-s-red",
    borderColor: "border-t-s-red",
    getValue: (m) => String(m.total_breaches),
  },
  {
    id: "throughput",
    label: "Throughput",
    subtitle: "TXN / min",
    icon: <Zap className="w-4 h-4" />,
    color: "text-s-purple",
    borderColor: "border-t-s-purple",
    getValue: (m) => String(m.throughput_per_min),
  },
];

function AnimatedNumber({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value && ref.current) {
      ref.current.classList.remove("animate-count-up");
      void ref.current.offsetWidth; // trigger reflow
      ref.current.classList.add("animate-count-up");
      prevValue.current = value;
    }
  }, [value]);

  return (
    <span ref={ref} className="inline-block animate-count-up">
      {value}
    </span>
  );
}

export default function MetricCards({ metrics }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`sentinel-card border-t-2 ${card.borderColor} p-4 sentinel-glow transition-all duration-200 hover:scale-[1.02]`}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className={card.color}>{card.icon}</span>
            <span className="section-header text-xs">{card.label}</span>
          </div>
          <div className={`metric-value ${card.color}`}>
            {metrics ? (
              <AnimatedNumber value={card.getValue(metrics)} />
            ) : (
              <span className="text-s-muted">—</span>
            )}
          </div>
          <p className="text-xs text-s-muted mt-1 font-mono">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
