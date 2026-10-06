"use client";

import { FormEvent, useEffect, useState } from "react";
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

  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBilling() {
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

        const [membershipResult, requestResult] = await Promise.all([
          supabase
            .from("user_memberships")
            .select("expires_at")
            .eq("user_id", user.id)
            .maybeSingle(),

          supabase
            .from("membership_payment_requests")
            .select("id, status, created_at")
            .eq("user_id", user.id)
            .eq("status", "pending")
            .maybeSingle(),
        ]);

        if (membershipResult.error) {
          throw membershipResult.error;
        }

        if (requestResult.error) {
          throw requestResult.error;
        }

        if (!cancelled) {
          setUserId(user.id);
          setMembership(membershipResult.data);
          setPaymentRequest(requestResult.data);
        }
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
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBilling();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function copyAccountNumber() {
    try {
      await navigator.clipboard.writeText(ACCOUNT_NUMBER);

      setCopied(true);
      setMessage("");
      setErrorMessage("");

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("COPY BANK ACCOUNT ERROR:", error);
      setErrorMessage("Дансны дугаар хуулах боломжгүй байна.");
    }
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
      const { data, error } = await supabase
        .from("membership_payment_requests")
        .insert({
          user_id: userId,
          amount: MONTHLY_PRICE,
          payer_name: payerName.trim(),
          payer_phone: payerPhone.trim(),
          payment_reference: paymentReference.trim(),
        })
        .select("id, status, created_at")
        .single();

      if (error) {
        throw error;
      }

      setPaymentRequest(data);

      setMessage(
        "Төлбөрийн хүсэлт амжилттай илгээгдлээ. Мөнгө орсныг шалгасны дараа таны эрхийг идэвхжүүлнэ."
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

  const membershipActive = isMembershipActive(
    membership?.expires_at
  );

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
          {/* HEADER */}
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

          {/* ACTIVE MEMBERSHIP */}
          {membershipActive && membership && (
            <div className="mx-6 mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 sm:mx-9">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                  ✓
                </div>

                <div>
                  <p className="font-semibold text-green-900">
                    Таны сарын эрх идэвхтэй байна
                  </p>

                  <p className="mt-1 text-sm leading-6 text-green-800">
                    {formatDate(membership.expires_at)} хүртэл
                    идэвхтэй.
                  </p>

                  <p className="mt-2 text-xs leading-5 text-green-700/80">
                    Хэрэв эрхээ сунгах гэж байгаа бол төлбөрөө
                    шилжүүлээд доорх хүсэлтийг илгээнэ үү.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PAYMENT METHOD */}
          <div className="px-6 py-7 sm:px-9">
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

            {/* BANK INFO */}
            <div className="rounded-[24px] border border-black/8 bg-[#F8F5F0] p-5 sm:p-6">
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-5">
                  <span className="text-sm text-black/45">
                    Банк
                  </span>

                  <span className="text-right text-sm font-semibold">
                    {BANK_NAME}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-5">
                  <span className="text-sm text-black/45">
                    Дансны нэр
                  </span>

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
                <p className="text-sm font-semibold">
                  Гүйлгээний утга
                </p>

                <p className="mt-1 text-sm leading-6 text-black/50">
                  Өөрийн бүртгэлтэй нэрээ бичнэ үү.
                </p>
              </div>
            </div>

            {/* STEPS */}
            <div className="mt-7">
              <p className="text-sm font-semibold">
                Төлбөр хийх дараалал
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-black/7 p-4">
                  <div className="text-lg font-bold">01</div>
                  <p className="mt-2 text-sm font-medium">
                    Мөнгө шилжүүлэх
                  </p>
                  <p className="mt-1 text-xs leading-5 text-black/45">
                    Дээрх данс руу ₮19,900 шилжүүлнэ.
                  </p>
                </div>

                <div className="rounded-2xl border border-black/7 p-4">
                  <div className="text-lg font-bold">02</div>
                  <p className="mt-2 text-sm font-medium">
                    Хүсэлт илгээх
                  </p>
                  <p className="mt-1 text-xs leading-5 text-black/45">
                    Доорх мэдээллийг бөглөнө.
                  </p>
                </div>

                <div className="rounded-2xl border border-black/7 p-4">
                  <div className="text-lg font-bold">03</div>
                  <p className="mt-2 text-sm font-medium">
                    Эрх идэвхжих
                  </p>
                  <p className="mt-1 text-xs leading-5 text-black/45">
                    Төлбөр шалгасны дараа эрх нээгдэнэ.
                  </p>
                </div>
              </div>
            </div>

            {/* PENDING */}
            {paymentRequest ? (
              <div className="mt-7 rounded-[24px] border border-amber-200 bg-amber-50 p-5 sm:p-6">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    ⏳
                  </div>

                  <div>
                    <p className="font-semibold text-amber-900">
                      Төлбөр баталгаажихыг хүлээж байна
                    </p>

                    <p className="mt-2 text-sm leading-6 text-amber-800">
                      Таны хүсэлт бүртгэгдсэн. Дансанд мөнгө орсныг
                      шалгасны дараа сарын эрхийг идэвхжүүлнэ.
                    </p>

                    <p className="mt-3 text-xs text-amber-700/80">
                      Хүсэлт илгээсэн:{" "}
                      {formatDateTime(paymentRequest.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* PAYMENT REQUEST FORM */
              <form
                onSubmit={submitPaymentRequest}
                className="mt-7"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">
                    Шилжүүлгийн мэдээлэл
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">
                    Төлбөр хийсний дараа хүсэлт илгээнэ үү
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-black/50">
                    Та мөнгө шилжүүлснийхээ дараа доорх мэдээллийг
                    бөглөж илгээнэ.
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
                      onChange={(event) =>
                        setPayerName(event.target.value)
                      }
                      placeholder="Жишээ: Болдбаатар Цэрэнбаатар"
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 outline-none transition placeholder:text-black/25 focus:border-black/40"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="font-medium">
                      Утасны дугаар
                    </span>

                    <input
                      required
                      maxLength={30}
                      type="tel"
                      value={payerPhone}
                      onChange={(event) =>
                        setPayerPhone(event.target.value)
                      }
                      placeholder="Жишээ: 99112233"
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 outline-none transition placeholder:text-black/25 focus:border-black/40"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="font-medium">
                      Гүйлгээний утга
                    </span>

                    <input
                      required
                      maxLength={120}
                      value={paymentReference}
                      onChange={(event) =>
                        setPaymentReference(event.target.value)
                      }
                      placeholder="Жишээ: Болдбаатар Цэрэнбаатар"
                      className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 outline-none transition placeholder:text-black/25 focus:border-black/40"
                    />

                    <span className="mt-2 block text-xs leading-5 text-black/40">
                      Банкны шилжүүлэг дээр бичсэн гүйлгээний утгаа
                      яг адилхан оруулна уу.
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

            {/* MESSAGES */}
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
                className="mt-5 rounded-2xl bg-red-50 p-4 text-sm leading-6 text-red-800"
              >
                {errorMessage}
              </div>
            )}

            {/* FOOTER NOTE */}
            <p className="mt-7 text-center text-xs leading-5 text-black/35">
              Төлбөрийг админ банкны хуулгаар шалгаж баталгаажуулсны
              дараа таны сарын эрх идэвхжинэ.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}