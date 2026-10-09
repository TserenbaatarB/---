"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import * as QRCode from "qrcode";

import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toIndexedDbBlob } from "@/lib/indexedDbBlob";
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
  galleryCaptions: string[];
  savedAt: string;
};

type StoredInvitationImages = {
  backgroundId: string | null;
  galleryIds: string[];
  galleryCaptions?: string[];
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

function hasActiveMembership(
  expiresAt: string | null | undefined
) {
  return Boolean(
    expiresAt &&
      new Date(expiresAt).getTime() >
        Date.now()
  );
}

/*
 * =========================================================
 * INDEXEDDB
 * =========================================================
 */

function openImageDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;

      if (
        !db.objectStoreNames.contains(
          STORE_NAME
        )
      ) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function getStoredImage(
  id: string
): Promise<Blob | null> {
  if (!id) return null;

  const db = await openImageDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readonly"
    );

    const store =
      transaction.objectStore(
        STORE_NAME
      );

    const request = store.get(id);

    request.onsuccess = () => {
      db.close();

      resolve(toIndexedDbBlob(request.result));
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

function getImageExtension(
  blob: Blob
): string {
  const type = (
    blob.type || ""
  ).toLowerCase();

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

function getMusicExtension(
  blob: Blob
): string {
  const type = (
    blob.type || ""
  ).toLowerCase();

  if (
    type === "audio/mpeg" ||
    type === "audio/mp3"
  ) {
    return "mp3";
  }

  if (
    type === "audio/wav" ||
    type === "audio/x-wav"
  ) {
    return "wav";
  }

  if (type === "audio/ogg") {
    return "ogg";
  }

  if (
    type === "audio/mp4" ||
    type === "audio/x-m4a"
  ) {
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
    sessionStorage.getItem(
      "invitation-images"
    );

  if (!storedImagesRaw) {
    return {
      backgroundPath: null,
      galleryPaths: [],
    };
  }

  let imageData: StoredInvitationImages;

  try {
    imageData = JSON.parse(
      storedImagesRaw
    );
  } catch {
    throw new Error(
      "Урилгын зургийн мэдээлэл уншихад алдаа гарлаа."
    );
  }

  const basePath = `${userId}/${invitationId}`;

  let backgroundPath: string | null =
    null;

  const galleryPaths: string[] = [];

  /*
   * BACKGROUND
   */

  if (imageData.backgroundId) {
    const backgroundBlob =
      await getStoredImage(
        imageData.backgroundId
      );

    if (backgroundBlob) {
      const contentType =
        backgroundBlob.type ||
        "image/jpeg";

      const extension =
        getImageExtension(
          backgroundBlob
        );

      backgroundPath =
        `${basePath}/background.${extension}`;

      const {
        error:
          backgroundUploadError,
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

  const isStoragePath = (value: unknown): value is string =>
    typeof value === "string" &&
    value.includes("/") &&
    !value.startsWith("http") &&
    !value.startsWith("blob:");

  // Re-publishing an edited invitation: keep images already in storage.
  if (
    !backgroundPath &&
    isStoragePath(imageData.backgroundId)
  ) {
    backgroundPath = imageData.backgroundId;
  }

  /*
   * GALLERY
   */

  for (
    let index = 0;
    index <
    (imageData.galleryIds ?? [])
      .length;
    index++
  ) {
    const galleryId =
      imageData.galleryIds[index];

    const galleryBlob =
      await getStoredImage(
        galleryId
      );

    if (!galleryBlob) {
      if (isStoragePath(galleryId)) {
        galleryPaths.push(galleryId);
      }
      continue;
    }

    const contentType =
      galleryBlob.type ||
      "image/jpeg";

    const extension =
      getImageExtension(
        galleryBlob
      );

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

    galleryPaths.push(
      galleryPath
    );
  }

  /*
   * SAVE STORAGE PATHS TO DB
   *
   * gallery_captions is also saved here so that
   * the captions stay matched with gallery order.
   */

  const galleryCaptions =
    imageData.galleryCaptions ?? [];

  const {
    error: pathUpdateError,
  } = await supabase
    .from("invitations")
    .update({
      background_id:
        backgroundPath,
      gallery_ids:
        galleryPaths,
      gallery_urls: [],
      gallery_captions:
        galleryCaptions,
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      invitationId
    )
    .eq(
      "user_id",
      userId
    );

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
    const { error } =
      await supabase
        .from("invitations")
        .update({
          music_path: null,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          invitationId
        )
        .eq(
          "user_id",
          userId
        );

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
      JSON.parse(
        storedMusicRaw
      );
  } catch {
    throw new Error(
      "Урилгын хөгжмийн мэдээлэл уншихад алдаа гарлаа."
    );
  }

  /*
   * MUSIC NOT SELECTED
   */

  if (
    musicData.musicType !==
      "custom" ||
    !musicData.musicId
  ) {
    const { error } =
      await supabase
        .from("invitations")
        .update({
          music_path: null,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          invitationId
        )
        .eq(
          "user_id",
          userId
        );

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
    // Builder → preview without re-selecting: the file is already in storage.
    if (
      musicData.musicId.includes("/") &&
      !musicData.musicId.startsWith("blob:")
    ) {
      return musicData.musicId;
    }

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
  } =
    await supabase
      .from("invitations")
      .update({
        music_path:
          musicPath,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        invitationId
      )
      .eq(
        "user_id",
        userId
      );

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

function getVideoExtension(
  blob: Blob
): string {
  const type = (
    blob.type || ""
  ).toLowerCase();

  if (
    type === "video/webm"
  ) {
    return "webm";
  }

  if (
    type === "video/quicktime"
  ) {
    return "mov";
  }

  return "mp4";
}

async function uploadInvitationVideo(
  userId: string,
  invitationId: string,
  musicPath: string | null
): Promise<void> {
  const folder =
    `${userId}/${invitationId}`;

  let coverVideoId:
    | string
    | null = null;

  try {
    const rawExtras =
      sessionStorage.getItem(
        "invitation-extras"
      );

    coverVideoId = rawExtras
      ? (
          JSON.parse(
            rawExtras
          ).coverVideoId ??
          null
        )
      : null;
  } catch {
    coverVideoId = null;
  }

  const bucket =
    supabase.storage.from(
      "invitation-music"
    );

  const videoBlob =
    coverVideoId
      ? await getStoredImage(
          coverVideoId
        )
      : null;

  if (!videoBlob) {
    const { data: files } =
      await bucket.list(
        folder
      );

    const stale =
      (files ?? [])
        .filter((file) =>
          file.name.startsWith(
            "video."
          )
        )
        .map(
          (file) =>
            `${folder}/${file.name}`
        );

    if (stale.length > 0) {
      await bucket.remove(
        stale
      );
    }

    return;
  }

  const videoPath =
    `${folder}/video.${getVideoExtension(
      videoBlob
    )}`;

  const {
    error: uploadError,
  } = await bucket.upload(
    videoPath,
    videoBlob,
    {
      cacheControl:
        "31536000",
      upsert: true,
      contentType:
        videoBlob.type ||
        "video/mp4",
    }
  );

  if (uploadError) {
    throw new Error(
      `Видео upload хийхэд алдаа гарлаа: ${uploadError.message}`
    );
  }

  if (musicPath) {
    return;
  }

  const {
    error: pathError,
  } = await supabase
    .from("invitations")
    .update({
      music_path:
        videoPath,
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      invitationId
    )
    .eq(
      "user_id",
      userId
    );

  if (pathError) {
    throw new Error(
      `Видеоны path хадгалахад алдаа гарлаа: ${pathError.message}`
    );
  }
}

/*
 * =========================================================
 * SAVE EXTRAS
 * =========================================================
 */

async function saveInvitationExtras(
  userId: string,
  invitationId: string
): Promise<void> {
  try {
    const raw =
      sessionStorage.getItem(
        "invitation-extras"
      );

    if (!raw) return;

    const {
      coverVideoId: _id,
      coverVideoName: _name,
      coverVideoPath: _path,
      ...extras
    } = JSON.parse(raw);

    const { error } =
      await supabase
        .from("invitations")
        .update({
          extras,
        })
        .eq(
          "id",
          invitationId
        )
        .eq(
          "user_id",
          userId
        );

    if (error) {
      console.error(
        "SAVE EXTRAS ERROR:",
        error
      );
    }
  } catch (error) {
    console.error(
      "SAVE EXTRAS ERROR:",
      error
    );
  }
}

/*
 * =========================================================
 * DATE
 * =========================================================
 */

function formatDate(
  date: string
) {
  if (!date) return "";

  const selectedDate =
    new Date(
      `${date}T00:00:00`
    );

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
    .replace(
      /\s+/g,
      "-"
    )
    .replace(
      /[^a-z0-9а-яөүё-]/gi,
      ""
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-|-$/g,
      ""
    );
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
      .substring(
        2,
        8
      );

  return `${base}-${randomPart}`;
}

/*
 * =========================================================
 * PAGE
 * =========================================================
 */

function InvitationPreviewPageContent() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const eventType =
    searchParams.get(
      "event"
    ) ?? "wedding";

  const template =
    searchParams.get(
      "template"
    ) ?? "classic-gold";

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

  const [
    galleryCaptions,
    setGalleryCaptions,
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
      ? galleryIndex %
        galleryUrls.length
      : 0;

  const [
    musicPlaying,
    setMusicPlaying,
  ] =
    useState(false);

  const musicRef =
    useRef<HTMLAudioElement | null>(
      null
    );

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

  const [
    qrCodeUrl,
    setQrCodeUrl,
  ] =
    useState<string | null>(
      null
    );

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

        /*
         * Backward compatibility:
         * old drafts may not have galleryCaptions.
         */

        const normalizedDraft: InvitationDraft =
          {
            ...parsedDraft,
            galleryCaptions:
              Array.isArray(
                parsedDraft.galleryCaptions
              )
                ? parsedDraft.galleryCaptions
                : [],
          };

        if (!cancelled) {
          setDraft(
            normalizedDraft
          );

          setGalleryCaptions(
            normalizedDraft.galleryCaptions
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

          const loadedCaptions:
            string[] = [];

          for (
            let index = 0;
            index <
            (
              imageData.galleryIds ??
              []
            ).length;
            index++
          ) {
            const galleryId =
              imageData.galleryIds[
                index
              ];

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

              loadedCaptions.push(
                imageData
                  .galleryCaptions?.[
                  index
                ] ??
                  normalizedDraft
                    .galleryCaptions?.[
                    index
                  ] ??
                  ""
              );
            }
          }

          if (!cancelled) {
            setGalleryUrls(
              loadedGallery
            );

            setGalleryCaptions(
              loadedCaptions
            );
          }
        } else if (
          !cancelled
        ) {
          setGalleryCaptions(
            normalizedDraft.galleryCaptions ??
              []
          );
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

              setCoverVideoEnded(
                false
              );
            } else if (
              !cancelled
            ) {
              setCoverVideoEnded(
                true
              );
            }
          } catch (videoError) {
            console.error(
              "Cover video load error:",
              videoError
            );

            if (!cancelled) {
              setCoverVideoEnded(
                true
              );
            }
          }
        } else if (
          !cancelled
        ) {
          setCoverVideoEnded(
            true
          );
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
            } else if (
              !cancelled
            ) {
              setMusicUrl(null);
              setMusicName(null);
              setMusicType(
                "none"
              );
            }
          } catch (musicError) {
            console.error(
              "Music load error:",
              musicError
            );

            if (!cancelled) {
              setMusicUrl(null);
              setMusicName(null);
              setMusicType(
                "none"
              );
            }
          }
        } else if (
          !cancelled
        ) {
          setMusicUrl(null);
          setMusicName(null);
          setMusicType(
            "none"
          );
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
    if (
      galleryUrls.length <= 1
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setGalleryIndex(
            (current) =>
              (current + 1) %
              galleryUrls.length
          );
        },
        4000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    galleryUrls.length,
  ]);

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
            url.startsWith(
              "blob:"
            )
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
        setMusicPlaying(
          true
        );
      } else {
        audio.pause();
        setMusicPlaying(
          false
        );
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
    const invitationId =
      searchParams.get("invitationId") ||
      draft?.id;

    router.push(
      `/dashboard/invitations/new/builder?event=${encodeURIComponent(
        eventType
      )}&template=${encodeURIComponent(
        template
      )}${
        invitationId
          ? `&invitationId=${encodeURIComponent(invitationId)}`
          : ""
      }`
    );
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
       * MEMBERSHIP
       */

      const {
        data: membership,
        error: membershipError,
      } =
        await supabase
          .from(
            "user_memberships"
          )
          .select(
            "expires_at"
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

      if (membershipError) {
        throw membershipError;
      }

      if (
        !membership ||
        !hasActiveMembership(
          membership.expires_at
        )
      ) {
        router.push(
          "/dashboard/billing"
        );

        return;
      }

      /*
       * EXISTING INVITATION
       */

      const existingId =
        searchParams.get("invitationId") ||
        draft.id ||
        sessionStorage.getItem(
          "invitation-id"
        ) ||
        sessionStorage.getItem(
          "published-invitation-id"
        ) ||
        "";

      let invitationId: string =
        existingId;

      let publicSlug = "";

      // Re-publishing keeps the same public link.
      if (existingId) {
        const { data: existingRow } =
          await supabase
            .from("invitations")
            .select("public_slug")
            .eq("id", existingId)
            .eq("user_id", user.id)
            .maybeSingle();

        publicSlug =
          existingRow?.public_slug ?? "";
      }

      if (!publicSlug && !existingId) {
        publicSlug =
          publishedSlug ||
          sessionStorage.getItem(
            "published-invitation-slug"
          ) ||
          "";
      }

      if (!publicSlug) {
        publicSlug =
          createPublicSlug(
            draft.names,
            draft.eventType
          );
      }

      const now =
        new Date().toISOString();

      /*
       * GALLERY CAPTIONS
       *
       * Prefer draft data.
       * If draft is old, fall back to
       * sessionStorage invitation-images.
       */

      let finalGalleryCaptions =
        Array.isArray(
          draft.galleryCaptions
        )
          ? draft.galleryCaptions
          : [];

      const storedImagesRaw =
        sessionStorage.getItem(
          "invitation-images"
        );

      if (
        storedImagesRaw &&
        finalGalleryCaptions.length ===
          0
      ) {
        try {
          const imageData:
            StoredInvitationImages =
            JSON.parse(
              storedImagesRaw
            );

          finalGalleryCaptions =
            imageData.galleryCaptions ??
            [];
        } catch {
          finalGalleryCaptions =
            [];
        }
      }

      /*
       * INVITATION DATA
       */

      const invitationData = {
        user_id:
          user.id,

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

        /*
         * NEW:
         * Save gallery captions to Supabase.
         */

        gallery_captions:
          finalGalleryCaptions,

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
            .from(
              "invitations"
            )
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
            .from(
              "invitations"
            )
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
        musicType ===
        "custom"
      ) {
        setPublishMessage(
          "Урилгын хөгжмийг хадгалж байна..."
        );
      }

      const savedMusicPath =
        await uploadInvitationMusic(
          user.id,
          invitationId
        );

      /*
       * UPLOAD COVER VIDEO
       */

      setPublishMessage(
        "Урилгын видеог хадгалж байна..."
      );

      await uploadInvitationVideo(
        user.id,
        invitationId,
        savedMusicPath
      );

      /*
       * SAVE EXTRAS
       */

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
        galleryCaptions:
          finalGalleryCaptions,
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

      setGalleryCaptions(
        finalGalleryCaptions
      );

      setPublishMessage(
        "Урилга амжилттай нийтлэгдлээ ✓"
      );

      void generatePublicQrCode(
        publicSlug
      );
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
      setPublishing(
        false
      );
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
      .writeText(
        publicUrl
      )
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

  /*
   * =========================================================
   * QR CODE
   * =========================================================
   */

  async function generatePublicQrCode(
    slug: string
  ) {
    if (!slug) {
      return;
    }

    try {
      const publicUrl =
        `${window.location.origin}/u/${slug}`;

      const qrDataUrl =
        await QRCode.toDataURL(
          publicUrl,
          {
            width: 320,
            margin: 2,
            errorCorrectionLevel:
              "H",
          }
        );

      setQrCodeUrl(
        qrDataUrl
      );
    } catch (error) {
      console.error(
        "QR CODE ERROR:",
        error
      );

      setQrCodeUrl(
        null
      );
    }
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
      <main className="flex min-h-screen items-center justify-center bg-[#F4F1EC]">
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
      <main className="flex min-h-screen items-center justify-center bg-[#F4F1EC] px-5">
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
    typeof extras?.lat ===
      "number" &&
    typeof extras?.lng ===
      "number";

  const mapLatitude =
    typeof extras?.lat ===
    "number"
      ? extras.lat
      : null;

  const mapLongitude =
    typeof extras?.lng ===
    "number"
      ? extras.lng
      : null;

  const mapUrl =
    typeof extras?.mapUrl ===
    "string"
      ? extras.mapUrl
      : "";

  const rsvpSettings =
    extras?.rsvp;

  const rsvpEnabled =
    rsvpSettings?.enabled ===
    true;

  const rsvpDeadline =
    rsvpSettings?.deadline ||
    "";

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
              Урилгын Preview
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
          onStepClick={(
            target
          ) => {
            if (
              target === 3
            ) {
              goBackToBuilder();
            } else if (
              target < 3
            ) {
              const invitationId =
                searchParams.get("invitationId") ||
                draft?.id;

              router.push(
                `/dashboard/invitations/new/details?event=${encodeURIComponent(
                  eventType
                )}&template=${encodeURIComponent(
                  template
                )}${
                  invitationId
                    ? `&invitationId=${encodeURIComponent(invitationId)}`
                    : ""
                }&step=${target}`
              );
            }
          }}
        />
      </div>

      {/* CONTENT */}

      <section className="px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto flex max-w-2xl justify-center">
          <div className="w-full">
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

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-black/45">
                    Caption
                  </span>

                  <span className="text-xs font-semibold">
                    {
                      galleryCaptions.filter(
                        (caption) =>
                          Boolean(
                            caption?.trim()
                          )
                      ).length
                    }{" "}
                    тайлбар
                  </span>
                </div>
              </div>

              {/* GALLERY PREVIEW */}

              {galleryUrls.length >
                0 && (
                <div className="mt-3 rounded-2xl border border-black/10 p-4">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-black/35">
                    Gallery Preview
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {galleryUrls.map(
                      (
                        url,
                        index
                      ) => {
                        const caption =
                          galleryCaptions[
                            index
                          ]?.trim() ||
                          "";

                        return (
                          <div
                            key={`${url}-${index}`}
                          >
                            <div className="aspect-square overflow-hidden rounded-2xl bg-[#F8F5F0]">
                              <img
                                src={
                                  url
                                }
                                alt={
                                  caption ||
                                  `Gallery зураг ${
                                    index +
                                    1
                                  }`
                                }
                                className="h-full w-full object-cover"
                              />
                            </div>

                            {caption && (
                              <p className="mt-2 px-1 text-center text-[10px] leading-4 text-black/55">
                                {
                                  caption
                                }
                              </p>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* EXTRA STATUS */}

              <div className="mt-3 rounded-2xl border border-black/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-black/45">
                    Map
                  </span>

                  <span
                    className={`text-xs font-semibold ${
                      hasMap ||
                      mapUrl
                        ? "text-green-700"
                        : "text-black/30"
                    }`}
                  >
                    {hasMap ||
                    mapUrl
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
                    handlePublish
                  }
                  disabled={
                    publishing
                  }
                  className="mt-3 w-full rounded-2xl bg-black px-5 py-3.5 text-sm font-semibold text-white hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {publishing
                    ? "Нийтэлж байна..."
                    : "Урилгаа нийтлэх →"}
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

              {/* QR */}

              {qrCodeUrl && (
                <div className="mt-5 rounded-3xl border border-black/10 bg-white p-5 text-center">
                  <p className="text-sm font-bold text-black/80">
                    📱 QR кодоор хуваалцах
                  </p>

                  <p className="mt-1 text-xs text-black/45">
                    QR кодыг уншуулаад урилгаа шууд нээнэ.
                  </p>

                  <div className="mt-4 flex flex-col items-center">
                    <img
                      src={
                        qrCodeUrl
                      }
                      alt="Урилгын QR код"
                      className="h-56 w-56 rounded-2xl"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const link =
                          document.createElement(
                            "a"
                          );

                        link.href =
                          qrCodeUrl;

                        link.download =
                          "urilga-qr-code.png";

                        document.body.appendChild(
                          link
                        );

                        link.click();

                        document.body.removeChild(
                          link
                        );
                      }}
                      className="mt-4 w-full rounded-2xl bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-black/80"
                    >
                      ⬇️ QR код татах
                    </button>
                  </div>
                </div>
              )}

              {publishedSlug && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm font-semibold text-black/70 hover:bg-black/5"
                  >
                    📋 Миний урилгууд
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm font-semibold text-black/70 hover:bg-black/5"
                  >
                    🏠 Нүүр хуудас
                  </button>
                </div>
              )}

              <p className="mt-4 text-center text-[10px] leading-5 text-black/30">
                Сарын эрх идэвхтэй үед урилгаа нийтлэх боломжтой.
              </p>
            </div>
          </div>
        </div>
      </section>
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