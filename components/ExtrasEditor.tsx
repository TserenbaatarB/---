"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  InvitationExtras,
  ProgramItem,
  RsvpVisibility,
  parseMapsLink,
} from "@/lib/invitationExtras";

const MapPicker = dynamic(
  () => import("@/components/MapPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-black/10 bg-[#F8F5F0] text-xs text-black/40">
        Газрын зураг ачаалж байна...
      </div>
    ),
  }
);

type Props = {
  extras: InvitationExtras;
  onChange: (patch: Partial<InvitationExtras>) => void;
};

const inputClass =
  "w-full rounded-2xl border border-black/10 bg-[#F8F5F0] px-4 py-3.5 text-sm text-black outline-none placeholder:text-black/35 transition focus:border-black/25 focus:bg-white";

const cardClass =
  "rounded-[28px] border border-black/10 bg-white p-6 shadow-sm sm:p-7";

function Toggle({
  checked,
  onChange,
  title,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl bg-[#F8F5F0] px-4 py-3.5">
      <span>
        <span className="block text-sm font-medium">
          {title}
        </span>

        {hint && (
          <span className="mt-1 block text-xs text-black/40">
            {hint}
          </span>
        )}
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="mt-1 h-5 w-5 shrink-0 accent-black"
      />
    </label>
  );
}

const VISIBILITY: {
  id: RsvpVisibility;
  title: string;
  hint: string;
}[] = [
  {
    id: "open",
    title: "Нээлттэй",
    hint: "Зочид бусдын нэр, хариуг харна",
  },
  {
    id: "anonymous",
    title: "Нэр далд",
    hint: "Зөвхөн тоо харагдана",
  },
  {
    id: "hidden",
    title: "Нуух",
    hint: "Зөвхөн та харна",
  },
];

export default function ExtrasEditor({
  extras,
  onChange,
}: Props) {
  const [locating, setLocating] = useState(false);
  const [mapMessage, setMapMessage] = useState("");

  function handleMapLink(value: string) {
    onChange({ mapUrl: value });

    const point = parseMapsLink(value);

    if (point) {
      onChange({
        mapUrl: value,
        lat: point.lat,
        lng: point.lng,
      });
      setMapMessage("Линкээс байршил олдлоо ✓");
    } else {
      setMapMessage(
        value.trim()
          ? "Линкээс координат олдсонгүй. Газрын зураг дээр дарж цэг сонгоно уу."
          : ""
      );
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setMapMessage("Таны төхөөрөмж байршил дэмжихгүй байна.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
        setMapMessage("Таны байршил сонгогдлоо ✓");
      },
      () => {
        setLocating(false);
        setMapMessage("Байршил авах зөвшөөрөл олдсонгүй.");
      },
      { timeout: 10000 }
    );
  }

  function updateProgram(
    index: number,
    patch: Partial<ProgramItem>
  ) {
    onChange({
      program: extras.program.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    });
  }

  function moveProgram(from: number, to: number) {
    if (to < 0 || to >= extras.program.length) return;

    const next = [...extras.program];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);

    onChange({ program: next });
  }

  return (
    <>
      {/* LOCATION */}
      <div className={cardClass}>
        <h2 className="text-lg font-semibold">
          Байршил
        </h2>

        <p className="mt-1 text-sm text-black/40">
          Зочид «Зам заалгах» товчоор шууд чиглэл авна.
        </p>

        <div className="mt-5 space-y-4">
          <Toggle
            checked={extras.online}
            onChange={(online) => onChange({ online })}
            title="Онлайн арга хэмжээ"
            hint="Zoom, Meet, Facebook live гэх мэт"
          />

          {extras.online && (
            <input
              value={extras.onlineUrl}
              onChange={(event) =>
                onChange({ onlineUrl: event.target.value })
              }
              placeholder="https://..."
              className={inputClass}
              inputMode="url"
            />
          )}

          <input
            value={extras.mapUrl}
            onChange={(event) =>
              handleMapLink(event.target.value)
            }
            placeholder="Google Maps линк (заавал биш)"
            className={inputClass}
            inputMode="url"
          />

          <MapPicker
            lat={extras.lat}
            lng={extras.lng}
            onChange={(lat, lng) => onChange({ lat, lng })}
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold transition hover:bg-black/5 disabled:opacity-50"
            >
              📍 Миний байршлыг ашиглах
            </button>

            {extras.lat !== null && extras.lng !== null && (
              <>
                <span className="text-xs text-black/40">
                  {extras.lat.toFixed(5)},{" "}
                  {extras.lng.toFixed(5)}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    onChange({ lat: null, lng: null })
                  }
                  className="text-xs font-semibold text-black/50 underline"
                >
                  Цэг арилгах
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-black/40">
            {mapMessage ||
              "Газрын зураг дээр дарж цэг сонгоно · маркерыг чирж зөөнө"}
          </p>
        </div>
      </div>

      {/* NOTE */}
      <div className={cardClass}>
        <h2 className="text-lg font-semibold">
          Нэмэлт тэмдэглэл
        </h2>

        <p className="mt-1 text-sm text-black/40">
          Хувцаслалт, зогсоол, хүүхдийн өрөө гэх мэт.
        </p>

        <textarea
          value={extras.note}
          onChange={(event) =>
            onChange({ note: event.target.value })
          }
          rows={3}
          placeholder="Жишээ: Террас дээр болох тул орой сэрүүхэн байж магадгүй."
          className={`${inputClass} mt-5 resize-none leading-6`}
        />
      </div>

      {/* PROGRAM */}
      <div className={cardClass}>
        <h2 className="text-lg font-semibold">
          Хөтөлбөр
        </h2>

        <p className="mt-1 text-sm text-black/40">
          Цаг бүрийн хуваарь. Сумаар эрэмбэлнэ.
        </p>

        <div className="mt-5 space-y-3">
          {extras.program.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2"
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label="Дээш"
                  onClick={() =>
                    moveProgram(index, index - 1)
                  }
                  disabled={index === 0}
                  className="px-1 text-xs leading-4 text-black/50 disabled:opacity-20"
                >
                  ▲
                </button>

                <button
                  type="button"
                  aria-label="Доош"
                  onClick={() =>
                    moveProgram(index, index + 1)
                  }
                  disabled={
                    index === extras.program.length - 1
                  }
                  className="px-1 text-xs leading-4 text-black/50 disabled:opacity-20"
                >
                  ▼
                </button>
              </div>

              <input
                type="time"
                value={item.time}
                onChange={(event) =>
                  updateProgram(index, {
                    time: event.target.value,
                  })
                }
                className={`${inputClass} !w-32 shrink-0`}
              />

              <input
                value={item.title}
                onChange={(event) =>
                  updateProgram(index, {
                    title: event.target.value,
                  })
                }
                placeholder="Жишээ: Зочид хүлээн авах"
                className={inputClass}
              />

              <button
                type="button"
                aria-label="Мөр устгах"
                onClick={() =>
                  onChange({
                    program: extras.program.filter(
                      (_, i) => i !== index
                    ),
                  })
                }
                className="shrink-0 rounded-full bg-black/5 px-3 py-2 text-sm hover:bg-black/10"
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              onChange({
                program: [
                  ...extras.program,
                  { time: "", title: "" },
                ],
              })
            }
            className="rounded-full border border-dashed border-black/20 px-5 py-2.5 text-xs font-semibold transition hover:bg-black/5"
          >
            + Мөр нэмэх
          </button>
        </div>
      </div>

      {/* RSVP */}
      <div className={cardClass}>
        <h2 className="text-lg font-semibold">
          Хариу / бүртгэл авах
        </h2>

        <p className="mt-1 text-sm text-black/40">
          Очно / Боломжгүй гэж хариулна.
        </p>

        <div className="mt-5 space-y-4">
          <Toggle
            checked={extras.rsvpEnabled}
            onChange={(rsvpEnabled) =>
              onChange({ rsvpEnabled })
            }
            title="Хариу авах"
          />

          {extras.rsvpEnabled && (
            <>
              <Toggle
                checked={extras.rsvpAskGuests}
                onChange={(rsvpAskGuests) =>
                  onChange({ rsvpAskGuests })
                }
                title="Хамт ирэх хүний тоо асуух"
                hint="+1, +2 гэж хэлж болно"
              />

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Хариу авах сүүлийн хугацаа
                </label>

                <input
                  type="date"
                  value={extras.rsvpDeadline}
                  onChange={(event) =>
                    onChange({
                      rsvpDeadline: event.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <div className="mb-2 text-sm font-medium">
                  Зочид бусдын хариуг хэрхэн харах вэ
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  {VISIBILITY.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        onChange({
                          rsvpVisibility: option.id,
                        })
                      }
                      aria-pressed={
                        extras.rsvpVisibility === option.id
                      }
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        extras.rsvpVisibility === option.id
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white hover:bg-black/5"
                      }`}
                    >
                      <div className="text-sm font-semibold">
                        {option.title}
                      </div>

                      <div className="mt-1 text-[11px] opacity-60">
                        {option.hint}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
