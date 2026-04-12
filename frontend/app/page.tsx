"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Pause,
  Play,
  Flame,
  Clock,
  Globe,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  useTransactionStream,
  fetchMetrics,
  fetchIncidents,
  fetchSecurityEvents,
  triggerAnomaly,
  clearAnomaly,
} from "@/lib/api";
import type { Metrics, Incident, SecurityEvent } from "@/lib/api";
import MetricCards from "@/components/MetricCards";
import TransactionFeed from "@/components/TransactionFeed";
import SLARiskPredictor from "@/components/SLARiskPredictor";
import AITriagePanel from "@/components/AITriagePanel";
import SecurityCompliance from "@/components/SecurityCompliance";

export default function Dashboard() {
  const [paused, setPaused] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [clock, setClock] = useState("");
  const [faultCountdown, setFaultCountdown] = useState(0);
  const [faultActive, setFaultActive] = useState(false);

  // SSE stream
  const { transactions, isConnected } = useTransactionStream(paused);

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("en-IN", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll metrics every 3s
  useEffect(() => {
    const poll = async () => {
      try {
        const m = await fetchMetrics();
        setMetrics(m);
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  // Poll incidents every 5s
  const pollIncidents = useCallback(async () => {
    try {
      const inc = await fetchIncidents();
      setIncidents(inc);
    } catch {}
  }, []);

  useEffect(() => {
    pollIncidents();
    const interval = setInterval(pollIncidents, 5000);
    return () => clearInterval(interval);
  }, [pollIncidents]);

  // Poll security events every 4s
  useEffect(() => {
    const poll = async () => {
      try {
        const evts = await fetchSecurityEvents();
        setSecurityEvents(evts);
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fault injection countdown
  useEffect(() => {
    if (faultCountdown <= 0) {
      setFaultActive(false);
      return;
    }
    const timer = setTimeout(() => {
      setFaultCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [faultCountdown]);

  const handleInjectFault = async () => {
    try {
      await triggerAnomaly(30);
      setFaultActive(true);
      setFaultCountdown(30);
    } catch {}
  };

  const handleClearFault = async () => {
    try {
      await clearAnomaly();
      setFaultActive(false);
      setFaultCountdown(0);
    } catch {}
  };

  // Region status pills derived from metrics
  const regionStatuses = metrics?.region_health
    ? Object.entries(metrics.region_health).map(([region, data]) => ({
        region,
        ok: data.success_rate > 75,
      }))
    : [];

  return (
    <div className="min-h-screen p-3 md:p-4 lg:p-5 space-y-4">
      {/* ─── Top Bar ──────────────────────────────────────────────────── */}
      <header className="sentinel-card px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-s-cyan to-s-purple flex items-center justify-center">
            <Activity className="w-5 h-5 text-s-bg" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-wide leading-none">
              <span className="text-s-cyan">KAI</span>
              <span className="text-s-text">ROS</span>
            </h1>
            <p className="text-[9px] text-s-muted font-mono uppercase tracking-[0.15em]">
              Observability Platform
            </p>
          </div>
        </div>

        {/* Region pills */}
        <div className="hidden md:flex items-center gap-2">
          {regionStatuses.map(({ region, ok }) => (
            <div
              key={region}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border ${
                ok
                  ? "bg-s-green/5 text-s-green border-s-green/20"
                  : "bg-s-red/5 text-s-red border-s-red/20"
              }`}
            >
              <Globe className="w-3 h-3" />
              {region.replace("Azure ", "AZ:").replace("AWS ", "AWS:").replace("GCP ", "GCP:")}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div
            className={`flex items-center gap-1.5 text-[10px] font-mono ${
              isConnected ? "text-s-green" : "text-s-red"
            }`}
          >
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            {isConnected ? "LIVE" : "DISCONNECTED"}
          </div>

          {/* Live/Pause toggle */}
          <button
            onClick={() => setPaused(!paused)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 ${
              paused
                ? "bg-s-green/10 border-s-green/20 text-s-green hover:bg-s-green/20"
                : "bg-s-amber/10 border-s-amber/20 text-s-amber hover:bg-s-amber/20"
            }`}
          >
            {paused ? (
              <Play className="w-3 h-3" />
            ) : (
              <Pause className="w-3 h-3" />
            )}
            {paused ? "Resume" : "Pause"}
          </button>

          {/* Inject Fault */}
          {!faultActive ? (
            <button
              onClick={handleInjectFault}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-s-red/10 border border-s-red/20 text-s-red hover:bg-s-red/20 transition-all duration-200"
            >
              <Flame className="w-3 h-3" />
              Inject Fault
            </button>
          ) : (
            <button
              onClick={handleClearFault}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-s-red/20 border border-s-red/40 text-s-red animate-pulse"
            >
              <Flame className="w-3 h-3" />
              FAULT {faultCountdown}s
            </button>
          )}

          {/* Clock */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-s-muted">
            <Clock className="w-3.5 h-3.5" />
            {clock}
          </div>
        </div>
      </header>

      {/* ─── Metrics Row ──────────────────────────────────────────────── */}
      <MetricCards metrics={metrics} />

      {/* ─── Main Grid: Feed + SLA ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-4">
        <TransactionFeed transactions={transactions} />
        <SLARiskPredictor metrics={metrics} />
      </div>

      {/* ─── Bottom Grid: AI Triage + Security ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AITriagePanel
          incidents={incidents}
          onRcaGenerated={pollIncidents}
        />
        <SecurityCompliance events={securityEvents} />
      </div>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer className="text-center text-[10px] text-s-muted/50 py-2 font-mono">
        Kairos v1.0 · Know the critical moment before it passes. · Portfolio
        Project
      </footer>
    </div>
  );
}
