"use client";

import { ALARM_MESSAGES, type Alarm, type AlarmSeverity, type AlarmType } from "./alarms";
import { PRIMARY_DEVICES } from "./devices";
import { useAlertStore } from "@/lib/store/alertStore";
import { useAgentStore } from "@/lib/store/agentStore";
import { useWorldStore } from "@/lib/store/worldStore";
import type { DeviceState } from "./devices";

const TYPES: AlarmType[] = ["hot_spot", "low_output", "string_offline", "comms_loss", "temp_high", "shading"];
const SEVERITIES: { sev: AlarmSeverity; weight: number }[] = [
  { sev: "minor", weight: 4 },
  { sev: "major", weight: 3 },
  { sev: "info", weight: 2 },
  { sev: "critical", weight: 1 },
];

function pickSeverity(): AlarmSeverity {
  const total = SEVERITIES.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const { sev, weight } of SEVERITIES) {
    r -= weight;
    if (r <= 0) return sev;
  }
  return "minor";
}

function severityToDeviceState(sev: AlarmSeverity): DeviceState {
  if (sev === "critical") return "faulted";
  if (sev === "major") return "degraded";
  if (sev === "minor") return "degraded";
  return "healthy";
}

let counter = 100100;

function generateAlarm(): Alarm {
  const dev = PRIMARY_DEVICES[Math.floor(Math.random() * PRIMARY_DEVICES.length)];
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  const severity = pickSeverity();
  const meta = ALARM_MESSAGES[type];
  counter += 1;
  return {
    id: `ALM-${counter}`,
    deviceId: dev.id,
    plantId: dev.plantId,
    severity,
    type,
    message: meta.msg,
    recommendation: meta.rec,
    timestamp: Date.now(),
    status: "open",
    recommendedAgent: meta.agent,
    estimatedLossKWh: Math.floor(Math.random() * 140) + 20,
  };
}

let intervalId: ReturnType<typeof setInterval> | null = null;

/** Begin the mock alert stream. Idempotent. Returns a stop function. */
export function startAlertStream(opts?: { minMs?: number; maxMs?: number }) {
  if (intervalId) return () => stopAlertStream();
  const { minMs = 4500, maxMs = 9000 } = opts ?? {};

  const tick = () => {
    const alarm = generateAlarm();
    useAlertStore.getState().addAlarm(alarm);
    useAgentStore.getState().pulse(alarm.recommendedAgent, "alert", 1800);

    // Push device into a non-healthy state for a while
    const target = severityToDeviceState(alarm.severity);
    if (target !== "healthy") {
      useWorldStore.getState().setDeviceState(alarm.deviceId, target);
      // Recover after 22-40s
      setTimeout(() => {
        useWorldStore.getState().setDeviceState(alarm.deviceId, "healthy");
      }, 22_000 + Math.random() * 18_000);
    }

    const next = minMs + Math.random() * (maxMs - minMs);
    intervalId = setTimeout(tick, next) as unknown as ReturnType<typeof setInterval>;
  };

  // Kick off after a short delay so the demo lands first
  intervalId = setTimeout(tick, 3500) as unknown as ReturnType<typeof setInterval>;

  return () => stopAlertStream();
}

export function stopAlertStream() {
  if (intervalId) {
    clearTimeout(intervalId);
    intervalId = null;
  }
}

/** Synthetic 24×6 telemetry for the detail panel sparkline. */
export function generateSparkline(seed: number, points = 60): number[] {
  const out: number[] = [];
  let phase = (seed * 31) % 100;
  for (let i = 0; i < points; i++) {
    phase = (phase * 1.07 + 13) % 100;
    const wave = Math.sin((i / points) * Math.PI * 2 + seed) * 0.4 + 0.5;
    const noise = (phase / 100) * 0.2;
    out.push(Math.max(0, Math.min(1, wave + noise - 0.1)));
  }
  return out;
}
