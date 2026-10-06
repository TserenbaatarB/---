"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BrandLogo from "@/components/BrandLogo";

type InvitationDraft = {
  eventType: string;
  template: string;
  title: string;
  names: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  message: string;
  phone: string;
  selectedStyle: string;
  aiPrompt: string;
  activeSection: string;
  backgroundId: string | null;
  galleryIds: string[];
  galleryUrls: string[];
  savedAt: string;
};

const eventNames: Record<string, string> = {
  wedding: "Хурим",
  birthday: "Төрсөн өдөр",
  baby: "Хүүхдийн баяр",
  anniversary: "Ойн баяр",
  graduation: "Төгсөлтийн баяр",
  engagement: "Сүй тавих ёслол",
  housewarming: "Шинэ гэрийн баяр",
  other: "Бусад",
};

const ADMIN_EMAIL = "tsb.0318@gmail.com";

function hasActiveMembership(expiresAt: string | null | undefined) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() > Date.now());
}

export default function DashboardPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<InvitationDraft | null>(null);
  const [draftLoading, setDraftLoading] = useState(true);
  const [membershipExpiresAt, setMembershipExpiresAt] =
    useState<string | null>(null);
  const [membershipActive, setMembershipActive] = useState(false);
  const [membershipError, setMembershipError] = useState("");

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? "");

      try {
        const { data: membership, error } = await supabase
          .from("user_memberships")
          .select("expires_at")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        const expiresAt = membership?.expires_at ?? null;
        setMembershipExpiresAt(expiresAt);
        setMembershipActive(hasActiveMembership(expiresAt));
      } catch (error) {
        console.error("DASHBOARD MEMBERSHIP LOAD ERROR:", error);
        setMembershipError(
          error instanceof Error
            ? error.message
            : "Сарын эрхийн төлөвийг ачаалж чадсангүй."
        );
      }

      // Хадгалсан урилгаа browser-оос унших
      try {
        const savedDraft = sessionStorage.getItem("invitation-draft");

        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft) as InvitationDraft;

          if (parsedDraft && typeof parsedDraft === "object") {
            setDraft(parsedDraft);
          }
        }
      } catch (error) {
        console.error("INVITATION DRAFT LOAD ERROR:", error);
      } finally {
        setDraftLoading(false);
      }

      setLoading(false);
    }

    loadUser();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/");
    router.refresh();
  }

  function handleCreateInvitation() {
    if (!membershipActive) {
      router.push("/dashboard/billing");
      return;
    }

    router.push("/dashboard/invitations/new");
  }

  function handlePreview() {
    if (!draft) return;

    router.push(
      `/dashboard/invitations/new/preview?event=${encodeURIComponent(
        draft.eventType
      )}&template=${encodeURIComponent(draft.template)}`
    );
  }

  function handleEdit() {
    if (!draft) return;

    router.push(
      `/dashboard/invitations/new/builder?event=${encodeURIComponent(
        draft.eventType
      )}&template=${encodeURIComponent(draft.template)}`
    );
  }

  function formatSavedDate(value: string) {
    if (!value) return "";

    try {
      const date = new Date(value);

      return date.toLocaleString("mn-MN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F5F0]">
        <p className="text-sm text-black/40">Түр хүлээнэ үү...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F5F0] text-[#171717]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <BrandLogo />

          <button
            onClick={handleLogout}
            className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-black hover:text-white"
          >
            Гарах
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        {/* Welcome */}
        <div className="rounded-[32px] bg-white p-8 shadow-sm sm:p-10">
          <div className="text-sm text-black/40">Тавтай морилно уу</div>

          <h1 className="mt-2 text-4xl font-medium">{email}</h1>

          <p className="mt-4 max-w-xl leading-7 text-black/50">
            Эндээс та өөрийн дижитал урилгуудаа үүсгэж, засварлаж,
            удирдах боломжтой.
          </p>

          <div className="mt-6 rounded-2xl bg-[#F8F5F0] p-4">
            <p className="text-sm font-semibold">
              {membershipActive
                ? `Сарын эрх ${new Date(membershipExpiresAt ?? "").toLocaleDateString("mn-MN")} хүртэл идэвхтэй`
                : "Урилга нийтлэхэд ₮19,900 сарын эрх шаардлагатай"}
            </p>
            {membershipError && (
              <p role="alert" className="mt-2 text-xs text-red-700">
                Эрхийн төлөв уншигдсангүй: {membershipError}
              </p>
            )}
            <button
              type="button"
              onClick={() => router.push("/dashboard/billing")}
              className="mt-3 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold hover:bg-black/5"
            >
              {membershipActive ? "Эрх сунгах" : "Сарын эрх авах"}
            </button>
          </div>

          <button
            onClick={handleCreateInvitation}
            className="mt-8 rounded-full bg-black px-7 py-4 text-sm font-semibold text-white transition hover:bg-black/85"
          >
            {membershipActive ? "+ Шинэ урилга үүсгэх" : "Сарын эрхээ идэвхжүүлэх"}
          </button>

          <button
            onClick={() => router.push("/dashboard/responses")}
            className="mt-8 ml-3 rounded-full border border-black/10 bg-white px-7 py-4 text-sm font-semibold transition hover:bg-black hover:text-white"
          >
            Зочдын хариу
          </button>

          {email.toLowerCase() === ADMIN_EMAIL && (
            <button
              type="button"
              onClick={() => router.push("/dashboard/admin/payments")}
              className="mt-8 ml-3 rounded-full border border-black/10 bg-white px-7 py-4 text-sm font-semibold transition hover:bg-black hover:text-white"
            >
              Төлбөр баталгаажуулах
            </button>
          )}
        </div>

        {/* Миний урилгууд */}
        <div className="mt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-medium">Миний урилгууд</h2>

              <p className="mt-2 text-sm text-black/45">
                Таны хадгалсан урилгууд энд харагдана.
              </p>
            </div>

            {draft && (
              <button
                onClick={handleCreateInvitation}
                className="hidden rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-black hover:text-white sm:block"
              >
                {membershipActive ? "+ Шинэ урилга" : "Сарын эрх авах"}
              </button>
            )}
          </div>

          {draftLoading ? (
            <div className="rounded-[28px] bg-white p-10 text-center shadow-sm">
              <p className="text-sm text-black/40">
                Урилгуудыг уншиж байна...
              </p>
            </div>
          ) : draft ? (
            <div className="overflow-hidden rounded-[28px] bg-white shadow-sm">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#F8F5F0] px-3 py-1.5 text-xs font-medium text-black/60">
                        {eventNames[draft.eventType] ?? "Урилга"}
                      </span>

                      <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
                        Хадгалсан
                      </span>
                    </div>

                    <h3 className="mt-5 text-2xl font-semibold">
                      {draft.title ||
                        draft.names ||
                        "Шинэ дижитал урилга"}
                    </h3>

                    {draft.names && draft.title !== draft.names && (
                      <p className="mt-2 text-black/55">{draft.names}</p>
                    )}

                    <div className="mt-5 grid gap-3 text-sm text-black/55 sm:grid-cols-2">
                      {draft.date && (
                        <div className="rounded-2xl bg-[#F8F5F0] px-4 py-3">
                          <div className="text-xs text-black/35">Огноо</div>
                          <div className="mt-1 font-medium text-black/70">
                            {draft.date}
                          </div>
                        </div>
                      )}

                      {draft.time && (
                        <div className="rounded-2xl bg-[#F8F5F0] px-4 py-3">
                          <div className="text-xs text-black/35">Цаг</div>
                          <div className="mt-1 font-medium text-black/70">
                            {draft.time}
                          </div>
                        </div>
                      )}

                      {draft.venue && (
                        <div className="rounded-2xl bg-[#F8F5F0] px-4 py-3">
                          <div className="text-xs text-black/35">Байршил</div>
                          <div className="mt-1 font-medium text-black/70">
                            {draft.venue}
                          </div>
                        </div>
                      )}

                      {draft.savedAt && (
                        <div className="rounded-2xl bg-[#F8F5F0] px-4 py-3">
                          <div className="text-xs text-black/35">
                            Сүүлд хадгалсан
                          </div>
                          <div className="mt-1 font-medium text-black/70">
                            {formatSavedDate(draft.savedAt)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 text-5xl">
                    {draft.eventType === "wedding"
                      ? "💍"
                      : draft.eventType === "birthday"
                      ? "🎂"
                      : draft.eventType === "baby"
                      ? "👶"
                      : draft.eventType === "graduation"
                      ? "🎓"
                      : draft.eventType === "engagement"
                      ? "💎"
                      : draft.eventType === "anniversary"
                      ? "🥂"
                      : draft.eventType === "housewarming"
                      ? "🏠"
                      : "💌"}
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 border-t border-black/5 pt-6 sm:flex-row">
                  <button
                    onClick={handlePreview}
                    className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold transition hover:bg-black hover:text-white"
                  >
                    Урьдчилж харах
                  </button>

                  <button
                    onClick={handleEdit}
                    className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-black/85"
                  >
                    ✏️ Засах
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-black/10 bg-white p-10 text-center sm:p-14">
              <div className="text-5xl">💌</div>

              <h3 className="mt-5 text-xl font-semibold">
                Одоогоор хадгалсан урилга алга
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/45">
                Анхны дижитал урилгаа үүсгээд хадгалаарай. Таны урилга энд
                автоматаар харагдана.
              </p>

              <button
                onClick={handleCreateInvitation}
                className="mt-7 rounded-full bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-black/85"
              >
                {membershipActive ? "+ Анхны урилгаа үүсгэх" : "Сарын эрх авах"}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}