"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import { supabase } from "@/lib/supabase";

const eventTypes = [
  { icon: "💍", mn: "Хурим", en: "Wedding", type: "wedding" },
  { icon: "🎂", mn: "Төрсөн өдөр", en: "Birthday", type: "birthday" },
  { icon: "👶", mn: "Сэвлэг үргээх", en: "Baby Ceremony", type: "baby" },
  { icon: "🥂", mn: "Ойн баяр", en: "Anniversary", type: "anniversary" },
  { icon: "🎓", mn: "Төгсөлт", en: "Graduation", type: "graduation" },
  { icon: "💐", mn: "Сүй тавих", en: "Engagement", type: "engagement" },
  { icon: "🏡", mn: "Шинэ гэр", en: "Housewarming", type: "housewarming" },
  { icon: "🎉", mn: "Бусад арга хэмжээ", en: "Other Events", type: "other" },
];

export default function Home() {
  const router = useRouter();

  const [language, setLanguage] = useState<"mn" | "en">("mn");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const isMN = language === "mn";

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsLoggedIn(!!session);
      setCheckingSession(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const goToLogin = () => {
    router.push("/login");
  };

  const goToDashboard = () => {
    router.push("/dashboard");
  };

  const goToCreate = () => {
    if (isLoggedIn) {
      router.push("/dashboard/invitations/new");
      return;
    }

    router.push("/login?redirect=create");
  };

  const goToEvent = (type: string) => {
    if (isLoggedIn) {
      router.push(`/dashboard/invitations/new?event=${type}`);
      return;
    }

    router.push(`/login?redirect=create&event=${type}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    router.refresh();
  };

  const submitFeedback = async () => {
    const message = feedback.trim();

    if (!rating) {
      setFeedbackError(
        isMN
          ? "Үнэлгээгээ сонгоно уу."
          : "Please select a rating."
      );
      return;
    }

    if (!message) {
      setFeedbackError(
        isMN
          ? "Санал хүсэлтээ бичнэ үү."
          : "Please write your feedback."
      );
      return;
    }

    setSendingFeedback(true);
    setFeedbackError("");

    const { error } = await supabase
      .from("feedback")
      .insert({
        rating,
        message,
      });

    setSendingFeedback(false);

    if (error) {
      console.error("FEEDBACK ERROR:", error);

      setFeedbackError(
        isMN
          ? "Илгээхэд алдаа гарлаа. Дахин оролдоно уу."
          : "Something went wrong. Please try again."
      );

      return;
    }

    setFeedback("");
    setRating(0);
    setHoverRating(0);
    setFeedbackSent(true);

    setTimeout(() => {
      setFeedbackSent(false);
    }, 4000);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F5F1EA] text-[#171513] selection:bg-[#C7A47A]/20">

      {/* =========================================================
          NAVBAR
      ========================================================= */}
      <nav className="sticky top-0 z-50 border-b border-[#171513]/[0.07] bg-[#F5F1EA]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <BrandLogo />

          <div className="hidden items-center gap-9 text-[13px] font-medium tracking-wide text-black/50 md:flex">
            <a
              href="#events"
              className="transition duration-300 hover:text-black"
            >
              {isMN ? "Арга хэмжээ" : "Events"}
            </a>

            <a
              href="#ai"
              className="transition duration-300 hover:text-black"
            >
              AI Designer
            </a>

            <a
              href="#how"
              className="transition duration-300 hover:text-black"
            >
              {isMN ? "Хэрхэн ажиллах вэ?" : "How it works"}
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* LANGUAGE */}
            <div className="hidden rounded-full border border-black/10 bg-white/60 p-1 shadow-sm sm:flex">
              <button
                onClick={() => setLanguage("mn")}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition duration-300 ${
                  isMN
                    ? "bg-[#171513] text-white shadow-sm"
                    : "text-black/40 hover:text-black"
                }`}
              >
                MN
              </button>

              <button
                onClick={() => setLanguage("en")}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition duration-300 ${
                  !isMN
                    ? "bg-[#171513] text-white shadow-sm"
                    : "text-black/40 hover:text-black"
                }`}
              >
                EN
              </button>
            </div>

            {!checkingSession && (
              <>
                {isLoggedIn ? (
                  <>
                    <button
                      onClick={goToDashboard}
                      className="rounded-full border border-black/10 bg-white/70 px-4 py-2.5 text-xs font-medium shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white"
                    >
                      Dashboard
                    </button>

                    <button
                      onClick={handleLogout}
                      className="rounded-full bg-[#171513] px-4 py-2.5 text-xs font-medium text-white shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-0.5 hover:bg-black"
                    >
                      {isMN ? "Гарах" : "Log out"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={goToLogin}
                    className="rounded-full bg-[#171513] px-5 py-2.5 text-xs font-medium text-white shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-0.5 hover:bg-black"
                  >
                    {isMN ? "Нэвтрэх" : "Log in"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative overflow-hidden border-b border-black/[0.06]">
        {/* Decorative lights */}
        <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#D6C1A5]/30 blur-[100px]" />
        <div className="pointer-events-none absolute right-[-100px] top-[-100px] h-[500px] w-[500px] rounded-full bg-[#E1D4C2]/60 blur-[120px]" />

        <div className="relative mx-auto grid max-w-[1440px] items-center gap-16 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-28 xl:py-32">

          {/* LEFT */}
          <div className="relative z-10 max-w-3xl">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-black/10 bg-white/60 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45 shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B99163] shadow-[0_0_12px_rgba(185,145,99,0.6)]" />
              AI-powered digital invitations
            </div>

            <h1 className="max-w-4xl font-serif text-[4rem] font-normal leading-[0.91] tracking-[-0.045em] sm:text-[5.3rem] lg:text-[6.3rem] xl:text-[7rem]">
              {isMN ? (
                <>
                  Таны онцгой
                  <br />
                  <span className="italic text-[#A27A4F]">
                    мөч,
                  </span>{" "}
                  таны
                  <br />
                  урилга.
                </>
              ) : (
                <>
                  Your special
                  <br />
                  <span className="italic text-[#A27A4F]">
                    moment,
                  </span>{" "}
                  your
                  <br />
                  invitation.
                </>
              )}
            </h1>

            <p className="mt-8 max-w-xl text-[15px] leading-7 text-black/50 sm:text-base">
              {isMN
                ? "Хурим, төрсөн өдөр, сэвлэг үргээх, төгсөлт болон бусад онцгой мөчдөө зориулан AI ашиглан өөрийн дижитал урилгаа бүтээгээрэй."
                : "Create beautiful digital invitations for weddings, birthdays, baby ceremonies, graduations and every special moment with AI."}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={goToCreate}
                className="group rounded-full bg-[#171513] px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:bg-black hover:shadow-2xl"
              >
                {isMN ? "Урилга үүсгэх" : "Create invitation"}
                <span className="ml-3 inline-block transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </button>

              <a
                href="#events"
                className="rounded-full border border-black/10 bg-white/60 px-7 py-4 text-center text-sm font-semibold shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:bg-white"
              >
                {isMN ? "Загварууд үзэх" : "Explore templates"}
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-[10px] font-medium uppercase tracking-[0.16em] text-black/35">
              <span>✦ AI Designer</span>
              <span>✦ Live Preview</span>
              <span>✦ QR Share</span>
            </div>
          </div>

          {/* HERO INVITATION */}
          <div className="relative mx-auto w-full max-w-[500px] lg:ml-auto">
            <div className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full bg-[#C8AD8D]/30 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-[#B9C4B5]/30 blur-[80px]" />

            <div className="relative rotate-[2deg] transition duration-700 hover:rotate-0">

              {/* Back card */}
              <div className="absolute -right-4 top-8 h-full w-full rotate-[5deg] rounded-[38px] border border-black/5 bg-[#E5DDD2] shadow-xl" />

              {/* Main card */}
              <div className="relative rounded-[38px] border border-white/70 bg-white/80 p-3 shadow-[0_35px_90px_rgba(50,40,30,0.16)] backdrop-blur-sm">
                <div className="overflow-hidden rounded-[30px] bg-[#E9E0D4]">
                  <div className="relative flex min-h-[590px] flex-col items-center justify-between overflow-hidden px-8 py-12 text-center">

                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.8),transparent_40%)]" />

                    <div className="relative">
                      <div className="text-[9px] font-medium uppercase tracking-[0.45em] text-black/40">
                        OUR WEDDING
                      </div>

                      <div className="mx-auto mt-4 h-px w-12 bg-black/15" />
                    </div>

                    <div className="relative">
                      <div className="font-serif text-[3.7rem] font-normal italic leading-none tracking-[-0.04em] text-black/80">
                        Bat & Nomin
                      </div>

                      <div className="mt-6 text-[10px] font-medium tracking-[0.35em] text-black/40">
                        JUNE 20 · 2027
                      </div>
                    </div>

                    <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-[10px] border-white/70 bg-[#D5C1AA] shadow-xl">
                      <div className="text-5xl drop-shadow-sm">
                        💍
                      </div>
                    </div>

                    <div className="relative">
                      <div className="text-[11px] font-medium tracking-wide">
                        Уригч Бат & Номин
                      </div>

                      <div className="mt-2 text-[9px] uppercase tracking-[0.2em] text-black/40">
                        Ulaanbaatar · Mongolia
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating label */}
              <div className="absolute -bottom-5 -left-6 rounded-2xl border border-black/10 bg-white/90 px-5 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.12)] backdrop-blur-md">
                <div className="text-[8px] font-medium uppercase tracking-[0.2em] text-black/35">
                  Crafted with
                </div>

                <div className="mt-1 text-xs font-semibold tracking-[0.22em]">
                  URILGA
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* bottom scroll hint */}
        <div className="hidden pb-8 text-center lg:block">
          <span className="text-[9px] font-medium uppercase tracking-[0.35em] text-black/25">
            Scroll to discover
          </span>
        </div>
      </section>

      {/* =========================================================
          EVENTS
      ========================================================= */}
      <section id="events" className="bg-[#FBF9F6]">
        <div className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">

          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#A27A4F]">
                {isMN ? "Боломжууд" : "Occasions"}
              </div>

              <h2 className="mt-4 font-serif text-5xl font-normal leading-none tracking-[-0.035em] sm:text-6xl">
                {isMN
                  ? "Ямар ч онцгой мөчид."
                  : "For every special moment."}
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 text-black/45 lg:text-right">
              {isMN
                ? "Өөрт тохирох төрлөө сонгоод урилгаа эхлүүлээрэй."
                : "Choose an occasion and start creating your invitation."}
            </p>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
            {eventTypes.map((event, index) => (
              <button
                key={event.type}
                onClick={() => goToEvent(event.type)}
                className="group relative overflow-hidden rounded-[28px] border border-black/[0.08] bg-white p-6 text-left shadow-sm transition duration-500 hover:-translate-y-1 hover:border-[#B99163]/30 hover:shadow-[0_20px_50px_rgba(50,40,30,0.09)] sm:p-7"
              >
                <div className="absolute right-[-25px] top-[-25px] h-24 w-24 rounded-full bg-[#E9DFD2] opacity-0 blur-2xl transition duration-500 group-hover:opacity-100" />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl transition duration-500 group-hover:scale-110">
                      {event.icon}
                    </span>

                    <span className="font-serif text-xs italic text-black/20">
                      0{index + 1}
                    </span>
                  </div>

                  <div className="mt-12 text-sm font-semibold">
                    {isMN ? event.mn : event.en}
                  </div>

                  <div className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-black/30 transition duration-300 group-hover:text-[#A27A4F]">
                    {isMN ? "Урилга үүсгэх" : "Create invitation"}
                    <span className="ml-2">→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          AI SECTION
      ========================================================= */}
      <section id="ai" className="relative overflow-hidden bg-[#171513] text-white">
        <div className="pointer-events-none absolute left-[-150px] top-[-100px] h-[500px] w-[500px] rounded-full bg-[#A27A4F]/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-[-200px] right-[-100px] h-[500px] w-[500px] rounded-full bg-[#CDB99E]/10 blur-[120px]" />

        <div className="relative mx-auto grid max-w-[1440px] gap-16 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-32">

          <div className="flex flex-col justify-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#CBA77C]">
              AI DESIGNER
            </div>

            <h2 className="mt-6 max-w-xl font-serif text-5xl font-normal leading-[0.98] tracking-[-0.035em] sm:text-6xl">
              {isMN
                ? "Зүгээр л хүссэн зүйлээ хэл."
                : "Just tell us what you want."}
            </h2>

            <p className="mt-7 max-w-xl text-sm leading-7 text-white/45 sm:text-base">
              {isMN
                ? "“Luxury, romantic, cream өнгөтэй хуримын урилга хий” гэж бичихэд AI таны санааг ойлгож, урилгыг шууд бүтээнэ."
                : "Tell AI what you want — for example, “Create a luxury romantic wedding invitation in cream tones” — and watch your invitation come to life."}
            </p>

            <div className="mt-9 space-y-2">
              {[
                isMN
                  ? "🎨 Загвар, өнгө, typography"
                  : "🎨 Style, colors & typography",
                isMN
                  ? "✍️ Текстийг AI-аар боловсруулах"
                  : "✍️ AI-powered copywriting",
                isMN
                  ? "📱 Шууд live preview"
                  : "📱 Instant live preview",
                isMN
                  ? "🔄 Хүссэнээрээ дахин засах"
                  : "🔄 Edit everything with AI",
              ].map((item) => (
                <div
                  key={item}
                  className="group flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] px-5 py-4 text-sm text-white/65 transition duration-300 hover:border-white/15 hover:bg-white/[0.06] hover:text-white/85"
                >
                  <span className="mr-3 h-1 w-1 rounded-full bg-[#CBA77C] opacity-70" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* AI MOCKUP */}
          <div className="flex items-center">
            <div className="relative w-full">
              <div className="absolute -inset-5 rounded-[40px] bg-[#C5A77F]/5 blur-2xl" />

              <div className="relative rounded-[32px] border border-white/10 bg-[#211F1C] p-3 shadow-[0_35px_100px_rgba(0,0,0,0.45)]">
                <div className="rounded-[24px] border border-white/[0.05] bg-[#191816] p-5 sm:p-7">

                  <div className="flex items-center justify-between border-b border-white/[0.07] pb-5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-[#CBA77C]" />
                      <div className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/35">
                        URILGA AI
                      </div>
                    </div>

                    <div className="text-[9px] text-white/20">
                      DESIGNER
                    </div>
                  </div>

                  <div className="mt-5 rounded-[20px] border border-white/[0.06] bg-white/[0.025] p-5">
                    <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                      {isMN ? "Таны хүсэлт" : "Your prompt"}
                    </div>

                    <p className="mt-4 text-sm leading-7 text-white/70">
                      {isMN
                        ? "“Cream өнгөтэй, luxury, romantic хуримын урилга. Gold accent нэмээд story хэсгийг гоё харагдуул.”"
                        : "“Create a luxury romantic wedding invitation in cream with gold accents and a beautiful story section.”"}
                    </p>
                  </div>

                  <div className="flex items-center justify-center py-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-xs text-white/25">
                      ↓
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[20px] bg-[#E9E0D4] p-8 text-center text-black shadow-xl">
                    <div className="absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 rounded-full bg-white/50 blur-3xl" />

                    <div className="relative">
                      <div className="text-[8px] font-medium uppercase tracking-[0.35em] text-black/35">
                        OUR SPECIAL DAY
                      </div>

                      <div className="mt-5 font-serif text-4xl italic tracking-[-0.03em]">
                        Bat & Nomin
                      </div>

                      <div className="mx-auto mt-5 h-px w-10 bg-black/15" />

                      <div className="mt-5 text-[9px] font-medium tracking-[0.28em] text-black/35">
                        20 JUNE 2027
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS
      ========================================================= */}
      <section id="how" className="bg-[#F5F1EA]">
        <div className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">

          <div className="text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#A27A4F]">
              {isMN ? "Хялбархан" : "Simple"}
            </div>

            <h2 className="mt-4 font-serif text-5xl font-normal tracking-[-0.035em] sm:text-6xl">
              {isMN
                ? "3 алхам. Тэгээд л боллоо."
                : "3 steps. That's it."}
            </h2>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {[
              {
                number: "01",
                title: isMN ? "Төрлөө сонго" : "Choose an event",
                text: isMN
                  ? "Хурим, төрсөн өдөр, төгсөлт гэх мэт."
                  : "Wedding, birthday, graduation and more.",
              },
              {
                number: "02",
                title: isMN ? "AI-аар бүтээ" : "Design with AI",
                text: isMN
                  ? "Хүссэн загвараа хэлээд шууд бүтээлгээрэй."
                  : "Describe your vision and let AI design it.",
              },
              {
                number: "03",
                title: isMN ? "Хуваалц" : "Share",
                text: isMN
                  ? "Өөрийн link болон QR кодоор зочдоо урь."
                  : "Invite guests with your personal link and QR code.",
              },
            ].map((step) => (
              <div
                key={step.number}
                className="group relative overflow-hidden rounded-[30px] border border-black/[0.08] bg-white p-8 shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(40,30,20,0.08)] sm:p-9"
              >
                <div className="absolute right-[-30px] top-[-30px] h-32 w-32 rounded-full bg-[#E9DFD2] opacity-0 blur-3xl transition duration-500 group-hover:opacity-70" />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="font-serif text-5xl italic text-[#B68D60]">
                      {step.number}
                    </div>

                    <div className="h-9 w-9 rounded-full border border-black/10 text-center text-sm leading-9 text-black/25 transition duration-300 group-hover:border-[#B68D60]/30 group-hover:text-[#B68D60]">
                      →
                    </div>
                  </div>

                  <h3 className="mt-14 font-serif text-3xl font-normal tracking-tight">
                    {step.title}
                  </h3>

                  <p className="mt-4 max-w-xs text-sm leading-7 text-black/45">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          PRICING
      ========================================================= */}
      <section className="bg-[#FBF9F6]">
        <div className="mx-auto max-w-4xl px-5 py-24 text-center sm:px-8 lg:py-32">

          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#A27A4F]">
            {isMN ? "Энгийн үнэ" : "Simple pricing"}
          </div>

          <h2 className="mx-auto mt-4 max-w-xl font-serif text-5xl font-normal tracking-[-0.035em] sm:text-6xl">
            {isMN
              ? "Онцгой мөчид зориулсан."
              : "Made for special moments."}
          </h2>

          <div className="mx-auto mt-14 max-w-md rounded-[36px] border border-black/[0.08] bg-white p-2 shadow-[0_30px_80px_rgba(50,40,30,0.10)]">
            <div className="rounded-[30px] bg-[#F5F1EA] px-8 py-10 sm:px-10 sm:py-12">

              <div className="text-[9px] font-semibold uppercase tracking-[0.3em] text-black/35">
                ONE INVITATION
              </div>

              <h3 className="mt-5 font-serif text-7xl font-normal tracking-[-0.05em] text-[#A27A4F]">
                19,900₮
              </h3>

              <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-black/50">
                {isMN
                  ? "Нэг урилга. Бүх боломж. Хүссэнээрээ засварлаад арга хэмжээ дуустал ашиглаарай."
                  : "One invitation. Everything included. Edit it as much as you want until your event."}
              </p>

              <div className="my-8 h-px bg-black/[0.08]" />

              <ul className="mx-auto space-y-3 text-left text-sm text-black/60">
                {(isMN
                  ? [
                      "AI Designer",
                      "Live preview",
                      "Хувийн линк болон QR код",
                      "Хөгжим, зураг, газрын зураг",
                    ]
                  : [
                      "AI Designer",
                      "Live preview",
                      "Personal link & QR code",
                      "Music, photos & map",
                    ]
                ).map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#B99163]/10 text-[10px] text-[#A27A4F]">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={goToCreate}
                className="group mt-9 w-full rounded-full bg-[#171513] px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:bg-black hover:shadow-2xl"
              >
                {isMN ? "Урилгаа эхлүүлэх" : "Start creating"}
                <span className="ml-3 inline-block transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FEEDBACK
      ========================================================= */}
      <section className="border-t border-black/[0.06] bg-[#F5F1EA]">
        <div className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8 lg:py-28">

          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#A27A4F]">
            {isMN ? "Санал хүсэлт" : "Feedback"}
          </div>

          <h2 className="mt-4 font-serif text-4xl font-normal tracking-[-0.035em] sm:text-5xl">
            {isMN
              ? "Таны санал бидэнд чухал."
              : "We'd love to hear from you."}
          </h2>

          <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-black/45">
            {isMN
              ? "URILGA-г улам сайжруулахын тулд санал хүсэлтээ хуваалцаарай."
              : "Help us make URILGA better by sharing your feedback."}
          </p>

          <div className="mx-auto mt-10 max-w-xl rounded-[34px] border border-black/[0.08] bg-white p-2 shadow-[0_25px_70px_rgba(50,40,30,0.08)]">
            <div className="rounded-[28px] bg-[#FBF9F6] p-6 sm:p-9">

              {/* RATING */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35">
                  {isMN ? "Таны үнэлгээ" : "Your rating"}
                </div>

                <div
                  className="mt-5 flex justify-center gap-1"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active =
                      star <= (hoverRating || rating);

                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() =>
                          setHoverRating(star)
                        }
                        onClick={() => {
                          setRating(star);
                          setFeedbackError("");
                        }}
                        aria-label={`${star} stars`}
                        className={`text-[2.3rem] leading-none transition duration-200 sm:text-[2.6rem] ${
                          active
                            ? "scale-110 text-[#B99163]"
                            : "text-black/10 hover:text-[#B99163]/60"
                        }`}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 h-5 text-[10px] uppercase tracking-[0.15em] text-black/30">
                  {rating > 0
                    ? `${rating}/5`
                    : isMN
                      ? "Үнэлгээ сонгоно уу"
                      : "Select a rating"}
                </div>
              </div>

              {/* MESSAGE */}
              <div className="mt-7 text-left">
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">
                  {isMN
                    ? "Санал хүсэлт"
                    : "Your feedback"}
                </label>

                <textarea
                  value={feedback}
                  onChange={(event) => {
                    setFeedback(event.target.value);
                    setFeedbackError("");
                  }}
                  placeholder={
                    isMN
                      ? "Санал хүсэлтээ энд бичнэ үү..."
                      : "Write your feedback here..."
                  }
                  rows={5}
                  maxLength={1000}
                  className="mt-3 w-full resize-none rounded-[22px] border border-black/[0.08] bg-white px-5 py-4 text-sm leading-6 outline-none transition duration-300 placeholder:text-black/20 focus:border-[#B99163]/50 focus:ring-4 focus:ring-[#B99163]/10"
                />

                <div className="mt-2 text-right text-[10px] text-black/25">
                  {feedback.length}/1000
                </div>
              </div>

              {/* ERROR */}
              {feedbackError && (
                <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {feedbackError}
                </div>
              )}

              {/* SUCCESS */}
              {feedbackSent && (
                <div className="mt-4 rounded-2xl border border-[#B99163]/20 bg-[#B99163]/10 px-4 py-3 text-sm text-[#80613E]">
                  {isMN
                    ? "✓ Баярлалаа! Таны санал амжилттай илгээгдлээ."
                    : "✓ Thank you! Your feedback has been submitted."}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="button"
                onClick={submitFeedback}
                disabled={sendingFeedback}
                className="mt-5 w-full rounded-full bg-[#171513] px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:bg-black hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingFeedback
                  ? isMN
                    ? "Илгээж байна..."
                    : "Sending..."
                  : isMN
                    ? "Санал илгээх →"
                    : "Send feedback →"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="border-t border-black/[0.07] bg-[#171513] text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <div className="[&_img]:brightness-0 [&_img]:invert">
            <BrandLogo />
          </div>

          <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">
            © 2026 JZT GROUP. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}