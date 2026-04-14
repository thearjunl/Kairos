"use client";

import { motion } from "framer-motion";
import type { Metrics } from "@/lib/api";

interface ServiceTopologyProps {
  metrics: Metrics | null;
  faultActive: boolean;
}

interface ServiceNode {
  id: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  type: "gateway" | "engine" | "ai" | "db" | "resolver";
}

interface ServiceEdge {
  from: string;
  to: string;
}

const NODES: ServiceNode[] = [
  { id: "gateway", label: "API Gateway", sublabel: "Load Balancer", x: 80, y: 70, type: "gateway" },
  { id: "payment", label: "Payment Engine", sublabel: "Transaction Core", x: 280, y: 70, type: "engine" },
  { id: "enrichment", label: "AI Enrichment", sublabel: "Gemini NLP", x: 480, y: 70, type: "ai" },
  { id: "risk", label: "Risk DB", sublabel: "PostgreSQL", x: 680, y: 70, type: "db" },
  { id: "resolver", label: "Merchant Resolver", sublabel: "Entity Mapping", x: 480, y: 160, type: "resolver" },
];

const EDGES: ServiceEdge[] = [
  { from: "gateway", to: "payment" },
  { from: "payment", to: "enrichment" },
  { from: "enrichment", to: "risk" },
  { from: "enrichment", to: "resolver" },
];

function getNodeHealth(
  nodeId: string,
  metrics: Metrics | null,
  faultActive: boolean
): "healthy" | "degraded" | "critical" {
  if (faultActive && (nodeId === "enrichment" || nodeId === "risk" || nodeId === "resolver")) {
    return "critical";
  }
  if (!metrics) return "healthy";

  if (nodeId === "gateway") {
    return metrics.success_rate > 85 ? "healthy" : metrics.success_rate > 60 ? "degraded" : "critical";
  }
  if (nodeId === "payment") {
    return metrics.avg_latency < 200 ? "healthy" : metrics.avg_latency < 400 ? "degraded" : "critical";
  }
  if (nodeId === "enrichment") {
    return metrics.health_score > 70 ? "healthy" : metrics.health_score > 40 ? "degraded" : "critical";
  }
  if (nodeId === "risk") {
    return metrics.total_breaches < 10 ? "healthy" : metrics.total_breaches < 25 ? "degraded" : "critical";
  }
  return metrics.success_rate > 75 ? "healthy" : "degraded";
}

const healthColors = {
  healthy: { dot: "#00ff87", glow: "0 0 8px rgba(0,255,135,0.5)", border: "#00ff8730" },
  degraded: { dot: "#ffaa00", glow: "0 0 8px rgba(255,170,0,0.5)", border: "#ffaa0030" },
  critical: { dot: "#ff3333", glow: "0 0 12px rgba(255,51,51,0.6)", border: "#ff333340" },
};

const typeIcons: Record<string, string> = {
  gateway: "⚡",
  engine: "💳",
  ai: "🧠",
  db: "🗄️",
  resolver: "🔍",
};

function getEdgePath(fromNode: ServiceNode, toNode: ServiceNode): string {
  const x1 = fromNode.x + 75;
  const y1 = fromNode.y + 25;
  const x2 = toNode.x;
  const y2 = toNode.y + 25;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

export default function ServiceTopology({ metrics, faultActive }: ServiceTopologyProps) {
  return (
    <div id="topology" className="sentinel-card p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-s-border">
        <div className="flex items-center gap-2">
          <span className="text-s-cyan text-sm">⬡</span>
          <h2 className="font-display font-semibold text-sm uppercase tracking-[0.15em]">
            Service Topology
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {faultActive && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-s-red/20 text-s-red text-[10px] font-bold px-2 py-0.5 rounded-full border border-s-red/30 animate-pulse"
            >
              FAULT INJECTED
            </motion.span>
          )}
          <span className="text-[10px] text-s-muted font-mono">Live</span>
        </div>
      </div>

      {/* Topology SVG */}
      <div className="px-4 py-4 overflow-x-auto">
        <svg viewBox="0 0 780 210" className="w-full h-auto min-w-[600px]" style={{ maxHeight: "180px" }}>
          <defs>
            {/* Flow animation gradient */}
            <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="edgeGradientFault" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff3333" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#ff3333" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ff3333" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Edges */}
          {EDGES.map((edge) => {
            const fromNode = NODES.find((n) => n.id === edge.from)!;
            const toNode = NODES.find((n) => n.id === edge.to)!;
            const path = getEdgePath(fromNode, toNode);
            const toHealth = getNodeHealth(edge.to, metrics, faultActive);
            const isFault = toHealth === "critical";
            const edgeColor = isFault ? "#ff333360" : "#1e2d3d";

            return (
              <g key={`${edge.from}-${edge.to}`}>
                {/* Base edge */}
                <path d={path} fill="none" stroke={edgeColor} strokeWidth="2" />
                {/* Animated flow */}
                <path
                  d={path}
                  fill="none"
                  stroke={`url(#${isFault ? "edgeGradientFault" : "edgeGradient"})`}
                  strokeWidth="3"
                  strokeDasharray="8 16"
                  className="topology-edge-flow"
                  style={{
                    animationDuration: isFault ? "3s" : "1.5s",
                  }}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {NODES.map((node) => {
            const health = getNodeHealth(node.id, metrics, faultActive);
            const colors = healthColors[health];

            return (
              <g key={node.id}>
                {/* Node background */}
                <rect
                  x={node.x}
                  y={node.y}
                  width="150"
                  height="50"
                  rx="8"
                  fill="#111820"
                  stroke={colors.border}
                  strokeWidth="1.5"
                  style={{ filter: health === "critical" ? `drop-shadow(${colors.glow})` : "none" }}
                />
                {/* Health dot */}
                <circle
                  cx={node.x + 14}
                  cy={node.y + 16}
                  r="4"
                  fill={colors.dot}
                  style={{ filter: `drop-shadow(${colors.glow})` }}
                >
                  {health === "critical" && (
                    <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                  )}
                </circle>
                {/* Type icon */}
                <text x={node.x + 30} y={node.y + 20} fontSize="12" fill="#e0eaf4">
                  {typeIcons[node.type]}
                </text>
                {/* Label */}
                <text
                  x={node.x + 48}
                  y={node.y + 20}
                  fontSize="10"
                  fill="#e0eaf4"
                  fontFamily="Rajdhani, sans-serif"
                  fontWeight="600"
                >
                  {node.label}
                </text>
                {/* Sublabel */}
                <text
                  x={node.x + 14}
                  y={node.y + 38}
                  fontSize="8"
                  fill="#5a7a94"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {node.sublabel}
                </text>
                {/* Status label for critical */}
                {health === "critical" && (
                  <text
                    x={node.x + 110}
                    y={node.y + 18}
                    fontSize="7"
                    fill="#ff3333"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    DEGRADED
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
