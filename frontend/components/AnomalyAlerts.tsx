"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, AlertOctagon, X, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AnomalyAlert } from "@/lib/api";
import { fetchAnomalies } from "@/lib/api";

export default function AnomalyAlerts() {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await fetchAnomalies();
        setAlerts(data);
      } catch {
        // silent fail
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  const visibleAlerts = alerts.filter(
    (a) => !dismissed.has(`${a.type}-${a.affected_entity}`)
  );

  const handleDismiss = (alert: AnomalyAlert) => {
    setDismissed((prev) => new Set(prev).add(`${alert.type}-${alert.affected_entity}`));
  };

  if (visibleAlerts.length === 0) return null;

  return (
    <div id="anomaly-alerts" className="space-y-2">
      <AnimatePresence>
        {visibleAlerts.map((alert, i) => (
          <motion.div
            key={`${alert.type}-${alert.affected_entity}-${i}`}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${
              alert.severity === "critical"
                ? "bg-s-red/8 border-s-red/25 text-s-red"
                : "bg-s-amber/8 border-s-amber/25 text-s-amber"
            }`}
          >
            {alert.severity === "critical" ? (
              <AlertOctagon className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            )}
            <Bell className="w-3 h-3 flex-shrink-0 animate-pulse" />
            <span className="flex-1 text-[11px] font-mono leading-relaxed">
              {alert.message}
            </span>
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                alert.severity === "critical"
                  ? "bg-s-red/15 border-s-red/30"
                  : "bg-s-amber/15 border-s-amber/30"
              }`}
            >
              {alert.severity}
            </span>
            <button
              onClick={() => handleDismiss(alert)}
              className="p-1 hover:bg-s-surface/50 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
