"use client";

import { Radio } from "lucide-react";
import type { Transaction } from "@/lib/api";
import LatencySpark from "./LatencySpark";

interface TransactionFeedProps {
  transactions: Transaction[];
}

function shortenRegion(region: string): string {
  const map: Record<string, string> = {
    "Azure East-US": "AZ:East-US",
    "Azure West-EU": "AZ:West-EU",
    "AWS ap-south-1": "AWS:ap-s1",
    "GCP us-central": "GCP:us-c1",
  };
  return map[region] || region;
}

function latencyColor(ms: number): string {
  if (ms < 200) return "bg-s-green";
  if (ms < 400) return "bg-s-amber";
  return "bg-s-red";
}

function latencyPercent(ms: number): number {
  return Math.min((ms / 500) * 100, 100);
}

export default function TransactionFeed({ transactions }: TransactionFeedProps) {
  const visible = transactions.slice(0, 40);
  const latencyValues = transactions.slice(0, 60).map((t) => t.latency_ms).reverse();

  return (
    <div className="sentinel-card p-0 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-s-border">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-s-cyan" />
          <h2 className="font-display font-semibold text-sm uppercase tracking-[0.15em] text-s-text">
            Transaction Feed
          </h2>
        </div>
        <span className="text-xs text-s-muted font-mono">
          {transactions.length} buffered
        </span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1.5fr_2fr_1fr_0.8fr_1.2fr] gap-2 px-4 py-2 text-[10px] text-s-muted uppercase tracking-widest border-b border-s-border/50 font-display font-semibold">
        <span>TXN ID</span>
        <span>Merchant</span>
        <span>Region</span>
        <span>Status</span>
        <span>Latency</span>
      </div>

      {/* Scrollable feed */}
      <div className="flex-1 overflow-y-auto min-h-0 max-h-[420px]">
        {visible.map((txn, i) => (
          <div
            key={`${txn.transaction_id}-${i}`}
            className={`grid grid-cols-[1.5fr_2fr_1fr_0.8fr_1.2fr] gap-2 px-4 py-2.5 items-center border-b border-s-border/30 hover:bg-s-surface/50 transition-colors duration-150 feed-row-enter ${
              txn.status === "fail" ? "border-l-2 border-l-s-red" : ""
            }`}
          >
            {/* TXN ID + raw */}
            <div className="min-w-0">
              <p className="text-xs text-s-text font-mono truncate">
                {txn.transaction_id}
              </p>
              <p className="text-[10px] text-s-muted truncate">
                {txn.merchant_raw}
              </p>
            </div>

            {/* Merchant + amount */}
            <div className="min-w-0">
              <p className="text-xs text-s-text truncate">{txn.merchant_name}</p>
              <p className="text-[10px] text-s-muted truncate">
                ₹{txn.amount.toFixed(2)} · {txn.category}
              </p>
            </div>

            {/* Region */}
            <span className="text-[11px] text-s-muted font-mono">
              {shortenRegion(txn.cloud_region)}
            </span>

            {/* Status badge */}
            <span
              className={`status-pill text-[10px] text-center ${
                txn.status === "success"
                  ? "status-success"
                  : txn.status === "degraded"
                  ? "status-degraded"
                  : "status-fail"
              }`}
            >
              {txn.status}
            </span>

            {/* Latency bar */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-s-text w-10 text-right">
                {txn.latency_ms}
              </span>
              <div className="flex-1 h-1.5 bg-s-border/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${latencyColor(
                    txn.latency_ms
                  )}`}
                  style={{ width: `${latencyPercent(txn.latency_ms)}%` }}
                />
              </div>
            </div>
          </div>
        ))}

        {visible.length === 0 && (
          <div className="flex items-center justify-center h-32 text-s-muted text-sm">
            Waiting for transactions...
          </div>
        )}
      </div>

      {/* Latency sparkline chart */}
      <div className="border-t border-s-border px-4 pt-2 pb-3">
        <p className="text-[10px] text-s-muted uppercase tracking-widest mb-1 font-display">
          Latency Trend (last 60)
        </p>
        <div className="h-16">
          <LatencySpark values={latencyValues} />
        </div>
      </div>
    </div>
  );
}
