"use client";

import { toolLogoUrl } from "@/lib/logo";

/**
 * Tool logo: a warm letter-tile with the resolved icon layered on top. Prefers
 * a durable Brandfetch logo (from the tool's stored logoUrl); for catalog tools
 * that have no stored logo yet — e.g. the search / filter dropdowns — it falls
 * back to the self-hosted Brandfetch PNG at /hero-icons/<slug>.png. If neither
 * loads, the warm letter tile shows through.
 */
export default function LogoFramework({
  name,
  slug,
  src,
  url,
  size = 20,
}: {
  name: string;
  slug?: string | null;
  src?: string | null;
  url?: string | null;
  size?: number;
}) {
  const logo =
    toolLogoUrl({ iconSlug: slug, logoUrl: src, url }) ??
    (slug ? `/hero-icons/${slug}.png` : null);

  return (
    <span
      style={{ width: size, height: size }}
      className="relative inline-block flex-none"
      aria-hidden
    >
      <span
        className="absolute inset-0 flex items-center justify-center rounded-[28%] bg-[#F3E8D6] font-extrabold text-[#A0713C]"
        style={{ fontSize: size * 0.5 }}
      >
        {name[0]?.toUpperCase()}
      </span>
      {logo && (
        <span
          className="absolute inset-0 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${logo}')` }}
        />
      )}
    </span>
  );
}
