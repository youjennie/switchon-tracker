"use client";

import { useState } from "react";
import { buildSchedule } from "@/lib/schedule";
import {
  saveSchedule,
  saveProfile,
  recommendedProteinG,
  type UserProfile,
} from "@/lib/storage";
import { useLang } from "./LangProvider";

function defaultStartISO(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function SetupForm({ onReady }: { onReady: () => void }) {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [weight, setWeight] = useState<string>("");
  const [startAt, setStartAt] = useState<string>(defaultStartISO());
  const [error, setError] = useState<string | null>(null);

  const proteinPreview =
    weight && !Number.isNaN(Number(weight))
      ? recommendedProteinG(Number(weight))
      : null;

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    const w = Number(weight);
    if (!name.trim()) return setError(t("setup.errName"));
    if (!w || w < 30 || w > 200) return setError(t("setup.errWeight"));
    if (!startAt) return setError(t("setup.errStartAt"));

    const schedule = buildSchedule(startAt);
    const profile: UserProfile = {
      name: name.trim(),
      weightKg: w,
      proteinGoalG: recommendedProteinG(w),
    };
    saveSchedule(schedule);
    saveProfile(profile);
    onReady();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-[var(--color-sage-soft)] text-[var(--color-sage-deep)] text-xs tracking-wider font-semibold mb-4">
            {t("setup.badge")}
          </div>
          <h1 className="font-hand text-4xl text-[var(--color-ink)] mb-3">
            {t("setup.title")}
          </h1>
          <p className="text-[var(--color-muted)] text-sm leading-relaxed">
            {t("setup.subtitle")}
          </p>
        </div>

        <form
          onSubmit={handleStart}
          className="paper-card rounded-2xl p-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
              {t("setup.name")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("setup.namePh")}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-beige)] bg-[var(--color-paper)] focus:outline-none focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage-soft)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
              {t("setup.weight")}
            </label>
            <input
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder={t("setup.weightPh")}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-beige)] bg-[var(--color-paper)] focus:outline-none focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage-soft)]"
            />
            {proteinPreview !== null && (
              <p className="mt-1.5 text-xs text-[var(--color-muted)]">
                {t("setup.proteinPreview")}{" "}
                <span className="font-semibold text-[var(--color-sage-deep)]">
                  {proteinPreview}
                  {t("setup.proteinUnit")}
                </span>{" "}
                <span className="text-[var(--color-faint)]">
                  {t("setup.proteinFormula")}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
              {t("setup.startAt")}
            </label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-beige)] bg-[var(--color-paper)] focus:outline-none focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage-soft)]"
            />
            <p className="mt-1.5 text-xs text-[var(--color-faint)]">
              {t("setup.startHint")}
            </p>
          </div>

          {error && (
            <p className="text-sm text-[var(--color-rose)] bg-[var(--color-rose)]/10 border border-[var(--color-rose)]/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-[var(--color-sage)] hover:bg-[var(--color-sage-deep)] transition text-white font-semibold tracking-wide"
          >
            {t("setup.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
