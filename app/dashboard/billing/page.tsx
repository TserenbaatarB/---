
"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const MONTHLY_PRICE = 19_900;
const MEMBERSHIP_DAYS = 30;

const BANK_NAME = "Хаан банк";
const ACCOUNT_NAME = "Болдбаатар Цэрэнбаатар";
const ACCOUNT_NUMBER = "MN050005005031742123";

type Membership = {
  expires_at: string;
};

type PaymentRequest = {
  id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  rejection_reason: string | null;
};

type MembershipNotification = {
  id: string;
  type:
    | "payment_pending"
    | "payment_approved"
    | "payment_rejected"
    | "payment_cancelled";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function isMembershipActive(expiresAt: string | null | undefined) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() > Date.now());
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BillingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [membership, setMembership] = useState<Membership | null>(null);
  const [paymentRequest, setPaymentRequest] =
    useState<PaymentRequest | null>(null);
  const [notifications, setNotifications] = useState<
    MembershipNotification[]
  >([]);

  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const refreshBilling = useCallback(async (currentUserId: string) => {
    const [membershipResult, requestResult, notificationResult] =
      await Promise.all([
        supabase
          .from("user_memberships")
          .select("expires_at")
          .eq("user_id", currentUserId)
          .maybeSingle(),

        supabase
          .from("membership_payment_requests")
          .select("id, status, created_at, rejection_reason")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from("membership_notifications")
          .select("id, type, title, message, is_read, created_at")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    if (membershipResult.error) throw membershipResult.error;
    if (requestResult.error) throw requestResult.error;
    if (notificationResult.error) throw notificationResult.error;

    setMembership(membershipResult.data);
    setPaymentRequest(requestResult.data as PaymentRequest | null);
    setNotifications(
      (notificationResult.data ?? []) as MembershipNotification[]
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function initialize() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          router.replace("/login?redirect=/dashboard/billing");
          return;
        }

        if (cancelled) return;

        setUserId(user.id);
        await refreshBilling(user.id);

        if (cancelled) return;

        // Шийдвэр гарсан эсэхийг хуудас нээлттэй үед автоматаар шалгана.
        intervalId = setInterval(() => {
          void refreshBilling(user.id).catch((error: unknown) => {
            console.error("BILLING REFRESH ERROR:", error);
          });
        }, 5000);
      } catch (error) {
        console.error("BILLING LOAD ERROR:", error);

        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Төлбөрийн мэдээлэл ачаалж чадсангүй."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialize();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshBilling, router]);

  async function copyAccountNumber() {
    try {
      await navigator.clipboard.writeText(ACCOUNT_NUMBER);

      setCopied(true);
      setMessage("");
      setErrorMessage("");

      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("COPY BANK ACCOUNT ERROR:", error);
      setErrorMessage("Дансны дугаар хуулах боломжгүй байна.");
    }
  }

  async function markNotificationRead(notificationId: string) {
    const { error } = await supabase
      .from("membership_notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("MARK NOTIFICATION READ ERROR:", error);
      setErrorMessage("Мэдэгдлийг уншсан гэж тэмдэглэж чадсангүй.");
      return;
    }

    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      )
    );
  }

  async function submitPaymentRequest(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!userId || submitting) return;

    setSubmitting(true);
    setMessage("");
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("membership_payment_requests")
        .insert({
          user_id: userId,
          amount: MONTHLY_PRICE,
          payer_name: payerName.trim(),
          payer_phone: payerPhone.trim(),
          payment_reference: paymentReference.trim(),
        });

      if (error) throw error;

      await refreshBilling(userId);

      setPayerName("");
      setPayerPhone("");
      setPaymentReference("");

      setMessage(
        "Төлбөрийн хүсэлт амжилттай илгээгдлээ. Банкны дансны орлогыг шалгасны дараа сарын эрхийн төлөв шинэчлэгдэнэ."
      );
    } catch (error) {
      console.error("MEMBERSHIP PAYMENT REQUEST ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Хүсэлт илгээх үед алдаа гарлаа."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F5F0]">
        <p className="text-sm text-black/45">
          Төлбөрийн мэдээлэл ачаалж байна...
        </p>
      </main>
    );
  }

  const membershipActive = isMembershipActive(membership?.expires_at);
  const pendingRequest = paymentRequest?.status === "pending";
  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <main className="min-h-screen bg-[#F8F5F0] px-5 py-8 text-[#171717] sm:px-8 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-6 text-sm text-black/50 transition hover:text-black"
        >
          ← Хянах самбар
        </button>

        <section className="overflow-hidden rounded-[30px] bg-white shadow-sm">
          <div className="border-b border-black/5 px-6 py-7 sm:px-9 sm:py-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/35">
              ЦАХИМ УРИЛГА · САРЫН ЭРХ
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Сарын эрх авах
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-black/55">
              Сарын эрхээр урилгаа үүсгэж, засварлаж, нийтлэх боломжтой.
              Эрх нь төлбөр баталгаажсанаас хойш {MEMBERSHIP_DAYS} хоног
              хүчинтэй.
            </p>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#F8F5F0] px-5 py-4">
              <div>
                <p className="text-xs text-black/45">
                  {MEMBERSHIP_DAYS} хоногийн эрх
                </p>
                <p className="mt-1 text-2xl font-bold">
                  ₮{MONTHLY_PRICE.toLocaleString("mn-MN")}
                </p>
              </div>

              <div className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
                30 хоног
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="px-6 pt-7 sm:px-9">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Төлбөрийн мэдэгдэл</h2>
                <p className="mt-1 text-xs text-black/45">
                  Админы шийдвэр болон төлбөрийн төлөв
                </p>
              </div>

              {unreadCount > 0 && (
                <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                  {unreadCount} уншаагүй
                </span>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-[#F8F5F0] p-4 text-sm text-black/50">
                Одоогоор мэдэгдэл алга.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {notifications.map((notification) => {
                  const isApproved =
                    notification.type === "payment_approved";
                  const isRejected =
                    notification.type === "payment_rejected";
                  const isCancelled =
                    notification.type === "payment_cancelled";

                  const tone = isApproved
                    ? "border-green-200 bg-green-50 text-green-900"
                    : isRejected || isCancelled
                      ? "border-red-200 bg-red-50 text-red-900"
                      : "border-amber-200 bg-amber-50 text-amber-900";

                  return (
                    <article
                      key={notification.id}
                      className={`rounded-2xl border p-4 ${tone} ${
                        !notification.is_read ? "ring-1 ring-black/5" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">
                            {notification.title}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                            {notification.message}
                          </p>
                          <p className="mt-3 text-xs opacity-70">
                            {formatDateTime(notification.created_at)}
                          </p>
                        </div>

                        {!notification.is_read && (
                          <button
                            type="button"
                            onClick={() =>
                              void markNotificationRead(notification.id)
                            }
                            className="shrink-0 rounded-full border border-current/20 px-3 py-2 text-xs font-medium"
                          >
                            Уншсан
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-6 py-7 sm:px-9">
            {membershipActive && membership && (
              <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">
                <p className="font-semibold text-green-900">
                  ✓ Таны сарын эрх идэвхтэй байна
                </p>
                <p className="mt-2 text-sm leading-6 text-green-800">
                  {formatDate(membership.expires_at)} хүртэл идэвхтэй.
                </p>
              </div>
            )}

            {pendingRequest && paymentRequest && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-semibold text-amber-900">
                  ⏳ Төлбөр баталгаажихыг хүлээж байна
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  Таны хүсэлт бүртгэгдсэн. Банкны дансанд мөнгө орсныг
                  админ шалгасны дараа шийдвэр гаргана.
                </p>
                <p className="mt-3 text-xs text-amber-700/80">
                  Хүсэлт илгээсэн:{" "}
                  {formatDateTime(paymentRequest.created_at)}
                </p>
              </div>
            )}

            {paymentRequest?.status === "rejected" && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="font-semibold text-red-900">
                  Төлбөр баталгаажаагүй
                </p>
                <p className="mt-2 text-sm leading-6 text-red-800">
                  {paymentRequest.rejection_reason ||
                    notifications.find(
                      (item) =>
                        item.type === "payment_rejected"
                    )?.message ||
                    "Төлбөр баталгаажаагүй байна. Гүйлгээний мэдээллээ шалгана уу."}
                </p>
                <p className="mt-3 text-xs text-red-700/80">
                  Та мэдээллээ шалгаад дахин төлбөрийн хүсэлт илгээж болно.
                </p>
              </div>
            )}

            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">
                Төлбөрийн арга
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Банкны шилжүүлэг
              </h2>
              <p className="mt-2 text-sm leading-6 text-black/50">
                Доорх данс руу яг ₮
                {MONTHLY_PRICE.toLocaleString("mn-MN")} шилжүүлнэ үү.
              </p>
            </div>

            <div className="rounded-[24px] border border-black/8 bg-[#F8F5F0] p-5 sm:p-6">
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-5">
                  <span className="text-sm text-black/45">Банк</span>
                  <span className="text-right text-sm font-semibold">
                    {BANK_NAME}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-5">
                  <span className="text-sm text-black/45">Дансны нэр</span>
                  <span className="text-right text-sm font-semibold">
                    {ACCOUNT_NAME}
                  </span>
                </div>

                <div className="border-t border-black/8 pt-5">
                  <span className="text-sm text-black/45">
                    Дансны дугаар
                  </span>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="break-all text-base font-bold tracking-wide">
                      {ACCOUNT_NUMBER}
                    </span>
                    <button
                      type="button"
                      onClick={copyAccountNumber}
                      className="shrink-0 rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold transition hover:bg-black hover:text-white"
                    >
                      {copied ? "✓ Хуулсан" : "Данс хуулах"}
                    </button>
                  </div>
                </div>

                <div className="border-t border-black/8 pt-5">
                  <div className="flex items-center justify-between gap-5">
                    <span className="text-sm text-black/45">
                      Шилжүүлэх дүн
                    </span>
                    <span className="text-xl font-bold">
                      ₮{MONTHLY_PRICE.toLocaleString("mn-MN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-white p-4">
                <p className="text-sm font-semibold">Гүйлгээний утга</p>
                <p className="mt-1 text-sm leading-6 text-black/50">
                  Өөрийн бүртгэлтэй нэрээ бичнэ үү.
                </p>
              </div>
            </div>

            <div className="mt-7">
              <p className="text-sm font-semibold">
                Төлбөр хийх дараалал
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-black/7 p-4">
                  <div className="text-lg font-bold">01</div>
                  <p className="mt-2 text-sm font-medium">Мөнгө шилжүүлэх</p>
                  <p className="mt-1 text-xs leading-5 text-black/45">
                    Дээрх данс руу ₮19,900 шилжүүлнэ.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/7 p-4">
                  <div className="text-lg font-bold">02</div>
                  <p className="mt-2 text-sm font-medium">Хүсэлт илгээх</p>
                  <p className="mt-1 text-xs leading-5 text-black/45">
                    Доорх мэдээллийг бөглөнө.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/7 p-4">
                  <div className="text-lg font-bold">03</div>
                  <p className="mt-2 text-sm font-medium">Эрх идэвхжих</p>
                  <p className="mt-1 text-xs leading-5 text-black/45">
                    Админ төлбөрийг баталгаажуулсны дараа эрх нээгдэнэ.
                  </p>
                </div>
              </div>
            </div>

            {!pendingRequest && (
              <form onSubmit={submitPaymentRequest} className="mt-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">
                    Шилжүүлгийн мэдээлэл
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    Төлбөр хийсний дараа хүсэлт илгээнэ үү
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-black/50">
                    Мөнгө шилжүүлснийхээ дараа доорх мэдээллийг бөглөнө.
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  <label className="block text-sm">
                    <span className="font-medium">
                      Шилжүүлэг хийсэн хүний нэр
                    </span>
                    <input
                      required
                      maxLength={120}
                      value={payerName}
                      onChange={(event) => setPayerName(event.target.value)}
                      placeholder="Жишээ: Болдбаатар Цэрэнбаатар"
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 outline-none transition placeholder:text-black/25 focus:border-black/40"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="font-medium">Утасны дугаар</span>
                    <input
                      required
                      maxLength={30}
                      type="tel"
                      value={payerPhone}
                      onChange={(event) => setPayerPhone(event.target.value)}
                      placeholder="Жишээ: 99112233"
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 outline-none transition placeholder:text-black/25 focus:border-black/40"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="font-medium">Гүйлгээний утга</span>
                    <input
                      required
                      maxLength={120}
                      value={paymentReference}
                      onChange={(event) =>
                        setPaymentReference(event.target.value)
                      }
                      placeholder="Банканд бичсэн гүйлгээний утга"
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 outline-none transition placeholder:text-black/25 focus:border-black/40"
                    />
                    <span className="mt-2 block text-xs leading-5 text-black/40">
                      Банкны шилжүүлэг дээр бичсэн утгаа яг адилхан оруулна уу.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 w-full rounded-full bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Хүсэлт илгээж байна..."
                    : "Төлбөрийн хүсэлт илгээх"}
                </button>
              </form>
            )}

            {message && (
              <div
                role="status"
                className="mt-5 rounded-2xl bg-green-50 p-4 text-sm leading-6 text-green-800"
              >
                ✓ {message}
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="mt-5 break-words rounded-2xl bg-red-50 p-4 text-sm leading-6 text-red-800"
              >
                {errorMessage}
              </div>
            )}

            <p className="mt-7 text-center text-xs leading-5 text-black/35">
              Төлбөрийг админ банкны хуулгаар шалгаж баталгаажуулсны дараа
              сарын эрх идэвхжинэ.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}