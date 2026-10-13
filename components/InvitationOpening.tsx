"use client";

import type { CSSProperties, ReactNode } from "react";

import type { OpeningTheme } from "@/lib/openingTheme";

type Props = {
  style: string;
  theme: OpeningTheme;
  title: string;
  started: boolean;
  ready: boolean;
  onOpen: () => void;
};

const OPEN_LABEL = "Урилгаа нээх";

export default function InvitationOpening({
  style,
  theme,
  title,
  started,
  ready,
  onOpen,
}: Props) {
  const fade: CSSProperties = {
    background: theme.background,
    color: theme.ink,
  };

  const wrapper = `fixed inset-0 z-[100] flex items-center justify-center overflow-hidden transition-opacity duration-[1300ms] ${
    started ? "pointer-events-none opacity-0" : "opacity-100"
  }`;

  const button = (
    <button
      type="button"
      onClick={onOpen}
      disabled={!ready}
      className="mt-9 rounded-full px-8 py-3 text-sm font-semibold shadow-xl transition hover:scale-105 active:scale-95 disabled:opacity-50"
      style={{
        background: theme.buttonBackground,
        color: theme.buttonInk,
      }}
    >
      {ready ? OPEN_LABEL : "Ачаалж байна..."}
    </button>
  );

  const heading = (ink: string, extra?: ReactNode) => (
    <div className="relative z-10 px-6 text-center" style={{ color: ink }}>
      <div className="text-5xl">{theme.emblem}</div>
      <div
        className="mt-3 text-[10px] font-semibold uppercase tracking-[0.3em] opacity-70"
      >
        {theme.label}
      </div>
      <div
        className="mt-2 text-sm tracking-[0.4em]"
        style={{ color: theme.accent }}
      >
        {theme.ornament}
      </div>
      {title && (
        <h1 className="mt-4 text-3xl font-semibold">{title}</h1>
      )}
      {extra}
      {!started && button}
    </div>
  );

  if (style === "envelope" || style === "dugtui") {
    return (
      <div className={wrapper} style={fade}>
        <div
          className={`relative z-10 flex w-[min(88vw,420px)] flex-col items-center transition-all duration-[1500ms] ${
            started ? "scale-[1.35] opacity-0" : "scale-100 opacity-100"
          }`}
        >
          <div
            className={`relative h-[230px] w-[340px] max-w-full overflow-hidden rounded-[18px] shadow-[0_30px_100px_rgba(0,0,0,0.35)] transition-all duration-[1300ms] ${
              started ? "translate-y-[-40px] scale-105" : ""
            }`}
            style={{
              background: theme.paper,
              border: `1px solid ${theme.accent}66`,
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-0 border-l-[170px] border-r-[170px] border-t-[125px] border-l-transparent border-r-transparent"
              style={{
                borderTopColor: theme.flap,
                transformOrigin: "top center",
                transition: "transform 900ms ease",
                transform: started ? "rotateX(180deg)" : "rotateX(0deg)",
              }}
            />

            <div
              className="absolute inset-x-5 bottom-5 top-5 rounded-[12px]"
              style={{ border: `1px solid ${theme.accent}55` }}
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative z-10 text-center text-[#49382a]">
                <div className="mb-2 text-4xl">{theme.emblem}</div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.25em] opacity-60">
                  {theme.label}
                </p>
                {title && (
                  <p className="mt-2 text-lg font-medium">{title}</p>
                )}
              </div>
            </div>

            <div
              className={`absolute bottom-0 left-0 right-0 h-[120px] origin-bottom transition-transform duration-[1000ms] ${
                started ? "scale-y-0" : "scale-y-100"
              }`}
              style={{
                background: theme.flap,
                clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
              }}
            />
          </div>

          {!started && button}
        </div>
      </div>
    );
  }

  if (style === "light" || style === "gerel" || style === "гэрэл") {
    return (
      <div className={wrapper} style={fade}>
        <div
          className={`absolute inset-0 transition-all duration-[1400ms] ${
            started ? "scale-[3] opacity-0" : "scale-100 opacity-100"
          }`}
          style={{
            background: `radial-gradient(circle at center, ${theme.accent}ee 0%, ${theme.accent}66 14%, ${theme.accent}14 42%, transparent 70%)`,
          }}
        />
        {heading(theme.ink)}
      </div>
    );
  }

  if (style === "focus" || style === "fokus") {
    return (
      <div className={wrapper} style={fade}>
        <div
          className={`absolute inset-0 transition-all duration-[1300ms] ${
            started ? "scale-[1.5] opacity-0" : "scale-100 blur-[18px] opacity-100"
          }`}
          style={{
            background: `radial-gradient(circle at center, ${theme.accent}55, transparent 60%)`,
          }}
        />
        <div
          className={`transition-all duration-[1200ms] ${
            started ? "scale-[1.25] opacity-0" : "scale-100 opacity-100"
          }`}
        >
          {heading(theme.ink)}
        </div>
      </div>
    );
  }

  if (style === "curtain" || style === "hoshig") {
    const panel = (side: "left" | "right"): CSSProperties => ({
      background: `linear-gradient(${side === "left" ? "90deg" : "270deg"}, ${theme.panelA}, ${theme.panelB})`,
      boxShadow:
        side === "left"
          ? "20px 0 50px rgba(0,0,0,0.35)"
          : "-20px 0 50px rgba(0,0,0,0.35)",
    });

    return (
      <div className={wrapper} style={fade}>
        <div
          className={`absolute inset-y-0 left-0 w-1/2 transition-transform duration-[1200ms] ease-in-out ${
            started ? "-translate-x-full" : "translate-x-0"
          }`}
          style={panel("left")}
        />
        <div
          className={`absolute inset-y-0 right-0 w-1/2 transition-transform duration-[1200ms] ease-in-out ${
            started ? "translate-x-full" : "translate-x-0"
          }`}
          style={panel("right")}
        />
        {heading(theme.panelInk)}
      </div>
    );
  }

  if (style === "pulse" || style === "lugshih") {
    return (
      <div className={wrapper} style={fade}>
        <div
          className={`absolute h-[180px] w-[180px] rounded-full transition-all duration-[1200ms] ${
            started ? "scale-[8] opacity-0" : "animate-pulse scale-100 opacity-100"
          }`}
          style={{ border: `1px solid ${theme.accent}99` }}
        />
        <div
          className={`absolute h-[110px] w-[110px] rounded-full transition-all duration-[1000ms] ${
            started ? "scale-[7] opacity-0" : "animate-pulse scale-100 opacity-100"
          }`}
          style={{ border: `1px solid ${theme.accent}cc` }}
        />
        {heading(theme.ink)}
      </div>
    );
  }

  if (style === "slide") {
    const panel = (side: "left" | "right"): CSSProperties => ({
      background: `linear-gradient(${side === "left" ? "90deg" : "270deg"}, ${theme.panelB}, ${theme.panelA})`,
    });

    return (
      <div className={wrapper} style={fade}>
        <div
          className={`absolute inset-y-0 left-0 w-1/2 transition-transform duration-[1300ms] ${
            started ? "-translate-x-full" : "translate-x-0"
          }`}
          style={panel("left")}
        />
        <div
          className={`absolute inset-y-0 right-0 w-1/2 transition-transform duration-[1300ms] ${
            started ? "translate-x-full" : "translate-x-0"
          }`}
          style={panel("right")}
        />
        {heading(theme.panelInk)}
      </div>
    );
  }

  if (style === "iris") {
    return (
      <div className={wrapper} style={fade}>
        <div
          className={`absolute left-1/2 top-1/2 aspect-square w-[30vmax] -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-[1300ms] ease-in-out ${
            started ? "scale-[12]" : "scale-0"
          }`}
          style={{ background: theme.paper }}
        />
        {heading(theme.ink)}
      </div>
    );
  }

  return (
    <div className={wrapper} style={fade}>
      <div
        className={`absolute left-1/2 top-1/2 h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-[1300ms] ease-in-out ${
          started ? "scale-[40] opacity-100" : "scale-100 opacity-0"
        }`}
        style={{ background: theme.paper }}
      />
      {heading(theme.ink)}
    </div>
  );
}
