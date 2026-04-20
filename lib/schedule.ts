export type PhaseKey = "boot" | "switch" | "booster" | "maintain";

export type SlotKind =
  | "shake"
  | "meal"
  | "snack"
  | "workout"
  | "fast-start"
  | "fast-end";

export type DaySlot = {
  /** Minutes since local midnight of that day */
  minuteOfDay: number;
  kind: SlotKind;
  /** i18n key for label */
  labelKey: string;
  /** i18n key for optional hint */
  hintKey?: string;
};

export type DayPlan = {
  /** 1..28 */
  day: number;
  /** ISO date string (YYYY-MM-DD) in the user's local timezone */
  dateISO: string;
  phase: PhaseKey;
  slots: DaySlot[];
};

export type Schedule = {
  /** ISO datetime user entered as the program start */
  startISO: string;
  /** Program Day 1 date in YYYY-MM-DD */
  day1DateISO: string;
  days: DayPlan[];
};

export const PHASE_LABEL_KEY: Record<PhaseKey, string> = {
  boot: "phase.boot.label",
  switch: "phase.switch.label",
  booster: "phase.booster.label",
  maintain: "phase.maintain.label",
};

export const PHASE_SUMMARY_KEY: Record<PhaseKey, string> = {
  boot: "phase.boot.summary",
  switch: "phase.switch.summary",
  booster: "phase.booster.summary",
  maintain: "phase.maintain.summary",
};

function phaseForDay(day: number): PhaseKey {
  if (day <= 3) return "boot";
  if (day <= 7) return "switch";
  if (day <= 14) return "booster";
  return "maintain";
}

function toMinutes(h: number, m: number): number {
  return h * 60 + m;
}

function slotsForDay(
  phase: PhaseKey,
  anchorH: number,
  anchorM: number
): DaySlot[] {
  const anchor = toMinutes(anchorH, anchorM);

  const at = (hourOffset: number) =>
    Math.round((anchor + hourOffset * 60) % (24 * 60));
  const slot = (
    hourOffset: number,
    kind: SlotKind,
    labelKey: string,
    hintKey?: string
  ): DaySlot => ({
    minuteOfDay: at(hourOffset),
    kind,
    labelKey,
    hintKey,
  });

  switch (phase) {
    case "boot":
      return [
        slot(0, "shake", "slot.shake.morning", "slot.shake.morning.hint"),
        slot(5, "shake", "slot.shake.midday", "slot.shake.midday.hint"),
        slot(7, "workout", "slot.workout.walk"),
        slot(10, "shake", "slot.shake.evening", "slot.shake.evening.hint"),
        slot(12, "fast-start", "slot.fast.start", "slot.fast.start.hint"),
      ];
    case "switch":
      return [
        slot(0, "fast-end", "slot.fast.end", "slot.fast.end.hint"),
        slot(0.25, "shake", "slot.shake.morning"),
        slot(
          5,
          "meal",
          "slot.meal.lunchProtein",
          "slot.meal.lunchProtein.hint"
        ),
        slot(7, "workout", "slot.workout.strength"),
        slot(10, "shake", "slot.shake.evening"),
        slot(11, "fast-start", "slot.fast.start", "slot.fast.start.hint"),
      ];
    case "booster":
      return [
        slot(0, "fast-end", "slot.fast.end", "slot.fast.end.hint"),
        slot(
          0.25,
          "meal",
          "slot.meal.breakfastProtein",
          "slot.meal.breakfastProtein.hint"
        ),
        slot(
          5,
          "meal",
          "slot.meal.lunchNormal",
          "slot.meal.lunchNormal.hint"
        ),
        slot(7, "workout", "slot.workout.strengthCardio"),
        slot(
          10,
          "shake",
          "slot.shake.eveningLow",
          "slot.shake.eveningLow.hint"
        ),
        slot(11, "fast-start", "slot.fast.start", "slot.fast.start.hint"),
      ];
    case "maintain":
      return [
        slot(0, "fast-end", "slot.fast.end", "slot.fast.end.hint"),
        slot(
          0.25,
          "meal",
          "slot.meal.breakfast",
          "slot.meal.breakfast.hint"
        ),
        slot(5, "meal", "slot.meal.lunch", "slot.meal.lunch.hint"),
        slot(7, "workout", "slot.workout.maintain"),
        slot(10, "meal", "slot.meal.dinner", "slot.meal.dinner.hint"),
        slot(12, "fast-start", "slot.fast.start", "slot.fast.start.hint"),
      ];
  }
}

function addDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function toLocalDateISO(dt: Date): string {
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function buildSchedule(startISO: string): Schedule {
  const start = new Date(startISO);
  const day1Date = toLocalDateISO(start);
  const anchorH = start.getHours();
  const anchorM = start.getMinutes();

  const days: DayPlan[] = [];
  for (let i = 0; i < 28; i++) {
    const dayNum = i + 1;
    const phase = phaseForDay(dayNum);
    days.push({
      day: dayNum,
      dateISO: addDaysISO(day1Date, i),
      phase,
      slots: slotsForDay(phase, anchorH, anchorM),
    });
  }

  return {
    startISO,
    day1DateISO: day1Date,
    days,
  };
}

export function currentDayNumber(schedule: Schedule, now: Date): number | null {
  const todayISO = toLocalDateISO(now);
  const idx = schedule.days.findIndex((d) => d.dateISO === todayISO);
  return idx === -1 ? null : idx + 1;
}

export function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}
