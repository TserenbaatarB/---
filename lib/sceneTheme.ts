export type SceneColors = {
  primary: string;
  accent: string;
  tone: "light" | "dark";
  bg1: string;
  bg2: string;
  glow: string;
  deep: string;
  ink: string;
};

const isHex = (value: unknown): value is string =>
  typeof value === "string" && /^#[\da-f]{6}$/i.test(value);

function parse(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function mix(hex: string, other: string, amount: number): string {
  const first = parse(hex);
  const second = parse(other);
  const channel = (index: number) =>
    Math.round(first[index] + (second[index] - first[index]) * amount)
      .toString(16)
      .padStart(2, "0");

  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

/*
 * Every scene colors itself from the invitation's primary/accent colors,
 * so a customized color re-themes the whole scene.
 */
export function sceneColors(
  primary: unknown,
  accent: unknown,
  tone: unknown,
  fallback: { primary: string; accent: string; tone: "light" | "dark" }
): SceneColors {
  const p = isHex(primary) ? primary : fallback.primary;
  const a = isHex(accent) ? accent : fallback.accent;
  const t: "light" | "dark" =
    tone === "dark" || tone === "light" ? tone : fallback.tone;
  const dark = t === "dark";

  return {
    primary: p,
    accent: a,
    tone: t,
    bg1: dark ? mix(p, "#000000", 0.35) : mix(p, "#ffffff", 0.9),
    bg2: dark ? mix(p, "#000000", 0.72) : mix(p, "#ffffff", 0.72),
    glow: dark ? mix(a, "#ffffff", 0.25) : mix(a, "#ffffff", 0.5),
    deep: dark ? mix(p, "#000000", 0.82) : mix(p, "#000000", 0.3),
    ink: dark ? "#ffffff" : "#2c241b",
  };
}

/* Deterministic pseudo random so server and client markup match. */
export function seeded(index: number, salt = 1): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}
