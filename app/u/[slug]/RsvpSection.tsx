"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Settings = {
  enabled: boolean;
  askGuests: boolean;
  deadline: string;
  visibility: "open" | "anonymous" | "hidden";
};

type Summary = {
  yes: number;
  no: number;
  guests: number;
  list: {
    name: string;
    status: "yes" | "no";
    guests: number;
  }[];
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key);
}

const inputClass =
  "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none placeholder:text-black/35 focus:border-black/30";

export default function RsvpSection({
  slug,
  accent,
  buttonClass,
}: {
  slug: string;
  accent: string;
  buttonClass: string;
}) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(0);
  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const storageKey = `rsvp-sent-${slug}`;

  async function loadSummary() {
    try {
      const { data } = await getSupabase().rpc("get_public_rsvps", {
        p_slug: slug,
      });

      setSummary((data as Summary | null) ?? null);
    } catch (e) {
      console.error("RSVP SUMMARY ERROR:", e);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await getSupabase().rpc(
          "get_public_rsvp_settings",
          {
            p_slug: slug,
          }
        );

        if (cancelled || !data) return;

        setSettings(data as Settings);

        setDone(localStorage.getItem(storageKey) === "1");

        const { data: sum } = await getSupabase().rpc(
          "get_public_rsvps",
          {
            p_slug: slug,
          }
        );

        if (!cancelled) {
          setSummary((sum as Summary | null) ?? null);
        }
      } catch (e) {
        console.error("RSVP LOAD ERROR:", e);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [slug, storageKey]);

  if (!settings?.enabled) return null;

  const closed =
    /^\d{4}-\d{2}-\d{2}$/.test(settings.deadline) &&
    new Date().toISOString().slice(0, 10) > settings.deadline;

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Нэрээ оруулна уу.");
      return;
    }

    setSending(true);
    setError("");

    const { error: rpcError } = await getSupabase().rpc("submit_rsvp", {
      p_slug: slug,
      p_name: name.trim(),
      p_phone: phone.trim(),
      p_status: status,
      p_guests: guests,
      p_message: message.trim(),
    });

    setSending(false);

    if (rpcError) {
      setError(
        rpcError.message.includes("rsvp_closed")
          ? "Хариу авах хугацаа дууссан байна."
          : "Илгээж чадсангүй. Дахин оролдоно уу."
      );
      return;
    }

    localStorage.setItem(storageKey, "1");
    setDone(true);

    await loadSummary();
  }

  return (
    <section className="px-6 py-12 text-center sm:px-12">
      <p
        className="text-xs font-semibold uppercase tracking-[0.25em]"
        style={{ color: accent }}
      >
        Оролцох эсэх
      </p>

      {settings.deadline && (
        <p className="mt-3 text-xs opacity-60">
          Сүүлийн хугацаа: {settings.deadline}
        </p>
      )}

      {done ? (
        <p className="mt-6 text-sm font-medium">
          Баярлалаа! Таны хариу хүлээн авлаа.
        </p>
      ) : closed ? (
        <p className="mt-6 text-sm opacity-70">
          Хариу авах хугацаа дууссан.
        </p>
      ) : (
        <form
          onSubmit={submit}
          className="mx-auto mt-6 max-w-sm space-y-3 text-left"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="Таны нэр"
            className={inputClass}
          />

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={30}
            inputMode="tel"
            placeholder="Утасны дугаар (заавал биш)"
            className={inputClass}
          />

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["yes", "Очно"],
                ["no", "Боломжгүй"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={status === id}
                onClick={() => setStatus(id)}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  status === id
                    ? "border-transparent text-white"
                    : "border-black/10 bg-white"
                }`}
                style={
                  status === id
                    ? { backgroundColor: accent }
                    : undefined
                }
              >
                {label}
              </button>
            ))}
          </div>

          {settings.askGuests && status === "yes" && (
            <label className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm">
              <span>Хамт ирэх хүн</span>

              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="bg-transparent font-semibold outline-none"
              >
                {Array.from({ length: 11 }, (_, i) => (
                  <option key={i} value={i}>
                    +{i}
                  </option>
                ))}
              </select>
            </label>
          )}

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Мэндчилгээ (заавал биш)"
            className={inputClass}
          />

          {error && (
            <p className="text-xs text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className={`w-full rounded-full px-7 py-3 text-sm font-semibold shadow-sm disabled:opacity-60 ${buttonClass}`}
          >
            {sending ? "Илгээж байна..." : "Хариу илгээх"}
          </button>
        </form>
      )}

      {summary && (
        <div className="mx-auto mt-8 max-w-sm">
          <p className="text-xs opacity-60">
            Очно: {summary.yes} · Боломжгүй: {summary.no} · Нийт ирэх:{" "}
            {summary.guests}
          </p>

          {settings.visibility === "open" &&
            summary.list.length > 0 && (
              <ul className="mt-3 space-y-1 text-left text-sm">
                {summary.list.map((item, index) => (
                  <li
                    key={index}
                    className="flex justify-between rounded-xl bg-white/60 px-3 py-2"
                  >
                    <span>
                      {item.name}
                      {item.guests > 0
                        ? ` +${item.guests}`
                        : ""}
                    </span>

                    <span className="opacity-60">
                      {item.status === "yes"
                        ? "Очно"
                        : "Боломжгүй"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
        </div>
      )}
    </section>
  );
}