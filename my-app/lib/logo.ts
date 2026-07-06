// Resolves a tool's logo URL. Order: stored logo (a Convex-storage PNG we
// captured from Brandfetch at add/enrichment time) → Simple Icons slug as a
// fallback → null, so callers render the letter-tile.
//
// Brandfetch search-result icon URLs (cdn.brandfetch.io/...?c=1ax<ts>...)
// carry expiring tokens — they 410 after a while, so they are treated as
// absent here; the enrichment action re-captures them into Convex storage.

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
  if (tool.iconSlug) {
    // Simple Icons serves SVG, which both browsers and satori decode.
    return `https://cdn.simpleicons.org/${tool.iconSlug}`;
  }
  // A stale tokenized URL is better than nothing in the browser (it may
  // still be within its TTL) but useless to satori, which needs a raster
  // it can trust.
  if (tool.logoUrl && !opts?.png) {
    return tool.logoUrl;
  }
  return null;
}
