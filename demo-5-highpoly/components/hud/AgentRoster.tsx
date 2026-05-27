"use client";

import { AGENTS } from "@/lib/mock/agents";
import { useAgentStore } from "@/lib/store/agentStore";
import { Panel } from "@/components/primitives/Panel";
import { OrnateTitle } from "@/components/primitives/OrnateTitle";
import { AgentCard } from "./AgentCard";

export function AgentRoster() {
  const statuses = useAgentStore((s) => s.statuses);
  const activeCount = Object.values(statuses).filter((s) => s !== "idle").length;

  return (
    <aside className="absolute right-3 top-[200px] w-64 h-[480px] z-20 pointer-events-none">
      <Panel
        className="h-full pointer-events-auto"
        accentColor="var(--color-gold-rim)"
        glowColor="var(--color-gold-glow)"
        ribSide="top"
      >
        <div className="flex flex-col h-full px-2.5 py-2.5 gap-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-[var(--color-rule)]">
            <OrnateTitle size="xs">Agent Roster</OrnateTitle>
            <div className="font-mono text-[10px] text-text-muted">
              {activeCount > 0 ? (
                <span className="text-amber-400">{activeCount} active</span>
              ) : (
                <span>10 idle</span>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-dark space-y-1 pr-0.5">
            {AGENTS.map((agent) => (
              <AgentCard key={agent.id} agent={agent} status={statuses[agent.id]} />
            ))}
          </div>
          <div className="pt-1.5 border-t border-[var(--color-rule)]">
            <div className="flex items-center gap-1.5 text-[9px] text-text-muted font-condensed uppercase tracking-[0.18em]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Supervisor online
            </div>
          </div>
        </div>
      </Panel>
    </aside>
  );
}
