"use client";

import { useEffect, useState } from "react";
import Landing from "./components/Landing";
import SetupForm from "./components/SetupForm";
import Dashboard from "./components/Dashboard";
import { LangToggle } from "./components/LangProvider";
import { loadSchedule, loadProfile } from "@/lib/storage";
import type { Schedule } from "@/lib/schedule";
import type { UserProfile } from "@/lib/storage";

type Stage = "landing" | "setup" | "dashboard";

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [stage, setStage] = useState<Stage>("landing");
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  function refresh() {
    const s = loadSchedule();
    const p = loadProfile();
    setSchedule(s);
    setProfile(p);
    return { s, p };
  }

  useEffect(() => {
    refresh();
    setHydrated(true);
  }, []);

  function handleEnter() {
    const { s, p } = refresh();
    setStage(s && p ? "dashboard" : "setup");
  }

  function handleSetupReady() {
    refresh();
    setStage("dashboard");
  }

  function handleReset() {
    refresh();
    setStage("setup");
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-sage-soft)] border-t-[var(--color-sage)] animate-spin" />
      </div>
    );
  }

  if (stage === "landing") {
    return (
      <>
        <div className="no-print fixed top-4 right-4 z-50">
          <LangToggle />
        </div>
        <Landing onEnter={handleEnter} />
      </>
    );
  }

  if (stage === "setup" || !schedule || !profile) {
    return (
      <>
        <div className="no-print fixed top-4 right-4 z-50">
          <LangToggle />
        </div>
        <SetupForm onReady={handleSetupReady} />
      </>
    );
  }

  return (
    <Dashboard schedule={schedule} profile={profile} onReset={handleReset} />
  );
}
