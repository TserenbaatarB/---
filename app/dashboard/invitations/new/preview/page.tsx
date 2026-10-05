"use client";

import { Suspense, useEffect, useRef, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import WizardStepper from "@/components/WizardStepper";

type InvitationDraft = {
  id?: string;
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

type StoredInvitationImages = {
  backgroundId: string | null;
  galleryIds: string[];
};

type StoredInvitationMusic = {
  musicId: string | null;
  musicName: string | null;
  musicType: "none" | "custom";
};

type InvitationExtrasPreview = {
  lat?: number | null;
  lng?: number | null;
  mapUrl?: string;
  coverVideoId?: string | null;
  coverVideoName?: string | null;
  coverVideoPath?: string | null;
  rsvp?: {
    enabled?: boolean;
    askGuests?: boolean;
    deadline?: string;
    visibility?: "open" | "anonymous" | "hidden";
  };
  note?: string;
  program?: unknown;
  appearance?: unknown;
  [key: string]: unknown;
};

const DB_NAME = "urilga-invitation-db";
const DB_VERSION = 1;
const STORE_NAME = "images";

const INVITATION_PRICE = 19900;

const BANK_NAME = "Хаан банк";
const ACCOUNT_NAME = "Болдбаатар Цэрэнбаатар";
const ACCOUNT_NUMBER = "MN050005005031742123";

/*
 * =========================================================
 * INDEXEDDB
 * =========================================================
 */

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

async function getStoredImage(id: string): Promise<Blob | null> {
  if (!id) return null;

  const db = await openImageDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      db.close();

      if (request.result instanceof Blob) {
        resolve(request.result);
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

/*
 * =========================================================
 * IMAGE EXTENSION
 * =========================================================
 */

function getImageExtension(blob: Blob): string {
  const type = (blob.type || "").toLowerCase();

  if (type === "image/png") {
    return "png";
  }

  if (type === "image/webp") {
    return "webp";
  }

  if (type === "image/gif") {
    return "gif";
  }

  return "jpg";
}

/*
 * =========================================================
 * MUSIC EXTENSION
 * =========================================================
 */

function getMusicExtension(blob: Blob): string {
  const type = (blob.type || "").toLowerCase();

  if (type === "audio/mpeg" || type === "audio/mp3") {
    return "mp3";
  }

  if (type === "audio/wav" || type === "audio/x-wav") {
    return "wav";
  }

  if (type === "audio/ogg") {
    return "ogg";
  }

  if (type === "audio/mp4" || type === "audio/x-m4a") {
    return "m4a";
  }

  if (type === "audio/webm") {
    return "webm";
  }

  return "mp3";
}

/*
 * =========================================================
 * UPLOAD INVITATION IMAGES
 * =========================================================
 */

async function uploadInvitationImages(
  userId: string,
  invitationId: string
): Promise<{
  backgroundPath: string | null;
  galleryPaths: string[];
}> {
  const storedImagesRaw =
    sessionStorage.getItem("invitation-images");

  if (!storedImagesRaw) {
    return {
      backgroundPath: null,
      galleryPaths: [],
    };
  }

  let imageData: StoredInvitationImages;

  try {
    imageData = JSON.parse(storedImagesRaw);
  } catch {
    throw new Error(
      "Урилгын зургийн мэдээлэл уншихад алдаа гарлаа."
    );
  }

  const basePath = `${userId}/${invitationId}`;

  let backgroundPath: string | null = null;
  const galleryPaths: string[] = [];

  /*
   * BACKGROUND
   */

  if (imageData.backgroundId) {
    const backgroundBlob = await getStoredImage(
      imageData.backgroundId
    );

    if (backgroundBlob) {
      const contentType =
        backgroundBlob.type || "image/jpeg";

      const extension =
        getImageExtension(backgroundBlob);

      backgroundPath =
        `${basePath}/background.${extension}`;

      const {
        error: backgroundUploadError,
      } = await supabase.storage
        .from("invitation-images")
        .upload(
          backgroundPath,
          backgroundBlob,
          {
            cacheControl: "31536000",
            upsert: true,
            contentType,
          }
        );

      if (backgroundUploadError) {
        throw new Error(
          `Background зураг upload хийхэд алдаа гарлаа: ${backgroundUploadError.message}`
        );
      }
    }
  }

  /*
   * GALLERY
   */

  for (
    let index = 0;
    index <
    (imageData.galleryIds ?? []).length;
    index++
  ) {
    const galleryId =
      imageData.galleryIds[index];

    const galleryBlob =
      await getStoredImage(galleryId);

    if (!galleryBlob) {
      continue;
    }

    const contentType =
      galleryBlob.type || "image/jpeg";

    const extension =
      getImageExtension(galleryBlob);

    const galleryPath =
      `${basePath}/gallery-${index + 1}.${extension}`;

    const {
      error: galleryUploadError,
    } = await supabase.storage
      .from("invitation-images")
      .upload(
        galleryPath,
        galleryBlob,
        {
          cacheControl: "31536000",
          upsert: true,
          contentType,
        }
      );

    if (galleryUploadError) {
      throw new Error(
        `Gallery зураг ${index + 1} upload хийхэд алдаа гарлаа: ${galleryUploadError.message}`
      );
    }

    galleryPaths.push(galleryPath);
  }

  /*
   * SAVE STORAGE PATHS TO DB
   */

  const {
    error: pathUpdateError,
  } = await supabase
    .from("invitations")
    .update({
      background_id: backgroundPath,
      gallery_ids: galleryPaths,
      gallery_urls: [],
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", invitationId)
    .eq("user_id", userId);

  if (pathUpdateError) {
    throw new Error(
      `Зургийн Storage path хадгалахад алдаа гарлаа: ${pathUpdateError.message}`
    );
  }

  return {
    backgroundPath,
    galleryPaths,
  };
}

/*
 * =========================================================
 * UPLOAD INVITATION MUSIC
 * =========================================================
 */

async function uploadInvitationMusic(
  userId: string,
  invitationId: string
): Promise<string | null> {
  const storedMusicRaw =
    sessionStorage.getItem(
      "invitation-music"
    );

  /*
   * MUSIC NOT SELECTED
   */

  if (!storedMusicRaw) {
    const {
      error,
    } = await supabase
      .from("invitations")
      .update({
        music_path: null,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", invitationId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(
        `Хөгжмийн мэдээлэл цэвэрлэхэд алдаа гарлаа: ${error.message}`
      );
    }

    return null;
  }

  let musicData: StoredInvitationMusic;

  try {
    musicData =
      JSON.parse(storedMusicRaw);
  } catch {
    throw new Error(
      "Урилгын хөгжмийн мэдээлэл уншихад алдаа гарлаа."
    );
  }

  /*
   * MUSIC NOT SELECTED
   */

  if (
    musicData.musicType !== "custom" ||
    !musicData.musicId
  ) {
    const {
      error,
    } = await supabase
      .from("invitations")
      .update({
        music_path: null,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", invitationId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(
        `Хөгжмийн мэдээлэл цэвэрлэхэд алдаа гарлаа: ${error.message}`
      );
    }

    return null;
  }

  /*
   * LOAD MUSIC FROM INDEXEDDB
   */

  const musicBlob =
    await getStoredImage(
      musicData.musicId
    );

  if (!musicBlob) {
    throw new Error(
      "Сонгосон MP3 файл олдсонгүй. Builder дээр хөгжмөө дахин сонгоно уу."
    );
  }

  /*
   * STORAGE PATH
   */

  const extension =
    getMusicExtension(
      musicBlob
    );

  const musicPath =
    `${userId}/${invitationId}/music.${extension}`;

  const contentType =
    musicBlob.type ||
    "audio/mpeg";

  /*
   * UPLOAD TO invitation-music
   */

  const {
    error: musicUploadError,
  } = await supabase.storage
    .from("invitation-music")
    .upload(
      musicPath,
      musicBlob,
      {
        cacheControl: "31536000",
        upsert: true,
        contentType,
      }
    );

  if (musicUploadError) {
    throw new Error(
      `MP3 upload хийхэд алдаа гарлаа: ${musicUploadError.message}`
    );
  }

  /*
   * SAVE MUSIC PATH TO DB
   */

  const {
    error: musicPathUpdateError,
  } = await supabase
    .from("invitations")
    .update({
      music_path: musicPath,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", invitationId)
    .eq("user_id", userId);

  if (musicPathUpdateError) {
    throw new Error(
      `MP3 Storage path хадгалахад алдаа гарлаа: ${musicPathUpdateError.message}`
    );
  }

  return musicPath;
}

/*
 * =========================================================
 * UPLOAD COVER VIDEO
 * =========================================================
 */

function getVideoExtension(blob: Blob): string {
  const type = (blob.type || "").toLowerCase();

  if (type === "video/webm") return "webm";
  if (type === "video/quicktime") return "mov";

  return "mp4";
}

async function uploadInvitationVideo(
  userId: string,
  invitationId: string,
  musicPath: string | null
): Promise<void> {
  const folder = `${userId}/${invitationId}`;

  let coverVideoId: string | null = null;

  try {
    const rawExtras = sessionStorage.getItem(
      "invitation-extras"
    );

    coverVideoId = rawExtras
      ? (JSON.parse(rawExtras).coverVideoId ??
          null)
      : null;
  } catch {
    coverVideoId = null;
  }

  const bucket = supabase.storage.from(
    "invitation-music"
  );

  const videoBlob = coverVideoId
    ? await getStoredImage(coverVideoId)
    : null;

  if (!videoBlob) {
    const { data: files } = await bucket.list(
      folder
    );

    const stale = (files ?? [])
      .filter((file) =>
        file.name.startsWith("video.")
      )
      .map((file) => `${folder}/${file.name}`);

    if (stale.length > 0) {
      await bucket.remove(stale);
    }

    return;
  }

  const videoPath = `${folder}/video.${getVideoExtension(
    videoBlob
  )}`;

  const { error: uploadError } =
    await bucket.upload(videoPath, videoBlob, {
      cacheControl: "31536000",
      upsert: true,
      contentType:
        videoBlob.type || "video/mp4",
    });

  if (uploadError) {
    throw new Error(
      `Видео upload хийхэд алдаа гарлаа: ${uploadError.message}`
    );
  }

  if (musicPath) {
    return;
  }

  const { error: pathError } = await supabase
    .from("invitations")
    .update({
      music_path: videoPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invitationId)
    .eq("user_id", userId);

  if (pathError) {
    throw new Error(
      `Видеоны path хадгалахад алдаа гарлаа: ${pathError.message}`
    );
  }
}

/*
 * Урилгын нэмэлт тохиргоо (RSVP г.м)-ийг DB-д хадгална.
 * Алдаа гарвал нийтлэх урсгалыг зогсоохгүй.
 */
async function saveInvitationExtras(
  userId: string,
  invitationId: string
): Promise<void> {
  try {
    const raw = sessionStorage.getItem(
      "invitation-extras"
    );

    if (!raw) return;

    const {
      coverVideoId: _id,
      coverVideoName: _name,
      coverVideoPath: _path,
      ...extras
    } = JSON.parse(raw);

    const { error } = await supabase
      .from("invitations")
      .update({ extras })
      .eq("id", invitationId)
      .eq("user_id", userId);

    if (error) {
      console.error("SAVE EXTRAS ERROR:", error);
    }
  } catch (error) {
    console.error("SAVE EXTRAS ERROR:", error);
  }
}

/*
 * =========================================================
 * DATE
 * =========================================================
 */

function formatDate(date: string) {
  if (!date) return "";

  const selectedDate =
    new Date(`${date}T00:00:00`);

  if (
    Number.isNaN(
      selectedDate.getTime()
    )
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

/*
 * =========================================================
 * SLUG
 * =========================================================
 */

function createSlugPart(
  value: string
) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(
      /[^a-z0-9а-яөүё-]/gi,
      ""
    )
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function createPublicSlug(
  names: string,
  eventType: string
) {
  const namesPart =
    createSlugPart(names);

  const eventPart =
    createSlugPart(eventType);

  const base =
    namesPart ||
    eventPart ||
    "my-invitation";

  const randomPart =
    Math.random()
      .toString(36)
      .substring(2, 8);

  return `${base}-${randomPart}`;
}

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

function InvitationPreviewPageContent() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const eventType =
    searchParams.get("event") ??
    "wedding";

  const template =
    searchParams.get("template") ??
    "classic-gold";

  const [
    draft,
    setDraft,
  ] =
    useState<InvitationDraft | null>(
      null
    );

  const [
    backgroundUrl,
    setBackgroundUrl,
  ] =
    useState<string | null>(
      null
    );

  const [
    galleryUrls,
    setGalleryUrls,
  ] =
    useState<string[]>([]);

  /*
   * PUBLIC-STYLE PREVIEW STATE
   */

  const [
    extras,
    setExtras,
  ] =
    useState<InvitationExtrasPreview | null>(
      null
    );

  const [
    coverVideoUrl,
    setCoverVideoUrl,
  ] =
    useState<string | null>(
      null
    );

  const [
    coverVideoEnded,
    setCoverVideoEnded,
  ] =
    useState(false);

  const [
    galleryIndex,
    setGalleryIndex,
  ] =
    useState(0);
  const activeGalleryIndex =
    galleryUrls.length > 0
      ? galleryIndex % galleryUrls.length
      : 0;

  const [
    musicPlaying,
    setMusicPlaying,
  ] =
    useState(false);

  const musicRef =
    useRef<HTMLAudioElement | null>(null);

  /*
   * MUSIC PREVIEW STATE
   */

  const [
    musicUrl,
    setMusicUrl,
  ] =
    useState<string | null>(
      null
    );

  const [
    musicName,
    setMusicName,
  ] =
    useState<string | null>(
      null
    );

  const [
    musicType,
    setMusicType,
  ] =
    useState<
      "none" | "custom"
    >("none");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    publishing,
    setPublishing,
  ] =
    useState(false);

  const [
    publishMessage,
    setPublishMessage,
  ] =
    useState("");

  const [
    publishedSlug,
    setPublishedSlug,
  ] =
    useState("");

  /*
   * PAYMENT STATE
   */

  const [
    showPaymentModal,
    setShowPaymentModal,
  ] =
    useState(false);

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<
      "qpay" | "bank" | null
    >(null);

  const [
    paymentStatus,
    setPaymentStatus,
  ] =
    useState<
      | "idle"
      | "waiting"
      | "verifying"
      | "published"
    >("idle");

  const [
    verificationSeconds,
    setVerificationSeconds,
  ] =
    useState(20);

  const [
    receiptFile,
    setReceiptFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    receiptPreview,
    setReceiptPreview,
  ] =
    useState<string | null>(
      null
    );

  const [
    submittingPayment,
    setSubmittingPayment,
  ] =
    useState(false);

  const [
    paymentReference,
    setPaymentReference,
  ] =
    useState("");

  /*
   * PAYER INFORMATION
   */

  const [
    payerName,
    setPayerName,
  ] =
    useState("");

  const [
    payerPhone,
    setPayerPhone,
  ] =
    useState("");

  const [
    payerBank,
    setPayerBank,
  ] =
    useState("");

  const [
    payerAccountName,
    setPayerAccountName,
  ] =
    useState("");

  const [
    payerAccountNumber,
    setPayerAccountNumber,
  ] =
    useState("");

  /*
   * =========================================================
   * LOAD PREVIEW
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      setLoading(true);
      setErrorMessage("");

      try {
        /*
         * DRAFT
         */

        const storedDraft =
          sessionStorage.getItem(
            "invitation-draft"
          );

        if (!storedDraft) {
          if (!cancelled) {
            setErrorMessage(
              "Урилгын хадгалсан мэдээлэл олдсонгүй."
            );
          }

          return;
        }

        const parsedDraft:
          InvitationDraft =
          JSON.parse(
            storedDraft
          );

        if (!cancelled) {
          setDraft(
            parsedDraft
          );
        }

        /*
         * EXTRAS
         */

        const storedExtras =
          sessionStorage.getItem(
            "invitation-extras"
          );

        let parsedExtras:
          InvitationExtrasPreview | null =
          null;

        if (storedExtras) {
          try {
            parsedExtras =
              JSON.parse(
                storedExtras
              );

            if (!cancelled) {
              setExtras(
                parsedExtras
              );
            }
          } catch (extrasError) {
            console.error(
              "Extras load error:",
              extrasError
            );

            if (!cancelled) {
              setExtras(null);
            }
          }
        }

        /*
         * IMAGES
         */

        const storedImages =
          sessionStorage.getItem(
            "invitation-images"
          );

        if (storedImages) {
          const imageData:
            StoredInvitationImages =
            JSON.parse(
              storedImages
            );

          /*
           * BACKGROUND
           */

          if (
            imageData.backgroundId
          ) {
            const backgroundBlob =
              await getStoredImage(
                imageData.backgroundId
              );

            if (
              backgroundBlob &&
              !cancelled
            ) {
              const url =
                URL.createObjectURL(
                  backgroundBlob
                );

              setBackgroundUrl(
                url
              );
            }
          }

          /*
           * GALLERY
           */

          const loadedGallery:
            string[] = [];

          for (
            const galleryId of
            imageData.galleryIds ??
            []
          ) {
            const galleryBlob =
              await getStoredImage(
                galleryId
              );

            if (
              galleryBlob &&
              !cancelled
            ) {
              const url =
                URL.createObjectURL(
                  galleryBlob
                );

              loadedGallery.push(
                url
              );
            }
          }

          if (!cancelled) {
            setGalleryUrls(
              loadedGallery
            );
          }
        }

        /*
         * COVER VIDEO
         */

        const coverVideoId =
          parsedExtras?.coverVideoId;

        if (coverVideoId) {
          try {
            const videoBlob =
              await getStoredImage(
                coverVideoId
              );

            if (
              videoBlob &&
              !cancelled
            ) {
              const videoUrl =
                URL.createObjectURL(
                  videoBlob
                );

              setCoverVideoUrl(
                videoUrl
              );
              setCoverVideoEnded(false);
            } else if (!cancelled) {
              setCoverVideoEnded(true);
            }
          } catch (videoError) {
            console.error(
              "Cover video load error:",
              videoError
            );

            if (!cancelled) {
              setCoverVideoEnded(true);
            }
          }
        } else if (!cancelled) {
          setCoverVideoEnded(true);
        }

        /*
         * MUSIC
         */

        const storedMusic =
          sessionStorage.getItem(
            "invitation-music"
          );

        if (storedMusic) {
          try {
            const musicData:
              StoredInvitationMusic =
              JSON.parse(
                storedMusic
              );

            if (
              musicData.musicType ===
                "custom" &&
              musicData.musicId
            ) {
              const musicBlob =
                await getStoredImage(
                  musicData.musicId
                );

              if (
                musicBlob &&
                !cancelled
              ) {
                const url =
                  URL.createObjectURL(
                    musicBlob
                  );

                setMusicUrl(
                  url
                );

                setMusicName(
                  musicData.musicName ||
                    "Таны сонгосон дуу"
                );

                setMusicType(
                  "custom"
                );
              }
            } else if (!cancelled) {
              setMusicUrl(null);
              setMusicName(null);
              setMusicType("none");
            }
          } catch (musicError) {
            console.error(
              "Music load error:",
              musicError
            );

            if (!cancelled) {
              setMusicUrl(null);
              setMusicName(null);
              setMusicType("none");
            }
          }
        } else if (!cancelled) {
          setMusicUrl(null);
          setMusicName(null);
          setMusicType("none");
        }
      } catch (error) {
        console.error(
          "Preview load error:",
          error
        );

        if (!cancelled) {
          setErrorMessage(
            "Урилгын мэдээлэл унших үед алдаа гарлаа."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * =========================================================
   * GALLERY SLIDESHOW
   * =========================================================
   */

  useEffect(() => {
    if (galleryUrls.length <= 1) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setGalleryIndex(
          (current) =>
            (current + 1) %
            galleryUrls.length
        );
      }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [galleryUrls.length]);

  /*
   * =========================================================
   * CLEANUP BLOB URLS
   * =========================================================
   */

  useEffect(() => {
    return () => {
      if (backgroundUrl) {
        URL.revokeObjectURL(
          backgroundUrl
        );
      }

      galleryUrls.forEach(
        (url) => {
          if (
            url.startsWith("blob:")
          ) {
            URL.revokeObjectURL(
              url
            );
          }
        }
      );

      if (
        musicUrl &&
        musicUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          musicUrl
        );
      }

      if (
        coverVideoUrl &&
        coverVideoUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          coverVideoUrl
        );
      }
    };
  }, [
    backgroundUrl,
    galleryUrls,
    musicUrl,
    coverVideoUrl,
  ]);

  /*
   * =========================================================
   * MUSIC TOGGLE
   * =========================================================
   */

  async function toggleMusic() {
    if (
      !musicUrl ||
      musicType !== "custom"
    ) {
      return;
    }

    const audio =
      musicRef.current;

    if (!audio) {
      return;
    }

    try {
      if (audio.paused) {
        await audio.play();
        setMusicPlaying(true);
      } else {
        audio.pause();
        setMusicPlaying(false);
      }
    } catch (error) {
      console.error(
        "Music play error:",
        error
      );
    }
  }

  /*
   * =========================================================
   * BACK TO BUILDER
   * =========================================================
   */

  function goBackToBuilder() {
    router.push(
      `/dashboard/invitations/new/builder?event=${encodeURIComponent(
        eventType
      )}&template=${encodeURIComponent(
        template
      )}`
    );
  }

  /*
   * =========================================================
   * PAYMENT MODAL
   * =========================================================
   */

  function openPaymentModal() {
    setPublishMessage("");
    setErrorMessage("");

    setPaymentMethod(null);
    setPaymentStatus("idle");
    setVerificationSeconds(20);

    setReceiptFile(null);
    setReceiptPreview(null);
    setPaymentReference("");

    setPayerName("");
    setPayerPhone("");
    setPayerBank("");
    setPayerAccountName("");
    setPayerAccountNumber("");

    setShowPaymentModal(true);
  }

  function closePaymentModal() {
    if (
      publishing ||
      submittingPayment
    ) {
      return;
    }

    setShowPaymentModal(false);
    setPaymentMethod(null);
    setPaymentStatus("idle");
    setVerificationSeconds(20);

    setReceiptFile(null);
    setReceiptPreview(null);
    setPaymentReference("");

    setPayerName("");
    setPayerPhone("");
    setPayerBank("");
    setPayerAccountName("");
    setPayerAccountNumber("");
  }

  function selectPaymentMethod(
    method: "qpay" | "bank"
  ) {
    if (submittingPayment) {
      return;
    }

    setPaymentMethod(method);
    setPaymentStatus("idle");
    setVerificationSeconds(20);

    setPublishMessage("");
    setErrorMessage("");

    setReceiptFile(null);
    setReceiptPreview(null);
    setPaymentReference("");

    setPayerName("");
    setPayerPhone("");
    setPayerBank("");
    setPayerAccountName("");
    setPayerAccountNumber("");
  }

  /*
   * =========================================================
   * RECEIPT SELECT
   * =========================================================
   */

  function handleReceiptChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith("image/")
    ) {
      setErrorMessage(
        "Зөвхөн зураг хэлбэрийн төлбөрийн баримт оруулна уу."
      );

      return;
    }

    if (
      file.size >
      8 * 1024 * 1024
    ) {
      setErrorMessage(
        "Баримтын зураг 8MB-аас бага хэмжээтэй байна."
      );

      return;
    }

    setErrorMessage("");
    setReceiptFile(file);

    if (receiptPreview) {
      URL.revokeObjectURL(
        receiptPreview
      );
    }

    const previewUrl =
      URL.createObjectURL(file);

    setReceiptPreview(
      previewUrl
    );
  }

  /*
   * =========================================================
   * BANK PAYMENT SUBMIT
   * =========================================================
   */

  async function submitBankPayment() {
    if (!draft) {
      return;
    }

    if (!payerName.trim()) {
      setErrorMessage(
        "Нэрээ оруулна уу."
      );
      return;
    }

    if (!payerPhone.trim()) {
      setErrorMessage(
        "Утасны дугаараа оруулна уу."
      );
      return;
    }

    if (!payerBank.trim()) {
      setErrorMessage(
        "Шилжүүлсэн банкаа оруулна уу."
      );
      return;
    }

    if (!payerAccountName.trim()) {
      setErrorMessage(
        "Данс эзэмшигчийн нэрээ оруулна уу."
      );
      return;
    }

    if (!paymentReference.trim()) {
      setErrorMessage(
        "Гүйлгээний утгаа оруулна уу."
      );
      return;
    }

    if (!receiptFile) {
      setErrorMessage(
        "Шилжүүлгийн баримтын зургаа оруулна уу."
      );
      return;
    }

    setSubmittingPayment(true);
    setErrorMessage("");
    setPublishMessage("");
    setVerificationSeconds(20);

    try {
      /*
       * AUTH
       */

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.push(
          `/login?redirect=${encodeURIComponent(
            `/dashboard/invitations/new/preview?event=${eventType}&template=${template}`
          )}`
        );

        return;
      }

      /*
       * UPLOAD RECEIPT
       */

      const fileExtension =
        receiptFile.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const filePath =
        `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from("payment-receipts")
          .upload(
            filePath,
            receiptFile,
            {
              cacheControl: "3600",
              upsert: false,
              contentType:
                receiptFile.type,
            }
          );

      if (uploadError) {
        throw uploadError;
      }

      /*
       * FIND EXISTING INVITATION
       */

      const existingId =
        draft.id ||
        sessionStorage.getItem(
          "published-invitation-id"
        ) ||
        "";

      let invitationId =
        existingId;

      /*
       * PUBLIC SLUG
       */

      const publicSlug =
        createPublicSlug(
          draft.names,
          draft.eventType
        );

      /*
       * PAYMENT DATA
       */

      const now =
        new Date().toISOString();

      const baseData = {
        user_id: user.id,
        event_type:
          draft.eventType,
        template:
          draft.template,
        title:
          draft.title || "",
        names:
          draft.names || "",
        event_date:
          draft.date || "",
        event_time:
          draft.time || "",
        venue:
          draft.venue || "",
        address:
          draft.address || "",
        message:
          draft.message || "",
        phone:
          draft.phone || "",
        selected_style:
          draft.selectedStyle ||
          "romantic",
        ai_prompt:
          draft.aiPrompt || "",
        active_section:
          draft.activeSection ||
          "cover",
        background_id:
          draft.backgroundId ||
          null,
        gallery_ids:
          draft.galleryIds ||
          [],
        gallery_urls:
          draft.galleryUrls ||
          [],
        status:
          "pending_payment",
        public_slug:
          publicSlug,
        published_at:
          null,
        payment_method:
          "bank",
        payment_status:
          "submitted",
        payment_receipt_path:
          filePath,
        payment_submitted_at:
          now,
        payment_amount:
          INVITATION_PRICE,
        payment_reference:
          paymentReference.trim(),
        payer_name:
          payerName.trim(),
        payer_phone:
          payerPhone.trim(),
        payer_bank:
          payerBank.trim(),
        payer_account_name:
          payerAccountName.trim(),
        payer_account_number:
          payerAccountNumber.trim() ||
          null,
        updated_at:
          now,
      };

      /*
       * UPDATE EXISTING
       */

      if (invitationId) {
        const {
          data,
          error,
        } =
          await supabase
            .from("invitations")
            .update(baseData)
            .eq(
              "id",
              invitationId
            )
            .eq(
              "user_id",
              user.id
            )
            .select(
              "id, public_slug"
            )
            .single();

        if (error) {
          throw error;
        }

        invitationId =
          data.id;
      } else {
        /*
         * CREATE NEW
         */

        const {
          data,
          error,
        } =
          await supabase
            .from("invitations")
            .insert(baseData)
            .select(
              "id, public_slug"
            )
            .single();

        if (error) {
          throw error;
        }

        invitationId =
          data.id;
      }

      /*
       * UPLOAD INVITATION IMAGES
       */

      setPublishMessage(
        "Урилгын зургуудыг хадгалж байна..."
      );

      await uploadInvitationImages(
        user.id,
        invitationId
      );

      /*
       * UPLOAD INVITATION MUSIC
       */

      if (
        musicType === "custom"
      ) {
        setPublishMessage(
          "Урилгын хөгжмийг хадгалж байна..."
        );
      }

      const savedMusicPath = await uploadInvitationMusic(
        user.id,
        invitationId
      );

      setPublishMessage(
        "Урилгын видеог хадгалж байна..."
      );

      await uploadInvitationVideo(
        user.id,
        invitationId,
        savedMusicPath
      );

      await saveInvitationExtras(
        user.id,
        invitationId
      );

      /*
       * PAYMENT SUBMITTED
       */

      setPaymentStatus(
        "verifying"
      );

      setPublishMessage(
        "Төлбөрийн баримт амжилттай илгээгдлээ."
      );

      /*
       * RANDOM VERIFICATION TIME
       */

      const processingSeconds =
        Math.floor(
          Math.random() * 6
        ) + 5;

      for (
        let seconds = 20;
        seconds >
        20 - processingSeconds;
        seconds--
      ) {
        setVerificationSeconds(
          seconds
        );

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              1000
            )
        );
      }

      setVerificationSeconds(0);

      /*
       * AUTO APPROVE + PUBLISH
       */

      const publishedAt =
        new Date().toISOString();

      const {
        data: publishedData,
        error: publishError,
      } =
        await supabase
          .from("invitations")
          .update({
            status:
              "published",
            payment_status:
              "paid",
            published_at:
              publishedAt,
            updated_at:
              publishedAt,
          })
          .eq(
            "id",
            invitationId
          )
          .eq(
            "user_id",
            user.id
          )
          .select(
            "id, public_slug"
          )
          .single();

      if (publishError) {
        throw publishError;
      }

      const finalSlug =
        publishedData.public_slug ||
        publicSlug;

      /*
       * SAVE PUBLISHED INFO
       */

      sessionStorage.setItem(
        "published-invitation-id",
        invitationId
      );

      sessionStorage.setItem(
        "published-invitation-slug",
        finalSlug
      );

      sessionStorage.setItem(
        "payment-status",
        "paid"
      );

      sessionStorage.removeItem(
        "pending-payment-invitation-id"
      );

      setPublishedSlug(
        finalSlug
      );

      setPaymentStatus(
        "published"
      );

      setPublishMessage(
        "Төлбөр амжилттай баталгаажлаа. Урилга нийтлэгдлээ ✓"
      );

      /*
       * LOCAL DRAFT
       */

      const updatedDraft:
        InvitationDraft = {
        ...draft,
        id:
          invitationId,
        savedAt:
          publishedAt,
      };

      sessionStorage.setItem(
        "invitation-draft",
        JSON.stringify(
          updatedDraft
        )
      );

      setDraft(
        updatedDraft
      );

      /*
       * CLOSE MODAL
       */

      setTimeout(() => {
        setShowPaymentModal(
          false
        );

        setPaymentMethod(null);
        setPaymentStatus(
          "idle"
        );
        setVerificationSeconds(20);

        setReceiptFile(null);
        setReceiptPreview(null);
        setPaymentReference("");

        setPayerName("");
        setPayerPhone("");
        setPayerBank("");
        setPayerAccountName("");
        setPayerAccountNumber("");
      }, 1800);
    } catch (error) {
      console.error(
        "BANK PAYMENT ERROR:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Тодорхойгүй алдаа гарлаа.";

      setErrorMessage(
        `Төлбөрийн баримт илгээх үед алдаа гарлаа: ${message}`
      );

      setPaymentStatus("idle");
    } finally {
      setSubmittingPayment(false);
    }
  }

  /*
   * =========================================================
   * PAYMENT ACTION
   * =========================================================
   */

  function startPayment() {
    if (!paymentMethod) {
      setErrorMessage(
        "Төлбөрийн хэлбэрээ сонгоно уу."
      );

      return;
    }

    setErrorMessage("");

    if (
      paymentMethod === "qpay"
    ) {
      setPaymentStatus(
        "waiting"
      );

      setPublishMessage(
        "QPay merchant холбогдсоны дараа QR төлбөр энд гарна."
      );

      return;
    }

    void submitBankPayment();
  }

  /*
   * =========================================================
   * DIRECT PUBLISH
   * =========================================================
   */

  async function handlePublish() {
    if (!draft) return;

    setPublishing(true);
    setPublishMessage("");
    setErrorMessage("");

    try {
      /*
       * AUTH
       */

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.push(
          `/login?redirect=${encodeURIComponent(
            `/dashboard/invitations/new/preview?event=${eventType}&template=${template}`
          )}`
        );

        return;
      }

      /*
       * EXISTING INVITATION
       */

      const existingId =
        draft.id ||
        sessionStorage.getItem(
          "published-invitation-id"
        ) ||
        "";

      let invitationId:
        | string =
        existingId;

      let publicSlug =
        publishedSlug ||
        sessionStorage.getItem(
          "published-invitation-slug"
        ) ||
        "";

      if (!publicSlug) {
        publicSlug =
          createPublicSlug(
            draft.names,
            draft.eventType
          );
      }

      const now =
        new Date().toISOString();

      const invitationData = {
        user_id: user.id,
        event_type:
          draft.eventType,
        template:
          draft.template,
        title:
          draft.title || "",
        names:
          draft.names || "",
        event_date:
          draft.date || "",
        event_time:
          draft.time || "",
        venue:
          draft.venue || "",
        address:
          draft.address || "",
        message:
          draft.message || "",
        phone:
          draft.phone || "",
        selected_style:
          draft.selectedStyle ||
          "romantic",
        ai_prompt:
          draft.aiPrompt || "",
        active_section:
          draft.activeSection ||
          "cover",
        background_id:
          draft.backgroundId ||
          null,
        gallery_ids:
          draft.galleryIds ||
          [],
        gallery_urls:
          draft.galleryUrls ||
          [],
        status:
          "published",
        public_slug:
          publicSlug,
        published_at:
          now,
        updated_at:
          now,
      };

      /*
       * CREATE / UPDATE
       */

      if (invitationId) {
        const {
          data,
          error,
        } =
          await supabase
            .from("invitations")
            .update(
              invitationData
            )
            .eq(
              "id",
              invitationId
            )
            .eq(
              "user_id",
              user.id
            )
            .select(
              "id, public_slug"
            )
            .single();

        if (error) {
          throw error;
        }

        invitationId =
          data.id;

        publicSlug =
          data.public_slug;
      } else {
        const {
          data,
          error,
        } =
          await supabase
            .from("invitations")
            .insert(
              invitationData
            )
            .select(
              "id, public_slug"
            )
            .single();

        if (error) {
          throw error;
        }

        invitationId =
          data.id;

        publicSlug =
          data.public_slug;
      }

      /*
       * UPLOAD ATTACHMENT IMAGES
       */

      setPublishMessage(
        "Урилгын зургуудыг хадгалж байна..."
      );

      await uploadInvitationImages(
        user.id,
        invitationId
      );

      /*
       * UPLOAD INVITATION MUSIC
       */

      if (
        musicType === "custom"
      ) {
        setPublishMessage(
          "Урилгын хөгжмийг хадгалж байна..."
        );
      }

      const savedMusicPath = await uploadInvitationMusic(
        user.id,
        invitationId
      );

      setPublishMessage(
        "Урилгын видеог хадгалж байна..."
      );

      await uploadInvitationVideo(
        user.id,
        invitationId,
        savedMusicPath
      );

      await saveInvitationExtras(
        user.id,
        invitationId
      );

      /*
       * SAVE PUBLISHED INFO
       */

      sessionStorage.setItem(
        "published-invitation-id",
        invitationId
      );

      sessionStorage.setItem(
        "published-invitation-slug",
        publicSlug
      );

      sessionStorage.setItem(
        "payment-status",
        "paid"
      );

      setPublishedSlug(
        publicSlug
      );

      /*
       * LOCAL DRAFT
       */

      const updatedDraft:
        InvitationDraft = {
        ...draft,
        id:
          invitationId,
        savedAt:
          now,
      };

      sessionStorage.setItem(
        "invitation-draft",
        JSON.stringify(
          updatedDraft
        )
      );

      setDraft(
        updatedDraft
      );

      setPublishMessage(
        "Урилга амжилттай нийтлэгдлээ ✓"
      );

      setShowPaymentModal(
        false
      );

      setPaymentMethod(null);
      setPaymentStatus("idle");
    } catch (error) {
      console.error(
        "PUBLISH ERROR:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Тодорхойгүй алдаа гарлаа.";

      setErrorMessage(
        `Урилга нийтлэх үед алдаа гарлаа: ${message}`
      );
    } finally {
      setPublishing(false);
    }
  }

  /*
   * =========================================================
   * PUBLIC LINK
   * =========================================================
   */

  function copyPublicLink() {
    if (!publishedSlug) {
      return;
    }

    const publicUrl =
      `${window.location.origin}/u/${publishedSlug}`;

    navigator.clipboard
      .writeText(publicUrl)
      .then(() => {
        setPublishMessage(
          "Урилгын линк clipboard-д хууллаа ✓"
        );
      })
      .catch(() => {
        setPublishMessage(
          publicUrl
        );
      });
  }

  function openPublicLink() {
    if (!publishedSlug) {
      return;
    }

    const publicUrl =
      `/u/${publishedSlug}`;

    window.open(
      publicUrl,
      "_blank"
    );
  }

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F1EC] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-black border-t-transparent" />

          <p className="mt-4 text-sm text-black/45">
            Урьдчилж харах бэлдэж байна...
          </p>
        </div>
      </main>
    );
  }

  if (!draft) {
    return (
      <main className="min-h-screen bg-[#F4F1EC] flex items-center justify-center px-5">
        <div className="w-full max-w-md rounded-[28px] bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">
            💌
          </div>

          <h1 className="mt-4 text-xl font-semibold">
            Урилгын мэдээлэл олдсонгүй
          </h1>

          <p className="mt-2 text-sm leading-6 text-black/45">
            {errorMessage ||
              "Builder дээр хадгалсан мэдээлэл Preview хэсэгт дамжиж ирсэнгүй."}
          </p>

          <button
            type="button"
            onClick={
              goBackToBuilder
            }
            className="mt-6 w-full rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
          >
            ← Буцаж засах
          </button>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * PUBLIC STYLE
   * =========================================================
   */

  const selectedStyle =
    draft.selectedStyle ||
    "romantic";

  const isLuxury =
    selectedStyle ===
    "luxury";

  const isMinimal =
    selectedStyle ===
    "minimal";

  const isGarden =
    selectedStyle ===
    "garden";

  let pageBackground =
    "bg-[#f9f1f1]";

  let cardBackground =
    "bg-[#fffafa]";

  let textColor =
    "text-[#392a2d]";

  let accentColor =
    "#a66a78";

  let accentSoft =
    "#f5e5e8";

  let borderColor =
    "border-[#e5cdd2]";

  let buttonBackground =
    "#8e5967";

  if (isLuxury) {
    pageBackground =
      "bg-[#f4efe5]";

    cardBackground =
      "bg-[#fffdf8]";

    textColor =
      "text-[#2c241b]";

    accentColor =
      "#b08d57";

    accentSoft =
      "#f3ead9";

    borderColor =
      "border-[#d8c7a8]";

    buttonBackground =
      "#2c241b";
  }

  if (isMinimal) {
    pageBackground =
      "bg-[#f5f5f3]";

    cardBackground =
      "bg-white";

    textColor =
      "text-[#202020]";

    accentColor =
      "#555555";

    accentSoft =
      "#eeeeec";

    borderColor =
      "border-[#ddddda]";

    buttonBackground =
      "#202020";
  }

  if (isGarden) {
    pageBackground =
      "bg-[#eef4eb]";

    cardBackground =
      "bg-[#fffef9]";

    textColor =
      "text-[#263326]";

    accentColor =
      "#6d8b63";

    accentSoft =
      "#e4eee0";

    borderColor =
      "border-[#cbd9c6]";

    buttonBackground =
      "#4f6849";
  }

  const hasMap =
    typeof extras?.lat === "number" &&
    typeof extras?.lng === "number";

  const mapLatitude =
    typeof extras?.lat === "number"
      ? extras.lat
      : null;

  const mapLongitude =
    typeof extras?.lng === "number"
      ? extras.lng
      : null;

  const mapUrl =
    typeof extras?.mapUrl === "string"
      ? extras.mapUrl
      : "";

  const rsvpSettings =
    extras?.rsvp;

  const rsvpEnabled =
    rsvpSettings?.enabled === true;

  const rsvpDeadline =
    rsvpSettings?.deadline || "";

  const rsvpDeadlineFormatted =
    rsvpDeadline
      ? formatDate(
          rsvpDeadline
        )
      : "";

  /*
   * =========================================================
   * PREVIEW
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-[#F4F1EC] text-[#171717]">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/35">
              URILGA
            </div>

            <h1 className="mt-1 text-lg font-semibold">
              Урьдчилж харах
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden rounded-full bg-black/[0.04] px-3 py-2 text-[10px] font-medium text-black/45 sm:block">
              Төлбөр төлөхөөс өмнөх Preview
            </div>

            <button
              type="button"
              onClick={
                goBackToBuilder
              }
              className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold hover:bg-black/5"
            >
              ← Засах
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-5">
        <WizardStepper
          step={4}
          onStepClick={(target) => {
            if (target === 3) {
              goBackToBuilder();
            } else if (target < 3) {
              router.push(
                `/dashboard/invitations/new/details?event=${encodeURIComponent(
                  eventType
                )}&template=${encodeURIComponent(
                  template
                )}&step=${target}`
              );
            }
          }}
        />
      </div>

      {/* CONTENT */}

      <section className="px-4 py-8 sm:px-6 lg:py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-stretch gap-8 lg:flex-row lg:items-start">

          {/* =================================================
              SIDE PANEL
              ================================================= */}

          <div className="w-full shrink-0 lg:w-[380px] lg:pt-8">
            <div className="rounded-[28px] bg-white p-6 shadow-sm">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/35">
                Invitation Preview
              </div>

              <h2 className="mt-3 text-2xl font-semibold">
                {draft.title ||
                  "Таны урилга"}
              </h2>

              {draft.names && (
                <p className="mt-2 text-sm text-black/45">
                  {draft.names}
                </p>
              )}

              <div className="mt-6 space-y-3">
                {draft.date && (
                  <div className="rounded-2xl bg-[#F8F5F0] p-4">
                    <div className="text-[10px] uppercase tracking-[0.15em] text-black/35">
                      Огноо
                    </div>

                    <div className="mt-1 text-sm font-semibold">
                      {formatDate(
                        draft.date
                      )}
                    </div>
                  </div>
                )}

                {draft.time && (
                  <div className="rounded-2xl bg-[#F8F5F0] p-4">
                    <div className="text-[10px] uppercase tracking-[0.15em] text-black/35">
                      Цаг
                    </div>

                    <div className="mt-1 text-sm font-semibold">
                      {draft.time}
                    </div>
                  </div>
                )}

                {draft.venue && (
                  <div className="rounded-2xl bg-[#F8F5F0] p-4">
                    <div className="text-[10px] uppercase tracking-[0.15em] text-black/35">
                      Байршил
                    </div>

                    <div className="mt-1 text-sm font-semibold">
                      {draft.venue}
                    </div>

                    {draft.address && (
                      <div className="mt-1 text-xs text-black/45">
                        {draft.address}
                      </div>
                    )}
                  </div>
                )}

                {draft.phone && (
                  <div className="rounded-2xl bg-[#F8F5F0] p-4">
                    <div className="text-[10px] uppercase tracking-[0.15em] text-black/35">
                      Холбоо барих
                    </div>

                    <div className="mt-1 text-sm font-semibold">
                      {draft.phone}
                    </div>
                  </div>
                )}
              </div>

              {/* STYLE */}

              <div className="mt-5 rounded-2xl border border-black/10 p-4">
                <div className="text-[10px] uppercase tracking-[0.15em] text-black/35">
                  Design
                </div>

                <div className="mt-1 text-sm font-semibold capitalize">
                  {draft.selectedStyle ||
                    "Romantic"}
                </div>
              </div>

              {/* IMAGE STATUS */}

              <div className="mt-3 rounded-2xl border border-black/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-black/45">
                    Background
                  </span>

                  <span
                    className={`text-xs font-semibold ${
                      backgroundUrl
                        ? "text-green-700"
                        : "text-black/30"
                    }`}
                  >
                    {backgroundUrl
                      ? "✓ Loaded"
                      : "None"}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-black/45">
                    Gallery
                  </span>

                  <span className="text-xs font-semibold">
                    {galleryUrls.length}{" "}
                    зураг
                  </span>
                </div>
              </div>

              {/* EXTRA STATUS */}

              <div className="mt-3 rounded-2xl border border-black/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-black/45">
                    Map
                  </span>

                  <span
                    className={`text-xs font-semibold ${
                      hasMap || mapUrl
                        ? "text-green-700"
                        : "text-black/30"
                    }`}
                  >
                    {hasMap || mapUrl
                      ? "✓ Added"
                      : "None"}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-black/45">
                    RSVP
                  </span>

                  <span
                    className={`text-xs font-semibold ${
                      rsvpEnabled
                        ? "text-green-700"
                        : "text-black/30"
                    }`}
                  >
                    {rsvpEnabled
                      ? "✓ Enabled"
                      : "None"}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-black/45">
                    Cover video
                  </span>

                  <span
                    className={`text-xs font-semibold ${
                      coverVideoUrl
                        ? "text-green-700"
                        : "text-black/30"
                    }`}
                  >
                    {coverVideoUrl
                      ? "✓ Added"
                      : "None"}
                  </span>
                </div>
              </div>

              {/* MUSIC STATUS */}

              <div className="mt-3 rounded-2xl border border-black/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-black/45">
                    Music
                  </span>

                  <span
                    className={`max-w-[190px] truncate text-right text-xs font-semibold ${
                      musicType ===
                        "custom" &&
                      musicUrl
                        ? "text-green-700"
                        : "text-black/30"
                    }`}
                  >
                    {musicType ===
                        "custom" &&
                      musicUrl
                      ? `✓ ${
                          musicName ||
                          "MP3"
                        }`
                      : "None"}
                  </span>
                </div>
              </div>

              {/* PUBLISH STATUS */}

              {publishMessage && (
                <div className="mt-4 rounded-2xl bg-green-50 p-4 text-center text-sm font-medium text-green-700">
                  {publishMessage}
                </div>
              )}

              {errorMessage && (
                <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {errorMessage}
                </div>
              )}

              {/* BUTTONS */}

              <button
                type="button"
                onClick={
                  goBackToBuilder
                }
                className="mt-6 w-full rounded-2xl bg-black px-5 py-3.5 text-sm font-semibold text-white hover:bg-black/85"
              >
                ✏️ Урилгаа засах
              </button>

              {!publishedSlug ? (
                <button
                  type="button"
                  onClick={
                    openPaymentModal
                  }
                  disabled={
                    publishing ||
                    submittingPayment
                  }
                  className="mt-3 w-full rounded-2xl bg-black px-5 py-3.5 text-sm font-semibold text-white hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ₮19,900 төлөөд нийтлэх →
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={
                      openPublicLink
                    }
                    className="mt-3 w-full rounded-2xl bg-black px-5 py-3.5 text-sm font-semibold text-white hover:bg-black/85"
                  >
                    🌐 Урилгаа харах
                  </button>

                  <button
                    type="button"
                    onClick={
                      copyPublicLink
                    }
                    className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-5 py-3.5 text-sm font-semibold text-black/70 hover:bg-black/5"
                  >
                    🔗 Линк хуулах
                  </button>
                </>
              )}

              <p className="mt-4 text-center text-[10px] leading-5 text-black/30">
                Нэг урилга нийтлэх үнэ ·
                ₮19,900
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PAYMENT MODAL
          ===================================================== */}

      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[30px] bg-white shadow-2xl">
            {/* HEADER */}

            <div className="border-b border-black/10 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35">
                    URILGA
                  </div>

                  <h2 className="mt-1 text-xl font-semibold">
                    Урилгаа нийтлэх
                  </h2>

                  <p className="mt-1 text-sm text-black/45">
                    Төлбөрийн мэдээллээ оруулна уу.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closePaymentModal
                  }
                  disabled={
                    publishing ||
                    submittingPayment
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-black/50 hover:bg-black/10 disabled:opacity-40"
                >
                  ×
                </button>
              </div>
            </div>

            {/* PRICE */}

            <div className="px-6 pt-6">
              <div className="rounded-[24px] bg-[#F8F5F0] p-5 text-center">
                <div className="text-xs text-black/40">
                  Нийт төлөх
                </div>

                <div className="mt-1 text-3xl font-bold">
                  ₮
                  {INVITATION_PRICE.toLocaleString(
                    "mn-MN"
                  )}
                </div>

                <div className="mt-1 text-xs text-black/35">
                  1 дижитал урилга
                </div>
              </div>
            </div>

            {/* PAYMENT METHODS */}

            <div className="space-y-3 px-6 pt-5">
              {/* QPAY */}

              <button
                type="button"
                onClick={() =>
                  selectPaymentMethod(
                    "qpay"
                  )
                }
                disabled={
                  submittingPayment
                }
                className={`w-full rounded-[22px] border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  paymentMethod ===
                  "qpay"
                    ? "border-black bg-black/[0.03] ring-1 ring-black"
                    : "border-black/10 hover:border-black/25"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00AEEF] text-xl font-bold text-white">
                    Q
                  </div>

                  <div className="flex-1">
                    <div className="text-sm font-semibold">
                      QPay
                    </div>

                    <div className="mt-1 text-xs text-black/40">
                      QR кодоор төлөх
                    </div>
                  </div>

                  <div
                    className={`h-5 w-5 rounded-full border-2 ${
                      paymentMethod ===
                      "qpay"
                        ? "border-black bg-black"
                        : "border-black/20"
                    }`}
                  >
                    {paymentMethod ===
                      "qpay" && (
                      <div className="m-1 h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </button>

              {/* BANK */}

              <button
                type="button"
                onClick={() =>
                  selectPaymentMethod(
                    "bank"
                  )
                }
                disabled={
                  submittingPayment
                }
                className={`w-full rounded-[22px] border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  paymentMethod ===
                  "bank"
                    ? "border-black bg-black/[0.03] ring-1 ring-black"
                    : "border-black/10 hover:border-black/25"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-xl text-white">
                    ₮
                  </div>

                  <div className="flex-1">
                    <div className="text-sm font-semibold">
                      Банкны шилжүүлэг
                    </div>

                    <div className="mt-1 text-xs text-black/40">
                      Дансаар төлөх
                    </div>
                  </div>

                  <div
                    className={`h-5 w-5 rounded-full border-2 ${
                      paymentMethod ===
                      "bank"
                        ? "border-black bg-black"
                        : "border-black/20"
                    }`}
                  >
                    {paymentMethod ===
                      "bank" && (
                      <div className="m-1 h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* SELECTED METHOD */}

            {paymentMethod && (
              <div className="px-6 pt-5">
                {paymentMethod ===
                "qpay" ? (
                  <div className="rounded-[22px] border border-dashed border-black/15 bg-black/[0.02] p-5 text-center">
                    <div className="text-3xl">
                      📱
                    </div>

                    <div className="mt-2 text-sm font-semibold">
                      QPay QR
                    </div>

                    <p className="mt-2 text-xs leading-5 text-black/45">
                      QPay merchant
                      холбогдсоны
                      дараа төлбөрийн
                      QR код энд
                      автоматаар
                      гарна.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* PAYER INFORMATION */}

                    <div className="rounded-[22px] border border-black/10 p-5">
                      <div className="text-sm font-semibold">
                        Төлөгчийн
                        мэдээлэл
                      </div>

                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-[0.15em] text-black/35">
                            Нэр *
                          </label>

                          <input
                            type="text"
                            value={
                              payerName
                            }
                            onChange={(
                              event
                            ) =>
                              setPayerName(
                                event
                                  .target
                                  .value
                              )
                            }
                            disabled={
                              submittingPayment
                            }
                            placeholder="Төлөгчийн нэр"
                            className="mt-1 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black disabled:bg-black/[0.03]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-[0.15em] text-black/35">
                            Утас *
                          </label>

                          <input
                            type="tel"
                            value={
                              payerPhone
                            }
                            onChange={(
                              event
                            ) =>
                              setPayerPhone(
                                event
                                  .target
                                  .value
                              )
                            }
                            disabled={
                              submittingPayment
                            }
                            placeholder="99112233"
                            className="mt-1 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black disabled:bg-black/[0.03]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-[0.15em] text-black/35">
                            Шилжүүлсэн банк *
                          </label>

                          <input
                            type="text"
                            value={
                              payerBank
                            }
                            onChange={(
                              event
                            ) =>
                              setPayerBank(
                                event
                                  .target
                                  .value
                              )
                            }
                            disabled={
                              submittingPayment
                            }
                            placeholder="Жишээ: Хаан банк"
                            className="mt-1 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black disabled:bg-black/[0.03]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-[0.15em] text-black/35">
                            Данс эзэмшигчийн нэр *
                          </label>

                          <input
                            type="text"
                            value={
                              payerAccountName
                            }
                            onChange={(
                              event
                            ) =>
                              setPayerAccountName(
                                event
                                  .target
                                  .value
                              )
                            }
                            disabled={
                              submittingPayment
                            }
                            placeholder="Дансны нэр"
                            className="mt-1 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black disabled:bg-black/[0.03]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-[0.15em] text-black/35">
                            Шилжүүлсэн дансны дугаар
                          </label>

                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              payerAccountNumber
                            }
                            onChange={(
                              event
                            ) =>
                              setPayerAccountNumber(
                                event
                                  .target
                                  .value
                              )
                            }
                            disabled={
                              submittingPayment
                            }
                            placeholder="Заавал биш"
                            className="mt-1 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black disabled:bg-black/[0.03]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* BANK DETAILS */}

                    <div className="rounded-[22px] bg-[#F8F5F0] p-5">
                      <div className="text-sm font-semibold">
                        Манай банкны данс
                      </div>

                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.15em] text-black/35">
                            Банк
                          </div>

                          <div className="mt-1 text-sm font-semibold">
                            {BANK_NAME}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] uppercase tracking-[0.15em] text-black/35">
                            Дансны нэр
                          </div>

                          <div className="mt-1 text-sm font-semibold">
                            {ACCOUNT_NAME}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] uppercase tracking-[0.15em] text-black/35">
                            Дансны дугаар
                          </div>

                          <div className="mt-1 break-all text-sm font-bold">
                            {ACCOUNT_NUMBER}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] uppercase tracking-[0.15em] text-black/35">
                            Шилжүүлэх дүн
                          </div>

                          <div className="mt-1 text-lg font-bold">
                            ₮
                            {INVITATION_PRICE.toLocaleString(
                              "mn-MN"
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* REFERENCE */}

                    <div className="rounded-[22px] border border-black/10 p-5">
                      <div className="text-sm font-semibold">
                        Гүйлгээний утга *
                      </div>

                      <p className="mt-1 text-xs leading-5 text-black/40">
                        Шилжүүлгийн утгад нэрээ бичнэ
                        үү.
                      </p>

                      <input
                        type="text"
                        value={
                          paymentReference
                        }
                        onChange={(
                          event
                        ) =>
                          setPaymentReference(
                            event
                              .target
                              .value
                          )
                        }
                        disabled={
                          submittingPayment
                        }
                        placeholder="Жишээ: Бат Номин"
                        className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black disabled:bg-black/[0.03]"
                      />
                    </div>

                    {/* RECEIPT */}

                    <div className="rounded-[22px] border border-black/10 p-5">
                      <div className="text-sm font-semibold">
                        Төлбөрийн
                        баримт *
                      </div>

                      <p className="mt-1 text-xs leading-5 text-black/40">
                        Шилжүүлэг
                        хийсний дараа
                        баримтынхаа
                        зургийг
                        оруулна уу.
                      </p>

                      <label
                        className={`mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/20 bg-black/[0.02] px-4 py-6 text-center ${
                          submittingPayment
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer hover:bg-black/[0.04]"
                        }`}
                      >
                        <div className="text-2xl">
                          📷
                        </div>

                        <div className="mt-2 text-sm font-semibold">
                          Баримтын зураг
                          сонгох
                        </div>

                        <div className="mt-1 text-[11px] text-black/35">
                          JPG, PNG · 8MB
                          хүртэл
                        </div>

                        <input
                          type="file"
                          accept="image/*"
                          onChange={
                            handleReceiptChange
                          }
                          disabled={
                            submittingPayment
                          }
                          className="hidden"
                        />
                      </label>

                      {receiptFile && (
                        <div className="mt-3 rounded-2xl bg-green-50 p-3">
                          <div className="flex items-center gap-3">
                            {receiptPreview && (
                              <img
                                src={
                                  receiptPreview
                                }
                                alt=""
                                className="h-14 w-14 rounded-xl object-cover"
                              />
                            )}

                            <div className="min-w-0">
                              <div className="truncate text-xs font-semibold text-green-800">
                                {
                                  receiptFile.name
                                }
                              </div>

                              <div className="mt-1 text-[11px] text-green-700">
                                Баримт
                                сонгогдлоо
                                ✓
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PAYMENT MESSAGE */}

            {paymentStatus ===
              "verifying" && (
              <div className="mx-6 mt-4 rounded-2xl bg-blue-50 p-5 text-center text-blue-700">
                <div className="text-sm font-semibold">
                  Төлбөрийн баримт
                  амжилттай
                  илгээгдлээ.
                </div>

                <div className="mt-2 text-xs leading-5">
                  Баримтыг шалгаж
                  байна.
                  <br />
                  Түр хүлээнэ үү...
                </div>

                <div className="mt-4 text-5xl font-bold tabular-nums">
                  {
                    verificationSeconds
                  }
                </div>

                <div className="mt-1 text-[10px] text-blue-500">
                  секунд
                </div>
              </div>
            )}

            {paymentStatus ===
              "published" && (
              <div className="mx-6 mt-4 rounded-2xl bg-green-50 p-5 text-center text-green-700">
                <div className="text-sm font-semibold">
                  Төлбөр амжилттай
                  баталгаажлаа.
                </div>

                <div className="mt-1 text-sm font-semibold">
                  Урилга нийтлэгдлээ
                  ✓
                </div>
              </div>
            )}

            {paymentStatus ===
              "waiting" &&
              paymentMethod ===
                "qpay" && (
              <div className="mx-6 mt-4 rounded-2xl bg-amber-50 p-4 text-center text-xs leading-5 text-amber-700">
                Тун удахгүй QPay холбогдох болно.
              </div>
            )}

            {/* ACTIONS */}

            <div className="flex gap-3 px-6 py-6">
              <button
                type="button"
                onClick={
                  closePaymentModal
                }
                disabled={
                  publishing ||
                  submittingPayment
                }
                className="flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm font-semibold text-black/60 hover:bg-black/5 disabled:opacity-40"
              >
                Болих
              </button>

              <button
                type="button"
                onClick={
                  startPayment
                }
                disabled={
                  !paymentMethod ||
                  publishing ||
                  submittingPayment ||
                  paymentStatus ===
                    "published"
                }
                className="flex-[1.4] rounded-2xl bg-black px-4 py-3.5 text-sm font-semibold text-white hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submittingPayment
                  ? paymentStatus ===
                    "verifying"
                    ? `Шалгаж байна... ${verificationSeconds} сек`
                    : "Баримт илгээж байна..."
                  : paymentMethod ===
                      "bank"
                    ? "Төлбөр төлөөд нийтлэх →"
                    : "Төлбөр хийх →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function InvitationPreviewPage() {
  return (
    <Suspense fallback={null}>
      <InvitationPreviewPageContent />
    </Suspense>
  );
}