// Shared logic for deciding which tools a section contributes to the card,
// and in what order. Used by both the live preview and the OG image route so
// that what a user sees on /stack is exactly what gets rendered to PNG.

export const SECTION_CARD_CAP = 5;
export const DEFAULT_PIN_COUNT = 5;
// Max sections shown on the card (all five categories fit the 630px height).
export const MAX_CARD_SECTIONS = 5;

// Minimal shapes so this module stays free of Convex server types and can be
// imported from client components and the edge/node route alike.
export interface DisplayToolInput {
  toolId: string;
  order?: number;
  tool: {
    name: string;
    url: string;
    logoUrl?: string;
    iconSlug?: string;
  };
}

export interface DisplaySectionInput {
  name: string;
  sectionType: string;
  selectedTools: DisplayToolInput[];
  pinnedTools: { toolId: string }[];
}

export interface DisplayTool {
  toolId: string;
  name: string;
  url: string;
  logoUrl?: string;
  iconSlug?: string;
  pinned: boolean;
}

export interface DisplaySection {
  name: string;
  sectionType: string;
  tools: DisplayTool[];
  overflow: number;
}

/**
 * The card shows a section's pinned tools in their user-defined order. If a
 * section has tools but none pinned (e.g. legacy data), fall back to the
 * first few selected so the card never looks empty.
 */
export function getSectionDisplay(
  section: DisplaySectionInput,
  cap: number = SECTION_CARD_CAP
): DisplaySection {
  const pinnedIds = new Set(section.pinnedTools.map((p) => p.toolId));

  // selectedTools arrive pre-sorted by `order` from getStack.
  const pinned = section.selectedTools.filter((st) => pinnedIds.has(st.toolId));
  const base =
    pinned.length > 0
      ? pinned
      : section.selectedTools.slice(0, DEFAULT_PIN_COUNT);

  const visible = base.slice(0, cap);

  return {
    name: section.name,
    sectionType: section.sectionType,
    tools: visible.map((st) => ({
      toolId: st.toolId,
      name: st.tool.name,
      url: st.tool.url,
      logoUrl: st.tool.logoUrl,
      iconSlug: st.tool.iconSlug,
      pinned: pinnedIds.has(st.toolId),
    })),
    overflow: base.length - visible.length,
  };
}

export function getCardSections(
  sections: DisplaySectionInput[],
  cap: number = SECTION_CARD_CAP
): DisplaySection[] {
  return sections
    .filter((s) => s.selectedTools.length > 0)
    .map((s) => getSectionDisplay(s, cap))
    .filter((s) => s.tools.length > 0)
    .slice(0, MAX_CARD_SECTIONS);
}

export function countCardTools(sections: DisplaySectionInput[]): {
  total: number;
  pinned: number;
} {
  let total = 0;
  let pinned = 0;
  for (const s of sections) {
    total += s.selectedTools.length;
    pinned += s.pinnedTools.length;
  }
  return { total, pinned };
}
