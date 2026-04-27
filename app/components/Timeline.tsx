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
import type { AllLogs, FoodEntry } from "@/lib/storage";
import { isSlotDone, validateEntry } from "@/lib/foodCheck";
import { useLang } from "./LangProvider";

type Props = {
  plan: DayPlan;
  isToday: boolean;
  nowMinutes: number;
  logs: AllLogs;
  /** Per-slot time overrides for this day, keyed by slotIndex string. */
  overrides?: Record<string, { minuteOfDay: number }>;
  onAddEntry: (day: number, slotIndex: number, text: string) => void;
  onRemoveEntry: (day: number, slotIndex: number, entryId: string) => void;
  onSetSlotTime: (day: number, slotIndex: number, minuteOfDay: number) => void;
};

const KIND_META: Record<SlotKind, { icon: string }> = {
  shake: { icon: "🥤" },
  meal: { icon: "🥗" },
  snack: { icon: "🍎" },
  workout: { icon: "🏃" },
  "fast-start": { icon: "🌙" },
  "fast-end": { icon: "☀️" },
};

export default function Timeline({
  plan,
  isToday,
  nowMinutes,
  logs,
  overrides,
  onAddEntry,
  onRemoveEntry,
  onSetSlotTime,
}: Props) {
  const { t, lang } = useLang();

  // Apply per-slot overrides (e.g., workout time moved to a different hour).
  const slots: DaySlot[] = plan.slots.map((s, i) => {
    const ov = overrides?.[String(i)];
    return ov ? { ...s, minuteOfDay: ov.minuteOfDay } : s;
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
            const offset = offsetFromStart(slot.minuteOfDay);
            const isPast = isToday && nowOffset >= 0 && offset < nowOffset;
            const isActive = isToday && i === activeIdx;
            const meta = KIND_META[slot.kind];
            const entries: FoodEntry[] = dayLogs[String(i)] ?? [];
            const canLog =
              slot.kind !== "fast-start" && slot.kind !== "fast-end";
            const done = canLog && isSlotDone(entries, plan.phase, slot.kind);
            const canEditTime = slot.kind === "workout";

            return (
              <li key={i} className="relative pl-12 sm:pl-14 print-break-inside-avoid">
                <div
                  className={`absolute left-0 top-1.5 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-lg sm:text-xl border-2 transition
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
                  <span>{done ? "✓" : meta.icon}</span>
                </div>

                <SlotCard
                  slot={slot}
                  phase={plan.phase}
                  isActive={isActive}
                  isPast={isPast}
                  done={done}
                  lang={lang}
                  t={t}
                  canLog={canLog}
                  canEditTime={canEditTime}
                  entries={entries}
                  onAdd={(text) => onAddEntry(plan.day, i, text)}
                  onRemove={(id) => onRemoveEntry(plan.day, i, id)}
                  onSetTime={(minute) => onSetSlotTime(plan.day, i, minute)}
                />
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

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

function SlotCard({
  slot,
  phase,
  isActive,
  isPast,
  done,
  lang,
  t,
  canLog,
  canEditTime,
  entries,
  onAdd,
  onRemove,
  onSetTime,
}: {
  slot: DaySlot;
  phase: DayPlan["phase"];
  isActive: boolean;
  isPast: boolean;
  done: boolean;
  lang: "ko" | "en";
  t: (k: string, p?: Record<string, string | number>) => string;
  canLog: boolean;
  canEditTime: boolean;
  entries: FoodEntry[];
  onAdd: (text: string) => void;
  onRemove: (id: string) => void;
  onSetTime: (minuteOfDay: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [timeDraft, setTimeDraft] = useState(() =>
    minutesToHHMM(slot.minuteOfDay)
  );

  function submit() {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    if (validateEntry(v, phase) === "nope") {
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
    setValue("");
    setEditing(false);
  }

  function commitTime() {
    const m = hhmmToMinutes(timeDraft);
    if (m == null) {
      setTimeDraft(minutesToHHMM(slot.minuteOfDay));
    } else {
      onSetTime(m);
    }
    setEditingTime(false);
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
          // Only toggle the food log editor when clicking outside of the
          // time-edit affordance.
          if (!canLog) return;
          if ((e.target as HTMLElement).closest("[data-time-edit]")) return;
          setEditing((v) => !v);
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              {editingTime ? (
                <span data-time-edit className="inline-flex items-center gap-1 no-print">
                  <input
                    type="time"
                    value={timeDraft}
                    onChange={(e) => setTimeDraft(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitTime();
                      }
                      if (e.key === "Escape") {
                        setTimeDraft(minutesToHHMM(slot.minuteOfDay));
                        setEditingTime(false);
                      }
                    }}
                    autoFocus
                    className="px-2 py-1 rounded-md border border-[var(--color-sage)] bg-[var(--color-paper)] text-base font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--color-sage-soft)]"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      commitTime();
                    }}
                    className="px-2 py-1 rounded-md bg-[var(--color-sage)] text-white text-xs font-bold"
                  >
                    {t("timeline.save")}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTimeDraft(minutesToHHMM(slot.minuteOfDay));
                      setEditingTime(false);
                    }}
                    className="px-2 py-1 rounded-md text-[var(--color-muted)] text-xs"
                  >
                    {t("timeline.cancel")}
                  </button>
                </span>
              ) : (
                <span
                  className={`text-lg font-bold ${
                    isActive || done
                      ? "text-[var(--color-sage-deep)]"
                      : "text-[var(--color-ink-soft)]"
                  }`}
                >
                  {timeLabel}
                </span>
              )}
              {canEditTime && !editingTime && (
                <button
                  data-time-edit
                  onClick={(e) => {
                    e.stopPropagation();
                    setTimeDraft(minutesToHHMM(slot.minuteOfDay));
                    setEditingTime(true);
                  }}
                  className="text-[var(--color-faint)] hover:text-[var(--color-sage-deep)] text-xs no-print"
                  aria-label={t("timeline.editTime")}
                  title={t("timeline.editTime")}
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
              {t(slot.labelKey)}
            </p>
            {slot.hintKey && (
              <p className="text-xs text-[var(--color-muted)] mt-0.5 leading-relaxed">
                {t(slot.hintKey)}
              </p>
            )}
          </div>
        </div>
      </div>

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

      {canLog && editing && (
        <div className="border-t border-[var(--color-beige)] px-4 py-3 no-print">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
              if (e.key === "Escape") {
                setEditing(false);
                setValue("");
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
                setEditing(false);
                setValue("");
              }}
              className="px-3 py-1.5 text-xs rounded-md text-[var(--color-muted)] hover:bg-[var(--color-bg)]"
            >
              {t("timeline.cancel")}
            </button>
            <button
              onClick={submit}
              className="px-3 py-1.5 text-xs rounded-md bg-[var(--color-sage)] hover:bg-[var(--color-sage-deep)] text-white font-bold"
            >
              {t("timeline.save")}
            </button>
          </div>
        </div>
      )}

      {canLog && !editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="no-print block w-full px-4 py-2 text-left text-xs text-[var(--color-faint)] hover:text-[var(--color-sage-deep)] hover:bg-[var(--color-bg)] border-t border-[var(--color-beige)] transition"
        >
          {t("timeline.addLog")}
        </button>
      )}
    </div>
  );
}
