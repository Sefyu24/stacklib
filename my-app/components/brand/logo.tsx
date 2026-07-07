import {
  BRAND_INK,
  BRAND_ORANGE,
  LOGOMARK_ASPECT,
  LOGOMARK_LEAVES,
  LOGOMARK_SWIRLS,
  LOGOMARK_VIEWBOX,
} from "@/lib/brand";

/**
 * The Superstacks logomark glyph. `size` is the rendered height; width keeps
 * the glyph's natural aspect. Defaults to the all-orange brand variant;
 * pass `ink`/`accent` to recolor (two-tone onyx+orange, all-ivory on dark).
 * Plain SVG with explicit fills so it renders identically in the browser
 * and inside satori (OG images).
 */
export function Logomark({
  size = 24,
  ink = BRAND_ORANGE,
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

/**
 * The Superstacks wordmark, mirroring the brand lockup pairing:
 * italic serif "super" (EB Garamond) + heavy grotesque "stack"
 * (Archivo 900 standing in for the commercial Forma DJR Display).
 * Single color per brand rules; `size` is the font size in px.
 */
export function Wordmark({
  size = 16,
  color = BRAND_INK,
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{ fontSize: size, lineHeight: 1, color, whiteSpace: "nowrap" }}
    >
      <span
        style={{
          fontFamily: "var(--font-garamond)",
          fontStyle: "italic",
          fontWeight: 600,
        }}
      >
        super
      </span>
      <span
        style={{
          fontFamily: "var(--font-archivo)",
          fontWeight: 900,
          letterSpacing: "-0.02em",
        }}
      >
        stacks
      </span>
    </span>
  );
}
