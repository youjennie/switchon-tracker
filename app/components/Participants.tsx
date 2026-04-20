"use client";

import { useEffect, useState } from "react";
import {
  loadParticipants,
  saveParticipants,
  type Participant,
} from "@/lib/storage";
import { useLang } from "./LangProvider";

export default function Participants() {
  const { t } = useLang();
  const [items, setItems] = useState<Participant[]>([]);
  const [value, setValue] = useState("");

  useEffect(() => {
    setItems(loadParticipants());
  }, []);

  function persist(next: Participant[]) {
    setItems(next);
    saveParticipants(next);
  }

  function add() {
    const v = value.trim();
    if (!v) return;
    const next = [
      ...items,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: v,
      },
    ];
    persist(next);
    setValue("");
  }

  function remove(id: string) {
    persist(items.filter((p) => p.id !== id));
  }

  return (
    <div className="paper-card rounded-2xl p-5 print-break-inside-avoid">
      <p className="text-xs font-semibold text-[var(--color-muted)] tracking-wider uppercase">
        {t("participants.title")}
      </p>
      <p className="font-hand text-xl text-[var(--color-ink)] mb-3">
        {t("participants.subtitle")}
      </p>

      {items.length === 0 ? (
        <p className="text-xs text-[var(--color-faint)] italic mb-3">
          {t("participants.empty")}
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2 mb-3">
          {items.map((p) => (
            <li
              key={p.id}
              className="group inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-[var(--color-sage-soft)] text-[var(--color-sage-deep)] text-sm"
            >
              <span className="font-hand text-base">{p.name}</span>
              <button
                onClick={() => remove(p.id)}
                aria-label={t("participants.remove")}
                className="no-print opacity-60 hover:opacity-100 hover:text-[var(--color-rose)] w-5 h-5 rounded-full hover:bg-white/60 flex items-center justify-center transition"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2 no-print">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={t("participants.placeholder")}
          className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-beige)] bg-[var(--color-paper)] text-sm focus:outline-none focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage-soft)]"
        />
        <button
          onClick={add}
          className="px-4 py-2 rounded-lg bg-[var(--color-sage)] hover:bg-[var(--color-sage-deep)] text-white text-sm font-semibold transition"
        >
          {t("participants.add")}
        </button>
      </div>
    </div>
  );
}
