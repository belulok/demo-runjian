/**
 * Per-agent enterprise content shown in AgentPanel.
 * Mock data — would be wired to live signals + LLM outputs once backend is up.
 */

import type { AgentId } from "./agents";

export type AgentStat = {
  label: string;
  value: string;
  unit?: string;
  tone?: "good" | "warn" | "bad" | "muted";
  delta?: string;
};

export type AgentAbility = {
  glyph: string;
  name: string;
  description: string;
  /** Optional KPI shown on the right edge of the ability row. */
  kpi?: { label: string; value: string };
};

export type AgentActivityEntry = {
  ts: number;
  message: string;
};

export type AgentAction = {
  label: string;
  hint?: string;
  primary?: boolean;
  /** Disabled actions still render but signal "coming soon". */
  disabled?: boolean;
};

export type AgentContent = {
  /** Tagline shown under the role on the hero block. */
  tagline: string;
  stats: AgentStat[];
  abilities: AgentAbility[];
  recent: AgentActivityEntry[];
  actions: AgentAction[];
  /** Single sentence about the agent's autonomy level. */
  autonomy: string;
};

const now = Date.now();

export const AGENT_CONTENT: Record<AgentId, AgentContent> = {
  alarm: {
    tagline: "Tracks every event across every sector, in real time.",
    stats: [
      { label: "Events 24h", value: "412", tone: "good" },
      { label: "Avg Response", value: "1.8", unit: "min", tone: "good", delta: "-0.4" },
      { label: "False Positive", value: "3.2", unit: "%", tone: "good", delta: "-0.7" },
      { label: "Escalations", value: "5", tone: "warn" },
    ],
    abilities: [
      {
        glyph: "⚡",
        name: "Severity routing",
        description: "Classifies each event into critical / major / minor / info using a 30-feature live model.",
        kpi: { label: "P50 latency", value: "180ms" },
      },
      {
        glyph: "✦",
        name: "Recommendation engine",
        description: "Produces one of dispatch / observe / escalate per event with a confidence score.",
        kpi: { label: "Acceptance", value: "84%" },
      },
      {
        glyph: "◈",
        name: "Storm cluster detection",
        description: "Groups correlated alerts into single incidents to reduce operator noise.",
        kpi: { label: "Noise cut", value: "-62%" },
      },
    ],
    recent: [
      { ts: now - 1000 * 45, message: "Routed ALM-100024 (hot spot · PNL-03) → Diagnosis." },
      { ts: now - 1000 * 90, message: "Auto-dispatched WO from ALM-100023 (temp_high · INV COM1-5)." },
      { ts: now - 1000 * 60 * 3, message: "Clustered 4 string offlines into incident INC-2026-014." },
      { ts: now - 1000 * 60 * 7, message: "Escalated ALM-100021 to Safety Agent (working-at-height context)." },
    ],
    actions: [
      { label: "Open Alarm Log", primary: true, hint: "Full alarm queue with filters" },
      { label: "Tune Thresholds", hint: "Per-plant sensitivity sliders", disabled: true },
      { label: "Pause Auto-Dispatch", hint: "Stops one-click confirmations" },
    ],
    autonomy: "Class B · operator confirms every dispatch by default.",
  },

  diagnosis: {
    tagline: "Pinpoints root cause and quantifies energy loss for every fault.",
    stats: [
      { label: "Diagnoses 24h", value: "78" },
      { label: "Avg Confidence", value: "0.84", tone: "good", delta: "+0.02" },
      { label: "Loss Quantified", value: "412", unit: "kWh", tone: "warn" },
      { label: "Fault Types", value: "37", tone: "muted" },
    ],
    abilities: [
      {
        glyph: "✦",
        name: "Root-cause inference",
        description: "Cross-references telemetry against a fault knowledge graph with 11,400 indexed cases.",
        kpi: { label: "Precision", value: "0.87" },
      },
      {
        glyph: "Σ",
        name: "Loss quantification",
        description: "Estimates kWh impact + revenue at risk per diagnosed fault.",
        kpi: { label: "MAE", value: "±8%" },
      },
      {
        glyph: "◇",
        name: "Cross-plant pattern",
        description: "Surfaces recurring failure modes across the fleet for proactive replacement.",
        kpi: { label: "Patterns", value: "9" },
      },
    ],
    recent: [
      { ts: now - 1000 * 60, message: "Hot spot on PNL-03 — solder defect (conf 0.84, loss est 112 kWh)." },
      { ts: now - 1000 * 60 * 4, message: "Soiling pattern on Array B4 — wash ROI breakeven in 9 days." },
      { ts: now - 1000 * 60 * 11, message: "Shading on Array A7 from vegetation growth — flagged for grounds crew." },
    ],
    actions: [
      { label: "Open Fault Graph", primary: true, hint: "Browse the indexed knowledge base", disabled: true },
      { label: "Recompute Active", hint: "Re-run diagnosis on the selected device" },
      { label: "Export Findings", hint: "PDF + JSON of recent conclusions" },
    ],
    autonomy: "Class A · publishes findings autonomously, never actions.",
  },

  warning: {
    tagline: "Catches degradation before it crosses fault thresholds.",
    stats: [
      { label: "Signals 7d", value: "23" },
      { label: "Avg Lead Time", value: "8.4", unit: "hr", tone: "good" },
      { label: "Verified", value: "78", unit: "%", tone: "good" },
      { label: "Suppressed", value: "5", tone: "muted" },
    ],
    abilities: [
      {
        glyph: "△",
        name: "Trend forecasting",
        description: "PR decline trajectories per equipment, 24–72h forward horizon.",
        kpi: { label: "Horizon", value: "72h" },
      },
      {
        glyph: "⟁",
        name: "Soiling-pattern recognition",
        description: "Detects morning ramp losses consistent with surface accumulation.",
      },
      {
        glyph: "≡",
        name: "Baseline drift detection",
        description: "Tracks PR baselines per season + plant + equipment age.",
      },
    ],
    recent: [
      { ts: now - 1000 * 60 * 6, message: "Array A7 PR declining 1.8 %/hr — soiling probability 0.73." },
      { ts: now - 1000 * 60 * 22, message: "Inverter COM2-5 efficiency curve drifting — 4d to action threshold." },
      { ts: now - 1000 * 60 * 90, message: "Penang fleet seasonal baseline updated for May." },
    ],
    actions: [
      { label: "Open Forecast Board", primary: true, disabled: true },
      { label: "Promote to Alarm", hint: "Manually escalate a watched signal" },
    ],
    autonomy: "Class A · suggests preventive actions, never blocks.",
  },

  pv_assistant: {
    tagline: "Instant PV expertise — fault cases, manuals, procedures.",
    stats: [
      { label: "Queries 24h", value: "147" },
      { label: "Avg Response", value: "1.2", unit: "s", tone: "good" },
      { label: "Citation Rate", value: "94", unit: "%", tone: "good" },
      { label: "KB Docs", value: "11.4k", tone: "muted" },
    ],
    abilities: [
      {
        glyph: "❖",
        name: "Fault case retrieval",
        description: "RAG over 11,400 indexed fault cases with embedded photos + diagnostics.",
        kpi: { label: "Recall@5", value: "0.91" },
      },
      {
        glyph: "▤",
        name: "Manual lookup",
        description: "Pulls device-specific procedures from Huawei, iSolarCloud, SMA libraries.",
      },
      {
        glyph: "✎",
        name: "Operator coaching",
        description: "Surfaces SOPs in context for new staff during real incidents.",
      },
    ],
    recent: [
      { ts: now - 1000 * 60 * 2, message: "Answered: \"What torque for SMA SMTR-101 DC connectors?\" (cite §4.2.1)." },
      { ts: now - 1000 * 60 * 18, message: "Recommended cleaning protocol for Penang module surface soiling." },
      { ts: now - 1000 * 60 * 55, message: "Indexed 142 new fault notes overnight." },
    ],
    actions: [
      { label: "Ask a Question", primary: true, hint: "Opens a contextual prompt" },
      { label: "Browse Library", disabled: true },
    ],
    autonomy: "Class A · answers in operator context, never executes.",
  },

  scheduling: {
    tagline: "Plans every dispatch for shortest path and lowest cost.",
    stats: [
      { label: "Dispatches 24h", value: "31" },
      { label: "Travel Saved", value: "112", unit: "km", tone: "good" },
      { label: "Avg Optimization", value: "+17", unit: "%", tone: "good" },
      { label: "Live Crews", value: "6" },
    ],
    abilities: [
      {
        glyph: "✺",
        name: "Route optimization",
        description: "OR-Tools VRP over crew + work-order + weather + traffic constraints.",
        kpi: { label: "P95 solve", value: "320ms" },
      },
      {
        glyph: "⚒",
        name: "Skill matching",
        description: "Assigns work orders by required certifications + crew availability.",
      },
      {
        glyph: "☼",
        name: "Weather-aware scheduling",
        description: "Defers safety-sensitive tasks during high-wind or rain windows.",
      },
    ],
    recent: [
      { ts: now - 1000 * 60 * 4, message: "Optimal route: depot → COM1-5 → PNL-03 → return (14 km, 22 min)." },
      { ts: now - 1000 * 60 * 35, message: "Reassigned WO-2026-0510 from Sarah → Daniel (cert match)." },
      { ts: now - 1000 * 60 * 120, message: "Deferred 2 outdoor tasks at Penang — wind gusts > 35 km/h." },
    ],
    actions: [
      { label: "Open Dispatch Board", primary: true, disabled: true },
      { label: "Force Reoptimize", hint: "Recompute current crew assignments" },
    ],
    autonomy: "Class B · operator approves the recommended route before crews move.",
  },

  inspection: {
    tagline: "Reads every drone and CCTV frame, flags every defect.",
    stats: [
      { label: "Images 7d", value: "8,420" },
      { label: "Defects Found", value: "67", tone: "warn" },
      { label: "Precision", value: "92", unit: "%", tone: "good" },
      { label: "Reports Auto-Gen", value: "14" },
    ],
    abilities: [
      {
        glyph: "◉",
        name: "CV defect detection",
        description: "Classifies cracks, shading, diode faults, hot spots on a per-module basis.",
        kpi: { label: "Classes", value: "23" },
      },
      {
        glyph: "▦",
        name: "Auto-report generation",
        description: "Builds inspection PDFs with annotated images + defect coordinates.",
      },
      {
        glyph: "▲",
        name: "Hot-spot triage",
        description: "Cross-checks thermal imagery against electrical telemetry.",
      },
    ],
    recent: [
      { ts: now - 1000 * 60 * 14, message: "Drone sweep Array B4: 2 minor diode anomalies — queued for next cycle." },
      { ts: now - 1000 * 60 * 95, message: "Generated inspection report INS-2026-051 (Penang block C)." },
      { ts: now - 1000 * 60 * 60 * 6, message: "Flagged hot spot on Johor PNL-03 — handed to Diagnosis." },
    ],
    actions: [
      { label: "Upload Drone Set", primary: true, hint: "Drag & drop a flight folder" },
      { label: "View Latest Report", disabled: true },
    ],
    autonomy: "Class A · annotates findings only; operator decides repair.",
  },

  ticket: {
    tagline: "Drafts every work order. Cuts manual entry by 50%+.",
    stats: [
      { label: "Drafted 24h", value: "19", tone: "good" },
      { label: "Auto-fill Rate", value: "62", unit: "%", tone: "good", delta: "+8" },
      { label: "Avg Lifecycle", value: "3.2", unit: "h" },
      { label: "Pending", value: "2", tone: "warn" },
    ],
    abilities: [
      {
        glyph: "⌘",
        name: "Auto-draft from alarms",
        description: "Generates a complete work-order skeleton in 800ms from the source event.",
        kpi: { label: "Median fields", value: "12 / 18" },
      },
      {
        glyph: "✦",
        name: "Smart assignment",
        description: "Pre-fills assignee, priority, parts list using historical resolutions.",
      },
      {
        glyph: "≣",
        name: "Form pre-fill",
        description: "Guides field tech through closeout — auto-completes routine sections.",
      },
    ],
    recent: [
      { ts: now - 1000 * 60 * 6, message: "Drafted WO-2026-0518 (P1) from ALM-100024. Awaiting confirmation." },
      { ts: now - 1000 * 60 * 22, message: "Auto-filled 14 of 18 fields on WO-2026-0517 closeout form." },
      { ts: now - 1000 * 60 * 80, message: "Suggested replacement bus assignment for unavailable Tan B.W." },
    ],
    actions: [
      { label: "Open Work Orders", primary: true, hint: "Full ticket log" },
      { label: "Review Pending Drafts", hint: "Approve 2 drafts awaiting operator" },
    ],
    autonomy: "Class B · operator confirms drafts before dispatch.",
  },

  data_qa: {
    tagline: "Natural-language data answers, instantly visualised.",
    stats: [
      { label: "Queries 24h", value: "264" },
      { label: "Avg Latency", value: "0.9", unit: "s", tone: "good" },
      { label: "Self-served", value: "82", unit: "%", tone: "good" },
      { label: "Charts Generated", value: "94" },
    ],
    abilities: [
      {
        glyph: "∑",
        name: "Text-to-SQL",
        description: "Translates natural-language questions into safe parameterised SQL.",
        kpi: { label: "Exec safety", value: "100%" },
      },
      {
        glyph: "◈",
        name: "Context awareness",
        description: "Knows which page the operator is on and pre-suggests relevant queries.",
      },
      {
        glyph: "▰",
        name: "Auto-chart selection",
        description: "Picks line / bar / heatmap / table based on result shape.",
      },
    ],
    recent: [
      { ts: now - 1000 * 60 * 1, message: "\"Top 5 worst-performing strings this week?\" → returned heatmap." },
      { ts: now - 1000 * 60 * 12, message: "\"Penang generation vs forecast May 1–20\" → returned variance chart." },
      { ts: now - 1000 * 60 * 38, message: "Suggested query: \"Why is COM1-5 trending hot?\" — operator accepted." },
    ],
    actions: [
      { label: "Ask Data Q&A", primary: true, hint: "Opens a fresh query bar" },
      { label: "Query History", disabled: true },
    ],
    autonomy: "Class A · read-only; surfaces data, never mutates state.",
  },

  operation: {
    tagline: "Tracks long-term yield, asset health, and business performance.",
    stats: [
      { label: "Plants Monitored", value: "5" },
      { label: "Revenue 30d", value: "RM 384k", tone: "good" },
      { label: "Variance", value: "-2.6", unit: "%", tone: "warn", delta: "-1.1" },
      { label: "Asset Score", value: "B+", tone: "good" },
    ],
    abilities: [
      {
        glyph: "✧",
        name: "Revenue variance",
        description: "Compares actual yield to weather-normalised forecast per plant per month.",
        kpi: { label: "Models", value: "5" },
      },
      {
        glyph: "♠",
        name: "Asset health scoring",
        description: "Combines age + performance + maintenance burden into a single grade.",
      },
      {
        glyph: "✦",
        name: "Executive brief generation",
        description: "Auto-drafts the monthly fleet review for management sign-off.",
      },
    ],
    recent: [
      { ts: now - 1000 * 60 * 30, message: "Penang variance -2.6% — Drafted exec brief PENANG-MAY-2026." },
      { ts: now - 1000 * 60 * 60 * 4, message: "Asset score for COM1-5 dropped B+ → B (rising heat events)." },
      { ts: now - 1000 * 60 * 60 * 18, message: "Forecast model retrained on April actuals — MAE -0.8 pts." },
    ],
    actions: [
      { label: "Open Portfolio Brief", primary: true, disabled: true },
      { label: "Export Monthly Pack", hint: "PDF + Excel + slides" },
    ],
    autonomy: "Class A · presents insights to management only.",
  },

  safety: {
    tagline: "Pre-flight check on every dispatch. Catches hazards before they bite.",
    stats: [
      { label: "Risks Flagged 30d", value: "47" },
      { label: "Dispatches Blocked", value: "9", tone: "warn" },
      { label: "Incidents Prevented", value: "3", tone: "good" },
      { label: "Certs Expiring", value: "2", tone: "bad" },
    ],
    abilities: [
      {
        glyph: "⛨",
        name: "Pre-dispatch risk check",
        description: "Holds any work order whose task + weather + crew combination scores above policy.",
        kpi: { label: "Policies", value: "23" },
      },
      {
        glyph: "⚛",
        name: "Multi-source hazard fusion",
        description: "Combines fire detection, weather, equipment status into a single risk view.",
      },
      {
        glyph: "✎",
        name: "Cert expiry tracking",
        description: "Notifies 30/14/7 days ahead of certification lapses per crew member.",
      },
    ],
    recent: [
      { ts: now - 1000 * 60 * 18, message: "Held WO-2026-0517 — Working-at-height without acknowledged briefing." },
      { ts: now - 1000 * 60 * 60 * 2, message: "Fire-risk averted on Perak TX-PRK-02 — power redirected." },
      { ts: now - 1000 * 60 * 60 * 24, message: "Cert Aisyah Rahman (Drone Pilot Cat A) — expires in 4 days." },
    ],
    actions: [
      { label: "Open Safety Dashboard", primary: true, hint: "Incidents · risk matrix · certs" },
      { label: "Acknowledge Briefing", hint: "Clear a held dispatch" },
    ],
    autonomy: "Class C · can block dispatch autonomously per safety policy.",
  },
};
