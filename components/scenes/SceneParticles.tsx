"use client";

import type { CSSProperties, ReactNode } from "react";

import type { ParticleKind } from "@/lib/invitationTemplates";
import { seeded } from "@/lib/sceneTheme";

import {
  Balloon,
  Cloud,
  GradCap,
  Heart,
  Leaf,
  Petal,
  Sparkle,
  Star5,
} from "./art";
import { useCompact, useReducedMotion } from "./hooks";

type Motion = "fall" | "rise" | "twinkle" | "drift";

const MOTION: Record<ParticleKind, Motion> = {
  petals: "fall",
  leaves: "fall",
  confetti: "fall",
  caps: "fall",
  embers: "rise",
  balloons: "rise",
  hearts: "rise",
  bubbles: "rise",
  sparkles: "twinkle",
  stars: "twinkle",
  dust: "twinkle",
  clouds: "drift",
};

const BASE_SIZE: Record<ParticleKind, number> = {
  petals: 18,
  leaves: 16,
  confetti: 9,
  caps: 30,
  embers: 6,
  balloons: 34,
  hearts: 18,
  bubbles: 12,
  sparkles: 16,
  stars: 14,
  dust: 5,
  clouds: 120,
};

function piece(
  kind: ParticleKind,
  color: string,
  size: number
): ReactNode {
  switch (kind) {
    case "petals":
      return <Petal color={color} style={{ width: size, height: size * 1.3 }} />;
    case "leaves":
      return <Leaf color={color} style={{ width: size * 0.7, height: size * 1.2 }} />;
    case "balloons":
      return <Balloon color={color} style={{ width: size, height: size * 2 }} />;
    case "hearts":
      return <Heart color={color} style={{ width: size, height: size * 0.9 }} />;
    case "sparkles":
      return <Sparkle color={color} style={{ width: size, height: size }} />;
    case "stars":
      return <Star5 color={color} style={{ width: size, height: size }} />;
    case "caps":
      return <GradCap color="#1c2a44" accent={color} style={{ width: size, height: size * 0.75 }} />;
    case "clouds":
      return <Cloud color={color} style={{ width: size, height: size / 2 }} />;
    case "bubbles":
      return (
        <span
          className="block rounded-full"
          style={{
            width: size,
            height: size,
            border: `1.5px solid ${color}`,
            background: `${color}22`,
          }}
        />
      );
    case "dust":
    case "embers":
      return (
        <span
          className="block rounded-full"
          style={{
            width: size,
            height: size,
            background: color,
            boxShadow: `0 0 ${size * 2}px ${color}`,
          }}
        />
      );
    case "confetti":
    default:
      return (
        <span
          className="block"
          style={{ width: size, height: size * 0.55, background: color }}
        />
      );
  }
}

export default function SceneParticles({
  kinds,
  colors,
  count,
  intensity = 1,
}: {
  kinds: ParticleKind[];
  colors: string[];
  /* Particles at full size on a desktop screen. */
  count: number;
  intensity?: number;
}) {
  const reduced = useReducedMotion();
  const compact = useCompact();

  if (reduced || kinds.length === 0 || colors.length === 0) return null;

  const total = Math.max(
    1,
    Math.round(count * intensity * (compact ? 0.55 : 1))
  );

  return (
    <div
      aria-hidden="true"
      className="sc-particles pointer-events-none absolute inset-0 overflow-hidden"
    >
      {Array.from({ length: total }, (_, index) => {
        const kind = kinds[index % kinds.length];
        const motion = MOTION[kind];
        const color = colors[Math.floor(seeded(index, 3) * colors.length)];
        const size = BASE_SIZE[kind] * (0.7 + seeded(index, 5) * 0.7);
        const duration =
          motion === "drift"
            ? 38 + seeded(index, 7) * 30
            : motion === "twinkle"
              ? 3 + seeded(index, 7) * 4
              : 9 + seeded(index, 7) * 10;
        const style = {
          left: `${(seeded(index, 1) * 100).toFixed(1)}%`,
          top:
            motion === "twinkle" || motion === "drift"
              ? `${(seeded(index, 2) * 90).toFixed(1)}%`
              : 0,
          animationDuration: `${duration.toFixed(1)}s`,
          animationDelay: `${(-seeded(index, 9) * duration).toFixed(1)}s`,
          "--sc-dx": `${((seeded(index, 4) - 0.5) * 120).toFixed(0)}px`,
          opacity: kind === "clouds" ? 0.7 : 1,
        } as CSSProperties;

        return (
          <span
            key={index}
            className={`sc-p sc-p-${motion}`}
            style={style}
          >
            {piece(kind, color, size)}
          </span>
        );
      })}
    </div>
  );
}
