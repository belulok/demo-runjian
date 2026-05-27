import type { AgentId } from "./agents";

export type AlarmSeverity = "critical" | "major" | "minor" | "info";
export type AlarmType = "hot_spot" | "low_output" | "string_offline" | "comms_loss" | "temp_high" | "ground_fault" | "shading" | "soiling";
export type AlarmStatus = "open" | "acknowledged" | "resolved";

export type Alarm = {
  id: string;
  deviceId: string;
  plantId: string;
  severity: AlarmSeverity;
  type: AlarmType;
  message: string;
  recommendation: string;
  timestamp: number;
  status: AlarmStatus;
  recommendedAgent: AgentId;
  estimatedLossKWh?: number;
};

export const ALARM_MESSAGES: Record<AlarmType, { msg: string; rec: string; agent: AgentId }> = {
  hot_spot: {
    msg: "Thermal anomaly detected on string. Local cell temp +18°C above baseline.",
    rec: "Dispatch inspection drone. Likely soldering defect or shading cell.",
    agent: "diagnosis",
  },
  low_output: {
    msg: "String output 23% below predicted for current irradiance.",
    rec: "Cross-reference with cleaning schedule. Possible soiling.",
    agent: "warning",
  },
  string_offline: {
    msg: "Communication lost with PV string. Last seen 4m ago.",
    rec: "Auto-draft work order for combiner box inspection.",
    agent: "ticket",
  },
  comms_loss: {
    msg: "Modbus heartbeat missing from device.",
    rec: "Check network switch + RS485 wiring.",
    agent: "alarm",
  },
  temp_high: {
    msg: "Inverter cabinet temp above safe operating envelope.",
    rec: "Reduce active power 15%. Schedule ventilation check.",
    agent: "safety",
  },
  ground_fault: {
    msg: "Ground fault current detected. Isolation impedance dropped below 10kΩ.",
    rec: "Isolate string. High-priority safety dispatch required.",
    agent: "safety",
  },
  shading: {
    msg: "Persistent shading pattern detected over Array A3 from 08:20.",
    rec: "Verify vegetation growth or temporary obstruction.",
    agent: "diagnosis",
  },
  soiling: {
    msg: "Performance ratio decline consistent with surface soiling.",
    rec: "Schedule washing crew. ROI threshold reached.",
    agent: "scheduling",
  },
};

/** Seed alarms — at least one open at startup so the world feels alive immediately. */
export const SEED_ALARMS: Alarm[] = [
  {
    id: "ALM-100023",
    deviceId: "DEV-JHR-INV-01",
    plantId: "PLT-JHR-001",
    severity: "major",
    type: "temp_high",
    message: ALARM_MESSAGES.temp_high.msg,
    recommendation: ALARM_MESSAGES.temp_high.rec,
    timestamp: Date.now() - 1000 * 60 * 4,
    status: "open",
    recommendedAgent: "safety",
    estimatedLossKWh: 47,
  },
  {
    id: "ALM-100024",
    deviceId: "DEV-JHR-PNL-03",
    plantId: "PLT-JHR-001",
    severity: "critical",
    type: "hot_spot",
    message: ALARM_MESSAGES.hot_spot.msg,
    recommendation: ALARM_MESSAGES.hot_spot.rec,
    timestamp: Date.now() - 1000 * 60 * 7,
    status: "open",
    recommendedAgent: "diagnosis",
    estimatedLossKWh: 112,
  },
  {
    id: "ALM-100025",
    deviceId: "DEV-JHR-PNL-07",
    plantId: "PLT-JHR-001",
    severity: "minor",
    type: "low_output",
    message: ALARM_MESSAGES.low_output.msg,
    recommendation: ALARM_MESSAGES.low_output.rec,
    timestamp: Date.now() - 1000 * 60 * 12,
    status: "acknowledged",
    recommendedAgent: "warning",
    estimatedLossKWh: 34,
  },
];
