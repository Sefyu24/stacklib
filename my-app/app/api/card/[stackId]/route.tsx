import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  getCardSections,
  getCardStats,
  DisplaySectionInput,
  DisplaySection,
} from "@/lib/card/display";
import { toolLogoUrl } from "@/lib/logo";

export const runtime = "nodejs";

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const LOGO_FETCH_TIMEOUT_MS = 1500;

// Same faces the live preview uses in the browser (loaded there via
// next/font). Satori can't see browser fonts, so the PNG only matches the
// preview if we hand it the raw font data ourselves.
type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700 | 900;
  style: "normal";
};

let fontsPromise: Promise<OgFont[]> | null = null;

function loadFonts(): Promise<OgFont[]> {
  fontsPromise ??= (async () => {
    const dir = path.join(process.cwd(), "assets", "fonts");
    const read = async (
      file: string,
      name: string,
      weight: OgFont["weight"]
    ): Promise<OgFont> => {
      const buf = await readFile(path.join(dir, file));
      return {
        name,
        data: buf.buffer.slice(
          buf.byteOffset,
          buf.byteOffset + buf.byteLength
        ) as ArrayBuffer,
        weight,
        style: "normal",
      };
    };
    return Promise.all([
      read("Archivo-500.ttf", "Archivo", 500),
      read("Archivo-600.ttf", "Archivo", 600),
      read("Archivo-700.ttf", "Archivo", 700),
      read("Archivo-900.ttf", "Archivo", 900),
      read("JetBrainsMono-400.ttf", "JetBrains Mono", 400),
      read("JetBrainsMono-700.ttf", "JetBrains Mono", 700),
    ]);
  })();
  return fontsPromise;
}

// Warm palette (matches the live preview tokens)
const CREAM = "#F6F1E8";
const INK = "#1C1712";
const ORANGE = "#EC5B13";
const TAUPE = "#B4A78E";

type RenderTool = {
  name: string;
  logo: string | null;
  letter: string;
};
type RenderSection = { name: string; type: string; tools: RenderTool[] };

/** Fetch a logo and return a data URI satori can render (png/jpeg/gif/svg). */
async function fetchLogoAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(LOGO_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 12) return null;

    let mime: string | null = null;
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e) mime = "image/png";
    else if (buf[0] === 0xff && buf[1] === 0xd8) mime = "image/jpeg";
    else if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) mime = "image/gif";
    else {
      const head = buf.subarray(0, 256).toString("utf8").trimStart();
      if (head.startsWith("<svg") || head.startsWith("<?xml")) mime = "image/svg+xml";
    }
    if (!mime) return null;
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function truncate(name: string, max = 22): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

// A logo image, or a warm letter-tile fallback.
function Logo({ tool, size }: { tool: RenderTool; size: number }) {
  if (tool.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={tool.logo}
        alt=""
        width={size}
        height={size}
        style={{ borderRadius: size * 0.24, objectFit: "contain" }}
      />
    );
  }
  return (
    <div
      style={{
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
      }}
    >
      {tool.letter}
    </div>
  );
}

function Chunky({
  children,
  style,
}: {
  children: React.ReactNode;
  style: React.CSSProperties;
}) {
  return (
    <div
      style={{
        border: `2px solid ${INK}`,
        borderRadius: 20,
        boxShadow: `0 5px 0 ${INK}`,
        display: "flex",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ stackId: string }> }
) {
  const { stackId } = await params;
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  let stack;
  try {
    stack = await convex.query(api.stacks.getStack, {
      stackId: stackId as Id<"stacks">,
    });
  } catch {
    return new Response("Stack not found", { status: 404 });
  }

  const displayInput = stack.sections as unknown as DisplaySectionInput[];
  const display: DisplaySection[] = getCardSections(displayInput);
  const stats = getCardStats(displayInput);
  const statLabel = stats.label;
  const overflow = stats.overflow;
  const theme = (stack.cardTheme as "minimal" | "bento" | "terminal") ?? "minimal";
  const showWatermark = stack.showWatermark ?? true;
  const isEmpty = display.length === 0;

  // Satori can't reliably fetch remote avatars, so resolve to a data URI here.
  const avatarSrc =
    stack.authorAvatarUrl && stack.showAvatar !== false
      ? await fetchLogoAsDataUri(stack.authorAvatarUrl)
      : null;

  // Resolve logos server-side (Simple Icons SVG or Brandfetch png).
  const sections: RenderSection[] = await Promise.all(
    display.map(async (section) => {
      const tools = await Promise.all(
        section.tools.map(async (t) => {
          const url = toolLogoUrl(t, { png: true });
          const logo = url ? await fetchLogoAsDataUri(url) : null;
          return {
            name: truncate(t.name),
            logo,
            letter: t.name[0]?.toUpperCase() ?? "?",
          };
        })
      );
      return { name: section.name, type: section.sectionType, tools };
    })
  );

  const card =
    theme === "bento" ? (
      <BentoCard
        stackName={stack.name}
        statLabel={statLabel}
        sections={sections}
        showWatermark={showWatermark}
        isEmpty={isEmpty}
        overflow={overflow}
        subtitle={stack.subtitle || undefined}
        authorName={stack.authorName}
        authorHandle={stack.authorHandle}
        avatarSrc={avatarSrc}
        showAvatar={stack.showAvatar ?? true}
      />
    ) : theme === "terminal" ? (
      <TerminalCard
        stackName={stack.name}
        statLabel={statLabel}
        sections={sections}
        showWatermark={showWatermark}
        isEmpty={isEmpty}
        overflow={overflow}
        subtitle={stack.subtitle || undefined}
        authorName={stack.authorName}
        authorHandle={stack.authorHandle}
        avatarSrc={avatarSrc}
        showAvatar={stack.showAvatar ?? true}
      />
    ) : (
      <MinimalCard
        stackName={stack.name}
        statLabel={statLabel}
        sections={sections}
        showWatermark={showWatermark}
        isEmpty={isEmpty}
        overflow={overflow}
        subtitle={stack.subtitle || undefined}
        authorName={stack.authorName}
        authorHandle={stack.authorHandle}
        avatarSrc={avatarSrc}
        showAvatar={stack.showAvatar ?? true}
      />
    );

  const fonts = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: CREAM,
          padding: 30,
          fontFamily: "Archivo",
        }}
      >
        {card}
      </div>
    ),
    {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fonts,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}

interface CardProps {
  stackName: string;
  statLabel: string;
  sections: RenderSection[];
  showWatermark: boolean;
  isEmpty: boolean;
  /** Tools that didn't fit on the card */
  overflow: number;
  /** Optional one-line tagline rendered under the title */
  subtitle?: string;
  authorName?: string;
  authorHandle?: string;
  /** Resolved avatar image source (data URI) */
  avatarSrc?: string | null;
  showAvatar?: boolean;
}

// Small identity row under the header: avatar + display name + @handle.
function IdentityRowOg({
  authorName,
  authorHandle,
  avatarSrc,
  showAvatar,
  handleColor,
}: {
  authorName?: string;
  authorHandle?: string;
  avatarSrc?: string | null;
  showAvatar?: boolean;
  handleColor: string;
}) {
  if (!authorName && !authorHandle) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginTop: 10,
      }}
    >
      {showAvatar !== false && avatarSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarSrc}
          alt=""
          width={30}
          height={30}
          style={{ borderRadius: 999, objectFit: "cover" }}
        />
      )}
      {authorName && (
        <div style={{ display: "flex", fontSize: 20, fontWeight: 600, color: INK }}>
          {authorName}
        </div>
      )}
      {authorHandle && (
        <div
          style={{
            display: "flex",
            fontFamily: "JetBrains Mono",
            fontSize: 17,
            color: handleColor,
          }}
        >
          @{authorHandle}
        </div>
      )}
    </div>
  );
}

// Non-interactive "+K more" chip for the PNG (links can't be clicked in an image)
function MoreChipOg({
  overflow,
  color = "#EC5B13",
  border = "#D9A16B",
}: {
  overflow: number;
  color?: string;
  border?: string;
}) {
  if (overflow <= 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignSelf: "flex-start",
        alignItems: "center",
        border: `1.5px dashed ${border}`,
        borderRadius: 10,
        padding: "6px 13px",
        fontSize: 18,
        fontWeight: 600,
        color,
      }}
    >
      +{overflow} more
    </div>
  );
}

function Wordmark({ color = ORANGE }: { color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: "JetBrains Mono",
        fontSize: 21,
        fontWeight: 700,
        letterSpacing: 6,
        color,
      }}
    >
      SUPERSTACK
    </div>
  );
}

function EmptyBody() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: INK }}>
        This stack is still brewing
      </div>
      <div style={{ display: "flex", fontSize: 22, color: TAUPE }}>
        Build yours at superstack.app
      </div>
    </div>
  );
}

function MinimalCard({
  stackName,
  statLabel,
  sections,
  showWatermark,
  isEmpty,
  overflow,
  subtitle,
  authorName,
  authorHandle,
  avatarSrc,
  showAvatar,
}: CardProps) {
  return (
    <Chunky style={{ background: "#FBF7F0", padding: 12, width: "100%", height: "100%" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "#FFFDF8",
          border: "1px solid #EDE4D2",
          borderRadius: 12,
          padding: "22px 38px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Wordmark />
          {!isEmpty && (
            <div
              style={{
                display: "flex",
                fontFamily: "JetBrains Mono",
                fontSize: 19,
                color: TAUPE,
              }}
            >
              {statLabel}
            </div>
          )}
        </div>
        <IdentityRowOg
          authorName={authorName}
          authorHandle={authorHandle}
          avatarSrc={avatarSrc}
          showAvatar={showAvatar}
          handleColor={TAUPE}
        />
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            fontSize: 38,
            fontWeight: 900,
            letterSpacing: -1,
            color: INK,
            marginTop: 4,
            marginBottom: 12,
          }}
        >
          {truncate(stackName, 34)}
        </div>
        {subtitle && (
          <div
            style={{
              display: "flex",
              flexShrink: 0,
              fontSize: 20,
              color: "#8A7B63",
              marginTop: -6,
              marginBottom: 14,
            }}
          >
            {subtitle}
          </div>
        )}
        {isEmpty ? (
          <EmptyBody />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              minHeight: 0,
              overflow: "hidden",
              gap: 11,
            }}
          >
            {sections.map((s) => (
              <div key={s.type} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <div
                  style={{
                    display: "flex",
                    fontFamily: "JetBrains Mono",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 3,
                    color: TAUPE,
                  }}
                >
                  {s.name.toUpperCase()}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                  {s.tools.map((t, i) => (
                    <div
                      key={i}
                      style={{
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
                      }}
                    >
                      <Logo tool={t} size={24} />
                      {t.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <MoreChipOg overflow={overflow} />
          </div>
        )}
        {showWatermark && (
          <div
            style={{
              display: "flex",
              flexShrink: 0,
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #EDE4D2",
              paddingTop: 16,
              marginTop: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "JetBrains Mono",
                fontSize: 18,
                color: TAUPE,
              }}
            >
              superstack.app
            </div>
            <div
              style={{
                display: "flex",
                width: 30,
                height: 30,
                borderRadius: 8,
                background: ORANGE,
                color: "#FFF7EE",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 17,
              }}
            >
              S
            </div>
          </div>
        )}
      </div>
    </Chunky>
  );
}

function BentoCard({
  stackName,
  statLabel,
  sections,
  showWatermark,
  isEmpty,
  overflow,
  subtitle,
  authorName,
  authorHandle,
  avatarSrc,
  showAvatar,
}: CardProps) {
  // Grouped by category with one label per section; compact horizontal
  // tiles so every rendered tool fits the fixed 630px frame.
  return (
    <Chunky
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
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Wordmark />
        {!isEmpty && (
          <div
            style={{
              display: "flex",
              fontFamily: "JetBrains Mono",
              fontSize: 19,
              color: "#A0713C",
            }}
          >
            {statLabel}
          </div>
        )}
      </div>
      <IdentityRowOg
        authorName={authorName}
        authorHandle={authorHandle}
        avatarSrc={avatarSrc}
        showAvatar={showAvatar}
        handleColor="#A0713C"
      />
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          fontSize: 40,
          fontWeight: 900,
          letterSpacing: -1,
          color: INK,
          marginTop: 4,
          marginBottom: 14,
        }}
      >
        {truncate(stackName, 34)}
      </div>
      {subtitle && (
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            fontSize: 20,
            color: "#8A7B63",
            marginTop: -6,
            marginBottom: 14,
          }}
        >
          {subtitle}
        </div>
      )}
      {isEmpty ? (
        <EmptyBody />
      ) : (
        <div
          style={{
            display: "flex",
            gap: 12,
            flexGrow: 1,
            minHeight: 0,
            overflow: "hidden",
            alignItems: "stretch",
          }}
        >
          {sections.map((s) => (
            <div
              key={s.type}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                flex: 1,
                minWidth: 0,
                background: "rgba(255,253,248,0.45)",
                border: "1px solid #E4D5BB",
                borderRadius: 14,
                padding: "12px 10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  fontFamily: "JetBrains Mono",
                  fontSize: 11.5,
                  fontWeight: 700,
                  letterSpacing: 2.5,
                  color: "#A0713C",
                }}
              >
                {s.name.toUpperCase()}
              </div>
              {s.tools.map((t, i) => (
                <div
                  key={i}
                  style={{
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
                  }}
                >
                  <Logo tool={t} size={24} />
                  {truncate(t.name, 13)}
                </div>
              ))}
            </div>
          ))}
          <MoreChipOg overflow={overflow} border="#C9A87A" color="#A0713C" />
        </div>
      )}
      {showWatermark && (
        <div style={{ display: "flex", flexShrink: 0, justifyContent: "center", marginTop: 12 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "JetBrains Mono",
              fontSize: 18,
              color: "#A0713C",
            }}
          >
            superstack.app
          </div>
        </div>
      )}
    </Chunky>
  );
}

function TerminalCard({
  stackName,
  statLabel,
  sections,
  showWatermark,
  isEmpty,
  overflow,
  subtitle,
  authorName,
  authorHandle,
}: CardProps) {
  const title = `${stackName.toLowerCase().replace(/\s+/g, "-")}.sh`;
  return (
    <Chunky
      style={{
        background: "#16110B",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "16px 24px",
          borderBottom: "1px solid #2C2418",
        }}
      >
        <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, background: "#E5533C" }} />
        <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, background: "#E5A93C" }} />
        <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, background: "#5BA35B" }} />
        <div
          style={{
            display: "flex",
            marginLeft: "auto",
            fontFamily: "JetBrains Mono",
            fontSize: 15,
            color: "#6B5D46",
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "30px 36px",
          fontFamily: "JetBrains Mono",
          fontSize: 22,
          lineHeight: 1.9,
          flexGrow: 1,
        }}
      >
        <div style={{ display: "flex", color: "#C9BCA2" }}>
          <span style={{ color: ORANGE }}>~</span>
          <span style={{ color: "#5BA35B", marginLeft: 12 }}>$</span>
          <span style={{ marginLeft: 12 }}>superstack show</span>
          <span style={{ color: "#8A7B63", marginLeft: 12 }}>--pinned</span>
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
            {sections.map((s) => (
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
            <div style={{ display: "flex", color: "#5BA35B", marginTop: 4 }}>
              {/* the Google-subset TTF has no U+2713, so use a prompt-style marker */}
              <span style={{ marginRight: 12 }}>&gt;</span>
              {statLabel}
            </div>
            {overflow > 0 && (
              <div style={{ display: "flex", color: "#6B5D46" }}>
                # +{overflow} more on superstack.app
              </div>
            )}
          </div>
        )}
        {showWatermark && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: "#6B5D46",
              marginTop: "auto",
            }}
          >
            superstack.app
            <span
              style={{
                display: "flex",
                width: 12,
                height: 22,
                background: ORANGE,
                marginLeft: 8,
              }}
            />
          </div>
        )}
      </div>
    </Chunky>
  );
}
