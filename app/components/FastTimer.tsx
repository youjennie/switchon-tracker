"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "./LangProvider";

type TimerStatus = "idle" | "running" | "paused" | "done";

type TimerState = {
  status: TimerStatus;
  /** Total target duration in ms. */
  totalMs: number;
  /** Unix-ms timestamp the countdown reaches zero. Set when running. */
  endAt?: number;
  /** Remaining ms when paused. */
  remainingMs?: number;
};

const KEY = "switchon.fastTimer.v1";
const DEFAULT_HOURS = 16;

function loadTimer(): TimerState {
  if (typeof window === "undefined") {
    return { status: "idle", totalMs: DEFAULT_HOURS * 3600000 };
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as TimerState;
  } catch {}
  return { status: "idle", totalMs: DEFAULT_HOURS * 3600000 };
}

function saveTimer(s: TimerState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

function fmt(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FastTimer() {
  const { t } = useLang();
  const [timer, setTimer] = useState<TimerState>({
    status: "idle",
    totalMs: DEFAULT_HOURS * 3600000,
  });
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [minutes, setMinutes] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [hydrated, setHydrated] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    const loaded = loadTimer();
    setTimer(loaded);
    if (loaded.status === "idle") {
      setHours(Math.floor(loaded.totalMs / 3600000));
      setMinutes(Math.floor((loaded.totalMs % 3600000) / 60000));
    }
    setHydrated(true);
  }, []);

  // 1s tick while running.
  useEffect(() => {
    if (timer.status === "running") {
      tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [timer.status]);

  // Auto-transition to "done" once endAt is reached.
  useEffect(() => {
    if (timer.status === "running" && timer.endAt && now >= timer.endAt) {
      const next: TimerState = {
        status: "done",
        totalMs: timer.totalMs,
      };
      setTimer(next);
      saveTimer(next);
    }
  }, [now, timer]);

  const remaining = (() => {
    if (timer.status === "running" && timer.endAt) return timer.endAt - now;
    if (timer.status === "paused") return timer.remainingMs ?? 0;
    if (timer.status === "done") return 0;
    return (hours * 60 + minutes) * 60000;
  })();

  function start() {
    const total = (hours * 60 + minutes) * 60000;
    if (total <= 0) return;
    const next: TimerState = {
      status: "running",
      totalMs: total,
      endAt: Date.now() + total,
    };
    setTimer(next);
    saveTimer(next);
  }

  function pause() {
    if (timer.status !== "running" || !timer.endAt) return;
    const rem = Math.max(0, timer.endAt - Date.now());
    const next: TimerState = {
      status: "paused",
      totalMs: timer.totalMs,
      remainingMs: rem,
    };
    setTimer(next);
    saveTimer(next);
  }

  function resume() {
    if (timer.status !== "paused" || timer.remainingMs == null) return;
    const next: TimerState = {
      status: "running",
      totalMs: timer.totalMs,
      endAt: Date.now() + timer.remainingMs,
    };
    setTimer(next);
    saveTimer(next);
  }

  function reset() {
    const total = (hours * 60 + minutes) * 60000 || timer.totalMs;
    const next: TimerState = { status: "idle", totalMs: total };
    setTimer(next);
    saveTimer(next);
  }

  const isIdle = timer.status === "idle";
  const isRunning = timer.status === "running";
  const isPaused = timer.status === "paused";
  const isDone = timer.status === "done";

  const progress =
    timer.totalMs > 0
      ? Math.max(0, Math.min(1, 1 - remaining / timer.totalMs))
      : 0;

  // SVG ring math
  const SIZE = 160;
  const STROKE = 10;
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;
  const dashOffset = C * (1 - progress);

  return (
    <div className="paper-card rounded-2xl p-4 print-break-inside-avoid">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-[var(--color-muted)] tracking-wider uppercase">
          ⏱ {t("fastTimer.title")}
        </p>
        {isDone && (
          <span className="text-[10px] font-bold text-[var(--color-sage-deep)]">
            ✓ {t("fastTimer.done")}
          </span>
        )}
      </div>

      <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="var(--color-beige)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={
              isDone
                ? "var(--color-sage-deep)"
                : isPaused
                  ? "var(--color-kraft)"
                  : "var(--color-sage)"
            }
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={hydrated ? dashOffset : C}
            className="transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold tabular-nums text-[var(--color-ink)] leading-none">
            {fmt(remaining)}
          </p>
          <p className="text-[10px] text-[var(--color-faint)] tracking-wider uppercase mt-1">
            {isRunning
              ? "running"
              : isPaused
                ? "paused"
                : isDone
                  ? "✓"
                  : "ready"}
          </p>
        </div>
      </div>

      {isIdle && (
        <>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={48}
              value={hours}
              onChange={(e) =>
                setHours(Math.max(0, Math.min(48, Number(e.target.value) || 0)))
              }
              className="w-14 px-2 py-1.5 rounded-lg border border-[var(--color-beige)] bg-[var(--color-paper)] text-center font-bold tabular-nums focus:outline-none focus:border-[var(--color-sage)]"
              aria-label={t("fastTimer.hours")}
            />
            <span className="text-[11px] text-[var(--color-muted)] mr-1">
              {t("fastTimer.hours")}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) =>
                setMinutes(
                  Math.max(0, Math.min(59, Number(e.target.value) || 0))
                )
              }
              className="w-14 px-2 py-1.5 rounded-lg border border-[var(--color-beige)] bg-[var(--color-paper)] text-center font-bold tabular-nums focus:outline-none focus:border-[var(--color-sage)]"
              aria-label={t("fastTimer.mins")}
            />
            <span className="text-[11px] text-[var(--color-muted)]">
              {t("fastTimer.mins")}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-[var(--color-faint)] text-center italic">
            {t("fastTimer.hint")}
          </p>
        </>
      )}

      <div className="flex gap-2 justify-center mt-3">
        {isIdle && (
          <button
            onClick={start}
            className="px-5 py-2 rounded-lg bg-[var(--color-sage)] hover:bg-[var(--color-sage-deep)] text-white text-sm font-bold tracking-wider transition shadow-sm"
          >
            {t("fastTimer.go")}
          </button>
        )}
        {isRunning && (
          <>
            <button
              onClick={pause}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-beige-warm)] hover:bg-[var(--color-kraft)] text-[var(--color-ink)] text-sm font-bold transition"
            >
              {t("fastTimer.pause")}
            </button>
            <button
              onClick={reset}
              className="px-3 py-1.5 rounded-lg border border-[var(--color-beige)] text-[var(--color-muted)] text-sm hover:bg-[var(--color-bg)] transition"
            >
              {t("fastTimer.reset")}
            </button>
          </>
        )}
        {isPaused && (
          <>
            <button
              onClick={resume}
              className="px-4 py-1.5 rounded-lg bg-[var(--color-sage)] hover:bg-[var(--color-sage-deep)] text-white text-sm font-bold transition"
            >
              {t("fastTimer.resume")}
            </button>
            <button
              onClick={reset}
              className="px-3 py-1.5 rounded-lg border border-[var(--color-beige)] text-[var(--color-muted)] text-sm hover:bg-[var(--color-bg)] transition"
            >
              {t("fastTimer.reset")}
            </button>
          </>
        )}
        {isDone && (
          <button
            onClick={reset}
            className="px-4 py-1.5 rounded-lg bg-[var(--color-sage)] hover:bg-[var(--color-sage-deep)] text-white text-sm font-bold transition"
          >
            {t("fastTimer.reset")}
          </button>
        )}
      </div>
    </div>
  );
}
