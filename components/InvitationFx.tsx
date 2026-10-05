"use client";

import {
  CSSProperties,
  ReactNode,
  useState,
} from "react";

/* =========================================================
   PATTERN BACKGROUND
========================================================= */

function svgUri(svg: string) {
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(
    svg
  )}")`;
}

export function patternStyle(
  pattern: string,
  accent: string,
  tone: "dark" | "light"
): CSSProperties {
  const color = encodeURIComponent(accent);
  const stroke = `stroke='${decodeURIComponent(
    color
  )}' stroke-opacity='0.22' fill='none' stroke-width='1.4'`;
  const fill = `fill='${decodeURIComponent(
    color
  )}' fill-opacity='0.2'`;

  const base: CSSProperties = {
    backgroundColor: tone === "dark" ? "#1b1713" : "#faf6ee",
  };

  switch (pattern) {
    case "olzii":
      return {
        ...base,
        backgroundImage: svgUri(
          `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><path d='M24 4v40M4 24h40M24 4h12v12M44 24v12H32M24 44H12V32M4 24V12h12' ${stroke}/></svg>`
        ),
        backgroundSize: "48px 48px",
      };
    case "evereguls":
      return {
        ...base,
        backgroundImage: svgUri(
          `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'><path d='M8 28c0-12 20-12 20 0s-14 10-14 2M48 28c0 12-20 12-20 0s14-10 14-2' ${stroke}/></svg>`
        ),
        backgroundSize: "56px 56px",
      };
    case "cloud":
      return {
        ...base,
        backgroundImage: svgUri(
          `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='40'><path d='M6 28c0-8 10-8 10-2 0-10 16-10 16 0 0-8 12-8 12 0M34 28c0-8 10-8 10-2 0-10 16-10 16 0' ${stroke}/></svg>`
        ),
        backgroundSize: "64px 40px",
      };
    case "tumen":
      return {
        ...base,
        backgroundImage: svgUri(
          `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect x='6' y='6' width='28' height='28' ${stroke}/><rect x='13' y='13' width='14' height='14' ${stroke}/><rect x='18' y='18' width='4' height='4' ${fill}/></svg>`
        ),
        backgroundSize: "40px 40px",
      };
    case "stars":
      return {
        ...base,
        backgroundImage: svgUri(
          `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><circle cx='10' cy='12' r='1.6' ${fill}/><circle cx='42' cy='30' r='1.2' ${fill}/><path d='M30 6l2 5 5 2-5 2-2 5-2-5-5-2 5-2z' ${fill}/><circle cx='18' cy='48' r='1.4' ${fill}/></svg>`
        ),
        backgroundSize: "60px 60px",
      };
    case "paper":
      return {
        ...base,
        backgroundImage: svgUri(
          `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.45 0 0 0 0 0.4 0 0 0 0.12 0'/></filter><rect width='120' height='120' filter='url(#n)'/></svg>`
        ),
      };
    default:
      return base;
  }
}

/* =========================================================
   FRAME
========================================================= */

export function FrameBox({
  frame,
  accent,
  className = "",
  children,
}: {
  frame: string;
  accent: string;
  className?: string;
  children: ReactNode;
}) {
  if (frame === "none") {
    return (
      <div className={`overflow-hidden rounded-2xl ${className}`}>
        {children}
      </div>
    );
  }

  const styles: Record<string, CSSProperties> = {
    evereguls: {
      border: `2px solid ${accent}`,
      outline: `1px solid ${accent}`,
      outlineOffset: "3px",
      borderRadius: "6px",
    },
    cloud: {
      border: `3px dotted ${accent}`,
      borderRadius: "22px",
    },
    sprout: {
      border: `2px solid ${accent}`,
      borderRadius: "999px 999px 14px 14px",
    },
    khadag: {
      border: `6px double ${accent}`,
      borderRadius: "4px",
    },
    khaan: {
      border: `4px ridge ${accent}`,
      borderRadius: "14px",
      boxShadow: `0 0 0 4px ${accent}33`,
    },
  };

  return (
    <div
      className={`p-1.5 ${className}`}
      style={styles[frame] ?? styles.evereguls}
    >
      <div
        className="h-full w-full overflow-hidden"
        style={{
          borderRadius:
            frame === "sprout"
              ? "999px 999px 10px 10px"
              : frame === "cloud"
              ? "16px"
              : "2px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   ANIMATION OVERLAY
========================================================= */

type Particle = {
  glyph: string;
  mode: string;
  size: number;
  duration: number;
};

function particleConfig(animation: string): Particle | null {
  switch (animation) {
    case "snow":
      return { glyph: "❄", mode: "fall", size: 16, duration: 9 };
    case "meteor":
      return { glyph: "", mode: "meteor", size: 2, duration: 3.2 };
    case "party":
      return { glyph: "▪", mode: "fall", size: 12, duration: 6 };
    case "petals":
      return { glyph: "🌸", mode: "fall", size: 16, duration: 10 };
    case "fireflies":
      return { glyph: "", mode: "twinkle", size: 6, duration: 5 };
    case "fireworks":
      return { glyph: "✦", mode: "burst", size: 26, duration: 2.4 };
    case "hearts":
      return { glyph: "❤", mode: "rise", size: 16, duration: 9 };
    case "balloons":
      return { glyph: "🎈", mode: "rise", size: 24, duration: 12 };
    case "clouds":
      return { glyph: "☁", mode: "drift", size: 48, duration: 40 };
    default:
      return null;
  }
}

const PARTY_COLORS = [
  "#f94144",
  "#f9c74f",
  "#90be6d",
  "#577590",
  "#f3722c",
  "#c77dff",
];

export function FxOverlay({
  animation,
  accent,
  className = "fixed",
}: {
  animation: string;
  accent: string;
  className?: string;
}) {
  if (!animation || animation === "none") {
    return null;
  }

  const wrapper = `fx-layer pointer-events-none inset-0 z-20 overflow-hidden ${className}`;

  if (animation === "aurora") {
    return (
      <div className={wrapper} aria-hidden>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute -left-1/4 w-[150%]"
            style={{
              top: `${i * 16}%`,
              height: "34%",
              background: `linear-gradient(180deg, transparent, ${
                ["#5eead4", "#a78bfa", "#60a5fa"][i]
              }55, transparent)`,
              filter: "blur(28px)",
              animation: `fx-aurora ${8 + i * 3}s ease-in-out ${
                i * 1.5
              }s infinite`,
            }}
          />
        ))}
      </div>
    );
  }

  if (animation === "fog") {
    return (
      <div className={wrapper} aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${i * 28 - 10}%`,
              bottom: `${(i % 2) * 18 - 6}%`,
              width: "60%",
              height: "38%",
              background: "rgba(255,255,255,0.55)",
              filter: "blur(46px)",
              animation: `fx-fog ${14 + i * 3}s ease-in-out ${
                i * 2
              }s infinite`,
            }}
          />
        ))}
      </div>
    );
  }

  const config = particleConfig(animation);

  if (!config) return null;

  const count = config.mode === "burst" ? 7 : 22;

  return (
    <div className={wrapper} aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const left = (i * 37 + 11) % 100;
        const top =
          config.mode === "burst" || config.mode === "twinkle"
            ? (i * 53 + 7) % 90
            : config.mode === "drift"
            ? (i * 29) % 55
            : 0;
        const delay = -((i * 1.7) % config.duration);
        const dx = ((i % 5) - 2) * 14;

        const style: CSSProperties = {
          position: "absolute",
          left: `${left}%`,
          top: `${config.mode === "rise" ? 0 : top}%`,
          fontSize: config.size,
          color:
            animation === "party"
              ? PARTY_COLORS[i % PARTY_COLORS.length]
              : animation === "fireworks"
              ? PARTY_COLORS[i % PARTY_COLORS.length]
              : animation === "snow"
              ? "#ffffff"
              : animation === "hearts"
              ? "#e5566d"
              : accent,
          animation: `fx-${config.mode} ${
            config.duration + (i % 4)
          }s linear ${delay}s infinite`,
          ["--fx-dx" as string]: `${dx}px`,
          textShadow:
            animation === "snow"
              ? "0 0 4px rgba(0,0,0,0.25)"
              : undefined,
        };

        if (animation === "meteor") {
          return (
            <span
              key={i}
              style={{
                ...style,
                top: `${(i * 7) % 40}%`,
                left: `${50 + ((i * 13) % 50)}%`,
                width: 110,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${accent})`,
                animationDelay: `${-((i * 0.9) % 6)}s`,
                animationDuration: "3.4s",
              }}
            />
          );
        }

        if (animation === "fireflies") {
          return (
            <span
              key={i}
              style={{
                ...style,
                top: `${top}%`,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#fde047",
                boxShadow: "0 0 10px 3px #fde04788",
              }}
            />
          );
        }

        return (
          <span key={i} style={style}>
            {config.glyph}
          </span>
        );
      })}
    </div>
  );
}

/* =========================================================
   OPEN GATE
========================================================= */

export function OpenGate({
  style,
  accent,
  title,
  onOpen,
  label = "Урилга нээх",
}: {
  style: string;
  accent: string;
  title: string;
  onOpen: () => void;
  label?: string;
}) {
  const [opening, setOpening] = useState(false);
  const [gone, setGone] = useState(false);

  if (gone) return null;

  function handleOpen() {
    if (opening) return;

    setOpening(true);
    onOpen();

    window.setTimeout(() => setGone(true), 1300);
  }

  const duration = "1.1s";

  const overlayAnimation: Record<string, string> = {
    light: `gate-light ${duration} ease-in forwards`,
    focus: `gate-blur ${duration} ease-in forwards`,
    slide: `gate-slide ${duration} cubic-bezier(.7,0,.3,1) forwards`,
    envelope: `gate-fade 0.5s ease-in 0.7s forwards`,
  };

  const content = (
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center">
      {style === "envelope" ? (
        <div
          className="relative h-44 w-72 rounded-md shadow-2xl"
          style={{ backgroundColor: accent }}
        >
          <div
            className="absolute inset-x-0 top-0 h-24 origin-top"
            style={{
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              backgroundColor: `${accent}`,
              filter: "brightness(0.85)",
              transformStyle: "preserve-3d",
              animation: opening
                ? `gate-flap 0.7s ease-in forwards`
                : undefined,
            }}
          />
          <div className="absolute inset-0 flex items-end justify-center pb-6 text-xs tracking-[0.3em] text-white/90">
            INVITATION
          </div>
        </div>
      ) : (
        <div
          className="text-5xl"
          style={{ color: accent }}
        >
          ✦
        </div>
      )}

      {title && (
        <p className="mt-8 max-w-xs whitespace-pre-line text-xl font-semibold text-white">
          {title}
        </p>
      )}

      <button
        type="button"
        onClick={handleOpen}
        className="mt-8 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-105"
        style={{ backgroundColor: accent }}
      >
        {label}
      </button>
    </div>
  );

  if (style === "curtain") {
    return (
      <div className="fixed inset-0 z-[100]">
        <div
          className="absolute inset-y-0 left-0 w-1/2 bg-[#1a1a1a]"
          style={{
            animation: opening
              ? `gate-left ${duration} ease-in-out forwards`
              : undefined,
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-1/2 bg-[#1a1a1a]"
          style={{
            animation: opening
              ? `gate-right ${duration} ease-in-out forwards`
              : undefined,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            opacity: opening ? 0 : 1,
            transition: "opacity 0.3s",
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  if (style === "iris") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: opening ? undefined : "0px",
            height: opening ? undefined : "0px",
            boxShadow: "0 0 0 200vmax #1a1a1a",
            animation: opening
              ? `gate-iris ${duration} ease-in forwards`
              : undefined,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        {!opening && (
          <div className="absolute inset-0">{content}</div>
        )}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#1a1a1a]"
      style={{
        animation: opening
          ? overlayAnimation[style] ?? overlayAnimation.envelope
          : undefined,
        backgroundImage:
          style === "light"
            ? `radial-gradient(circle at center, ${accent}66, #1a1a1a 70%)`
            : undefined,
      }}
    >
      {content}
    </div>
  );
}
