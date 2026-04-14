"use client";

import { useState, useEffect } from "react";
import { Bell, Hash, CheckCircle, Radio, Clock } from "lucide-react";
import type { WebhookEvent } from "@/lib/api";
import { fetchWebhookLog } from "@/lib/api";

export default function WebhookLog() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await fetchWebhookLog();
        setEvents(data);
      } catch {
        // silent fail
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  const severityStyles: Record<string, string> = {
    P1: "bg-s-red/15 text-s-red border-s-red/30",
    P2: "bg-s-amber/15 text-s-amber border-s-amber/30",
    P3: "bg-s-cyan/15 text-s-cyan border-s-cyan/30",
  };

  return (
    <div id="webhooks" className="sentinel-card p-0 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-s-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-s-cyan" />
          <h2 className="font-display font-semibold text-sm uppercase tracking-[0.15em]">
            Escalation Log
          </h2>
        </div>
        <span className="text-[10px] text-s-muted font-mono">
          {events.length} events
        </span>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto min-h-0 max-h-[300px] divide-y divide-s-border/30">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="px-4 py-3 hover:bg-s-surface/30 transition-colors feed-row-enter"
          >
            <div className="flex items-start gap-3">
              {/* Severity badge */}
              <span
                className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border ${
                  severityStyles[evt.severity] || severityStyles.P3
                }`}
              >
                {evt.severity}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono text-s-text/90 leading-relaxed truncate">
                  {evt.title}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  {/* Channel */}
                  <span className="flex items-center gap-1 text-[10px] text-s-muted font-mono">
                    <Hash className="w-3 h-3" />
                    {evt.channel.replace("#", "")}
                  </span>
                  {/* Event type */}
                  <span className="text-[10px] text-s-muted font-mono">
                    {evt.event}
                  </span>
                  {/* Timestamp */}
                  <span className="flex items-center gap-1 text-[10px] text-s-muted font-mono">
                    <Clock className="w-3 h-3" />
                    {evt.timestamp
                      ? new Date(evt.timestamp).toLocaleTimeString("en-IN", {
                          hour12: false,
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Delivery status */}
              <span
                className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap ${
                  evt.status === "delivered"
                    ? "bg-s-green/10 text-s-green border-s-green/20"
                    : "bg-s-amber/10 text-s-amber border-s-amber/20"
                }`}
              >
                {evt.status === "delivered" ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <Radio className="w-3 h-3" />
                )}
                {evt.status}
              </span>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-s-muted text-xs gap-2">
            <Bell className="w-5 h-5" />
            No escalation events — all quiet
          </div>
        )}
      </div>
    </div>
  );
}
