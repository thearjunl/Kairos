"use client";

import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import type { SecurityEvent } from "@/lib/api";

interface SecurityComplianceProps {
  events: SecurityEvent[];
}

export default function SecurityCompliance({
  events,
}: SecurityComplianceProps) {
  const hasPII = events.some((e) => e.type === "pii");

  return (
    <div className="sentinel-card p-0 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-s-border">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-s-cyan" />
          <h2 className="font-display font-semibold text-sm uppercase tracking-[0.15em]">
            Security &amp; Compliance
          </h2>
        </div>
        {hasPII ? (
          <span className="bg-s-red/20 text-s-red text-[10px] font-bold px-2 py-0.5 rounded-full border border-s-red/30 animate-pulse">
            PII ALERT
          </span>
        ) : (
          <span className="bg-s-green/10 text-s-green text-[10px] font-bold px-2 py-0.5 rounded-full border border-s-green/20">
            ISO 27001
          </span>
        )}
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto min-h-0 max-h-[300px] divide-y divide-s-border/30">
        {events.map((evt, i) => (
          <div
            key={`${evt.transaction_id}-${i}`}
            className="px-4 py-3 hover:bg-s-surface/30 transition-colors feed-row-enter"
          >
            <div className="flex items-start gap-3">
              {/* Badge */}
              {evt.type === "pii" ? (
                <span className="flex items-center gap-1 bg-s-red/15 text-s-red text-[10px] font-bold px-2 py-0.5 rounded border border-s-red/25 whitespace-nowrap mt-0.5">
                  <ShieldAlert className="w-3 h-3" />
                  PII
                </span>
              ) : (
                <span className="flex items-center gap-1 bg-s-amber/15 text-s-amber text-[10px] font-bold px-2 py-0.5 rounded border border-s-amber/25 whitespace-nowrap mt-0.5">
                  <AlertTriangle className="w-3 h-3" />!
                </span>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-s-text">
                    {evt.transaction_id}
                  </span>
                  <span className="text-[10px] text-s-muted">
                    {evt.merchant_name}
                  </span>
                </div>
                <p className="text-[11px] text-s-text/70 font-mono leading-relaxed">
                  {evt.message}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-s-muted font-mono">
                    {evt.cloud_region}
                  </span>
                  {evt.timestamp && (
                    <span className="text-[10px] text-s-muted font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-s-muted text-xs gap-2">
            <ShieldCheck className="w-5 h-5" />
            No security events — all clear
          </div>
        )}
      </div>
    </div>
  );
}
