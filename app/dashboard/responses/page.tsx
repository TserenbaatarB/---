"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Invitation = {
  id: string;
  title: string | null;
  names: string | null;
  extras: { rsvpEnabled?: boolean } | null;
};

type Rsvp = {
  id: string;
  invitation_id: string;
  name: string;
  phone: string | null;
  status: "yes" | "no";
  guests: number;
  message: string | null;
  created_at: string;
};

export default function ResponsesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: invs, error: invError } = await supabase
        .from("invitations")
        .select("id, title, names, extras")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (invError) {
        setError("Урилгуудыг уншиж чадсангүй.");
        setLoading(false);
        return;
      }

      const list = (invs ?? []) as Invitation[];
      setInvitations(list);

      if (list.length > 0) {
        const { data: rows, error: rsvpError } = await supabase
          .from("invitation_rsvps")
          .select("*")
          .in(
            "invitation_id",
            list.map((item) => item.id)
          )
          .order("created_at", { ascending: false });

        if (rsvpError) {
          setError("Хариунуудыг уншиж чадсангүй.");
        } else {
          setRsvps((rows ?? []) as Rsvp[]);
        }
      }

      setLoading(false);
    }

    load();
  }, [router]);

  async function remove(id: string) {
    if (!confirm("Энэ хариуг устгах уу?")) return;

    const { error: deleteError } = await supabase
      .from("invitation_rsvps")
      .delete()
      .eq("id", id);

    if (!deleteError) {
      setRsvps((current) => current.filter((item) => item.id !== id));
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
      <section className="mx-auto max-w-4xl px-6 py-12">
        <Link
          href="/dashboard"
          className="text-sm text-black/50 hover:text-black"
        >
          ← Буцах
        </Link>

        <h1 className="mt-4 text-3xl font-medium">Зочдын хариу</h1>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {invitations.length === 0 && !error && (
          <p className="mt-6 text-sm text-black/50">
            Одоогоор нийтлэгдсэн урилга алга.
          </p>
        )}

        <div className="mt-8 space-y-8">
          {invitations.map((invitation) => {
            const items = rsvps.filter(
              (item) => item.invitation_id === invitation.id
            );
            const yes = items.filter((item) => item.status === "yes");
            const total = yes.reduce((sum, item) => sum + 1 + item.guests, 0);

            return (
              <div
                key={invitation.id}
                className="rounded-[28px] bg-white p-6 shadow-sm"
              >
                <h2 className="text-xl font-semibold">
                  {invitation.title || invitation.names || "Урилга"}
                </h2>

                {!invitation.extras?.rsvpEnabled && (
                  <p className="mt-1 text-xs text-black/40">
                    Хариу авах тохиргоо идэвхгүй.
                  </p>
                )}

                <p className="mt-2 text-sm text-black/55">
                  Очно: {yes.length} · Боломжгүй: {items.length - yes.length} ·
                  Нийт ирэх: {total}
                </p>

                {items.length > 0 && (
                  <ul className="mt-4 divide-y divide-black/5">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-4 py-3 text-sm"
                      >
                        <div>
                          <div className="font-medium">
                            {item.name}
                            {item.guests > 0 ? ` +${item.guests}` : ""}
                            <span
                              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                                item.status === "yes"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {item.status === "yes" ? "Очно" : "Боломжгүй"}
                            </span>
                          </div>

                          {item.phone && (
                            <div className="text-xs text-black/45">
                              {item.phone}
                            </div>
                          )}

                          {item.message && (
                            <div className="mt-1 text-black/60">
                              {item.message}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => remove(item.id)}
                          className="shrink-0 text-xs text-black/35 hover:text-red-600"
                        >
                          Устгах
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
