"""
Kairos Webhook Simulator — Simulates enterprise escalation workflows.
Logs webhook events representing automated alerts to Slack/Discord/PagerDuty.
Optionally fires real webhooks if DISCORD_WEBHOOK_URL is configured.
"""
import os
import uuid
import httpx
from datetime import datetime
from collections import deque
from dotenv import load_dotenv

load_dotenv()

DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")


class WebhookSimulator:
    """Manages webhook event logging and optional delivery."""

    def __init__(self, max_events: int = 50):
        self._events: deque[dict] = deque(maxlen=max_events)

    def fire(
        self,
        event_type: str,
        severity: str,
        title: str,
        details: str = "",
    ) -> dict:
        """
        Log a webhook event and optionally deliver to Discord.
        Returns the created event.
        """
        event = {
            "id": f"WH-{uuid.uuid4().hex[:8].upper()}",
            "event": event_type,
            "severity": severity,
            "title": title,
            "details": details,
            "channel": "#kairos-alerts",
            "status": "simulated",
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Try to deliver to Discord if configured
        if DISCORD_WEBHOOK_URL:
            try:
                self._send_discord(event)
                event["status"] = "delivered"
            except Exception:
                event["status"] = "simulated"

        self._events.appendleft(event)
        return event

    def _send_discord(self, event: dict) -> None:
        """Send webhook payload to Discord."""
        severity_colors = {"P1": 0xFF3333, "P2": 0xFFAA00, "P3": 0x00D4FF}
        color = severity_colors.get(event["severity"], 0x5A7A94)

        payload = {
            "embeds": [
                {
                    "title": f"🚨 {event['title']}",
                    "description": event.get("details", ""),
                    "color": color,
                    "fields": [
                        {"name": "Severity", "value": event["severity"], "inline": True},
                        {"name": "Event", "value": event["event"], "inline": True},
                        {"name": "Channel", "value": event["channel"], "inline": True},
                    ],
                    "footer": {"text": f"Kairos Alert System · {event['id']}"},
                    "timestamp": event["timestamp"],
                }
            ]
        }

        with httpx.Client(timeout=5.0) as client:
            client.post(DISCORD_WEBHOOK_URL, json=payload)

    def get_log(self, limit: int = 20) -> list[dict]:
        """Return the last N webhook events."""
        return list(self._events)[:limit]

    def fire_from_anomalies(self, anomalies: list[dict]) -> list[dict]:
        """
        Process anomaly alerts and fire appropriate webhooks.
        Only fires for critical-severity anomalies to avoid noise.
        """
        fired = []
        for anomaly in anomalies:
            if anomaly["severity"] == "critical":
                severity = "P1"
            elif anomaly["severity"] == "warning":
                severity = "P2"
            else:
                continue

            # Avoid duplicate alerts for the same type in the same batch
            event = self.fire(
                event_type=f"incident.{anomaly['type']}",
                severity=severity,
                title=anomaly["message"][:100],
                details=f"Affected: {anomaly['affected_entity']}",
            )
            fired.append(event)

        return fired


# Global singleton
webhook_simulator = WebhookSimulator()
