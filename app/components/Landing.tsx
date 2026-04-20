"use client";

import Image from "next/image";
import { useState } from "react";
import { useLang } from "./LangProvider";

export default function Landing({ onEnter }: { onEnter: () => void }) {
  const { t } = useLang();
  const [opening, setOpening] = useState(false);

  function handleClick() {
    if (opening) return;
    setOpening(true);
    setTimeout(onEnter, 550);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 select-none">
      <button
        onClick={handleClick}
        aria-label={t("landing.aria")}
        className={`group relative outline-none transition-transform duration-500 ease-out ${
          opening ? "scale-105" : "hover:scale-[1.02]"
        }`}
      >
        <div
          className={`relative w-[280px] sm:w-[360px] md:w-[420px] transition-all duration-500 ${
            opening ? "-translate-y-3 rotate-[-2deg]" : ""
          }`}
        >
          <Image
            src="/switch-on-season.png"
            alt="Switch On Season"
            width={736}
            height={920}
            priority
            className="w-full h-auto drop-shadow-[0_18px_30px_rgba(80,60,25,0.25)]"
          />
        </div>

        <div className="mt-8 text-center">
          <p className="font-hand text-2xl text-[var(--color-ink)] opacity-80">
            {opening ? t("landing.opening") : t("landing.cta")}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)] tracking-widest uppercase">
            {t("landing.hint")}
          </p>
        </div>
      </button>
    </div>
  );
}
