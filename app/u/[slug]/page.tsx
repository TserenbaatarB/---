"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import EventCalendar from "./EventCalendar";
import RsvpSection from "./RsvpSection";

type OpeningStyle =
  | "envelope"
  | "light"
  | "focus"
  | "curtain"
  | "pulse"
  | "circle"
  | string;

type PublicInvitation = {
  id: string;
  event_type: string;
  template: string;
  title: string;
  names: string;
  event_date: string;
  event_time: string;
  venue: string;
  address: string;
  message: string;
  phone: string;
  selected_style: string;
  active_section: string;
  background_id: string | null;
  background_url: string | null;
  gallery_ids: unknown;
  gallery_urls: unknown;
  gallery_captions: unknown;
  music_path: string | null;
  public_slug: string;
  published_at: string | null;
  extras?: {
    lat: number | null;
    lng: number | null;
    mapUrl: string;

    appearance?: {
      open?: OpeningStyle;
      animation?: string;
      accent?: string;
      tone?: string;
      pattern?: string;
      frame?: string;
    };
  } | null;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key);
}

function hasText(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function getGalleryUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0 &&
      (item.startsWith("http://") ||
        item.startsWith("https://"))
  );
}

function getGalleryCaptions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) =>
    typeof item === "string" ? item : ""
  );
}

function getStyle(style: string) {
  switch (style) {
    case "luxury":
      return {
        page: "bg-[#f4efe5] text-[#2c241b]",
        card: "bg-[#fffdf8]",
        accent: "#b08d57",
        accentSoft: "#f3ead9",
        border: "border-[#d8c7a8]",
        button: "bg-[#2c241b] text-white",
      };

    case "minimal":
      return {
        page: "bg-[#f5f5f3] text-[#202020]",
        card: "bg-white",
        accent: "#555555",
        accentSoft: "#eeeeec",
        border: "border-[#ddddda]",
        button: "bg-[#202020] text-white",
      };

    case "garden":
      return {
        page: "bg-[#eef4eb] text-[#263326]",
        card: "bg-[#fffef9]",
        accent: "#6d8b63",
        accentSoft: "#e4eee0",
        border: "border-[#cbd9c6]",
        button: "bg-[#4f6849] text-white",
      };

    case "romantic":
    default:
      return {
        page: "bg-[#f9f1f1] text-[#392a2d]",
        card: "bg-[#fffafa]",
        accent: "#a66a78",
        accentSoft: "#f5e5e8",
        border: "border-[#e5cdd2]",
        button: "bg-[#8e5967] text-white",
      };
  }
}

function getOpeningStyle(
  invitation: PublicInvitation
): OpeningStyle {
  const value = invitation.extras?.appearance?.open;

  if (!value) {
    return "envelope";
  }

  return value;
}

function getOpeningLabel(open: OpeningStyle) {
  switch (open) {
    case "envelope":
    case "dugtui":
      return "Дугтуй";

    case "light":
    case "gerel":
    case "гэрэл":
      return "Гэрэл цацрах";

    case "focus":
    case "fokus":
      return "Фокуслах";

    case "curtain":
    case "hoshig":
      return "Хөшиг нээгдэх";

    case "pulse":
    case "lugshih":
      return "Лугших";

    case "circle":
    case "hureel":
      return "Хүрээлэх";

    default:
      return "Дугтуй";
  }
}

export default function PublicInvitationPage() {
  const params = useParams();

  const slug = useMemo(() => {
    const rawSlug = params?.slug;

    if (Array.isArray(rawSlug)) {
      return rawSlug[0] ?? "";
    }

    return typeof rawSlug === "string"
      ? decodeURIComponent(rawSlug).trim()
      : "";
  }, [params]);

  const [invitation, setInvitation] =
    useState<PublicInvitation | null>(null);

  const [loading, setLoading] = useState(true);

  const [currentSlide, setCurrentSlide] = useState(0);

  const [musicUrl, setMusicUrl] =
    useState<string | null>(null);

  const [musicPlaying, setMusicPlaying] =
    useState(false);

  const [audioReady, setAudioReady] =
    useState(false);

  const [musicError, setMusicError] =
    useState(false);

  const [videoUrl, setVideoUrl] =
    useState<string | null>(null);

  const [videoDone, setVideoDone] =
    useState(false);

  const [videoChecked, setVideoChecked] =
    useState(false);

  const [openingStarted, setOpeningStarted] =
    useState(false);

  const [openingFinished, setOpeningFinished] =
    useState(false);

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const musicIsVideo =
    /\.(mp4|webm|mov)$/i.test(
      invitation?.music_path ?? ""
    );

  const galleryUrls = useMemo(() => {
    if (!invitation) {
      return [];
    }

    return getGalleryUrls(
      invitation.gallery_urls
    );
  }, [invitation]);

  const galleryCaptions = useMemo(() => {
    if (!invitation) {
      return [];
    }

    return getGalleryCaptions(
      invitation.gallery_captions
    );
  }, [invitation]);

  const openingStyle = useMemo(() => {
    if (!invitation) {
      return "envelope";
    }

    return getOpeningStyle(invitation);
  }, [invitation]);

  const showInvitation =
    videoChecked &&
    (videoDone ||
      (!videoUrl && !musicIsVideo)) &&
    openingFinished;

  /*
   * ============================================================
   * LOAD PUBLIC INVITATION
   * ============================================================
   */

  useEffect(() => {
    if (!slug) {
      return;
    }

    let cancelled = false;

    async function loadInvitation() {
      try {
        setLoading(true);

        const supabase = getSupabase();

        const { data, error } =
          await supabase.rpc(
            "get_public_invitation",
            {
              p_slug: slug,
            }
          );

        if (error) {
          console.error(
            "PUBLIC INVITATION ERROR:",
            error
          );

          if (!cancelled) {
            setInvitation(null);
            setLoading(false);
          }

          return;
        }

        const result = (
          Array.isArray(data)
            ? data[0]
            : null
        ) as PublicInvitation | undefined;

        if (!result) {
          if (!cancelled) {
            setInvitation(null);
            setLoading(false);
          }

          return;
        }

        let mapExtras:
          | PublicInvitation["extras"]
          | null = null;

        let backgroundUrl: string | null = null;

        let publishedGalleryUrls: string[] = [];

        let publishedGalleryCaptions: string[] = [];

        /*
         * --------------------------------------------------------
         * LOAD PUBLIC DESIGN DATA
         * --------------------------------------------------------
         */

        try {
          const mapResponse =
            await fetch(
              `/api/ai/design/public-invitation/${encodeURIComponent(
                slug
              )}`,
              {
                method: "GET",
                cache: "no-store",
              }
            );

          if (mapResponse.ok) {
            const mapData =
              await mapResponse.json();

            backgroundUrl =
              typeof mapData?.backgroundUrl ===
              "string"
                ? mapData.backgroundUrl
                : null;

            publishedGalleryUrls =
              getGalleryUrls(
                mapData?.galleryUrls
              );

            publishedGalleryCaptions =
              getGalleryCaptions(
                mapData?.galleryCaptions
              );

            const rawExtras =
              mapData?.extras ??
              result.extras ??
              null;

            if (rawExtras) {
              const rawAppearance =
                rawExtras?.appearance;

              mapExtras = {
                lat:
                  typeof rawExtras.lat ===
                  "number"
                    ? rawExtras.lat
                    : null,

                lng:
                  typeof rawExtras.lng ===
                  "number"
                    ? rawExtras.lng
                    : null,

                mapUrl:
                  typeof rawExtras.mapUrl ===
                  "string"
                    ? rawExtras.mapUrl
                    : "",

                appearance:
                  rawAppearance &&
                  typeof rawAppearance ===
                    "object"
                    ? {
                        open:
                          typeof rawAppearance.open ===
                          "string"
                            ? rawAppearance.open
                            : undefined,

                        animation:
                          typeof rawAppearance.animation ===
                          "string"
                            ? rawAppearance.animation
                            : undefined,

                        accent:
                          typeof rawAppearance.accent ===
                          "string"
                            ? rawAppearance.accent
                            : undefined,

                        tone:
                          typeof rawAppearance.tone ===
                          "string"
                            ? rawAppearance.tone
                            : undefined,

                        pattern:
                          typeof rawAppearance.pattern ===
                          "string"
                            ? rawAppearance.pattern
                            : undefined,

                        frame:
                          typeof rawAppearance.frame ===
                          "string"
                            ? rawAppearance.frame
                            : undefined,
                      }
                    : undefined,
              };
            }
          } else {
            console.error(
              "PUBLIC INVITATION EXTRAS RESPONSE ERROR:",
              mapResponse.status,
              await mapResponse.text()
            );
          }
        } catch (mapError) {
          console.error(
            "PUBLIC MAP DATA ERROR:",
            mapError
          );
        }

        /*
         * --------------------------------------------------------
         * FALLBACK EXTRAS
         * --------------------------------------------------------
         */

        if (!mapExtras && result.extras) {
          mapExtras = result.extras;
        }

        /*
         * --------------------------------------------------------
         * SET INVITATION
         * --------------------------------------------------------
         */

        if (!cancelled) {
          const resultCaptions =
            getGalleryCaptions(
              result.gallery_captions
            );

          const finalExtras: NonNullable<
            PublicInvitation["extras"]
          > = {
            lat:
              mapExtras?.lat ??
              result.extras?.lat ??
              null,

            lng:
              mapExtras?.lng ??
              result.extras?.lng ??
              null,

            mapUrl:
              mapExtras?.mapUrl ??
              result.extras?.mapUrl ??
              "",

            appearance: {
              ...(result.extras?.appearance ?? {}),
              ...(mapExtras?.appearance ?? {}),
            },
          };

          setInvitation({
            ...result,

            background_url:
              backgroundUrl ??
              result.background_url ??
              null,

            gallery_urls:
              publishedGalleryUrls.length > 0
                ? publishedGalleryUrls
                : result.gallery_urls,

            gallery_captions:
              publishedGalleryCaptions.length > 0
                ? publishedGalleryCaptions
                : resultCaptions,

            extras: finalExtras,
          });

          setOpeningStarted(false);
          setOpeningFinished(false);

          setLoading(false);
        }
      } catch (error) {
        console.error(
          "PUBLIC INVITATION LOAD ERROR:",
          error
        );

        if (!cancelled) {
          setInvitation(null);
          setLoading(false);
        }
      }
    }

    loadInvitation();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  /*
   * ============================================================
   * LOAD MUSIC / VIDEO
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadMedia() {
      if (!invitation?.music_path) {
        if (!cancelled) {
          setMusicUrl(null);
          setVideoUrl(null);
          setVideoChecked(true);
          setVideoDone(true);
          setAudioReady(false);
          setMusicPlaying(false);
          setMusicError(false);
        }

        return;
      }

      try {
        setMusicError(false);
        setAudioReady(false);
        setMusicPlaying(false);
        setMusicUrl(null);
        setVideoUrl(null);

        const supabase = getSupabase();

        if (musicIsVideo) {
          setVideoChecked(false);
          setVideoDone(false);
        }

        const { data, error } =
          await supabase.storage
            .from("invitation-music")
            .createSignedUrl(
              invitation.music_path,
              60 * 60 * 24
            );

        if (
          error ||
          !data?.signedUrl
        ) {
          console.error(
            "MEDIA SIGNED URL ERROR:",
            error
          );

          if (!cancelled) {
            setMusicError(true);
            setMusicUrl(null);
            setVideoChecked(true);
            setVideoDone(true);
          }

          return;
        }

        if (cancelled) {
          return;
        }

        const signedUrl =
          data.signedUrl;

        setMusicUrl(signedUrl);

        if (musicIsVideo) {
          setVideoUrl(signedUrl);
          setVideoChecked(true);
          setVideoDone(false);
          return;
        }

        /*
         * --------------------------------------------------------
         * FIND COVER VIDEO
         * --------------------------------------------------------
         */

        const folder =
          invitation.music_path
            .split("/")
            .slice(0, -1)
            .join("/");

        const bucket =
          supabase.storage.from(
            "invitation-music"
          );

        const {
          data: files,
          error: listError,
        } = await bucket.list(folder);

        if (listError) {
          console.error(
            "COVER VIDEO LIST ERROR:",
            listError
          );

          if (!cancelled) {
            setVideoUrl(null);
            setVideoChecked(true);
            setVideoDone(true);
          }

          return;
        }

        const video =
          files?.find((file) =>
            /^video\.(mp4|webm|mov)$/i.test(
              file.name
            )
          );

        if (!video) {
          if (!cancelled) {
            setVideoUrl(null);
            setVideoChecked(true);
            setVideoDone(true);
          }

          return;
        }

        const videoPath =
          `${folder}/${video.name}`;

        const {
          data: videoData,
          error: videoError,
        } =
          await bucket.createSignedUrl(
            videoPath,
            60 * 60 * 24
          );

        if (
          videoError ||
          !videoData?.signedUrl
        ) {
          console.error(
            "COVER VIDEO SIGNED URL ERROR:",
            videoError
          );

          if (!cancelled) {
            setVideoUrl(null);
            setVideoChecked(true);
            setVideoDone(true);
          }

          return;
        }

        if (!cancelled) {
          setVideoUrl(
            videoData.signedUrl
          );

          setVideoChecked(true);
          setVideoDone(false);
        }
      } catch (error) {
        console.error(
          "MEDIA LOAD ERROR:",
          error
        );

        if (!cancelled) {
          setMusicUrl(null);
          setVideoUrl(null);
          setVideoChecked(true);
          setVideoDone(true);
          setMusicError(true);
        }
      }
    }

    loadMedia();

    return () => {
      cancelled = true;
    };
  }, [
    invitation?.music_path,
    musicIsVideo,
  ]);

  /*
   * ============================================================
   * VIDEO AUTOPLAY
   * ============================================================
   */

  useEffect(() => {
    if (!videoUrl || videoDone) {
      return;
    }

    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    video.muted = true;
    video.playsInline = true;

    const playVideo = async () => {
      try {
        await video.play();
      } catch (error) {
        console.warn(
          "VIDEO AUTOPLAY BLOCKED:",
          error
        );
      }
    };

    void playVideo();
  }, [videoUrl, videoDone]);

  /*
   * ============================================================
   * GALLERY SLIDESHOW
   * ============================================================
   */

  useEffect(() => {
    if (galleryUrls.length <= 1) {
      setCurrentSlide(0);
      return;
    }

    const timer =
      window.setInterval(() => {
        setCurrentSlide(
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
   * ============================================================
   * MUSIC AUTOPLAY
   * ============================================================
   */

  useEffect(() => {
    if (
      !musicUrl ||
      musicIsVideo ||
      !showInvitation
    ) {
      return;
    }

    const media =
      document.getElementById(
        "invitation-background-music"
      ) as HTMLAudioElement | null;

    if (!media) {
      return;
    }

    const tryAutoplay =
      async () => {
        try {
          await media.play();
          setMusicPlaying(true);
        } catch {
          /*
           * Browser blocked autoplay.
           * User can press music button.
           */
        }
      };

    if (audioReady) {
      void tryAutoplay();
    }
  }, [
    musicUrl,
    musicIsVideo,
    showInvitation,
    audioReady,
  ]);

  /*
   * ============================================================
   * OPENING ANIMATION
   * ============================================================
   */

  async function handleOpenInvitation() {
    if (openingStarted) {
      return;
    }

    setOpeningStarted(true);

    await new Promise((resolve) =>
      window.setTimeout(resolve, 120)
    );

    const duration =
      openingStyle === "envelope" ||
      openingStyle === "dugtui"
        ? 1500
        : openingStyle === "curtain" ||
            openingStyle === "hoshig"
          ? 1300
          : openingStyle === "light" ||
              openingStyle === "gerel"
            ? 1400
            : openingStyle === "focus" ||
                openingStyle === "fokus"
              ? 1300
              : openingStyle === "pulse" ||
                  openingStyle === "lugshih"
                ? 1200
                : 1300;

    await new Promise((resolve) =>
      window.setTimeout(resolve, duration)
    );

    setOpeningFinished(true);

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }

  /*
   * ============================================================
   * AUTO SCROLL
   * ============================================================
   */

  useEffect(() => {
    if (!showInvitation) {
      return;
    }

    let frameId = 0;
    let initialTimer: number | null =
      null;
    let resumeTimer: number | null =
      null;

    let previousTime = 0;
    let reachedEnd = false;
    let userPaused = false;
    let hiddenPaused = false;

    const clearResumeTimer =
      () => {
        if (resumeTimer !== null) {
          window.clearTimeout(
            resumeTimer
          );

          resumeTimer = null;
        }
      };

    const stopAnimation = () => {
      if (frameId) {
        window.cancelAnimationFrame(
          frameId
        );

        frameId = 0;
      }

      previousTime = 0;
    };

    const advanceScroll = (
      time: number
    ) => {
      frameId = 0;

      if (
        reachedEnd ||
        userPaused ||
        hiddenPaused ||
        document.hidden
      ) {
        return;
      }

      if (previousTime === 0) {
        previousTime = time;
      }

      const elapsedSeconds =
        Math.min(
          (time - previousTime) /
            1000,
          0.05
        );

      previousTime = time;

      const maxScroll =
        document.documentElement
          .scrollHeight -
        window.innerHeight;

      if (maxScroll <= 0) {
        frameId =
          window.requestAnimationFrame(
            advanceScroll
          );

        return;
      }

      const currentScroll =
        window.scrollY;

      if (
        currentScroll >=
        maxScroll - 2
      ) {
        reachedEnd = true;

        stopAnimation();

        window.scrollTo({
          top: maxScroll,
          behavior: "auto",
        });

        clearResumeTimer();

        return;
      }

      /*
       * AUTO-SCROLL SPEED
       *
       * 38px / second
       */
      window.scrollBy(
        0,
        elapsedSeconds * 38
      );

      frameId =
        window.requestAnimationFrame(
          advanceScroll
        );
    };

    const startAnimation = () => {
      if (
        reachedEnd ||
        userPaused ||
        hiddenPaused ||
        document.hidden ||
        frameId
      ) {
        return;
      }

      previousTime = 0;

      frameId =
        window.requestAnimationFrame(
          advanceScroll
        );
    };

    const scheduleResume =
      () => {
        clearResumeTimer();

        if (
          reachedEnd ||
          hiddenPaused ||
          document.hidden
        ) {
          return;
        }

        resumeTimer =
          window.setTimeout(() => {
            resumeTimer = null;

            if (
              reachedEnd ||
              hiddenPaused ||
              document.hidden
            ) {
              return;
            }

            userPaused = false;

            startAnimation();
          }, 1500);
      };

    const pauseForUser = () => {
      if (reachedEnd) {
        return;
      }

      userPaused = true;

      stopAnimation();

      scheduleResume();
    };

    const isMusicControl = (
      target: EventTarget | null
    ) => {
      if (
        !(target instanceof Element)
      ) {
        return false;
      }

      return Boolean(
        target.closest(
          '[data-music-control="true"]'
        )
      );
    };

    const handleWheel = (
      event: WheelEvent
    ) => {
      if (
        Math.abs(event.deltaY) <
          0.5 &&
        Math.abs(event.deltaX) <
          0.5
      ) {
        return;
      }

      pauseForUser();
    };

    const handlePointerDown = (
      event: PointerEvent
    ) => {
      if (
        isMusicControl(event.target)
      ) {
        const media =
          document.getElementById(
            "invitation-background-music"
          ) as HTMLAudioElement | null;

        if (
          media &&
          media.paused &&
          !musicError
        ) {
          void media
            .play()
            .then(() => {
              setMusicPlaying(true);
            })
            .catch(() => {});
        }

        return;
      }

      pauseForUser();
    };

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        isMusicControl(event.target)
      ) {
        return;
      }

      const target =
        event.target instanceof
        HTMLElement
          ? event.target
          : null;

      const isFormField =
        Boolean(
          target?.closest(
            "input, textarea, select, [contenteditable='true']"
          )
        );

      const scrollKeys = [
        "ArrowDown",
        "ArrowUp",
        "PageDown",
        "PageUp",
        "Home",
        "End",
        " ",
      ];

      if (
        isFormField ||
        scrollKeys.includes(event.key)
      ) {
        pauseForUser();
      }
    };

    const handleFocusIn = (
      event: FocusEvent
    ) => {
      if (
        isMusicControl(event.target)
      ) {
        return;
      }

      const target =
        event.target instanceof
        HTMLElement
          ? event.target
          : null;

      if (
        target?.closest(
          "input, textarea, select, [contenteditable='true']"
        )
      ) {
        pauseForUser();
      }
    };

    const handleVisibilityChange =
      () => {
        if (document.hidden) {
          hiddenPaused = true;

          stopAnimation();

          clearResumeTimer();

          return;
        }

        hiddenPaused = false;

        if (
          reachedEnd ||
          userPaused
        ) {
          return;
        }

        startAnimation();
      };

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });

    initialTimer =
      window.setTimeout(() => {
        initialTimer = null;

        if (
          !reachedEnd &&
          !userPaused &&
          !hiddenPaused &&
          !document.hidden
        ) {
          startAnimation();
        }
      }, 1500);

    window.addEventListener(
      "wheel",
      handleWheel,
      { passive: true }
    );

    window.addEventListener(
      "pointerdown",
      handlePointerDown,
      { passive: true }
    );

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    window.addEventListener(
      "focusin",
      handleFocusIn
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      reachedEnd = true;

      stopAnimation();

      if (
        initialTimer !== null
      ) {
        window.clearTimeout(
          initialTimer
        );
      }

      clearResumeTimer();

      window.removeEventListener(
        "wheel",
        handleWheel
      );

      window.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      window.removeEventListener(
        "focusin",
        handleFocusIn
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [showInvitation, musicError]);

  /*
   * ============================================================
   * MUSIC EVENT LISTENERS
   * ============================================================
   */

  useEffect(() => {
    if (
      !musicUrl ||
      musicIsVideo
    ) {
      setAudioReady(false);
      setMusicPlaying(false);
      return;
    }

    const media =
      document.getElementById(
        "invitation-background-music"
      ) as HTMLAudioElement | null;

    if (!media) {
      return;
    }

    setAudioReady(false);
    setMusicPlaying(false);
    setMusicError(false);

    const handleCanPlay =
      () => {
        setAudioReady(true);
      };

    const handleLoadedData =
      () => {
        setAudioReady(true);
      };

    const handlePlay = () => {
      setMusicPlaying(true);
    };

    const handlePause =
      () => {
        setMusicPlaying(false);
      };

    const handleError =
      () => {
        console.error(
          "BACKGROUND MUSIC LOAD ERROR"
        );

        setAudioReady(false);
        setMusicPlaying(false);
        setMusicError(true);
      };

    media.addEventListener(
      "canplay",
      handleCanPlay
    );

    media.addEventListener(
      "loadeddata",
      handleLoadedData
    );

    media.addEventListener(
      "play",
      handlePlay
    );

    media.addEventListener(
      "pause",
      handlePause
    );

    media.addEventListener(
      "error",
      handleError
    );

    if (media.readyState >= 2) {
      setAudioReady(true);
    }

    return () => {
      media.removeEventListener(
        "canplay",
        handleCanPlay
      );

      media.removeEventListener(
        "loadeddata",
        handleLoadedData
      );

      media.removeEventListener(
        "play",
        handlePlay
      );

      media.removeEventListener(
        "pause",
        handlePause
      );

      media.removeEventListener(
        "error",
        handleError
      );
    };
  }, [
    musicUrl,
    musicIsVideo,
  ]);

  /*
   * ============================================================
   * MUSIC BUTTON
   * ============================================================
   */

  async function toggleMusic() {
    const media =
      document.getElementById(
        "invitation-background-music"
      ) as HTMLMediaElement | null;

    if (!media) {
      return;
    }

    try {
      if (media.paused) {
        await media.play();
        setMusicPlaying(true);
      } else {
        media.pause();
        setMusicPlaying(false);
      }
    } catch (error) {
      console.error(
        "BACKGROUND MUSIC ERROR:",
        error
      );

      setMusicPlaying(false);
      setMusicError(true);
    }
  }

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />

          <p className="text-sm text-white/70">
            Урилга ачаалж байна...
          </p>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * NOT FOUND
   * ============================================================
   */

  if (!invitation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="text-center">
          <h1 className="text-xl font-semibold">
            Урилга олдсонгүй
          </h1>

          <p className="mt-2 text-sm text-white/60">
            Урилгын линк буруу эсвэл
            нийтлэгдээгүй байна.
          </p>
        </div>
      </main>
    );
  }

  const style = getStyle(
    invitation.selected_style ||
      "romantic"
  );

  /*
   * ============================================================
   * DATA CHECKS
   * ============================================================
   */

  const hasTitle =
    hasText(invitation.title);

  const hasNames =
    hasText(invitation.names);

  const hasMessage =
    hasText(invitation.message);

  const hasEventDate =
    hasText(invitation.event_date);

  const hasEventTime =
    hasText(invitation.event_time);

  const hasVenue =
    hasText(invitation.venue);

  const hasAddress =
    hasText(invitation.address);

  const hasPhone =
    hasText(invitation.phone);

  const hasEventInfo =
    hasVenue ||
    hasAddress ||
    hasEventDate ||
    hasEventTime;

  const hasCoverInfo =
    hasTitle ||
    hasNames ||
    hasMessage ||
    hasEventDate ||
    hasEventTime;

  const mapLat =
    invitation.extras?.lat ?? null;

  const mapLng =
    invitation.extras?.lng ?? null;

  const hasCoordinates =
    typeof mapLat === "number" &&
    typeof mapLng === "number";

  const hasMapUrl =
    hasText(invitation.extras?.mapUrl);

  const hasMapInfo =
    hasAddress ||
    hasCoordinates ||
    hasMapUrl;

  const googleMapsUrl =
    hasCoordinates
      ? `https://www.google.com/maps/dir/?api=1&destination=${mapLat},${mapLng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${invitation.venue ?? ""} ${
            invitation.address ?? ""
          }`.trim()
        )}`;

  const mapEmbedUrl =
    hasCoordinates
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${(
          mapLng! - 0.008
        ).toFixed(6)}%2C${(
          mapLat! - 0.005
        ).toFixed(6)}%2C${(
          mapLng! + 0.008
        ).toFixed(6)}%2C${(
          mapLat! + 0.005
        ).toFixed(
          6
        )}&layer=mapnik&marker=${mapLat}%2C${mapLng}`
      : "";

  const hasAnyBackground =
    galleryUrls.length > 0 ||
    Boolean(invitation.background_url);

  /*
   * ============================================================
   * OPENING SCREEN
   * ============================================================
   */

  const renderOpeningScreen = () => {
    if (openingFinished) {
      return null;
    }

    const isStarted = openingStarted;

    /*
     * ENVELOPE
     */

    if (
      openingStyle === "envelope" ||
      openingStyle === "dugtui"
    ) {
      return (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black transition-all duration-1000 ${
            isStarted
              ? "pointer-events-none opacity-0"
              : "opacity-100"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black via-[#181818] to-black" />

          <div
            className={`relative z-10 flex w-[min(88vw,420px)] flex-col items-center transition-all duration-[1500ms] ${
              isStarted
                ? "scale-[1.35] opacity-0"
                : "scale-100 opacity-100"
            }`}
          >
            <div
              className={`relative h-[230px] w-[340px] max-w-full overflow-hidden rounded-[18px] border border-white/15 bg-[#f8f1e8] shadow-[0_30px_100px_rgba(0,0,0,0.55)] transition-all duration-[1300ms] ${
                isStarted
                  ? "translate-y-[-40px] scale-105"
                  : ""
              }`}
            >
              <div
                className="absolute inset-x-0 top-0 h-0 border-l-[170px] border-r-[170px] border-t-[125px] border-l-transparent border-r-transparent border-t-[#e8d8c5]"
                style={{
                  transformOrigin:
                    "top center",
                  transition:
                    "transform 900ms ease",
                  transform: isStarted
                    ? "rotateX(180deg)"
                    : "rotateX(0deg)",
                }}
              />

              <div className="absolute inset-x-5 bottom-5 top-5 rounded-[12px] border border-black/10 bg-[#fffaf2]" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative z-10 text-center text-[#49382a]">
                  <div className="mb-3 text-4xl">
                    💌
                  </div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] opacity-50">
                    Invitation
                  </p>

                  {hasNames && (
                    <p className="mt-2 text-lg font-medium">
                      {invitation.names}
                    </p>
                  )}

                  {!hasNames &&
                    hasTitle && (
                      <p className="mt-2 text-lg font-medium">
                        {invitation.title}
                      </p>
                    )}
                </div>
              </div>

              <div
                className={`absolute bottom-0 left-0 right-0 h-[120px] origin-bottom bg-[#f2e5d5] transition-transform duration-[1000ms] ${
                  isStarted
                    ? "scale-y-0"
                    : "scale-y-100"
                }`}
                style={{
                  clipPath:
                    "polygon(0 100%, 50% 0, 100% 100%)",
                }}
              />
            </div>

            {!isStarted && (
              <button
                type="button"
                onClick={
                  handleOpenInvitation
                }
                className="mt-10 rounded-full border border-white/20 bg-white/10 px-8 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-md transition hover:bg-white/20 active:scale-95"
              >
                Урилгаа нээх
              </button>
            )}
          </div>
        </div>
      );
    }

    /*
     * LIGHT
     */

    if (
      openingStyle === "light" ||
      openingStyle === "gerel" ||
      openingStyle === "гэрэл"
    ) {
      return (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black transition-all duration-[1400ms] ${
            isStarted
              ? "pointer-events-none opacity-0"
              : "opacity-100"
          }`}
        >
          <div
            className={`absolute inset-0 transition-all duration-[1400ms] ${
              isStarted
                ? "scale-[3] opacity-0"
                : "scale-100 opacity-100"
            }`}
            style={{
              background:
                "radial-gradient(circle at center, rgba(255,255,255,0.98) 0%, rgba(255,245,220,0.75) 12%, rgba(255,255,255,0.08) 40%, rgba(0,0,0,0) 70%)",
            }}
          />

          <div className="relative z-10 text-center text-white">
            <div
              className={`mb-6 text-5xl transition-all duration-[900ms] ${
                isStarted
                  ? "scale-[3] opacity-0"
                  : "scale-100 opacity-100"
              }`}
            >
              ✨
            </div>

            {hasNames && (
              <h1 className="text-3xl font-semibold">
                {invitation.names}
              </h1>
            )}

            {!hasNames &&
              hasTitle && (
                <h1 className="text-3xl font-semibold">
                  {invitation.title}
                </h1>
              )}

            {!isStarted && (
              <button
                type="button"
                onClick={
                  handleOpenInvitation
                }
                className="mt-8 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black shadow-xl transition hover:scale-105 active:scale-95"
              >
                Урилгаа нээх
              </button>
            )}
          </div>
        </div>
      );
    }

    /*
     * FOCUS
     */

    if (
      openingStyle === "focus" ||
      openingStyle === "fokus"
    ) {
      return (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black transition-all duration-[1300ms] ${
            isStarted
              ? "pointer-events-none opacity-0"
              : "opacity-100"
          }`}
        >
          <div
            className={`absolute inset-0 transition-all duration-[1300ms] ${
              isStarted
                ? "scale-[1.5] blur-0 opacity-0"
                : "scale-100 blur-[18px] opacity-100"
            }`}
            style={{
              background:
                "radial-gradient(circle at center, rgba(255,255,255,0.18), rgba(0,0,0,0.96) 55%)",
            }}
          />

          <div
            className={`relative z-10 text-center text-white transition-all duration-[1200ms] ${
              isStarted
                ? "scale-[1.25] blur-0 opacity-0"
                : "scale-100 blur-[7px] opacity-100"
            }`}
          >
            <p className="text-sm uppercase tracking-[0.35em] text-white/60">
              Invitation
            </p>

            {hasNames && (
              <h1 className="mt-4 text-4xl font-semibold">
                {invitation.names}
              </h1>
            )}

            {!hasNames &&
              hasTitle && (
                <h1 className="mt-4 text-4xl font-semibold">
                  {invitation.title}
                </h1>
              )}

            {!isStarted && (
              <button
                type="button"
                onClick={
                  handleOpenInvitation
                }
                className="mt-9 rounded-full border border-white/20 bg-white/10 px-8 py-3 text-sm font-medium backdrop-blur-md transition hover:bg-white/20 active:scale-95"
              >
                Урилгаа нээх
              </button>
            )}
          </div>
        </div>
      );
    }

    /*
     * CURTAIN
     */

    if (
      openingStyle === "curtain" ||
      openingStyle === "hoshig"
    ) {
      return (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#160f12] transition-opacity duration-[1300ms] ${
            isStarted
              ? "pointer-events-none opacity-0"
              : "opacity-100"
          }`}
        >
          <div
            className={`absolute bottom-0 left-0 top-0 w-1/2 origin-left bg-gradient-to-r from-[#6e273b] via-[#8e3c53] to-[#4c1828] shadow-[20px_0_50px_rgba(0,0,0,0.45)] transition-transform duration-[1200ms] ease-in-out ${
              isStarted
                ? "-translate-x-full"
                : "translate-x-0"
            }`}
          />

          <div
            className={`absolute bottom-0 right-0 top-0 w-1/2 origin-right bg-gradient-to-l from-[#6e273b] via-[#8e3c53] to-[#4c1828] shadow-[-20px_0_50px_rgba(0,0,0,0.45)] transition-transform duration-[1200ms] ease-in-out ${
              isStarted
                ? "translate-x-full"
                : "translate-x-0"
            }`}
          />

          <div className="relative z-10 text-center text-white">
            <div className="text-5xl">
              🕊️
            </div>

            {hasNames && (
              <h1 className="mt-5 text-3xl font-semibold">
                {invitation.names}
              </h1>
            )}

            {!hasNames &&
              hasTitle && (
                <h1 className="mt-5 text-3xl font-semibold">
                  {invitation.title}
                </h1>
              )}

            {!isStarted && (
              <button
                type="button"
                onClick={
                  handleOpenInvitation
                }
                className="mt-9 rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#4c1828] shadow-xl transition hover:scale-105 active:scale-95"
              >
                Урилгаа нээх
              </button>
            )}
          </div>
        </div>
      );
    }

    /*
     * PULSE
     */

    if (
      openingStyle === "pulse" ||
      openingStyle === "lugshih"
    ) {
      return (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black transition-opacity duration-[1200ms] ${
            isStarted
              ? "pointer-events-none opacity-0"
              : "opacity-100"
          }`}
        >
          <div
            className={`absolute h-[180px] w-[180px] rounded-full border border-white/30 transition-all duration-[1200ms] ${
              isStarted
                ? "scale-[8] opacity-0"
                : "animate-pulse scale-100 opacity-100"
            }`}
          />

          <div
            className={`absolute h-[110px] w-[110px] rounded-full border border-white/40 transition-all duration-[1000ms] ${
              isStarted
                ? "scale-[7] opacity-0"
                : "animate-pulse scale-100 opacity-100"
            }`}
          />

          <div className="relative z-10 text-center text-white">
            <div className="text-5xl">
              💗
            </div>

            {hasNames && (
              <h1 className="mt-5 text-3xl font-semibold">
                {invitation.names}
              </h1>
            )}

            {!hasNames &&
              hasTitle && (
                <h1 className="mt-5 text-3xl font-semibold">
                  {invitation.title}
                </h1>
              )}

            {!isStarted && (
              <button
                type="button"
                onClick={
                  handleOpenInvitation
                }
                className="mt-9 rounded-full border border-white/20 bg-white/10 px-8 py-3 text-sm font-medium backdrop-blur-md transition hover:bg-white/20 active:scale-95"
              >
                Урилгаа нээх
              </button>
            )}
          </div>
        </div>
      );
    }

    /*
     * CIRCLE
     */

    return (
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black transition-opacity duration-[1300ms] ${
          isStarted
            ? "pointer-events-none opacity-0"
            : "opacity-100"
        }`}
      >
        <div
          className={`absolute left-1/2 top-1/2 h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-all duration-[1300ms] ease-in-out ${
            isStarted
              ? "scale-[40] opacity-100"
              : "scale-100 opacity-0"
          }`}
        />

        <div className="relative z-10 text-center text-white">
          <div className="text-5xl">
            💍
          </div>

          {hasNames && (
            <h1 className="mt-5 text-3xl font-semibold">
              {invitation.names}
            </h1>
          )}

          {!hasNames &&
            hasTitle && (
              <h1 className="mt-5 text-3xl font-semibold">
                {invitation.title}
              </h1>
            )}

          {!isStarted && (
            <button
              type="button"
              onClick={
                handleOpenInvitation
              }
              className="mt-9 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black shadow-xl transition hover:scale-105 active:scale-95"
            >
              Урилгаа нээх
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <main
      data-invitation
      className={`relative min-h-screen overflow-x-hidden ${style.page}`}
    >
      {/* ========================================================
          OPENING SCREEN
          ======================================================== */}

      {renderOpeningScreen()}

      {/* ========================================================
          MUSIC
          ======================================================== */}

      {musicUrl &&
        !musicIsVideo && (
          <audio
            id="invitation-background-music"
            src={musicUrl}
            loop
            preload="auto"
          />
        )}

      {/* ========================================================
          COVER VIDEO
          ======================================================== */}

      {videoUrl &&
        !videoDone && (
          <section className="relative z-20 px-4 pt-4 sm:px-6 sm:pt-8">
            <div className="mx-auto max-w-2xl overflow-hidden rounded-[28px] shadow-2xl">
              <video
                ref={videoRef}
                id={
                  musicIsVideo
                    ? "invitation-background-music"
                    : "invitation-cover-video"
                }
                src={videoUrl}
                className="block aspect-video w-full bg-black object-contain"
                autoPlay
                muted
                playsInline
                preload="auto"
                controls={false}
                onPlay={() =>
                  setMusicPlaying(true)
                }
                onPause={() =>
                  setMusicPlaying(false)
                }
                onEnded={() => {
                  setMusicPlaying(false);
                  setVideoDone(true);
                }}
                onError={() => {
                  console.error(
                    "INVITATION VIDEO ERROR"
                  );

                  setMusicPlaying(false);
                  setVideoDone(true);
                }}
              />
            </div>
          </section>
        )}

      {/* ========================================================
          ONE PAGE-WIDE BACKGROUND IMAGE
          ======================================================== */}

      {invitation.background_url &&
        showInvitation && (
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <img
              src={invitation.background_url}
              alt=""
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/20" />

            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/20" />
          </div>
        )}

      {/* ========================================================
          GALLERY SLIDESHOW FALLBACK BACKGROUND
          ======================================================== */}

      {!invitation.background_url &&
        galleryUrls.length > 0 &&
        showInvitation && (
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            {galleryUrls.map(
              (url, index) => {
                const isActive =
                  index === currentSlide;

                return (
                  <div
                    key={`${url}-${index}`}
                    className={`absolute inset-0 transition-opacity duration-[1800ms] ease-in-out ${
                      isActive
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-black/35" />

                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  </div>
                );
              }
            )}
          </div>
        )}

      {/* ========================================================
          DEFAULT BACKGROUND
          ======================================================== */}

      {!hasAnyBackground &&
        showInvitation && (
          <div className="pointer-events-none fixed inset-0 z-0">
            <div
              className="h-full w-full"
              style={{
                backgroundColor:
                  style.accentSoft,
              }}
            />
          </div>
        )}

      {/* ========================================================
          MUSIC BUTTON
          ======================================================== */}

      {musicUrl &&
        !musicError &&
        (musicIsVideo
          ? !videoDone
          : showInvitation) && (
          <div className="fixed right-4 top-4 z-50">
            <button
              type="button"
              data-music-control="true"
              onClick={toggleMusic}
              disabled={
                !audioReady &&
                !musicIsVideo
              }
              className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/45 text-lg text-white shadow-lg backdrop-blur-md transition hover:bg-black/60 ${
                !audioReady &&
                !musicIsVideo
                  ? "cursor-wait opacity-60"
                  : ""
              }`}
              aria-label={
                musicPlaying
                  ? "Хөгжим зогсоох"
                  : "Хөгжим тоглуулах"
              }
            >
              {musicPlaying
                ? "🔊"
                : "🎵"}
            </button>
          </div>
        )}

      {/* ========================================================
          MAIN INVITATION
          ======================================================== */}

      {showInvitation && (
        <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-2xl">
            <article
              className={`overflow-hidden rounded-[32px] border ${style.border} bg-white/55 shadow-2xl backdrop-blur-[3px]`}
            >
              {/* =================================================
                  COVER
                  ================================================= */}

              {hasCoverInfo && (
                <section className="relative min-h-[620px] overflow-hidden bg-white/20 px-6 pb-16 pt-16 text-center sm:px-12 sm:pt-24">
                  <div
                    className="mx-auto mb-8 h-px w-16"
                    style={{
                      backgroundColor:
                        style.accent,
                    }}
                  />

                  {/* TITLE */}

                  {hasTitle && (
                    <p
                      className="mb-5 text-xs font-semibold uppercase tracking-[0.28em]"
                      style={{
                        color: style.accent,
                      }}
                    >
                      {invitation.title}
                    </p>
                  )}

                  {/* NAMES */}

                  {hasNames && (
                    <h1 className="whitespace-pre-line text-4xl font-semibold leading-tight tracking-tight drop-shadow-sm sm:text-6xl">
                      {invitation.names}
                    </h1>
                  )}

                  {/* MESSAGE */}

                  {hasMessage && (
                    <div className="mx-auto mt-10 max-w-xl rounded-[28px] bg-white/55 px-6 py-7 shadow-sm backdrop-blur-md sm:px-10">
                      <p
                        className="mb-4 text-sm font-semibold uppercase tracking-[0.22em]"
                        style={{
                          color:
                            style.accent,
                        }}
                      >
                        Мэндчилгээ
                      </p>

                      <div
                        className="mx-auto mb-5 h-px w-10"
                        style={{
                          backgroundColor:
                            style.accent,
                        }}
                      />

                      <p className="whitespace-pre-line text-base leading-8 opacity-80">
                        {
                          invitation.message
                        }
                      </p>
                    </div>
                  )}

                  {(hasMessage ||
                    hasEventDate ||
                    hasEventTime ||
                    hasNames ||
                    hasTitle) && (
                    <div
                      className="mx-auto mt-8 h-px w-24"
                      style={{
                        backgroundColor:
                          style.accent,
                      }}
                    />
                  )}

                  {/* DATE / TIME */}

                  {(hasEventDate ||
                    hasEventTime) && (
                    <div className="mt-8 space-y-2">
                      {hasEventDate && (
                        <p className="text-lg font-medium">
                          {
                            invitation.event_date
                          }
                        </p>
                      )}

                      {hasEventTime && (
                        <p className="text-sm opacity-75">
                          {
                            invitation.event_time
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {/* GALLERY INDICATORS */}

                  {galleryUrls.length >
                    1 && (
                    <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 gap-2">
                      {galleryUrls.map(
                        (_, index) => (
                          <span
                            key={index}
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              index ===
                              currentSlide
                                ? "w-7 bg-white shadow"
                                : "w-1.5 bg-white/60"
                            }`}
                          />
                        )
                      )}
                    </div>
                  )}

                  {galleryUrls.length >
                    0 && (
                    <div className="absolute bottom-7 right-6 rounded-full bg-black/25 px-2.5 py-1 text-xs text-white/80 backdrop-blur-sm">
                      {currentSlide + 1} /{" "}
                      {galleryUrls.length}
                    </div>
                  )}
                </section>
              )}

              {/* =================================================
                  EVENT
                  ================================================= */}

              {hasEventInfo && (
                <section className="bg-white/65 px-6 py-10 backdrop-blur-[2px] sm:px-12">
                  <div className="text-center">
                    {hasVenue && (
                      <h2 className="text-2xl font-semibold">
                        {
                          invitation.venue
                        }
                      </h2>
                    )}

                    {hasAddress && (
                      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 opacity-75">
                        {
                          invitation.address
                        }
                      </p>
                    )}

                    {(hasEventDate ||
                      hasEventTime) && (
                      <div className="mt-7 flex flex-wrap justify-center gap-3">
                        {hasEventDate && (
                          <div className="rounded-full bg-white/90 px-5 py-2 text-sm shadow-sm">
                            📅{" "}
                            {
                              invitation.event_date
                            }
                          </div>
                        )}

                        {hasEventTime && (
                          <div className="rounded-full bg-white/90 px-5 py-2 text-sm shadow-sm">
                            🕐{" "}
                            {
                              invitation.event_time
                            }
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* =================================================
                  CALENDAR
                  ================================================= */}

              {hasEventDate && (
                <section className="bg-white/45 px-6 py-12 backdrop-blur-[2px] sm:px-12">
                  <div className="rounded-[28px] bg-white/80 p-4 shadow-sm backdrop-blur-md sm:p-6">
                    <EventCalendar
                      date={
                        invitation.event_date
                      }
                      time={
                        hasEventTime
                          ? invitation.event_time
                          : ""
                      }
                      title={
                        hasNames
                          ? invitation.names
                          : invitation.title
                      }
                      location={[
                        invitation.venue,
                        invitation.address,
                      ]
                        .filter(
                          (value) =>
                            hasText(value)
                        )
                        .join(", ")}
                      accent={style.accent}
                      buttonClass={
                        style.button
                      }
                    />
                  </div>
                </section>
              )}

              {/* =================================================
                  GALLERY
                  ================================================= */}

              {galleryUrls.length > 0 && (
                <section className="bg-white/35 px-5 pb-12 pt-4 backdrop-blur-[1px] sm:px-8">
                  <div className="mb-6 text-center">
                    <p
                      className="text-sm font-semibold uppercase tracking-[0.22em]"
                      style={{
                        color:
                          style.accent,
                      }}
                    >
                      Дурсамж
                    </p>

                    <div
                      className="mx-auto mt-3 h-px w-10"
                      style={{
                        backgroundColor:
                          style.accent,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {galleryUrls.map(
                      (url, index) => {
                        const caption =
                          galleryCaptions[
                            index
                          ]?.trim() ?? "";

                        return (
                          <div
                            key={`${url}-${index}`}
                            className="rounded-2xl bg-white/80 p-1.5 shadow-lg backdrop-blur-sm"
                          >
                            <div className="overflow-hidden rounded-[14px]">
                              <img
                                src={url}
                                alt={
                                  caption ||
                                  `Урилгын зураг ${
                                    index + 1
                                  }`
                                }
                                className="h-48 w-full object-cover transition duration-700 hover:scale-105 sm:h-64"
                              />
                            </div>

                            {caption && (
                              <p className="px-1 pb-1 pt-2 text-center text-xs leading-5 text-black/55">
                                {caption}
                              </p>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </section>
              )}

              {/* =================================================
                  MAP
                  ================================================= */}

              {hasMapInfo && (
                <section className="bg-white/60 px-6 py-10 backdrop-blur-[2px] sm:px-12">
                  <div className="rounded-[28px] bg-white/80 p-5 shadow-sm backdrop-blur-md sm:p-7">
                    <div className="text-center">
                      {hasVenue && (
                        <h2 className="text-xl font-semibold">
                          {
                            invitation.venue
                          }
                        </h2>
                      )}

                      {hasAddress && (
                        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 opacity-75">
                          {
                            invitation.address
                          }
                        </p>
                      )}

                      {hasCoordinates && (
                        <div className="mt-6 overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-lg">
                          <iframe
                            title="Урилгын байршлын газрын зураг"
                            src={mapEmbedUrl}
                            className="block h-[320px] w-full sm:h-[380px]"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                      )}

                      <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <a
                          href={
                            googleMapsUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold shadow-sm ${style.button}`}
                        >
                          📍 Чиглэл харах
                        </a>

                        {hasMapUrl && (
                          <a
                            href={
                              invitation
                                .extras
                                ?.mapUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold shadow-sm"
                          >
                            🗺️ Газрын зураг
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* =================================================
                  RSVP
                  ================================================= */}

              <section className="bg-white/45 px-4 py-10 backdrop-blur-[2px] sm:px-8">
                <div className="rounded-[28px] bg-white/80 p-4 shadow-sm backdrop-blur-md sm:p-6">
                  <RsvpSection
                    slug={slug}
                    accent={style.accent}
                    buttonClass={
                      style.button
                    }
                  />
                </div>
              </section>

              {/* =================================================
                  FOOTER
                  ================================================= */}

              <footer className="bg-white/50 px-6 py-10 text-center backdrop-blur-[2px]">
                <div
                  className="mx-auto h-px w-12"
                  style={{
                    backgroundColor:
                      style.accent,
                  }}
                />

                <p className="mt-5 text-xs opacity-50">
                  Урилгыг хүлээн авсанд
                  баярлалаа 💌
                </p>
              </footer>
            </article>
          </div>
        </div>
      )}

      {/* ========================================================
          VIDEO MESSAGE
          ======================================================== */}

      {!showInvitation &&
        !videoDone && (
          <div className="pointer-events-none fixed inset-x-0 bottom-8 z-40 flex justify-center">
            <div className="rounded-full bg-black/40 px-5 py-2.5 text-xs text-white/80 backdrop-blur-md">
              🎬 Урилгыг үзэж байна...
            </div>
          </div>
        )}

      {/* ========================================================
          MUSIC LOADING
          ======================================================== */}

      {musicUrl &&
        !audioReady &&
        !musicError &&
        !musicIsVideo &&
        showInvitation && (
          <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/40 px-4 py-2 text-xs text-white/70 backdrop-blur-md">
            🎵 Хөгжим ачаалж байна...
          </div>
        )}

      {/* ========================================================
          MUSIC ERROR
          ======================================================== */}

      {musicError &&
        showInvitation && (
          <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/40 px-4 py-2 text-xs text-white/70 backdrop-blur-md">
            🎵 Хөгжим ачаалж чадсангүй
          </div>
        )}

      {/* ========================================================
          OPENING STYLE DEBUG
          ======================================================== */}

      <div className="hidden">
        {getOpeningLabel(
          openingStyle
        )}
      </div>
    </main>
  );
}