"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { t as translate, type Lang } from "@/lib/i18n";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LangCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "switchon.lang.v1";

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ko");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === "ko" || stored === "en") setLangState(stored);
    } catch {}
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  }, []);

  const toggle = useCallback(
    () => setLang(lang === "ko" ? "en" : "ko"),
    [lang, setLang]
  );

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      toggle,
      t: (key, params) => translate(lang, key, params),
    }),
    [lang, setLang, toggle]
  );

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, toggle, t } = useLang();
  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-beige-warm)] bg-[var(--color-card)] hover:bg-[var(--color-card-muted)] text-xs font-semibold tracking-wider transition ${className}`}
      aria-label={t("app.langSwitchTo")}
      title={t("app.langSwitchTo")}
    >
      <span
        className={`w-5 text-center ${lang === "ko" ? "text-[var(--color-sage-deep)]" : "text-[var(--color-faint)]"}`}
      >
        KO
      </span>
      <span className="text-[var(--color-faint)]">/</span>
      <span
        className={`w-5 text-center ${lang === "en" ? "text-[var(--color-sage-deep)]" : "text-[var(--color-faint)]"}`}
      >
        EN
      </span>
    </button>
  );
}
