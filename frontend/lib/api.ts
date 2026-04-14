// ─── API Client & SSE Hook for Kairos ───────────────────────────────────────
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// The backend URL is now fetched relative to Next.js host
const API_BASE = "/api";
// Note: We deliberately do NOT use NEXT_PUBLIC_API_SECRET_KEY to prevent
// leaking the key to the browser. The Next.js API route handles the actual
// attachment of the API key to backend requests.

// ─── Types ──────────────────────────────────────────────────────────────────
export interface Transaction {
  transaction_id: string;
  merchant_raw: string;
  merchant_name: string;
  category: string;
  amount: number;
  cloud_region: string;
  latency_ms: number;
  status: "success" | "degraded" | "fail";
  error_code: string | null;
  has_pii_risk: boolean;
  timestamp: string;
}

export interface Metrics {
  health_score: number;
  success_rate: number;
  avg_latency: number;
  sla_compliance: number;
  total_breaches: number;
  throughput_per_min: number;
  region_health: Record<
    string,
    { success_rate: number; avg_latency: number }
  >;
}

export interface Incident {
  transaction_id: string;
  merchant_name: string;
  merchant_raw: string;
  category: string;
  error_code: string;
  cloud_region: string;
  latency_ms: number;
  status: string;
  has_pii_risk: boolean;
  rca_generated: boolean;
  rca_text: string | null;
  timestamp: string;
}

export interface SecurityEvent {
  type: "pii" | "anomaly";
  transaction_id: string;
  merchant_name: string;
  cloud_region: string;
  message: string;
  timestamp: string;
}

// ─── Auth Headers ───────────────────────────────────────────────────────────
function getAuthHeaders(): Record<string, string> {
  // Proxy handles attaching the actual X-API-Key natively on backend
  return {
    "Content-Type": "application/json",
  };
}

// ─── SSE Hook ───────────────────────────────────────────────────────────────
export function useTransactionStream(paused: boolean = false) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (paused) return;

    try {
      const es = new EventSource(`${API_BASE}/stream`);
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      es.onmessage = (event) => {
        try {
          const txn: Transaction = JSON.parse(event.data);
          setTransactions((prev) => [txn, ...prev].slice(0, 200));
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        setError("Stream disconnected");
        es.close();

        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch {
      setError("Failed to connect to stream");
      setIsConnected(false);
    }
  }, [paused]);

  useEffect(() => {
    if (!paused) {
      connect();
    }

    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [paused, connect]);

  return { transactions, isConnected, error };
}

// ─── API Functions ──────────────────────────────────────────────────────────
export async function fetchMetrics(): Promise<Metrics> {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
}

export async function fetchIncidents(): Promise<Incident[]> {
  const res = await fetch(`${API_BASE}/incidents`);
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

export async function fetchSecurityEvents(): Promise<SecurityEvent[]> {
  const res = await fetch(`${API_BASE}/security/events`);
  if (!res.ok) throw new Error("Failed to fetch security events");
  return res.json();
}

export async function triggerAnomaly(
  durationSeconds: number = 30
): Promise<void> {
  await fetch(`${API_BASE}/anomaly/trigger`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ duration_seconds: durationSeconds }),
  });
}

export async function clearAnomaly(): Promise<void> {
  await fetch(`${API_BASE}/anomaly/clear`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
}

export async function generateRCA(
  txnId: string
): Promise<{ transaction_id: string; rca: string }> {
  const res = await fetch(`${API_BASE}/rca/generate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ transaction_id: txnId }),
  });
  if (!res.ok) throw new Error("RCA generation failed");
  return res.json();
}

// ─── ChatOps ────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

export async function sendChatMessage(
  message: string
): Promise<{ response: string; context_used: Record<string, unknown> }> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error("Chat request failed");
  return res.json();
}

// ─── Anomaly Alerts ─────────────────────────────────────────────────────────
export interface AnomalyAlert {
  type: string;
  severity: "warning" | "critical";
  message: string;
  affected_entity: string;
  timestamp: string;
}

export async function fetchAnomalies(): Promise<AnomalyAlert[]> {
  const res = await fetch(`${API_BASE}/anomalies/detected`);
  if (!res.ok) throw new Error("Failed to fetch anomalies");
  return res.json();
}

// ─── Webhook Log ────────────────────────────────────────────────────────────
export interface WebhookEvent {
  id: string;
  event: string;
  severity: string;
  title: string;
  channel: string;
  status: "delivered" | "simulated";
  timestamp: string;
}

export async function fetchWebhookLog(): Promise<WebhookEvent[]> {
  const res = await fetch(`${API_BASE}/webhooks/log`);
  if (!res.ok) throw new Error("Failed to fetch webhook log");
  return res.json();
}
