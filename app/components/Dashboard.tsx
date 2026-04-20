"use client";

import { useEffect, useMemo, useState } from "react";
import {
  currentDayNumber,
  minutesSinceMidnight,
  type Schedule,
} from "@/lib/schedule";
import {
  addLogEntry,
  clearProgram,
  loadLogs,
  removeLogEntry,
  saveLogs,
  type AllLogs,
  type UserProfile,
} from "@/lib/storage";
import { useLang } from "./LangProvider";
import Sidebar from "./Sidebar";
import MonthlyCalendar from "./MonthlyCalendar";
import DayRail from "./DayRail";
import Timeline from "./Timeline";
import Participants from "./Participants";
import DashboardHeader from "./DashboardHeader";

type Props = {
  schedule: Schedule;
  profile: UserProfile;
  onReset: () => void;
};

export default function Dashboard({ schedule, profile, onReset }: Props) {
  const { t } = useLang();
  const [now, setNow] = useState<Date>(() => new Date());
  const [logs, setLogs] = useState<AllLogs>({});

  useEffect(() => {
    setLogs(loadLogs());
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const currentDay = useMemo(
    () => currentDayNumber(schedule, now),
    [schedule, now]
  );
  const [selectedDay, setSelectedDay] = useState<number>(() => currentDay ?? 1);

  useEffect(() => {
    if (currentDay && selectedDay === 1) setSelectedDay(currentDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDay]);

  const selectedPlan = schedule.days[selectedDay - 1];
  const currentPlan = currentDay ? schedule.days[currentDay - 1] : null;
  const nowMinutes = minutesSinceMidnight(now);

  function handleReset() {
    if (!confirm(t("sidebar.resetConfirm"))) return;
    clearProgram();
    onReset();
  }

  function handleAddEntry(day: number, slotIndex: number, text: string) {
    const next = addLogEntry(logs, day, slotIndex, text);
    setLogs(next);
    saveLogs(next);
  }

  function handleRemoveEntry(day: number, slotIndex: number, entryId: string) {
    const next = removeLogEntry(logs, day, slotIndex, entryId);
    setLogs(next);
    saveLogs(next);
  }

  // proteinConsumed — placeholder; Phase 2 will compute from logs.
  const proteinConsumed = 0;

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

      <section className="p-4 sm:p-6 border-b border-[var(--color-beige)]">
        <div className="max-w-4xl mx-auto">
          <MonthlyCalendar
            schedule={schedule}
            currentDay={currentDay}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
        </div>
      </section>

      <div className="flex-1 flex flex-col lg:flex-row print-flex-col">
        <Sidebar
          profile={profile}
          schedule={schedule}
          currentDay={currentDay}
          currentDayPlan={currentPlan}
          nowMinutes={nowMinutes}
          onReset={handleReset}
          proteinConsumed={proteinConsumed}
        />

        <main className="flex-1 min-w-0 flex flex-col">
          <DayRail
            schedule={schedule}
            currentDay={currentDay}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />

          <Timeline
            plan={selectedPlan}
            isToday={selectedDay === currentDay}
            nowMinutes={nowMinutes}
            logs={logs}
            onAddEntry={handleAddEntry}
            onRemoveEntry={handleRemoveEntry}
          />

          <div className="p-4 sm:p-6 border-t border-[var(--color-beige)]">
            <div className="max-w-3xl">
              <Participants />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
