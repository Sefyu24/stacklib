// Shared card render-data assembly. One function turns a stack (plus a
// logo resolver) into the exact structure the card art renders, so the live
// preview and the OG PNG route can never drift apart: the OG route resolves
// logos to data URIs, the browser preview resolves to plain URLs, and
// everything else — order, caps, stats, truncation — is decided here once.

import {
  DisplaySectionInput,
  DisplayTool,
  getCardSections,
  getCardStats,
} from "./display";

export type CardThemeKey = "minimal" | "bento" | "terminal";
export const CARD_THEME_KEYS: CardThemeKey[] = ["minimal", "bento", "terminal"];

export function truncate(name: string, max = 22): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

export interface CardRenderTool {
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
  /** Resolved avatar source (data URI on the OG path, plain URL in the browser) */
  avatarSrc: string | null;
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
  avatarSrc: string | null = null
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
    avatarSrc,
    sections: display.map((s) => ({
      name: s.name,
      type: s.sectionType,
      tools: s.tools.map((t) => ({
        name: truncate(t.name),
        logo: resolveLogo(t),
        letter: t.name[0]?.toUpperCase() ?? "?",
      })),
    })),
  };
}
