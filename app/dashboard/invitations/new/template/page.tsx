"use client";

import { Suspense } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";

const templates = [
  {
    id: "classic",
    title: "Classic Romance",
    subtitle: "Сонгодог, дэгжин",
    description: "Зөөлөн өнгө, цэвэрхэн зохиомжтой сонгодог урилга.",
    previewClass:
      "bg-gradient-to-br from-[#f7f0e8] via-white to-[#e9ddd0]",
    examples: {
      wedding: {
        line1: "Бат & Саруул",
        line2: "Бидний хуримын өдөр",
        description: "Танд зориулсан\nхайрын баярт өдөр",
      },
      birthday: {
        line1: "Номин",
        line2: "Төрсөн өдрийн баяр",
        description: "Хамтдаа баяраа\nтэмдэглэцгээе",
      },
      baby: {
        line1: "Бяцхан үр",
        line2: "Сэвлэг үргээх ёслол",
        description: "Бидний баярт өдөрт\nхүрэлцэн ирээрэй",
      },
      anniversary: {
        line1: "Бат & Саруул",
        line2: "Хамтын амьдралын ой",
        description: "Бидний дурсамжит\nөдөрт хүрэлцэн ирээрэй",
      },
      graduation: {
        line1: "Тэмүүлэн",
        line2: "Төгсөлтийн баяр",
        description: "Баярт мөчөө\nхамтдаа хуваалцъя",
      },
      engagement: {
        line1: "Ананд & Номин",
        line2: "Сүй тавих ёслол",
        description: "Бидний онцгой\nөдөрт хүрэлцэн ирээрэй",
      },
      housewarming: {
        line1: "Бат & Саруул",
        line2: "Шинэ гэрийн баяр",
        description: "Шинэ гэрийнхээ\nбаярыг хамт тэмдэглэе",
      },
      other: {
        line1: "Онцгой өдөр",
        line2: "Баярт мөч",
        description: "Танд зориулсан\nдурсамжит өдөр",
      },
    },
  },
  {
    id: "luxury",
    title: "Luxury Gold",
    subtitle: "Тансаг, premium",
    description: "Алтан өнгөний акценттай тансаг загвар.",
    previewClass:
      "bg-gradient-to-br from-[#1f1b17] via-[#3b3025] to-[#b89b72]",
    examples: {
      wedding: {
        line1: "Тэмүүлэн & Номин",
        line2: "Хайрын баярт өдөр",
        description: "Бидний онцгой\nөдөрт морилно уу",
      },
      birthday: {
        line1: "Энхжин",
        line2: "Төрсөн өдрийн баяр",
        description: "Тансаг үдшийг\nхамтдаа өнгөрүүлье",
      },
      baby: {
        line1: "Бяцхан ханхүү",
        line2: "Сэвлэг үргээх ёслол",
        description: "Баярт мөчөө\nхамтдаа хуваалцъя",
      },
      anniversary: {
        line1: "Тэмүүлэн & Номин",
        line2: "10 жилийн ой",
        description: "Бидний дурсамжит\nөдөрт морилно уу",
      },
      graduation: {
        line1: "Энхжин",
        line2: "Төгсөлтийн баяр",
        description: "Амжилтын баяраа\nхамтдаа тэмдэглэе",
      },
      engagement: {
        line1: "Ананд & Сувд",
        line2: "Сүй тавих ёслол",
        description: "Бидний баярт\nмөчид морилно уу",
      },
      housewarming: {
        line1: "Тэмүүлэн & Номин",
        line2: "Шинэ гэрийн баяр",
        description: "Шинэ гэрийнхээ\nбаярыг хуваалцаарай",
      },
      other: {
        line1: "Тэмдэглэлт өдөр",
        line2: "Онцгой баяр",
        description: "Танд зориулсан\nтансаг үдэш",
      },
    },
  },
  {
    id: "minimal",
    title: "Modern Minimal",
    subtitle: "Минимал, modern",
    description: "Цэвэрхэн typography болон минимал дизайн.",
    previewClass:
      "bg-gradient-to-br from-[#f5f5f3] via-white to-[#deded8]",
    examples: {
      wedding: {
        line1: "Бат & Номин",
        line2: "Save the Date",
        description: "2026.10.24\nБидэнтэй хамт байгаарай",
      },
      birthday: {
        line1: "Номин",
        line2: "Birthday Celebration",
        description: "2026.10.24\nХамтдаа тэмдэглэцгээе",
      },
      baby: {
        line1: "Baby Ceremony",
        line2: "Сэвлэг үргээх ёслол",
        description: "Бидний баярт өдөр\nхамтдаа байгаарай",
      },
      anniversary: {
        line1: "Бат & Саруул",
        line2: "Our Anniversary",
        description: "10 Years Together\nХамтдаа тэмдэглэе",
      },
      graduation: {
        line1: "Тэмүүлэн",
        line2: "Graduation Day",
        description: "Шинэ эхлэлийн өдөр\nхамтдаа байгаарай",
      },
      engagement: {
        line1: "Ананд & Сувд",
        line2: "Engagement",
        description: "Бидний шинэ эхлэл\nхамтдаа байгаарай",
      },
      housewarming: {
        line1: "Бат & Номин",
        line2: "New Home",
        description: "Шинэ гэрийн баяр\nхамтдаа тэмдэглэе",
      },
      other: {
        line1: "Онцгой өдөр",
        line2: "Save the Date",
        description: "Баярт мөчөө\nхамтдаа хуваалцъя",
      },
    },
  },
  {
    id: "garden",
    title: "Garden",
    subtitle: "Романтик, floral",
    description: "Байгаль, цэцэгсийн зөөлөн мэдрэмжтэй загвар.",
    previewClass:
      "bg-gradient-to-br from-[#edf3ea] via-[#f8f5ee] to-[#d8e2d2]",
    examples: {
      wedding: {
        line1: "Ананд & Сувд",
        line2: "Хайрын цэцэгсийн дунд",
        description: "Бидний хуримын\nбаярт өдөрт морилно уу",
      },
      birthday: {
        line1: "Сувд",
        line2: "Төрсөн өдрийн баяр",
        description: "Инээд хөөр, баяр хөөрөөр\nдүүрэн өдөр",
      },
      baby: {
        line1: "Бяцхан үр",
        line2: "Сэвлэг үргээх ёслол",
        description: "Бяцхан үрийнхээ\nбаярт өдрийг хамт тэмдэглэе",
      },
      anniversary: {
        line1: "Ананд & Сувд",
        line2: "Хайрын ойн өдөр",
        description: "Хамтын амьдралынхаа\nдурсамжийг хуваалцъя",
      },
      graduation: {
        line1: "Сувд",
        line2: "Төгсөлтийн баяр",
        description: "Шинэ эхлэлийн\nбаярт мөч",
      },
      engagement: {
        line1: "Ананд & Сувд",
        line2: "Бидний шинэ эхлэл",
        description: "Сүй тавих ёслолын\nбаярт өдөр",
      },
      housewarming: {
        line1: "Бат & Саруул",
        line2: "Шинэ гэрийн баяр",
        description: "Шинэ гэрийнхээ\nбаярыг хамт тэмдэглэе",
      },
      other: {
        line1: "Онцгой мөч",
        line2: "Баярт өдөр",
        description: "Цэцэгсийн дунд\nдурсамж бүтээе",
      },
    },
  },
];

const eventNames = {
  wedding: "Хурим",
  birthday: "Төрсөн өдөр",
  baby: "Сэвлэг үргээх",
  anniversary: "Ойн баяр",
  graduation: "Төгсөлт",
  engagement: "Сүй тавих",
  housewarming: "Шинэ гэр",
  other: "Бусад арга хэмжээ",
} as const;

type EventType = keyof typeof eventNames;

function TemplatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventParam = searchParams.get("event") ?? "wedding";
  const event: EventType = eventParam in eventNames ? (eventParam as EventType) : "wedding";
  const eventName = eventNames[event] ?? "Арга хэмжээ";

  function handleTemplateSelect(templateId: string) {
    router.push(
      `/dashboard/invitations/new/details?event=${event}&template=${templateId}`
    );
  }

  function handleBack() {
    router.push("/dashboard/invitations/new");
  }

  return (
    <main className="min-h-screen bg-[#F8F5F0] text-[#171717]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <BrandLogo />

          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-black/45 transition hover:text-black"
          >
            ← Буцах
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <div className="mb-10 text-center">
          <div className="text-sm font-medium text-black/40">
            {eventName}
          </div>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Загвараа сонгоно уу
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-black/45">
            Таны урилгын үндсэн загварыг сонгоод дараагийн алхам руу
            үргэлжлүүлнэ үү.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((template) => {
            const eventKey = event as EventType;

            const example =
              template.examples[eventKey] ?? template.examples.other;

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateSelect(template.id)}
                className="group overflow-hidden rounded-[28px] border border-black/10 bg-white text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-black/20 hover:shadow-xl"
              >
                <div
                  className={`relative h-[360px] overflow-hidden ${template.previewClass}`}
                >
                  <div className="absolute inset-5 rounded-[22px] border border-black/10 bg-white/65 p-6 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="text-[10px] uppercase tracking-[0.28em] text-black/30">
                        {eventName}
                      </div>

                      <div className="mx-auto mt-8 h-px w-12 bg-black/15" />

                      <div className="mt-8 text-2xl font-serif italic text-black/45">
                        {example.line1}
                      </div>

                      <div className="mt-2 text-2xl font-semibold tracking-tight text-black/50">
                        {example.line2}
                      </div>

                      <div className="mx-auto mt-6 h-px w-12 bg-black/15" />

                      <div className="mt-6 whitespace-pre-line text-[11px] leading-5 text-black/35">
                        {example.description}
                      </div>

                      <div className="mt-10 text-[9px] uppercase tracking-[0.25em] text-black/25">
                        JZT GROUP · URILGA
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="text-lg font-semibold">
                    {template.title}
                  </div>

                  <div className="mt-1 text-xs font-medium text-black/40">
                    {template.subtitle}
                  </div>

                  <p className="mt-3 text-sm leading-6 text-black/45">
                    {template.description}
                  </p>

                  <div className="mt-5 text-xs font-semibold text-black/35 transition group-hover:text-black">
                    Энэ загварыг сонгох →
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default function TemplatePage() {
  return (
    <Suspense fallback={null}>
      <TemplatePageContent />
    </Suspense>
  );
}