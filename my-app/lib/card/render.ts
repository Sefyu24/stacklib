// Shared card render-data assembly. One function turns a stack (plus a
// logo resolver) into the exact structure the card art renders, so the live
// preview and the OG PNG route can never drift apart: the OG route resolves
// logos to data URIs, the browser preview resolves to plain URLs, and
// everything else — order, caps, stats, truncation — is decided here once.
//
// This module also owns the LID sticker layout engine: a pure, seeded
// (mulberry32) scatter that both the PNG renderer and the preview drag layer
// consume, so a sticker sits on the exact same spot in every render.

import {
  DisplaySectionInput,
  DisplayTool,
  getCardSections,
  getCardStats,
} from "./display";

export type CardThemeKey = "minimal" | "lid" | "terminal";
export const CARD_THEME_KEYS: CardThemeKey[] = ["minimal", "lid", "terminal"];

export type LidEdition = "apple" | "microsoft" | "linux";

/**
 * OS mark glyphs inlined as SVG path data (viewBox 0 0 24 24, Simple
 * Icons). Fetching these at render time fails intermittently from
 * Vercel, which silently dropped the center mark from production
 * cards — inline paths render deterministically in browser and satori.
 */
export const LID_MARK_PATHS: Record<string, string> = {
  apple: "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701",
  linux: "M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 01.016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 01-.448-.067 3.566 3.566 0 01-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.043c-.06-.003-.12 0-.18 0h-.016c.151-.467-.182-.825-1.065-1.224-.915-.4-1.646-.336-1.77.465-.008.043-.013.066-.018.135-.068.023-.139.053-.209.064-.43.268-.662.669-.793 1.187-.13.533-.17 1.156-.205 1.869v.003c-.02.334-.17.838-.319 1.35-1.5 1.072-3.58 1.538-5.348.334a2.645 2.645 0 00-.402-.533 1.45 1.45 0 00-.275-.333c.182 0 .338-.03.465-.067a.615.615 0 00.314-.334c.108-.267 0-.697-.345-1.163-.345-.467-.931-.995-1.788-1.521-.63-.4-.986-.87-1.15-1.396-.165-.534-.143-1.085-.015-1.645.245-1.07.873-2.11 1.274-2.763.107-.065.037.135-.408.974-.396.751-1.14 2.497-.122 3.854a8.123 8.123 0 01.647-2.876c.564-1.278 1.743-3.504 1.836-5.268.048.036.217.135.289.202.218.133.38.333.59.465.21.201.477.335.876.335.039.003.075.006.11.006.412 0 .73-.134.997-.268.29-.134.52-.334.74-.4h.005c.467-.135.835-.402 1.044-.7zm2.185 8.958c.037.6.343 1.245.882 1.377.588.134 1.434-.333 1.791-.765l.211-.01c.315-.007.577.01.847.268l.003.003c.208.199.305.53.391.876.085.4.154.78.409 1.066.486.527.645.906.636 1.14l.003-.007v.018l-.003-.012c-.015.262-.185.396-.498.595-.63.401-1.746.712-2.457 1.57-.618.737-1.37 1.14-2.036 1.191-.664.053-1.237-.2-1.574-.898l-.005-.003c-.21-.4-.12-1.025.056-1.69.176-.668.428-1.344.463-1.897.037-.714.076-1.335.195-1.814.12-.465.308-.797.641-.984l.045-.022zm-10.814.049h.01c.053 0 .105.005.157.014.376.055.706.333 1.023.752l.91 1.664.003.003c.243.533.754 1.064 1.189 1.637.434.598.77 1.131.729 1.57v.006c-.057.744-.48 1.148-1.125 1.294-.645.135-1.52.002-2.395-.464-.968-.536-2.118-.469-2.857-.602-.369-.066-.61-.2-.723-.4-.11-.2-.113-.602.123-1.23v-.004l.002-.003c.117-.334.03-.752-.027-1.118-.055-.401-.083-.71.043-.94.16-.334.396-.4.69-.533.294-.135.64-.202.915-.47h.002v-.002c.256-.268.445-.601.668-.838.19-.201.38-.336.663-.336zm7.159-9.074c-.435.201-.945.535-1.488.535-.542 0-.97-.267-1.28-.466-.154-.134-.28-.268-.373-.335-.164-.134-.144-.333-.074-.333.109.016.129.134.199.2.096.066.215.2.36.333.292.2.68.467 1.167.467.485 0 1.053-.267 1.398-.466.195-.135.445-.334.648-.467.156-.136.149-.267.279-.267.128.016.034.134-.147.332a8.097 8.097 0 01-.69.468zm-1.082-1.583V5.64c-.006-.02.013-.042.029-.05.074-.043.18-.027.26.004.063 0 .16.067.15.135-.006.049-.085.066-.135.066-.055 0-.092-.043-.141-.068-.052-.018-.146-.008-.163-.065zm-.551 0c-.02.058-.113.049-.166.066-.047.025-.086.068-.14.068-.05 0-.13-.02-.136-.068-.01-.066.088-.133.15-.133.08-.031.184-.047.259-.005.019.009.036.03.03.05v.02h.003z",
};
export const LID_EDITIONS: LidEdition[] = ["apple", "microsoft", "linux"];

/**
 * Center OS mark artwork per edition (Simple Icons CDN, tinted to the
 * edition's finish). Microsoft is drawn as four flat squares in the
 * renderer, so it has no artwork URL. The OG route pre-fetches this to a
 * data URI (satori can't fetch reliably); the browser preview uses the URL.
 */
export const LID_MARK_URL: Record<LidEdition, string | null> = {
  apple: "https://cdn.simpleicons.org/apple/C9C2B6",
  microsoft: null,
  linux: "https://cdn.simpleicons.org/linux/F0E6D2",
};

export function truncate(name: string, max = 22): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

export function getLidEdition(edition: string | null | undefined): LidEdition {
  return LID_EDITIONS.includes(edition as LidEdition)
    ? (edition as LidEdition)
    : "apple";
}

export interface CardRenderTool {
  /** Convex tool id — keys sticker positions and the per-tool style hash */
  toolId: string;
  name: string;
  /** Resolved logo source (data URI on the OG path, plain URL in the browser) */
  logo: string | null;
  /** Letter-tile fallback when no logo resolves */
  letter: string;
}

export interface CardRenderSection {
  name: string;
  type: string;
  tools: CardRenderTool[];
}

export interface CardRenderData {
  theme: CardThemeKey;
  stackName: string;
  subtitle?: string;
  statLabel: string;
  /** Tools that didn't fit on the card */
  overflow: number;
  isEmpty: boolean;
  showWatermark: boolean;
  showAvatar: boolean;
  authorName?: string;
  authorHandle?: string;
  /** Footer handle: authorHandle or null (renderers fall back to plain "superstacks.dev") */
  handleText: string | null;
  /** All selected tools across the stack (stackfetch spec sheet) */
  toolCount: number;
  /** Sections that actually render tools (stackfetch spec sheet) */
  sectionCount: number;
  /** Resolved avatar source (data URI on the OG path, plain URL in the browser) */
  avatarSrc: string | null;
  // Lid theme -------------------------------------------------------------
  lidEdition: LidEdition;
  /** Seed for the deterministic sticker scatter (mulberry32) */
  stickerSeed: number;
  /** User-dragged sticker positions (normalized 0..1), keyed by toolId */
  stickerPositions: Record<string, { x: number; y: number }>;
  stickerModes: Record<string, string>;
  /** Pre-resolved center OS mark (data URI on the OG path); null = use LID_MARK_URL */
  lidMarkSrc: string | null;
  sections: CardRenderSection[];
}

/** The stack fields the card needs — a subset of getStack's return shape. */
export interface CardStackInput {
  name: string;
  subtitle?: string | null;
  sections: DisplaySectionInput[];
  cardTheme?: string | null;
  showWatermark?: boolean | null;
  showAvatar?: boolean | null;
  authorName?: string;
  authorHandle?: string;
  lidEdition?: string | null;
  stickerSeed?: number | null;
  stickerPositions?: Record<string, { x: number; y: number }> | null;
  stickerModes?: Record<string, string> | null;
}

export type LogoResolver = (tool: DisplayTool) => string | null;

export function getCardThemeKey(theme: string | null | undefined): CardThemeKey {
  return CARD_THEME_KEYS.includes(theme as CardThemeKey)
    ? (theme as CardThemeKey)
    : "minimal";
}

export function buildCardRenderData(
  stack: CardStackInput,
  resolveLogo: LogoResolver,
  avatarSrc: string | null = null,
  lidMarkSrc: string | null = null
): CardRenderData {
  const display = getCardSections(stack.sections);
  const stats = getCardStats(stack.sections);

  return {
    theme: getCardThemeKey(stack.cardTheme),
    stackName: stack.name,
    subtitle: stack.subtitle || undefined,
    statLabel: stats.label,
    overflow: stats.overflow,
    isEmpty: display.length === 0,
    showWatermark: stack.showWatermark ?? true,
    showAvatar: stack.showAvatar ?? true,
    authorName: stack.authorName,
    authorHandle: stack.authorHandle,
    handleText: stack.authorHandle?.trim() || null,
    toolCount: stats.total,
    sectionCount: display.length,
    avatarSrc,
    lidEdition: getLidEdition(stack.lidEdition),
    stickerSeed: stack.stickerSeed ?? 1,
    stickerPositions: stack.stickerPositions ?? {},
    stickerModes: stack.stickerModes ?? {},
    lidMarkSrc,
    sections: display.map((s) => ({
      name: s.name,
      type: s.sectionType,
      tools: s.tools.map((t) => ({
        toolId: t.toolId,
        name: truncate(t.name),
        logo: resolveLogo(t),
        letter: t.name[0]?.toUpperCase() ?? "?",
      })),
    })),
  };
}

// ===========================================================================
// LID sticker layout engine
// ===========================================================================
//
// Everything below is PURE and DETERMINISTIC: same data in, same layout out,
// in the browser preview and in satori alike. No Math.random, no Date.now —
// all randomness flows from mulberry32 seeded by
//   stickerSeed ^ fnv1a(toolId)
// so a sticker's look (shape / size / rotation) is a function of the tool
// alone and NEVER changes when it (or any other sticker) is dragged.

/** The lid canvas the normalized sticker coordinates map onto (1x px). */
export const LID_W = 1200;
export const LID_H = 630;
/** Bottom caption band height — stickers never enter it. */
export const LID_CAPTION_H = 92;
/** Center OS mark anchor: (50%, 47%) of the lid. */
export const LID_MARK_CX = LID_W / 2;
export const LID_MARK_CY = LID_H * 0.47;
/** Hard cap of tool stickers on the lid; the rest fold into one "+N MORE". */
export const MAX_LID_STICKERS = 14;
/** Synthetic toolId of the overflow pill sticker. */
export const OVERFLOW_STICKER_ID = "__overflow";

/** mulberry32 — tiny seeded PRNG, uniform floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32-bit string hash (per-tool seed component). */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Position mapping — THE contract between the lid renderer and the preview
// drag layer. Positions are normalized (x, y) in 0..1 over the lid and are
// rendered as a top-left offset compensated by the sticker's own size:
//
//   left = x * (LID_W - w)        top = y * (LID_H - h)
//   x    = left / (LID_W - w)     y   = top / (LID_H - h)
//
// (0,0) puts the sticker flush with the lid's top-left corner, (1,1) flush
// with the bottom-right — a sticker can never leave the lid, and every
// render size (preview scale, 1x PNG, 2x PNG) agrees on the same spot.
// The drag layer MUST use these helpers, not its own math.

export function stickerLeft(x: number, w: number, lidW: number = LID_W): number {
  return x * (lidW - w);
}

export function stickerTop(y: number, h: number, lidH: number = LID_H): number {
  return y * (lidH - h);
}

export function stickerXFromLeft(
  left: number,
  w: number,
  lidW: number = LID_W
): number {
  const range = lidW - w;
  return range <= 0 ? 0 : clamp01(left / range);
}

export function stickerYFromTop(
  top: number,
  h: number,
  lidH: number = LID_H
): number {
  const range = lidH - h;
  return range <= 0 ? 0 : clamp01(top / range);
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export type LidStickerShape = "circle" | "square" | "pill";

export interface LidSticker {
  toolId: string;
  name: string;
  logoSrc: string | null;
  /** Letter fallback when logoSrc is null */
  letter: string;
  shape: LidStickerShape;
  /** Display mode: logo only, logo+name, or name only (double-click cycles) */
  mode: "logo" | "both" | "name";
  /** Size in 1x px on the 1200x630 lid */
  w: number;
  h: number;
  /** Degrees, -8..8 — from the tool hash, never from position */
  rotation: number;
  /** Normalized 0..1 (see the mapping contract above) */
  x: number;
  y: number;
}

export interface LidIdentityLayout {
  /** Normalized position (same mapping as stickers) */
  x: number;
  y: number;
  /** Size in 1x px */
  w: number;
  h: number;
  /** Eyebrow line, always "STACK OF" */
  label: string;
  /** Big line: authorHandle or authorName or the stack title */
  name: string;
}

/**
 * The identity sticker's default box (top-center). Exported so the scatter
 * and the preview drag layer share one geometry.
 */
export function getIdentityLayout(data: CardRenderData): LidIdentityLayout {
  const raw = data.handleText ?? data.authorName ?? data.stackName;
  const name = truncate(raw, 20);
  // Archivo 900 at 40px averages ~25px/char; padded and clamped.
  const w = Math.min(620, Math.max(280, Math.round(name.length * 25) + 110));
  const h = 124;
  return {
    x: 0.5,
    y: stickerYFromTop(40, h),
    w,
    h,
    label: "STACK OF",
    name,
  };
}

// Per-tool look: consumed rng calls are in a fixed order so the result is a
// stable function of (seed, toolId). `modeOverride` (a user choice via
// double-click, not seeded) picks what the sticker shows; rotation is drawn
// before the mode branch so it stays stable when the mode changes.
function stickerLook(
  rng: () => number,
  name: string,
  modeOverride: string | undefined
): {
  shape: LidStickerShape;
  mode: "logo" | "both" | "name";
  w: number;
  h: number;
  rotation: number;
} {
  const rPill = rng();
  const rShape = rng();
  const rSize = rng();
  const rRot = rng();
  const rotation = Math.round((rRot * 16 - 8) * 10) / 10;

  // Default preserves the original look: short names get a name+logo pill,
  // everything else is a logo-only circle/square.
  const defaultMode: "logo" | "both" =
    name.length <= 9 && rPill < 0.4 ? "both" : "logo";
  const mode: "logo" | "both" | "name" =
    modeOverride === "logo" ||
    modeOverride === "both" ||
    modeOverride === "name"
      ? modeOverride
      : defaultMode;

  if (mode === "name") {
    const w = Math.round(name.length * 17 + 52);
    return { shape: "pill", mode, w, h: 72, rotation };
  }
  if (mode === "both") {
    const w = Math.round(44 + 14 + name.length * 16.5 + 48);
    return { shape: "pill", mode, w, h: 88, rotation };
  }
  if (rShape < 0.55) {
    const d = Math.round(132 + rSize * 44); // 132–176
    return { shape: "circle", mode, w: d, h: d, rotation };
  }
  const s = Math.round(122 + rSize * 40); // 122–162
  return { shape: "square", mode, w: s, h: s, rotation };
}

/**
 * The lid's sticker layout: every card tool (same display selection as the
 * other themes) capped at MAX_LID_STICKERS, plus one "+N MORE" pill when
 * tools overflow. Look comes from the per-tool hash; position comes from
 * data.stickerPositions[toolId] when the user dragged it, otherwise from a
 * deterministic seeded scatter that avoids the center OS mark, the identity
 * sticker and the caption band (with a few relaxation passes to reduce
 * sticker-on-sticker overlap).
 *
 * The default scatter intentionally ignores stored positions: it is a pure
 * function of (tool set, seed), so dragging one sticker never moves another.
 */
export function getStickerLayout(data: CardRenderData): LidSticker[] {
  const seed = (data.stickerSeed ?? 1) >>> 0;
  const all = data.sections.flatMap((s) => s.tools);
  const shown = all.slice(0, MAX_LID_STICKERS);
  const extra = data.overflow + (all.length - shown.length);

  type Item = LidSticker & { left: number; top: number; rEff: number };

  const items: Item[] = shown.map((t) => {
    const look = stickerLook(
      mulberry32((seed ^ hashString(t.toolId)) >>> 0),
      t.name,
      data.stickerModes[t.toolId]
    );
    return {
      toolId: t.toolId,
      name: t.name,
      logoSrc: t.logo,
      letter: t.letter,
      ...look,
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      rEff: (look.w + look.h) / 4,
    };
  });

  if (extra > 0) {
    const name = `+${extra} MORE`;
    const rng = mulberry32((seed ^ hashString(OVERFLOW_STICKER_ID)) >>> 0);
    const w = Math.round(name.length * 15 + 64);
    items.push({
      toolId: OVERFLOW_STICKER_ID,
      name,
      logoSrc: null,
      letter: "+",
      shape: "pill",
      mode: "name",
      w,
      h: 66,
      rotation: Math.round((rng() * 16 - 8) * 10) / 10,
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      rEff: (w + 66) / 4,
    });
  }

  // --- default scatter -----------------------------------------------------
  const identity = getIdentityLayout(data);
  const idLeft = stickerLeft(identity.x, identity.w) - 14;
  const idTop = stickerTop(identity.y, identity.h) - 14;
  const idRight = idLeft + identity.w + 28;
  const idBottom = idTop + identity.h + 28;

  const EDGE = 10;
  const capTop = LID_H - LID_CAPTION_H; // stickers stay above the caption band

  // Initial position from a per-tool stream (independent of the look stream)
  // so adding/removing one tool doesn't reshuffle the others.
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const rng = mulberry32((seed ^ hashString(it.toolId) ^ 0x9e3779b9) >>> 0);
    it.left = EDGE + rng() * (LID_W - it.w - EDGE * 2);
    it.top = EDGE + rng() * (capTop - it.h - EDGE * 2);
  }

  const clampItem = (it: Item) => {
    it.left = Math.min(Math.max(it.left, EDGE), LID_W - it.w - EDGE);
    it.top = Math.min(Math.max(it.top, EDGE), capTop - it.h - EDGE);
  };

  for (let iter = 0; iter < 60; iter++) {
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      const acx = a.left + a.w / 2;
      const acy = a.top + a.h / 2;

      // (a) keep clear of the center OS mark disc
      const minMark = 108 + a.rEff * 0.9;
      let dx = acx - LID_MARK_CX;
      let dy = acy - LID_MARK_CY;
      let dist = Math.hypot(dx, dy);
      if (dist < minMark) {
        if (dist < 1e-6) {
          // deterministic escape direction (golden-angle by index)
          const ang = i * 2.399963229728653;
          dx = Math.cos(ang);
          dy = Math.sin(ang);
          dist = 1;
        }
        const push = (minMark - dist) / dist;
        a.left += dx * push;
        a.top += dy * push;
      }

      // (b) keep clear of the identity sticker box
      const overX =
        Math.min(a.left + a.w, idRight) - Math.max(a.left, idLeft);
      const overY =
        Math.min(a.top + a.h, idBottom) - Math.max(a.top, idTop);
      if (overX > 0 && overY > 0) {
        if (overX < overY) {
          a.left += acx < (idLeft + idRight) / 2 ? -overX : overX;
        } else {
          a.top += acy < (idTop + idBottom) / 2 ? -overY : overY;
        }
      }

      // (c) relax sticker-on-sticker overlap (reduce, not eliminate —
      // sticker-bomb overlap is part of the look)
      for (let j = i + 1; j < items.length; j++) {
        const b = items[j];
        let ddx = acx - (b.left + b.w / 2);
        let ddy = acy - (b.top + b.h / 2);
        let d = Math.hypot(ddx, ddy);
        const minD = (a.rEff + b.rEff) * 0.9;
        if (d < minD) {
          if (d < 1e-6) {
            const ang = (i * 31 + j * 17) * 0.7;
            ddx = Math.cos(ang);
            ddy = Math.sin(ang);
            d = 1;
          }
          const push = ((minD - d) / d) * 0.5;
          a.left += ddx * push;
          a.top += ddy * push;
          b.left -= ddx * push;
          b.top -= ddy * push;
        }
      }

      clampItem(a);
    }
  }

  // px -> normalized, then stored user positions override the defaults.
  for (const it of items) {
    it.x = stickerXFromLeft(it.left, it.w);
    it.y = stickerYFromTop(it.top, it.h);
    const stored = data.stickerPositions[it.toolId];
    if (stored) {
      it.x = clamp01(stored.x);
      it.y = clamp01(stored.y);
    }
  }

  return items.map(({ left: _l, top: _t, rEff: _r, ...pub }) => pub);
}
