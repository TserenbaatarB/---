"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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

type PaymentStatus = "pending" | "approved" | "rejected";

type PaymentRequest = {
  id: string;
  status: PaymentStatus;
  created_at: string;
  rejection_reason: string | null;
};

type StatusSnapshot = {
  id: string;
  status: PaymentStatus;
};

type StatusNotice =
  | { type: "pending" }
  | { type: "rejected"; reason: string }
  | null;

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

  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Зөвхөн одоогийн хуудасны session-д хадгалагдана.
  // Refresh хийхэд null утгаараа дахин эхэлнэ.
  const [statusNotice, setStatusNotice] = useState<StatusNotice>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Өмнөх төлөвийг санаж, хуудас нээлттэй үед гарсан өөрчлөлтийг илрүүлнэ.
  // Энэ ref нь refresh хийхэд дахин эхэлдэг.
  const previousRequestRef = useRef<StatusSnapshot | null>(null);
  const initialSnapshotLoadedRef = useRef(false);

  const refreshBilling = useCallback(
    async (currentUserId: string, detectChanges = true) => {
      const [membershipResult, requestResult] = await Promise.all([
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
      ]);

      if (membershipResult.error) throw membershipResult.error;
      if (requestResult.error) throw requestResult.error;

      const nextRequest = requestResult.data as PaymentRequest | null;
      const previousRequest = previousRequestRef.current;

      // Эхний ачаалал дээр DB-д байсан төлөвийг baseline болгоно.
      // Ингэснээр refresh-ийн дараа хуучин мэдэгдэл дахин гарахгүй.
      if (!initialSnapshotLoadedRef.current) {
        initialSnapshotLoadedRef.current = true;
      } else if (detectChanges && nextRequest) {
        // Админ өмнөх pending хүсэлтийг буцаасан.
        if (
          previousRequest &&
          previousRequest.id === nextRequest.id &&
          previousRequest.status === "pending" &&
          nextRequest.status === "rejected"
        ) {
          setStatusNotice({
            type: "rejected",
            reason:
              nextRequest.rejection_reason?.trim() ||
              "Төлбөр баталгаажаагүй байна. Гүйлгээний мэдээллээ шалгана уу.",
          });
        }

        // Админ баталсан бол түр мэдэгдлийг арилгаж,
        // гишүүнчлэлийн бодит төлөвийг харуулна.
        if (
          previousRequest &&
          previousRequest.id === nextRequest.id &&
          previousRequest.status === "pending" &&
          nextRequest.status === "approved"
        ) {
          setStatusNotice(null);
        }
      }

      previousRequestRef.current = nextRequest
        ? {
            id: nextRequest.id,
            status: nextRequest.status,
          }
        : null;

      setMembership(membershipResult.data);
      setPaymentRequest(nextRequest);
    },
    []
  );

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

        // Эхний ачаалал дээр хуучин төлөвийг мэдэгдэл болгон харуулахгүй.
        await refreshBilling(user.id, false);

        if (cancelled) return;

        // Хуудас нээлттэй байх хугацаанд админы шийдвэрийг шалгана.
        intervalId = setInterval(() => {
          void refreshBilling(user.id, true).catch((error: unknown) => {
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
      setErrorMessage("");

      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("COPY BANK ACCOUNT ERROR:", error);
      setErrorMessage("Дансны дугаар хуулах боломжгүй байна.");
    }
  }

  async function submitPaymentRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId || submitting) return;

    setSubmitting(true);
    setErrorMessage("");
    setStatusNotice(null);

    try {
      // Давхар pending хүсэлт үүсгэхээс сэргийлнэ.
      // Өмнөх хүсэлт pending хэвээр бол админ шийдвэрээ гаргах ёстой.
      const { data: existingPending, error: pendingCheckError } =
        await supabase
          .from("membership_payment_requests")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "pending")
          .limit(1)
          .maybeSingle();

      if (pendingCheckError) throw pendingCheckError;

      if (existingPending) {
        setStatusNotice({ type: "pending" });
        return;
      }

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

      // Шинэ хүсэлтийн төлөвийг baseline болгож, мэдэгдлийг гараар гаргана.
      await refreshBilling(userId, false);

      setPayerName("");
      setPayerPhone("");
      setPaymentReference("");

      setStatusNotice({ type: "pending" });
    } catch (error) {
      console.error("MEMBERSHIP PAYMENT REQUEST ERROR:", error);

      const message =
        error instanceof Error ? error.message : "";

      if (
        message.toLowerCase().includes("duplicate") ||
        message.toLowerCase().includes("unique")
      ) {
        setErrorMessage(
          "Танд шалгагдаж буй төлбөрийн хүсэлт байна. Админы шийдвэрийг хүлээнэ үү."
        );
      } else {
        setErrorMessage(
          message || "Хүсэлт илгээх үед алдаа гарлаа. Дахин оролдоно уу."
        );
      }

      // Алдаа гарсан үед DB-ийн хамгийн сүүлийн төлөвийг дахин шалгана.
      try {
        await refreshBilling(userId, false);
      } catch (refreshError) {
        console.error("BILLING RECOVERY ERROR:", refreshError);
      }
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

            {/* Нэг л түр мэдэгдэл харуулна. */}
            {statusNotice?.type === "pending" && (
              <div
                role="status"
                className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"
              >
                <p className="font-semibold text-amber-900">
                  ⏳ Төлбөр шалгаж байна
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  Таны хүсэлт бүртгэгдсэн. Админ банкны орлогыг шалгасны
                  дараа шийдвэр гаргана.
                </p>
              </div>
            )}

            {statusNotice?.type === "rejected" && (
              <div
                role="alert"
                className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5"
              >
                <p className="font-semibold text-red-900">
                  Төлбөр буцаасан
                </p>
                <p className="mt-2 text-sm leading-6 text-red-800">
                  {statusNotice.reason}
                </p>
                <p className="mt-3 text-xs leading-5 text-red-700/80">
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
                Доорх данс руу яг ₮{MONTHLY_PRICE.toLocaleString("mn-MN")} шилжүүлнэ үү.
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
              <p className="text-sm font-semibold">Төлбөр хийх дараалал</p>

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

            {/* Refresh хийсэн ч төлбөрийн хэсэг болон форм харагдана.
                Харин DB-д pending хүсэлт байвал давхар хүсэлт үүсгэхгүй. */}
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
                    onChange={(event) => setPaymentReference(event.target.value)}
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