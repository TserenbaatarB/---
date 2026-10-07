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

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function isHttpUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value.startsWith("https://") ||
      value.startsWith("http://"))
  );
}

function normalizeStoragePath(
  value: unknown,
  storagePrefix: string
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const valueTrimmed = value.trim();

  if (!valueTrimmed) {
    return null;
  }

  if (valueTrimmed.startsWith(storagePrefix)) {
    return valueTrimmed;
  }

  const withoutLeadingSlash =
    valueTrimmed.replace(/^\/+/, "");

  if (withoutLeadingSlash.startsWith(storagePrefix)) {
    return withoutLeadingSlash;
  }

  if (
    !withoutLeadingSlash.includes("/") &&
    withoutLeadingSlash.length > 0
  ) {
    return `${storagePrefix}${withoutLeadingSlash}`;
  }

  return null;
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { slug: rawSlug } = await context.params;

    const slug = decodeURIComponent(rawSlug).trim();

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

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("invitations")
      .select(
        `
          id,
          user_id,
          extras,
          background_id,
          gallery_ids,
          gallery_urls
        `
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
          error: "Invitation not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -----------------------------------------
     * EXTRA / MAP DATA
     * -----------------------------------------
     */

    const rawExtras =
      data.extras &&
      typeof data.extras === "object"
        ? (data.extras as Record<string, unknown>)
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
      typeof rawExtras.mapUrl === "string"
        ? rawExtras.mapUrl
        : "";

    /*
     * -----------------------------------------
     * IMAGE STORAGE PATHS
     * -----------------------------------------
     */

    const storagePrefix =
      `${data.user_id}/${data.id}/`;

    const backgroundPath =
      normalizeStoragePath(
        data.background_id,
        storagePrefix
      );

    const galleryPaths = Array.isArray(
      data.gallery_ids
    )
      ? data.gallery_ids
          .map((item) =>
            normalizeStoragePath(
              item,
              storagePrefix
            )
          )
          .filter(
            (path): path is string =>
              typeof path === "string"
          )
          .slice(0, 30)
      : [];

    const allImagePaths = Array.from(
      new Set([
        ...(backgroundPath
          ? [backgroundPath]
          : []),
        ...galleryPaths,
      ])
    );

    /*
     * -----------------------------------------
     * LEGACY GALLERY URLS
     * -----------------------------------------
     */

    const legacyGalleryUrls =
      Array.isArray(data.gallery_urls)
        ? data.gallery_urls.filter(
            isHttpUrl
          )
        : [];

    /*
     * -----------------------------------------
     * SIGNED STORAGE URLS
     * -----------------------------------------
     */

    const signedUrlByPath =
      new Map<string, string>();

    if (allImagePaths.length > 0) {
      const {
        data: signedImages,
        error: signedImagesError,
      } = await supabase.storage
        .from("invitation-images")
        .createSignedUrls(
          allImagePaths,
          60 * 60 * 24
        );

      if (signedImagesError) {
        console.error(
          "PUBLIC INVITATION IMAGE URL ERROR:",
          signedImagesError
        );

        /*
         * If legacy gallery URLs exist,
         * continue instead of failing.
         */
        if (
          legacyGalleryUrls.length === 0
        ) {
          return NextResponse.json(
            {
              error:
                "Failed to load invitation images",
            },
            {
              status: 500,
            }
          );
        }
      }

      for (const item of signedImages ?? []) {
        if (
          typeof item.path === "string" &&
          typeof item.signedUrl === "string"
        ) {
          signedUrlByPath.set(
            item.path,
            item.signedUrl
          );
        }
      }
    }

    /*
     * -----------------------------------------
     * BACKGROUND URL
     * -----------------------------------------
     */

    const backgroundUrl =
      backgroundPath
        ? signedUrlByPath.get(
            backgroundPath
          ) ?? null
        : null;

    /*
     * -----------------------------------------
     * GALLERY URLS
     * -----------------------------------------
     */

    const signedGalleryUrls =
      galleryPaths
        .map((path) =>
          signedUrlByPath.get(path)
        )
        .filter(
          (url): url is string =>
            typeof url === "string" &&
            url.length > 0
        );

    const galleryUrls =
      signedGalleryUrls.length > 0
        ? signedGalleryUrls
        : legacyGalleryUrls;

    /*
     * -----------------------------------------
     * RESPONSE
     * -----------------------------------------
     */

    return NextResponse.json(
      {
        id: data.id,

        extras: {
          lat,
          lng,
          mapUrl,
        },

        backgroundUrl,

        galleryUrls,
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
        error: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}