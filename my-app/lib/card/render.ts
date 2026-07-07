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
// stable function of (seed, toolId).
function stickerLook(
  rng: () => number,
  name: string
): { shape: LidStickerShape; w: number; h: number; rotation: number } {
  const rPill = rng();
  const rShape = rng();
  const rSize = rng();
  const rRot = rng();
  const rotation = Math.round((rRot * 16 - 8) * 10) / 10;

  if (name.length <= 9 && rPill < 0.4) {
    // Pill: icon + uppercase name.
    const w = Math.round(44 + 14 + name.length * 16.5 + 48);
    return { shape: "pill", w, h: 88, rotation };
  }
  if (rShape < 0.55) {
    const d = Math.round(132 + rSize * 44); // 132–176
    return { shape: "circle", w: d, h: d, rotation };
  }
  const s = Math.round(122 + rSize * 40); // 122–162
  return { shape: "square", w: s, h: s, rotation };
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
      t.name
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
