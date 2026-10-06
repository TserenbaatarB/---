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
        .select(
          "id, user_id, extras, background_id, gallery_ids, gallery_urls"
        )
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

    const storagePrefix = `${data.user_id}/${data.id}/`;
    const backgroundPath =
      typeof data.background_id === "string" &&
      data.background_id.startsWith(storagePrefix)
        ? data.background_id
        : null;
    const galleryPaths = Array.isArray(data.gallery_ids)
      ? data.gallery_ids
          .filter(
            (path): path is string =>
              typeof path === "string" &&
              path.startsWith(storagePrefix)
          )
          .slice(0, 30)
      : [];
    const allImagePaths = [
      ...(backgroundPath ? [backgroundPath] : []),
      ...galleryPaths,
    ];

    const signedUrlByPath = new Map<string, string>();
    if (allImagePaths.length > 0) {
      const { data: signedImages, error: signedImagesError } =
        await supabase.storage
          .from("invitation-images")
          .createSignedUrls(allImagePaths, 60 * 60 * 24);

      if (signedImagesError) {
        console.error(
          "PUBLIC INVITATION IMAGE URL ERROR:",
          signedImagesError
        );

        return NextResponse.json(
          { error: "Failed to load invitation images" },
          { status: 500 }
        );
      }

      for (const item of signedImages ?? []) {
        if (item.error) {
          console.error(
            "PUBLIC INVITATION IMAGE SIGN ERROR:",
            item.path,
            item.error
          );

          return NextResponse.json(
            { error: "Failed to load invitation images" },
            { status: 500 }
          );
        }

        if (typeof item.path === "string" && item.signedUrl) {
          signedUrlByPath.set(item.path, item.signedUrl);
        }
      }

      if (allImagePaths.some((path) => !signedUrlByPath.has(path))) {
        console.error(
          "PUBLIC INVITATION IMAGE SIGN ERROR: Missing signed image URL"
        );

        return NextResponse.json(
          { error: "Failed to load invitation images" },
          { status: 500 }
        );
      }
    }

    const legacyGalleryUrls = Array.isArray(data.gallery_urls)
      ? data.gallery_urls.filter(
          (url): url is string =>
            typeof url === "string" &&
            (url.startsWith("https://") || url.startsWith("http://"))
        )
      : [];

    return NextResponse.json(
      {
        id: data.id,
        extras: {
          lat,
          lng,
          mapUrl,
        },
        backgroundUrl: backgroundPath
          ? signedUrlByPath.get(backgroundPath) ?? null
          : null,
        galleryUrls:
          galleryPaths.length > 0
            ? galleryPaths
                .map((path) => signedUrlByPath.get(path))
                .filter((url): url is string => Boolean(url))
            : legacyGalleryUrls,
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