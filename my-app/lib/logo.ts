// Resolves a tool's logo URL. Order: Simple Icons slug (crisp, no-auth SVG) →
// stored Brandfetch logo → Brandfetch CDN by domain. Returns null when there's
// nothing to show, so callers can render the letter-tile fallback.

export interface LogoInput {
  iconSlug?: string | null;
  logoUrl?: string | null;
  url?: string | null;
}

export function toolLogoUrl(
  tool: LogoInput,
  opts?: { png?: boolean }
): string | null {
  if (tool.iconSlug) {
    return `https://cdn.simpleicons.org/${tool.iconSlug}`;
  }
  if (tool.logoUrl) {
    // Brandfetch search returns .webp; satori (OG) needs a raster it can
    // decode, so request .png there. Browsers handle either.
    return opts?.png
      ? tool.logoUrl.replace(/\.webp(\?|$)/, ".png$1")
      : tool.logoUrl;
  }
  if (tool.url) {
    const clientId = process.env.NEXT_PUBLIC_BRANDFETCH_CLIENT_ID;
    return `https://cdn.brandfetch.io/${tool.url}/w/128/h/128/fallback/lettermark/icon.png${
      clientId ? `?c=${clientId}` : ""
    }`;
  }
  return null;
}
