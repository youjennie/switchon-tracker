"use client";

import { PHASE_LABEL_KEY, type Schedule } from "@/lib/schedule";
import { useLang } from "./LangProvider";

type Props = {
  schedule: Schedule;
  currentDay: number | null;
  selectedDay: number;
  onSelectDay: (day: number) => void;
};

export default function DayRail({
  schedule,
  currentDay,
  selectedDay,
  onSelectDay,
}: Props) {
  const { t } = useLang();
  return (
    <div className="border-b border-[var(--color-beige)] paper-card no-print">
      <div className="overflow-x-auto">
        <div className="flex gap-1.5 p-4 min-w-max">
          {schedule.days.map((d) => {
            const isSelected = d.day === selectedDay;
            const isCurrent = d.day === currentDay;
            const isPast = currentDay !== null && d.day < currentDay;
            return (
              <button
                key={d.day}
                onClick={() => onSelectDay(d.day)}
                className={`flex flex-col items-center px-3 py-2 rounded-lg min-w-[54px] transition
                  ${isSelected ? "ring-2 ring-[var(--color-sage-deep)]" : ""}
                  ${isCurrent ? "bg-[var(--color-sage)] text-white" : isPast ? "bg-[var(--color-card-muted)] text-[var(--color-muted)]" : "bg-[var(--color-paper)] text-[var(--color-ink)] hover:bg-[var(--color-sage-soft)]"}
                `}
              >
                <span className="text-[10px] font-semibold opacity-80 leading-none">
                  {t("dayRail.letter")}
                </span>
                <span className="text-lg font-semibold leading-tight">
                  {d.day}
                </span>
                <span className="text-[9px] opacity-70 mt-0.5">
                  {t(PHASE_LABEL_KEY[d.phase])}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
