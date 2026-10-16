"use client";

import type { CSSProperties, ReactNode } from "react";

import type { TierId } from "@/lib/invitationExtras";
import { SCENE_OPENING_MS } from "@/lib/invitationTemplates";
import type { SceneDef } from "@/lib/invitationTemplates";
import { mix, seeded } from "@/lib/sceneTheme";
import type { SceneColors } from "@/lib/sceneTheme";

import { Balloon, Blossom, Cloud, GradCap, Rose, UlziiKnot } from "./art";
import SceneBackdrop from "./SceneBackdrop";

type Props = {
  scene: SceneDef;
  colors: SceneColors;
  tier: Exclude<TierId, "classic">;
  title: string;
  started: boolean;
  ready: boolean;
  /* Plays the animated opening. */
  onOpen: () => void;
  /* Jumps straight to the invitation. */
  onSkip: () => void;
  /* Static preview inside a card, not a full-screen overlay. */
  embedded?: boolean;
};

function readableOn(hex: string): string {
  const value = parseInt(hex.slice(1), 16);
  const luma =
    (0.299 * ((value >> 16) & 255) +
      0.587 * ((value >> 8) & 255) +
      0.114 * (value & 255)) /
    255;
  return luma > 0.62 ? "#2c241b" : "#ffffff";
}

function curtainColor(scene: SceneDef, c: SceneColors): string {
  switch (scene.id) {
    case "adult-birthday":
      return "#6b1d2a";
    case "first-birthday":
      return mix(c.accent, "#ffffff", 0.35);
    case "anniversary":
      return mix(c.accent, "#000000", 0.1);
    default:
      return mix(c.primary, "#000000", c.tone === "dark" ? 0.1 : 0.2);
  }
}

function coverColor(scene: SceneDef, c: SceneColors): string {
  switch (scene.opening) {
    case "doors":
      return mix(c.accent, "#ffffff", 0.82);
    case "book":
      return mix(c.primary, "#000000", 0.2);
    case "curtain":
      return curtainColor(scene, c);
    case "silk":
      return mix(c.primary, "#000000", 0.08);
    case "balloons":
      return mix(c.primary, "#ffffff", 0.45);
    case "clouds":
      return mix(c.primary, "#ffffff", 0.7);
    case "bloom":
      return mix(c.primary, "#ffffff", 0.78);
    case "shutters":
    default:
      return c.tone === "dark" ? mix(c.primary, "#000000", 0.25) : mix(c.primary, "#000000", 0.05);
  }
}

function Door({ side, scene, c, cover }: { side: "l" | "r"; scene: SceneDef; c: SceneColors; cover: string }) {
  const book = scene.opening === "book";
  const frame = c.accent;
  const edge = book ? mix(frame, "#ffffff", 0.2) : frame;

  return (
    <div className={`sc-door sc-door-${side}`}>
      <div
        className="absolute inset-0"
        style={{
          background: book
            ? `linear-gradient(${side === "l" ? "90deg" : "270deg"}, ${mix(cover, "#000000", 0.25)}, ${cover} 30%, ${mix(cover, "#ffffff", 0.08)})`
            : `linear-gradient(${side === "l" ? "90deg" : "270deg"}, ${mix(cover, "#000000", 0.12)}, ${cover} 18%, ${mix(cover, "#ffffff", 0.5)} 100%)`,
          borderRight: side === "l" ? `3px solid ${edge}` : undefined,
          borderLeft: side === "r" ? `3px solid ${edge}` : undefined,
          boxShadow: `inset 0 0 60px ${mix(frame, "#000000", 0.4)}55`,
        }}
      />
      <div
        className="absolute inset-[5%] rounded-t-[999px]"
        style={{ border: `2px solid ${edge}`, [side === "l" ? "borderRight" : "borderLeft"]: "none" }}
      />
      <div
        className="absolute"
        style={{
          inset: "9% 9% 9% 9%",
          border: `1px solid ${edge}aa`,
          borderRadius: "999px 0 0 0",
          [side === "l" ? "borderRight" : "borderLeft"]: "none",
          ...(side === "r" ? { borderRadius: "0 999px 0 0" } : {}),
        }}
      />
      {[0, 1].map((row) => (
        <div
          key={row}
          className="absolute"
          style={{
            left: "14%",
            right: "14%",
            top: row ? "56%" : "24%",
            height: "26%",
            border: `1.5px solid ${edge}99`,
            background: `linear-gradient(135deg, ${edge}18, transparent)`,
          }}
        />
      ))}
      <span
        className="absolute top-1/2 h-[7%] w-[3.4%] min-w-[10px] -translate-y-1/2 rounded-full"
        style={{
          [side === "l" ? "right" : "left"]: "5%",
          background: `radial-gradient(circle at 35% 30%, #fff6d8, ${edge} 55%, ${mix(edge, "#000000", 0.4)})`,
          boxShadow: `0 0 14px ${edge}`,
        }}
      />
      {book && side === "l" && (
        <GradCap color={mix(cover, "#000000", 0.2)} accent={edge} className="absolute left-1/2 top-[14%] w-[46%] -translate-x-1/2 opacity-90" style={{ filter: `drop-shadow(0 0 8px ${edge}88)` }} />
      )}
      {!book && side === "l" && (
        <Rose color={mix("#c8566b", c.primary, 0.1)} className="absolute bottom-[8%] left-[8%] w-[34%] opacity-95" />
      )}
      {!book && side === "r" && (
        <Rose color={mix("#c8566b", c.primary, 0.1)} className="absolute bottom-[8%] right-[8%] w-[34%] opacity-95" />
      )}
    </div>
  );
}

function Panels({ scene, c, started }: { scene: SceneDef; c: SceneColors; started: boolean }) {
  const cover = coverColor(scene, c);

  switch (scene.opening) {
    case "doors":
    case "book":
      return (
        <div className="sc-doors absolute inset-0">
          <div className="sc-spill absolute inset-y-0 left-1/2 w-[70%] -translate-x-1/2" style={{ background: `radial-gradient(ellipse at center, ${mix(c.accent, "#ffffff", 0.7)}, ${c.glow}00 70%)` }} />
          <Door side="l" scene={scene} c={c} cover={cover} />
          <Door side="r" scene={scene} c={c} cover={cover} />
        </div>
      );

    case "curtain": {
      const dark = mix(cover, "#000000", 0.35);
      const pleats = `repeating-linear-gradient(90deg, ${dark}66 0 5%, transparent 5% 11%, ${mix(cover, "#ffffff", 0.18)}44 11% 14%, transparent 14% 20%)`;
      return (
        <div className="absolute inset-0">
          {(["l", "r"] as const).map((side) => (
            <div key={side} className={`sc-curtain sc-curtain-${side}`} style={{ background: `${pleats}, linear-gradient(180deg, ${mix(cover, "#ffffff", 0.1)}, ${cover} 40%, ${dark})`, borderRight: side === "l" ? `3px solid ${c.accent}` : undefined, borderLeft: side === "r" ? `3px solid ${c.accent}` : undefined }} />
          ))}
          <div className="sc-valance absolute inset-x-0 top-0 h-[9%]" style={{ background: `linear-gradient(180deg, ${dark}, ${cover})`, borderBottom: `4px solid ${c.accent}`, borderRadius: "0 0 50% 50% / 0 0 100% 100%" }} />
        </div>
      );
    }

    case "silk":
      return (
        <div className="absolute inset-0">
          {(["l", "r"] as const).map((side) => (
            <div
              key={side}
              className={`sc-silk sc-silk-${side}`}
              style={{
                background: `repeating-linear-gradient(115deg, rgba(255,255,255,0.07) 0 2px, transparent 2px 22px), linear-gradient(${side === "l" ? "100deg" : "260deg"}, ${mix(cover, "#000000", 0.35)}, ${cover} 55%, ${mix(cover, "#ffffff", 0.12)})`,
                borderRight: side === "l" ? `4px solid ${c.accent}` : undefined,
                borderLeft: side === "r" ? `4px solid ${c.accent}` : undefined,
              }}
            >
              <div className="absolute inset-y-[4%] w-[10%]" style={{ [side === "l" ? "left" : "right"]: "4%", borderLeft: side === "l" ? `2px dashed ${c.accent}88` : undefined, borderRight: side === "r" ? `2px dashed ${c.accent}88` : undefined }} />
            </div>
          ))}
          <div className="sc-medallion absolute left-1/2 top-1/2 w-[clamp(80px,22vmin,190px)] -translate-x-1/2 -translate-y-1/2" style={{ filter: `drop-shadow(0 0 18px ${c.accent}cc)` }}>
            <UlziiKnot color={c.accent} />
          </div>
        </div>
      );

    case "balloons":
      return (
        <div className="absolute inset-0">
          <div className="sc-cover absolute inset-0" style={{ background: `linear-gradient(180deg, ${cover}, ${mix(cover, "#ffffff", 0.5)})` }} />
          {Array.from({ length: 16 }, (_, index) => (
            <Balloon
              key={index}
              color={scene.confetti[index % scene.confetti.length]}
              className="sc-balloon absolute"
              style={
                {
                  left: `${(seeded(index, 11) * 92 - 4).toFixed(1)}%`,
                  bottom: `${(seeded(index, 12) * 72 - 14).toFixed(1)}%`,
                  width: `clamp(${56 + (index % 3) * 14}px, ${9 + (index % 4) * 2}vmin, ${130 + (index % 3) * 24}px)`,
                  "--sc-delay": `${(index % 8) * 0.05}`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      );

    case "clouds":
      return (
        <div className="absolute inset-0">
          <div className="sc-cover absolute inset-0" style={{ background: `linear-gradient(180deg, ${cover}, ${mix(c.accent, "#ffffff", 0.7)})` }} />
          {Array.from({ length: 8 }, (_, index) => (
            <Cloud
              key={index}
              color="#ffffff"
              className={`absolute ${index % 2 ? "sc-cloud-r" : "sc-cloud-l"}`}
              style={{
                top: `${(index * 13 - 4).toFixed(0)}%`,
                [index % 2 ? "right" : "left"]: `${-8 + (index % 3) * 10}%`,
                width: `clamp(160px, ${34 + (index % 3) * 8}vmin, 420px)`,
                opacity: 0.95,
              }}
            />
          ))}
        </div>
      );

    case "bloom":
      return (
        <div className="absolute inset-0">
          <div className="sc-bloom-cover absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${mix(cover, "#ffffff", 0.4)}, ${cover})` }} />
          <div className="sc-bloom-ring absolute left-1/2 top-1/2">
            {Array.from({ length: 14 }, (_, index) => {
              const angle = (360 / 14) * index;
              return (
                <span key={index} className="sc-bloom-flower absolute" style={{ "--sc-a": `${angle}deg` } as CSSProperties}>
                  {index % 2 ? (
                    <Blossom color="#ffffff" accent={c.accent} className="w-[clamp(34px,8vmin,84px)]" />
                  ) : (
                    <Rose color={mix("#d98ea0", c.primary, 0.3)} className="w-[clamp(40px,10vmin,100px)]" />
                  )}
                </span>
              );
            })}
          </div>
        </div>
      );

    case "shutters":
    default:
      return (
        <div className="absolute inset-0 flex">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="sc-slat relative h-full flex-1"
              style={{
                background: `linear-gradient(180deg, ${mix(cover, "#ffffff", 0.06)}, ${mix(cover, "#000000", 0.2)})`,
                borderRight: `1px solid ${c.accent}55`,
                "--sc-i": index,
              } as CSSProperties}
            >
              <span className="absolute inset-x-0 bottom-[8%] mx-auto h-px w-1/2" style={{ background: c.accent }} />
            </div>
          ))}
        </div>
      );
  }
  void started;
}

export default function SceneOpening({
  scene,
  colors,
  tier,
  title,
  started,
  ready,
  onOpen,
  onSkip,
  embedded = false,
}: Props) {
  const cover = coverColor(scene, colors);
  const ink = readableOn(
    scene.opening === "doors"
      ? cover
      : scene.opening === "bloom" || scene.opening === "clouds" || scene.opening === "balloons"
        ? cover
        : cover
  );
  const duration = SCENE_OPENING_MS[tier];

  const rootStyle = {
    "--sc-dur": `${duration}ms`,
    "--sc-persp": tier === "luxury3d" ? "1100px" : "1900px",
    "--sc-angle": tier === "luxury3d" ? "112deg" : "96deg",
    color: ink,
  } as CSSProperties;

  const body: ReactNode = (
    <>
      <div className="sc-dolly absolute inset-0">
        <SceneBackdrop
          scene={scene}
          colors={colors}
          tier={tier}
          fixed={false}
          particleBoost={started ? 1.4 : 1}
        />
      </div>

      <div className="sc-flash pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${mix(colors.accent, "#ffffff", 0.8)}, transparent 62%)` }} />

      <div className="absolute inset-0" style={{ perspective: "var(--sc-persp)" }} onClick={ready && !started ? onOpen : undefined}>
        <Panels scene={scene} c={colors} started={started} />
      </div>

      <div className={`sc-center absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center ${started ? "sc-center-out" : ""}`} style={{ pointerEvents: started ? "none" : "auto" }}>
        <div
          className="rounded-[28px] px-7 py-6 backdrop-blur-[2px]"
          style={{
            background: `${mix(cover, ink === "#ffffff" ? "#000000" : "#ffffff", 0.0)}b3`,
            border: `1px solid ${colors.accent}88`,
            maxWidth: "min(88vw, 440px)",
            boxShadow: `0 18px 60px rgba(0,0,0,0.25)`,
          }}
        >
          <div className="text-4xl" aria-hidden>{scene.icon}</div>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.3em] opacity-75">
            {scene.label}
          </p>
          <div className="mx-auto my-3 h-px w-16" style={{ background: colors.accent }} />
          {title && (
            <h1 className="text-balance text-[clamp(1.5rem,6vw,2.1rem)] font-semibold leading-tight">
              {title}
            </h1>
          )}
          <button
            type="button"
            onClick={onOpen}
            disabled={!ready || started}
            className="mt-6 rounded-full px-8 py-3 text-sm font-semibold shadow-xl transition hover:scale-105 focus-visible:outline-2 active:scale-95 disabled:opacity-60"
            style={{
              background: colors.accent,
              color: readableOn(colors.accent),
            }}
          >
            {ready ? "Урилгаа нээх" : "Ачаалж байна..."}
          </button>
          <p className="mt-3 text-[11px] opacity-70">Товшоод нээнэ үү</p>
        </div>
      </div>

      {!started && (
        <button
          type="button"
          onClick={onSkip}
          disabled={!ready}
          className="absolute right-3 top-3 z-30 rounded-full bg-black/55 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/70 disabled:opacity-50"
          aria-label="Анимейшныг алгасах"
        >
          Алгасах ⏭
        </button>
      )}
    </>
  );

  return (
    <div
      role="dialog"
      aria-modal={!embedded}
      aria-label={title ? `${scene.label}: ${title}` : scene.label}
      data-started={started ? "true" : undefined}
      data-kind={scene.opening}
      data-tier={tier}
      className={`sc-open overflow-hidden ${embedded ? "absolute inset-0" : "fixed inset-0 z-[100]"}`}
      style={rootStyle}
    >
      {body}
    </div>
  );
}
