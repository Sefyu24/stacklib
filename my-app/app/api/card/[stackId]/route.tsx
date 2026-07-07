import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DisplaySectionInput, getCardSections } from "@/lib/card/display";
import {
  buildCardRenderData,
  getCardThemeKey,
  getLidEdition,
} from "@/lib/card/render";
import { toolLogoUrl } from "@/lib/logo";
import {
  CardArt,
  CARD_WIDTH,
  CARD_HEIGHT,
  OG_CARD_FONTS,
} from "@/components/card/cardArt";

export const runtime = "nodejs";

const LOGO_FETCH_TIMEOUT_MS = 5000;

// Same faces the live preview uses in the browser (loaded there via
// next/font). Satori can't see browser fonts, so the PNG only matches the
// preview if we hand it the raw font data ourselves.
type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700 | 900;
  style: "normal" | "italic";
};

let fontsPromise: Promise<OgFont[]> | null = null;

function loadFonts(): Promise<OgFont[]> {
  fontsPromise ??= (async () => {
    const dir = path.join(process.cwd(), "assets", "fonts");
    const read = async (
      file: string,
      name: string,
      weight: OgFont["weight"],
      style: OgFont["style"] = "normal"
    ): Promise<OgFont> => {
      const buf = await readFile(path.join(dir, file));
      return {
        name,
        data: buf.buffer.slice(
          buf.byteOffset,
          buf.byteOffset + buf.byteLength
        ) as ArrayBuffer,
        weight,
        style,
      };
    };
    return Promise.all([
      read("Archivo-500.ttf", "Archivo", 500),
      read("Archivo-600.ttf", "Archivo", 600),
      read("Archivo-700.ttf", "Archivo", 700),
      read("Archivo-900.ttf", "Archivo", 900),
      read("JetBrainsMono-400.ttf", "JetBrains Mono", 400),
      read("JetBrainsMono-700.ttf", "JetBrains Mono", 700),
      read("EBGaramond-Italic-600.ttf", "EB Garamond", 600, "italic"),
    ]);
  })();
  return fontsPromise;
}

/** Fetch a logo and return a data URI satori can render (png/jpeg/gif/svg). */
async function fetchLogoAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(LOGO_FETCH_TIMEOUT_MS),
      headers: { "User-Agent": "Superstacks/1.0 (+https://superstacks.dev)" },
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ stackId: string }> }
) {
  const { stackId } = await params;

  // ?scale=2 renders the same vector tree at 2400x1260 for crisp downloads;
  // the default stays 1x for OG embeds. Anything else falls back to 1.
  const scale =
    new URL(request.url).searchParams.get("scale") === "2" ? 2 : 1;

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

  // Satori can't reliably fetch remote images, so resolve every logo (and the
  // avatar) to a data URI up front, then let the shared assembly consume them.
  const logoByToolId = new Map<string, string | null>();
  await Promise.all(
    getCardSections(displayInput).flatMap((section) =>
      section.tools.map(async (t) => {
        const url = toolLogoUrl(t, { png: true });
        logoByToolId.set(t.toolId, url ? await fetchLogoAsDataUri(url) : null);
      })
    )
  );

  const avatarSrc =
    stack.authorAvatarUrl && stack.showAvatar !== false
      ? await fetchLogoAsDataUri(stack.authorAvatarUrl)
      : null;

  // The lid's center OS mark renders from inline SVG paths (LID_MARK_PATHS)
  // — no network fetch, which failed intermittently from Vercel.

  const data = buildCardRenderData(
    {
      name: stack.name,
      subtitle: stack.subtitle,
      sections: displayInput,
      cardTheme: stack.cardTheme,
      showWatermark: stack.showWatermark,
      showAvatar: stack.showAvatar,
      authorName: stack.authorName,
      authorHandle: stack.authorHandle,
      lidEdition: stack.lidEdition,
      stickerSeed: stack.stickerSeed,
      stickerPositions: stack.stickerPositions,
    },
    (t) => logoByToolId.get(t.toolId) ?? null,
    avatarSrc
  );

  const fonts = await loadFonts();

  return new ImageResponse(
    // `scale` multiplies every px value inside the art (satori re-lays-out the
    // same design at 2x), so text and the logomark stay vector-crisp instead
    // of upsampling a 1200px raster.
    <CardArt data={data} fonts={OG_CARD_FONTS} scale={scale} />,
    {
      width: CARD_WIDTH * scale,
      height: CARD_HEIGHT * scale,
      fonts,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
