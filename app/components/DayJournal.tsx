"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadJournals,
  saveJournals,
  setDayJournal,
  type AllJournals,
  type DayJournal,
} from "@/lib/storage";
import { useLang } from "./LangProvider";

const MOODS = ["😄", "🙂", "😐", "😫", "😴", "💪", "🔥"];

type Props = { day: number };

export default function DayJournalCard({ day }: Props) {
  const { t } = useLang();
  const [journals, setJournals] = useState<AllJournals>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setJournals(loadJournals());
  }, []);

  const entry: DayJournal = useMemo(() => journals[day] ?? {}, [journals, day]);

  function persist(next: AllJournals) {
    setJournals(next);
    saveJournals(next);
    setSavedAt(Date.now());
  }

  function updateField<K extends keyof DayJournal>(
    key: K,
    value: DayJournal[K]
  ) {
    const next = setDayJournal(journals, day, { [key]: value } as Partial<DayJournal>);
    // text fields are debounced to avoid "Saved" flashing on every keystroke
    if (key === "mood") {
      persist(next);
    } else {
      setJournals(next);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveJournals(next);
        setSavedAt(Date.now());
      }, 500);
    }
  }

  const showSaved = savedAt !== null && Date.now() - savedAt < 1400;

  return (
    <div className="paper-card rounded-2xl p-3 sm:p-4 print-break-inside-avoid">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-xs font-bold text-[var(--color-muted)] tracking-wider uppercase">
          {t("journal.title")}
        </p>
        {showSaved && (
          <span className="text-[10px] text-[var(--color-sage-deep)] font-bold">
            ✓ {t("journal.saved")}
          </span>
        )}
      </div>

      <div className="mb-3">
        <p className="text-[11px] font-bold text-[var(--color-muted)] mb-1.5">
          {t("journal.mood")}
        </p>
        <div className="flex gap-1 flex-wrap">
          {MOODS.map((m) => {
            const selected = entry.mood === m;
            return (
              <button
                key={m}
                onClick={() => updateField("mood", selected ? undefined : m)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl transition
                  ${selected ? "bg-[var(--color-sage)] ring-2 ring-[var(--color-sage-deep)]" : "bg-[var(--color-paper)] hover:bg-[var(--color-sage-soft)]"}
                `}
                aria-label={m}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-3">
        <p className="text-[11px] font-bold text-[var(--color-muted)] mb-1">
          🏃 {t("journal.exercise")}
        </p>
        <textarea
          value={entry.exercise ?? ""}
          onChange={(e) => updateField("exercise", e.target.value)}
          placeholder={t("journal.exercisePh")}
          rows={2}
          className="w-full resize-none px-2.5 py-1.5 rounded-lg border border-[var(--color-beige)] bg-[var(--color-paper)] text-sm focus:outline-none focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage-soft)]"
        />
      </div>

      <div>
        <p className="text-[11px] font-bold text-[var(--color-muted)] mb-1">
          📝 {t("journal.note")}
        </p>
        <textarea
          value={entry.note ?? ""}
          onChange={(e) => updateField("note", e.target.value)}
          placeholder={t("journal.notePh")}
          rows={2}
          className="w-full resize-none px-2.5 py-1.5 rounded-lg border border-[var(--color-beige)] bg-[var(--color-paper)] text-sm focus:outline-none focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage-soft)]"
        />
      </div>
    </div>
  );
}
