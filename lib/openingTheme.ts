export type OpeningTheme = {
  emblem: string;
  label: string;
  ornament: string;
  background: string;
  panelA: string;
  panelB: string;
  paper: string;
  flap: string;
  ink: string;
  accent: string;
  buttonBackground: string;
  buttonInk: string;
  panelInk: string;
  dark: boolean;
};

type EventMotif = {
  emblem: string;
  label: string;
  ornament: string;
  /* Palette used when the invitation has no custom colors. */
  color: string;
};

const EVENT_MOTIFS: Record<string, EventMotif> = {
  wedding: {
    emblem: "💍",
    label: "Хуримын урилга",
    ornament: "❦ ✦ ❦",
    color: "#a66a78",
  },
  engagement: {
    emblem: "💐",
    label: "Сүй тавих ёслолын урилга",
    ornament: "❀ ✦ ❀",
    color: "#a66a78",
  },
  anniversary: {
    emblem: "🥂",
    label: "Ойн баярын урилга",
    ornament: "✦ ❖ ✦",
    color: "#b08d57",
  },
  birthday: {
    emblem: "🎂",
    label: "Төрсөн өдрийн урилга",
    ornament: "🎈 ✦ 🎈",
    color: "#c0503b",
  },
  baby: {
    emblem: "👶",
    label: "Сэвлэг үргээх ёслолын урилга",
    ornament: "☁ ✦ ☁",
    color: "#5b8db8",
  },
  graduation: {
    emblem: "🎓",
    label: "Төгсөлтийн баярын урилга",
    ornament: "★ ✦ ★",
    color: "#2f5d8a",
  },
  housewarming: {
    emblem: "🏡",
    label: "Шинэ гэрийн баярын урилга",
    ornament: "❋ ✦ ❋",
    color: "#6d8b63",
  },
  other: {
    emblem: "🎉",
    label: "Урилга",
    ornament: "✦ ✦ ✦",
    color: "#7a4fa3",
  },
};

const DARK_STYLES = new Set([
  "luxury",
  "black-gold",
  "dark-romance",
  "royal",
  "celestial",
  "modern-black",
]);

function parse(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mix(hex: string, other: string, amount: number): string {
  const first = parse(hex);
  const second = parse(other);
  const channel = (index: number) =>
    Math.round(first[index] + (second[index] - first[index]) * amount)
      .toString(16)
      .padStart(2, "0");

  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

function readableOn(hex: string): string {
  const [r, g, b] = parse(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
    ? "#2c241b"
    : "#ffffff";
}

const isHex = (value: unknown): value is string =>
  typeof value === "string" && /^#[\da-f]{6}$/i.test(value);

/*
 * The opening screen follows the invitation type (emblem, wording)
 * and the chosen template (colors, light/dark tone).
 */
export function getOpeningTheme(
  eventType: string,
  styleId: string,
  appearance: { primary?: string; accent?: string; tone?: string }
): OpeningTheme {
  const motif = EVENT_MOTIFS[eventType] ?? EVENT_MOTIFS.other;
  const accent = isHex(appearance.primary)
    ? appearance.primary
    : isHex(appearance.accent)
      ? appearance.accent
      : motif.color;
  const dark = appearance.tone
    ? appearance.tone === "dark"
    : DARK_STYLES.has(styleId);

  const background = dark
    ? `radial-gradient(circle at 50% 35%, ${mix(accent, "#000000", 0.6)} 0%, #0c0a0b 78%)`
    : `linear-gradient(160deg, ${mix(accent, "#ffffff", 0.9)} 0%, ${mix(accent, "#ffffff", 0.72)} 100%)`;

  const panelA = dark ? mix(accent, "#000000", 0.45) : accent;
  const panelB = dark ? mix(accent, "#000000", 0.7) : mix(accent, "#000000", 0.25);

  return {
    emblem: motif.emblem,
    label: motif.label,
    ornament: motif.ornament,
    background,
    panelA,
    panelB,
    paper: dark ? mix(accent, "#ffffff", 0.88) : "#fffaf2",
    flap: mix(accent, "#ffffff", dark ? 0.7 : 0.78),
    ink: dark ? "#ffffff" : "#2c241b",
    accent,
    buttonBackground: accent,
    buttonInk: readableOn(accent),
    panelInk: dark ? "#ffffff" : readableOn(accent),
    dark,
  };
}
