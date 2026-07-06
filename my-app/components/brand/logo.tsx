import {
  BRAND_INK,
  BRAND_ORANGE,
  LOGOMARK_ASPECT,
  LOGOMARK_LEAVES,
  LOGOMARK_SWIRLS,
  LOGOMARK_VIEWBOX,
} from "@/lib/brand";

/**
 * The Superstack logomark glyph. `size` is the rendered height; width keeps
 * the glyph's natural aspect. Pass `ink`/`accent` to recolor (e.g. all-ivory
 * on dark surfaces). Plain SVG with explicit fills so it renders identically
 * in the browser and inside satori (OG images).
 */
export function Logomark({
  size = 24,
  ink = BRAND_INK,
  accent = BRAND_ORANGE,
  className,
}: {
  size?: number;
  ink?: string;
  accent?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox={LOGOMARK_VIEWBOX}
      width={Math.round(size * LOGOMARK_ASPECT)}
      height={size}
      className={className}
      aria-hidden
    >
      {LOGOMARK_SWIRLS.map((d) => (
        <path key={d.slice(0, 16)} d={d} fill={ink} />
      ))}
      {LOGOMARK_LEAVES.map((d) => (
        <path key={d.slice(0, 16)} d={d} fill={accent} />
      ))}
    </svg>
  );
}
