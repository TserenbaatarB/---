"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BrandLogo from "@/components/BrandLogo";
import { isDemoInvitation } from "@/lib/demoInvitation";

type Invitation = {
  id: string;
  event_type: string | null;
  title: string | null;
  names: string | null;
  event_date: string | null;
  event_time: string | null;
  venue: string | null;
  address: string | null;
  status: string | null;
  public_slug: string | null;
  created_at: string;
  updated_at: string | null;
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

function getEventIcon(eventType: string | null) {
  switch (eventType) {
    case "wedding":
      return "💍";
    case "birthday":
      return "🎂";
    case "baby":
      return "👶";
    case "graduation":
      return "🎓";
    case "engagement":
      return "💎";
    case "anniversary":
      return "🥂";
    case "housewarming":
      return "🏠";
    default:
      return "💌";
  }
}

export default function DashboardPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(true);

  const [membershipExpiresAt, setMembershipExpiresAt] =
    useState<string | null>(null);
  const [membershipActive, setMembershipActive] = useState(false);
  const [membershipError, setMembershipError] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

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

      await loadInvitations(user.id);

      setLoading(false);
    }

    loadUser();
  }, [router]);

  async function loadInvitations(userId: string) {
    setInvitationsLoading(true);

    try {
      const { data, error } = await supabase
        .from("invitations")
        .select(
          "id, event_type, title, names, event_date, event_time, venue, address, status, public_slug, created_at, updated_at"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("INVITATIONS LOAD ERROR:", error);
        setInvitations([]);
        return;
      }

      setInvitations((data ?? []) as Invitation[]);
    } finally {
      setInvitationsLoading(false);
    }
  }

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

  function handlePreview(invitation: Invitation) {
    if (invitation.public_slug) {
      router.push(`/u/${invitation.public_slug}`);
      return;
    }

    router.push(
      `/dashboard/invitations/new/preview?invitationId=${encodeURIComponent(
        invitation.id
      )}`
    );
  }

  /*
   * ЧУХАЛ:
   * Өмнө нь энд зөвхөн event дамжиж байсан.
   *
   * Одоо:
   * invitationId + event дамжуулж байгаа.
   *
   * Ингэснээр Builder яг аль invitation-ийг
   * Supabase-ээс уншиж засахаа мэднэ.
   */
  function handleEdit(invitation: Invitation) {
    const params = new URLSearchParams();

    params.set("invitationId", invitation.id);
    params.set("event", invitation.event_type ?? "wedding");

    router.push(
      `/dashboard/invitations/new/builder?${params.toString()}`
    );
  }

  async function handleDeleteInvitation(invitation: Invitation) {
    if (isDemoInvitation(invitation.public_slug)) {
      alert("Энэ нь нүүр хуудсанд ашигладаг жишээ урилга тул устгах боломжгүй.");
      return;
    }

    const invitationName =
      invitation.title ||
      invitation.names ||
      eventNames[invitation.event_type ?? ""] ||
      "энэ урилга";

    const confirmed = window.confirm(
      `“${invitationName}” урилгыг устгах уу?\n\nЭнэ урилгатай холбоотой бүх зочдын хариу мөн устах болно.`
    );

    if (!confirmed) return;

    setDeletingId(invitation.id);

    try {
      /*
       * Эхлээд тухайн invitation-ийн бүх RSVP-г устгана.
       * Дараа нь invitation өөрийг нь устгана.
       */
      const { error: rsvpDeleteError } = await supabase
        .from("invitation_rsvps")
        .delete()
        .eq("invitation_id", invitation.id);

      if (rsvpDeleteError) {
        console.error("RSVP DELETE ERROR:", rsvpDeleteError);

        alert(
          "Зочдын хариуг устгаж чадсангүй. Урилгыг устгаагүй тул дахин оролдоно уу."
        );

        return;
      }

      const { error: invitationDeleteError } = await supabase
        .from("invitations")
        .delete()
        .eq("id", invitation.id);

      if (invitationDeleteError) {
        console.error("INVITATION DELETE ERROR:", invitationDeleteError);

        alert("Урилгыг устгаж чадсангүй. Дахин оролдоно уу.");

        return;
      }

      setInvitations((current) =>
        current.filter((item) => item.id !== invitation.id)
      );

      /*
       * Хэрэв хуучин browser sessionStorage-д энэ урилга
       * хадгалагдсан байсан бол мөн цэвэрлэнэ.
       */
      try {
        const savedDraftRaw =
          sessionStorage.getItem("invitation-draft");

        if (savedDraftRaw) {
          sessionStorage.removeItem("invitation-draft");
          sessionStorage.removeItem("invitation-images");
          sessionStorage.removeItem("invitation-extras");
          sessionStorage.removeItem("invitation-music");
          sessionStorage.removeItem("invitation-cover-video");
        }
      } catch (storageError) {
        console.error("SESSION STORAGE CLEANUP ERROR:", storageError);
      }
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(value: string | null) {
    if (!value) return "";

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return value;
      }

      return date.toLocaleDateString("mn-MN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return value;
    }
  }

  function formatCreatedDate(value: string) {
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
        <p className="text-sm text-black/40">
          Түр хүлээнэ үү...
        </p>
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
          <div className="text-sm text-black/40">
            Тавтай морилно уу
          </div>

          <h1 className="mt-2 text-4xl font-medium">
            {email}
          </h1>

          <p className="mt-4 max-w-xl leading-7 text-black/50">
            Эндээс та өөрийн дижитал урилгуудаа үүсгэж, засварлаж,
            удирдах боломжтой.
          </p>

          <div className="mt-6 rounded-2xl bg-[#F8F5F0] p-4">
            <p className="text-sm font-semibold">
              {membershipActive
                ? `Сарын эрх ${new Date(
                    membershipExpiresAt ?? ""
                  ).toLocaleDateString("mn-MN")} хүртэл идэвхтэй`
                : "Урилга нийтлэхэд ₮19,900 сарын эрх шаардлагатай"}
            </p>

            {membershipError && (
              <p
                role="alert"
                className="mt-2 text-xs text-red-700"
              >
                Эрхийн төлөв уншигдсангүй: {membershipError}
              </p>
            )}

            <button
              type="button"
              onClick={() => router.push("/dashboard/billing")}
              className="mt-3 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold hover:bg-black/5"
            >
              {membershipActive
                ? "Эрх сунгах"
                : "Сарын эрх авах"}
            </button>
          </div>

          <button
            onClick={handleCreateInvitation}
            className="mt-8 rounded-full bg-black px-7 py-4 text-sm font-semibold text-white transition hover:bg-black/85"
          >
            {membershipActive
              ? "+ Шинэ урилга үүсгэх"
              : "Сарын эрхээ идэвхжүүлэх"}
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
              onClick={() =>
                router.push("/dashboard/admin/payments")
              }
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
              <h2 className="text-3xl font-medium">
                Миний урилгууд
              </h2>

              <p className="mt-2 text-sm text-black/45">
                Таны үүсгэсэн урилгууд энд харагдана.
              </p>
            </div>

            {invitations.length > 0 && (
              <button
                onClick={handleCreateInvitation}
                className="hidden rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-black hover:text-white sm:block"
              >
                {membershipActive
                  ? "+ Шинэ урилга"
                  : "Сарын эрх авах"}
              </button>
            )}
          </div>

          {invitationsLoading ? (
            <div className="rounded-[28px] bg-white p-10 text-center shadow-sm">
              <p className="text-sm text-black/40">
                Урилгуудыг уншиж байна...
              </p>
            </div>
          ) : invitations.length > 0 ? (
            <div className="space-y-5">
              {invitations.map((invitation) => {
                const eventLabel =
                  eventNames[invitation.event_type ?? ""] ??
                  "Урилга";

                const title =
                  invitation.title ||
                  invitation.names ||
                  "Шинэ дижитал урилга";

                const isDeleting =
                  deletingId === invitation.id;
                const isLockedDemo = isDemoInvitation(
                  invitation.public_slug
                );

                return (
                  <div
                    key={invitation.id}
                    className="overflow-hidden rounded-[28px] bg-white shadow-sm"
                  >
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#F8F5F0] px-3 py-1.5 text-xs font-medium text-black/60">
                              {eventLabel}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                                invitation.status === "published"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-yellow-50 text-yellow-700"
                              }`}
                            >
                              {invitation.status === "published"
                                ? "Нийтэлсэн"
                                : "Хадгалсан"}
                            </span>
                          </div>

                          <h3 className="mt-5 text-2xl font-semibold">
                            {title}
                          </h3>

                          {invitation.names &&
                            invitation.title !==
                              invitation.names && (
                              <p className="mt-2 text-black/55">
                                {invitation.names}
                              </p>
                            )}

                          <div className="mt-5 grid gap-3 text-sm text-black/55 sm:grid-cols-2">
                            {invitation.event_date && (
                              <div className="rounded-2xl bg-[#F8F5F0] px-4 py-3">
                                <div className="text-xs text-black/35">
                                  Огноо
                                </div>

                                <div className="mt-1 font-medium text-black/70">
                                  {formatDate(
                                    invitation.event_date
                                  )}
                                </div>
                              </div>
                            )}

                            {invitation.event_time && (
                              <div className="rounded-2xl bg-[#F8F5F0] px-4 py-3">
                                <div className="text-xs text-black/35">
                                  Цаг
                                </div>

                                <div className="mt-1 font-medium text-black/70">
                                  {invitation.event_time}
                                </div>
                              </div>
                            )}

                            {invitation.venue && (
                              <div className="rounded-2xl bg-[#F8F5F0] px-4 py-3">
                                <div className="text-xs text-black/35">
                                  Байршил
                                </div>

                                <div className="mt-1 font-medium text-black/70">
                                  {invitation.venue}
                                </div>
                              </div>
                            )}

                            <div className="rounded-2xl bg-[#F8F5F0] px-4 py-3">
                              <div className="text-xs text-black/35">
                                Үүсгэсэн
                              </div>

                              <div className="mt-1 font-medium text-black/70">
                                {formatCreatedDate(
                                  invitation.created_at
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-center text-5xl sm:pl-4">
                          {getEventIcon(
                            invitation.event_type
                          )}
                        </div>
                      </div>

                      <div className="mt-8 flex flex-col gap-3 border-t border-black/5 pt-6 sm:flex-row">
                        <button
                          onClick={() =>
                            handlePreview(invitation)
                          }
                          disabled={isDeleting}
                          className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          👁️ Урилгаа харах
                        </button>

                        <button
                          onClick={() =>
                            handleEdit(invitation)
                          }
                          disabled={isDeleting}
                          className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          ✏️ Засах
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteInvitation(
                              invitation
                            )
                          }
                          disabled={isDeleting || isLockedDemo}
                          className="rounded-full border border-red-200 bg-red-50 px-6 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                          title={
                            isLockedDemo
                              ? "Нүүр хуудсанд ашигладаг жишээ урилга тул устгах боломжгүй."
                              : undefined
                          }
                        >
                          {isLockedDemo
                            ? "🔒 Түгжигдсэн"
                            : isDeleting
                            ? "Устгаж байна..."
                            : "🗑️ Устгах"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-black/10 bg-white p-10 text-center sm:p-14">
              <div className="text-5xl">💌</div>

              <h3 className="mt-5 text-xl font-semibold">
                Одоогоор хадгалсан урилга алга
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/45">
                Анхны дижитал урилгаа үүсгээд хадгалаарай. Таны
                урилга энд автоматаар харагдана.
              </p>

              <button
                onClick={handleCreateInvitation}
                className="mt-7 rounded-full bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-black/85"
              >
                {membershipActive
                  ? "+ Анхны урилгаа үүсгэх"
                  : "Сарын эрх авах"}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}