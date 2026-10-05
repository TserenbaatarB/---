"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          router.push("/dashboard");
          router.refresh();
          return;
        }

        setMessage(
          "Бүртгэл амжилттай. Имэйлээ шалгаад бүртгэлээ баталгаажуулна уу."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Алдаа гарлаа. Дахин оролдоно уу.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="u-grain min-h-screen bg-[#F8F5F0] px-6 py-12 text-[#171717]">
      <div className="mx-auto flex min-h-[85vh] max-w-md items-center justify-center">
        <div className="w-full">
          {/* BRAND */}
          <div className="mb-10 text-center">
            <div className="text-[10px] font-semibold tracking-[0.3em] text-black/40">
              JZT GROUP
            </div>

            <div className="mt-1 text-4xl font-semibold tracking-[0.12em]">
              URILGA
            </div>

            <p className="mt-3 text-sm text-black/45">
              {isSignUp
                ? "Өөрийн дижитал урилгаа бүтээгээрэй."
                : "Урилгаа үргэлжлүүлэн бүтээнэ үү."}
            </p>
          </div>

          {/* CARD */}
          <div className="rounded-[28px] border border-black/10 bg-white p-7 shadow-xl shadow-black/5 sm:p-8">
            <h1 className="text-4xl font-medium">
              {isSignUp ? "Бүртгэл үүсгэх" : "Нэвтрэх"}
            </h1>

            <p className="mt-2 text-sm text-black/45">
              {isSignUp
                ? "Шинэ URILGA аккаунт үүсгэнэ үү."
                : "Өөрийн аккаунтаар нэвтэрнэ үү."}
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              {/* EMAIL */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Имэйл
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-2xl border border-black/10 bg-[#F8F5F0] px-4 py-3.5 text-sm outline-none transition placeholder:text-black/25 focus:border-black/30 focus:bg-white"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Нууц үг
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={
                    isSignUp ? "new-password" : "current-password"
                  }
                  className="w-full rounded-2xl border border-black/10 bg-[#F8F5F0] px-4 py-3.5 text-sm outline-none transition placeholder:text-black/25 focus:border-black/30 focus:bg-white"
                />
              </div>

              {/* ERROR */}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                  {error}
                </div>
              )}

              {/* SUCCESS */}
              {message && (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-5 text-green-700">
                  {message}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Түр хүлээнэ үү..."
                  : isSignUp
                    ? "Бүртгэл үүсгэх"
                    : "Нэвтрэх"}
              </button>
            </form>

            {/* SWITCH */}
            <div className="mt-7 border-t border-black/10 pt-6 text-center">
              <p className="text-sm text-black/45">
                {isSignUp
                  ? "Аль хэдийн аккаунттай юу?"
                  : "Аккаунт байхгүй юу?"}
              </p>

              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                  setMessage("");
                }}
                className="mt-2 text-sm font-semibold underline underline-offset-4"
              >
                {isSignUp ? "Нэвтрэх" : "Бүртгэл үүсгэх"}
              </button>
            </div>
          </div>

          {/* BACK */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-sm text-black/40 transition hover:text-black"
            >
              ← Нүүр хуудас руу буцах
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}