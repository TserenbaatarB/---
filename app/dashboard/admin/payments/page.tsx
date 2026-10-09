
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "tsb.0318@gmail.com";

type MembershipPayment = {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  payer_name: string;
  payer_phone: string;
  payment_reference: string;
  created_at: string;
};

export default function AdminPaymentsPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [payments, setPayments] = useState<MembershipPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [rejectingId, setRejectingId] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState<
    Record<string, string>
  >({});
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");

  const loadPayments = useCallback(async () => {
    setErrorMessage("");

    const { data, error } = await supabase.rpc(
      "admin_list_membership_payments"
    );

    if (error) throw error;

    setPayments((data ?? []) as MembershipPayment[]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (!user) {
          router.replace("/login");
          return;
        }

        if (!cancelled) {
          setEmail(user.email ?? "");
        }

        await loadPayments();
      } catch (error) {
        console.error("ADMIN MEMBERSHIP PAYMENTS LOAD ERROR:", error);

        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Төлбөрийн хүсэлтүүдийг ачаалж чадсангүй."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [loadPayments, router]);

  async function reviewPayment(
    paymentId: string,
    decision: "approved" | "rejected"
  ) {
    if (updatingId) return;

    const reason = (rejectionReasons[paymentId] ?? "").trim();

    if (decision === "rejected" && !reason) {
      setErrorMessage("Хүсэлтийг буцаах шалтгаанаа бичнэ үү.");
      return;
    }

    const confirmed =
      decision === "approved"
        ? window.confirm(
            "Банкны дансанд мөнгө бодитоор орсныг шалгасан уу? Төлбөрийг баталгаажуулах уу?"
          )
        : window.confirm(
            "Энэ төлбөрийн хүсэлтийг бичсэн шалтгаанаар буцаах уу?"
          );

    if (!confirmed) return;

    setUpdatingId(paymentId);
    setErrorMessage("");
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "admin_review_membership_payment",
        {
          p_request_id: paymentId,
          p_decision: decision,
          p_rejection_reason:
            decision === "rejected" ? reason : null,
        }
      );

      if (error) throw error;

      setMessage(
        decision === "approved"
          ? "Төлбөр баталгаажлаа. Хэрэглэгчийн сарын эрх сунгагдаж, мэдэгдэл үүслээ."
          : "Хүсэлтийг буцааж, шалтгаантай мэдэгдлийг хэрэглэгчид илгээлээ."
      );

      setRejectingId("");
      setRejectionReasons((previous) => {
        const next = { ...previous };
        delete next[paymentId];
        return next;
      });

      await loadPayments();
    } catch (error) {
      console.error("ADMIN MEMBERSHIP PAYMENT REVIEW ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Хүсэлтийг шинэчлэхэд алдаа гарлаа."
      );
    } finally {
      setUpdatingId("");
    }
  }

  async function refreshPayments() {
    try {
      await loadPayments();
      setMessage("Төлбөрийн хүсэлтүүд шинэчлэгдлээ.");
    } catch (error) {
      console.error("ADMIN PAYMENT REFRESH ERROR:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Хүсэлтүүдийг шинэчилж чадсангүй."
      );
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F5F0]">
        <p className="text-sm text-black/45">
          Хүсэлтүүд ачаалж байна...
        </p>
      </main>
    );
  }

  if (email.toLowerCase() !== ADMIN_EMAIL) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F5F0] p-6">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Хандах эрхгүй</h1>
          <p className="mt-2 text-sm text-black/50">
            Энэ хэсэг зөвхөн админд нээлттэй.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-5 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
          >
            Хянах самбар руу буцах
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F5F0] px-5 py-10 text-[#171717] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-6 text-sm text-black/50 hover:text-black"
        >
          ← Хянах самбар
        </button>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/35">
              ADMIN
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Сарын эрхийн шилжүүлгүүд
            </h1>
            <p className="mt-2 text-sm text-black/50">
              Банкны дансанд мөнгө орсныг шалгасны дараа төлбөрийг баталгаажуулна.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refreshPayments()}
            disabled={Boolean(updatingId)}
            className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            Шинэчлэх
          </button>
        </div>

        {message && (
          <p
            role="status"
            className="mt-5 rounded-2xl bg-green-50 p-4 text-sm text-green-800"
          >
            {message}
          </p>
        )}

        {errorMessage && (
          <p
            role="alert"
            className="mt-5 whitespace-pre-wrap rounded-2xl bg-red-50 p-4 text-sm text-red-800"
          >
            {errorMessage}
          </p>
        )}

        <div className="mt-7 space-y-4">
          {payments.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center text-sm text-black/45">
              Баталгаажуулах хүлээгдэж буй хүсэлт алга.
            </div>
          ) : (
            payments.map((payment) => (
              <article
                key={payment.id}
                className="rounded-3xl bg-white p-6 shadow-sm sm:p-7"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {payment.user_email}
                    </h2>
                    <p className="mt-1 text-xs text-black/40">
                      Хүсэлт:{" "}
                      {new Date(payment.created_at).toLocaleString("mn-MN")}
                    </p>
                  </div>

                  <p className="text-lg font-bold">
                    ₮{payment.amount.toLocaleString("mn-MN")}
                  </p>
                </div>

                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-black/40">
                      Шилжүүлсэн хүний нэр
                    </dt>
                    <dd className="mt-1 font-medium">
                      {payment.payer_name}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs text-black/40">Утас</dt>
                    <dd className="mt-1 font-medium">
                      {payment.payer_phone}
                    </dd>
                  </div>

                  <div className="sm:col-span-2">
                    <dt className="text-xs text-black/40">
                      Гүйлгээний утга
                    </dt>
                    <dd className="mt-1 break-words font-medium">
                      {payment.payment_reference}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      void reviewPayment(payment.id, "approved")
                    }
                    disabled={Boolean(updatingId)}
                    className="rounded-full bg-green-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {updatingId === payment.id
                      ? "Боловсруулж байна..."
                      : "Мөнгө орсныг батлах"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      setRejectingId((current) =>
                        current === payment.id ? "" : payment.id
                      );
                    }}
                    disabled={Boolean(updatingId)}
                    className="rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 disabled:opacity-50"
                  >
                    Хүсэлтийг буцаах
                  </button>
                </div>

                {rejectingId === payment.id && (
                  <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/60 p-4">
                    <label
                      htmlFor={`reason-${payment.id}`}
                      className="block text-sm font-semibold text-red-900"
                    >
                      Буцаах шалтгаан
                    </label>

                    <p className="mt-1 text-xs leading-5 text-red-800/80">
                      Банкны дансанд мөнгө орж ирээгүй бол гүйлгээний
                      мэдээллээ шалгахыг хэрэглэгчид мэдэгдээрэй.
                    </p>

                    <textarea
                      id={`reason-${payment.id}`}
                      value={rejectionReasons[payment.id] ?? ""}
                      onChange={(event) =>
                        setRejectionReasons((previous) => ({
                          ...previous,
                          [payment.id]: event.target.value,
                        }))
                      }
                      maxLength={1000}
                      rows={3}
                      placeholder="Жишээ: Банкны дансанд төлбөр орж ирээгүй байна. Гүйлгээний мэдээллээ шалгана уу."
                      className="mt-3 w-full rounded-xl border border-red-200 bg-white p-3 text-sm outline-none focus:border-red-400"
                    />

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void reviewPayment(payment.id, "rejected")
                        }
                        disabled={
                          Boolean(updatingId) ||
                          !(rejectionReasons[payment.id] ?? "").trim()
                        }
                        className="rounded-full bg-red-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {updatingId === payment.id
                          ? "Боловсруулж байна..."
                          : "Шалтгаантай буцаах"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setRejectingId("")}
                        disabled={Boolean(updatingId)}
                        className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium disabled:opacity-50"
                      >
                        Болих
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}