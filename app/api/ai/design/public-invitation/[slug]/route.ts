import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type ProgramItem = {
  time: string;
  title: string;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();

  return (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  );
}

function cleanPath(value: string) {
  return value.trim().replace(/^\/+/, "");
}

function normalizeStoragePath(
  value: unknown,
  storagePrefix: string
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  // Already a full URL.
  if (isHttpUrl(trimmed)) {
    return trimmed;
  }

  const cleaned = cleanPath(trimmed);
  const cleanPrefix = cleanPath(storagePrefix);

  // Already contains the full invitation storage path.
  if (cleaned.startsWith(cleanPrefix)) {
    return cleaned;
  }

  // Some old records may contain a leading "invitation-images/" prefix.
  if (cleaned.startsWith("invitation-images/")) {
    const withoutBucket = cleaned.replace(
      /^invitation-images\//,
      ""
    );

    if (withoutBucket.startsWith(cleanPrefix)) {
      return withoutBucket;
    }
  }

  // If only the filename was stored, prepend:
  // user_id/invitation_id/
  if (!cleaned.includes("/")) {
    return `${cleanPrefix}${cleaned}`;
  }

  return null;
}

function normalizeProgram(value: unknown): ProgramItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" &&
        item !== null
    )
    .map((item) => ({
      time:
        typeof item.time === "string"
          ? item.time.trim()
          : "",
      title:
        typeof item.title === "string"
          ? item.title.trim()
          : "",
    }))
    .filter(
      (item) =>
        item.time.length > 0 ||
        item.title.length > 0
    );
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
          gallery_urls,
          gallery_captions
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
          error: "Failed to load invitation extras",
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

    // --------------------------------------------------
    // EXTRA / MAP / PROGRAM DATA
    // --------------------------------------------------

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

    // Хөтөлбөр
    const program = normalizeProgram(
      rawExtras.program
    );

    // --------------------------------------------------
    // IMAGE STORAGE PATHS
    // --------------------------------------------------

    const storagePrefix = `${data.user_id}/${data.id}/`;

    const backgroundValue =
      data.background_id;

    const backgroundPath =
      normalizeStoragePath(
        backgroundValue,
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

    // --------------------------------------------------
    // LEGACY / DIRECT URLS
    // --------------------------------------------------

    const legacyGalleryUrls =
      Array.isArray(data.gallery_urls)
        ? data.gallery_urls
            .filter(isHttpUrl)
            .map((url) => url.trim())
        : [];

    // If background_id itself is already a URL,
    // don't try to sign it as a storage path.
    const directBackgroundUrl =
      isHttpUrl(backgroundValue)
        ? backgroundValue.trim()
        : null;

    const directGalleryUrls =
      Array.isArray(data.gallery_ids)
        ? data.gallery_ids
            .filter(isHttpUrl)
            .map((url) => url.trim())
        : [];

    // --------------------------------------------------
    // STORAGE PATHS THAT NEED SIGNED URLS
    // --------------------------------------------------

    const storageBackgroundPath =
      backgroundPath &&
      !isHttpUrl(backgroundPath)
        ? backgroundPath
        : null;

    const storageGalleryPaths =
      galleryPaths.filter(
        (path) => !isHttpUrl(path)
      );

    const allImagePaths = Array.from(
      new Set([
        ...(storageBackgroundPath
          ? [storageBackgroundPath]
          : []),
        ...storageGalleryPaths,
      ])
    );

    // --------------------------------------------------
    // SIGNED STORAGE URLS
    // --------------------------------------------------

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

        // We do not immediately fail.
        // Direct / legacy URLs can still be used.
      }

      for (const item of signedImages ?? []) {
        if (
          typeof item.path === "string" &&
          typeof item.signedUrl === "string" &&
          item.signedUrl.length > 0
        ) {
          signedUrlByPath.set(
            item.path,
            item.signedUrl
          );
        }
      }
    }

    // --------------------------------------------------
    // BACKGROUND URL
    // --------------------------------------------------

    let backgroundUrl: string | null = null;

    if (directBackgroundUrl) {
      backgroundUrl = directBackgroundUrl;
    } else if (storageBackgroundPath) {
      backgroundUrl =
        signedUrlByPath.get(
          storageBackgroundPath
        ) ?? null;
    }

    // --------------------------------------------------
    // GALLERY URLS
    // --------------------------------------------------

    const signedGalleryUrls =
      storageGalleryPaths
        .map((path) =>
          signedUrlByPath.get(path)
        )
        .filter(
          (url): url is string =>
            typeof url === "string" &&
            url.length > 0
        );

    const galleryUrls = Array.from(
      new Set([
        ...directGalleryUrls,
        ...signedGalleryUrls,
        ...legacyGalleryUrls,
      ])
    ).slice(0, 30);

    // --------------------------------------------------
    // GALLERY CAPTIONS
    // --------------------------------------------------

    const galleryCaptions =
      Array.isArray(data.gallery_captions)
        ? data.gallery_captions.map((caption) =>
            typeof caption === "string"
              ? caption
              : ""
          )
        : [];

    // --------------------------------------------------
    // DEBUG LOG
    // --------------------------------------------------

    console.log(
      "PUBLIC INVITATION RESULT:",
      {
        slug,
        invitationId: data.id,
        backgroundValue,
        backgroundPath,
        backgroundUrl,
        galleryCount: galleryUrls.length,
        galleryPathsCount:
          galleryPaths.length,
        signedUrlsCount:
          signedGalleryUrls.length,
        legacyUrlsCount:
          legacyGalleryUrls.length,
        programCount: program.length,
        program,
      }
    );

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return NextResponse.json(
      {
        id: data.id,

        extras: {
          lat,
          lng,
          mapUrl,
          program,
        },

        backgroundUrl,
        galleryUrls,
        galleryCaptions,
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