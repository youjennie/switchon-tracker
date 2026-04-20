"use client";

import { LangToggle, useLang } from "./LangProvider";

export default function DashboardHeader() {
  const { t } = useLang();
  return (
    <div className="no-print flex items-center justify-between gap-3 px-6 py-3 border-b border-[var(--color-beige)] paper-card">
      <div className="flex items-center gap-2">
        <span className="font-hand text-2xl text-[var(--color-ink)]">
          Switch On Season
        </span>
        <span className="text-xs text-[var(--color-faint)] tracking-widest uppercase hidden sm:inline">
          28 day tracker
        </span>
      </div>
      <div className="flex items-center gap-2">
        <LangToggle />
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-beige-warm)] bg-[var(--color-card)] hover:bg-[var(--color-sage-soft)] text-xs font-semibold transition"
          title={t("app.print")}
        >
          <span>🖨</span>
          <span>{t("app.print")}</span>
        </button>
      </div>
    </div>
  );
}
