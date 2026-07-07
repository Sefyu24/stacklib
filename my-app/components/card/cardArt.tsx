/* eslint-disable @next/next/no-img-element */
// The one true card renderer. A fixed 1200x630 design shared by the live
// preview (scaled to fit in the browser) and the OG PNG route (rasterized by
// satori), so both are the same pixels by construction.
//
// Satori compatibility rules — do not break them:
//   - inline styles only, no className, no CSS vars in the OG path
//   - every div with multiple children declares display:flex
//   - ASCII-only text (the subset TTFs have no U+2713)
//   - fonts arrive via the `fonts` prop: the OG route passes literal family
//     names ("Archivo", ...), the browser passes CSS vars ("var(--font-archivo)")
//   - no CSS transforms: satori misplaces nested children under `scale()`,
//     so hi-res exports multiply every px value via the `scale` prop instead.

import { Logomark } from "@/components/brand/logo";
import {
  CardRenderData,
  CardRenderSection,
  CardRenderTool,
  truncate,
} from "@/lib/card/render";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

export type CardFonts = { sans: string; mono: string; serif: string };

/** Literal family names for satori (matches the TTFs the OG route loads). */
export const OG_CARD_FONTS: CardFonts = {
  sans: "Archivo",
  mono: "JetBrains Mono",
  serif: "EB Garamond",
};

/** next/font CSS vars for the browser preview (set up in app/layout.tsx). */
export const PREVIEW_CARD_FONTS: CardFonts = {
  sans: "var(--font-archivo)",
  mono: "var(--font-jetbrains-mono)",
  serif: "var(--font-garamond)",
};

// Warm palette (mirrors the app tokens; literals because satori has no CSS vars)
const CREAM = "#F6F1E8";
const INK = "#1C1712";
const ORANGE = "#EC5B13";
const TAUPE = "#B4A78E";

// ---------------------------------------------------------------------------
// px scaling — every geometric style value below is authored at 1x (1200x630)
// and multiplied by `k` at render time. Font metrics and flex layout are
// linear in px, so a k=2 render is the identical design at 2400x1260 with
// crisp vector text (satori's transform:scale can't do this — it misplaces
// nested children).

const SCALABLE = new Set([
  "width",
  "height",
  "minWidth",
  "minHeight",
  "padding",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "margin",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "gap",
  "rowGap",
  "columnGap",
  "fontSize",
  "borderRadius",
  "letterSpacing",
  "top",
  "left",
  "right",
  "bottom",
  "borderWidth",
]);

const PX_RE = /(\d*\.?\d+)px/g;

function scaleStyle(style: React.CSSProperties, k: number): React.CSSProperties {
  if (k === 1) return style;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(style)) {
    if (typeof value === "number" && SCALABLE.has(key)) {
      out[key] = value * k;
    } else if (typeof value === "string" && PX_RE.test(value)) {
      out[key] = value.replace(PX_RE, (_, n) => `${parseFloat(n) * k}px`);
    } else {
      out[key] = value;
    }
    PX_RE.lastIndex = 0;
  }
  return out as React.CSSProperties;
}

interface ThemeProps {
  data: CardRenderData;
  fonts: CardFonts;
  /** px multiplier: 1 for the preview/OG embed, 2 for hi-res downloads */
  k: number;
}

/**
 * Root card art: cream frame + the stack's saved theme, at exactly
 * 1200x630 times `scale`.
 */
export function CardArt({
  data,
  fonts,
  scale = 1,
}: {
  data: CardRenderData;
  fonts: CardFonts;
  scale?: number;
}) {
  const k = scale;
  const card =
    data.theme === "bento" ? (
      <BentoCard data={data} fonts={fonts} k={k} />
    ) : data.theme === "terminal" ? (
      <TerminalCard data={data} fonts={fonts} k={k} />
    ) : (
      <MinimalCard data={data} fonts={fonts} k={k} />
    );

  return (
    <div
      style={scaleStyle(
        {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          display: "flex",
          background: CREAM,
          padding: 30,
          fontFamily: fonts.sans,
        },
        k
      )}
    >
      {card}
    </div>
  );
}

// A logo image, or a warm letter-tile fallback. `size` is in 1x px.
function Logo({ tool, size, k }: { tool: CardRenderTool; size: number; k: number }) {
  if (tool.logo) {
    return (
      <img
        src={tool.logo}
        alt=""
        width={size * k}
        height={size * k}
        style={scaleStyle(
          {
            width: size,
            height: size,
            borderRadius: size * 0.24,
            objectFit: "contain",
            flexShrink: 0,
          },
          k
        )}
      />
    );
  }
  return (
    <div
      style={scaleStyle(
        {
          width: size,
          height: size,
          borderRadius: size * 0.24,
          background: "#F3E8D6",
          color: "#A0713C",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: size * 0.5,
          flexShrink: 0,
        },
        k
      )}
    >
      {tool.letter}
    </div>
  );
}

function Chunky({
  children,
  style,
  k,
}: {
  children: React.ReactNode;
  style: React.CSSProperties;
  k: number;
}) {
  return (
    <div
      style={scaleStyle(
        {
          border: `2px solid ${INK}`,
          borderRadius: 20,
          boxShadow: `0 5px 0 ${INK}`,
          display: "flex",
          overflow: "hidden",
          ...style,
        },
        k
      )}
    >
      {children}
    </div>
  );
}

// Small identity row under the header: avatar + display name + @handle.
function IdentityRow({
  data,
  fonts,
  k,
  handleColor,
}: ThemeProps & { handleColor: string }) {
  const { authorName, authorHandle, avatarSrc, showAvatar } = data;
  if (!authorName && !authorHandle) return null;
  return (
    <div
      style={scaleStyle(
        {
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 10,
        },
        k
      )}
    >
      {showAvatar !== false && avatarSrc && (
        <img
          src={avatarSrc}
          alt=""
          width={30 * k}
          height={30 * k}
          style={scaleStyle(
            { width: 30, height: 30, borderRadius: 999, objectFit: "cover" },
            k
          )}
        />
      )}
      {authorName && (
        <div
          style={scaleStyle(
            { display: "flex", fontSize: 20, fontWeight: 600, color: INK },
            k
          )}
        >
          {authorName}
        </div>
      )}
      {authorHandle && (
        <div
          style={scaleStyle(
            {
              display: "flex",
              fontFamily: fonts.mono,
              fontSize: 17,
              color: handleColor,
            },
            k
          )}
        >
          @{authorHandle}
        </div>
      )}
    </div>
  );
}

// Non-interactive "+K more" chip (links can't be clicked in a PNG, and the
// preview mirrors the PNG exactly).
function MoreChip({
  overflow,
  k,
  color = ORANGE,
  border = "#D9A16B",
}: {
  overflow: number;
  k: number;
  color?: string;
  border?: string;
}) {
  if (overflow <= 0) return null;
  return (
    <div
      style={scaleStyle(
        {
          display: "flex",
          alignSelf: "flex-start",
          alignItems: "center",
          border: `1.5px dashed ${border}`,
          borderRadius: 10,
          padding: "6px 13px",
          fontSize: 18,
          fontWeight: 600,
          color,
        },
        k
      )}
    >
      +{overflow} more
    </div>
  );
}

function EmptyBody({ k }: { k: number }) {
  return (
    <div
      style={scaleStyle(
        {
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        },
        k
      )}
    >
      <div
        style={scaleStyle(
          { display: "flex", fontSize: 34, fontWeight: 800, color: INK },
          k
        )}
      >
        This stack is still brewing
      </div>
      <div style={scaleStyle({ display: "flex", fontSize: 22, color: TAUPE }, k)}>
        Build yours at superstacks.dev
      </div>
    </div>
  );
}

function MinimalCard({ data, fonts, k }: ThemeProps) {
  const { statLabel, sections, showWatermark, isEmpty, overflow, subtitle } = data;
  return (
    <Chunky
      k={k}
      style={{ background: "#FBF7F0", padding: 12, width: "100%", height: "100%" }}
    >
      <div
        style={scaleStyle(
          {
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            background: "#FFFDF8",
            border: "1px solid #EDE4D2",
            borderRadius: 12,
            padding: "22px 38px",
          },
          k
        )}
      >
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          {!isEmpty && (
            <div
              style={scaleStyle(
                {
                  display: "flex",
                  fontFamily: fonts.mono,
                  fontSize: 19,
                  color: TAUPE,
                },
                k
              )}
            >
              {statLabel}
            </div>
          )}
        </div>
        <IdentityRow data={data} fonts={fonts} k={k} handleColor={TAUPE} />
        <div
          style={scaleStyle(
            {
              display: "flex",
              flexShrink: 0,
              fontSize: 38,
              fontWeight: 900,
              letterSpacing: -1,
              color: INK,
              marginTop: 4,
              marginBottom: 12,
            },
            k
          )}
        >
          {truncate(data.stackName, 34)}
        </div>
        {subtitle && (
          <div
            style={scaleStyle(
              {
                display: "flex",
                flexShrink: 0,
                fontSize: 20,
                color: "#8A7B63",
                marginTop: -6,
                marginBottom: 14,
              },
              k
            )}
          >
            {subtitle}
          </div>
        )}
        {isEmpty ? (
          <EmptyBody k={k} />
        ) : (
          <div
            style={scaleStyle(
              {
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                minHeight: 0,
                overflow: "hidden",
                gap: 11,
              },
              k
            )}
          >
            {sections.map((s: CardRenderSection) => (
              <div
                key={s.type}
                style={scaleStyle(
                  { display: "flex", flexDirection: "column", gap: 7 },
                  k
                )}
              >
                <div
                  style={scaleStyle(
                    {
                      display: "flex",
                      fontFamily: fonts.mono,
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: 3,
                      color: TAUPE,
                    },
                    k
                  )}
                >
                  {s.name.toUpperCase()}
                </div>
                <div
                  style={scaleStyle(
                    { display: "flex", flexWrap: "wrap", gap: 9 },
                    k
                  )}
                >
                  {s.tools.map((t, i) => (
                    <div
                      key={i}
                      style={scaleStyle(
                        {
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          border: "1.5px solid #F0DCC2",
                          background: "#FFF8F0",
                          borderRadius: 10,
                          padding: "6px 13px",
                          fontSize: 19,
                          fontWeight: 600,
                          color: INK,
                        },
                        k
                      )}
                    >
                      <Logo tool={t} size={24} k={k} />
                      {t.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <MoreChip overflow={overflow} k={k} />
          </div>
        )}
        {showWatermark && (
          <div
            style={scaleStyle(
              {
                display: "flex",
                flexShrink: 0,
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #EDE4D2",
                paddingTop: 16,
                marginTop: 16,
              },
              k
            )}
          >
            <div
              style={scaleStyle(
                {
                  display: "flex",
                  fontFamily: fonts.mono,
                  fontSize: 18,
                  color: TAUPE,
                },
                k
              )}
            >
              powered by superstacks.dev
            </div>
            <Logomark size={30 * k} />
          </div>
        )}
      </div>
    </Chunky>
  );
}

function BentoCard({ data, fonts, k }: ThemeProps) {
  const { statLabel, sections, showWatermark, isEmpty, overflow, subtitle } = data;
  // Grouped by category with one label per section; compact horizontal
  // tiles so every rendered tool fits the fixed 630px frame.
  return (
    <Chunky
      k={k}
      style={{
        background: "#F3E8D6",
        padding: "26px 34px",
        width: "100%",
        height: "100%",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        {!isEmpty && (
          <div
            style={scaleStyle(
              {
                display: "flex",
                fontFamily: fonts.mono,
                fontSize: 19,
                color: "#A0713C",
              },
              k
            )}
          >
            {statLabel}
          </div>
        )}
      </div>
      <IdentityRow data={data} fonts={fonts} k={k} handleColor="#A0713C" />
      <div
        style={scaleStyle(
          {
            display: "flex",
            flexShrink: 0,
            fontSize: 40,
            fontWeight: 900,
            letterSpacing: -1,
            color: INK,
            marginTop: 4,
            marginBottom: 14,
          },
          k
        )}
      >
        {truncate(data.stackName, 34)}
      </div>
      {subtitle && (
        <div
          style={scaleStyle(
            {
              display: "flex",
              flexShrink: 0,
              fontSize: 20,
              color: "#8A7B63",
              marginTop: -6,
              marginBottom: 14,
            },
            k
          )}
        >
          {subtitle}
        </div>
      )}
      {isEmpty ? (
        <EmptyBody k={k} />
      ) : (
        <div
          style={scaleStyle(
            {
              display: "flex",
              gap: 12,
              flexGrow: 1,
              minHeight: 0,
              overflow: "hidden",
              alignItems: "stretch",
            },
            k
          )}
        >
          {sections.map((s: CardRenderSection) => (
            <div
              key={s.type}
              style={scaleStyle(
                {
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  flex: 1,
                  minWidth: 0,
                  background: "rgba(255,253,248,0.45)",
                  border: "1px solid #E4D5BB",
                  borderRadius: 14,
                  padding: "12px 10px",
                },
                k
              )}
            >
              <div
                style={scaleStyle(
                  {
                    display: "flex",
                    justifyContent: "center",
                    fontFamily: fonts.mono,
                    fontSize: 11.5,
                    fontWeight: 700,
                    letterSpacing: 2.5,
                    color: "#A0713C",
                  },
                  k
                )}
              >
                {s.name.toUpperCase()}
              </div>
              {s.tools.map((t, i) => (
                <div
                  key={i}
                  style={scaleStyle(
                    {
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#FFFDF8",
                      border: "1px solid #E4D5BB",
                      borderRadius: 10,
                      padding: "8px 10px",
                      fontSize: 15.5,
                      fontWeight: 700,
                      color: INK,
                    },
                    k
                  )}
                >
                  <Logo tool={t} size={24} k={k} />
                  {truncate(t.name, 13)}
                </div>
              ))}
            </div>
          ))}
          <MoreChip overflow={overflow} k={k} border="#C9A87A" color="#A0713C" />
        </div>
      )}
      {showWatermark && (
        <div
          style={scaleStyle(
            {
              display: "flex",
              flexShrink: 0,
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12,
            },
            k
          )}
        >
          <div
            style={scaleStyle(
              {
                display: "flex",
                fontFamily: fonts.mono,
                fontSize: 18,
                color: "#A0713C",
              },
              k
            )}
          >
            powered by superstacks.dev
          </div>
          <Logomark size={30 * k} />
        </div>
      )}
    </Chunky>
  );
}

function TerminalCard({ data, fonts, k }: ThemeProps) {
  const {
    stackName,
    statLabel,
    sections,
    showWatermark,
    isEmpty,
    overflow,
    subtitle,
    authorName,
    authorHandle,
  } = data;
  const title = `${stackName.toLowerCase().replace(/\s+/g, "-")}.sh`;
  return (
    <Chunky
      k={k}
      style={{
        background: "#16110B",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={scaleStyle(
          {
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "16px 24px",
            borderBottom: "1px solid #2C2418",
          },
          k
        )}
      >
        <div
          style={scaleStyle(
            { display: "flex", width: 14, height: 14, borderRadius: 7, background: "#E5533C" },
            k
          )}
        />
        <div
          style={scaleStyle(
            { display: "flex", width: 14, height: 14, borderRadius: 7, background: "#E5A93C" },
            k
          )}
        />
        <div
          style={scaleStyle(
            { display: "flex", width: 14, height: 14, borderRadius: 7, background: "#5BA35B" },
            k
          )}
        />
        <div
          style={scaleStyle(
            {
              display: "flex",
              marginLeft: "auto",
              fontFamily: fonts.mono,
              fontSize: 15,
              color: "#6B5D46",
            },
            k
          )}
        >
          {title}
        </div>
      </div>
      <div
        style={scaleStyle(
          {
            display: "flex",
            flexDirection: "column",
            padding: "30px 36px",
            fontFamily: fonts.mono,
            fontSize: 22,
            lineHeight: 1.9,
            flexGrow: 1,
          },
          k
        )}
      >
        <div style={{ display: "flex", color: "#C9BCA2" }}>
          <span style={{ color: ORANGE }}>~</span>
          <span style={scaleStyle({ color: "#5BA35B", marginLeft: 12 }, k)}>$</span>
          <span style={scaleStyle({ marginLeft: 12 }, k)}>superstacks show</span>
          <span style={scaleStyle({ color: "#8A7B63", marginLeft: 12 }, k)}>
            --pinned
          </span>
        </div>
        {subtitle && (
          <div style={{ display: "flex", color: "#6B5D46" }}># {subtitle}</div>
        )}
        {(authorHandle || authorName) && (
          <div style={{ display: "flex", color: "#6B5D46" }}>
            # by {authorHandle ? `@${authorHandle}` : authorName}
          </div>
        )}
        {isEmpty ? (
          <div style={{ display: "flex", color: "#6B5D46" }}>
            # no tools yet — add some to build your stack
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {sections.map((s: CardRenderSection) => (
              <div key={s.type} style={{ display: "flex" }}>
                <span style={{ color: ORANGE, whiteSpace: "pre" }}>
                  {s.type.padEnd(9)}
                </span>
                <span style={{ color: "#4A3F2E" }}>› </span>
                <span style={{ color: "#F0E6D2" }}>
                  {truncate(s.tools.map((t) => t.name).join(" · "), 60)}
                </span>
              </div>
            ))}
            <div
              style={scaleStyle(
                { display: "flex", color: "#5BA35B", marginTop: 4 },
                k
              )}
            >
              {/* the Google-subset TTF has no U+2713, so use a prompt-style marker */}
              <span style={scaleStyle({ marginRight: 12 }, k)}>&gt;</span>
              {statLabel}
            </div>
            {overflow > 0 && (
              <div style={{ display: "flex", color: "#6B5D46" }}>
                # +{overflow} more on superstacks.dev
              </div>
            )}
          </div>
        )}
        {showWatermark && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#6B5D46",
              marginTop: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              powered by superstacks.dev
              <span
                style={scaleStyle(
                  {
                    display: "flex",
                    width: 12,
                    height: 22,
                    background: ORANGE,
                    marginLeft: 8,
                  },
                  k
                )}
              />
            </div>
            <Logomark size={26 * k} />
          </div>
        )}
      </div>
    </Chunky>
  );
}
