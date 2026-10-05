import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase server environment variables"
    );
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { slug: rawSlug } =
      await context.params;

    const slug =
      decodeURIComponent(rawSlug).trim();

    if (!slug) {
      return NextResponse.json(
        {
          error: "Slug is required",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();

    const { data, error } =
      await supabase
        .from("invitations")
        .select("id, extras")
        .eq("public_slug", slug)
        .eq("status", "published")
        .maybeSingle();

    if (error) {
      console.error(
        "PUBLIC INVITATION EXTRAS ERROR:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Failed to load invitation extras",
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            "Invitation not found",
        },
        {
          status: 404,
        }
      );
    }

    const rawExtras =
      data.extras &&
      typeof data.extras === "object"
        ? (data.extras as Record<
            string,
            unknown
          >)
        : {};

    const lat =
      typeof rawExtras.lat === "number"
        ? rawExtras.lat
        : null;

    const lng =
      typeof rawExtras.lng === "number"
        ? rawExtras.lng
        : null;

    const mapUrl =
      typeof rawExtras.mapUrl ===
      "string"
        ? rawExtras.mapUrl
        : "";

    return NextResponse.json(
      {
        id: data.id,
        extras: {
          lat,
          lng,
          mapUrl,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error(
      "PUBLIC INVITATION API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}