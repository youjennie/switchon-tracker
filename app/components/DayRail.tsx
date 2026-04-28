"use client";

import { useEffect, useRef } from "react";
import { PHASE_LABEL_KEY, type Schedule } from "@/lib/schedule";
import { dayPercent } from "@/lib/progress";
import type { AllLogs, SlotCompletions } from "@/lib/storage";
import { useLang } from "./LangProvider";

type Props = {
  schedule: Schedule;
  currentDay: number | null;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  logs: AllLogs;
  completions: SlotCompletions;
};

export default function DayRail({
  schedule,
  currentDay,
  selectedDay,
  onSelectDay,
  logs,
  completions,
}: Props) {
  const { t } = useLang();
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });
  }, [selectedDay]);

  const atStart = selectedDay <= 1;
  const atEnd = selectedDay >= schedule.days.length;

  return (
    <div className="border-b border-[var(--color-beige)] paper-card no-print flex items-stretch">
      <button
        onClick={() => !atStart && onSelectDay(selectedDay - 1)}
        disabled={atStart}
        aria-label="previous day"
        className="shrink-0 w-9 flex items-center justify-center text-lg text-[var(--color-muted)] hover:text-[var(--color-sage-deep)] hover:bg-[var(--color-sage-soft)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition border-r border-[var(--color-beige)]"
      >
        ‹
      </button>

      <div className="overflow-x-auto max-w-[720px] flex-1">
        <div className="flex gap-1 p-2.5 sm:p-3 min-w-max">
          {schedule.days.map((d) => {
            const isSelected = d.day === selectedDay;
            const isCurrent = d.day === currentDay;
            const isPast = currentDay !== null && d.day < currentDay;
            const pct = dayPercent(d, logs, completions);
            return (
              <button
                key={d.day}
                ref={isSelected ? selectedRef : null}
                onClick={() => onSelectDay(d.day)}
                className={`relative flex flex-col items-center px-2 pt-1.5 pb-2 rounded-lg min-w-[40px] transition overflow-hidden
                  ${isSelected ? "ring-2 ring-[var(--color-sage-deep)]" : ""}
                  ${isCurrent ? "bg-[var(--color-sage)] text-white" : isPast ? "bg-[var(--color-card-muted)] text-[var(--color-muted)]" : "bg-[var(--color-paper)] text-[var(--color-ink)] hover:bg-[var(--color-sage-soft)]"}
                `}
                title={`Day ${d.day} · ${pct}%`}
              >
                <span className="text-[9px] font-bold opacity-80 leading-none">
                  {t("dayRail.letter")}
                </span>
                <span className="text-base font-bold leading-tight">
                  {d.day}
                </span>
                <span className="text-[8px] opacity-70 mt-0.5 whitespace-nowrap">
                  {t(PHASE_LABEL_KEY[d.phase])}
                </span>
                <span
                  className={`absolute left-0 bottom-0 h-1 transition-all
                    ${isCurrent ? "bg-white/70" : "bg-[var(--color-sage-deep)]"}
                  `}
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => !atEnd && onSelectDay(selectedDay + 1)}
        disabled={atEnd}
        aria-label="next day"
        className="shrink-0 w-9 flex items-center justify-center text-lg text-[var(--color-muted)] hover:text-[var(--color-sage-deep)] hover:bg-[var(--color-sage-soft)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition border-l border-[var(--color-beige)]"
      >
        ›
      </button>
    </div>
  );
}
