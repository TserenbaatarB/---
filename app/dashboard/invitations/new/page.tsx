"use client";

import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";

const eventTypes = [
  {
    icon: "💍",
    title: "Хурим",
    subtitle: "Wedding",
    type: "wedding",
  },
  {
    icon: "🎂",
    title: "Төрсөн өдөр",
    subtitle: "Birthday",
    type: "birthday",
  },
  {
    icon: "👶",
    title: "Сэвлэг үргээх",
    subtitle: "Baby Ceremony",
    type: "baby",
  },
  {
    icon: "🥂",
    title: "Ойн баяр",
    subtitle: "Anniversary",
    type: "anniversary",
  },
  {
    icon: "🎓",
    title: "Төгсөлт",
    subtitle: "Graduation",
    type: "graduation",
  },
  {
    icon: "💐",
    title: "Сүй тавих",
    subtitle: "Engagement",
    type: "engagement",
  },
  {
    icon: "🏡",
    title: "Шинэ гэр",
    subtitle: "Housewarming",
    type: "housewarming",
  },
  {
    icon: "🎉",
    title: "Бусад арга хэмжээ",
    subtitle: "Other Events",
    type: "other",
  },
];

export default function NewInvitationPage() {
  const router = useRouter();

  function handleEventSelect(type: string) {
    router.push(`/dashboard/invitations/new/template?event=${type}`);
  }

  return (
    <main className="min-h-screen bg-[#F8F5F0] text-[#171717]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <BrandLogo />

          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-black/45 transition hover:text-black"
          >
            ← Буцах
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
        <div className="mb-10 text-center">
          <div className="text-sm font-medium text-black/40">
            Шинэ урилга
          </div>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Ямар арга хэмжээний
            <br />
            урилга хийх вэ?
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-black/45">
            Төрлөө сонгоод дараагийн алхам руу үргэлжлүүлнэ үү.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {eventTypes.map((event) => (
            <button
              key={event.type}
              onClick={() => handleEventSelect(event.type)}
              className="group rounded-[26px] border border-black/10 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-black/20 hover:shadow-lg"
            >
              <div className="text-4xl transition-transform duration-200 group-hover:scale-110">
                {event.icon}
              </div>

              <div className="mt-5 text-lg font-semibold">
                {event.title}
              </div>

              <div className="mt-1 text-xs text-black/40">
                {event.subtitle}
              </div>

              <div className="mt-6 text-xs font-semibold text-black/35 transition group-hover:text-black">
                Сонгох →
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}