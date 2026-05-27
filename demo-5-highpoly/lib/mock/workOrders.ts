export type WorkOrderStatus = "pending" | "dispatched" | "in_progress" | "completed";
export type WorkOrderPriority = "p1" | "p2" | "p3";

export type WorkOrder = {
  id: string;
  alarmId?: string;
  deviceId: string;
  plantId: string;
  title: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assignee: string;
  createdAt: number;
  dueAt: number;
  draftedByAgent?: "ticket";
  aiGenerated: boolean;
};

export const SEED_WORK_ORDERS: WorkOrder[] = [
  {
    id: "WO-2026-0517",
    alarmId: "ALM-100023",
    deviceId: "DEV-JHR-INV-01",
    plantId: "PLT-JHR-001",
    title: "INV COM1-5 — Cabinet thermal inspection",
    priority: "p2",
    status: "dispatched",
    assignee: "Tan Boon Wei",
    createdAt: Date.now() - 1000 * 60 * 3,
    dueAt: Date.now() + 1000 * 60 * 60 * 2,
    draftedByAgent: "ticket",
    aiGenerated: true,
  },
  {
    id: "WO-2026-0518",
    alarmId: "ALM-100024",
    deviceId: "DEV-JHR-PNL-03",
    plantId: "PLT-JHR-001",
    title: "Array A3 — Hot spot field verification",
    priority: "p1",
    status: "pending",
    assignee: "—",
    createdAt: Date.now() - 1000 * 60 * 6,
    dueAt: Date.now() + 1000 * 60 * 60,
    draftedByAgent: "ticket",
    aiGenerated: true,
  },
];
