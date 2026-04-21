"use client";

import { useEffect, useState } from "react";
import {
  getOrCreateRoomId,
  loadParticipants,
  saveParticipants,
  type Participant,
} from "@/lib/storage";
import { useLang } from "./LangProvider";

export default function Participants() {
  const { t } = useLang();
  const [items, setItems] = useState<Participant[]>([]);
  const [value, setValue] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setItems(loadParticipants());
    const roomId = getOrCreateRoomId();
    const base = `${window.location.origin}${window.location.pathname}`.replace(/\/$/, "/");
    const url = `${base}?room=${roomId}`;
    setInviteUrl(url);
  }, []);

  // Rebuild message whenever language or url changes
  useEffect(() => {
    if (inviteUrl) setInviteMsg(t("participants.inviteMessage", { url: inviteUrl }));
  }, [inviteUrl, t]);

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

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteMsg);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API may be blocked — fall back to select-all on the textarea
    }
  }

  return (
    <div className="paper-card rounded-2xl p-4 sm:p-5 print-break-inside-avoid">
      <p className="text-xs font-bold text-[var(--color-muted)] tracking-wider uppercase">
        {t("participants.title")}
      </p>
      <p className="text-xl font-bold text-[var(--color-ink)] mb-3">
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
              <span>{p.name}</span>
              <button
                onClick={() => remove(p.id)}
                aria-label={t("participants.remove")}
                className="no-print opacity-70 md:opacity-60 hover:opacity-100 hover:text-[var(--color-rose)] w-5 h-5 rounded-full hover:bg-white/60 flex items-center justify-center transition"
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
          className="px-4 py-2 rounded-lg bg-[var(--color-sage)] hover:bg-[var(--color-sage-deep)] text-white text-sm font-bold transition"
        >
          {t("participants.add")}
        </button>
      </div>

      {items.length > 0 && inviteMsg && (
        <div className="no-print mt-4 pt-4 border-t border-[var(--color-beige)]">
          <p className="text-[11px] font-bold text-[var(--color-muted)] tracking-wider uppercase mb-2">
            💌 {t("participants.inviteHeader")}
          </p>
          <div className="relative">
            <textarea
              readOnly
              value={inviteMsg}
              onFocus={(e) => e.currentTarget.select()}
              rows={2}
              className="w-full resize-none px-3 py-2 pr-20 rounded-lg border border-[var(--color-beige)] bg-[var(--color-paper)] text-sm text-[var(--color-ink-soft)] focus:outline-none focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage-soft)]"
            />
            <button
              onClick={handleCopy}
              className={`absolute top-1.5 right-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition
                ${copied
                  ? "bg-[var(--color-sage-deep)] text-white"
                  : "bg-[var(--color-sage)] hover:bg-[var(--color-sage-deep)] text-white"}
              `}
            >
              {copied ? `✓ ${t("participants.copied")}` : t("participants.copy")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
