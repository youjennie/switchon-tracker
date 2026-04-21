"use client";

import {
  PHASE_LABEL_KEY,
  type DayPlan,
  type Schedule,
} from "@/lib/schedule";
import type { UserProfile } from "@/lib/storage";
import { formatSlotTime } from "@/lib/i18n";
import { useLang } from "./LangProvider";

type Props = {
  profile: UserProfile;
  schedule: Schedule;
  currentDay: number | null;
  currentDayPlan: DayPlan | null;
  nowMinutes: number;
  onReset: () => void;
  proteinConsumed: number;
};

function nextFastWindow(
  plan: DayPlan | null,
  nowMinutes: number
): null | { active: boolean; minutes: number; isNext: boolean; startMin?: number } {
  if (!plan) return null;
  const fastStart = plan.slots.find((s) => s.kind === "fast-start");
  const fastEnd = plan.slots.find((s) => s.kind === "fast-end");
  if (!fastStart || !fastEnd) return null;

  const inFast =
    fastStart.minuteOfDay > fastEnd.minuteOfDay &&
    (nowMinutes >= fastStart.minuteOfDay || nowMinutes < fastEnd.minuteOfDay);

  if (inFast) {
    let remaining = fastEnd.minuteOfDay - nowMinutes;
    if (remaining <= 0) remaining += 24 * 60;
    return { active: true, minutes: remaining, isNext: false };
  }
  const untilStart = (fastStart.minuteOfDay - nowMinutes + 24 * 60) % (24 * 60);
  return {
    active: false,
    minutes: untilStart,
    isNext: true,
    startMin: fastStart.minuteOfDay,
  };
}

export default function Sidebar({
  profile,
  schedule,
  currentDay,
  currentDayPlan,
  nowMinutes,
  onReset,
  proteinConsumed,
}: Props) {
  const { t, lang } = useLang();
  const phase = currentDayPlan ? t(PHASE_LABEL_KEY[currentDayPlan.phase]) : "—";
  const fast = nextFastWindow(currentDayPlan, nowMinutes);
  const dayLabel = currentDay
    ? t("sidebar.dayOf", { n: currentDay })
    : t("sidebar.beforeProgram");

  const proteinPct = Math.min(
    100,
    profile.proteinGoalG > 0
      ? Math.round((proteinConsumed / profile.proteinGoalG) * 100)
      : 0
  );

  const hh = fast ? Math.floor(fast.minutes / 60) : 0;
  const mm = fast ? fast.minutes % 60 : 0;

  return (
    <aside className="print-stack w-full lg:w-[280px] lg:shrink-0 xl:w-auto xl:flex-[2] xl:basis-0 xl:shrink paper-card lg:border-r border-b lg:border-b-0 border-[var(--color-beige)] flex flex-col xl:items-center">
      <div className="w-full xl:max-w-[280px] p-3 lg:p-4 border-b border-[var(--color-beige)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-sage-soft)] flex items-center justify-center text-[var(--color-sage-deep)] font-semibold">
            {profile.name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{profile.name}</p>
            <p className="text-xs text-[var(--color-muted)]">
              {t("sidebar.proteinGoalShort", {
                w: profile.weightKg,
                p: profile.proteinGoalG,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block px-2.5 py-1 rounded-full bg-[var(--color-sage)] text-white text-xs font-semibold">
            {dayLabel}
          </span>
          <span className="inline-block px-2.5 py-1 rounded-full bg-[var(--color-beige)] text-[var(--color-ink)] text-xs font-medium">
            {phase}
          </span>
        </div>
      </div>

      <div className="w-full xl:max-w-[280px] p-3 lg:p-4 border-b border-[var(--color-beige)] grid grid-cols-2 lg:block gap-3">
        <div>
          <p className="text-xs font-bold text-[var(--color-muted)] tracking-wider uppercase mb-2">
            {t("sidebar.proteinHeader")}
          </p>
          <div className="relative mx-auto w-16 h-24 lg:w-24 lg:h-32">
            <div className="absolute inset-x-3 lg:inset-x-4 top-3 bottom-0 rounded-2xl border-2 border-[var(--color-sage)] overflow-hidden bg-[var(--color-paper)]">
              <div
                className="absolute inset-x-0 bottom-0 bg-[var(--color-sage)] transition-all"
                style={{ height: `${proteinPct}%` }}
              />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-6 lg:w-8 h-3 lg:h-4 rounded-t-md border-2 border-b-0 border-[var(--color-sage)] bg-[var(--color-card)]" />
          </div>
          <div className="mt-2 lg:mt-3 text-center">
            <p className="text-xl lg:text-2xl font-bold text-[var(--color-sage-deep)]">
              {proteinConsumed}
              <span className="text-sm text-[var(--color-muted)] font-normal">
                {" "}/ {profile.proteinGoalG}g
              </span>
            </p>
          </div>
        </div>

        <div
          className={`lg:hidden rounded-lg p-3 self-start ${
            fast?.active ? "bg-[var(--color-rose)]/10" : "bg-[var(--color-bg)]"
          }`}
        >
          <p className="text-[10px] font-semibold text-[var(--color-muted)] tracking-wider uppercase mb-1">
            {fast?.active ? t("sidebar.fastActiveCaption") : t("sidebar.fastWindow")}
          </p>
          {fast ? (
            <>
              <p
                className={`text-2xl font-bold ${
                  fast.active ? "text-[var(--color-rose)]" : "text-[var(--color-ink)]"
                }`}
              >
                {hh}h {mm}m
              </p>
              <p className="text-[10px] text-[var(--color-muted)] mt-0.5 leading-tight">
                {fast.active
                  ? t("sidebar.fastActive")
                  : fast.startMin !== undefined
                    ? `${t("sidebar.nextFast")} · ${formatSlotTime(lang, fast.startMin)}`
                    : t("sidebar.nextFast")}
              </p>
            </>
          ) : (
            <p className="text-xs text-[var(--color-muted)]">{t("sidebar.noFast")}</p>
          )}
        </div>
      </div>

      <div
        className={`hidden lg:block w-full xl:max-w-[280px] p-4 border-b border-[var(--color-beige)] ${
          fast?.active ? "bg-[var(--color-rose)]/10" : ""
        }`}
      >
        <p className="text-xs font-semibold text-[var(--color-muted)] tracking-wider uppercase mb-2">
          {fast?.active
            ? t("sidebar.fastActiveCaption")
            : t("sidebar.fastWindow")}
        </p>
        {fast ? (
          <>
            <p
              className={`text-3xl font-bold ${
                fast.active ? "text-[var(--color-rose)]" : "text-[var(--color-ink)]"
              }`}
            >
              {hh}h {mm}m
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              {fast.active
                ? t("sidebar.fastActive") + " · " + t("sidebar.remaining")
                : `${t("sidebar.nextFast")} · ${fast.startMin !== undefined ? formatSlotTime(lang, fast.startMin) : ""} ${t("sidebar.after")}`}
            </p>
          </>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">
            {t("sidebar.noFast")}
          </p>
        )}
      </div>

      <div className="w-full xl:max-w-[280px] p-3 lg:p-4 no-print">
        <p className="text-xs text-[var(--color-faint)] mb-2">
          {t("sidebar.startedAt")}{" "}
          {new Date(schedule.startISO).toLocaleString(
            lang === "ko" ? "ko-KR" : "en-US",
            { dateStyle: "medium", timeStyle: "short" }
          )}
        </p>
        <button
          onClick={onReset}
          className="text-xs text-[var(--color-muted)] hover:text-[var(--color-rose)] underline underline-offset-2"
        >
          {t("sidebar.reset")}
        </button>
      </div>
    </aside>
  );
}
