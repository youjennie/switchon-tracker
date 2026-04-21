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
  extractGramsTotal,
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
import DayJournalCard from "./DayJournal";

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

  const proteinConsumed = useMemo(() => {
    if (!currentDay) return 0;
    const dayLogs = logs[currentDay] ?? {};
    let total = 0;
    for (const entries of Object.values(dayLogs)) {
      for (const e of entries) total += extractGramsTotal(e.text);
    }
    return Math.round(total);
  }, [logs, currentDay]);

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

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

        <main className="flex-1 xl:flex-[9] xl:basis-0 min-w-0 flex flex-col xl:flex-row xl:gap-0">
          <div className="xl:flex-[6] xl:basis-0 xl:min-w-0 flex flex-col xl:items-center">
            <div className="w-full max-w-[720px] mx-auto xl:mx-0 flex flex-col flex-1">
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

              <section className="px-3 sm:px-5 pb-4 sm:pb-5 -mt-1">
                <DayJournalCard day={selectedDay} />
              </section>
            </div>
          </div>

          <aside className="xl:flex-[3] xl:basis-0 xl:min-w-0 xl:border-l border-t xl:border-t-0 border-[var(--color-beige)] p-3 sm:p-4 flex justify-center">
            <div className="w-full max-w-[340px] space-y-4">
              <MonthlyCalendar
                schedule={schedule}
                currentDay={currentDay}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
              <Participants />
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
