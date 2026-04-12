"use client";

// ─── Latency Sparkline (inline mini SVG chart) ─────────────────────────────
interface LatencySparkProps {
  values: number[]; // last N latency values
  width?: number;
  height?: number;
}

export default function LatencySpark({
  values,
  width = 600,
  height = 80,
}: LatencySparkProps) {
  if (values.length < 2) return null;

  const max = Math.max(...values, 250);
  const min = 0;
  const range = max - min || 1;
  const step = width / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  // Fill area
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  // SLA threshold line at 200ms
  const thresholdY = height - ((200 - min) / range) * height;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      {/* Gradient fill */}
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <polygon points={areaPoints} fill="url(#sparkGrad)" />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="#00d4ff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* SLA threshold dashed line */}
      <line
        x1="0"
        y1={thresholdY}
        x2={width}
        y2={thresholdY}
        stroke="#ff3333"
        strokeWidth="1"
        strokeDasharray="6,4"
        opacity="0.7"
      />

      {/* Label for threshold */}
      <text
        x={width - 4}
        y={thresholdY - 4}
        fill="#ff3333"
        fontSize="9"
        textAnchor="end"
        fontFamily="JetBrains Mono"
        opacity="0.8"
      >
        SLA 200ms
      </text>
    </svg>
  );
}
