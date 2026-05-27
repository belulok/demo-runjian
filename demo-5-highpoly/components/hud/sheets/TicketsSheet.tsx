"use client";

import { useState } from "react";
import { SEED_WORK_ORDERS, type WorkOrderStatus, type WorkOrderPriority } from "@/lib/mock/workOrders";
import { DEVICE_BY_ID } from "@/lib/mock/devices";
import { PLANT_BY_ID } from "@/lib/mock/plants";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

type StatusFilter = WorkOrderStatus | "all";
type PriorityFilter = WorkOrderPriority | "all";

const STATUS_COLOR: Record<WorkOrderStatus, string> = {
  pending: "#f59e0b",
  dispatched: "#3b82f6",
  in_progress: "#a855f7",
  completed: "#22c55e",
};

const PRIORITY_LABEL: Record<WorkOrderPriority, { label: string; color: string }> = {
  p1: { label: "P1 · Critical", color: "#ef4444" },
  p2: { label: "P2 · High", color: "#f59e0b" },
  p3: { label: "P3 · Normal", color: "#3b82f6" },
};

export function TicketsSheet() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

  const filtered = SEED_WORK_ORDERS.filter(
    (w) =>
      (statusFilter === "all" || w.status === statusFilter) &&
      (priorityFilter === "all" || w.priority === priorityFilter),
  );

  return (
    <div className="flex flex-col h-full">
      {/* Filter strip */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--color-rule)] gap-3">
        <div className="flex items-center gap-1.5">
          <span className="font-condensed text-[10px] uppercase tracking-[0.16em] text-text-muted">
            Status
          </span>
          {(["all", "pending", "dispatched", "in_progress", "completed"] as const).map((s) => (
            <Chip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
              {s.replace("_", " ")}
            </Chip>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-condensed text-[10px] uppercase tracking-[0.16em] text-text-muted">
            Priority
          </span>
          {(["all", "p1", "p2", "p3"] as const).map((p) => (
            <Chip key={p} active={priorityFilter === p} onClick={() => setPriorityFilter(p)}>
              {p}
            </Chip>
          ))}
        </div>
        <div className="font-mono text-[10px] text-text-muted">
          {filtered.length} of {SEED_WORK_ORDERS.length}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto scrollbar-dark pr-1">
        <table className="w-full text-[11px]">
          <thead className="text-text-muted font-condensed uppercase tracking-[0.16em] sticky top-0 bg-[#0a0e1a]">
            <tr className="border-b border-[var(--color-rule)]">
              <th className="text-left py-1.5 pl-2 font-semibold w-28">ID</th>
              <th className="text-left font-semibold w-32">Priority</th>
              <th className="text-left font-semibold">Title</th>
              <th className="text-left font-semibold">Device · Plant</th>
              <th className="text-left font-semibold w-32">Status</th>
              <th className="text-left font-semibold">Assignee</th>
              <th className="text-right font-semibold w-16">Created</th>
              <th className="text-right font-semibold w-16">Due</th>
              <th className="text-right font-semibold w-20 pr-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-text-muted italic text-[11px]">
                  No work orders match the current filters.
                </td>
              </tr>
            )}
            {filtered.map((w, i) => {
              const device = DEVICE_BY_ID[w.deviceId];
              const plant = PLANT_BY_ID[w.plantId];
              const priorityInfo = PRIORITY_LABEL[w.priority];
              return (
                <tr
                  key={w.id}
                  className={cn(
                    "border-b border-[var(--color-rule)] hover:bg-[#10162a]",
                    i % 2 === 0 ? "bg-[#0a0f1c]" : "bg-transparent",
                  )}
                >
                  <td className="py-1.5 pl-2 font-mono text-[10px] text-text-secondary">{w.id}</td>
                  <td>
                    <span
                      className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em]"
                      style={{ color: priorityInfo.color }}
                    >
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{ background: priorityInfo.color, boxShadow: `0 0 6px ${priorityInfo.color}` }}
                      />
                      {priorityInfo.label}
                    </span>
                  </td>
                  <td className="font-condensed text-text-primary">{w.title}</td>
                  <td>
                    <div className="font-condensed text-text-secondary">{device?.name ?? w.deviceId}</div>
                    <div className="text-[9px] text-text-muted">{plant?.name ?? w.plantId}</div>
                  </td>
                  <td>
                    <span
                      className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] px-1.5 py-0.5"
                      style={{
                        color: STATUS_COLOR[w.status],
                        background: `${STATUS_COLOR[w.status]}1a`,
                        border: `1px solid ${STATUS_COLOR[w.status]}55`,
                      }}
                    >
                      {w.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="text-text-secondary">{w.assignee}</td>
                  <td className="font-mono text-right text-text-muted">{formatRelative(w.createdAt)}</td>
                  <td className="font-mono text-right text-text-muted">
                    {w.dueAt > Date.now() ? `in ${formatRelative(Date.now() - (w.dueAt - Date.now()))}` : "overdue"}
                  </td>
                  <td className="text-right pr-2">
                    {w.aiGenerated ? (
                      <span
                        className="font-mono text-[9px] uppercase tracking-[0.16em] px-1.5 py-0.5 stripe-ai"
                        style={{ color: "var(--color-gold-rim)" }}
                      >
                        AI · TKT
                      </span>
                    ) : (
                      <span className="text-text-muted font-mono text-[10px]">manual</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-0.5 font-condensed text-[10px] uppercase tracking-[0.14em] clip-hex-frame-sm transition-colors",
        active
          ? "bg-[#1b2238] text-text-primary ring-1 ring-inset ring-[var(--color-gold-deep)]"
          : "bg-[#0a0f1c] text-text-muted hover:text-text-primary hover:bg-[#10162a]",
      )}
    >
      {children}
    </button>
  );
}
