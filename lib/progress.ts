import type { DayPlan } from "./schedule";
import type { AllLogs, SlotCompletions } from "./storage";
import { isSlotDone } from "./foodCheck";

/** Whether a single slot counts as "done" for progress purposes. */
export function isEffectiveDone(
  slot: DayPlan["slots"][number],
  slotIndex: number,
  plan: DayPlan,
  logs: AllLogs,
  completions: SlotCompletions
): boolean {
  const manual = completions[plan.day]?.[String(slotIndex)];
  if (manual !== undefined) return manual;

  // Fall back to the auto-detection from food log entries (only meaningful
  // for log-eligible kinds; fast-start/fast-end have no entries by design).
  if (slot.kind === "fast-start" || slot.kind === "fast-end") return false;
  const entries = logs[plan.day]?.[String(slotIndex)] ?? [];
  return isSlotDone(entries, plan.phase, slot.kind);
}

/** Percentage 0..100 of slots completed for a given day. */
export function dayPercent(
  plan: DayPlan,
  logs: AllLogs,
  completions: SlotCompletions
): number {
  const total = plan.slots.length;
  if (total === 0) return 0;
  let done = 0;
  for (let i = 0; i < total; i++) {
    if (isEffectiveDone(plan.slots[i], i, plan, logs, completions)) done++;
  }
  return Math.round((done / total) * 100);
}
