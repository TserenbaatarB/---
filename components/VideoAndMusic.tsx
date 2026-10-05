"use client";

import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";
import {
  InvitationExtras,
  MusicSource,
  parseYouTubeId,
} from "@/lib/invitationExtras";

type Props = {
  extras: InvitationExtras;
  onChange: (patch: Partial<InvitationExtras>) => void;
  coverVideo: File | null;
  onCoverVideo: (file: File | null) => void;
};

const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 60;

const cardClass =
  "rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-7";

const SOURCES: { id: MusicSource; label: string }[] = [
  { id: "mp3", label: "MP3" },
  { id: "youtube", label: "YouTube" },
  { id: "video", label: "Видео" },
  { id: "none", label: "Хөгжимгүй" },
];

export default function VideoAndMusic({
  extras,
  onChange,
  coverVideo,
  onCoverVideo,
}: Props) {
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    if (!coverVideo) {
      return;
    }

    const url = URL.createObjectURL(coverVideo);
    setVideoUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [coverVideo]);

  function handleVideo(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    setError("");

    if (!file.type.startsWith("video/")) {
      setError("Зөвхөн видео файл оруулна уу.");
      return;
    }

    if (file.size > MAX_VIDEO_BYTES) {
      setError("Видео 60MB-аас ихгүй байх ёстой.");
      return;
    }

    const probe = document.createElement("video");
    const url = URL.createObjectURL(file);

    probe.preload = "metadata";

    probe.onloadedmetadata = () => {
      URL.revokeObjectURL(url);

      if (probe.duration > MAX_VIDEO_SECONDS + 0.5) {
        setError("Видео 1 минутаас урт байж болохгүй.");
        return;
      }

      onCoverVideo(file);
      onChange({
        musicSource:
          extras.musicSource === "none"
            ? "video"
            : extras.musicSource,
      });
    };

    probe.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Видеог уншиж чадсангүй.");
    };

    probe.src = url;
  }

  function removeVideo() {
    onCoverVideo(null);
    setVideoUrl("");

    if (extras.musicSource === "video") {
      onChange({ musicSource: "none" });
    }
  }

  const youtubeId = parseYouTubeId(extras.youtubeUrl);

  return (
    <>
      <div className={cardClass}>
        <h2 className="text-lg font-semibold">
          Нүүрний видео
        </h2>

        <p className="mt-1 text-sm text-black/40">
          Урилгын хамгийн дээр, нүүр зургийн оронд тоглоно ·
          ≤1 минут · дугтуй нээгдмэгц
        </p>

        {coverVideo ? (
          <div className="mt-5 rounded-3xl border border-black/10 bg-[#F8F5F0] p-4">
            {videoUrl && (
              <video
                src={videoUrl}
                controls
                muted
                playsInline
                className="mx-auto max-h-72 rounded-2xl"
              />
            )}

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0 truncate text-xs text-black/50">
                {coverVideo.name} ·{" "}
                {(coverVideo.size / 1024 / 1024).toFixed(1)} MB
              </div>

              <button
                type="button"
                onClick={removeVideo}
                className="shrink-0 rounded-full bg-black/10 px-3 py-2 text-xs font-semibold hover:bg-black/15"
              >
                Устгах
              </button>
            </div>
          </div>
        ) : (
          <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-black/15 bg-[#F8F5F0] px-6 py-10 text-center transition hover:border-black/30">
            <div className="text-3xl">🎬</div>

            <div className="mt-3 text-sm font-semibold">
              Видео сонгох
            </div>

            <div className="mt-1 text-xs text-black/40">
              MP4, MOV, WEBM · 60MB, 1 минут хүртэл
            </div>

            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={handleVideo}
              className="hidden"
            />
          </label>
        )}

        {error && (
          <div className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-xs text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className={cardClass}>
        <h2 className="text-lg font-semibold">Хөгжим</h2>

        <p className="mt-1 text-sm text-black/40">
          Дугтуй нээгдмэгц эгшиглэнэ
        </p>

        <div
          role="radiogroup"
          aria-label="Хөгжмийн эх сурвалж"
          className="mt-5 flex flex-wrap gap-2"
        >
          {SOURCES.map((source) => {
            const disabled =
              source.id === "video" && !coverVideo;

            return (
              <button
                key={source.id}
                type="button"
                role="radio"
                aria-checked={
                  extras.musicSource === source.id
                }
                disabled={disabled}
                onClick={() =>
                  onChange({ musicSource: source.id })
                }
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${
                  extras.musicSource === source.id
                    ? "border-black bg-black text-white"
                    : "border-black/10 bg-white hover:bg-black/5"
                }`}
              >
                {source.label}
              </button>
            );
          })}
        </div>

        {extras.musicSource === "youtube" && (
          <div className="mt-4">
            <input
              value={extras.youtubeUrl}
              onChange={(event) =>
                onChange({ youtubeUrl: event.target.value })
              }
              placeholder="https://www.youtube.com/watch?v=..."
              inputMode="url"
              className="w-full rounded-2xl border border-black/10 bg-[#F8F5F0] px-4 py-3.5 text-sm outline-none focus:border-black/25 focus:bg-white"
            />

            <p
              className={`mt-2 text-xs ${
                extras.youtubeUrl && !youtubeId
                  ? "text-red-600"
                  : "text-black/40"
              }`}
            >
              {extras.youtubeUrl
                ? youtubeId
                  ? "YouTube линк танигдлаа ✓"
                  : "YouTube линк буруу байна."
                : "YouTube дууны линкээ буулгана уу."}
            </p>
          </div>
        )}

        {extras.musicSource === "video" && (
          <p className="mt-4 text-xs text-black/40">
            Нүүрний видеоны өөрийн дуу эгшиглэнэ (давтагдана).
          </p>
        )}

        {extras.musicSource === "mp3" && (
          <p className="mt-4 text-xs text-black/40">
            Доорх «Урилгын дуу» хэсэгт MP3 файлаа оруулна уу.
          </p>
        )}
      </div>
    </>
  );
}
