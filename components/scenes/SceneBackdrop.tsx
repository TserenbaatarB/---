"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

import type { TierId } from "@/lib/invitationExtras";
import type { SceneDef } from "@/lib/invitationTemplates";
import { mix } from "@/lib/sceneTheme";
import type { SceneColors } from "@/lib/sceneTheme";

import {
  Balloon,
  Blossom,
  Branch,
  Bunting,
  Chandelier,
  Cloud,
  GradCap,
  HornScroll,
  Leaf,
  Moon,
  Rings,
  Rose,
  Scroll,
  Sparkle,
  Star5,
  Teddy,
  Toono,
  UlziiKnot,
} from "./art";
import { useFinePointer } from "./hooks";
import SceneParticles from "./SceneParticles";

type Ctx = {
  c: SceneColors;
  scene: SceneDef;
  tier: TierId;
  /* Decorations may move (premium and luxury only). */
  live: boolean;
};

/* Positioned decoration. Depth drives the Luxury 3D parallax. */
function A({
  ctx,
  depth = 0,
  s,
  anim,
  children,
}: {
  ctx: Ctx;
  depth?: number;
  s: CSSProperties;
  anim?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="sc-art absolute"
      style={
        {
          ...s,
          "--d": ctx.tier === "luxury3d" ? depth : 0,
        } as CSSProperties
      }
    >
      <div className={ctx.live ? anim : undefined}>{children}</div>
    </div>
  );
}

const size = (min: number, vw: number, max: number) =>
  `clamp(${min}px, ${vw}cqmin, ${max}px)`;

function RoseCluster({
  ctx,
  color,
  leaf = "#6f8f68",
  width,
  flip,
  tint,
}: {
  ctx: Ctx;
  color: string;
  leaf?: string;
  width: string;
  flip?: boolean;
  tint?: string;
}) {
  const roses = [
    { left: "4%", top: "40%", w: "46%", c: color },
    { left: "40%", top: "10%", w: "40%", c: tint ?? mix(color, "#ffffff", 0.35) },
    { left: "46%", top: "52%", w: "38%", c: color },
    { left: "-2%", top: "8%", w: "30%", c: tint ?? mix(color, "#ffffff", 0.35) },
  ];

  return (
    <div
      className="relative"
      style={{
        width,
        aspectRatio: "1",
        transform: flip ? "scaleX(-1)" : undefined,
      }}
    >
      <Branch color={leaf} className="absolute -left-[6%] top-[30%] w-[85%] rotate-[-18deg]" />
      <Branch color={leaf} className="absolute left-[12%] top-[62%] w-[80%] rotate-[8deg]" />
      {roses.map((rose, index) => (
        <Rose
          key={index}
          color={rose.c}
          className="absolute"
          style={{ left: rose.left, top: rose.top, width: rose.w, aspectRatio: "1" }}
        />
      ))}
      <Blossom
        color="#ffffff"
        accent={ctx.c.accent}
        className="absolute"
        style={{ left: "68%", top: "30%", width: "16%", aspectRatio: "1" }}
      />
    </div>
  );
}

function StringLights({ ctx, count = 14, top = "0" }: { ctx: Ctx; count?: number; top?: string }) {
  return (
    <div className="absolute inset-x-0" style={{ top, height: size(40, 14, 110) }}>
      <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
        <path d="M0 4Q100 52 200 6T400 4" fill="none" stroke={ctx.c.accent} strokeOpacity="0.6" strokeWidth="1.2" />
      </svg>
      {Array.from({ length: count }, (_, index) => {
        const t = (index + 0.5) / count;
        const y = 4 + Math.sin(t * Math.PI * 2 * 1.0) * 0 + 22 * Math.sin(t * Math.PI * 2 + 0.3) ** 2;
        return (
          <span
            key={index}
            className={`absolute block rounded-full ${ctx.live ? "sc-bulb" : ""}`}
            style={{
              left: `${t * 100}%`,
              top: `${(y / 60) * 100}%`,
              width: 7,
              height: 7,
              background: ctx.c.glow,
              boxShadow: `0 0 10px 3px ${ctx.c.accent}aa`,
              animationDelay: `${(index % 5) * 0.4}s`,
            }}
          />
        );
      })}
    </div>
  );
}

function UlziiBand({ color, position }: { color: string; position: "top" | "bottom" }) {
  return (
    <div
      className="absolute inset-x-0"
      style={{
        [position]: 0,
        height: size(26, 7, 56),
        background: `linear-gradient(${position === "top" ? "180deg" : "0deg"}, ${mix(color, "#000000", 0.15)}, ${color})`,
        borderBottom: position === "top" ? `2px solid ${mix(color, "#ffffff", 0.4)}` : undefined,
        borderTop: position === "bottom" ? `2px solid ${mix(color, "#ffffff", 0.4)}` : undefined,
      }}
    >
      <svg width="100%" height="100%" aria-hidden>
        <defs>
          <pattern id="sc-ulzii" width="28" height="28" patternUnits="userSpaceOnUse">
            <path
              d="M4 24V4h20v16H10V10h8"
              fill="none"
              stroke="#5a0f14"
              strokeOpacity="0.7"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sc-ulzii)" />
      </svg>
    </div>
  );
}

function Background({ ctx }: { ctx: Ctx }) {
  const { c, scene } = ctx;
  let background: string;

  switch (scene.id) {
    case "palace-wedding":
      background = `radial-gradient(ellipse at 50% 28%, ${mix(c.accent, "#ffffff", 0.75)}cc 0%, transparent 58%), linear-gradient(180deg, ${c.bg1} 0%, ${c.bg2} 100%)`;
      break;
    case "mongol-wedding":
      background = `radial-gradient(ellipse at 50% 40%, ${mix(c.primary, "#ffffff", 0.08)} 0%, transparent 70%), linear-gradient(160deg, ${c.bg1} 0%, ${c.bg2} 100%)`;
      break;
    case "kids-birthday":
      background = `linear-gradient(180deg, ${mix(c.primary, "#ffffff", 0.5)} 0%, ${c.bg1} 62%, #e3f5d8 100%)`;
      break;
    case "adult-birthday":
      background = `radial-gradient(ellipse at 50% -10%, ${mix(c.accent, "#000000", 0.55)} 0%, transparent 62%), linear-gradient(180deg, ${c.bg1}, ${c.bg2})`;
      break;
    case "graduation":
      background = `radial-gradient(circle at 50% 38%, ${mix(c.primary, "#ffffff", 0.12)} 0%, transparent 60%), linear-gradient(165deg, ${c.bg1}, ${c.bg2})`;
      break;
    case "corporate":
      background = `linear-gradient(165deg, ${c.bg1} 0%, ${c.bg2} 100%)`;
      break;
    default:
      background = `radial-gradient(ellipse at 50% 20%, ${c.glow}66 0%, transparent 60%), linear-gradient(180deg, ${c.bg1} 0%, ${c.bg2} 100%)`;
  }

  return <div className="absolute inset-0" style={{ background }} />;
}

function Decor({ ctx }: { ctx: Ctx }) {
  const { c, scene } = ctx;
  const gold = c.accent;

  switch (scene.id) {
    case "palace-wedding":
      return (
        <>
          <A ctx={ctx} depth={-4} s={{ inset: 0 }}>
            <div
              className={`absolute inset-0 ${ctx.live ? "sc-rays" : ""}`}
              style={{
                background: `conic-gradient(from 180deg at 50% -4%, transparent 0deg, ${mix(gold, "#ffffff", 0.7)}55 8deg, transparent 18deg, ${mix(gold, "#ffffff", 0.7)}40 30deg, transparent 42deg, ${mix(gold, "#ffffff", 0.7)}40 318deg, transparent 330deg, ${mix(gold, "#ffffff", 0.7)}55 352deg, transparent 360deg)`,
              }}
            />
          </A>
          {[0, 1].map((side) => (
            <A
              key={side}
              ctx={ctx}
              depth={6}
              s={{ top: 0, bottom: 0, [side ? "right" : "left"]: "1.5cqw", width: size(30, 7, 70) }}
            >
              <div
                className="h-full w-full"
                style={{
                  background: `repeating-linear-gradient(90deg, ${mix(gold, "#ffffff", 0.2)}66 0 2px, transparent 2px 9px), linear-gradient(90deg, ${gold}55, #ffffffaa 45%, ${gold}66)`,
                  borderTop: `10px solid ${gold}`,
                  boxShadow: `0 0 40px ${gold}33`,
                }}
              />
            </A>
          ))}
          <A ctx={ctx} depth={3} s={{ left: 0, right: 0, top: 0 }}>
            <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMin slice" className="w-full" aria-hidden>
              <path d="M10 220V110Q200 -50 390 110V220" fill="none" stroke={gold} strokeOpacity="0.8" strokeWidth="2.4" />
              <path d="M34 220V118Q200 -20 366 118V220" fill="none" stroke={gold} strokeOpacity="0.45" strokeWidth="1.2" />
            </svg>
          </A>
          <A ctx={ctx} depth={10} anim="sc-bob" s={{ left: "50%", top: 0, marginLeft: "calc(clamp(70px, 11cqmin, 130px) * -1)", width: size(140, 22, 260) }}>
            <div
              style={{
                filter: `drop-shadow(0 8px 24px ${gold}aa)`,
              }}
            >
              <Chandelier color={gold} />
            </div>
          </A>
          <A ctx={ctx} depth={14} s={{ left: "-3cqmin", bottom: "-3cqmin" }}>
            <RoseCluster ctx={ctx} color={mix("#c8566b", c.primary, 0.12)} width={size(150, 50, 360)} />
          </A>
          <A ctx={ctx} depth={14} s={{ right: "-3cqmin", bottom: "-3cqmin" }}>
            <RoseCluster ctx={ctx} color={mix("#c8566b", c.primary, 0.12)} width={size(150, 50, 360)} flip />
          </A>
          <A ctx={ctx} depth={8} s={{ left: "-6cqmin", top: "-4cqmin", transform: "rotate(180deg)" }}>
            <RoseCluster ctx={ctx} color="#f2d4d9" tint="#ffffff" width={size(90, 26, 200)} />
          </A>
          <A ctx={ctx} depth={8} s={{ right: "-6cqmin", top: "-4cqmin", transform: "rotate(180deg)" }}>
            <RoseCluster ctx={ctx} color="#f2d4d9" tint="#ffffff" width={size(90, 26, 200)} flip />
          </A>
          <div
            className="absolute inset-x-0 bottom-0"
            style={{ height: "22%", background: `linear-gradient(0deg, ${gold}33, transparent)` }}
          />
        </>
      );

    case "mongol-wedding":
      return (
        <>
          <A ctx={ctx} depth={-6} anim="sc-spin-slow" s={{ left: "50%", top: "46%", width: size(280, 120, 900), marginLeft: "calc(clamp(280px, 120cqmin, 900px) / -2)", marginTop: "calc(clamp(280px, 120cqmin, 900px) / -2)", opacity: 0.13 }}>
            <Toono color={gold} />
          </A>
          <div
            className={`absolute inset-0 ${ctx.live ? "sc-sheen" : ""}`}
            style={{
              background: `repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 26px), linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)`,
              backgroundSize: "auto, 200% 100%",
            }}
          />
          <UlziiBand color={gold} position="top" />
          <UlziiBand color={gold} position="bottom" />
          {[
            { s: { left: "2cqmin", top: size(30, 8, 64) }, r: 0 },
            { s: { right: "2cqmin", top: size(30, 8, 64) }, r: 90 },
            { s: { left: "2cqmin", bottom: size(30, 8, 64) }, r: 270 },
            { s: { right: "2cqmin", bottom: size(30, 8, 64) }, r: 180 },
          ].map((corner, index) => (
            <A key={index} ctx={ctx} depth={8} s={{ ...corner.s, width: size(54, 16, 130) } as CSSProperties}>
              <div style={{ transform: `rotate(${corner.r}deg)` }}>
                <HornScroll color={gold} />
              </div>
            </A>
          ))}
          <A ctx={ctx} depth={12} anim="sc-bob" s={{ left: "50%", top: size(36, 9, 70), width: size(50, 14, 110), marginLeft: "calc(clamp(50px, 14cqmin, 110px) / -2)" }}>
            <div style={{ filter: `drop-shadow(0 0 12px ${gold}99)` }}>
              <UlziiKnot color={gold} />
            </div>
          </A>
        </>
      );

    case "kids-birthday":
      return (
        <>
          <A ctx={ctx} depth={-4} s={{ right: "6cqmin", top: "9cqmin", width: size(60, 18, 130) }}>
            <div className={ctx.live ? "sc-spin-slow" : undefined} style={{ position: "relative", aspectRatio: "1" }}>
              <div className="absolute inset-[18%] rounded-full" style={{ background: "#ffd54a", boxShadow: "0 0 40px #ffd54acc" }} />
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} className="absolute left-1/2 top-0 h-[16%] w-[5%] -translate-x-1/2 rounded-full" style={{ background: "#ffd54a", transformOrigin: "50% 310%", transform: `translateX(-50%) rotate(${i * 30}deg)` }} />
              ))}
            </div>
          </A>
          {[
            { left: "-8%", top: "16%", w: 30, d: 4 },
            { left: "58%", top: "30%", w: 24, d: 6 },
            { left: "12%", top: "52%", w: 20, d: 8 },
          ].map((cloud, index) => (
            <A key={index} ctx={ctx} depth={cloud.d} anim="sc-cloud" s={{ left: cloud.left, top: cloud.top, width: size(80, cloud.w, 260) }}>
              <Cloud />
            </A>
          ))}
          <A ctx={ctx} depth={3} s={{ left: 0, right: 0, top: 0 }}>
            <Bunting colors={scene.confetti} className="h-[clamp(36px,9cqmin,84px)] w-full" />
          </A>
          <A ctx={ctx} depth={12} s={{ left: 0, right: 0, bottom: 0 }}>
            <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="block h-[clamp(60px,16cqmin,150px)] w-full" aria-hidden>
              <path d="M0 40Q80 0 170 36T400 24V100H0z" fill="#9fd88a" />
              <path d="M0 64Q120 30 240 60T400 50V100H0z" fill="#7cc46b" />
            </svg>
          </A>
          {[
            { side: "left", colors: [0, 1, 2] },
            { side: "right", colors: [3, 4, 0] },
          ].map((group) => (
            <A key={group.side} ctx={ctx} depth={16} s={{ [group.side]: "1cqmin", bottom: "7cqmin", width: size(100, 30, 240) }}>
              <div className="relative" style={{ aspectRatio: "1.1" }}>
                {group.colors.map((colorIndex, index) => (
                  <Balloon
                    key={index}
                    color={scene.confetti[colorIndex % scene.confetti.length]}
                    className={`absolute ${ctx.live ? "sc-sway" : ""}`}
                    style={{ left: `${index * 28}%`, bottom: `${(index % 2) * 18}%`, width: "36%", animationDelay: `${index * 0.6}s` }}
                  />
                ))}
              </div>
            </A>
          ))}
        </>
      );

    case "first-birthday":
      return (
        <>
          <div className="absolute inset-0 opacity-60" style={{ backgroundImage: `radial-gradient(${c.accent}55 1.4px, transparent 1.6px)`, backgroundSize: "26px 26px" }} />
          <A ctx={ctx} depth={4} anim="sc-bob" s={{ left: "7cqmin", top: "14cqmin", width: size(40, 12, 90) }}>
            <Moon />
          </A>
          {[
            { left: "58%", top: "10%", w: 26, d: 6 },
            { left: "-6%", top: "46%", w: 24, d: 8 },
          ].map((cloud, index) => (
            <A key={index} ctx={ctx} depth={cloud.d} anim="sc-cloud" s={{ left: cloud.left, top: cloud.top, width: size(70, cloud.w, 220) }}>
              <Cloud color="#ffffff" />
            </A>
          ))}
          <A ctx={ctx} depth={3} s={{ left: 0, right: 0, top: 0 }}>
            <Bunting colors={["#f4b6c2", "#fbe4a6", "#bfdcf2", "#c9e4c5"]} className="h-[clamp(34px,8cqmin,76px)] w-full" />
          </A>
          <A ctx={ctx} depth={14} anim="sc-bob" s={{ left: "1cqmin", bottom: "1cqmin", width: size(100, 34, 250) }}>
            <Teddy color={mix(c.primary, "#ffffff", 0.05)} />
          </A>
          <A ctx={ctx} depth={14} anim="sc-bob" s={{ right: "1cqmin", bottom: "1cqmin", width: size(100, 34, 250), transform: "scaleX(-1)" }}>
            <Teddy color={mix(c.accent, "#ffffff", 0.4)} />
          </A>
        </>
      );

    case "adult-birthday":
      return (
        <>
          {[-26, 0, 26].map((angle, index) => (
            <A key={angle} ctx={ctx} depth={-3 + index} s={{ left: "50%", top: "-2%", width: "46cqw", height: "125%", marginLeft: "-23cqw", transformOrigin: "50% 0" }}>
              <div
                className={ctx.live ? "sc-sweep" : undefined}
                style={{
                  width: "100%",
                  height: "100%",
                  transformOrigin: "50% 0",
                  transform: `rotate(${angle}deg)`,
                  animationDelay: `${index * -2.2}s`,
                  clipPath: "polygon(46% 0, 54% 0, 100% 100%, 0 100%)",
                  background: `linear-gradient(180deg, ${mix(gold, "#ffffff", 0.4)}77, transparent 78%)`,
                }}
              />
            </A>
          ))}
          <StringLights ctx={ctx} />
          {[
            { left: "8%", top: "58%", w: 26 },
            { left: "70%", top: "66%", w: 34 },
            { left: "40%", top: "80%", w: 22 },
          ].map((dot, index) => (
            <A key={index} ctx={ctx} depth={10 + index * 3} s={{ left: dot.left, top: dot.top, width: size(60, dot.w, 220) }}>
              <div className={ctx.live ? "sc-bob" : undefined} style={{ aspectRatio: "1", borderRadius: "50%", background: `radial-gradient(${gold}66, transparent 68%)`, filter: "blur(3px)" }} />
            </A>
          ))}
          <A ctx={ctx} depth={12} anim="sc-twinkle-slow" s={{ right: "9cqmin", top: "26cqmin", width: size(30, 9, 70) }}>
            <Sparkle color={gold} />
          </A>
          <A ctx={ctx} depth={9} anim="sc-twinkle-slow" s={{ left: "10cqmin", top: "36cqmin", width: size(22, 6, 50) }}>
            <Sparkle color={mix(gold, "#ffffff", 0.5)} />
          </A>
        </>
      );

    case "graduation":
      return (
        <>
          <A ctx={ctx} depth={-4} s={{ left: "50%", top: "40%", width: size(300, 120, 860), marginLeft: "calc(clamp(300px, 120cqmin, 860px) / -2)", marginTop: "calc(clamp(300px, 120cqmin, 860px) / -2)" }}>
            <svg viewBox="0 0 200 200" aria-hidden className="w-full">
              {[96, 80, 62].map((r, i) => (
                <circle key={r} cx="100" cy="100" r={r} fill="none" stroke={gold} strokeOpacity={0.22 - i * 0.05} strokeWidth="0.8" />
              ))}
            </svg>
          </A>
          <div className="absolute inset-0 opacity-70" style={{ backgroundImage: `repeating-linear-gradient(135deg, ${gold}1f 0 1px, transparent 1px 24px)` }} />
          <A ctx={ctx} depth={10} anim="sc-bob" s={{ left: "6cqmin", top: "8cqmin", width: size(56, 17, 130), transform: "rotate(-14deg)" }}>
            <GradCap color={mix(c.primary, "#000000", 0.4)} accent={gold} />
          </A>
          <A ctx={ctx} depth={8} anim="sc-bob" s={{ right: "7cqmin", top: "14cqmin", width: size(44, 13, 100), transform: "rotate(16deg)" }}>
            <GradCap color={mix(c.primary, "#000000", 0.4)} accent={gold} />
          </A>
          <A ctx={ctx} depth={14} s={{ left: "-4cqmin", bottom: "-2cqmin", width: size(150, 52, 380), transform: "rotate(-18deg)" }}>
            <Branch color={gold} accent={gold} />
          </A>
          <A ctx={ctx} depth={14} s={{ right: "-4cqmin", bottom: "-2cqmin", width: size(150, 52, 380), transform: "scaleX(-1) rotate(-18deg)" }}>
            <Branch color={gold} accent={gold} />
          </A>
          <A ctx={ctx} depth={12} s={{ left: "50%", bottom: "5cqmin", width: size(90, 28, 220), marginLeft: "calc(clamp(90px, 28cqmin, 220px) / -2)" }}>
            <Scroll />
          </A>
          {[{ l: "22%", t: "30%" }, { l: "76%", t: "42%" }, { l: "14%", t: "62%" }].map((pos, index) => (
            <A key={index} ctx={ctx} depth={6} anim="sc-twinkle-slow" s={{ left: pos.l, top: pos.t, width: size(12, 3.5, 26) }}>
              <Star5 color={gold} />
            </A>
          ))}
        </>
      );

    case "engagement":
      return (
        <>
          <A ctx={ctx} depth={12} s={{ left: "-6cqmin", top: "-6cqmin", transform: "rotate(160deg)" }}>
            <RoseCluster ctx={ctx} color={c.primary} leaf="#83a07b" width={size(150, 56, 380)} flip />
          </A>
          <A ctx={ctx} depth={14} s={{ right: "-6cqmin", bottom: "-6cqmin" }}>
            <RoseCluster ctx={ctx} color={c.primary} leaf="#83a07b" width={size(160, 60, 400)} />
          </A>
          <A ctx={ctx} depth={8} anim="sc-bob" s={{ right: "10cqmin", top: "12cqmin", width: size(64, 20, 150) }}>
            <div style={{ filter: `drop-shadow(0 0 14px ${gold}88)` }}>
              <Rings color={gold} />
            </div>
          </A>
          {[{ l: "78%", t: "10%", w: 6 }, { l: "9%", t: "52%", w: 5 }, { l: "86%", t: "42%", w: 4 }].map((spark, index) => (
            <A key={index} ctx={ctx} depth={6} anim="sc-twinkle-slow" s={{ left: spark.l, top: spark.t, width: size(12, spark.w, 36) }}>
              <Sparkle color={gold} />
            </A>
          ))}
        </>
      );

    case "baby-shower":
      return (
        <>
          <A ctx={ctx} depth={2} s={{ left: "50%", top: "-4cqmin", width: size(260, 88, 640), marginLeft: "calc(clamp(260px, 88cqmin, 640px) / -2)" }}>
            <div className="relative" style={{ aspectRatio: "2 / 1" }}>
              {[100, 80, 60, 40].map((w, index) => (
                <div
                  key={w}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2"
                  style={{
                    width: `${w}%`,
                    height: `${w}%`,
                    borderRadius: "999px 999px 0 0",
                    background: [mix(c.primary, "#ffffff", 0.55), mix(c.accent, "#ffffff", 0.6), mix("#f4c2cf", "#ffffff", 0.3), mix("#bfdcf2", "#ffffff", 0.2)][index],
                    opacity: 0.85,
                  }}
                />
              ))}
            </div>
          </A>
          {[{ l: "6%", h: 14 }, { l: "80%", h: 18 }].map((hang, index) => (
            <A key={index} ctx={ctx} depth={8} anim="sc-bob" s={{ left: hang.l, top: 0, width: size(54, 15, 120) }}>
              <div style={{ height: `${hang.h}cqmin`, borderLeft: `1.5px dashed ${c.accent}88`, marginLeft: "50%" }} />
              <Cloud color="#ffffff" style={{ marginTop: -4 }} />
            </A>
          ))}
          <A ctx={ctx} depth={6} s={{ right: "9cqmin", top: "26cqmin", width: size(30, 9, 70) }}>
            <Moon color="#fbe4a6" />
          </A>
          <A ctx={ctx} depth={14} s={{ left: "-5cqmin", bottom: "-3cqmin", width: size(130, 46, 330), transform: "rotate(-20deg)" }}>
            <Branch color="#7d9a76" accent={c.accent} />
          </A>
          <A ctx={ctx} depth={14} s={{ right: "-5cqmin", bottom: "-3cqmin", width: size(130, 46, 330), transform: "scaleX(-1) rotate(-20deg)" }}>
            <Branch color="#8fae88" accent={c.accent} />
          </A>
          {[{ l: "16%", b: "11%", r: -20 }, { l: "76%", b: "13%", r: 25 }].map((leaf, index) => (
            <A key={index} ctx={ctx} depth={10} anim="sc-sway" s={{ left: leaf.l, bottom: leaf.b, width: size(18, 5, 40), transform: `rotate(${leaf.r}deg)` }}>
              <Leaf color="#9bb892" />
            </A>
          ))}
        </>
      );

    case "corporate":
      return (
        <>
          <div className="absolute inset-0 opacity-50" style={{ backgroundImage: `linear-gradient(${gold}22 1px, transparent 1px), linear-gradient(90deg, ${gold}22 1px, transparent 1px)`, backgroundSize: "52px 52px" }} />
          <A ctx={ctx} depth={6} anim="sc-bob" s={{ right: "-14cqmin", top: "-14cqmin", width: size(200, 70, 520) }}>
            <div style={{ aspectRatio: "1", background: `linear-gradient(135deg, ${gold}55, transparent 70%)`, clipPath: "polygon(100% 0, 100% 100%, 0 0)" }} />
          </A>
          <A ctx={ctx} depth={10} s={{ left: "-16cqmin", bottom: "-16cqmin", width: size(220, 76, 560) }}>
            <div style={{ aspectRatio: "1", border: `1.5px solid ${gold}66`, borderRadius: "50%" }}>
              <div style={{ margin: "12%", height: "76%", border: `1px solid ${gold}44`, borderRadius: "50%" }} />
            </div>
          </A>
          <A ctx={ctx} depth={12} s={{ left: 0, top: "18%", width: 5, height: "22%" }}>
            <div className="h-full w-full" style={{ background: gold }} />
          </A>
          <A ctx={ctx} depth={8} s={{ right: 0, bottom: "14%", width: "34%", height: 3 }}>
            <div className="h-full w-full" style={{ background: `linear-gradient(90deg, transparent, ${gold})` }} />
          </A>
        </>
      );

    case "anniversary":
      return (
        <>
          <A ctx={ctx} depth={8} anim="sc-bob" s={{ left: "50%", top: "8cqmin", width: size(80, 26, 180), marginLeft: "calc(clamp(80px, 26cqmin, 180px) / -2)" }}>
            <div style={{ filter: `drop-shadow(0 0 16px ${c.glow})` }}>
              <Rings color={mix(c.primary, "#e8c987", 0.5)} />
            </div>
          </A>
          <A ctx={ctx} depth={14} s={{ left: "-5cqmin", bottom: "-5cqmin" }}>
            <RoseCluster ctx={ctx} color={mix(c.accent, "#000000", 0.05)} tint={mix(c.accent, "#ffffff", 0.45)} width={size(150, 52, 360)} />
          </A>
          <A ctx={ctx} depth={14} s={{ right: "-5cqmin", bottom: "-5cqmin" }}>
            <RoseCluster ctx={ctx} color={mix(c.accent, "#000000", 0.05)} tint={mix(c.accent, "#ffffff", 0.45)} width={size(150, 52, 360)} flip />
          </A>
          {[{ l: "10%", t: "34%", w: 30 }, { l: "72%", t: "46%", w: 36 }].map((glow, index) => (
            <A key={index} ctx={ctx} depth={6} s={{ left: glow.l, top: glow.t, width: size(60, glow.w, 240) }}>
              <div className={ctx.live ? "sc-bob" : undefined} style={{ aspectRatio: "1", borderRadius: "50%", background: `radial-gradient(${c.glow}88, transparent 66%)` }} />
            </A>
          ))}
        </>
      );

    case "housewarming":
      return (
        <>
          <StringLights ctx={ctx} count={12} />
          <A ctx={ctx} depth={12} s={{ left: "50%", bottom: "4cqmin", width: size(140, 44, 340), marginLeft: "calc(clamp(140px, 44cqmin, 340px) / -2)" }}>
            <svg viewBox="0 0 200 150" aria-hidden className="w-full">
              <path d="M20 140V70L100 14l80 56v70z" fill="none" stroke={c.primary} strokeWidth="3" strokeLinejoin="round" />
              <path d="M8 74L100 6l92 68" fill="none" stroke={c.accent} strokeWidth="3" strokeLinecap="round" />
              <rect x="84" y="90" width="32" height="50" rx="4" fill={c.accent} fillOpacity="0.4" stroke={c.primary} strokeWidth="2" />
              <rect x="38" y="84" width="28" height="28" fill="#ffe9a8" stroke={c.primary} strokeWidth="2" className={ctx.live ? "sc-flame" : undefined} />
              <rect x="134" y="84" width="28" height="28" fill="#ffe9a8" stroke={c.primary} strokeWidth="2" className={ctx.live ? "sc-flame" : undefined} />
            </svg>
          </A>
          <A ctx={ctx} depth={14} s={{ left: "-5cqmin", bottom: "-3cqmin", width: size(130, 46, 330), transform: "rotate(-20deg)" }}>
            <Branch color={c.accent} accent={c.primary} />
          </A>
          <A ctx={ctx} depth={14} s={{ right: "-5cqmin", bottom: "-3cqmin", width: size(130, 46, 330), transform: "scaleX(-1) rotate(-20deg)" }}>
            <Branch color={c.accent} accent={c.primary} />
          </A>
        </>
      );

    default:
      return (
        <>
          {scene.confetti.map((color, index) => (
            <A key={index} ctx={ctx} depth={6 + index * 3} anim="sc-bob" s={{ left: `${10 + index * 22}%`, top: `${10 + (index % 2) * 56}%`, width: size(16, 5 + index, 44) }}>
              <div style={{ aspectRatio: "1", borderRadius: index % 2 ? "50%" : "18%", background: color, opacity: 0.55, transform: `rotate(${index * 30}deg)` }} />
            </A>
          ))}
          {[0, 1].map((side) => (
            <A key={side} ctx={ctx} depth={14} s={{ [side ? "right" : "left"]: "2cqmin", bottom: "6cqmin", width: size(40, 12, 90) }}>
              <Balloon color={scene.confetti[side]} className={ctx.live ? "sc-sway" : undefined} />
            </A>
          ))}
          <A ctx={ctx} depth={10} anim="sc-twinkle-slow" s={{ right: "12cqmin", top: "14cqmin", width: size(26, 8, 60) }}>
            <Sparkle color={c.accent} />
          </A>
        </>
      );
  }
}

/* Tracks the mouse and scroll to drive the Luxury 3D parallax. */
function useParallax(
  ref: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
  fine: boolean
) {
  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return;

    let frame = 0;
    let px = 0;
    let py = 0;
    let sy = 0;

    const apply = () => {
      frame = 0;
      node.style.setProperty("--px", px.toFixed(3));
      node.style.setProperty("--py", py.toFixed(3));
      node.style.setProperty("--sy", sy.toFixed(3));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onMove = (event: PointerEvent) => {
      px = (event.clientX / window.innerWidth - 0.5) * -2;
      py = (event.clientY / window.innerHeight - 0.5) * -2;
      schedule();
    };
    const onScroll = () => {
      sy = Math.max(-1.5, Math.min(1.5, window.scrollY / -500));
      schedule();
    };

    if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (fine) window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref, enabled, fine]);
}

export default function SceneBackdrop({
  scene,
  colors,
  tier,
  withBackground = true,
  fixed = true,
  animated = true,
  particleBoost = 1,
}: {
  scene: SceneDef;
  colors: SceneColors;
  tier: TierId;
  /* False when the guest's own photo is the background. */
  withBackground?: boolean;
  fixed?: boolean;
  animated?: boolean;
  particleBoost?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const live = animated && tier !== "classic";

  useParallax(ref, live && tier === "luxury3d", fine);

  const ctx: Ctx = { c: colors, scene, tier, live };

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-scene={scene.id}
      data-tier={tier}
      className={`sc-root pointer-events-none ${fixed ? "fixed" : "absolute"} inset-0 overflow-hidden`}
      style={{ containerType: "size", zIndex: fixed ? 0 : undefined }}
    >
      {withBackground && <Background ctx={ctx} />}
      <div className={`absolute inset-0 ${tier === "luxury3d" ? "sc-stage" : ""}`}>
        <Decor ctx={ctx} />
      </div>
      {live && (
        <SceneParticles
          kinds={scene.particles}
          colors={
            scene.particles.some((kind) => kind === "petals" || kind === "hearts")
              ? scene.confetti
              : scene.particles.includes("sparkles") || scene.particles.includes("embers")
                ? [colors.accent, colors.glow]
                : scene.confetti
          }
          count={tier === "luxury3d" ? 26 : 16}
          intensity={particleBoost}
        />
      )}
      {withBackground && tier === "luxury3d" && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 50%, transparent 55%, ${mix(colors.deep, "#000000", 0.2)}55 100%)`,
          }}
        />
      )}
    </div>
  );
}
