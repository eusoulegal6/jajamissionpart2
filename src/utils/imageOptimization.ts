export const OPTIMIZE_IMAGES = true;

export function getDisplayImageUrl(originalUrl: string | null | undefined): string {
  if (!originalUrl) return "";

  // Only touch Supabase public storage URLs (any project)
  if (!originalUrl.includes(".supabase.co/storage/v1/object/public/")) {
    return originalUrl;
  }

  // When OPTIMIZE_IMAGES is false, always return the original URL.
  if (!OPTIMIZE_IMAGES) {
    return originalUrl;
  }

  // (Keep the optimized version here in case we want to re-enable it later)
  const [base, queryString] = originalUrl.split("?");
  const transformedBase = base.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/",
  );

  const params = new URLSearchParams(queryString || "");
  params.set("width", "900");
  params.set("resize", "contain");
  params.set("quality", "50");

  return `${transformedBase}?${params.toString()}`;
}
