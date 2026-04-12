"use client";

import { useState } from "react";
import { Bot, Zap, Loader2, AlertCircle } from "lucide-react";
import type { Incident } from "@/lib/api";
import { generateRCA } from "@/lib/api";

interface AITriagePanelProps {
  incidents: Incident[];
  onRcaGenerated?: () => void;
}

export default function AITriagePanel({
  incidents,
  onRcaGenerated,
}: AITriagePanelProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rcaResults, setRcaResults] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleAnalyze = async (txnId: string) => {
    setLoadingId(txnId);
    setErrors((prev) => ({ ...prev, [txnId]: false }));

    try {
      const result = await generateRCA(txnId);
      setRcaResults((prev) => ({ ...prev, [txnId]: result.rca }));
      onRcaGenerated?.();
    } catch {
      setErrors((prev) => ({ ...prev, [txnId]: true }));
      setRcaResults((prev) => ({
        ...prev,
        [txnId]: "> Kairos AI Agent offline. Manual triage required.",
      }));
    } finally {
      setLoadingId(null);
    }
  };

  const incidentCount = incidents.length;

  return (
    <div className="sentinel-card p-0 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-s-border">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-s-cyan" />
          <h2 className="font-display font-semibold text-sm uppercase tracking-[0.15em]">
            AI Triage Agent
          </h2>
        </div>
        <span className="bg-s-red/20 text-s-red text-[10px] font-bold px-2 py-0.5 rounded-full border border-s-red/30">
          {incidentCount} INCIDENTS
        </span>
      </div>

      {/* Incident list */}
      <div className="flex-1 overflow-y-auto min-h-0 max-h-[300px] divide-y divide-s-border/30">
        {incidents.map((inc) => {
          const hasRca =
            inc.rca_generated || rcaResults[inc.transaction_id] !== undefined;
          const rcaText =
            rcaResults[inc.transaction_id] || inc.rca_text || null;
          const isLoading = loadingId === inc.transaction_id;
          const hasError = errors[inc.transaction_id];

          return (
            <div
              key={inc.transaction_id}
              className="px-4 py-3 hover:bg-s-surface/30 transition-colors"
            >
              {/* Incident info row */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-s-text">
                      {inc.transaction_id}
                    </span>
                    <span className="text-[10px] text-s-muted">
                      {inc.merchant_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] font-mono text-s-red bg-s-red/10 px-1.5 py-0.5 rounded border border-s-red/20">
                      {inc.error_code}
                    </span>
                    <span className="text-[10px] text-s-muted font-mono">
                      {inc.cloud_region}
                    </span>
                    <span className="text-[10px] text-s-muted font-mono">
                      {inc.latency_ms}ms
                    </span>
                  </div>
                </div>

                {/* Analyze button */}
                {!hasRca && !isLoading && (
                  <button
                    onClick={() => handleAnalyze(inc.transaction_id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-s-cyan/10 text-s-cyan text-[10px] font-bold uppercase tracking-wider border border-s-cyan/20 rounded hover:bg-s-cyan/20 transition-all duration-200 whitespace-nowrap"
                  >
                    <Zap className="w-3 h-3" />
                    AI Analyze →
                  </button>
                )}

                {isLoading && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-s-cyan text-[10px] font-mono">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>&gt; Connecting to Kairos AI Agent...</span>
                  </div>
                )}

                {hasRca && !isLoading && (
                  <span className="text-[10px] text-s-green font-mono">
                    ✓ RCA
                  </span>
                )}
              </div>

              {/* RCA result */}
              {rcaText && (
                <div
                  className={`border-l-2 pl-3 py-2 mt-2 text-[11px] font-mono leading-relaxed whitespace-pre-wrap ${
                    hasError
                      ? "border-l-s-red text-s-red/80"
                      : "border-l-s-cyan text-s-text/80"
                  }`}
                >
                  {rcaText}
                </div>
              )}
            </div>
          );
        })}

        {incidents.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-s-muted text-xs gap-2">
            <AlertCircle className="w-5 h-5" />
            No incidents detected
          </div>
        )}
      </div>
    </div>
  );
}
