"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound, useParams } from "next/navigation";
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
  gallery_ids: unknown;
  gallery_urls: unknown;
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
      (item.startsWith("http://") || item.startsWith("https://"))
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

  /*
   * false = cover video хараахан дуусаагүй
   * true  = cover video дууссан / video байхгүй
   */
  const [videoDone, setVideoDone] = useState(false);

  /*
   * Cover video хайлт дууссан эсэх.
   */
  const [videoChecked, setVideoChecked] =
    useState(false);

  const musicIsVideo =
    /\.(mp4|webm|mov)$/i.test(
      invitation?.music_path ?? ""
    );

  /*
   * LOAD PUBLIC INVITATION
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

        const { data, error } = await supabase.rpc(
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
          Array.isArray(data) ? data[0] : null
        ) as PublicInvitation | undefined;

        if (!result) {
          if (!cancelled) {
            setInvitation(null);
            setLoading(false);
          }

          return;
        }

        /*
         * PUBLIC MAP DATA
         *
         * get_public_invitation RPC нь extras
         * буцаахгүй байгаа учраас тусдаа public API
         * route-оос зөвхөн map-ийн lat/lng/mapUrl авна.
         */
        let mapExtras: PublicInvitation["extras"] =
          null;

        try {
          const mapResponse = await fetch(
            `/api/public-invitation/${encodeURIComponent(
              slug
            )}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

          if (mapResponse.ok) {
            const mapData = await mapResponse.json();

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
          }
        } catch (mapError) {
          console.error(
            "PUBLIC MAP DATA ERROR:",
            mapError
          );
        }

        if (!cancelled) {
          setInvitation({
            ...result,
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

  /*
   * GALLERY
   */
  const galleryUrls = useMemo(() => {
    if (!invitation) {
      return [];
    }

    return getGalleryUrls(
      invitation.gallery_urls
    );
  }, [invitation]);

  /*
   * BACKGROUND MUSIC / COVER VIDEO SIGNED URL
   */
  useEffect(() => {
    let cancelled = false;

    async function loadMusic() {
      if (!invitation?.music_path) {
        if (!cancelled) {
          setMusicUrl(null);
          setAudioReady(false);
          setMusicPlaying(false);
          setMusicError(false);
          setVideoUrl(null);
          setVideoChecked(true);
          setVideoDone(true);
        }

        return;
      }

      try {
        setMusicError(false);
        setAudioReady(false);
        setMusicPlaying(false);
        setMusicUrl(null);

        /*
         * Хэрэв music_path өөрөө video бол
         * тэр video нь cover video болно.
         */
        if (musicIsVideo) {
          setVideoChecked(false);
          setVideoDone(false);
        }

        const supabase = getSupabase();

        const { data, error } =
          await supabase.storage
            .from("invitation-music")
            .createSignedUrl(
              invitation.music_path,
              60 * 60 * 24
            );

        if (error) {
          console.error(
            "MUSIC SIGNED URL ERROR:",
            error
          );

          if (!cancelled) {
            setMusicError(true);

            if (musicIsVideo) {
              setVideoChecked(true);
              setVideoDone(true);
            }
          }

          return;
        }

        if (!cancelled) {
          const signedUrl =
            data?.signedUrl || null;

          setMusicUrl(signedUrl);

          if (!signedUrl) {
            setMusicError(true);

            if (musicIsVideo) {
              setVideoChecked(true);
              setVideoDone(true);
            }
          }
        }
      } catch (error) {
        console.error(
          "MUSIC LOAD ERROR:",
          error
        );

        if (!cancelled) {
          setMusicUrl(null);
          setMusicError(true);

          if (musicIsVideo) {
            setVideoChecked(true);
            setVideoDone(true);
          }
        }
      }
    }

    loadMusic();

    return () => {
      cancelled = true;
    };
  }, [invitation?.music_path, musicIsVideo]);

  /*
   * COVER VIDEO
   *
   * MP3-тэй хамт:
   *
   * invitation-music
   * └── userId
   *     └── invitationId
   *         ├── music.mp3
   *         └── video.mp4
   */
  useEffect(() => {
    const musicPath =
      invitation?.music_path;

    /*
     * music_path өөрөө video бол
     * loadMusic() signed URL-ийг ашиглана.
     */
    if (!musicPath || musicIsVideo) {
      if (!musicPath) {
        setVideoUrl(null);
        setVideoChecked(true);
        setVideoDone(true);
      }

      return;
    }

    let cancelled = false;

    async function loadVideo(path: string) {
      try {
        setVideoChecked(false);

        const supabase = getSupabase();

        const folder = path
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

        const video = files?.find((file) =>
          /^video\.(mp4|webm|mov)$/i.test(
            file.name
          )
        );

        /*
         * Video байхгүй бол invitation
         * шууд харагдана.
         */
        if (!video) {
          if (!cancelled) {
            setVideoUrl(null);
            setVideoChecked(true);
            setVideoDone(true);
          }

          return;
        }

        const {
          data,
          error,
        } = await bucket.createSignedUrl(
          `${folder}/${video.name}`,
          60 * 60 * 24
        );

        if (
          error ||
          !data?.signedUrl
        ) {
          console.error(
            "COVER VIDEO SIGNED URL ERROR:",
            error
          );

          if (!cancelled) {
            setVideoUrl(null);
            setVideoChecked(true);
            setVideoDone(true);
          }

          return;
        }

        if (!cancelled) {
          setVideoUrl(data.signedUrl);
          setVideoChecked(true);
          setVideoDone(false);
        }
      } catch (error) {
        console.error(
          "COVER VIDEO LOAD ERROR:",
          error
        );

        if (!cancelled) {
          setVideoUrl(null);
          setVideoChecked(true);
          setVideoDone(true);
        }
      }
    }

    loadVideo(musicPath);

    return () => {
      cancelled = true;
    };
  }, [invitation?.music_path, musicIsVideo]);

  /*
   * SLIDESHOW
   */
  useEffect(() => {
    if (galleryUrls.length <= 1) {
      setCurrentSlide(0);
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentSlide((current) => {
        return (
          (current + 1) %
          galleryUrls.length
        );
      });
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [galleryUrls.length]);

  /*
   * MUSIC / VIDEO EVENTS
   */
  useEffect(() => {
    const media =
      document.getElementById(
        "invitation-background-music"
      ) as HTMLMediaElement | null;

    if (!media || !musicUrl) {
      setAudioReady(false);
      setMusicPlaying(false);

      if (!musicUrl && !musicIsVideo) {
        setMusicError(false);
      }

      return;
    }

    setAudioReady(false);
    setMusicError(false);

    const handleCanPlay = () => {
      setAudioReady(true);
      setMusicError(false);
    };

    const handleLoadedData = () => {
      setAudioReady(true);
      setMusicError(false);
    };

    const handlePlay = () => {
      setMusicPlaying(true);
    };

    const handlePause = () => {
      setMusicPlaying(false);
    };

    const handleEnded = () => {
      setMusicPlaying(false);

      if (musicIsVideo) {
        setVideoDone(true);
      }
    };

    const handleError = () => {
      console.error(
        "BACKGROUND MEDIA LOAD ERROR"
      );

      setAudioReady(false);
      setMusicPlaying(false);
      setMusicError(true);

      if (musicIsVideo) {
        setVideoDone(true);
      }
    };

    media.addEventListener(
      "canplaythrough",
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
      "ended",
      handleEnded
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
        "canplaythrough",
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
        "ended",
        handleEnded
      );

      media.removeEventListener(
        "error",
        handleError
      );
    };
  }, [musicUrl, musicIsVideo]);

  /*
   * MUSIC PLAY / PAUSE
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
      /*
       * Cover video дээр mute/unmute.
       */
      if (musicIsVideo) {
        const nextMuted =
          !media.muted;

        media.muted = nextMuted;

        setMusicPlaying(!nextMuted);

        if (
          media.paused &&
          !videoDone
        ) {
          await media.play();
        }

        return;
      }

      /*
       * Энгийн MP3
       */
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
    notFound();
  }

  const style = getStyle(
    invitation.selected_style ||
      "romantic"
  );

  /*
   * MAP
   */
  const mapLat =
    invitation.extras?.lat ?? null;

  const mapLng =
    invitation.extras?.lng ?? null;

  const hasCoordinates =
    typeof mapLat === "number" &&
    typeof mapLng === "number";

  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${mapLat},${mapLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${invitation.venue} ${invitation.address}`
      )}`;

  /*
   * OpenStreetMap embed.
   *
   * Координат байгаа үед builder дээр сонгосон
   * яг тэр цэгийг харуулна.
   */
  const mapEmbedUrl = hasCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${(
        mapLng! - 0.008
      ).toFixed(6)}%2C${(
        mapLat! - 0.005
      ).toFixed(6)}%2C${(
        mapLng! + 0.008
      ).toFixed(6)}%2C${(
        mapLat! + 0.005
      ).toFixed(6)}&layer=mapnik&marker=${mapLat}%2C${mapLng}`
    : "";

  /*
   * MAIN DISPLAY LOGIC
   */
  const hasVideoUrl =
    Boolean(videoUrl);

  const showInvitation =
    videoDone ||
    (videoChecked &&
      !hasVideoUrl &&
      !musicIsVideo);

  return (
    <main
      data-invitation
      className={`relative min-h-screen overflow-x-hidden ${style.page}`}
    >
      /*
       * BACKGROUND MUSIC
       */
      {musicUrl &&
        !musicIsVideo && (
          <audio
            id="invitation-background-music"
            src={musicUrl}
            loop
            preload="auto"
          />
        )}

      /*
       * COVER VIDEO
       *
       * Жижиг centered video.
       */
      {musicUrl &&
        musicIsVideo &&
        !videoDone && (
          <section className="relative z-20 px-4 pt-4 sm:px-6 sm:pt-8">
            <div className="mx-auto max-w-2xl overflow-hidden rounded-[28px] shadow-2xl">
              <video
                id="invitation-background-music"
                src={musicUrl}
                className="block aspect-video w-full bg-black object-contain"
                autoPlay
                muted
                playsInline
                preload="auto"
                onEnded={() => {
                  setMusicPlaying(false);
                  setVideoDone(true);
                }}
                onError={() => {
                  setMusicPlaying(false);
                  setVideoDone(true);
                }}
              />
            </div>
          </section>
        )}

      /*
       * FOLDER ДОТОРХ video.mp4
       */
      {videoUrl !== null &&
        !videoDone && (
          <section className="relative z-20 px-4 pt-4 sm:px-6 sm:pt-8">
            <div className="mx-auto max-w-2xl overflow-hidden rounded-[28px] shadow-2xl">
              <video
                src={videoUrl}
                className="block aspect-video w-full bg-black object-contain"
                autoPlay
                muted
                playsInline
                preload="auto"
                onEnded={() => {
                  setVideoDone(true);
                }}
                onError={() => {
                  setVideoDone(true);
                }}
              />
            </div>
          </section>
        )}

      /*
       * BACKGROUND SLIDESHOW
       */
      {galleryUrls.length > 0 &&
        showInvitation && (
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            {galleryUrls.map(
              (url, index) => {
                const isActive =
                  index ===
                  currentSlide;

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

      /*
       * FALLBACK BACKGROUND
       */
      {galleryUrls.length === 0 &&
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

      /*
       * MUSIC BUTTON
       */
      {musicUrl &&
        !musicError &&
        (musicIsVideo
          ? !videoDone
          : showInvitation) && (
          <div className="fixed right-4 top-4 z-50">
            <button
              type="button"
              onClick={toggleMusic}
              disabled={!audioReady}
              className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/45 text-lg text-white shadow-lg backdrop-blur-md transition hover:bg-black/60 ${
                !audioReady
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

      /*
       * MAIN INVITATION CONTENT
       */
      {showInvitation && (
        <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-2xl">
            <article
              className={`overflow-hidden rounded-[32px] border ${style.border} ${style.card} shadow-2xl backdrop-blur-sm`}
            >
              /*
               * COVER
               */
              <section className="relative min-h-[620px] overflow-hidden px-6 pb-16 pt-16 text-center sm:px-12 sm:pt-24">
                {galleryUrls.length > 0 && (
                  <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-black/20" />
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

              /*
               * EVENT DETAILS
               */
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
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.25em]"
                      style={{
                        color: style.accent,
                      }}
                    >
                      Тусгай өдөр
                    </p>

                    {invitation.venue && (
                      <h2 className="mt-4 text-2xl font-semibold">
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
                            {invitation.event_date}
                          </div>
                        )}

                        {invitation.event_time && (
                          <div className="rounded-full bg-white/80 px-5 py-2 text-sm">
                            🕐{" "}
                            {invitation.event_time}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              /*
               * CALENDAR
               */
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

              /*
               * MESSAGE
               */
              {invitation.message && (
                <section className="px-6 py-12 sm:px-12">
                  <div className="mx-auto max-w-xl text-center">
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.25em]"
                      style={{
                        color: style.accent,
                      }}
                    >
                      Урилга
                    </p>

                    <p className="mt-6 whitespace-pre-line text-base leading-8 opacity-80">
                      {invitation.message}
                    </p>
                  </div>
                </section>
              )}

              /*
               * GALLERY
               */
              {galleryUrls.length > 0 && (
                <section className="px-5 pb-12 sm:px-8">
                  <div className="mb-6 text-center">
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.25em]"
                      style={{
                        color: style.accent,
                      }}
                    >
                      Дурсамж
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {galleryUrls.map(
                      (url, index) => (
                        <div
                          key={`${url}-${index}`}
                          className="overflow-hidden rounded-2xl"
                        >
                          <img
                            src={url}
                            alt={`Урилгын зураг ${
                              index + 1
                            }`}
                            className="h-48 w-full object-cover transition duration-700 hover:scale-105 sm:h-64"
                          />
                        </div>
                      )
                    )}
                  </div>
                </section>
              )}

              /*
               * LOCATION
               *
               * Builder дээр сонгосон lat/lng
               * байвал яг тэр цэгийн map гарна.
               */
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
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.25em]"
                      style={{
                        color: style.accent,
                      }}
                    >
                      Байршил
                    </p>

                    {invitation.venue && (
                      <h2 className="mt-4 text-xl font-semibold">
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

              /*
               * RSVP
               */
              <RsvpSection
                slug={slug}
                accent={style.accent}
                buttonClass={style.button}
              />

              /*
               * FOOTER
               */
              <footer
                className="px-6 py-8 text-center"
                style={{
                  backgroundColor:
                    style.accentSoft,
                }}
              >
                <div
                  className="mx-auto mb-4 h-px w-12"
                  style={{
                    backgroundColor:
                      style.accent,
                  }}
                />

                <p className="text-xs opacity-50">
                  Танд зориулсан онцгой урилга
                </p>
              </footer>
            </article>

            /*
             * SHARE INFO
             */
            <div className="mt-5 flex justify-center">
              <p className="text-center text-xs text-black/40">
                Урилгын линкийг хуваалцаарай
              </p>
            </div>
          </div>
        </div>
      )}

      /*
       * VIDEO LOADING MESSAGE
       */
      {!showInvitation &&
        !videoDone && (
          <div className="pointer-events-none fixed inset-x-0 bottom-8 z-40 flex justify-center">
            <div className="rounded-full bg-black/40 px-5 py-2.5 text-xs text-white/80 backdrop-blur-md">
              🎬 Урилгыг үзэж байна...
            </div>
          </div>
        )}

      /*
       * MUSIC STATUS
       */
      {musicUrl &&
        !audioReady &&
        !musicError &&
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