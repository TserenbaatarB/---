
"use client";

import type { CSSProperties, ReactNode } from "react";

import type { TierId } from "@/lib/invitationExtras";
import { SCENE_OPENING_MS } from "@/lib/invitationTemplates";
import type { SceneDef } from "@/lib/invitationTemplates";
import { mix, seeded } from "@/lib/sceneTheme";
import type { SceneColors } from "@/lib/sceneTheme";

import {
  Balloon,
  Blossom,
  Cloud,
  GradCap,
  Rose,
  UlziiKnot,
} from "./art";
import SceneBackdrop from "./SceneBackdrop";

type Props = {
  scene: SceneDef;
  colors: SceneColors;
  tier: Exclude<TierId, "classic">;
  title: string;
  started: boolean;
  ready: boolean;
  onOpen: () => void;
  onSkip: () => void;
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
      return mix(
        c.primary,
        "#000000",
        c.tone === "dark" ? 0.1 : 0.2
      );
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
      return c.tone === "dark"
        ? mix(c.primary, "#000000", 0.25)
        : mix(c.primary, "#000000", 0.05);
  }
}

function isRomantic(scene: SceneDef) {
  return (
    scene.opening === "bloom" ||
    scene.id === "anniversary" ||
    scene.id === "palace-wedding" ||
    scene.id === "mongol-wedding"
  );
}

function isLuxury(scene: SceneDef) {
  return (
    scene.opening === "silk" ||
    scene.opening === "doors" ||
    scene.opening === "book"
  );
}

function isRoyal(scene: SceneDef) {
  return (
    scene.opening === "curtain" ||
    scene.id === "adult-birthday"
  );
}

function isCosmic(scene: SceneDef) {
  return (
    scene.id.toLowerCase().includes("cosmic") ||
    scene.label.toLowerCase().includes("cosmic") ||
    scene.label.toLowerCase().includes("space")
  );
}

function Door({
  side,
  scene,
  c,
  cover,
}: {
  side: "l" | "r";
  scene: SceneDef;
  c: SceneColors;
  cover: string;
}) {
  const book = scene.opening === "book";
  const frame = c.accent;
  const edge = book
    ? mix(frame, "#ffffff", 0.2)
    : frame;

  return (
    <div className={`sc-door sc-door-${side}`}>
      <div
        className="absolute inset-0"
        style={{
          background: book
            ? `linear-gradient(${side === "l" ? "90deg" : "270deg"}, ${mix(cover, "#000000", 0.25)}, ${cover} 30%, ${mix(cover, "#ffffff", 0.08)})`
            : `linear-gradient(${side === "l" ? "90deg" : "270deg"}, ${mix(cover, "#000000", 0.12)}, ${cover} 18%, ${mix(cover, "#ffffff", 0.5)} 100%)`,
          borderRight:
            side === "l" ? `3px solid ${edge}` : undefined,
          borderLeft:
            side === "r" ? `3px solid ${edge}` : undefined,
          boxShadow: `inset 0 0 60px ${mix(frame, "#000000", 0.4)}55`,
        }}
      />

      <div
        className="absolute inset-[5%] rounded-t-[999px]"
        style={{
          border: `2px solid ${edge}`,
          [side === "l" ? "borderRight" : "borderLeft"]: "none",
        }}
      />

      <div
        className="absolute"
        style={{
          inset: "9% 9% 9% 9%",
          border: `1px solid ${edge}aa`,
          borderRadius: "999px 0 0 0",
          [side === "l" ? "borderRight" : "borderLeft"]: "none",
          ...(side === "r"
            ? { borderRadius: "0 999px 0 0" }
            : {}),
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
        <GradCap
          color={mix(cover, "#000000", 0.2)}
          accent={edge}
          className="absolute left-1/2 top-[14%] w-[46%] -translate-x-1/2 opacity-90"
          style={{ filter: `drop-shadow(0 0 8px ${edge}88)` }}
        />
      )}

      {!book && side === "l" && (
        <Rose
          color={mix("#c8566b", c.primary, 0.1)}
          className="absolute bottom-[8%] left-[8%] w-[34%] opacity-95"
        />
      )}

      {!book && side === "r" && (
        <Rose
          color={mix("#c8566b", c.primary, 0.1)}
          className="absolute bottom-[8%] right-[8%] w-[34%] opacity-95"
        />
      )}
    </div>
  );
}

function Panels({
  scene,
  c,
  started,
}: {
  scene: SceneDef;
  c: SceneColors;
  started: boolean;
}) {
  const cover = coverColor(scene, c);

  switch (scene.opening) {
    case "doors":
    case "book":
      return (
        <div className="sc-doors absolute inset-0">
          <div
            className="sc-spill absolute inset-y-0 left-1/2 w-[70%] -translate-x-1/2"
            style={{
              background: `radial-gradient(ellipse at center, ${mix(c.accent, "#ffffff", 0.7)}, ${c.glow}00 70%)`,
            }}
          />

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
            <div
              key={side}
              className={`sc-curtain sc-curtain-${side}`}
              style={{
                background: `${pleats}, linear-gradient(180deg, ${mix(cover, "#ffffff", 0.1)}, ${cover} 40%, ${dark})`,
                borderRight:
                  side === "l" ? `3px solid ${c.accent}` : undefined,
                borderLeft:
                  side === "r" ? `3px solid ${c.accent}` : undefined,
              }}
            />
          ))}

          <div
            className="sc-valance absolute inset-x-0 top-0 h-[9%]"
            style={{
              background: `linear-gradient(180deg, ${dark}, ${cover})`,
              borderBottom: `4px solid ${c.accent}`,
              borderRadius: "0 0 50% 50% / 0 0 100% 100%",
            }}
          />
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
                borderRight:
                  side === "l" ? `4px solid ${c.accent}` : undefined,
                borderLeft:
                  side === "r" ? `4px solid ${c.accent}` : undefined,
              }}
            >
              <div
                className="absolute inset-y-[4%] w-[10%]"
                style={{
                  [side === "l" ? "left" : "right"]: "4%",
                  borderLeft:
                    side === "l" ? `2px dashed ${c.accent}88` : undefined,
                  borderRight:
                    side === "r" ? `2px dashed ${c.accent}88` : undefined,
                }}
              />
            </div>
          ))}

          <div
            className="sc-medallion absolute left-1/2 top-1/2 w-[clamp(80px,22vmin,190px)] -translate-x-1/2 -translate-y-1/2"
            style={{ filter: `drop-shadow(0 0 18px ${c.accent}cc)` }}
          >
            <UlziiKnot color={c.accent} />
          </div>
        </div>
      );

    case "balloons":
      return (
        <div className="absolute inset-0">
          <div
            className="sc-cover absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${cover}, ${mix(cover, "#ffffff", 0.5)})`,
            }}
          />

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
          <div
            className="sc-cover absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${cover}, ${mix(c.accent, "#ffffff", 0.7)})`,
            }}
          />

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
          <div
            className="sc-bloom-cover absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${mix(cover, "#ffffff", 0.4)}, ${cover})`,
            }}
          />

          <div className="sc-bloom-ring absolute left-1/2 top-1/2">
            {Array.from({ length: 14 }, (_, index) => {
              const angle = (360 / 14) * index;

              return (
                <span
                  key={index}
                  className="sc-bloom-flower absolute"
                  style={{ "--sc-a": `${angle}deg` } as CSSProperties}
                >
                  {index % 2 ? (
                    <Blossom
                      color="#ffffff"
                      accent={c.accent}
                      className="w-[clamp(34px,8vmin,84px)]"
                    />
                  ) : (
                    <Rose
                      color={mix("#d98ea0", c.primary, 0.3)}
                      className="w-[clamp(40px,10vmin,100px)]"
                    />
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
              style={
                {
                  background: `linear-gradient(180deg, ${mix(cover, "#ffffff", 0.06)}, ${mix(cover, "#000000", 0.2)})`,
                  borderRight: `1px solid ${c.accent}55`,
                  "--sc-i": index,
                } as CSSProperties
              }
            >
              <span
                className="absolute inset-x-0 bottom-[8%] mx-auto h-px w-1/2"
                style={{ background: c.accent }}
              />
            </div>
          ))}
        </div>
      );
  }
  void started;
}

function SceneDecorations({
  scene,
  colors,
}: {
  scene: SceneDef;
  colors: SceneColors;
}) {
  const romantic = isRomantic(scene);
  const luxury = isLuxury(scene);
  const royal = isRoyal(scene);
  const cosmic = isCosmic(scene);

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {romantic && (
        <>
          <div
            className="absolute -left-16 top-10 h-56 w-56 rounded-full blur-3xl"
            style={{ background: `${colors.accent}35` }}
          />
          <div
            className="absolute -right-16 bottom-10 h-64 w-64 rounded-full blur-3xl"
            style={{ background: "#e8a8bd35" }}
          />
          {Array.from({ length: 18 }, (_, i) => (
            <span
              key={i}
              className="absolute text-2xl opacity-40"
              style={{
                left: `${seeded(i, 33) * 100}%`,
                top: `${seeded(i, 34) * 100}%`,
                color: i % 2 ? colors.accent : "#ffffff",
                transform: `rotate(${seeded(i, 35) * 360}deg)`,
              }}
            >
              {i % 3 === 0 ? "✿" : "✧"}
            </span>
          ))}
        </>
      )}

      {luxury && (
        <>
          <div
            className="absolute inset-5 rounded-[30px]"
            style={{
              border: `1px solid ${colors.accent}99`,
              boxShadow: `inset 0 0 35px ${colors.accent}20, 0 0 25px ${colors.accent}20`,
            }}
          />
          <div
            className="absolute inset-8 rounded-[24px]"
            style={{ border: `1px solid ${colors.accent}55` }}
          />
          <div
            className="absolute left-1/2 top-8 h-1 w-24 -translate-x-1/2 rounded-full"
            style={{ background: colors.accent, boxShadow: `0 0 18px ${colors.accent}` }}
          />
        </>
      )}

      {royal && (
        <>
          <div
            className="absolute inset-x-0 top-0 h-24"
            style={{
              background: `linear-gradient(180deg, ${colors.accent}55, transparent)`,
            }}
          />
          <div
            className="absolute inset-x-8 top-8 h-12 rounded-t-[50%]"
            style={{
              borderTop: `2px solid ${colors.accent}`,
              boxShadow: `0 -8px 24px ${colors.accent}25`,
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-24"
            style={{
              background: `linear-gradient(0deg, ${colors.accent}35, transparent)`,
            }}
          />
        </>
      )}

      {cosmic && (
        <>
          <div
            className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              border: `1px solid ${colors.accent}45`,
              boxShadow: `0 0 50px ${colors.glow}55, inset 0 0 45px ${colors.accent}20`,
            }}
          />
          {Array.from({ length: 90 }, (_, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${seeded(i, 41) * 100}%`,
                top: `${seeded(i, 42) * 100}%`,
                width: i % 9 === 0 ? 3 : 1.5,
                height: i % 9 === 0 ? 3 : 1.5,
                background: i % 4 === 0 ? colors.accent : "#ffffff",
                opacity: 0.25 + seeded(i, 43) * 0.65,
                boxShadow: `0 0 8px ${colors.accent}`,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

function OpeningCard({
  scene,
  colors,
  title,
  ready,
  started,
  onOpen,
}: {
  scene: SceneDef;
  colors: SceneColors;
  title: string;
  ready: boolean;
  started: boolean;
  onOpen: () => void;
}) {
  const romantic = isRomantic(scene);
  const luxury = isLuxury(scene);
  const royal = isRoyal(scene);
  const cosmic = isCosmic(scene);

  const dark = colors.tone === "dark" || royal || cosmic;
  const cardBackground = dark
    ? "rgba(9, 12, 24, 0.72)"
    : "rgba(255, 252, 246, 0.78)";
  const textColor = dark ? "#fffaf0" : "#332b2b";

  return (
    <div
      className={`relative w-full overflow-hidden px-7 py-9 text-center backdrop-blur-xl ${
        luxury ? "rounded-[30px]" : romantic ? "rounded-[42px]" : "rounded-[26px]"
      }`}
      style={{
        maxWidth: "min(88vw, 460px)",
        color: textColor,
        background: cardBackground,
        border: `1px solid ${colors.accent}${dark ? "aa" : "99"}`,
        boxShadow: `0 25px 90px rgba(0,0,0,0.28), 0 0 35px ${colors.accent}25`,
      }}
    >
      {luxury && (
        <div
          className="pointer-events-none absolute inset-3 rounded-[22px]"
          style={{ border: `1px solid ${colors.accent}55` }}
        />
      )}

      {romantic && (
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl"
          style={{ background: `${colors.accent}35` }}
        />
      )}

      {cosmic && (
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${colors.glow}55, transparent 65%)`,
          }}
        />
      )}

      <div className="relative z-10">
        <div
          className="mx-auto mb-4 flex h-[68px] w-[68px] items-center justify-center rounded-full text-4xl"
          style={{
            color: dark ? "#fff" : colors.accent,
            background: `${colors.accent}18`,
            border: `1px solid ${colors.accent}88`,
            boxShadow: `0 0 30px ${colors.accent}25`,
          }}
          aria-hidden
        >
          {scene.icon}
        </div>

        <p
          className="text-[10px] font-semibold uppercase tracking-[0.34em]"
          style={{ color: dark ? colors.accent : mix(colors.accent, "#000000", 0.15) }}
        >
          {scene.label}
        </p>

        <div className="mx-auto my-5 flex items-center justify-center gap-3">
          <span
            className="h-px w-10"
            style={{ background: colors.accent }}
          />
          <span
            className="text-xs"
            style={{ color: colors.accent }}
          >
            ✦
          </span>
          <span
            className="h-px w-10"
            style={{ background: colors.accent }}
          />
        </div>

        {title && (
          <h1
            className="text-balance text-[clamp(1.65rem,7vw,2.5rem)] font-semibold leading-tight"
            style={{
              fontFamily: romantic
                ? "Georgia, serif"
                : "inherit",
              textShadow: dark ? `0 2px 20px ${colors.accent}30` : "none",
            }}
          >
            {title}
          </h1>
        )}

        <p
          className="mt-4 text-xs tracking-[0.12em]"
          style={{ color: dark ? "#ffffffb8" : "#5f5555" }}
        >
          Таныг хүндэтгэлийн урилгад урьж байна
        </p>

        <button
          type="button"
          onClick={onOpen}
          disabled={!ready || started}
          className="group relative mt-7 inline-flex min-h-12 items-center justify-center gap-3 overflow-hidden rounded-full px-9 py-3.5 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 hover:scale-[1.035] active:scale-95 disabled:cursor-wait disabled:opacity-60"
          style={{
            color: readableOn(colors.accent),
            background: `linear-gradient(135deg, ${mix(colors.accent, "#ffffff", 0.18)}, ${colors.accent}, ${mix(colors.accent, "#000000", 0.12)})`,
            boxShadow: `0 8px 28px ${colors.accent}55, inset 0 1px 0 #ffffff66`,
          }}
        >
          <span
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
          />
          <span className="relative">
            {ready ? "Урилгаа нээх" : "Ачаалж байна..."}
          </span>
          <span className="relative text-base">✦</span>
        </button>

        <p
          className="mt-4 text-[10px] tracking-[0.15em]"
          style={{ color: dark ? "#ffffff99" : "#756a68" }}
        >
          {ready ? "ТОВШООД УРИЛГАА ҮЗНЭ ҮҮ" : "ТҮР ХҮЛЭЭНЭ ҮҮ"}
        </p>
      </div>

      {royal && (
        <>
          <span
            className="absolute left-4 top-4 text-lg"
            style={{ color: colors.accent }}
          >
            ❖
          </span>
          <span
            className="absolute right-4 top-4 text-lg"
            style={{ color: colors.accent }}
          >
            ❖
          </span>
          <span
            className="absolute bottom-4 left-4 text-lg"
            style={{ color: colors.accent }}
          >
            ❖
          </span>
          <span
            className="absolute bottom-4 right-4 text-lg"
            style={{ color: colors.accent }}
          >
            ❖
          </span>
        </>
      )}
    </div>
  );
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
  const duration = SCENE_OPENING_MS[tier];

  const rootStyle = {
    "--sc-dur": `${duration}ms`,
    "--sc-persp": tier === "luxury3d" ? "1100px" : "1900px",
    "--sc-angle": tier === "luxury3d" ? "112deg" : "96deg",
    color: readableOn(cover),
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

      <div
        className="sc-flash pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${mix(colors.accent, "#ffffff", 0.8)}, transparent 62%)`,
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${mix(cover, "#000000", 0.08)}, ${cover} 50%, ${mix(cover, "#000000", 0.18)})`,
        }}
      />

      <div
        className="absolute inset-0"
        style={{ perspective: "var(--sc-persp)" }}
        onClick={ready && !started ? onOpen : undefined}
      >
        <Panels scene={scene} c={colors} started={started} />
      </div>

      <SceneDecorations scene={scene} colors={colors} />

      <div
        className={`sc-center absolute inset-0 z-20 flex flex-col items-center justify-center px-6 py-10 text-center ${
          started ? "sc-center-out" : ""
        }`}
        style={{ pointerEvents: started ? "none" : "auto" }}
      >
        <OpeningCard
          scene={scene}
          colors={colors}
          title={title}
          ready={ready}
          started={started}
          onOpen={onOpen}
        />
      </div>

      {!started && (
        <button
          type="button"
          onClick={onSkip}
          disabled={!ready}
          className="absolute right-4 top-4 z-30 rounded-full border border-white/30 bg-black/45 px-4 py-2.5 text-xs font-semibold text-white shadow-lg backdrop-blur-xl transition hover:bg-black/65 disabled:opacity-50"
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
      className={`sc-open overflow-hidden ${
        embedded ? "absolute inset-0" : "fixed inset-0 z-[100]"
      }`}
      style={rootStyle}
    >
      {body}
    </div>
  );
}
