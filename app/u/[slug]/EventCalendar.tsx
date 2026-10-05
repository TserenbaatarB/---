"use client";

import { useEffect, useState } from "react";

type Props = {
  date: string;
  time: string;
  title: string;
  location: string;
  accent: string;
  buttonClass: string;
};

const WEEKDAYS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];
const WEEKDAY_NAMES = [
  "Ням",
  "Даваа",
  "Мягмар",
  "Лхагва",
  "Пүрэв",
  "Баасан",
  "Бямба",
];

function parseDate(date: string, time: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);

  if (!match) {
    return null;
  }

  const timeMatch = /^(\d{1,2}):(\d{2})/.exec(time || "");

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    timeMatch ? Number(timeMatch[1]) : 0,
    timeMatch ? Number(timeMatch[2]) : 0
  );
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toIcsDate(date: Date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
    date.getDate()
  )}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

export default function EventCalendar({
  date,
  time,
  title,
  location,
  accent,
  buttonClass,
}: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const eventDate = parseDate(date, time);

  if (!eventDate) {
    return null;
  }

  const year = eventDate.getFullYear();
  const month = eventDate.getMonth();
  const day = eventDate.getDate();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstOffset = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array<null>(firstOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const diff = eventDate.getTime() - now;
  const showCountdown = diff > 0;

  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const countdown = [
    { label: "Өдөр", value: Math.floor(totalSeconds / 86400) },
    { label: "Цаг", value: Math.floor((totalSeconds % 86400) / 3600) },
    { label: "Минут", value: Math.floor((totalSeconds % 3600) / 60) },
    { label: "Секунд", value: totalSeconds % 60 },
  ];

  function downloadIcs() {
    const end = new Date(eventDate!.getTime() + 3 * 60 * 60 * 1000);

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//digital-invitation//MN",
      "BEGIN:VEVENT",
      `UID:${toIcsDate(eventDate!)}@digital-invitation`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(eventDate!)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:${title.replace(/[\r\n,;]+/g, " ")}`,
      `LOCATION:${location.replace(/[\r\n,;]+/g, " ")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const url = URL.createObjectURL(
      new Blob([ics], { type: "text/calendar;charset=utf-8" })
    );
    const link = document.createElement("a");

    link.href = url;
    link.download = "invitation.ics";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-sm text-center">
      <p
        className="text-xs font-semibold uppercase tracking-[0.25em]"
        style={{ color: accent }}
      >
        Хэзээ
      </p>

      <p className="mt-4 text-5xl font-semibold">{day}</p>

      <p className="mt-2 text-sm opacity-70">
        {WEEKDAY_NAMES[eventDate.getDay()]}
        {time ? ` · ${time}` : ""}
      </p>

      <p className="mt-1 text-sm opacity-70">
        {month + 1}-р сар {year}
      </p>

      <div className="mt-6 grid grid-cols-7 gap-y-2 text-sm">
        {WEEKDAYS.map((name) => (
          <span key={name} className="text-xs opacity-50">
            {name}
          </span>
        ))}

        {cells.map((cell, index) => (
          <span
            key={index}
            className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full ${
              cell === day ? "font-semibold text-white" : ""
            }`}
            style={cell === day ? { backgroundColor: accent } : undefined}
          >
            {cell}
          </span>
        ))}
      </div>

      {showCountdown && (
        <div className="mt-8 grid grid-cols-4 gap-2">
          {countdown.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-white/70 py-3"
            >
              <p className="text-xl font-semibold tabular-nums">
                {pad(item.value)}
              </p>
              <p className="text-[10px] opacity-60">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={downloadIcs}
        className={`mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold shadow-sm ${buttonClass}`}
      >
        📅 Календарт нэмэх
      </button>
    </div>
  );
}
