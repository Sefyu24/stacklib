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
//   - no transform:scale — satori misplaces nested children under scale(),
//     so hi-res exports multiply every px value via the `scale` prop instead.
//     (rotate() on leaf sticker nodes is fine and used by the lid theme.)

import { Logomark } from "@/components/brand/logo";
import {
  LID_MARK_PATHS,
  CardRenderData,
  CardRenderSection,
  CardRenderTool,
  getIdentityLayout,
  getStickerLayout,
  LID_CAPTION_H,
  LID_MARK_CX,
  LID_MARK_CY,
  LidEdition,
  LidSticker,
  OVERFLOW_STICKER_ID,
  stickerLeft,
  stickerTop,
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
const IVORY = "#F0E6D2";

// Section label hues (spec: oklch hues frontend 55 / backend 150 / ai 305 /
// ide 245 / other 85), precomputed to hex because satori can't parse oklch().
// Ledger labels: oklch(0.52 0.11 h) — readable on cream.
const LEDGER_HUE: Record<string, string> = {
  frontend: "#985521",
  backend: "#317A45",
  ai: "#78579B",
  ide: "#266EA4",
  other: "#866300",
};
// Stackfetch keys: oklch(0.78 0.10 h) — readable on the dark shell.
const FETCH_HUE: Record<string, string> = {
  frontend: "#E9A679",
  backend: "#88CA95",
  ai: "#C6A7EB",
  ide: "#7FBEF3",
  other: "#D5B36A",
};
// Palette strip: brand orange, oklch(0.72 0.14 55/150/305/245), then neutrals.
const FETCH_PALETTE = [
  ORANGE,
  "#E78A45",
  "#5BBD74",
  "#B98CEA",
  "#4DACF6",
  IVORY,
  "#8A7B63",
  "#35291A",
];

// Lid edition finishes.
const LID_FINISH: Record<
  LidEdition,
  { bg: string; shadow: number; caption: string; markSize: number; markColor: string }
> = {
  apple: { bg: "#33302B", shadow: 0.35, caption: "#6B6459", markSize: 150, markColor: "#C9C2B6" },
  microsoft: { bg: "#D8D3CA", shadow: 0.22, caption: "#8A857C", markSize: 132, markColor: "#8A857C" },
  linux: { bg: "#16110B", shadow: 0.45, caption: "#6B5D46", markSize: 155, markColor: "#F0E6D2" },
};

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
  "maxWidth",
  "maxHeight",
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
 * Root card art: the stack's saved theme at exactly 1200x630 times `scale`.
 * minimal/terminal sit inside the cream frame; the lid is full-bleed.
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
  const isLid = data.theme === "lid";
  const card = isLid ? (
    <LidCard data={data} fonts={fonts} k={k} />
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
          padding: isLid ? 0 : 30,
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

// Small identity row above the ledger title: avatar + display name + @handle.
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

// ===========================================================================
// 01 MINIMAL — "Ledger": white sheet, hue-coded section rules, logo grid.
// ===========================================================================

function MinimalCard({ data, fonts, k }: ThemeProps) {
  const { statLabel, sections, showWatermark, isEmpty, overflow, subtitle } = data;

  // Two columns of section blocks; each section goes to the currently
  // shorter column (estimated by tool-row count) so the landscape width is
  // used evenly. Deterministic: order in, order out.
  const columns: CardRenderSection[][] = [[], []];
  const heights = [0, 0];
  for (const s of sections) {
    const c = heights[0] <= heights[1] ? 0 : 1;
    columns[c].push(s);
    heights[c] += 30 + Math.ceil(s.tools.length / 5) * 96;
  }

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
            padding: "24px 38px",
          },
          k
        )}
      >
        {/* Header: identity + title left, tool count right */}
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            style={scaleStyle(
              { display: "flex", flexDirection: "column", gap: 6, minWidth: 0 },
              k
            )}
          >
            <IdentityRow data={data} fonts={fonts} k={k} handleColor={TAUPE} />
            <div
              style={scaleStyle(
                {
                  display: "flex",
                  fontSize: 38,
                  fontWeight: 900,
                  letterSpacing: -1,
                  color: INK,
                },
                k
              )}
            >
              {truncate(data.stackName, 30)}
            </div>
            {subtitle && (
              <div
                style={scaleStyle(
                  { display: "flex", fontSize: 17, color: "#8A7B63" },
                  k
                )}
              >
                {truncate(subtitle, 70)}
              </div>
            )}
          </div>
          {!isEmpty && (
            <div
              style={scaleStyle(
                {
                  display: "flex",
                  flexShrink: 0,
                  fontFamily: fonts.mono,
                  fontSize: 17,
                  letterSpacing: 2,
                  color: TAUPE,
                  marginTop: 10,
                },
                k
              )}
            >
              {statLabel.toUpperCase()}
            </div>
          )}
        </div>

        {isEmpty ? (
          <EmptyBody k={k} />
        ) : (
          <div
            style={scaleStyle(
              {
                display: "flex",
                gap: 40,
                flexGrow: 1,
                minHeight: 0,
                overflow: "hidden",
                marginTop: 14,
              },
              k
            )}
          >
            {columns.map(
              (col, ci) =>
                col.length > 0 && (
                  <div
                    key={ci}
                    style={scaleStyle(
                      {
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        minWidth: 0,
                        gap: 13,
                      },
                      k
                    )}
                  >
                    {col.map((s) => (
                      <div
                        key={s.type}
                        style={scaleStyle(
                          { display: "flex", flexDirection: "column", gap: 8 },
                          k
                        )}
                      >
                        {/* label + hairline rule */}
                        <div
                          style={{ display: "flex", alignItems: "center" }}
                        >
                          <div
                            style={scaleStyle(
                              {
                                display: "flex",
                                fontFamily: fonts.mono,
                                fontSize: 13,
                                fontWeight: 700,
                                letterSpacing: 3,
                                color: LEDGER_HUE[s.type] ?? LEDGER_HUE.other,
                              },
                              k
                            )}
                          >
                            {s.name.toUpperCase()}
                          </div>
                          <div
                            style={scaleStyle(
                              {
                                display: "flex",
                                flexGrow: 1,
                                height: 1,
                                background: "rgba(28,23,18,0.1)",
                                marginLeft: 14,
                              },
                              k
                            )}
                          />
                        </div>
                        {/* logo grid */}
                        <div
                          style={scaleStyle(
                            { display: "flex", flexWrap: "wrap", rowGap: 10 },
                            k
                          )}
                        >
                          {s.tools.map((t, i) => (
                            <div
                              key={i}
                              style={scaleStyle(
                                {
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: 6,
                                  width: 98,
                                },
                                k
                              )}
                            >
                              <Logo tool={t} size={48} k={k} />
                              <div
                                style={scaleStyle(
                                  {
                                    display: "flex",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: "#4A4136",
                                  },
                                  k
                                )}
                              >
                                {truncate(t.name, 11)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {ci === columns.length - 1 && (
                      <MoreChip overflow={overflow} k={k} />
                    )}
                  </div>
                )
            )}
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
                paddingTop: 12,
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

// ===========================================================================
// 02 TERMINAL — "Stackfetch": neofetch-style shell with logo tiles + specs.
// ===========================================================================

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "stack";

function TerminalCard({ data, fonts, k }: ThemeProps) {
  const {
    stackName,
    sections,
    showWatermark,
    isEmpty,
    handleText,
    toolCount,
    sectionCount,
    authorName,
  } = data;
  const fileName = `${slugify(stackName)}.sh`;
  const fetchArg = handleText ?? slugify(stackName);
  const footerUrl = handleText
    ? `superstacks.dev/${handleText}`
    : "superstacks.dev";

  // Logo tile grid: 4 columns, capped so the last cell is always the orange
  // logomark tile.
  const tools = sections.flatMap((s) => s.tools);
  const tiles = tools.slice(0, 15);

  const TILE = 62;

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
      {/* window chrome */}
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
        {["#E5533C", "#E5A93C", "#5BA35B"].map((c) => (
          <div
            key={c}
            style={scaleStyle(
              { display: "flex", width: 14, height: 14, borderRadius: 7, background: c },
              k
            )}
          />
        ))}
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
          {fileName}
        </div>
      </div>

      {/* body */}
      <div
        style={scaleStyle(
          {
            display: "flex",
            flexDirection: "column",
            padding: "26px 36px",
            fontFamily: fonts.mono,
            fontSize: 20,
            flexGrow: 1,
            minHeight: 0,
          },
          k
        )}
      >
        {/* command line */}
        <div style={{ display: "flex", color: "#C9BCA2" }}>
          <span style={{ color: ORANGE }}>~</span>
          <span style={scaleStyle({ color: "#5BA35B", marginLeft: 12 }, k)}>$</span>
          <span style={scaleStyle({ marginLeft: 12, color: IVORY }, k)}>
            stackfetch
          </span>
          <span style={scaleStyle({ color: "#8A7B63", marginLeft: 12 }, k)}>
            {truncate(fetchArg, 30)}
          </span>
        </div>

        {isEmpty ? (
          <div
            style={scaleStyle(
              { display: "flex", color: "#6B5D46", marginTop: 16 },
              k
            )}
          >
            # no tools yet — add some to build your stack
          </div>
        ) : (
          <div
            style={scaleStyle(
              {
                display: "flex",
                marginTop: 22,
                gap: 36,
                alignItems: "stretch",
                minHeight: 0,
                flexGrow: 1,
              },
              k
            )}
          >
            {/* left: logo tiles */}
            <div
              style={scaleStyle(
                {
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  width: TILE * 4 + 30,
                  flexShrink: 0,
                  alignContent: "flex-start",
                },
                k
              )}
            >
              {tiles.map((t, i) => (
                <div
                  key={i}
                  style={scaleStyle(
                    {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: TILE,
                      height: TILE,
                      background: "#221A10",
                      border: "1px solid #35291A",
                      borderRadius: 12,
                    },
                    k
                  )}
                >
                  {t.logo ? (
                    <img
                      src={t.logo}
                      alt=""
                      width={36 * k}
                      height={36 * k}
                      style={scaleStyle(
                        { width: 36, height: 36, objectFit: "contain" },
                        k
                      )}
                    />
                  ) : (
                    <div
                      style={scaleStyle(
                        {
                          display: "flex",
                          fontSize: 24,
                          fontWeight: 700,
                          color: "#C9BCA2",
                        },
                        k
                      )}
                    >
                      {t.letter}
                    </div>
                  )}
                </div>
              ))}
              {/* brand tile always closes the grid */}
              <div
                style={scaleStyle(
                  {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: TILE,
                    height: TILE,
                    background: ORANGE,
                    borderRadius: 12,
                  },
                  k
                )}
              >
                <Logomark size={32 * k} ink="#FFF7EE" accent="#FFF7EE" />
              </div>
            </div>

            {/* right: spec sheet */}
            <div
              style={scaleStyle(
                {
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                  minWidth: 0,
                  justifyContent: "space-between",
                  paddingTop: 2,
                  paddingBottom: 2,
                },
                k
              )}
            >
              <SpecLine
                k={k}
                keyText="user"
                keyColor={ORANGE}
                value={
                  handleText
                    ? authorName
                      ? `${authorName} @${handleText}`
                      : `@${handleText}`
                    : (authorName ?? "guest")
                }
              />
              <SpecLine
                k={k}
                keyText="stack"
                keyColor={ORANGE}
                value={`${toolCount} tools · ${sectionCount} sections`}
              />
              {sections.map((s) => (
                <SpecLine
                  key={s.type}
                  k={k}
                  keyText={s.name.toLowerCase()}
                  keyColor={FETCH_HUE[s.type] ?? FETCH_HUE.other}
                  value={truncate(s.tools.map((t) => t.name).join(" · "), 42)}
                />
              ))}
              {/* palette strip */}
              <div style={scaleStyle({ display: "flex", gap: 10 }, k)}>
                {FETCH_PALETTE.map((c, i) => (
                  <div
                    key={i}
                    style={scaleStyle(
                      {
                        display: "flex",
                        width: 46,
                        height: 26,
                        borderRadius: 8,
                        background: c,
                      },
                      k
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* footer */}
        {showWatermark && (
          <div
            style={scaleStyle(
              {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "auto",
                paddingTop: 18,
              },
              k
            )}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {/* the Google-subset TTF has no U+2713, so a prompt-style marker */}
              <span style={{ color: "#5BA35B" }}>&gt;</span>
              <span style={scaleStyle({ color: IVORY, marginLeft: 12 }, k)}>
                {footerUrl}
              </span>
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

function SpecLine({
  k,
  keyText,
  keyColor,
  value,
}: {
  k: number;
  keyText: string;
  keyColor: string;
  value: string;
}) {
  return (
    <div style={{ display: "flex" }}>
      <div
        style={scaleStyle(
          {
            display: "flex",
            width: 150,
            flexShrink: 0,
            fontWeight: 700,
            color: keyColor,
          },
          k
        )}
      >
        {keyText}
      </div>
      <div style={{ display: "flex", color: IVORY }}>{value}</div>
    </div>
  );
}

// ===========================================================================
// 03 LID — "OS editions": a laptop lid covered in tool stickers.
// ===========================================================================

function LidCard({ data, fonts, k }: ThemeProps) {
  const edition = data.lidEdition;
  const fin = LID_FINISH[edition];
    const stickers = getStickerLayout(data);
  const identity = getIdentityLayout(data);

  const caption = `${
    data.handleText
      ? `SUPERSTACKS.DEV/${data.handleText.toUpperCase()}`
      : "SUPERSTACKS.DEV"
  } · ${data.toolCount} ${data.toolCount === 1 ? "TOOL" : "TOOLS"}`;

  const hardShadow = `0 5px 0 rgba(0,0,0,${fin.shadow})`;

  return (
    <div
      style={scaleStyle(
        {
          display: "flex",
          position: "relative",
          width: "100%",
          height: "100%",
          background: fin.bg,
          borderRadius: 40,
          overflow: "hidden",
        },
        k
      )}
    >
      {/* center OS mark at (50%, 47%) */}
      {edition === "microsoft" ? (
        <div
          style={scaleStyle(
            {
              display: "flex",
              flexWrap: "wrap",
              position: "absolute",
              width: 132,
              height: 132,
              gap: 12,
              left: LID_MARK_CX - 66,
              top: LID_MARK_CY - 66,
            },
            k
          )}
        >
          {["#F25022", "#7FBA00", "#00A4EF", "#FFB900"].map((c) => (
            <div
              key={c}
              style={scaleStyle(
                { display: "flex", width: 60, height: 60, background: c },
                k
              )}
            />
          ))}
        </div>
      ) : (
        <svg
          viewBox="0 0 24 24"
          width={fin.markSize * k}
          height={fin.markSize * k}
          style={scaleStyle(
            {
              position: "absolute",
              left: LID_MARK_CX - fin.markSize / 2,
              top: LID_MARK_CY - fin.markSize / 2,
            },
            k
          )}
        >
          <path d={LID_MARK_PATHS[edition]} fill={fin.markColor} />
        </svg>
      )}

      {/* tool stickers */}
      {stickers.map((s) => (
        <Sticker key={s.toolId} s={s} fonts={fonts} k={k} shadow={hardShadow} />
      ))}

      {/* identity sticker — always on top so it stays legible */}
      <div
        style={scaleStyle(
          {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            position: "absolute",
            left: stickerLeft(identity.x, identity.w),
            top: stickerTop(identity.y, identity.h),
            width: identity.w,
            height: identity.h,
            background: "#FFFDF8",
            border: `2.5px solid ${INK}`,
            borderRadius: 26,
            boxShadow: hardShadow,
          },
          k
        )}
      >
        <div
          style={scaleStyle(
            {
              display: "flex",
              fontFamily: fonts.mono,
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: 6,
              color: TAUPE,
            },
            k
          )}
        >
          {identity.label}
        </div>
        <div
          style={scaleStyle(
            {
              display: "flex",
              fontSize: 40,
              fontWeight: 900,
              letterSpacing: -1,
              color: INK,
            },
            k
          )}
        >
          {identity.name}
        </div>
      </div>

      {/* caption band */}
      <div
        style={scaleStyle(
          {
            display: "flex",
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: LID_CAPTION_H,
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonts.mono,
            fontSize: 19,
            fontWeight: 700,
            letterSpacing: 4,
            color: fin.caption,
          },
          k
        )}
      >
        {caption}
      </div>

      {/* brand mark, bottom-right corner */}
      {data.showWatermark && (
        <div
          style={scaleStyle(
            { display: "flex", position: "absolute", right: 24, bottom: 22 },
            k
          )}
        >
          <Logomark size={34 * k} />
        </div>
      )}
    </div>
  );
}

function Sticker({
  s,
  fonts,
  k,
  shadow,
}: {
  s: LidSticker;
  fonts: CardFonts;
  k: number;
  shadow: string;
}) {
  const isMore = s.toolId === OVERFLOW_STICKER_ID;
  const base: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    left: stickerLeft(s.x, s.w),
    top: stickerTop(s.y, s.h),
    width: s.w,
    height: s.h,
    background: "#FFFDF8",
    border: isMore ? "2px dashed #D9A16B" : `2px solid ${INK}`,
    boxShadow: shadow,
    transform: `rotate(${s.rotation}deg)`,
    borderRadius:
      s.shape === "circle" ? s.w : s.shape === "pill" ? s.h : s.w * 0.22,
  };

  if (s.shape === "pill") {
    return (
      <div style={scaleStyle({ ...base, gap: 12 }, k)}>
        {isMore ? (
          <div
            style={scaleStyle(
              {
                display: "flex",
                fontFamily: fonts.mono,
                fontSize: 21,
                fontWeight: 700,
                letterSpacing: 2,
                color: ORANGE,
              },
              k
            )}
          >
            {s.name}
          </div>
        ) : (
          <>
            <Logo
              tool={{ toolId: s.toolId, name: s.name, logo: s.logoSrc, letter: s.letter }}
              size={42}
              k={k}
            />
            <div
              style={scaleStyle(
                {
                  display: "flex",
                  fontSize: 25,
                  fontWeight: 900,
                  letterSpacing: 0.5,
                  color: INK,
                },
                k
              )}
            >
              {s.name.toUpperCase()}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={scaleStyle(base, k)}>
      <Logo
        tool={{ toolId: s.toolId, name: s.name, logo: s.logoSrc, letter: s.letter }}
        size={Math.round(s.w * 0.54)}
        k={k}
      />
    </div>
  );
}
