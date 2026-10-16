import type { Appearance, FontFamilyId, TierId } from "@/lib/invitationExtras";

export type SceneId =
  | "palace-wedding"
  | "mongol-wedding"
  | "kids-birthday"
  | "first-birthday"
  | "adult-birthday"
  | "graduation"
  | "engagement"
  | "baby-shower"
  | "corporate"
  | "anniversary"
  | "housewarming"
  | "celebration";

/* How the invitation opens in the Premium and Luxury 3D tiers. */
export type OpeningKind =
  | "doors"
  | "book"
  | "curtain"
  | "silk"
  | "balloons"
  | "clouds"
  | "bloom"
  | "shutters";

export type ParticleKind =
  | "petals"
  | "sparkles"
  | "balloons"
  | "confetti"
  | "stars"
  | "hearts"
  | "clouds"
  | "bubbles"
  | "dust"
  | "leaves"
  | "caps"
  | "embers";

export type SceneSample = {
  names: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  message: string;
  program: { time: string; title: string }[];
};

export type SceneDef = {
  id: SceneId;
  /* Existing event type the invitation is stored with. */
  eventType: string;
  label: string;
  english: string;
  icon: string;
  blurb: string;
  opening: OpeningKind;
  particles: ParticleKind[];
  /* Colors for confetti, balloons and similar multi-color pieces. */
  confetti: string[];
  palette: { primary: string; accent: string; tone: "light" | "dark" };
  font: FontFamilyId;
  defaults: Pick<Appearance, "frame" | "pattern" | "animation" | "open">;
  sample: SceneSample;
};

export type TemplateDef = {
  id: string;
  scene: SceneId;
  name: string;
  blurb: string;
  appearance: Pick<Appearance, "primary" | "accent" | "tone" | "font">;
};

export type TierDef = {
  id: TierId;
  label: string;
  english: string;
  blurb: string;
  features: string[];
};

export const TIERS: TierDef[] = [
  {
    id: "classic",
    label: "Сонгодог",
    english: "Classic",
    blurb: "Цэвэр, намуухан, хөдөлгөөнгүй загвар.",
    features: ["Төрөлд тохирсон хээ, өнгө", "Хөнгөн, хурдан ачаална"],
  },
  {
    id: "premium",
    label: "Премиум",
    english: "Premium animated",
    blurb: "Хаалга, хөшиг, цэцэг, бөөмс, гэрлийн хөдөлгөөнтэй.",
    features: ["Хөдөлгөөнт нээлт", "Цэцэг, бөөмс, гэрэл"],
  },
  {
    id: "luxury3d",
    label: "Люкс 3D",
    english: "Luxury 3D",
    blurb: "Гүнзгий давхаргат дүр, параллакс, киноны шилжилт.",
    features: ["3D гүн, параллакс", "Киноны нээлт, гэрлийн туяа"],
  },
];

export function getTier(id: string | undefined): TierDef {
  return TIERS.find((tier) => tier.id === id) ?? TIERS[0];
}

export const SCENES: SceneDef[] = [
  {
    id: "palace-wedding",
    eventType: "wedding",
    label: "Хурим",
    english: "Palace wedding",
    icon: "💍",
    blurb: "Ордны хаалга нээгдэж, ягаан цагаан алтан танхим харагдана.",
    opening: "doors",
    particles: ["petals", "sparkles"],
    confetti: ["#f4d9de", "#ffffff", "#e8c987"],
    palette: { primary: "#b08d57", accent: "#d5b98c", tone: "light" },
    font: "display",
    defaults: { frame: "thin", pattern: "none", animation: "none", open: "envelope" },
    sample: {
      names: "Тэмүүлэн & Номин",
      title: "Хуримын ёслолд урьж байна",
      date: "2027-06-12",
      time: "17:00",
      venue: "Чингис хаан зочид буудал",
      message:
        "Бидний амьдралын хамгийн чухал өдрийг тантай хамт өнгөрүүлэхийг хүсэж байна.",
      program: [
        { time: "16:00", title: "Зочдыг угтах" },
        { time: "17:00", title: "Хуримын ёслол" },
        { time: "19:00", title: "Оройн зоог" },
      ],
    },
  },
  {
    id: "mongol-wedding",
    eventType: "wedding",
    label: "Уламжлалт хурим",
    english: "Mongolian wedding",
    icon: "🏮",
    blurb: "Улаан торгон хөшиг, алтан өлзий хээ, ордон тооно.",
    opening: "silk",
    particles: ["embers", "petals"],
    confetti: ["#e0b24f", "#b3202c", "#f4e3b0"],
    palette: { primary: "#9b1b22", accent: "#e0b24f", tone: "dark" },
    font: "display",
    defaults: { frame: "khaan", pattern: "olzii", animation: "none", open: "curtain" },
    sample: {
      names: "Бат-Эрдэнэ & Сарангэрэл",
      title: "Монгол ёсны хуримын ёслол",
      date: "2027-05-22",
      time: "12:00",
      venue: "Тэнгэр ордон",
      message:
        "Эцэг эхийн ерөөл, ахан дүүгийн хүндэтгэлтэйгээр шинэ ам бүлийн ёслолд тантай хамт байхыг хүсэн урьж байна.",
      program: [
        { time: "11:00", title: "Хадаг дээс барих ёслол" },
        { time: "12:00", title: "Хурим, ерөөл" },
        { time: "14:00", title: "Хүндэтгэлийн найр" },
      ],
    },
  },
  {
    id: "kids-birthday",
    eventType: "birthday",
    label: "Хүүхдийн төрсөн өдөр",
    english: "Kids birthday",
    icon: "🎈",
    blurb: "Өнгийн бөмбөлөг, үүл, тугнууд бүхий хөгжилтэй өдөр.",
    opening: "balloons",
    particles: ["balloons", "confetti"],
    confetti: ["#ff6b6b", "#ffd93d", "#4ecdc4", "#a78bfa", "#ff9f43"],
    palette: { primary: "#3b9ae1", accent: "#ff9f43", tone: "light" },
    font: "script",
    defaults: { frame: "bold", pattern: "dots", animation: "none", open: "pulse" },
    sample: {
      names: "Анужин",
      title: "7 насны төрсөн өдөр",
      date: "2027-04-17",
      time: "14:00",
      venue: "Хүүхдийн тоглоомын төв",
      message: "Хамтдаа тоглож, хөгжилдөж, амттан идэцгээе!",
      program: [
        { time: "14:00", title: "Угтах, тоглоом" },
        { time: "15:00", title: "Бялуу, ерөөл" },
        { time: "16:00", title: "Шоу, бэлэг" },
      ],
    },
  },
  {
    id: "first-birthday",
    eventType: "birthday",
    label: "1 насны төрсөн өдөр",
    english: "First birthday",
    icon: "🧸",
    blurb: "Зөөлөн өнгө, нялх баавгай, одод бүхий уян нэгэн нас.",
    opening: "curtain",
    particles: ["stars", "hearts", "bubbles"],
    confetti: ["#f4b6c2", "#fbe4a6", "#bfdcf2"],
    palette: { primary: "#c99a6b", accent: "#e8a5b0", tone: "light" },
    font: "serif",
    defaults: { frame: "sprout", pattern: "stars", animation: "none", open: "pulse" },
    sample: {
      names: "Тэргэл",
      title: "Анхны төрсөн өдөр",
      date: "2027-03-06",
      time: "13:00",
      venue: "Гэр бүлийн ресторан",
      message: "Манай бяцхан үрийн анхны төрсөн өдрийг хамтдаа тэмдэглэе.",
      program: [
        { time: "13:00", title: "Угтах" },
        { time: "14:00", title: "Шүд зулаах ёслол" },
        { time: "15:00", title: "Бялуу, зураг" },
      ],
    },
  },
  {
    id: "adult-birthday",
    eventType: "birthday",
    label: "Том хүн, 18 нас",
    english: "Adult / 18th birthday",
    icon: "🥂",
    blurb: "Алтан гэрэл, прожектор, тансаг үдшийн уур амьсгал.",
    opening: "curtain",
    particles: ["sparkles", "confetti", "bubbles"],
    confetti: ["#e8c987", "#ffffff", "#d5a24f"],
    palette: { primary: "#2b2116", accent: "#e8c987", tone: "dark" },
    font: "display",
    defaults: { frame: "thin", pattern: "none", animation: "none", open: "curtain" },
    sample: {
      names: "Энхжин",
      title: "18 насны тансаг үдэш",
      date: "2027-09-18",
      time: "19:00",
      venue: "Sky Lounge",
      message: "Миний насанд хүрсэн өдрийн тансаг үдшийг хамтдаа өнгөрүүлцгээе.",
      program: [
        { time: "19:00", title: "Угтах, коктейль" },
        { time: "20:00", title: "Бялуу, ерөөл" },
        { time: "21:00", title: "Дүрэмт үдэшлэг" },
      ],
    },
  },
  {
    id: "graduation",
    eventType: "graduation",
    label: "Төгсөлт",
    english: "Graduation",
    icon: "🎓",
    blurb: "Академик хүрээ, төгсөлтийн малгай, лавр навч, алтан одод.",
    opening: "book",
    particles: ["caps", "confetti", "sparkles"],
    confetti: ["#d4af37", "#ffffff", "#7fa7d9"],
    palette: { primary: "#1c3557", accent: "#d4af37", tone: "dark" },
    font: "display",
    defaults: { frame: "bold", pattern: "stripes", animation: "none", open: "curtain" },
    sample: {
      names: "Тэмүүлэн",
      title: "Төгсөлтийн баярын ёслол",
      date: "2027-06-28",
      time: "18:00",
      venue: "Төгсөлтийн танхим",
      message: "Олон жилийн хөдөлмөрийн үр шимийг хамтдаа тэмдэглэе.",
      program: [
        { time: "17:00", title: "Угтах" },
        { time: "18:00", title: "Төгсөлтийн ёслол" },
        { time: "20:00", title: "Хүлээн авалт" },
      ],
    },
  },
  {
    id: "engagement",
    eventType: "engagement",
    label: "Сүй тавих",
    english: "Engagement",
    icon: "💐",
    blurb: "Романтик цэцгийн баглаа, бөгж, уярсан ягаан өнгө.",
    opening: "bloom",
    particles: ["petals", "hearts", "sparkles"],
    confetti: ["#f4c2cf", "#ffffff", "#e8b4a0"],
    palette: { primary: "#d98ea0", accent: "#b08d57", tone: "light" },
    font: "serif",
    defaults: { frame: "khadag", pattern: "cloud", animation: "none", open: "iris" },
    sample: {
      names: "Ананд & Сувд",
      title: "Сүй тавих ёслол",
      date: "2027-03-20",
      time: "16:00",
      venue: "Ботаникийн цэцэрлэг",
      message: "Бидний хайрын шинэ эхлэлийг тантай хуваалцахыг хүсэж байна.",
      program: [
        { time: "16:00", title: "Угтах" },
        { time: "16:30", title: "Сүй тавих ёслол" },
        { time: "18:00", title: "Хөнгөн зоог" },
      ],
    },
  },
  {
    id: "baby-shower",
    eventType: "baby",
    label: "Сэвлэг үргээх",
    english: "Baby shower",
    icon: "👶",
    blurb: "Цайвар ногоон, пастел өнгө, зөөлөн үүл, одод.",
    opening: "clouds",
    particles: ["clouds", "bubbles", "stars"],
    confetti: ["#bcd4b4", "#fbe4a6", "#f4c2cf"],
    palette: { primary: "#7d9a76", accent: "#c9a66b", tone: "light" },
    font: "serif",
    defaults: { frame: "sprout", pattern: "dots", animation: "none", open: "pulse" },
    sample: {
      names: "Бяцхан сайхан",
      title: "Сэвлэг үргээх ёслол",
      date: "2027-02-14",
      time: "12:00",
      venue: "Гэр бүлийн танхим",
      message: "Шинэ амьдралыг угтан баярлаж, хамтдаа ерөөцгөөе.",
      program: [
        { time: "12:00", title: "Угтах" },
        { time: "13:00", title: "Ёслол, ерөөл" },
        { time: "14:00", title: "Хөнгөн зоог" },
      ],
    },
  },
  {
    id: "corporate",
    eventType: "other",
    label: "Байгууллагын арга хэмжээ",
    english: "Corporate event",
    icon: "🏢",
    blurb: "Мэргэжлийн, цэвэр геометр зураглал, зохицсон өнгө.",
    opening: "shutters",
    particles: ["dust"],
    confetti: ["#c9a66b", "#ffffff"],
    palette: { primary: "#12294a", accent: "#c9a66b", tone: "dark" },
    font: "modern",
    defaults: { frame: "thin", pattern: "none", animation: "none", open: "slide" },
    sample: {
      names: "JZT Group",
      title: "Жилийн нээлттэй өдөр",
      date: "2027-10-08",
      time: "10:00",
      venue: "Улаанбаатар зочид буудал",
      message: "Хамтрагч байгууллага, түнш нартаа манай жилийн арга хэмжээнд хүндэтгэн урьж байна.",
      program: [
        { time: "10:00", title: "Бүртгэл, угтах" },
        { time: "11:00", title: "Үндсэн илтгэл" },
        { time: "13:00", title: "Үдийн зоог, холбоо тогтоох" },
      ],
    },
  },
  {
    id: "anniversary",
    eventType: "anniversary",
    label: "Ойн баяр",
    english: "Anniversary",
    icon: "🥂",
    blurb: "Алтан бөгж, зүрх, бордо сарнай бүхий романтик үдэш.",
    opening: "curtain",
    particles: ["hearts", "sparkles", "petals"],
    confetti: ["#e6b980", "#8e3b52", "#ffffff"],
    palette: { primary: "#b08d57", accent: "#8e3b52", tone: "light" },
    font: "display",
    defaults: { frame: "khadag", pattern: "tumen", animation: "none", open: "curtain" },
    sample: {
      names: "Бат & Саруул",
      title: "Хамтын амьдралын 10 жилийн ой",
      date: "2027-08-14",
      time: "18:00",
      venue: "Алтан ресторан",
      message: "Арван жилийн хайр, дурсамжаа тантай хуваалцахыг хүсэж байна.",
      program: [
        { time: "18:00", title: "Угтах" },
        { time: "19:00", title: "Ойн ёслол" },
        { time: "20:00", title: "Оройн зоог" },
      ],
    },
  },
  {
    id: "housewarming",
    eventType: "housewarming",
    label: "Шинэ гэр",
    english: "Housewarming",
    icon: "🏡",
    blurb: "Дулаан өнгө, навч, гэрэлт гирлянд бүхий гэрийн баяр.",
    opening: "curtain",
    particles: ["leaves", "dust"],
    confetti: ["#c0653b", "#6d8b63", "#f3ead9"],
    palette: { primary: "#c0653b", accent: "#6d8b63", tone: "light" },
    font: "serif",
    defaults: { frame: "khadag", pattern: "evereguls", animation: "none", open: "light" },
    sample: {
      names: "Бат & Саруул",
      title: "Шинэ гэрийн баяр",
      date: "2027-05-09",
      time: "15:00",
      venue: "Шинэ гэр",
      message: "Шинэ гэрийнхээ босгыг хамтдаа алхаж, баярыг хуваалцъя.",
      program: [
        { time: "15:00", title: "Угтах" },
        { time: "16:00", title: "Гэр өргөх ёслол" },
      ],
    },
  },
  {
    id: "celebration",
    eventType: "other",
    label: "Бусад баяр",
    english: "Celebration",
    icon: "🎉",
    blurb: "Өнгөлөг, цэнгэг, ямар ч баярт тохирох ерөнхий загвар.",
    opening: "bloom",
    particles: ["confetti", "sparkles"],
    confetti: ["#7a4fa3", "#f0b429", "#ff7a8a", "#4ecdc4"],
    palette: { primary: "#7a4fa3", accent: "#f0b429", tone: "light" },
    font: "modern",
    defaults: { frame: "thin", pattern: "stars", animation: "none", open: "circle" },
    sample: {
      names: "Онцгой өдөр",
      title: "Баярын уулзалт",
      date: "2027-07-10",
      time: "17:00",
      venue: "Баярын танхим",
      message: "Хамтдаа баяраа тэмдэглэхэд тантай уулзахыг тэсэн ядан хүлээж байна.",
      program: [
        { time: "17:00", title: "Угтах" },
        { time: "18:00", title: "Баярын хөтөлбөр" },
      ],
    },
  },
];

type TemplateSeed = [
  id: string,
  scene: SceneId,
  name: string,
  blurb: string,
  primary: string,
  accent: string,
  tone: "light" | "dark",
  font: FontFamilyId,
];

const TEMPLATE_SEEDS: TemplateSeed[] = [
  ["ivory-palace", "palace-wedding", "Ivory Palace", "Ягаан цагаан, алтан хээтэй танхим", "#b08d57", "#d5b98c", "light", "display"],
  ["blush-palace", "palace-wedding", "Blush Rose", "Ягаавтар сарнайн ордон", "#a66a78", "#b08d57", "light", "serif"],
  ["imperial-red", "mongol-wedding", "Imperial Red", "Улаан торго, алтан өлзий", "#9b1b22", "#e0b24f", "dark", "display"],
  ["blue-sky-ger", "mongol-wedding", "Хөх тэнгэр", "Хөх торго, алтан тооно", "#1f4e8c", "#e0b24f", "dark", "display"],
  ["sky-balloons", "kids-birthday", "Sky Balloons", "Тэнгэр хөх, өнгөт бөмбөлөг", "#3b9ae1", "#ff9f43", "light", "script"],
  ["candy-party", "kids-birthday", "Candy Party", "Ягаан, шар амттан үдэшлэг", "#e0569a", "#ffcf4a", "light", "script"],
  ["teddy-cream", "first-birthday", "Teddy Cream", "Цайвар хүрэн баавгай", "#c99a6b", "#e8a5b0", "light", "serif"],
  ["teddy-blue", "first-birthday", "Teddy Blue", "Цэнхэр пастел баавгай", "#7aa6d6", "#f2c879", "light", "serif"],
  ["glam-night", "adult-birthday", "Glam Night", "Хар алтан, прожекторт үдэш", "#2b2116", "#e8c987", "dark", "display"],
  ["rose-gold-18", "adult-birthday", "Rose Gold 18", "Ягаан алтан, шампан", "#6b2f45", "#f0b8a6", "dark", "modern"],
  ["navy-scholar", "graduation", "Navy Scholar", "Хар хөх, алтан академик", "#1c3557", "#d4af37", "dark", "display"],
  ["bright-grad", "graduation", "Bright Graduate", "Цайвар, орчин үеийн төгсөлт", "#2f5d8a", "#c0503b", "light", "modern"],
  ["romantic-peony", "engagement", "Romantic Peony", "Ягаан цуст цэцэг, алтан бөгж", "#d98ea0", "#b08d57", "light", "serif"],
  ["lavender-dream", "engagement", "Lavender Dream", "Нил ягаан мөрөөдөл", "#8d73b3", "#d5b98c", "light", "script"],
  ["sage-meadow", "baby-shower", "Sage Meadow", "Цайвар ногоон хээрийн навч", "#7d9a76", "#c9a66b", "light", "serif"],
  ["pastel-sky", "baby-shower", "Pastel Sky", "Цайвар цэнхэр, ягаан пастел", "#9fc3e6", "#f4b6c2", "light", "sans"],
  ["executive-navy", "corporate", "Executive Navy", "Хар хөх, алтан тод акцент", "#12294a", "#c9a66b", "dark", "modern"],
  ["clean-slate", "corporate", "Clean Slate", "Цайвар, цэвэрхэн, цэнхэр-ногоон", "#3b5b8c", "#0e9aa7", "light", "sans"],
  ["golden-years", "anniversary", "Golden Years", "Алтан, бордо сарнай", "#b08d57", "#8e3b52", "light", "display"],
  ["midnight-romance", "anniversary", "Midnight Romance", "Шөнийн романтик, шампан", "#3a1830", "#e6b980", "dark", "script"],
  ["warm-hearth", "housewarming", "Warm Hearth", "Дулаан шаргал, тагтаа ногоон", "#c0653b", "#6d8b63", "light", "serif"],
  ["green-home", "housewarming", "Green Home", "Ногоон гэр, алтан гирлянд", "#6d8b63", "#b08d57", "light", "serif"],
  ["bright-party", "celebration", "Bright Party", "Нил ягаан, алтан баяр", "#7a4fa3", "#f0b429", "light", "modern"],
  ["minimal-party", "celebration", "Minimal Party", "Энгийн, сайхан бүтэцтэй", "#2c241b", "#c0503b", "light", "modern"],
];

export const TEMPLATES: TemplateDef[] = TEMPLATE_SEEDS.map(
  ([id, scene, name, blurb, primary, accent, tone, font]) => ({
    id,
    scene,
    name,
    blurb,
    appearance: { primary, accent, tone, font },
  })
);

export function getScene(id: string | undefined | null): SceneDef | undefined {
  return SCENES.find((scene) => scene.id === id);
}

export function getTemplate(id: string | undefined | null) {
  return TEMPLATES.find((template) => template.id === id);
}

export function templatesForScene(sceneId: string): TemplateDef[] {
  return TEMPLATES.filter((template) => template.scene === sceneId);
}

/* First scene to show for an existing event type (old links keep working). */
export function sceneForEvent(eventType: string): SceneDef {
  return (
    SCENES.find((scene) => scene.eventType === eventType) ?? SCENES[SCENES.length - 1]
  );
}

/* Everything a template and tier choice writes into the invitation design. */
export function appearanceForTemplate(
  template: TemplateDef,
  tier: TierId
): Partial<Appearance> {
  const scene = getScene(template.scene);

  return {
    ...template.appearance,
    ...(scene?.defaults ?? {}),
    scene: template.scene,
    tier,
    textColor: "",
  };
}

export const SCENE_OPENING_MS: Record<Exclude<TierId, "classic">, number> = {
  premium: 2400,
  luxury3d: 3400,
};

export function sceneOpeningDuration(
  tier: TierId,
  reducedMotion: boolean
): number {
  if (reducedMotion || tier === "classic") return 250;
  return SCENE_OPENING_MS[tier];
}
