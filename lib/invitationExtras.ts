export type ProgramItem = {
  time: string;
  title: string;
};

export type RsvpVisibility = "open" | "anonymous" | "hidden";

export type MusicSource = "mp3" | "youtube" | "video" | "none";
export type FontFamilyId =
  | "serif"
  | "sans"
  | "system"
  | "display"
  | "script"
  | "modern";

export type Appearance = {
  frame: string;
  primary: string;
  accent: string;
  /* Empty string means automatic text color. */
  textColor: string;
  tone: "dark" | "light";
  font: FontFamilyId;
  brightness: number;
  darkness: number;
  textShadow: "none" | "soft" | "strong";
  pattern: string;
  animation: string;
  open: string;
};

export type InvitationExtras = {
  coverVideoId: string | null;
  coverVideoName: string | null;
  coverVideoPath: string | null;
  musicSource: MusicSource;
  youtubeUrl: string;
  note: string;
  program: ProgramItem[];
  online: boolean;
  onlineUrl: string;
  mapUrl: string;
  lat: number | null;
  lng: number | null;
  rsvpEnabled: boolean;
  rsvpAskGuests: boolean;
  rsvpDeadline: string;
  rsvpVisibility: RsvpVisibility;
  appearance: Appearance;
};

export const EXTRAS_KEY = "invitation-extras";
const EXTRAS_CHANGE_EVENT = "invitation-extras-change";

export function subscribeExtras(onChange: () => void) {
  window.addEventListener(EXTRAS_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener(EXTRAS_CHANGE_EVENT, onChange);
  };
}

export function getExtrasSnapshot() {
  return sessionStorage.getItem(EXTRAS_KEY);
}

export function getServerExtrasSnapshot() {
  return null;
}

export type EventKind =
  | "wedding"
  | "engagement"
  | "anniversary"
  | "birthday"
  | "baby"
  | "graduation"
  | "housewarming"
  | "other";

export type AppearanceOption = {
  id: string;
  label: string;
  icon: string;
  /* Omitted means the option fits every event type. */
  events?: EventKind[];
};

const ROMANTIC: EventKind[] = ["wedding", "engagement", "anniversary"];
const FESTIVE: EventKind[] = [
  "birthday",
  "graduation",
  "housewarming",
  "other",
];

export const FRAMES: AppearanceOption[] = [
  { id: "evereguls", label: "Эвэр угалз", icon: "🐏" },
  { id: "cloud", label: "Үүлэн угалз", icon: "☁️" },
  { id: "sprout", label: "Нахиат мөчир", icon: "🌱" },
  {
    id: "khadag",
    label: "Хадаг",
    icon: "🎗️",
    events: [...ROMANTIC, "baby", "housewarming"],
  },
  {
    id: "khaan",
    label: "Хаан бугуйвч хатан сүйх",
    icon: "👑",
    events: ROMANTIC,
  },
  { id: "thin", label: "Нимгэн шугам", icon: "▭" },
  {
    id: "bold",
    label: "Зузаан хүрээ",
    icon: "🖼️",
    events: [...FESTIVE, "baby"],
  },
  { id: "none", label: "Хүрээгүй", icon: "⬜" },
];

export const PATTERNS: AppearanceOption[] = [
  { id: "olzii", label: "Өлзий", icon: "卍" },
  { id: "evereguls", label: "Эвэр угалз", icon: "🐏" },
  { id: "cloud", label: "Үүлэн угалз", icon: "☁️" },
  { id: "tumen", label: "Түмэн наст", icon: "▣" },
  {
    id: "stars",
    label: "Цэг ба од",
    icon: "✨",
    events: [...FESTIVE, "baby"],
  },
  {
    id: "dots",
    label: "Цэгэн хээ",
    icon: "⁙",
    events: [...FESTIVE, "baby"],
  },
  {
    id: "stripes",
    label: "Налуу зураас",
    icon: "▨",
    events: ["graduation", "other", "anniversary", "housewarming"],
  },
  { id: "paper", label: "Цаасан текстур", icon: "📄" },
  { id: "none", label: "Хээгүй", icon: "⬜" },
];

export const ANIMATIONS: AppearanceOption[] = [
  { id: "snow", label: "Цас", icon: "❄️" },
  { id: "meteor", label: "Сүүлт од", icon: "☄️" },
  {
    id: "party",
    label: "Парти",
    icon: "🎊",
    events: [...FESTIVE, "baby"],
  },
  {
    id: "petals",
    label: "Дэлбээ",
    icon: "🌸",
    events: [...ROMANTIC, "baby", "housewarming"],
  },
  { id: "fireflies", label: "Гэрэлт цох", icon: "🪲" },
  {
    id: "fireworks",
    label: "Салют",
    icon: "🎆",
    events: ["wedding", "anniversary", "birthday", "graduation", "other"],
  },
  { id: "hearts", label: "Зүрх", icon: "❤️", events: ROMANTIC },
  {
    id: "balloons",
    label: "Бөмбөлөг",
    icon: "🎈",
    events: [...FESTIVE, "baby"],
  },
  { id: "clouds", label: "Үүл", icon: "⛅", events: ["baby", "other"] },
  { id: "aurora", label: "Туйлын туяа", icon: "🌌" },
  { id: "fog", label: "Манан", icon: "🌫️" },
  { id: "sparkle", label: "Гялбаа", icon: "✨" },
  {
    id: "leaves",
    label: "Навч",
    icon: "🍃",
    events: ["wedding", "engagement", "baby", "housewarming"],
  },
  {
    id: "stars",
    label: "Одон",
    icon: "⭐",
    events: ["birthday", "baby", "graduation", "other"],
  },
  { id: "none", label: "Эффектгүй", icon: "🚫" },
];

export const OPEN_STYLES: AppearanceOption[] = [
  { id: "envelope", label: "Дугтуй", icon: "💌" },
  { id: "light", label: "Гэрэл цацрах", icon: "💡" },
  { id: "focus", label: "Фокуслах", icon: "🔍" },
  {
    id: "curtain",
    label: "Хөшиг нээгдэх",
    icon: "🎭",
    events: ["wedding", "anniversary", "birthday", "graduation", "other"],
  },
  { id: "slide", label: "Гулсах", icon: "↔️" },
  {
    id: "iris",
    label: "Дугуйрч нээгдэх",
    icon: "⭕",
    events: [...ROMANTIC, "graduation"],
  },
  {
    id: "pulse",
    label: "Лугших",
    icon: "💗",
    events: [...FESTIVE, "baby", "wedding"],
  },
  { id: "circle", label: "Тэлэх тойрог", icon: "🔵" },
];

export function optionsForEvent(
  options: AppearanceOption[],
  eventType: string,
  selectedId?: string
): AppearanceOption[] {
  const filtered = options.filter(
    (option) =>
      !option.events ||
      option.events.includes(eventType as EventKind)
  );

  /* Keep a previously saved value visible even if it no longer fits. */
  const selected = options.find((option) => option.id === selectedId);

  return selected && !filtered.includes(selected)
    ? [...filtered, selected]
    : filtered;
}

type EventDefaults = Pick<
  Appearance,
  "frame" | "pattern" | "animation" | "open"
>;

export const EVENT_DEFAULTS: Record<EventKind, EventDefaults> = {
  wedding: {
    frame: "khaan",
    pattern: "olzii",
    animation: "petals",
    open: "envelope",
  },
  engagement: {
    frame: "khadag",
    pattern: "cloud",
    animation: "hearts",
    open: "iris",
  },
  anniversary: {
    frame: "khadag",
    pattern: "tumen",
    animation: "sparkle",
    open: "curtain",
  },
  birthday: {
    frame: "bold",
    pattern: "stars",
    animation: "balloons",
    open: "pulse",
  },
  baby: {
    frame: "sprout",
    pattern: "dots",
    animation: "clouds",
    open: "pulse",
  },
  graduation: {
    frame: "bold",
    pattern: "stripes",
    animation: "fireworks",
    open: "curtain",
  },
  housewarming: {
    frame: "khadag",
    pattern: "evereguls",
    animation: "leaves",
    open: "light",
  },
  other: {
    frame: "thin",
    pattern: "stars",
    animation: "party",
    open: "circle",
  },
};

export function eventDefaultsFor(eventType: string): EventDefaults {
  return (
    EVENT_DEFAULTS[eventType as EventKind] ?? EVENT_DEFAULTS.other
  );
}

type StylePreset = Pick<
  Appearance,
  "primary" | "accent" | "tone" | "font" | "textColor"
>;

/* Colors and typography that match each design template. */
export const STYLE_PRESETS: Record<string, StylePreset> = {
  romantic: { primary: "#a66a78", accent: "#b08d57", tone: "light", font: "serif", textColor: "" },
  luxury: { primary: "#b08d57", accent: "#d5b98c", tone: "dark", font: "display", textColor: "" },
  minimal: { primary: "#2c241b", accent: "#555555", tone: "light", font: "modern", textColor: "" },
  garden: { primary: "#6d8b63", accent: "#4f6849", tone: "light", font: "serif", textColor: "" },
  "black-gold": { primary: "#d5b98c", accent: "#b08d57", tone: "dark", font: "display", textColor: "" },
  "white-gold": { primary: "#b08d57", accent: "#d5b98c", tone: "light", font: "display", textColor: "" },
  pastel: { primary: "#a66a78", accent: "#7a4fa3", tone: "light", font: "script", textColor: "" },
  editorial: { primary: "#2c241b", accent: "#c0503b", tone: "light", font: "modern", textColor: "" },
  vintage: { primary: "#8a6a4a", accent: "#b08d57", tone: "light", font: "serif", textColor: "" },
  boho: { primary: "#c0503b", accent: "#6d8b63", tone: "light", font: "script", textColor: "" },
  royal: { primary: "#d5b98c", accent: "#7a4fa3", tone: "dark", font: "display", textColor: "" },
  "dark-romance": { primary: "#a66a78", accent: "#d5b98c", tone: "dark", font: "script", textColor: "" },
  "blue-elegant": { primary: "#2f5d8a", accent: "#b08d57", tone: "light", font: "display", textColor: "" },
  sage: { primary: "#6d8b63", accent: "#b08d57", tone: "light", font: "serif", textColor: "" },
  terracotta: { primary: "#c0503b", accent: "#b08d57", tone: "light", font: "sans", textColor: "" },
  blush: { primary: "#a66a78", accent: "#b08d57", tone: "light", font: "script", textColor: "" },
  celestial: { primary: "#a78bfa", accent: "#d5b98c", tone: "dark", font: "display", textColor: "" },
  "modern-black": { primary: "#ffffff", accent: "#b08d57", tone: "dark", font: "modern", textColor: "" },
  coastal: { primary: "#2f5d8a", accent: "#6d8b63", tone: "light", font: "sans", textColor: "" },
  classic: { primary: "#b08d57", accent: "#b08d57", tone: "light", font: "serif", textColor: "" },
};

export const ACCENT_COLORS = [
  "#b08d57",
  "#d5b98c",
  "#a66a78",
  "#c0503b",
  "#6d8b63",
  "#2f5d8a",
  "#7a4fa3",
  "#2c241b",
  "#ffffff",
];

export const TEXT_COLORS = [
  "#2c241b",
  "#4a3b2e",
  "#392a2d",
  "#263326",
  "#1f2a44",
  "#ffffff",
  "#f3ead9",
];

export const FONT_FAMILIES: {
  id: FontFamilyId;
  label: string;
  icon: string;
}[] = [
  { id: "serif", label: "Сериф", icon: "Aa" },
  { id: "display", label: "Дэгжин", icon: "Ƒ" },
  { id: "script", label: "Гар бичмэл", icon: "𝒜" },
  { id: "modern", label: "Модерн", icon: "M" },
  { id: "sans", label: "Санс", icon: "Ab" },
  { id: "system", label: "Систем", icon: "S" },
];

export function fontFamilyFor(font: FontFamilyId): string {
  switch (font) {
    case "display":
      return "var(--font-playfair), Georgia, serif";
    case "script":
      return "var(--font-marck), cursive";
    case "modern":
      return "var(--font-montserrat), Arial, sans-serif";
    case "sans":
      return "var(--font-inter), Arial, sans-serif";
    case "system":
      return "system-ui, sans-serif";
    case "serif":
    default:
      return "var(--font-cormorant), Georgia, serif";
  }
}

export function defaultExtras(): InvitationExtras {
  return {
    coverVideoId: null,
    coverVideoName: null,
    coverVideoPath: null,
    musicSource: "none",
    youtubeUrl: "",
    note: "",
    program: [],
    online: false,
    onlineUrl: "",
    mapUrl: "",
    lat: null,
    lng: null,
    rsvpEnabled: false,
    rsvpAskGuests: false,
    rsvpDeadline: "",
    rsvpVisibility: "open",
    appearance: {
      frame: "evereguls",
      primary: "#b08d57",
      accent: "#b08d57",
      textColor: "",
      tone: "light",
      font: "serif",
      brightness: 100,
      darkness: 15,
      textShadow: "soft",
      pattern: "olzii",
      animation: "none",
      open: "envelope",
    },
  };
}

export function mergeExtras(
  value: unknown
): InvitationExtras {
  const base = defaultExtras();

  if (!value || typeof value !== "object") {
    return base;
  }

  const input = value as Partial<InvitationExtras>;
  const appearanceInput: Partial<Appearance> =
    input.appearance &&
    typeof input.appearance === "object"
      ? input.appearance
      : {};
  const isHexColor = (color: unknown): color is string =>
    typeof color === "string" &&
    /^#[\da-f]{6}$/i.test(color);
  const clampSetting = (
    setting: unknown,
    fallback: number,
    min: number,
    max: number
  ) =>
    typeof setting === "number" && Number.isFinite(setting)
      ? Math.min(max, Math.max(min, setting))
      : fallback;

  return {
    ...base,
    ...input,
    program: Array.isArray(input.program)
      ? input.program
          .filter(
            (item) =>
              item &&
              typeof item.title === "string"
          )
          .map((item) => ({
            time: String(item.time ?? ""),
            title: item.title,
          }))
      : base.program,
    appearance: {
      ...base.appearance,
      ...appearanceInput,
      primary: isHexColor(appearanceInput.primary)
        ? appearanceInput.primary
        : isHexColor(appearanceInput.accent)
          ? appearanceInput.accent
          : base.appearance.primary,
      accent: isHexColor(appearanceInput.accent)
        ? appearanceInput.accent
        : base.appearance.accent,
      tone: appearanceInput.tone === "dark" ? "dark" : "light",
      textColor: isHexColor(appearanceInput.textColor)
        ? appearanceInput.textColor
        : "",
      font:
        appearanceInput.font === "sans" ||
        appearanceInput.font === "system" ||
        appearanceInput.font === "display" ||
        appearanceInput.font === "script" ||
        appearanceInput.font === "modern"
          ? appearanceInput.font
          : "serif",
      brightness: clampSetting(
        appearanceInput.brightness,
        base.appearance.brightness,
        50,
        150
      ),
      darkness: clampSetting(
        appearanceInput.darkness,
        base.appearance.darkness,
        0,
        80
      ),
      textShadow:
        appearanceInput.textShadow === "none" ||
        appearanceInput.textShadow === "strong"
          ? appearanceInput.textShadow
          : "soft",
    },
  };
}

export function readExtras(): InvitationExtras {
  if (typeof window === "undefined") {
    return defaultExtras();
  }

  try {
    const raw = sessionStorage.getItem(EXTRAS_KEY);
    return parseExtras(raw);
  } catch {
    return defaultExtras();
  }
}

export function writeExtras(
  patch: Partial<InvitationExtras>
): InvitationExtras {
  const next = mergeExtras({
    ...readExtras(),
    ...patch,
  });

  sessionStorage.setItem(
    EXTRAS_KEY,
    JSON.stringify(next)
  );
  window.dispatchEvent(new Event(EXTRAS_CHANGE_EVENT));

  return next;
}

export function parseExtras(raw: string | null): InvitationExtras {
  if (!raw) {
    return defaultExtras();
  }

  try {
    return mergeExtras(JSON.parse(raw));
  } catch {
    return defaultExtras();
  }
}

/*
 * Browser-only fields (IndexedDB id, file name) are not
 * stored in the database.
 */
export function toPublicExtras(
  extras: InvitationExtras
) {
  const {
    coverVideoId: _id,
    coverVideoName: _name,
    ...publicFields
  } = extras;

  void _id;
  void _name;

  return {
    ...publicFields,
    program: extras.program.filter((item) =>
      item.title.trim()
    ),
  };
}

export function parseYouTubeId(
  url: string
): string | null {
  const value = url.trim();

  if (!value) return null;

  const match =
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/.exec(
      value
    );

  if (match) return match[1];

  return /^[A-Za-z0-9_-]{11}$/.test(value)
    ? value
    : null;
}

export function parseMapsLink(
  url: string
): { lat: number; lng: number } | null {
  const value = decodeURIComponent(url.trim());

  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query|destination|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(value);

    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);

      if (
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
      ) {
        return { lat, lng };
      }
    }
  }

  return null;
}

export function mapDirectionsUrl(
  lat: number,
  lng: number
) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
