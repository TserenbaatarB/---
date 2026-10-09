"use client";

import {
  ACCENT_COLORS,
  ANIMATIONS,
  Appearance,
  FONT_FAMILIES,
  FRAMES,
  fontFamilyFor,
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

function ColorPicker({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="mt-6">
      <div className="text-xs font-semibold uppercase tracking-[0.15em] text-black/40">
        {title}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {ACCENT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`${title}: ${color}`}
            aria-pressed={value === color}
            onClick={() => onChange(color)}
            className={`h-8 w-8 rounded-full border-2 transition ${
              value === color
                ? "scale-110 border-black"
                : "border-white shadow"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}

        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${title} өөр өнгө сонгох`}
          className="h-8 w-10 cursor-pointer rounded border border-black/10 bg-white"
        />
      </div>
    </div>
  );
}

const textShadowStyle = {
  none: "none",
  soft: "0 2px 12px rgba(0, 0, 0, 0.35)",
  strong: "0 2px 4px rgba(0, 0, 0, 0.75)",
} as const;

export default function AppearanceControls({
  appearance,
  backgroundImage,
  onBackgroundChange,
  onBackgroundRemove,
}: {
  appearance: Appearance;
  backgroundImage?: string | null;
  onBackgroundChange?: (file: File) => void;
  onBackgroundRemove?: () => void;
}) {
  function update(patch: Partial<Appearance>) {
    writeExtras({ appearance: { ...appearance, ...patch } });
  }

  const backgroundPreviewText =
    appearance.tone === "dark" ? "#fff" : "#2c241b";

  return (
    <div className="mb-6 rounded-[28px] border border-black/10 bg-white p-5 shadow-sm sm:p-6">
      <div className="text-sm font-semibold">Харагдац</div>

      <div className="mt-1 text-xs leading-5 text-black/40">
        Зураг, фонт, өнгө, гэрэл-сүүдэр, хээ, animation болон нээлтийн хэлбэр
      </div>

      <div className="mt-5 rounded-2xl border border-dashed border-black/15 bg-[#F8F5F0] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold">Background Photo</div>
            <div className="mt-1 text-[11px] text-black/45">
              Нүүр хэсэгт тод, бусад хэсэгт blur-тэй харагдана.
            </div>
          </div>
          <label className="cursor-pointer rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-black/80">
            {backgroundImage ? "Зураг солих" : "Зураг сонгох"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onBackgroundChange?.(file);
                event.target.value = "";
              }}
            />
          </label>
        </div>

        {backgroundImage && (
          <div className="mt-4 flex items-center gap-3">
            <img
              src={backgroundImage}
              alt="Сонгосон арын зургийн жижиг харагдац"
              className="h-14 w-14 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1 text-xs font-medium text-black/55">
              Арын зураг сонгогдсон
            </div>
            <button
              type="button"
              onClick={onBackgroundRemove}
              className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-black/65 transition hover:bg-black/5"
            >
              Устгах
            </button>
          </div>
        )}
      </div>

      <div
        className="relative mt-5 h-44 overflow-hidden rounded-2xl border border-black/10"
        style={patternStyle(
          appearance.pattern,
          appearance.accent,
          appearance.tone
        )}
      >
        {backgroundImage && (
          <>
            <img
              src={backgroundImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: `brightness(${appearance.brightness}%)` }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: `rgba(0, 0, 0, ${appearance.darkness / 100})`,
              }}
            />
          </>
        )}
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
                  background: `linear-gradient(135deg, ${appearance.primary}55, ${appearance.primary}cc)`,
                }}
              />
            </FrameBox>
          )}

          <div
            className="text-left"
            style={{
              color: backgroundPreviewText,
              fontFamily: fontFamilyFor(appearance.font),
              textShadow: textShadowStyle[appearance.textShadow],
            }}
          >
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.25em]"
              style={{ color: appearance.primary }}
            >
              Хэзээ
            </div>

            <div className="mt-1 text-2xl font-semibold">Бат & Номин</div>

            <div className="text-xs opacity-80">2027 · 06 · 20</div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: patternStyle(
              appearance.pattern,
              appearance.accent,
              appearance.tone
            ).backgroundImage,
            backgroundSize: patternStyle(
              appearance.pattern,
              appearance.accent,
              appearance.tone
            ).backgroundSize,
          }}
        />
        <FxOverlay
          animation={appearance.animation}
          accent={appearance.accent}
          className="absolute"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-black/10 bg-[#F8F5F0] p-4">
        <div className="text-xs font-semibold">Нээлтийн эффектийн харагдац</div>
        <div
          className={`relative mt-3 flex h-20 items-center justify-center overflow-hidden rounded-xl bg-[#2c241b] text-white transition ${
            appearance.open === "focus"
              ? "ring-4 ring-inset ring-white/50"
              : appearance.open === "curtain"
                ? "before:absolute before:inset-y-0 before:left-0 before:w-1/4 before:bg-[#a66a78] after:absolute after:inset-y-0 after:right-0 after:w-1/4 after:bg-[#a66a78]"
                : appearance.open === "light"
                  ? "bg-[radial-gradient(circle,#fff8d8_0%,#a48663_35%,#2c241b_75%)]"
                  : appearance.open === "iris"
                    ? "ring-[14px] ring-inset ring-black shadow-[inset_0_0_0_2px_rgba(255,255,255,.7)]"
                    : appearance.open === "slide"
                      ? "[&>span]:translate-x-2"
                      : "border border-white/25"
          }`}
          aria-label={`Сонгосон нээлтийн хэлбэр: ${
            OPEN_STYLES.find((style) => style.id === appearance.open)?.label ??
            appearance.open
          }`}
        >
          <span className="relative z-10 text-center text-xs font-semibold transition-transform">
            {appearance.open === "envelope" ? "💌" : "Урилгаа нээх"}
          </span>
        </div>
      </div>

      {!backgroundImage && (
        <Chips
          title="Зургийн хүрээ"
          options={FRAMES}
          value={appearance.frame}
          onChange={(frame) => update({ frame })}
        />
      )}

      <ColorPicker
        title="Үндсэн өнгө"
        value={appearance.primary}
        onChange={(primary) => update({ primary })}
      />

      <ColorPicker
        title="Акцент өнгө"
        value={appearance.accent}
        onChange={(accent) => update({ accent })}
      />

      <Chips
        title="Фонт"
        options={FONT_FAMILIES}
        value={appearance.font}
        onChange={(font) =>
          update({ font: font as Appearance["font"] })
        }
      />

      <Chips
        title="Суурь өнгө"
        options={[
          { id: "dark", label: "Бараан" },
          { id: "light", label: "Цайвар" },
        ]}
        value={appearance.tone}
        onChange={(tone) =>
          update({ tone: tone as Appearance["tone"] })
        }
      />

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-black/55">
          Зургийн гэрэл: {appearance.brightness}%
          <input
            type="range"
            min="50"
            max="150"
            step="1"
            value={appearance.brightness}
            onChange={(event) =>
              update({ brightness: Number(event.target.value) })
            }
            className="mt-3 block w-full accent-black"
          />
        </label>
        <label className="block text-xs font-semibold text-black/55">
          Бараан давхарга: {appearance.darkness}%
          <input
            type="range"
            min="0"
            max="80"
            step="1"
            value={appearance.darkness}
            onChange={(event) =>
              update({ darkness: Number(event.target.value) })
            }
            className="mt-3 block w-full accent-black"
          />
        </label>
      </div>

      <Chips
        title="Бичвэрийн сүүдэр"
        options={[
          { id: "none", label: "Үгүй" },
          { id: "soft", label: "Зөөлөн" },
          { id: "strong", label: "Тод" },
        ]}
        value={appearance.textShadow}
        onChange={(textShadow) =>
          update({
            textShadow: textShadow as Appearance["textShadow"],
          })
        }
      />

      <Chips
        title="Арын хээ"
        options={PATTERNS}
        value={appearance.pattern}
        onChange={(pattern) => update({ pattern })}
      />

      <Chips
        title="Анимэйшн"
        options={ANIMATIONS}
        value={appearance.animation}
        onChange={(animation) => update({ animation })}
      />

      <Chips
        title="Урилга нээх хэлбэр"
        options={OPEN_STYLES}
        value={appearance.open}
        onChange={(open) => update({ open })}
      />
    </div>
  );
}
