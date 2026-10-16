"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import SceneBackdrop from "@/components/scenes/SceneBackdrop";
import SceneOpening from "@/components/scenes/SceneOpening";
import { useReducedMotion } from "@/components/scenes/hooks";
import { sceneColors } from "@/lib/sceneTheme";
import {
  SCENES,
  TIERS,
  appearanceForTemplate,
  getScene,
  sceneForEvent,
  sceneOpeningDuration,
  templatesForScene,
  type SceneDef,
  type TemplateDef,
} from "@/lib/invitationTemplates";
import { readExtras, writeExtras } from "@/lib/invitationExtras";
import type { TierId } from "@/lib/invitationExtras";

function colorsFor(template: TemplateDef, scene: SceneDef) {
  return sceneColors(
    template.appearance.primary ?? scene.palette.primary,
    template.appearance.accent ?? scene.palette.accent,
    template.appearance.tone === "dark" ? "dark" : "light",
    scene.palette
  );
}

function Thumb({
  template,
  scene,
}: {
  template: TemplateDef;
  scene: SceneDef;
}) {
  const c = colorsFor(template, scene);

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden">
      <SceneBackdrop
        scene={scene}
        colors={c}
        tier="classic"
        withBackground
        fixed={false}
        animated={false}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <div
          className="text-[10px] uppercase tracking-[0.25em]"
          style={{ color: c.accent }}
        >
          {scene.english}
        </div>
        <div
          className="mt-2 text-lg font-semibold leading-tight"
          style={{ color: c.ink }}
        >
          {scene.sample.names}
        </div>
      </div>
    </div>
  );
}

function PreviewModal({
  template,
  scene,
  tier,
  onClose,
  onSelect,
}: {
  template: TemplateDef;
  scene: SceneDef;
  tier: TierId;
  onClose: () => void;
  onSelect: () => void;
}) {
  const reduced = useReducedMotion();
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(tier === "classic");
  const [run, setRun] = useState(0);
  const timer = useRef<number | null>(null);
  const c = colorsFor(template, scene);
  const s = scene.sample;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [onClose]);

  function finish() {
    if (timer.current) window.clearTimeout(timer.current);
    setStarted(true);
    setDone(true);
  }

  function open() {
    if (started || tier === "classic") return;
    setStarted(true);
    timer.current = window.setTimeout(
      () => setDone(true),
      sceneOpeningDuration(tier, reduced)
    );
  }

  function replay() {
    if (timer.current) window.clearTimeout(timer.current);
    setStarted(false);
    setDone(tier === "classic");
    setRun((n) => n + 1);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Урьдчилан харах"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm"
    >
      <div className="flex max-h-full w-full max-w-md flex-col gap-3">
        <div className="relative aspect-[9/16] max-h-[78dvh] w-full self-center overflow-hidden rounded-3xl shadow-2xl">
          <SceneBackdrop
            scene={scene}
            colors={c}
            tier={tier}
            withBackground
            fixed={false}
          />
          {done && (
            <div className="sc-reveal absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <div
                className="text-xs uppercase tracking-[0.3em]"
                style={{ color: c.accent }}
              >
                {s.title}
              </div>
              <div
                className="mt-3 text-3xl font-semibold leading-tight"
                style={{ color: c.ink }}
              >
                {s.names}
              </div>
              <div className="mt-4 text-sm" style={{ color: c.ink }}>
                {s.date} · {s.time}
              </div>
              <div className="text-sm opacity-80" style={{ color: c.ink }}>
                {s.venue}
              </div>
              <p
                className="mt-4 max-w-xs text-sm leading-6 opacity-90"
                style={{ color: c.ink }}
              >
                {s.message}
              </p>
            </div>
          )}
          {!done && tier !== "classic" && (
            <SceneOpening
              key={run}
              scene={scene}
              colors={c}
              tier={tier}
              title={s.names}
              started={started}
              ready
              onOpen={open}
              onSkip={finish}
              embedded
            />
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl bg-white/15 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/25"
          >
            Хаах
          </button>
          {tier !== "classic" && (
            <button
              type="button"
              onClick={replay}
              className="flex-1 rounded-2xl bg-white/15 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/25"
            >
              Дахин үзэх
            </button>
          )}
          <button
            type="button"
            onClick={onSelect}
            className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Сонгох
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const event = searchParams.get("event") ?? "wedding";
  const initialScene =
    getScene(searchParams.get("category"))?.id ?? sceneForEvent(event).id;

  const [sceneId, setSceneId] = useState<string>(initialScene);
  const [tier, setTier] = useState<TierId>("premium");
  const [preview, setPreview] = useState<TemplateDef | null>(null);
  const [error, setError] = useState("");

  const scene = getScene(sceneId);
  const templates = templatesForScene(sceneId);
  const previewScene = preview ? getScene(preview.scene) : undefined;

  function handleSelect(template: TemplateDef) {
    const target = getScene(template.scene);
    if (!target) return;

    try {
      const current = readExtras();
      writeExtras({
        appearance: {
          ...current.appearance,
          ...appearanceForTemplate(template, tier),
        },
      });
      sessionStorage.setItem(
        `invitation-extras-seed:${target.eventType}`,
        "1"
      );
    } catch {
      setError(
        "Загварыг хадгалж чадсангүй. Хөтөчийн хадгалалт идэвхтэй эсэхийг шалгаад дахин оролдоно уу."
      );
      return;
    }

    router.push(
      `/dashboard/invitations/new/details?event=${target.eventType}&template=${template.id}`
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F5F0] text-[#171717]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          <BrandLogo />
          <button
            type="button"
            onClick={() => router.push("/dashboard/invitations/new")}
            className="text-sm text-black/45 transition hover:text-black"
          >
            ← Буцах
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-14">
        <div className="mb-8 text-center">
          <div className="text-sm font-medium text-black/40">Загвар сонгох</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">
            Урилгынхаа төрөл, хэв маягийг сонгоно уу
          </h1>
        </div>

        <div
          role="tablist"
          aria-label="Төрөл"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0"
        >
          {SCENES.map((s) => (
            <button
              key={s.id}
              role="tab"
              type="button"
              aria-selected={s.id === sceneId}
              onClick={() => setSceneId(s.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                s.id === sceneId
                  ? "border-black bg-black text-white"
                  : "border-black/10 bg-white text-black/70 hover:border-black/30"
              }`}
            >
              <span aria-hidden="true">{s.icon} </span>
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={t.id === tier}
              onClick={() => setTier(t.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                t.id === tier
                  ? "border-black bg-white shadow-md"
                  : "border-black/10 bg-white/60 hover:border-black/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t.label}</span>
                <span className="text-[10px] uppercase tracking-wider text-black/40">
                  {t.english}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-black/55">{t.blurb}</p>
            </button>
          ))}
        </div>

        {scene && (
          <p className="mt-6 text-center text-sm text-black/50">
            {scene.blurb}
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {!scene || templates.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-black/15 bg-white p-10 text-center text-sm text-black/50">
            Энэ төрөлд одоогоор загвар алга байна. Өөр төрөл сонгоно уу.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <article
                key={template.id}
                className="overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-sm"
              >
                <Thumb template={template} scene={scene} />
                <div className="p-4">
                  <h2 className="font-semibold">{template.name}</h2>
                  <p className="mt-1 text-xs leading-5 text-black/55">
                    {template.blurb}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPreview(template)}
                      className="flex-1 rounded-xl border border-black/15 px-3 py-2.5 text-sm font-medium transition hover:border-black/40"
                    >
                      Урьдчилан харах
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelect(template)}
                      className="flex-1 rounded-xl bg-black px-3 py-2.5 text-sm font-medium text-white transition hover:bg-black/85"
                    >
                      Сонгох
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {preview && previewScene && (
        <PreviewModal
          key={`${preview.id}-${tier}`}
          template={preview}
          scene={previewScene}
          tier={tier}
          onClose={() => setPreview(null)}
          onSelect={() => {
            const t = preview;
            setPreview(null);
            handleSelect(t);
          }}
        />
      )}
    </main>
  );
}

function TemplateSkeleton() {
  return (
    <main className="min-h-screen bg-[#F8F5F0]">
      <div className="mx-auto max-w-6xl animate-pulse px-6 py-14">
        <div className="mx-auto h-8 w-2/3 rounded bg-black/10" />
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-[26px] bg-black/10" />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function TemplatePage() {
  return (
    <Suspense fallback={<TemplateSkeleton />}>
      <TemplatePageContent />
    </Suspense>
  );
}
