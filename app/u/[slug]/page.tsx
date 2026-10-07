"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import EventCalendar from "./EventCalendar";
import RsvpSection from "./RsvpSection";

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

function getGalleryUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.length > 0 &&
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
  const [autoScroll, setAutoScroll] = useState(true);

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

  const [videoDone, setVideoDone] = useState(false);
  const [videoChecked, setVideoChecked] = useState(false);

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

    return getGalleryUrls(invitation.gallery_urls);
  }, [invitation]);

  const galleryCaptions = useMemo(() => {
    if (!invitation) {
      return [];
    }

    return getGalleryCaptions(
      invitation.gallery_captions
    );
  }, [invitation]);

  const showInvitation =
    videoChecked &&
    (videoDone ||
      (!videoUrl && !musicIsVideo));

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

            if (mapData?.extras) {
              mapExtras = {
                lat:
                  typeof mapData.extras.lat ===
                  "number"
                    ? mapData.extras.lat
                    : null,

                lng:
                  typeof mapData.extras.lng ===
                  "number"
                    ? mapData.extras.lng
                    : null,

                mapUrl:
                  typeof mapData.extras.mapUrl ===
                  "string"
                    ? mapData.extras.mapUrl
                    : "",
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

        if (!cancelled) {
          const resultCaptions =
            getGalleryCaptions(
              result.gallery_captions
            );

          setInvitation({
            ...result,

            background_url:
              backgroundUrl,

            gallery_urls:
              publishedGalleryUrls.length > 0
                ? publishedGalleryUrls
                : result.gallery_urls,

            gallery_captions:
              publishedGalleryCaptions.length > 0
                ? publishedGalleryCaptions
                : resultCaptions,

            extras: mapExtras,
          });

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

        const {
          data,
          error,
        } = await supabase.storage
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

  useEffect(() => {
    if (!showInvitation || !autoScroll) {
      return;
    }

    let frameId = 0;
    let previousTime = 0;

    const stopForUserInput = () => {
      setAutoScroll(false);
    };

    const stopForScrollKey = (
      event: KeyboardEvent
    ) => {
      if (
        [
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      ) {
        setAutoScroll(false);
      }
    };

    const advanceScroll = (
      time: number
    ) => {
      if (previousTime > 0) {
        const elapsedSeconds =
          Math.min(
            (time - previousTime) / 1000,
            0.05
          );

        const maxScroll =
          document.documentElement
            .scrollHeight -
          window.innerHeight;

        if (
          maxScroll <= 0 ||
          window.scrollY >=
            maxScroll - 2
        ) {
          setAutoScroll(false);
          return;
        }

        window.scrollBy(
          0,
          elapsedSeconds * 18
        );
      }

      previousTime = time;

      frameId =
        window.requestAnimationFrame(
          advanceScroll
        );
    };

    window.addEventListener(
      "wheel",
      stopForUserInput,
      { passive: true }
    );

    window.addEventListener(
      "touchstart",
      stopForUserInput,
      { passive: true }
    );

    window.addEventListener(
      "pointerdown",
      stopForUserInput,
      { passive: true }
    );

    window.addEventListener(
      "keydown",
      stopForScrollKey
    );

    frameId =
      window.requestAnimationFrame(
        advanceScroll
      );

    return () => {
      window.cancelAnimationFrame(
        frameId
      );

      window.removeEventListener(
        "wheel",
        stopForUserInput
      );

      window.removeEventListener(
        "touchstart",
        stopForUserInput
      );

      window.removeEventListener(
        "pointerdown",
        stopForUserInput
      );

      window.removeEventListener(
        "keydown",
        stopForScrollKey
      );
    };
  }, [
    autoScroll,
    showInvitation,
  ]);

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

    const handleCanPlay = () => {
      setAudioReady(true);
    };

    const handleLoadedData = () => {
      setAudioReady(true);
    };

    const handlePlay = () => {
      setMusicPlaying(true);
    };

    const handlePause = () => {
      setMusicPlaying(false);
    };

    const handleError = () => {
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

  if (!invitation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="text-center">
          <h1 className="text-xl font-semibold">
            Урилга олдсонгүй
          </h1>

          <p className="mt-2 text-sm text-white/60">
            Урилгын линк буруу эсвэл нийтлэгдээгүй байна.
          </p>
        </div>
      </main>
    );
  }

  const style = getStyle(
    invitation.selected_style ||
      "romantic"
  );

  const mapLat =
    invitation.extras?.lat ?? null;

  const mapLng =
    invitation.extras?.lng ?? null;

  const hasCoordinates =
    typeof mapLat === "number" &&
    typeof mapLng === "number";

  const googleMapsUrl =
    hasCoordinates
      ? `https://www.google.com/maps/dir/?api=1&destination=${mapLat},${mapLng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${invitation.venue} ${invitation.address}`
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

  return (
    <main
      data-invitation
      className={`relative min-h-screen overflow-x-hidden ${style.page}`}
    >
      {musicUrl && !musicIsVideo && (
        <audio
          id="invitation-background-music"
          src={musicUrl}
          loop
          preload="auto"
        />
      )}

      {showInvitation && (
        <button
          type="button"
          onClick={() =>
            setAutoScroll(
              (current) => !current
            )
          }
          className="fixed bottom-4 left-4 z-50 rounded-full bg-black/55 px-4 py-2.5 text-xs font-medium text-white shadow-lg backdrop-blur-md"
          aria-pressed={autoScroll}
        >
          {autoScroll
            ? "Авто гүйлгэлт зогсоох"
            : "Авто гүйлгэж эхлүүлэх"}
        </button>
      )}

      {videoUrl && !videoDone && (
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

      {galleryUrls.length > 0 &&
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

      {invitation.background_url &&
        galleryUrls.length === 0 &&
        showInvitation && (
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <img
              src={invitation.background_url}
              alt=""
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/25" />
          </div>
        )}

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

      {musicUrl &&
        !musicError &&
        (musicIsVideo
          ? !videoDone
          : showInvitation) && (
          <div className="fixed right-4 top-4 z-50">
            <button
              type="button"
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

      {showInvitation && (
        <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-2xl">
            <article
              className={`overflow-hidden rounded-[32px] border ${style.border} ${style.card} shadow-2xl backdrop-blur-sm`}
            >
              <section className="relative min-h-[620px] overflow-hidden px-6 pb-16 pt-16 text-center sm:px-12 sm:pt-24">
                {invitation.background_url && (
                  <div className="absolute inset-0 -z-10">
                    <img
                      src={
                        invitation.background_url
                      }
                      alt=""
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-white/65" />
                  </div>
                )}

                <div
                  className="mx-auto mb-8 h-px w-16"
                  style={{
                    backgroundColor:
                      style.accent,
                  }}
                />

                {invitation.title && (
                  <p
                    className="mb-5 text-xs font-semibold uppercase tracking-[0.28em]"
                    style={{
                      color: style.accent,
                    }}
                  >
                    {invitation.title}
                  </p>
                )}

                {invitation.names && (
                  <h1 className="whitespace-pre-line text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                    {invitation.names}
                  </h1>
                )}

                <div
                  className="mx-auto mt-8 h-px w-24"
                  style={{
                    backgroundColor:
                      style.accent,
                  }}
                />

                {(invitation.event_date ||
                  invitation.event_time) && (
                  <div className="mt-8 space-y-2">
                    {invitation.event_date && (
                      <p className="text-lg font-medium">
                        {invitation.event_date}
                      </p>
                    )}

                    {invitation.event_time && (
                      <p className="text-sm opacity-70">
                        {invitation.event_time}
                      </p>
                    )}
                  </div>
                )}

                {galleryUrls.length > 1 && (
                  <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 gap-2">
                    {galleryUrls.map(
                      (_, index) => (
                        <span
                          key={index}
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            index ===
                            currentSlide
                              ? "w-7 bg-white"
                              : "w-1.5 bg-white/40"
                          }`}
                        />
                      )
                    )}
                  </div>
                )}

                {galleryUrls.length > 0 && (
                  <div className="absolute bottom-7 right-6 text-xs text-white/70">
                    {currentSlide + 1} /{" "}
                    {galleryUrls.length}
                  </div>
                )}
              </section>

              {(invitation.venue ||
                invitation.address ||
                invitation.event_date ||
                invitation.event_time) && (
                <section
                  className="px-6 py-10 sm:px-12"
                  style={{
                    backgroundColor:
                      style.accentSoft,
                  }}
                >
                  <div className="text-center">
                    {invitation.venue && (
                      <h2 className="text-2xl font-semibold">
                        {invitation.venue}
                      </h2>
                    )}

                    {invitation.address && (
                      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 opacity-75">
                        {invitation.address}
                      </p>
                    )}

                    {(invitation.event_date ||
                      invitation.event_time) && (
                      <div className="mt-7 flex flex-wrap justify-center gap-3">
                        {invitation.event_date && (
                          <div className="rounded-full bg-white/80 px-5 py-2 text-sm">
                            📅{" "}
                            {
                              invitation.event_date
                            }
                          </div>
                        )}

                        {invitation.event_time && (
                          <div className="rounded-full bg-white/80 px-5 py-2 text-sm">
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

              {invitation.event_date && (
                <section className="px-6 py-12 sm:px-12">
                  <EventCalendar
                    date={
                      invitation.event_date
                    }
                    time={
                      invitation.event_time
                    }
                    title={
                      invitation.names ||
                      invitation.title
                    }
                    location={[
                      invitation.venue,
                      invitation.address,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    accent={style.accent}
                    buttonClass={
                      style.button
                    }
                  />
                </section>
              )}

              {invitation.message && (
                <section className="px-6 py-12 sm:px-12">
                  <div className="mx-auto max-w-xl text-center">
                    <p className="whitespace-pre-line text-base leading-8 opacity-80">
                      {invitation.message}
                    </p>
                  </div>
                </section>
              )}

              {galleryUrls.length > 0 && (
                <section className="px-5 pb-12 sm:px-8">
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
                          >
                            <div className="overflow-hidden rounded-2xl">
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
                              <p className="px-1 pt-2 text-center text-xs leading-5 text-black/55">
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

              {(invitation.address ||
                hasCoordinates) && (
                <section
                  className="px-6 py-10 sm:px-12"
                  style={{
                    backgroundColor:
                      style.accentSoft,
                  }}
                >
                  <div className="text-center">
                    {invitation.venue && (
                      <h2 className="text-xl font-semibold">
                        {invitation.venue}
                      </h2>
                    )}

                    {invitation.address && (
                      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 opacity-75">
                        {invitation.address}
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

                      {invitation.extras
                        ?.mapUrl && (
                        <a
                          href={
                            invitation
                              .extras
                              .mapUrl
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
                </section>
              )}

              <RsvpSection
                slug={slug}
                accent={style.accent}
                buttonClass={style.button}
              />

              <footer
                className="px-6 py-8 text-center"
                style={{
                  backgroundColor:
                    style.accentSoft,
                }}
              >
                <div
                  className="mx-auto h-px w-12"
                  style={{
                    backgroundColor:
                      style.accent,
                  }}
                />
              </footer>
            </article>
          </div>
        </div>
      )}

      {!showInvitation &&
        !videoDone && (
          <div className="pointer-events-none fixed inset-x-0 bottom-8 z-40 flex justify-center">
            <div className="rounded-full bg-black/40 px-5 py-2.5 text-xs text-white/80 backdrop-blur-md">
              🎬 Урилгыг үзэж байна...
            </div>
          </div>
        )}

      {musicUrl &&
        !audioReady &&
        !musicError &&
        !musicIsVideo &&
        showInvitation && (
          <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/40 px-4 py-2 text-xs text-white/70 backdrop-blur-md">
            🎵 Хөгжим ачаалж байна...
          </div>
        )}

      {musicError &&
        showInvitation && (
          <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/40 px-4 py-2 text-xs text-white/70 backdrop-blur-md">
            🎵 Хөгжим ачаалж чадсангүй
          </div>
        )}
    </main>
  );
}