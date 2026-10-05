export type ProgramItem = {
  time: string;
  title: string;
};

export type RsvpVisibility = "open" | "anonymous" | "hidden";

export type MusicSource = "mp3" | "youtube" | "video" | "none";

export type Appearance = {
  frame: string;
  accent: string;
  tone: "dark" | "light";
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

export const FRAMES = [
  { id: "evereguls", label: "Эвэр угалз" },
  { id: "cloud", label: "Үүлэн угалз" },
  { id: "sprout", label: "Нахиат мөчир" },
  { id: "khadag", label: "Хадаг" },
  { id: "khaan", label: "Хаан бугуйвч хатан сүйх" },
  { id: "none", label: "Хүрээгүй" },
];

export const PATTERNS = [
  { id: "olzii", label: "Өлзий" },
  { id: "evereguls", label: "Эвэр угалз" },
  { id: "cloud", label: "Үүлэн угалз" },
  { id: "tumen", label: "Түмэн наст" },
  { id: "stars", label: "Цэг ба од" },
  { id: "paper", label: "Цаасан текстур" },
  { id: "none", label: "Хээгүй" },
];

export const ANIMATIONS = [
  { id: "snow", label: "Цас" },
  { id: "meteor", label: "Сүүлт од" },
  { id: "party", label: "Парти" },
  { id: "petals", label: "Дэлбээ" },
  { id: "fireflies", label: "Гэрэлт цох" },
  { id: "fireworks", label: "Салют" },
  { id: "hearts", label: "Зүрх" },
  { id: "balloons", label: "Бөмбөлөг" },
  { id: "clouds", label: "Үүл" },
  { id: "aurora", label: "Туйлын туяа" },
  { id: "fog", label: "Манан" },
  { id: "none", label: "Эффектгүй" },
];

export const OPEN_STYLES = [
  { id: "envelope", label: "Дугтуй" },
  { id: "light", label: "Гэрэл цацрах" },
  { id: "focus", label: "Фокуслах" },
  { id: "curtain", label: "Хөшиг нээгдэх" },
  { id: "slide", label: "Лугших" },
  { id: "iris", label: "Хүрээлэх" },
];

export const ACCENT_COLORS = [
  "#b08d57",
  "#a66a78",
  "#6d8b63",
  "#2f5d8a",
  "#7a4fa3",
  "#c0503b",
  "#2c241b",
];

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
      accent: "#b08d57",
      tone: "light",
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
      ...(input.appearance ?? {}),
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
