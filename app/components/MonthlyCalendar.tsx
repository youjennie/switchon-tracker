"use client";

import { useMemo, useState } from "react";
import type { PhaseKey, Schedule } from "@/lib/schedule";
import { EN_MONTHS_SHORT } from "@/lib/i18n";
import { useLang } from "./LangProvider";

type Props = {
  schedule: Schedule;
  currentDay: number | null;
  selectedDay: number;
  onSelectDay: (day: number) => void;
};

const PHASE_COLOR: Record<PhaseKey, string> = {
  boot: "var(--color-beige-warm)",
  switch: "var(--color-sage-soft)",
  booster: "var(--color-sage)",
  maintain: "var(--color-sage-deep)",
};

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function firstOfMonth(y: number, m: number) {
  return new Date(y, m, 1);
}

export default function MonthlyCalendar({
  schedule,
  currentDay,
  selectedDay,
  onSelectDay,
}: Props) {
  const { t, lang } = useLang();

  const weekdays = [
    t("calendar.weekday.sun"),
    t("calendar.weekday.mon"),
    t("calendar.weekday.tue"),
    t("calendar.weekday.wed"),
    t("calendar.weekday.thu"),
    t("calendar.weekday.fri"),
    t("calendar.weekday.sat"),
  ];

  const byDate = useMemo(() => {
    const map = new Map<string, (typeof schedule.days)[number]>();
    for (const d of schedule.days) map.set(d.dateISO, d);
    return map;
  }, [schedule]);

  const firstDay = parseISODate(schedule.days[0].dateISO);
  const lastDay = parseISODate(schedule.days[schedule.days.length - 1].dateISO);

  const months = useMemo(() => {
    const result: { y: number; m: number }[] = [];
    const cursor = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1);
    while (
      cursor.getFullYear() < lastDay.getFullYear() ||
      (cursor.getFullYear() === lastDay.getFullYear() &&
        cursor.getMonth() <= lastDay.getMonth())
    ) {
      result.push({ y: cursor.getFullYear(), m: cursor.getMonth() });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return result;
  }, [firstDay, lastDay]);

  const [monthIdx, setMonthIdx] = useState(0);
  const cur = months[monthIdx];

  const monthFirst = firstOfMonth(cur.y, cur.m);
  const monthLast = new Date(cur.y, cur.m + 1, 0);
  const leadBlank = monthFirst.getDay();
  const daysInMonth = monthLast.getDate();

  const cells: Array<
    | { kind: "blank" }
    | {
        kind: "day";
        dateISO: string;
        dayNum: number;
        programDay: number | null;
        phase: PhaseKey | null;
      }
  > = [];
  for (let i = 0; i < leadBlank; i++) cells.push({ kind: "blank" });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${cur.y}-${String(cur.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const plan = byDate.get(iso);
    cells.push({
      kind: "day",
      dateISO: iso,
      dayNum: d,
      programDay: plan?.day ?? null,
      phase: plan?.phase ?? null,
    });
  }
  while (cells.length % 7 !== 0) cells.push({ kind: "blank" });

  const monthLabel =
    lang === "en"
      ? t("calendar.month", { y: cur.y, m: EN_MONTHS_SHORT[cur.m] })
      : t("calendar.month", { y: cur.y, m: cur.m + 1 });

  return (
    <div className="paper-card rounded-2xl p-4 sm:p-5 print-break-inside-avoid">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-[var(--color-muted)] tracking-wider uppercase">
            {t("calendar.monthlyView")}
          </p>
          <p className="font-hand text-2xl text-[var(--color-ink)]">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-1 no-print">
          <button
            onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
            disabled={monthIdx === 0}
            className="w-8 h-8 rounded-md border border-[var(--color-beige)] hover:bg-[var(--color-bg)] disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={t("calendar.prevMonth")}
          >
            ‹
          </button>
          <button
            onClick={() => setMonthIdx((i) => Math.min(months.length - 1, i + 1))}
            disabled={monthIdx === months.length - 1}
            className="w-8 h-8 rounded-md border border-[var(--color-beige)] hover:bg-[var(--color-bg)] disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={t("calendar.nextMonth")}
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {weekdays.map((w, i) => (
          <div
            key={i}
            className={`text-center text-[11px] font-semibold tracking-wide ${
              i === 0 ? "text-[var(--color-rose)]" : "text-[var(--color-muted)]"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((c, idx) => {
          if (c.kind === "blank") {
            return <div key={idx} className="aspect-square" />;
          }
          const isSelected = c.programDay !== null && c.programDay === selectedDay;
          const isCurrent = c.programDay !== null && c.programDay === currentDay;
          const isPast =
            c.programDay !== null && currentDay !== null && c.programDay < currentDay;

          return (
            <button
              key={idx}
              onClick={() => c.programDay && onSelectDay(c.programDay)}
              disabled={c.programDay === null}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[11px] relative transition
                ${c.programDay === null ? "text-[var(--color-faint)] cursor-default" : "hover:ring-2 hover:ring-[var(--color-sage-soft)] cursor-pointer"}
                ${isSelected ? "ring-2 ring-[var(--color-sage-deep)]" : ""}
              `}
              style={{
                background:
                  c.programDay !== null
                    ? isCurrent
                      ? "var(--color-sage)"
                      : isPast
                        ? "var(--color-card-muted)"
                        : c.phase
                          ? PHASE_COLOR[c.phase]
                          : undefined
                    : "transparent",
                color: isCurrent
                  ? "#fff"
                  : c.programDay === null
                    ? "var(--color-faint)"
                    : "var(--color-ink)",
                opacity: c.programDay === null ? 0.5 : isPast ? 0.6 : 1,
              }}
            >
              <span className="font-semibold">{c.dayNum}</span>
              {c.programDay !== null && (
                <span className="text-[9px] opacity-80 leading-none mt-0.5">
                  D{c.programDay}
                </span>
              )}
              {isCurrent && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-[11px]">
        <LegendSwatch color="var(--color-beige-warm)" label={t("calendar.legend.boot")} />
        <LegendSwatch color="var(--color-sage-soft)" label={t("calendar.legend.switch")} />
        <LegendSwatch color="var(--color-sage)" label={t("calendar.legend.booster")} />
        <LegendSwatch color="var(--color-sage-deep)" label={t("calendar.legend.maintain")} />
      </div>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block w-3 h-3 rounded-sm"
        style={{ background: color }}
      />
      <span className="text-[var(--color-muted)]">{label}</span>
    </div>
  );
}
