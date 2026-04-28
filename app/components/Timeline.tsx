"use client";

import { useState } from "react";
import {
  PHASE_LABEL_KEY,
  PHASE_SUMMARY_KEY,
  type DayPlan,
  type DaySlot,
  type SlotKind,
} from "@/lib/schedule";
import { formatSlotTime } from "@/lib/i18n";
import type {
  AllLogs,
  FoodEntry,
  SlotCompletions,
  SlotOverride,
} from "@/lib/storage";
import { validateEntry } from "@/lib/foodCheck";
import { isEffectiveDone, dayPercent } from "@/lib/progress";
import { pickWorkoutIcon } from "@/lib/icons";
import { useLang } from "./LangProvider";

type Props = {
  plan: DayPlan;
  isToday: boolean;
  nowMinutes: number;
  logs: AllLogs;
  /** Per-slot overrides for this day, keyed by slotIndex string. */
  overrides?: Record<string, SlotOverride>;
  /** Full completions store (all days). */
  completions: SlotCompletions;
  onAddEntry: (day: number, slotIndex: number, text: string) => void;
  onRemoveEntry: (day: number, slotIndex: number, entryId: string) => void;
  onPatchSlot: (
    day: number,
    slotIndex: number,
    patch: Partial<SlotOverride>
  ) => void;
  onToggleSlotDone: (day: number, slotIndex: number, done: boolean) => void;
};

const DEFAULT_KIND_ICON: Record<SlotKind, string> = {
  shake: "🥤",
  meal: "🥗",
  snack: "🍎",
  workout: "🏃",
  "fast-start": "🌙",
  "fast-end": "☀️",
};

function minutesToHHMM(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hhmmToMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return null;
  return h * 60 + mm;
}

export default function Timeline({
  plan,
  isToday,
  nowMinutes,
  logs,
  overrides,
  completions,
  onAddEntry,
  onRemoveEntry,
  onPatchSlot,
  onToggleSlotDone,
}: Props) {
  const { t, lang } = useLang();
  const percent = dayPercent(plan, logs, completions);

  // Apply overrides to each slot.
  const slots: DaySlot[] = plan.slots.map((s, i) => {
    const ov = overrides?.[String(i)];
    if (ov?.minuteOfDay != null) return { ...s, minuteOfDay: ov.minuteOfDay };
    return s;
  });

  const firstMin = slots[0]?.minuteOfDay ?? 0;
  const SPAN = 24 * 60;

  const offsetFromStart = (minute: number) =>
    (minute - firstMin + SPAN) % SPAN;
  const nowOffset = isToday ? offsetFromStart(nowMinutes) : -1;

  let activeIdx = -1;
  if (isToday && nowOffset >= 0) {
    for (let i = 0; i < slots.length; i++) {
      const o = offsetFromStart(slots[i].minuteOfDay);
      const nextO =
        i + 1 < slots.length
          ? offsetFromStart(slots[i + 1].minuteOfDay)
          : SPAN;
      if (nowOffset >= o && nowOffset < nextO) {
        activeIdx = i;
        break;
      }
    }
  }

  const dayLogs = logs[plan.day] ?? {};

  return (
    <div className="p-3 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-ink)] leading-none">
            Day {plan.day}
          </h2>
          <span className="text-xs font-bold text-[var(--color-sage-deep)] tracking-wider uppercase">
            {t(PHASE_LABEL_KEY[plan.phase])}
          </span>
          <span className="text-xs text-[var(--color-faint)]">
            {plan.dateISO}
          </span>
        </div>
      </div>
      <p className="text-xs sm:text-sm text-[var(--color-muted)] mb-2 max-w-xl leading-relaxed">
        {t(PHASE_SUMMARY_KEY[plan.phase])}
      </p>

      <div className="mb-3 max-w-xl">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-wider">
            {t("timeline.dayProgress")}
          </span>
          <span className="text-sm font-bold text-[var(--color-sage-deep)] tabular-nums">
            {t("timeline.percentDone", { n: percent })}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--color-beige)] overflow-hidden">
          <div
            className="h-full bg-[var(--color-sage)] transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <p className="text-[11px] text-[var(--color-faint)] mb-4 italic">
        💡 {t("timeline.proteinHint")}
      </p>

      <div className="relative max-w-3xl">
        <div
          className="absolute left-[18px] sm:left-[22px] top-2 bottom-2 w-0.5 bg-[var(--color-beige-warm)]"
          aria-hidden
        />

        <ol className="space-y-2.5 sm:space-y-3">
          {slots.map((slot, i) => {
            const ov = overrides?.[String(i)];
            const labelOverride = ov?.label;
            const offset = offsetFromStart(slot.minuteOfDay);
            const isPast = isToday && nowOffset >= 0 && offset < nowOffset;
            const isActive = isToday && i === activeIdx;
            const entries: FoodEntry[] = dayLogs[String(i)] ?? [];
            const canLog =
              slot.kind !== "fast-start" && slot.kind !== "fast-end";
            const done = isEffectiveDone(slot, i, plan, logs, completions);
            const canEditWorkout = slot.kind === "workout";

            const displayLabel = labelOverride ?? t(slot.labelKey);
            const icon =
              slot.kind === "workout"
                ? pickWorkoutIcon(displayLabel)
                : DEFAULT_KIND_ICON[slot.kind];

            return (
              <li
                key={i}
                className="relative pl-12 sm:pl-14 print-break-inside-avoid"
              >
                <button
                  type="button"
                  onClick={() => onToggleSlotDone(plan.day, i, !done)}
                  aria-label={done ? t("timeline.markUndone") : t("timeline.markDone")}
                  title={done ? t("timeline.markUndone") : t("timeline.markDone")}
                  className={`absolute left-0 top-1.5 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-lg sm:text-xl border-2 transition cursor-pointer hover:scale-110 active:scale-95
                    ${done ? "bg-[var(--color-sage)] border-[var(--color-sage-deep)] text-white" : ""}
                    ${!done && isActive ? "bg-[var(--color-sage)] border-[var(--color-sage-deep)] text-white scale-110 shadow-md" : ""}
                    ${!done && isPast && !isActive ? "bg-[var(--color-sage-soft)] border-[var(--color-sage)]" : ""}
                    ${!done && !isPast && !isActive ? "bg-[var(--color-card)] border-[var(--color-beige-warm)]" : ""}
                  `}
                  style={{
                    boxShadow:
                      isActive && !done
                        ? "0 0 0 6px rgba(138,154,132,0.25)"
                        : undefined,
                  }}
                >
                  <span>{done ? "✓" : icon}</span>
                </button>

                <SlotCard
                  slot={slot}
                  displayLabel={displayLabel}
                  phase={plan.phase}
                  isActive={isActive}
                  isPast={isPast}
                  done={done}
                  lang={lang}
                  t={t}
                  canLog={canLog}
                  canEditWorkout={canEditWorkout}
                  entries={entries}
                  onAdd={(text) => onAddEntry(plan.day, i, text)}
                  onRemove={(id) => onRemoveEntry(plan.day, i, id)}
                  onPatch={(patch) => onPatchSlot(plan.day, i, patch)}
                />
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function SlotCard({
  slot,
  displayLabel,
  phase,
  isActive,
  isPast,
  done,
  lang,
  t,
  canLog,
  canEditWorkout,
  entries,
  onAdd,
  onRemove,
  onPatch,
}: {
  slot: DaySlot;
  displayLabel: string;
  phase: DayPlan["phase"];
  isActive: boolean;
  isPast: boolean;
  done: boolean;
  lang: "ko" | "en";
  t: (k: string, p?: Record<string, string | number>) => string;
  canLog: boolean;
  canEditWorkout: boolean;
  entries: FoodEntry[];
  onAdd: (text: string) => void;
  onRemove: (id: string) => void;
  onPatch: (patch: Partial<SlotOverride>) => void;
}) {
  const [logEditing, setLogEditing] = useState(false);
  const [logValue, setLogValue] = useState("");
  const [shake, setShake] = useState(false);

  const [workoutEditing, setWorkoutEditing] = useState(false);
  const [timeDraft, setTimeDraft] = useState(() =>
    minutesToHHMM(slot.minuteOfDay)
  );
  const [labelDraft, setLabelDraft] = useState(displayLabel);

  function submitLog() {
    const v = logValue.trim();
    if (!v) return;
    onAdd(v);
    if (validateEntry(v, phase) === "nope") {
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
    setLogValue("");
    setLogEditing(false);
  }

  function openWorkoutEditor() {
    setTimeDraft(minutesToHHMM(slot.minuteOfDay));
    setLabelDraft(displayLabel);
    setWorkoutEditing(true);
  }

  function commitWorkout() {
    const m = hhmmToMinutes(timeDraft);
    onPatch({
      minuteOfDay: m ?? slot.minuteOfDay,
      label: labelDraft.trim(),
    });
    setWorkoutEditing(false);
  }

  const timeLabel = formatSlotTime(lang, slot.minuteOfDay);

  return (
    <div
      className={`paper-card rounded-xl border transition
        ${done ? "border-[var(--color-sage-deep)] ring-2 ring-[var(--color-sage-soft)]" : ""}
        ${!done && isActive ? "border-[var(--color-sage-deep)] ring-2 ring-[var(--color-sage-soft)]" : ""}
        ${!done && !isActive ? "border-[var(--color-beige)]" : ""}
        ${isPast && !isActive && !done ? "opacity-80" : ""}
      `}
    >
      <div
        className={`w-full text-left px-4 py-3 ${canLog ? "cursor-pointer" : ""}`}
        onClick={(e) => {
          if (!canLog) return;
          if ((e.target as HTMLElement).closest("[data-stop-card-click]"))
            return;
          if (workoutEditing) return;
          setLogEditing((v) => !v);
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span
                className={`text-lg font-bold ${
                  isActive || done
                    ? "text-[var(--color-sage-deep)]"
                    : "text-[var(--color-ink-soft)]"
                }`}
              >
                {timeLabel}
              </span>
              {canEditWorkout && !workoutEditing && (
                <button
                  data-stop-card-click
                  onClick={(e) => {
                    e.stopPropagation();
                    openWorkoutEditor();
                  }}
                  className="text-[var(--color-faint)] hover:text-[var(--color-sage-deep)] text-xs no-print"
                  aria-label={t("timeline.editWorkout")}
                  title={t("timeline.editWorkout")}
                >
                  ✏️
                </button>
              )}
              {done && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-sage-deep)] text-white text-[10px] font-bold tracking-wide">
                  ✓ {t("timeline.slotDone")}
                </span>
              )}
              {!done && isActive && (
                <span className="inline-block px-1.5 py-0.5 rounded bg-[var(--color-sage-deep)] text-white text-[10px] font-bold tracking-wider">
                  {t("timeline.now")}
                </span>
              )}
              {!done && isPast && !isActive && entries.length > 0 && (
                <span className="text-[var(--color-faint)] text-xs">·</span>
              )}
            </div>
            <p className="text-sm font-bold text-[var(--color-ink)]">
              {displayLabel}
            </p>
            {slot.hintKey && !workoutEditing && (
              <p className="text-xs text-[var(--color-muted)] mt-0.5 leading-relaxed">
                {t(slot.hintKey)}
              </p>
            )}
          </div>
        </div>
      </div>

      {canEditWorkout && workoutEditing && (
        <div
          data-stop-card-click
          className="border-t border-[var(--color-beige)] px-4 py-3 no-print space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-wider">
              {t("timeline.editTime")}
            </label>
            <input
              type="time"
              value={timeDraft}
              onChange={(e) => setTimeDraft(e.target.value)}
              className="px-2 py-1 rounded-md border border-[var(--color-beige)] bg-[var(--color-paper)] font-bold tabular-nums focus:outline-none focus:border-[var(--color-sage)]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1">
              {t("timeline.workoutLabel")}
            </label>
            <input
              type="text"
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitWorkout();
                }
                if (e.key === "Escape") {
                  setWorkoutEditing(false);
                }
              }}
              placeholder={t("timeline.workoutPh")}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-beige)] bg-[var(--color-paper)] text-sm focus:outline-none focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage-soft)]"
            />
            <p className="mt-1 text-[10px] text-[var(--color-faint)]">
              {pickWorkoutIcon(labelDraft)} ← {t("timeline.workoutLabel")}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setWorkoutEditing(false)}
              className="px-3 py-1.5 text-xs rounded-md text-[var(--color-muted)] hover:bg-[var(--color-bg)]"
            >
              {t("timeline.cancel")}
            </button>
            <button
              onClick={commitWorkout}
              className="px-3 py-1.5 text-xs rounded-md bg-[var(--color-sage)] hover:bg-[var(--color-sage-deep)] text-white font-bold"
            >
              {t("timeline.save")}
            </button>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <ul
          className={`border-t border-[var(--color-beige)] px-4 py-2 space-y-1.5 ${shake ? "anim-shake" : ""}`}
        >
          {entries.map((e) => {
            const verdict = validateEntry(e.text, phase);
            const ok = verdict === "ok";
            return (
              <li
                key={e.id}
                className="group flex items-center gap-2 text-sm"
              >
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0
                    ${ok ? "bg-[var(--color-sage)] text-white" : "bg-[var(--color-rose)]/20 text-[var(--color-rose)] border border-[var(--color-rose)]/40"}
                  `}
                  title={ok ? t("timeline.verdictOk") : t("timeline.verdictNope")}
                  aria-label={ok ? t("timeline.verdictOk") : t("timeline.verdictNope")}
                >
                  {ok ? "✓" : "✕"}
                </span>
                <span
                  className={`flex-1 leading-snug ${
                    ok
                      ? "text-[var(--color-ink-soft)]"
                      : "text-[var(--color-rose)] line-through decoration-[var(--color-rose)]/50"
                  }`}
                >
                  {e.text}
                </span>
                {!ok && (
                  <span className="text-[10px] text-[var(--color-rose)] font-semibold hidden sm:inline">
                    {t("timeline.verdictNope")}
                  </span>
                )}
                <button
                  onClick={() => onRemove(e.id)}
                  className="md:opacity-0 md:group-hover:opacity-100 text-xs text-[var(--color-faint)] hover:text-[var(--color-rose)] transition no-print"
                  aria-label={t("timeline.removeLog")}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {canLog && logEditing && !workoutEditing && (
        <div className="border-t border-[var(--color-beige)] px-4 py-3 no-print">
          <textarea
            value={logValue}
            onChange={(e) => setLogValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitLog();
              }
              if (e.key === "Escape") {
                setLogEditing(false);
                setLogValue("");
              }
            }}
            placeholder={t("timeline.logPlaceholder")}
            rows={2}
            autoFocus
            className="w-full resize-none px-3 py-2 rounded-lg border border-[var(--color-beige)] bg-[var(--color-paper)] text-sm focus:outline-none focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage-soft)]"
          />
          <div className="mt-2 flex items-center gap-2 justify-end">
            <button
              onClick={() => {
                setLogEditing(false);
                setLogValue("");
              }}
              className="px-3 py-1.5 text-xs rounded-md text-[var(--color-muted)] hover:bg-[var(--color-bg)]"
            >
              {t("timeline.cancel")}
            </button>
            <button
              onClick={submitLog}
              className="px-3 py-1.5 text-xs rounded-md bg-[var(--color-sage)] hover:bg-[var(--color-sage-deep)] text-white font-bold"
            >
              {t("timeline.save")}
            </button>
          </div>
        </div>
      )}

      {canLog && !logEditing && !workoutEditing && (
        <button
          type="button"
          onClick={() => setLogEditing(true)}
          className="no-print block w-full px-4 py-2 text-left text-xs text-[var(--color-faint)] hover:text-[var(--color-sage-deep)] hover:bg-[var(--color-bg)] border-t border-[var(--color-beige)] transition"
        >
          {t("timeline.addLog")}
        </button>
      )}
    </div>
  );
}
