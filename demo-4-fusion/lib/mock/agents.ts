export type AgentId =
  | "alarm"
  | "diagnosis"
  | "warning"
  | "pv_assistant"
  | "scheduling"
  | "inspection"
  | "ticket"
  | "data_qa"
  | "operation"
  | "safety";

export type AgentStatus = "idle" | "thinking" | "responding" | "alert";

export type Agent = {
  id: AgentId;
  name: string;
  cnName: string;
  shortName: string;
  role: string;
  motto: string;
  className: string;
  level: number;
  /** Single-letter glyph used in the portrait — stylized as a class icon.
   *  Falls back if `image` is unset. */
  glyph: string;
  /** Optional 3D-rendered chibi-robot avatar in /public/images/ai-agents.
   *  When present, the portrait renders this image instead of the glyph. */
  image?: string;
};

export const AGENTS: readonly Agent[] = [
  {
    id: "alarm",
    name: "iRun.Alarm",
    cnName: "告警智能体",
    shortName: "ALRM",
    role: "Digital Monitoring Operator",
    motto: "All events. All hours. Nothing escapes.",
    className: "Sentinel",
    level: 24,
    glyph: "⚠",
    image: "/images/ai-agents/alarm-agent.png",
  },
  {
    id: "diagnosis",
    name: "iRun.Diagnosis",
    cnName: "诊断智能体",
    shortName: "DIAG",
    role: "Technical Expert",
    motto: "From symptom to root cause.",
    className: "Analyst",
    level: 18,
    glyph: "✦",
    image: "/images/ai-agents/diagnosis-agent.png",
  },
  {
    id: "warning",
    name: "iRun.Warning",
    cnName: "预警智能体",
    shortName: "WRNG",
    role: "Performance Sentinel",
    motto: "Catch the slope before the fall.",
    className: "Oracle",
    level: 12,
    glyph: "△",
    image: "/images/ai-agents/warning-agent.png",
  },
  {
    id: "pv_assistant",
    name: "iRun.PV Assistant",
    cnName: "知识助手智能体",
    shortName: "KNOW",
    role: "Knowledge Engine",
    motto: "Every fault has a precedent.",
    className: "Scholar",
    level: 22,
    glyph: "❖",
    image: "/images/ai-agents/pv-assistant-agent.png",
  },
  {
    id: "scheduling",
    name: "iRun.Scheduling",
    cnName: "排程智能体",
    shortName: "SCHD",
    role: "Dispatch Commander",
    motto: "Shortest path. Lowest cost.",
    className: "Tactician",
    level: 16,
    glyph: "✺",
    image: "/images/ai-agents/scheduling-agent.png",
  },
  {
    id: "inspection",
    name: "iRun.Inspection",
    cnName: "巡检智能体",
    shortName: "INSP",
    role: "Visual Analyst",
    motto: "Every panel. Every pixel.",
    className: "Scout",
    level: 15,
    glyph: "◉",
    image: "/images/ai-agents/inspection-agent.png",
  },
  {
    id: "ticket",
    name: "iRun.Ticket",
    cnName: "工单智能体",
    shortName: "TKT",
    role: "Work Order Engine",
    motto: "Paperwork zeroed. Action ready.",
    className: "Clerk",
    level: 21,
    glyph: "⌘",
    image: "/images/ai-agents/ticket-agent.png",
  },
  {
    id: "data_qa",
    name: "iRun.Data Q&A",
    cnName: "问数智能体",
    shortName: "DATA",
    role: "Data Concierge",
    motto: "The number finds you.",
    className: "Seeker",
    level: 14,
    glyph: "∑",
    image: "/images/ai-agents/data-qa-agent.png",
  },
  {
    id: "operation",
    name: "iRun.Operation",
    cnName: "运营智能体",
    shortName: "OPS",
    role: "Business Intelligence",
    motto: "Yield. Health. Return.",
    className: "Steward",
    level: 19,
    glyph: "✧",
    // image: "/images/ai-agents/operation-agent.png", // TODO: drop file here
  },
  {
    id: "safety",
    name: "iRun.Safety",
    cnName: "安全智能体",
    shortName: "SAFE",
    role: "Safety Officer",
    motto: "No worker harmed. No asset lost.",
    className: "Warden",
    level: 17,
    glyph: "⛨",
    // image: "/images/ai-agents/safety-agent.png", // TODO: drop file here
  },
] as const;

export const AGENT_BY_ID: Record<AgentId, Agent> = Object.fromEntries(
  AGENTS.map((a) => [a.id, a]),
) as Record<AgentId, Agent>;
