/**
 * Stations — one per existing plant, each typed as a distinct station kind.
 * Drives the new AI Team Brief panel: each station defines its AI team and
 * a chain-effect playbook (sequential agent activations + human-readable
 * text output).
 *
 * All copy here is mock data. Wire to real LLM output later by replacing
 * `ChainStep.text` with calls into your orchestration layer.
 */

import type { AgentId } from "./agents";

export type StationType =
  | "command_center"
  | "power_tower"
  | "power_station"
  | "solar_power"
  | "solar_house";

export type StationStatus = "normal" | "warning" | "critical";

export type ChainStep = {
  agentId: AgentId;
  /** Cumulative milliseconds from chain start. */
  delayMs: number;
  /** How long the agent's status stays in `responding` before reverting. */
  durationMs: number;
  /** Human-readable text shown in the transcript. */
  text: string;
};

export type Station = {
  id: string;
  plantId: string;
  name: string;
  type: StationType;
  status: StationStatus;
  /** World anchor (x, y, z) in the unified SimCity-style scene. */
  pos: [number, number, number];
  /** Lead/summary line shown under the station name in the brief. */
  summary: string;
  /** AI team assigned to this station (subset of 10 agents). */
  team: AgentId[];
  /** Chain effect playbook — sequence of agents activating in order. */
  chain: ChainStep[];
};

/** Bounds of the unified world (used by Minimap + camera limits). */
export const WORLD_BOUNDS = { minX: -380, maxX: 380, minZ: -260, maxZ: 260 };

export const STATION_TYPE_LABEL: Record<StationType, string> = {
  command_center: "Command Center",
  power_tower:    "Power Tower",
  power_station:  "Power Station",
  solar_power:    "Solar Power Farm",
  solar_house:    "Solar House",
};

export const STATION_TYPE_GLYPH: Record<StationType, string> = {
  command_center: "⌘",
  power_tower:    "⫯",
  power_station:  "⚡",
  solar_power:    "☀",
  solar_house:    "⌂",
};

export const STATION_TYPE_TINT: Record<StationType, string> = {
  command_center: "#c9a85a",
  power_tower:    "#a855f7",
  power_station:  "#ef4444",
  solar_power:    "#eab308",
  solar_house:    "#34d399",
};

/** 5 stations — one per existing plant. Each plant becomes a different
 *  station type so the world feels varied. */
export const STATIONS: Station[] = [
  {
    id: "STN-JHR",
    plantId: "PLT-JHR-001",
    name: "Johor Power Station",
    type: "power_station",
    status: "critical",
    pos: [-230, 0, 140],
    summary: "Combined-cycle generation site · 1,160 kWp · alarm condition active",
    team: ["alarm", "diagnosis", "safety", "ticket"],
    chain: [
      {
        agentId: "alarm",
        delayMs: 600,
        durationMs: 2400,
        text: "Critical event: Transformer T2 oil temperature 78 °C — approaching alarm threshold (80 °C). Standby protection armed.",
      },
      {
        agentId: "diagnosis",
        delayMs: 3200,
        durationMs: 2400,
        text: "Root cause: cooling fan #3 underperforming. Vibration signature matches bearing wear (precedent set, 11 prior cases). Confidence 0.86.",
      },
      {
        agentId: "safety",
        delayMs: 5800,
        durationMs: 2200,
        text: "Holding dispatch — confined-space entry not certified for crew Charlie. Substituting crew Delta; pre-dispatch briefing acknowledged at 04:18.",
      },
      {
        agentId: "ticket",
        delayMs: 8200,
        durationMs: 2200,
        text: "Drafted WO-2026-0613: fan replacement. Parts staged at depot, ETA 22 min. Awaiting operator confirmation to dispatch.",
      },
    ],
  },
  {
    id: "STN-PNG",
    plantId: "PLT-PNG-001",
    name: "Penang Solar Farm",
    type: "solar_power",
    status: "warning",
    pos: [240, 0, 150],
    summary: "Utility-scale PV array · 2,757 kWp · soiling trend detected",
    team: ["warning", "inspection", "pv_assistant", "scheduling", "operation"],
    chain: [
      {
        agentId: "warning",
        delayMs: 600,
        durationMs: 2400,
        text: "Array B7 performance ratio declining 2.1 %/hr since 09:18. Soiling probability 0.68 — trend matches monsoon-edge dust pattern.",
      },
      {
        agentId: "inspection",
        delayMs: 3200,
        durationMs: 2200,
        text: "Drone sweep authorised. Deploying at next clear window 16:40 — thermal + visible spectrum, two-pass coverage.",
      },
      {
        agentId: "pv_assistant",
        delayMs: 5600,
        durationMs: 2200,
        text: "Cleaning protocol §4.2.1 applies for this module type. Crew should torque DC connectors to 4.5 Nm during inspection.",
      },
      {
        agentId: "scheduling",
        delayMs: 8000,
        durationMs: 2000,
        text: "Optimal route: depot → Array B7 → B8 → return (14 km, 22 min). Wash crew Bravo available, weather window confirmed.",
      },
      {
        agentId: "operation",
        delayMs: 10200,
        durationMs: 2000,
        text: "Estimated yield recovery: +47 kWh post-cleaning. ROI break-even in 6 days. Logging outcome to executive brief.",
      },
    ],
  },
  {
    id: "STN-KDH",
    plantId: "PLT-KDH-001",
    name: "Kedah Solar Residence",
    type: "solar_house",
    status: "normal",
    pos: [-140, 0, -50],
    summary: "Residential rooftop PV · 307 kWp · monitoring",
    team: ["warning", "inspection", "pv_assistant", "data_qa"],
    chain: [
      {
        agentId: "warning",
        delayMs: 600,
        durationMs: 2200,
        text: "Residential PV-12 detected an output gap of 12 % over the last 3 hours. Likely partial shading from a rooftop antenna.",
      },
      {
        agentId: "inspection",
        delayMs: 3000,
        durationMs: 2200,
        text: "Homeowner notified through the portal — preliminary visual inspection requested. No drone needed for a single-unit residential.",
      },
      {
        agentId: "pv_assistant",
        delayMs: 5400,
        durationMs: 2200,
        text: "Suggested action: trim adjacent vegetation. If antenna position is fixed, consider a micro-inverter retrofit (spec sheet attached).",
      },
      {
        agentId: "data_qa",
        delayMs: 7800,
        durationMs: 2000,
        text: "Generation history: 23 kWh/day average past 30 days, 18 kWh/day past week. Variance correlates with vegetation growth season.",
      },
    ],
  },
  {
    id: "STN-PRK",
    plantId: "PLT-PRK-001",
    name: "Perak Transmission Tower",
    type: "power_tower",
    status: "normal",
    pos: [270, 0, 30],
    summary: "275 kV grid tower · 2,855 kWp upstream · thermal watch",
    team: ["alarm", "warning", "diagnosis", "scheduling"],
    chain: [
      {
        agentId: "alarm",
        delayMs: 600,
        durationMs: 2200,
        text: "Conductor temperature warning on Tower-117. Rise of +14 °C above seasonal baseline; phase B is leading.",
      },
      {
        agentId: "warning",
        delayMs: 3000,
        durationMs: 2400,
        text: "Trend forecast: thermal limit reached in 4.2 hours at current loading. Preventive action recommended within 90 minutes.",
      },
      {
        agentId: "diagnosis",
        delayMs: 5600,
        durationMs: 2400,
        text: "Most likely cause: vegetation encroachment near phase B. Cross-referenced with last drone sweep — LIDAR delta of 1.4 m since baseline.",
      },
      {
        agentId: "scheduling",
        delayMs: 8200,
        durationMs: 2000,
        text: "Inspection crew Bravo dispatched. Route: Tower-115 → 117 → 119. Travel time 32 min via service road, ETA 14:42.",
      },
    ],
  },
  {
    id: "STN-MLK",
    plantId: "PLT-MLK-001",
    name: "Melaka Command Centre",
    type: "command_center",
    status: "normal",
    pos: [-30, 0, -200],
    summary: "Regional operations hub · grid coordination · multi-asset oversight",
    team: ["alarm", "diagnosis", "ticket", "scheduling", "operation"],
    chain: [
      {
        agentId: "alarm",
        delayMs: 600,
        durationMs: 2200,
        text: "Grid alert: frequency deviation 49.7 Hz at substation T-04. Investigating cross-network impact.",
      },
      {
        agentId: "diagnosis",
        delayMs: 3000,
        durationMs: 2400,
        text: "Root cause: phase imbalance from rapid load drop at industrial zone B. Confidence 0.91. Recovery vector identified.",
      },
      {
        agentId: "ticket",
        delayMs: 5600,
        durationMs: 2000,
        text: "Auto-drafted WO-2026-0612: frequency restoration. Priority P1, assigned to grid-ops on-call.",
      },
      {
        agentId: "scheduling",
        delayMs: 7800,
        durationMs: 2000,
        text: "Dispatch route optimised: depot → substation T-04 via Hwy-12. ETA 8 minutes; crew briefed in transit.",
      },
      {
        agentId: "operation",
        delayMs: 10000,
        durationMs: 2000,
        text: "Revenue impact projection: RM 12k if unresolved beyond 15 minutes. SLA window tracked.",
      },
    ],
  },
];

export const STATION_BY_ID: Record<string, Station> = Object.fromEntries(
  STATIONS.map((s) => [s.id, s]),
);

export const STATION_BY_PLANT_ID: Record<string, Station> = Object.fromEntries(
  STATIONS.map((s) => [s.plantId, s]),
);
