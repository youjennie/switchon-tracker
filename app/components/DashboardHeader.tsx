"use client";

import { LangToggle, useLang } from "./LangProvider";

export default function DashboardHeader() {
  const { t } = useLang();
  return (
    <div className="no-print flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5 sm:py-3 border-b border-[var(--color-beige)] paper-card">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg sm:text-2xl font-bold text-[var(--color-ink)] truncate">
          Switch On Season
        </span>
        <span className="text-xs text-[var(--color-faint)] tracking-widest uppercase hidden lg:inline shrink-0">
          28 day tracker
        </span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <LangToggle />
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-[var(--color-beige-warm)] bg-[var(--color-card)] hover:bg-[var(--color-sage-soft)] text-xs font-bold transition"
          title={t("app.print")}
          aria-label={t("app.print")}
        >
          <span>🖨</span>
          <span className="hidden sm:inline">{t("app.print")}</span>
        </button>
      </div>
    </div>
  );
}
