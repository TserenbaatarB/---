"use client";

import { Suspense } from "react";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import WizardStepper from "@/components/WizardStepper";
import dynamic from "next/dynamic";
import {
  getExtrasSnapshot,
  getServerExtrasSnapshot,
  OPEN_STYLES,
  parseExtras,
  subscribeExtras,
} from "@/lib/invitationExtras";
import {
  FrameBox,
  FxOverlay,
  patternStyle,
} from "@/components/InvitationFx";

const AppearanceControls = dynamic(
  () => import("@/components/AppearanceControls"),
  { ssr: false }
);

type GalleryPhoto = {
  id: string;
  url: string;
};

type DesignStyle = {
  id: string;
  name: string;
  description: string;
  background: string;
  accent: string;
  preview: string;
  keywords: string[];
};

type InvitationDetails = {
  title: string;
  names: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  message: string;
  phone: string;
};

type StoredInvitationImages = {
  backgroundId: string | null;
  galleryIds: string[];
};

type StoredInvitationMusic = {
  musicId: string | null;
  musicName: string | null;
  musicType: "none" | "custom";
};

type InvitationDraft = {
  eventType: string;
  template: string;
  title: string;
  names: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  message: string;
  phone: string;
  selectedStyle: string;
  aiPrompt: string;
  activeSection: string;
  backgroundId: string | null;
  galleryIds: string[];
  galleryUrls: string[];
  savedAt: string;
};

const DB_NAME = "urilga-invitation-db";
const DB_VERSION = 1;
const STORE_NAME = "images";

function openImageDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function getStoredImage(
  id: string
): Promise<Blob | null> {
  const db = await openImageDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readonly"
    );

    const store = transaction.objectStore(
      STORE_NAME
    );

    const request = store.get(id);

    request.onsuccess = () => {
      db.close();

      const result = request.result;

      if (result instanceof Blob) {
        resolve(result);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

function formatDate(date: string) {
  if (!date) return "";

  const selectedDate = new Date(
    `${date}T00:00:00`
  );

  if (
    Number.isNaN(selectedDate.getTime())
  ) {
    return date;
  }

  return selectedDate.toLocaleDateString(
    "mn-MN",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
}

function InvitationBuilderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventType =
    searchParams.get("event") ?? "wedding";

  const template =
    searchParams.get("template") ??
    "classic-gold";

  const [title, setTitle] = useState("");
  const [names, setNames] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");

  const [backgroundImage, setBackgroundImage] =
    useState<string | null>(null);

  const [photos, setPhotos] = useState<
    GalleryPhoto[]
  >([]);

  const [loadingImages, setLoadingImages] =
    useState(true);

  const [musicUrl, setMusicUrl] =
    useState<string | null>(null);

  const [musicName, setMusicName] =
    useState<string | null>(null);

  const [loadingMusic, setLoadingMusic] =
    useState(true);

  const [musicType, setMusicType] =
    useState<"none" | "custom">("none");

  const [selectedStyle, setSelectedStyle] =
    useState("romantic");

  const extrasSnapshot = useSyncExternalStore(
    subscribeExtras,
    getExtrasSnapshot,
    getServerExtrasSnapshot
  );

  const appearance = useMemo(
    () => parseExtras(extrasSnapshot).appearance,
    [extrasSnapshot]
  );

  const [aiPrompt, setAiPrompt] =
    useState("");

  const [activeSection, setActiveSection] =
    useState("cover");

  const [saving, setSaving] =
    useState(false);

  const [savedMessage, setSavedMessage] =
    useState("");

  const [buildingDesign, setBuildingDesign] =
    useState(false);

  const [aiMessage, setAiMessage] =
    useState("");

  const [aiError, setAiError] =
    useState("");

  const [styleSearch, setStyleSearch] =
    useState("");

  /*
   * =========================================================
   * DESIGN STYLE LIBRARY
   * =========================================================
   */

  const styles: DesignStyle[] = [
    {
      id: "romantic",
      name: "Romantic",
      description:
        "Зөөлөн, романтик хуримын загвар",
      background:
        "from-[#F7EFE7] via-[#EFE1D4] to-[#E7D3C1]",
      accent: "#A48663",
      preview:
        "linear-gradient(135deg, #F7EFE7 0%, #EFE1D4 50%, #E7D3C1 100%)",
      keywords: [
        "romantic",
        "romance",
        "romantic",
        "хайр",
        "романтик",
        "зөөлөн",
        "хурим",
      ],
    },
    {
      id: "luxury",
      name: "Luxury",
      description:
        "Тансаг, premium мэдрэмж",
      background:
        "from-[#24201C] via-[#3A3027] to-[#181512]",
      accent: "#D5B98C",
      preview:
        "linear-gradient(135deg, #24201C 0%, #3A3027 50%, #181512 100%)",
      keywords: [
        "luxury",
        "premium",
        "luxurious",
        "тансаг",
        "premium",
        "luxury",
        "дээд зэрэглэлийн",
      ],
    },
    {
      id: "minimal",
      name: "Minimal",
      description:
        "Цэвэрхэн, modern дизайн",
      background:
        "from-[#F4F4F2] via-[#ECEBE7] to-[#DFDED8]",
      accent: "#44413D",
      preview:
        "linear-gradient(135deg, #F4F4F2 0%, #ECEBE7 50%, #DFDED8 100%)",
      keywords: [
        "minimal",
        "minimalist",
        "modern",
        "clean",
        "simple",
        "minimal",
        "энгийн",
        "цэвэрхэн",
        "орчин үеийн",
      ],
    },
    {
      id: "garden",
      name: "Garden",
      description:
        "Байгалийн, зөөлөн өнгө",
      background:
        "from-[#E7EEE4] via-[#DCE8D7] to-[#CBDCC5]",
      accent: "#66745E",
      preview:
        "linear-gradient(135deg, #E7EEE4 0%, #DCE8D7 50%, #CBDCC5 100%)",
      keywords: [
        "garden",
        "floral",
        "flower",
        "nature",
        "green",
        "цэцэг",
        "байгаль",
        "ногоон",
        "цэцгэн",
      ],
    },
    {
      id: "black-gold",
      name: "Black & Gold",
      description:
        "Хар ба алтлаг тансаг өнгө",
      background:
        "from-[#0D0C0B] via-[#26211A] to-[#080706]",
      accent: "#C9A65B",
      preview:
        "linear-gradient(135deg, #0D0C0B 0%, #8A713B 50%, #080706 100%)",
      keywords: [
        "black gold",
        "black",
        "gold",
        "хар",
        "алт",
        "алтлаг",
        "хар алт",
      ],
    },
    {
      id: "white-gold",
      name: "White & Gold",
      description:
        "Цэвэр цагаан, алтлаг luxury",
      background:
        "from-[#FFFEFA] via-[#F6F0DF] to-[#E8D7A7]",
      accent: "#A98A45",
      preview:
        "linear-gradient(135deg, #FFFEFA 0%, #F6F0DF 50%, #E8D7A7 100%)",
      keywords: [
        "white gold",
        "white",
        "gold",
        "цагаан",
        "алтлаг",
        "цагаан алт",
      ],
    },
    {
      id: "pastel",
      name: "Pastel",
      description:
        "Зөөлөн pastel өнгө",
      background:
        "from-[#FBE9EE] via-[#EDE7F6] to-[#E3F0F3]",
      accent: "#A77B8A",
      preview:
        "linear-gradient(135deg, #FBE9EE 0%, #EDE7F6 50%, #E3F0F3 100%)",
      keywords: [
        "pastel",
        "soft",
        "pink",
        "pastel",
        "ягаан",
        "зөөлөн өнгө",
      ],
    },
    {
      id: "editorial",
      name: "Editorial",
      description:
        "Сэтгүүл шиг modern стиль",
      background:
        "from-[#F1EEE8] via-[#DAD5CB] to-[#BFB8AA]",
      accent: "#514B43",
      preview:
        "linear-gradient(135deg, #F1EEE8 0%, #DAD5CB 50%, #BFB8AA 100%)",
      keywords: [
        "editorial",
        "magazine",
        "fashion",
        "editorial",
        "сэтгүүл",
        "fashion",
      ],
    },
    {
      id: "vintage",
      name: "Vintage",
      description:
        "Retro, хуучны дулаан мэдрэмж",
      background:
        "from-[#E8D8C0] via-[#C8AD8C] to-[#8D6E4D]",
      accent: "#79563A",
      preview:
        "linear-gradient(135deg, #E8D8C0 0%, #C8AD8C 50%, #8D6E4D 100%)",
      keywords: [
        "vintage",
        "retro",
        "old",
        "classic",
        "retro",
        "хуучны",
        "сонгодог",
      ],
    },
    {
      id: "boho",
      name: "Boho",
      description:
        "Чөлөөт, natural boho стиль",
      background:
        "from-[#EADBC8] via-[#CBB89D] to-[#9A8065]",
      accent: "#735C45",
      preview:
        "linear-gradient(135deg, #EADBC8 0%, #CBB89D 50%, #9A8065 100%)",
      keywords: [
        "boho",
        "bohemian",
        "natural",
        "boho",
        "чөлөөт",
        "natural",
      ],
    },
    {
      id: "royal",
      name: "Royal",
      description:
        "Хааны мэт сүрлэг дизайн",
      background:
        "from-[#21132F] via-[#3A1E52] to-[#120A1A]",
      accent: "#D7B56D",
      preview:
        "linear-gradient(135deg, #21132F 0%, #3A1E52 50%, #120A1A 100%)",
      keywords: [
        "royal",
        "king",
        "queen",
        "purple",
        "хаан",
        "хааны",
        "сүрлэг",
        "нил ягаан",
      ],
    },
    {
      id: "dark-romance",
      name: "Dark Romance",
      description:
        "Харанхуй, романтик cinematic стиль",
      background:
        "from-[#211517] via-[#3A2024] to-[#10090B]",
      accent: "#C68B8F",
      preview:
        "linear-gradient(135deg, #211517 0%, #3A2024 50%, #10090B 100%)",
      keywords: [
        "dark romance",
        "dark",
        "romance",
        "cinematic",
        "харанхуй",
        "романтик",
        "dark",
      ],
    },
    {
      id: "blue-elegant",
      name: "Blue Elegant",
      description:
        "Тайван, elegant цэнхэр дизайн",
      background:
        "from-[#E8EFF6] via-[#CAD9E8] to-[#9DB4CB]",
      accent: "#506B84",
      preview:
        "linear-gradient(135deg, #E8EFF6 0%, #CAD9E8 50%, #9DB4CB 100%)",
      keywords: [
        "blue",
        "elegant",
        "navy",
        "цэнхэр",
        "хөх",
        "elegant",
      ],
    },
    {
      id: "sage",
      name: "Sage",
      description:
        "Sage green, natural modern",
      background:
        "from-[#EDF1E9] via-[#D8E1D2] to-[#B8C9AE]",
      accent: "#66785F",
      preview:
        "linear-gradient(135deg, #EDF1E9 0%, #D8E1D2 50%, #B8C9AE 100%)",
      keywords: [
        "sage",
        "green",
        "natural",
        "ногоон",
        "sage green",
        "байгалийн",
      ],
    },
    {
      id: "terracotta",
      name: "Terracotta",
      description:
        "Дулаан earth tone өнгө",
      background:
        "from-[#F0DED2] via-[#D8AA91] to-[#A86D54]",
      accent: "#87543F",
      preview:
        "linear-gradient(135deg, #F0DED2 0%, #D8AA91 50%, #A86D54 100%)",
      keywords: [
        "terracotta",
        "earth",
        "warm",
        "orange",
        "бор",
        "дулаан",
        "earth tone",
      ],
    },
    {
      id: "blush",
      name: "Blush",
      description:
        "Зөөлөн blush pink",
      background:
        "from-[#FFF0F2] via-[#F4D6DC] to-[#DDAEB9]",
      accent: "#B77C89",
      preview:
        "linear-gradient(135deg, #FFF0F2 0%, #F4D6DC 50%, #DDAEB9 100%)",
      keywords: [
        "blush",
        "pink",
        "rose",
        "pink",
        "ягаан",
        "rose",
        "blush",
      ],
    },
    {
      id: "celestial",
      name: "Celestial",
      description:
        "Од, шөнө, dreamy мэдрэмж",
      background:
        "from-[#11172B] via-[#202D50] to-[#080B18]",
      accent: "#C8B6E8",
      preview:
        "linear-gradient(135deg, #11172B 0%, #202D50 50%, #080B18 100%)",
      keywords: [
        "celestial",
        "stars",
        "night",
        "moon",
        "од",
        "сар",
        "шөнө",
        "тэнгэр",
      ],
    },
    {
      id: "modern-black",
      name: "Modern Black",
      description:
        "Bold, modern хар дизайн",
      background:
        "from-[#171717] via-[#292929] to-[#080808]",
      accent: "#F1F1F1",
      preview:
        "linear-gradient(135deg, #171717 0%, #292929 50%, #080808 100%)",
      keywords: [
        "modern black",
        "black",
        "bold",
        "dark",
        "хар",
        "modern",
        "bold",
      ],
    },
    {
      id: "coastal",
      name: "Coastal",
      description:
        "Далайн тайван, fresh өнгө",
      background:
        "from-[#E8F5F5] via-[#CDE7E8] to-[#9FC8CC]",
      accent: "#507F84",
      preview:
        "linear-gradient(135deg, #E8F5F5 0%, #CDE7E8 50%, #9FC8CC 100%)",
      keywords: [
        "coastal",
        "sea",
        "ocean",
        "beach",
        "далай",
        "цэнхэр",
        "beach",
      ],
    },
    {
      id: "classic",
      name: "Classic",
      description:
        "Мөнхийн сонгодог урилгын стиль",
      background:
        "from-[#F5F0E8] via-[#E7DED0] to-[#D3C3AE]",
      accent: "#78654D",
      preview:
        "linear-gradient(135deg, #F5F0E8 0%, #E7DED0 50%, #D3C3AE 100%)",
      keywords: [
        "classic",
        "traditional",
        "timeless",
        "сонгодог",
        "уламжлалт",
        "classic",
      ],
    },
  ];

  /*
   * =========================================================
   * LOAD DETAILS
   * =========================================================
   */

  useEffect(() => {
    try {
      const storedDetails =
        sessionStorage.getItem(
          "invitation-details"
        );

      if (!storedDetails) return;

      const parsed: InvitationDetails =
        JSON.parse(storedDetails);

      setTitle(parsed.title ?? "");
      setNames(parsed.names ?? "");
      setDate(parsed.date ?? "");
      setTime(parsed.time ?? "");
      setVenue(parsed.venue ?? "");
      setAddress(parsed.address ?? "");
      setMessage(parsed.message ?? "");
      setPhone(parsed.phone ?? "");
    } catch (error) {
      console.error(
        "Invitation details load error:",
        error
      );
    }
  }, []);

  /*
   * =========================================================
   * LOAD DRAFT
   * =========================================================
   */

  useEffect(() => {
    try {
      const storedDraft =
        sessionStorage.getItem(
          "invitation-draft"
        );

      if (!storedDraft) return;

      const draft: InvitationDraft =
        JSON.parse(storedDraft);

      if (
        draft.eventType === eventType &&
        draft.template === template
      ) {
        setSelectedStyle(
          draft.selectedStyle ||
            "romantic"
        );

        setAiPrompt(
          draft.aiPrompt || ""
        );

        setActiveSection(
          draft.activeSection ||
            "cover"
        );
      }
    } catch (error) {
      console.error(
        "Invitation draft load error:",
        error
      );
    }
  }, [eventType, template]);

  /*
   * =========================================================
   * LOAD IMAGES FROM INDEXED DB
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadInvitationImages() {
      setLoadingImages(true);

      try {
        const storedImages =
          sessionStorage.getItem(
            "invitation-images"
          );

        if (!storedImages) {
          if (!cancelled) {
            setBackgroundImage(null);
            setPhotos([]);
            setLoadingImages(false);
          }

          return;
        }

        const imageData: StoredInvitationImages =
          JSON.parse(storedImages);

        if (imageData.backgroundId) {
          const backgroundBlob =
            await getStoredImage(
              imageData.backgroundId
            );

          if (
            backgroundBlob &&
            !cancelled
          ) {
            const backgroundUrl =
              URL.createObjectURL(
                backgroundBlob
              );

            setBackgroundImage(
              backgroundUrl
            );
          }
        } else if (!cancelled) {
          setBackgroundImage(null);
        }

        const loadedPhotos: GalleryPhoto[] =
          [];

        for (
          let index = 0;
          index <
          imageData.galleryIds.length;
          index++
        ) {
          const galleryId =
            imageData.galleryIds[index];

          const galleryBlob =
            await getStoredImage(
              galleryId
            );

          if (
            galleryBlob &&
            !cancelled
          ) {
            const galleryUrl =
              URL.createObjectURL(
                galleryBlob
              );

            loadedPhotos.push({
              id: galleryId,
              url: galleryUrl,
            });
          }
        }

        if (!cancelled) {
          setPhotos(loadedPhotos);
        }
      } catch (error) {
        console.error(
          "Invitation images load error:",
          error
        );

        if (!cancelled) {
          setBackgroundImage(null);
          setPhotos([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingImages(false);
        }
      }
    }

    loadInvitationImages();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * =========================================================
   * LOAD MUSIC FROM INDEXED DB
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function loadInvitationMusic() {
      setLoadingMusic(true);

      try {
        const storedMusic =
          sessionStorage.getItem(
            "invitation-music"
          );

        if (!storedMusic) {
          if (!cancelled) {
            setMusicUrl(null);
            setMusicName(null);
            setMusicType("none");
            setLoadingMusic(false);
          }

          return;
        }

        const musicData: StoredInvitationMusic =
          JSON.parse(storedMusic);

        if (
          !musicData.musicId ||
          musicData.musicType !== "custom"
        ) {
          if (!cancelled) {
            setMusicUrl(null);
            setMusicName(null);
            setMusicType("none");
            setLoadingMusic(false);
          }

          return;
        }

        const musicBlob =
          await getStoredImage(
            musicData.musicId
          );

        if (
          musicBlob &&
          !cancelled
        ) {
          objectUrl =
            URL.createObjectURL(
              musicBlob
            );

          setMusicUrl(objectUrl);
          setMusicName(
            musicData.musicName ??
              "Таны сонгосон дуу"
          );
          setMusicType("custom");
        } else if (!cancelled) {
          setMusicUrl(null);
          setMusicName(null);
          setMusicType("none");
        }
      } catch (error) {
        console.error(
          "Invitation music load error:",
          error
        );

        if (!cancelled) {
          setMusicUrl(null);
          setMusicName(null);
          setMusicType("none");
        }
      } finally {
        if (!cancelled) {
          setLoadingMusic(false);
        }
      }
    }

    loadInvitationMusic();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, []);

  /*
   * =========================================================
   * CLEANUP BLOB URLS
   * =========================================================
   */

  useEffect(() => {
    return () => {
      if (backgroundImage) {
        URL.revokeObjectURL(
          backgroundImage
        );
      }

      photos.forEach((photo) => {
        if (
          photo.url.startsWith(
            "blob:"
          )
        ) {
          URL.revokeObjectURL(
            photo.url
          );
        }
      });
    };
  }, []);

  /*
   * =========================================================
   * AI DESIGNER
   * =========================================================
   */

  async function buildDesignFromPrompt() {
    const prompt = aiPrompt
      .trim();

    if (!prompt) {
      setAiError(
        "Эхлээд ямар дизайн хүсэж байгаагаа бичнэ үү."
      );
      setAiMessage("");
      return;
    }

    setBuildingDesign(true);
    setAiMessage("");
    setAiError("");

    try {
      const response = await fetch("/api/ai/design", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          eventType,
          styles: styles.map(({ id, name, description }) => ({
            id,
            name,
            description,
          })),
        }),
      });
      const result: unknown = await response.json();

      if (
        typeof result !== "object" ||
        result === null ||
        Array.isArray(result)
      ) {
        throw new Error("Gemini-ээс буруу хариу ирлээ.");
      }

      if (!response.ok) {
        const errorMessage =
          "error" in result && typeof result.error === "string"
            ? result.error
            : "Gemini хүсэлтийг боловсруулж чадсангүй.";
        throw new Error(
          errorMessage
        );
      }

      const selected = styles.find(
        (style) =>
          style.id ===
          ("styleId" in result ? result.styleId : undefined)
      );

      if (!selected) {
        throw new Error("Gemini боломжит загвараас сонгож чадсангүй.");
      }

      setSelectedStyle(selected.id);
      setAiMessage(`Дизайн үүсгэлээ — ${selected.name}`);
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "Gemini-тэй холбогдож чадсангүй. Дахин оролдоно уу."
      );
    } finally {
      setBuildingDesign(false);
    }
  }

  /*
   * =========================================================
   * SEARCH STYLES
   * =========================================================
   */

  const filteredStyles = useMemo(() => {
    const query =
      styleSearch
        .trim()
        .toLowerCase();

    if (!query) {
      return [];
    }

    return styles.filter((style) => {
      const searchableText =
        [
          style.name,
          style.description,
          ...style.keywords,
        ]
          .join(" ")
          .toLowerCase();

      return searchableText.includes(
        query
      );
    });
  }, [styleSearch]);

  const currentStyle = useMemo(() => {
    return (
      styles.find(
        (style) =>
          style.id === selectedStyle
      ) ?? styles[0]
    );
  }, [selectedStyle]);

  /*
   * =========================================================
   * DEMO PHOTO
   * =========================================================
   */

  function handleAddDemoPhoto() {
    const demoUrl =
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80";

    setPhotos((current) => [
      ...current,
      {
        id: `demo-${Date.now()}`,
        url: demoUrl,
      },
    ]);
  }

  /*
   * =========================================================
   * SECTIONS
   * =========================================================
   */

  const sections = [
    {
      id: "cover",
      name: "Cover",
      description:
        "Үндсэн нүүр хэсэг",
    },
    {
      id: "event",
      name: "Event",
      description:
        "Арга хэмжээний мэдээлэл",
    },
    {
      id: "gallery",
      name: "Gallery",
      description:
        "Зургийн цомог",
    },
    {
      id: "message",
      name: "Message",
      description:
        "Мэндчилгээ",
    },
    {
      id: "location",
      name: "Location",
      description:
        "Байршил",
    },
    {
      id: "rsvp",
      name: "RSVP",
      description:
        "Холбоо барих",
    },
  ];

  const formattedDate =
    formatDate(date);

  const livePreviewPattern = useMemo(
    () =>
      patternStyle(
        appearance.pattern,
        appearance.accent,
        appearance.tone
      ),
    [
      appearance.accent,
      appearance.pattern,
      appearance.tone,
    ]
  );

  /*
   * =========================================================
   * SAVE
   * =========================================================
   */

  async function handleSave() {
    setSaving(true);
    setSavedMessage("");

    try {
      const storedImages =
        sessionStorage.getItem(
          "invitation-images"
        );

      let imageData:
        | StoredInvitationImages
        | null = null;

      if (storedImages) {
        imageData =
          JSON.parse(storedImages);
      }

      const storedMusic =
        sessionStorage.getItem(
          "invitation-music"
        );

      let musicData:
        | StoredInvitationMusic
        | null = null;

      if (storedMusic) {
        musicData =
          JSON.parse(storedMusic);
      }

      const draft: InvitationDraft = {
        eventType,
        template,
        title,
        names,
        date,
        time,
        venue,
        address,
        message,
        phone,
        selectedStyle,
        aiPrompt,
        activeSection,
        backgroundId:
          imageData?.backgroundId ??
          null,
        galleryIds:
          imageData?.galleryIds ?? [],
        galleryUrls: photos.map(
          (photo) => photo.url
        ),
        savedAt:
          new Date().toISOString(),
      };

      sessionStorage.setItem(
        "invitation-draft",
        JSON.stringify(draft)
      );

      sessionStorage.setItem(
        "invitation-details",
        JSON.stringify({
          title,
          names,
          date,
          time,
          venue,
          address,
          message,
          phone,
          musicId:
            musicData?.musicId ??
            null,
          musicName:
            musicData?.musicName ??
            null,
          musicType:
            musicData?.musicType ??
            "none",
        })
      );

      setSavedMessage(
        "Амжилттай хадгалагдлаа ✓"
      );

      setTimeout(() => {
        setSavedMessage("");
      }, 2500);
    } catch (error) {
      console.error(
        "Invitation save error:",
        error
      );

      setSavedMessage(
        "Хадгалах үед алдаа гарлаа"
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =========================================================
   * PREVIEW
   * =========================================================
   */

  function goToStep(target: 1 | 2 | 3 | 4) {
    if (target >= 3) return;

    router.push(
      `/dashboard/invitations/new/details?event=${encodeURIComponent(
        eventType
      )}&template=${encodeURIComponent(
        template
      )}&step=${target}`
    );
  }

  async function handlePreview() {
    await handleSave();

    router.push(
      `/dashboard/invitations/new/preview?event=${encodeURIComponent(
        eventType
      )}&template=${encodeURIComponent(
        template
      )}`
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F1EC] text-[#171717]">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 lg:px-8">
          <BrandLogo />

          <div className="hidden text-xs text-black/35 md:block">
            {eventType} · {template}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold transition hover:bg-black/5"
            >
              ← Буцах
            </button>

            {savedMessage && (
              <div
                className={`hidden rounded-full px-3 py-2 text-[10px] font-semibold sm:block ${
                  savedMessage.includes("✓")
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {savedMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Хадгалж байна..."
                : "Хадгалах"}
            </button>

            <button
              type="button"
              onClick={handlePreview}
              disabled={saving}
              className="rounded-full bg-black px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Үргэлжлүүлэх →
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-5 pt-5 lg:px-8">
        <WizardStepper
          step={3}
          showHeading={false}
          onStepClick={(target) => goToStep(target)}
        />
      </div>

      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[250px_minmax(0,1fr)_330px]">
        {/* =====================================================
            LEFT SIDEBAR
        ===================================================== */}

        <aside className="hidden min-h-[calc(100vh-73px)] border-r border-black/10 bg-white lg:block">
          <div className="sticky top-[73px] p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/35">
              Sections
            </div>

            <div className="mt-4 space-y-1.5">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() =>
                    setActiveSection(
                      section.id
                    )
                  }
                  className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                    activeSection ===
                    section.id
                      ? "bg-black text-white"
                      : "hover:bg-black/5"
                  }`}
                >
                  <div className="text-sm font-semibold">
                    {section.name}
                  </div>

                  <div
                    className={`mt-1 text-[10px] ${
                      activeSection ===
                      section.id
                        ? "text-white/60"
                        : "text-black/35"
                    }`}
                  >
                    {
                      section.description
                    }
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-black/10 bg-[#F8F5F0] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/35">
                Images
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-black/50">
                    Background
                  </span>

                  <span
                    className={
                      backgroundImage
                        ? "font-semibold text-green-700"
                        : "text-black/30"
                    }
                  >
                    {backgroundImage
                      ? "✓ Added"
                      : "None"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-black/50">
                    Gallery
                  </span>

                  <span className="font-semibold">
                    {photos.length}
                  </span>
                </div>
              </div>
            </div>

            {/* MUSIC STATUS */}

            <div className="mt-3 rounded-2xl border border-black/10 bg-[#F8F5F0] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/35">
                Music
              </div>

              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-black/50">
                    Background music
                  </div>

                  {loadingMusic ? (
                    <div className="mt-1 text-[10px] text-black/30">
                      Loading...
                    </div>
                  ) : musicType ===
                    "custom" ? (
                    <div className="mt-1 truncate text-[10px] font-semibold text-green-700">
                      ✓ {musicName}
                    </div>
                  ) : (
                    <div className="mt-1 text-[10px] text-black/30">
                      None
                    </div>
                  )}
                </div>

                {musicType ===
                  "custom" && (
                  <span className="shrink-0 text-base">
                    🎵
                  </span>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* =====================================================
            MAIN BUILDER
        ===================================================== */}

        <section className="min-w-0 p-5 sm:p-7 lg:p-10">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A48663]">
                AI Invitation Builder
              </div>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Урилгаа өөрийнхөөрөө загварчлаарай
              </h1>

              <p className="mt-2 text-sm text-black/40">
                Хүссэн дизайнаа AI Designer-д
                бичээд шууд үүсгээрэй.
              </p>
            </div>

            <AppearanceControls
              appearance={appearance}
            />

            {/* =================================================
                MUSIC
            ================================================= */}

            <div className="mb-6 rounded-[28px] border border-black/10 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F4F1EC] text-lg">
                  🎵
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    Background Music
                  </div>

                  <div className="mt-1 text-xs leading-5 text-black/40">
                    Details хэсгээс нэмсэн таны
                    сонгосон дуу энд автоматаар
                    орно.
                  </div>

                  {loadingMusic ? (
                    <div className="mt-4 rounded-2xl bg-[#F8F5F0] p-4 text-xs text-black/35">
                      Дууг ачаалж байна...
                    </div>
                  ) : musicUrl &&
                    musicType ===
                      "custom" ? (
                    <div className="mt-4 rounded-2xl border border-black/10 bg-[#F8F5F0] p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                          ♪
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] uppercase tracking-[0.15em] text-black/35">
                            Your music
                          </div>

                          <div className="mt-1 truncate text-xs font-semibold">
                            {musicName ||
                              "Таны сонгосон дуу"}
                          </div>
                        </div>

                        <div className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-[9px] font-semibold text-green-700">
                          ✓ Added
                        </div>
                      </div>

                      <audio
                        controls
                        preload="metadata"
                        src={musicUrl}
                        className="mt-4 w-full"
                      />

                      <div className="mt-3 text-[10px] leading-5 text-black/35">
                        Энэ дуу урилга нийтлэгдсэний
                        дараа public урилган дээр
                        тоглогдоно.
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[#F8F5F0] p-5 text-center">
                      <div className="text-xl">
                        🎶
                      </div>

                      <div className="mt-2 text-xs font-semibold text-black/55">
                        Дуу сонгогдоогүй байна
                      </div>

                      <div className="mt-1 text-[10px] text-black/35">
                        Details хэсэг рүү буцаж өөрийн
                        MP3 дуугаа нэмнэ үү.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* =================================================
                AI DESIGNER
            ================================================= */}

            <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-lg text-white">
                  ✦
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    Gemini AI Designer
                  </div>

                  <div className="mt-1 text-xs leading-5 text-black/40">
                    Хүссэн урилгынхаа дизайн,
                    өнгө болон мэдрэмжийг
                    тайлбарлаарай.
                  </div>

                  <textarea
                    value={aiPrompt}
                    onChange={(e) =>
                      setAiPrompt(
                        e.target.value
                      )
                    }
                    rows={3}
                    maxLength={1200}
                    placeholder="Жишээ: Хар background-тэй, алтлаг детальтай, тансаг хуримын урилга"
                    className="mt-4 w-full resize-none rounded-2xl border border-black/10 bg-[#F8F5F0] px-4 py-3 text-sm outline-none transition focus:border-black/25 focus:bg-white"
                  />

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-h-[20px] text-[10px]">
                      {aiError ? (
                        <span className="font-semibold text-red-700">
                          {aiError}
                        </span>
                      ) : aiMessage ? (
                        <span className="font-semibold text-green-700">
                          ✓ {aiMessage}
                        </span>
                      ) : (
                        <span className="text-black/30">
                          Жишээ: luxury, minimal,
                          garden, black & gold...
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={
                        buildDesignFromPrompt
                      }
                      disabled={
                        buildingDesign ||
                        !aiPrompt.trim()
                      }
                      className="rounded-full bg-black px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {buildingDesign
                        ? "Дизайн үүсгэж байна..."
                        : "✨ Дизайн үүсгэх"}
                    </button>
                  </div>

                  {aiPrompt.trim() && (
                    <div className="mt-4 rounded-2xl border border-black/10 bg-[#F8F5F0] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[9px] uppercase tracking-[0.16em] text-black/35">
                            Gemini AI Designer
                          </div>

                          <div className="mt-1 text-xs font-semibold">
                            {currentStyle.name}
                          </div>

                        </div>

                        <div
                          className="h-9 w-9 rounded-xl border border-black/10"
                          style={{
                            background:
                              currentStyle.preview,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* =================================================
                STYLE SEARCH
            ================================================= */}

            <div className="mt-6 rounded-[28px] border border-black/10 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">
                    Загвар сонгох
                  </div>

                  <div className="mt-1 text-xs text-black/40">
                    Хүссэн загвараа хайж сонгоно уу.
                  </div>
                </div>

                <div
                  className="hidden rounded-full border border-black/10 px-3 py-1.5 text-[10px] font-semibold sm:block"
                  style={{
                    background:
                      currentStyle.preview,
                  }}
                >
                  <span
                    className={
                      selectedStyle ===
                        "luxury" ||
                      selectedStyle ===
                        "black-gold" ||
                      selectedStyle ===
                        "dark-romance" ||
                      selectedStyle ===
                        "royal" ||
                      selectedStyle ===
                        "celestial" ||
                      selectedStyle ===
                        "modern-black"
                        ? "text-white"
                        : "text-black/60"
                    }
                  >
                    {currentStyle.name}
                  </span>
                </div>
              </div>

              <div className="relative mt-5">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-black/35">
                  🔎
                </span>

                <input
                  value={styleSearch}
                  onChange={(e) =>
                    setStyleSearch(
                      e.target.value
                    )
                  }
                  placeholder="Загвар хайх..."
                  className="w-full rounded-2xl border border-black/10 bg-[#F8F5F0] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-black/25 focus:bg-white"
                />

                {styleSearch && (
                  <button
                    type="button"
                    onClick={() =>
                      setStyleSearch("")
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs text-black/35 hover:bg-black/5 hover:text-black"
                  >
                    ✕
                  </button>
                )}
              </div>

              {styleSearch.trim() ? (
                <div className="mt-4">
                  {filteredStyles.length ===
                  0 ? (
                    <div className="rounded-2xl bg-[#F8F5F0] p-6 text-center">
                      <div className="text-lg">
                        🔎
                      </div>

                      <div className="mt-2 text-xs font-semibold">
                        Загвар олдсонгүй
                      </div>

                      <div className="mt-1 text-[10px] text-black/35">
                        Өөр keyword хайж үзээрэй.
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredStyles.map(
                        (style) => (
                          <button
                            key={
                              style.id
                            }
                            type="button"
                            onClick={() => {
                              setSelectedStyle(
                                style.id
                              );
                              setAiMessage(
                                `${style.name} загвар сонгогдлоо`
                              );
                            }}
                            className={`group rounded-2xl border p-4 text-left transition ${
                              selectedStyle ===
                              style.id
                                ? "border-black bg-black text-white shadow-md"
                                : "border-black/10 bg-[#F8F5F0] hover:border-black/20 hover:bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <div
                                  className="h-10 w-10 shrink-0 rounded-xl border border-black/10 shadow-inner"
                                  style={{
                                    background:
                                      style.preview,
                                  }}
                                />

                                <div className="min-w-0">
                                  <div className="text-sm font-semibold">
                                    {
                                      style.name
                                    }
                                  </div>

                                  <div
                                    className={`mt-1 text-xs ${
                                      selectedStyle ===
                                      style.id
                                        ? "text-white/55"
                                        : "text-black/40"
                                    }`}
                                  >
                                    {
                                      style.description
                                    }
                                  </div>
                                </div>
                              </div>

                              {selectedStyle ===
                                style.id && (
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                                  ✓
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[#F8F5F0] p-5 text-center">
                  <div className="text-xs font-semibold text-black/60">
                    Загвар хайж сонгоно уу
                  </div>

                  <div className="mt-1 text-[10px] text-black/35">
                    Жишээ: Luxury, Minimal,
                    Garden, Gold, Vintage...
                  </div>
                </div>
              )}
            </div>

            {/* =================================================
                SECTION PREVIEW
            ================================================= */}

            <div className="mt-6 rounded-[28px] border border-black/10 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">
                    {sections.find(
                      (section) =>
                        section.id ===
                        activeSection
                    )?.name ??
                      "Cover"}
                  </div>

                  <div className="mt-1 text-xs text-black/40">
                    Энэ хэсгийн preview
                  </div>
                </div>

                <div className="rounded-full bg-black/5 px-3 py-1.5 text-[10px] font-semibold">
                  EDITING
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-[#F8F5F0] p-5">
                {activeSection ===
                  "cover" && (
                  <div>
                    <div className="text-xs font-semibold text-black/35">
                      COVER
                    </div>

                    <div className="mt-3 text-lg font-semibold">
                      {title ||
                        "Урилгын гарчиг"}
                    </div>

                    <div className="mt-2 font-serif text-3xl italic">
                      {names ||
                        "Бат & Номин"}
                    </div>

                    <div className="mt-4 text-xs text-black/40">
                      {formattedDate ||
                        "2027 оны 6 сарын 20"}
                    </div>
                  </div>
                )}

                {activeSection ===
                  "event" && (
                  <div>
                    <div className="text-xs font-semibold text-black/35">
                      EVENT
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white p-4">
                        <div className="text-[10px] text-black/35">
                          DATE
                        </div>

                        <div className="mt-1 text-sm font-semibold">
                          {formattedDate ||
                            "Огноо"}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <div className="text-[10px] text-black/35">
                          TIME
                        </div>

                        <div className="mt-1 text-sm font-semibold">
                          {time || "Цаг"}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <div className="text-[10px] text-black/35">
                          VENUE
                        </div>

                        <div className="mt-1 text-sm font-semibold">
                          {venue ||
                            "Байршил"}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <div className="text-[10px] text-black/35">
                          ADDRESS
                        </div>

                        <div className="mt-1 text-sm font-semibold">
                          {address ||
                            "Хаяг"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection ===
                  "gallery" && (
                  <div>
                    <div className="text-xs font-semibold text-black/35">
                      GALLERY
                    </div>

                    {loadingImages ? (
                      <div className="mt-4 rounded-2xl bg-white p-8 text-center text-xs text-black/35">
                        Зургийг ачаалж байна...
                      </div>
                    ) : photos.length ===
                      0 ? (
                      <div className="mt-4 rounded-2xl bg-white p-8 text-center">
                        <div className="text-2xl">
                          📸
                        </div>

                        <div className="mt-2 text-xs text-black/40">
                          Gallery зураг
                          одоогоор алга.
                        </div>

                        <button
                          type="button"
                          onClick={
                            handleAddDemoPhoto
                          }
                          className="mt-4 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white"
                        >
                          Demo зураг нэмэх
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {photos.map(
                          (photo) => (
                            <div
                              key={
                                photo.id
                              }
                              className="aspect-square overflow-hidden rounded-2xl bg-white"
                            >
                              <img
                                src={
                                  photo.url
                                }
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeSection ===
                  "message" && (
                  <div>
                    <div className="text-xs font-semibold text-black/35">
                      MESSAGE
                    </div>

                    <p className="mt-4 text-sm leading-7 text-black/65">
                      {message ||
                        "Урилгын мэндчилгээ энд харагдана."}
                    </p>
                  </div>
                )}

                {activeSection ===
                  "location" && (
                  <div>
                    <div className="text-xs font-semibold text-black/35">
                      LOCATION
                    </div>

                    <div className="mt-4 rounded-2xl bg-white p-5">
                      <div className="text-sm font-semibold">
                        {venue ||
                          "Байршил"}
                      </div>

                      <div className="mt-1 text-xs text-black/40">
                        {address ||
                          "Хаяг"}
                      </div>
                    </div>
                  </div>
                )}

                {activeSection ===
                  "rsvp" && (
                  <div>
                    <div className="text-xs font-semibold text-black/35">
                      RSVP
                    </div>

                    <div className="mt-4 rounded-2xl bg-white p-5">
                      <div className="text-sm font-semibold">
                        Холбоо барих
                      </div>

                      <div className="mt-2 text-sm text-black/55">
                        {phone ||
                          "Утасны дугаар"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* MOBILE SECTIONS */}

            <div className="mt-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() =>
                    setActiveSection(
                      section.id
                    )
                  }
                  className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold ${
                    activeSection ===
                    section.id
                      ? "bg-black text-white"
                      : "bg-white text-black/60"
                  }`}
                >
                  {section.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            LIVE PREVIEW
        ===================================================== */}

        <aside className="border-l border-black/10 bg-white p-5 sm:p-7 lg:min-h-[calc(100vh-73px)] lg:p-8">
          <div className="sticky top-[95px]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35">
                  Live Preview
                </div>

                <div className="mt-1 text-sm font-semibold">
                  Урилга
                </div>
              </div>

              <div className="rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-semibold text-green-700">
                LIVE
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between rounded-2xl border border-black/10 bg-[#F8F5F0] px-4 py-3">
              <div>
                <div className="text-[9px] uppercase tracking-[0.16em] text-black/35">
                  Current style
                </div>

                <div className="mt-1 text-xs font-semibold">
                  {currentStyle.name}
                </div>

                <div className="mt-1 text-[10px] text-black/45">
                  Нээх хэлбэр:{" "}
                  {OPEN_STYLES.find(
                    (style) => style.id === appearance.open
                  )?.label ?? appearance.open}
                </div>
              </div>

              <div
                className="h-8 w-8 rounded-xl border border-black/10"
                style={{
                  background:
                    currentStyle.preview,
                }}
              />
            </div>

            <div className="mx-auto w-full max-w-[330px] rounded-[38px] border-[8px] border-[#171717] bg-[#171717] p-1.5 shadow-2xl shadow-black/20">
              <div
                className="relative aspect-[9/18] overflow-hidden rounded-[30px] bg-[#EEE6DA]"
                style={{
                  backgroundColor: livePreviewPattern.backgroundColor,
                }}
              >
                {backgroundImage && (
                  <img
                    src={backgroundImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}

                <div
                  className={`absolute inset-0 bg-gradient-to-b ${currentStyle.background} ${
                    backgroundImage
                      ? "opacity-35 mix-blend-multiply"
                      : "opacity-65"
                  }`}
                />

                <div
                  className="pointer-events-none absolute inset-0 opacity-40"
                  style={{
                    backgroundImage: livePreviewPattern.backgroundImage,
                    backgroundSize: livePreviewPattern.backgroundSize,
                  }}
                />

                <div
                  className={`absolute inset-0 ${
                    backgroundImage
                      ? "bg-black/20"
                      : "bg-black/0"
                  }`}
                />

                <div
                  className={`relative z-10 flex h-full flex-col items-center justify-between px-6 py-10 text-center ${
                    appearance.tone === "dark"
                      ? "text-white"
                      : "text-[#24211E]"
                  }`}
                >
                  <div>
                    <div
                      className={`text-[8px] font-medium uppercase tracking-[0.35em] ${
                        appearance.tone === "dark"
                          ? "text-white/75"
                          : "text-black/55"
                      }`}
                    >
                      {title ||
                        "OUR SPECIAL DAY"}
                    </div>
                  </div>

                  <div>
                    <div className="font-serif text-3xl italic leading-tight drop-shadow-sm">
                      {names ||
                        "Бат & Номин"}
                    </div>

                    <div
                      className={`mt-3 text-[9px] tracking-[0.2em] ${
                        appearance.tone === "dark"
                          ? "text-white/75"
                          : "text-black/55"
                      }`}
                    >
                      {formattedDate ||
                        "2027 оны 6 сарын 20"}

                      {time
                        ? ` · ${time}`
                        : ""}
                    </div>
                  </div>

                  <FrameBox
                    frame={appearance.frame}
                    accent={appearance.accent}
                    className="h-24 w-24 shrink-0 shadow-xl"
                  >
                    <div
                      className="flex h-full w-full items-center justify-center overflow-hidden backdrop-blur-sm"
                      style={{
                        backgroundColor: `${appearance.accent}33`,
                      }}
                    >
                      {photos[0] ? (
                        <img
                          src={photos[0].url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">
                          💍
                        </span>
                      )}
                    </div>
                  </FrameBox>

                  <div className="max-w-[230px]">
                    <p
                      className={`text-[10px] leading-5 ${
                        appearance.tone === "dark"
                          ? "text-white/85"
                          : "text-black/65"
                      }`}
                    >
                      {message ||
                        "Бидний амьдралын хамгийн сайхан мөчийг хамтдаа хуваалцахыг урьж байна."}
                    </p>

                    <div className="mt-4 text-[10px] font-medium">
                      📍{" "}
                      {venue ||
                        "Байршил"}
                    </div>

                    <div
                      className={`mt-1 text-[8px] ${
                        appearance.tone === "dark"
                          ? "text-white/60"
                          : "text-black/45"
                      }`}
                    >
                      {address ||
                        "Хаяг"}
                    </div>
                  </div>

                  {photos.length >
                    1 && (
                    <div className="flex gap-1.5">
                      {photos
                        .slice(0, 5)
                        .map(
                          (photo) => (
                            <img
                              key={
                                photo.id
                              }
                              src={
                                photo.url
                              }
                              alt=""
                              className="h-7 w-7 rounded-full border border-white/50 object-cover"
                            />
                          )
                        )}
                    </div>
                  )}
                </div>

                <FxOverlay
                  animation={appearance.animation}
                  accent={appearance.accent}
                  className="absolute"
                />
              </div>
            </div>

            {/* MUSIC PLAYER */}

            <div className="mx-auto mt-5 max-w-[330px] rounded-2xl border border-black/10 bg-[#F8F5F0] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.16em] text-black/35">
                    Background Music
                  </div>

                  <div className="mt-1 text-xs font-semibold">
                    {loadingMusic
                      ? "Loading..."
                      : musicType ===
                        "custom"
                      ? "🎵 Дуу нэмэгдсэн"
                      : "Дуу сонгогдоогүй"}
                  </div>
                </div>

                {musicType ===
                  "custom" && (
                  <div className="rounded-full bg-green-50 px-2.5 py-1 text-[9px] font-semibold text-green-700">
                    READY
                  </div>
                )}
              </div>

              {musicUrl &&
                musicType ===
                  "custom" && (
                  <>
                    <div className="mt-2 truncate text-[10px] text-black/45">
                      {musicName}
                    </div>

                    <audio
                      controls
                      preload="metadata"
                      src={musicUrl}
                      className="mt-3 w-full"
                    />
                  </>
                )}
            </div>

            <div className="mx-auto mt-3 max-w-[330px] rounded-2xl border border-black/10 bg-[#F8F5F0] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-black/45">
                  Background
                </span>

                <span
                  className={`text-xs font-semibold ${
                    backgroundImage
                      ? "text-green-700"
                      : "text-black/30"
                  }`}
                >
                  {loadingImages
                    ? "Loading..."
                    : backgroundImage
                    ? "✓ Loaded"
                    : "None"}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-black/45">
                  Gallery
                </span>

                <span className="text-xs font-semibold">
                  {loadingImages
                    ? "..."
                    : `${photos.length} зураг`}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-black/45">
                  Music
                </span>

                <span
                  className={`text-xs font-semibold ${
                    musicType ===
                    "custom"
                      ? "text-green-700"
                      : "text-black/30"
                  }`}
                >
                  {loadingMusic
                    ? "..."
                    : musicType ===
                      "custom"
                    ? "✓ Added"
                    : "None"}
                </span>
              </div>
            </div>

            <div className="mx-auto mt-3 max-w-[330px] text-center text-[10px] leading-5 text-black/30">
              Details хэсгээс нэмсэн
              Background, Gallery болон
              Music энд автоматаар орно.
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function InvitationBuilderPage() {
  return (
    <Suspense fallback={null}>
      <InvitationBuilderPageContent />
    </Suspense>
  );
}
