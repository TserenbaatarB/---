"use client";

import {
  ACCENT_COLORS,
  ANIMATIONS,
  Appearance,
  FRAMES,
  OPEN_STYLES,
  PATTERNS,
  writeExtras,
} from "@/lib/invitationExtras";
import {
  FrameBox,
  FxOverlay,
  patternStyle,
} from "@/components/InvitationFx";

function Chips({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mt-6">
      <div className="text-xs font-semibold uppercase tracking-[0.15em] text-black/40">
        {title}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={value === option.id}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              value === option.id
                ? "border-black bg-black text-white"
                : "border-black/10 bg-white hover:bg-black/5"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AppearanceControls({
  appearance,
  backgroundImage,
}: {
  appearance: Appearance;
  backgroundImage?: string | null;
}) {
  function update(patch: Partial<Appearance>) {
    const next = { ...appearance, ...patch };

    writeExtras({ appearance: next });
  }

  return (
    <div className="mb-6 rounded-[28px] border border-black/10 bg-white p-5 shadow-sm sm:p-6">
      <div className="text-sm font-semibold">
        Харагдац
      </div>

      <div className="mt-1 text-xs leading-5 text-black/40">
        Өнгө, хээ, анимэйшн, нээх хэлбэр — урилгын төрх
      </div>

      <div
        className="relative mt-5 h-44 overflow-hidden rounded-2xl border border-black/10"
        style={patternStyle(
          appearance.pattern,
          appearance.accent,
          appearance.tone
        )}
      >
        <div className="relative z-10 flex h-full items-center justify-center gap-5 px-6">
          {!backgroundImage && (
            <FrameBox
              frame={appearance.frame}
              accent={appearance.accent}
              className="h-28 w-24 shrink-0"
            >
              <div
                className="h-full w-full"
                style={{
                  background: `linear-gradient(135deg, ${appearance.accent}55, ${appearance.accent}cc)`,
                }}
              />
            </FrameBox>
          )}

          <div
            className="text-left"
            style={{
              color:
                appearance.tone === "dark"
                  ? "#fff"
                  : "#2c241b",
            }}
          >
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.25em]"
              style={{
                color: appearance.accent,
              }}
            >
              Хэзээ
            </div>

            <div className="mt-1 text-2xl font-semibold">
              Бат & Номин
            </div>

            <div className="text-xs opacity-70">
              2027 · 06 · 20
            </div>
          </div>
        </div>

        <FxOverlay
          animation={appearance.animation}
          accent={appearance.accent}
          className="absolute"
        />
      </div>

      {!backgroundImage && (
        <Chips
          title="Зургийн хүрээ"
          options={FRAMES}
          value={appearance.frame}
          onChange={(frame) => update({ frame })}
        />
      )}

      <div className="mt-6">
        <div className="text-xs font-semibold uppercase tracking-[0.15em] text-black/40">
          Үндсэн өнгө
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              onClick={() => update({ accent: color })}
              className={`h-8 w-8 rounded-full border-2 transition ${
                appearance.accent === color
                  ? "scale-110 border-black"
                  : "border-white shadow"
              }`}
              style={{
                backgroundColor: color,
              }}
            />
          ))}

          <input
            type="color"
            value={appearance.accent}
            onChange={(event) =>
              update({
                accent: event.target.value,
              })
            }
            aria-label="Өөр өнгө сонгох"
            className="h-8 w-10 cursor-pointer rounded border border-black/10 bg-white"
          />
        </div>
      </div>

      <Chips
        title="Суурь өнгө"
        options={[
          {
            id: "dark",
            label: "Бараан",
          },
          {
            id: "light",
            label: "Цайвар",
          },
        ]}
        value={appearance.tone}
        onChange={(tone) =>
          update({
            tone: tone as Appearance["tone"],
          })
        }
      />

      <Chips
        title="Арын хээ"
        options={PATTERNS}
        value={appearance.pattern}
        onChange={(pattern) =>
          update({ pattern })
        }
      />

      <Chips
        title="Анимэйшн"
        options={ANIMATIONS}
        value={appearance.animation}
        onChange={(animation) =>
          update({ animation })
        }
      />

      <Chips
        title="Урилга нээх хэлбэр"
        options={OPEN_STYLES}
        value={appearance.open}
        onChange={(open) =>
          update({ open })
        }
      />
    </div>
  );
}