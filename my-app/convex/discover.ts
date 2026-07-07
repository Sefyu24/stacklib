import { v } from "convex/values";
import { query } from "./_generated/server";
import { isGuestId } from "./authz";
import { getCardSections, type DisplaySectionInput } from "../lib/card/display";

// Browse cards show at most this many tools per section layer.
const PILE_SECTION_CAP = 4;

const pileToolValidator = v.object({
  name: v.string(),
  logoUrl: v.optional(v.string()),
  iconSlug: v.optional(v.string()),
});

const pileSectionValidator = v.object({
  name: v.string(),
  sectionType: v.string(),
  // Total selected tools in the section (not just the displayed ones).
  count: v.number(),
  tools: v.array(pileToolValidator),
});

/**
 * The public discovery feed: newest public stacks, each with just enough
 * author identity to render a browse card. Private stacks never appear —
 * the index only matches isPublic === true.
 *
 * Each stack also carries a compact section summary (same pinned-first
 * selection as the share card, via getCardSections) so the browse page can
 * render the "loose pile" cards without an extra roundtrip per stack.
 */
export const listPublicStacks = query({
  args: {
    limit: v.optional(v.number()),
    // Optional tool-name filter (lowercased). matchMode "all" = stack must
    // contain every selected tool; "any" = at least one. Defaults to "all".
    toolFilter: v.optional(v.array(v.string())),
    matchMode: v.optional(v.union(v.literal("all"), v.literal("any"))),
  },
  returns: v.array(
    v.object({
      id: v.id("stacks"),
      name: v.string(),
      subtitle: v.optional(v.string()),
      cardTheme: v.optional(v.string()),
      authorName: v.optional(v.string()),
      handle: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      toolCount: v.number(),
      sections: v.array(pileSectionValidator),
    })
  ),
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 24, 1), 60);
    const filter = (args.toolFilter ?? [])
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const matchMode = args.matchMode ?? "all";
    // With a filter we scan a larger pool and narrow in memory; without one we
    // just take the newest `limit`. (Denormalize toolNames[] + an index if the
    // public feed ever grows past a few hundred stacks.)
    const scan = filter.length > 0 ? 200 : limit;

    const stacks = await ctx.db
      .query("stacks")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(scan);

    const built = await Promise.all(
      stacks.map(async (stack) => {
        let handle: string | undefined;
        let profileName: string | undefined;
        if (stack.userId && !isGuestId(stack.userId)) {
          const profile = await ctx.db
            .query("profiles")
            .withIndex("by_owner", (q) => q.eq("ownerId", stack.userId!))
            .first();
          handle = profile?.handle;
          profileName = profile?.displayName;
        }

        // Assemble the same section model the card renderers use, so the
        // browse pile shows exactly the tools the share card would.
        const sections = await ctx.db
          .query("sections")
          .withIndex("by_stackId", (q) => q.eq("stackId", stack._id))
          .collect();
        sections.sort((a, b) => a.order - b.order);

        let toolCount = 0;
        // Every tool name on the stack, lowercased — used for the tool filter.
        const toolNamesLower: string[] = [];
        const inputs: DisplaySectionInput[] = [];
        // Full selected count per section, keyed by type+name (the display
        // model drops empty sections, so counts are matched back by key).
        const countByKey = new Map<string, number>();

        for (const section of sections) {
          const selectedRows = await ctx.db
            .query("selectedTools")
            .withIndex("by_sectionId", (q) => q.eq("sectionId", section._id))
            .collect();
          selectedRows.sort(
            (a, b) =>
              (a.order ?? a._creationTime) - (b.order ?? b._creationTime)
          );

          const selectedTools = [];
          for (const row of selectedRows) {
            const tool = await ctx.db.get(row.toolId);
            if (!tool) continue; // deleted tool; keep the feed resilient
            toolNamesLower.push(tool.name.toLowerCase());
            selectedTools.push({
              toolId: row.toolId as string,
              order: row.order,
              tool: {
                name: tool.name,
                url: tool.url,
                logoUrl: tool.logoUrl,
                iconSlug: tool.iconSlug,
              },
            });
          }

          toolCount += selectedTools.length;
          if (selectedTools.length === 0) continue;

          const pinnedRows = await ctx.db
            .query("pinnedTools")
            .withIndex("by_sectionId", (q) => q.eq("sectionId", section._id))
            .collect();

          inputs.push({
            name: section.name,
            sectionType: section.sectionType,
            selectedTools,
            pinnedTools: pinnedRows.map((p) => ({ toolId: p.toolId as string })),
          });
          countByKey.set(
            `${section.sectionType}|${section.name}`,
            selectedTools.length
          );
        }

        const sectionSummaries = getCardSections(inputs, PILE_SECTION_CAP).map(
          (s) => ({
            name: s.name,
            sectionType: s.sectionType,
            count:
              countByKey.get(`${s.sectionType}|${s.name}`) ??
              s.tools.length,
            tools: s.tools.map((t) => ({
              name: t.name,
              logoUrl: t.logoUrl,
              iconSlug: t.iconSlug,
            })),
          })
        );

        return {
          id: stack._id,
          name: stack.name,
          subtitle: stack.subtitle || undefined,
          cardTheme: stack.cardTheme,
          authorName: stack.authorName || profileName,
          handle,
          avatarUrl:
            stack.showAvatar === false
              ? undefined
              : stack.authorAvatarUrl || undefined,
          toolCount,
          sections: sectionSummaries,
          // Internal — used for filtering, stripped before returning.
          _toolNames: toolNamesLower,
        };
      })
    );

    const matched =
      filter.length === 0
        ? built
        : built.filter((s) => {
            const set = new Set(s._toolNames);
            return matchMode === "any"
              ? filter.some((f) => set.has(f))
              : filter.every((f) => set.has(f));
          });

    // Strip the internal field and cap to the requested page size.
    return matched.slice(0, limit).map(({ _toolNames, ...rest }) => {
      void _toolNames;
      return rest;
    });
  },
});
