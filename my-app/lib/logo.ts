// Resolves a tool's logo URL. Brandfetch only: a durable logo captured into
// Convex storage at add/enrichment time. Returns null when there's nothing
// durable to show, so callers render the letter-tile fallback.
//
// Brandfetch search-result icon URLs (cdn.brandfetch.io/...?c=1ax<ts>...)
// carry expiring tokens — they 410 after a while — so they are treated as
// absent here; the enrichment action re-captures them into Convex storage.
// (Simple Icons was removed: the product is Brandfetch-only.)

export interface LogoInput {
  iconSlug?: string | null;
  logoUrl?: string | null;
  url?: string | null;
}

function isExpiringBrandfetchUrl(url: string): boolean {
  return url.includes("cdn.brandfetch.io");
}

export function toolLogoUrl(
  tool: LogoInput,
  opts?: { png?: boolean }
): string | null {
  if (tool.logoUrl && !isExpiringBrandfetchUrl(tool.logoUrl)) {
    return tool.logoUrl;
  }
  // A not-yet-recaptured tokenized URL is better than nothing in the browser
  // (it may still be within its TTL), but useless to satori, which needs a
  // raster it can trust.
  if (tool.logoUrl && !opts?.png) {
    return tool.logoUrl;
  }
  return null;
}
