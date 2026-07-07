import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { assertCanActAs, assertSectionOwner, isGuestId } from "./authz";

// ============================================
// QUERIES (Read Operations)
// ============================================

/**
 * Get a complete stack with all its sections and tools
 * This is your main query that replaces the static `sections` array
 */
export const getStack = query({
  args: { stackId: v.id("stacks") },
  returns: v.object({
    _id: v.id("stacks"),
    _creationTime: v.number(),
    name: v.string(),
    userId: v.optional(v.string()),
    projectURL: v.optional(v.string()),
    cardTheme: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    showWatermark: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    lidEdition: v.optional(v.string()),
    stickerSeed: v.optional(v.number()),
    stickerPositions: v.optional(
      v.record(v.string(), v.object({ x: v.number(), y: v.number() }))
    ),
    stickerModes: v.optional(v.record(v.string(), v.string())),
    authorName: v.optional(v.string()),
    authorHandle: v.optional(v.string()),
    authorAvatarUrl: v.optional(v.string()),
    showAvatar: v.optional(v.boolean()),
    sections: v.array(v.object({
      _id: v.id("sections"),
      _creationTime: v.number(),
      stackId: v.id("stacks"),
      sectionType: v.string(),
      name: v.string(),
      order: v.number(),
      selectedTools: v.array(v.object({
        _id: v.id("selectedTools"),
        _creationTime: v.number(),
        toolId: v.id("tools"),
        order: v.optional(v.number()),
        tool: v.object({
          _id: v.id("tools"),
          _creationTime: v.number(),
          name: v.string(),
          url: v.string(),
          category: v.string(),
          toolUrl: v.optional(v.string()),
          toolDescription: v.optional(v.string()),
          logoUrl: v.optional(v.string()),
          iconSlug: v.optional(v.string()),
        }),
      })),
      pinnedTools: v.array(v.object({
        _id: v.id("pinnedTools"),
        _creationTime: v.number(),
        toolId: v.id("tools"),
        tool: v.object({
          _id: v.id("tools"),
          _creationTime: v.number(),
          name: v.string(),
          url: v.string(),
          category: v.string(),
          toolUrl: v.optional(v.string()),
          toolDescription: v.optional(v.string()),
          logoUrl: v.optional(v.string()),
          iconSlug: v.optional(v.string()),
        }),
      })),
    })),
  }),
  handler: async (ctx, args) => {
    // Get the stack
    const stack = await ctx.db.get(args.stackId);
    if (!stack) {
      throw new Error("Stack not found");
    }

    // Get all sections for this stack, ordered by order field
    const sections = await ctx.db
      .query("sections")
      .withIndex("by_stackId", (q) => q.eq("stackId", args.stackId))
      .collect();
    
    // Sort sections by order
    sections.sort((a, b) => a.order - b.order);

    // For each section, get selected tools and pinned tools
    const sectionsWithDetails = await Promise.all(
      sections.map(async (section) => {
        // Get selected tools with full tool details
        const selectedToolsRaw = await ctx.db
          .query("selectedTools")
          .withIndex("by_sectionId", (q) => q.eq("sectionId", section._id))
          .collect();

        // Order by the `order` field (falling back to creation time for
        // legacy rows that predate ordering).
        selectedToolsRaw.sort(
          (a, b) =>
            (a.order ?? a._creationTime) - (b.order ?? b._creationTime)
        );

        const selectedTools = await Promise.all(
          selectedToolsRaw.map(async (st) => {
            const tool = await ctx.db.get(st.toolId);
            if (!tool) throw new Error("Tool not found");
            return {
              _id: st._id,
              _creationTime: st._creationTime,
              toolId: st.toolId,
              order: st.order,
              tool,
            };
          })
        );

        // Get pinned tools with full tool details
        const pinnedToolsRaw = await ctx.db
          .query("pinnedTools")
          .withIndex("by_sectionId", (q) => q.eq("sectionId", section._id))
          .collect();

        const pinnedTools = await Promise.all(
          pinnedToolsRaw.map(async (pt) => {
            const tool = await ctx.db.get(pt.toolId);
            if (!tool) throw new Error("Tool not found");
            return {
              _id: pt._id,
              _creationTime: pt._creationTime,
              toolId: pt.toolId,
              tool,
            };
          })
        );

        return {
          ...section,
          selectedTools,
          pinnedTools,
        };
      })
    );

    return {
      ...stack,
      sections: sectionsWithDetails,
    };
  },
});

/**
 * Get all available tools for a specific category
 * This replaces your static tool arrays (frontendTools, backendTools, etc.)
 */
export const getToolsByCategory = query({
  args: { 
    category: v.union(
      v.literal("frontend"),
      v.literal("backend"),
      v.literal("ide"),
      v.literal("ai"),
      v.literal("other")
    )
  },
  returns: v.array(v.object({
    _id: v.id("tools"),
    _creationTime: v.number(),
    name: v.string(),
    url: v.string(),
    category: v.string(),
    toolUrl: v.optional(v.string()),
    toolDescription: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    iconSlug: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tools")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

// ============================================
// MUTATIONS (Write Operations)
// ============================================

/**
 * Create a new stack for a user
 */
export const createStack = mutation({
  args: {
    name: v.string(),
    userId: v.optional(v.string()),
    projectURL: v.optional(v.string()),
  },
  returns: v.id("stacks"),
  handler: async (ctx, args) => {
    await assertCanActAs(ctx, args.userId);
    const stackId = await ctx.db.insert("stacks", {
      name: args.name,
      userId: args.userId,
      projectURL: args.projectURL,
    });

    // Create default sections for this stack
    const sectionTypes = ["frontend", "backend", "ide", "ai", "other"] as const;
    const sectionNames = ["Frontend", "Backend", "IDE", "AI", "Other"];

    for (let i = 0; i < sectionTypes.length; i++) {
      await ctx.db.insert("sections", {
        stackId,
        sectionType: sectionTypes[i],
        name: sectionNames[i],
        order: i,
      });
    }

    return stackId;
  },
});


/**
 * Get the owner's stack, creating it (with default sections) on first visit.
 * ownerId is a Clerk user id when signed in, or a local guest key otherwise.
 */
export const getOrCreateStack = mutation({
  args: {
    ownerId: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.id("stacks"),
  handler: async (ctx, args) => {
    await assertCanActAs(ctx, args.ownerId);
    const existing = await ctx.db
      .query("stacks")
      .withIndex("by_userId", (q) => q.eq("userId", args.ownerId))
      .first();
    if (existing) return existing._id;

    const stackId = await ctx.db.insert("stacks", {
      name: args.name ?? "My Tech Stack",
      userId: args.ownerId,
    });

    const sectionTypes = ["frontend", "backend", "ide", "ai", "other"] as const;
    const sectionNames = ["Frontend", "Backend", "IDE", "AI", "Other"];
    for (let i = 0; i < sectionTypes.length; i++) {
      await ctx.db.insert("sections", {
        stackId,
        sectionType: sectionTypes[i],
        name: sectionNames[i],
        order: i,
      });
    }

    return stackId;
  },
});

/**
 * When a guest signs in, move their guest stack onto their account —
 * but only if the account doesn't already have one.
 */
export const adoptGuestStack = mutation({
  args: {
    guestId: v.string(),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Only the signed-in user may claim a stack onto their own account,
    // and only guest stacks can be claimed.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== args.userId) {
      throw new Error("Not authorized");
    }
    if (!isGuestId(args.guestId)) {
      throw new Error("Only guest stacks can be adopted");
    }
    const userStack = await ctx.db
      .query("stacks")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (userStack) return null;

    const guestStack = await ctx.db
      .query("stacks")
      .withIndex("by_userId", (q) => q.eq("userId", args.guestId))
      .first();
    if (guestStack) {
      await ctx.db.patch(guestStack._id, { userId: args.userId });
    }
    return null;
  },
});

/**
 * Set the card style/theme and watermark visibility for a stack.
 */
export const setCardTheme = mutation({
  args: {
    stackId: v.id("stacks"),
    cardTheme: v.optional(
      v.union(
        v.literal("minimal"),
        v.literal("lid"),
        v.literal("terminal")
      )
    ),
    showWatermark: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId);
    if (!stack) throw new Error("Stack not found");
    await assertCanActAs(ctx, stack.userId);
    const patch: { cardTheme?: string; showWatermark?: boolean } = {};
    if (args.cardTheme !== undefined) patch.cardTheme = args.cardTheme;
    if (args.showWatermark !== undefined) patch.showWatermark = args.showWatermark;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.stackId, patch);
    }
    return null;
  },
});

/**
 * Lid theme controls: OS edition, sticker scatter seed, and individual
 * sticker positions (normalized 0..1 within the lid).
 */
export const setLidOptions = mutation({
  args: {
    stackId: v.id("stacks"),
    lidEdition: v.optional(
      v.union(v.literal("apple"), v.literal("microsoft"), v.literal("linux"))
    ),
    stickerSeed: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId);
    if (!stack) throw new Error("Stack not found");
    await assertCanActAs(ctx, stack.userId);
    const patch: { lidEdition?: string; stickerSeed?: number } = {};
    if (args.lidEdition !== undefined) patch.lidEdition = args.lidEdition;
    if (args.stickerSeed !== undefined) patch.stickerSeed = args.stickerSeed;
    if (Object.keys(patch).length > 0) await ctx.db.patch(args.stackId, patch);
    return null;
  },
});

export const setStickerMode = mutation({
  args: {
    stackId: v.id("stacks"),
    toolId: v.string(),
    mode: v.union(v.literal("logo"), v.literal("both"), v.literal("name")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId);
    if (!stack) throw new Error("Stack not found");
    await assertCanActAs(ctx, stack.userId);
    await ctx.db.patch(args.stackId, {
      stickerModes: {
        ...(stack.stickerModes ?? {}),
        [args.toolId]: args.mode,
      },
    });
    return null;
  },
});

export const setStickerPosition = mutation({
  args: {
    stackId: v.id("stacks"),
    toolId: v.id("tools"),
    x: v.number(),
    y: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId);
    if (!stack) throw new Error("Stack not found");
    await assertCanActAs(ctx, stack.userId);
    const clamp = (n: number) => Math.min(1, Math.max(0, n));
    await ctx.db.patch(args.stackId, {
      stickerPositions: {
        ...(stack.stickerPositions ?? {}),
        [args.toolId]: { x: clamp(args.x), y: clamp(args.y) },
      },
    });
    return null;
  },
});

/** One-off: bento was replaced by the lid theme. Safe to re-run. */
export const migrateBentoToLid = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const stacks = await ctx.db.query("stacks").collect();
    let n = 0;
    for (const s of stacks) {
      if (s.cardTheme === "bento") {
        await ctx.db.patch(s._id, { cardTheme: "lid" });
        n++;
      }
    }
    return n;
  },
});

/**
 * Update the optional profile identity shown on the card.
 * Patches only the fields that were provided.
 */
export const updateStackIdentity = mutation({
  args: {
    stackId: v.id("stacks"),
    authorName: v.optional(v.string()),
    authorHandle: v.optional(v.string()),
    authorAvatarUrl: v.optional(v.string()),
    showAvatar: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId);
    if (!stack) throw new Error("Stack not found");
    await assertCanActAs(ctx, stack.userId);
    const patch: {
      authorName?: string;
      authorHandle?: string;
      authorAvatarUrl?: string;
      showAvatar?: boolean;
    } = {};
    if (args.authorName !== undefined) patch.authorName = args.authorName.trim();
    if (args.authorHandle !== undefined)
      patch.authorHandle = args.authorHandle.trim().replace(/^@/, "");
    if (args.authorAvatarUrl !== undefined)
      patch.authorAvatarUrl = args.authorAvatarUrl.trim();
    if (args.showAvatar !== undefined) patch.showAvatar = args.showAvatar;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.stackId, patch);
    }
    return null;
  },
});

/**
 * Update the stack's title and/or subtitle. An empty subtitle is stored
 * as "" and treated as cleared by the renderers.
 */
export const updateStackDetails = mutation({
  args: {
    stackId: v.id("stacks"),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    // Longer description (shown on the share page / profile, not the card).
    description: v.optional(v.string()),
    // Repo / project link (stored on the existing projectURL field).
    repoUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId);
    if (!stack) throw new Error("Stack not found");
    await assertCanActAs(ctx, stack.userId);
    const patch: {
      name?: string;
      subtitle?: string;
      description?: string;
      projectURL?: string;
    } = {};
    if (args.title !== undefined) {
      patch.name = args.title.trim() || "My Tech Stack";
    }
    if (args.subtitle !== undefined) {
      patch.subtitle = args.subtitle.trim();
    }
    if (args.description !== undefined) {
      patch.description = args.description.trim();
    }
    if (args.repoUrl !== undefined) {
      patch.projectURL = args.repoUrl.trim();
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.stackId, patch);
    }
    return null;
  },
});

/**
 * Delete a stack and everything under it (sections, selected & pinned tools).
 * Multi-card: users can remove cards they no longer want.
 */
export const deleteStack = mutation({
  args: { stackId: v.id("stacks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId);
    if (!stack) return null;
    await assertCanActAs(ctx, stack.userId);
    const sections = await ctx.db
      .query("sections")
      .withIndex("by_stackId", (q) => q.eq("stackId", args.stackId))
      .collect();
    for (const section of sections) {
      const selected = await ctx.db
        .query("selectedTools")
        .withIndex("by_sectionId", (q) => q.eq("sectionId", section._id))
        .collect();
      for (const st of selected) await ctx.db.delete(st._id);
      const pinned = await ctx.db
        .query("pinnedTools")
        .withIndex("by_sectionId", (q) => q.eq("sectionId", section._id))
        .collect();
      for (const pt of pinned) await ctx.db.delete(pt._id);
      await ctx.db.delete(section._id);
    }
    await ctx.db.delete(args.stackId);
    return null;
  },
});

/**
 * Add a tool to a section
 */
export const addToolToSection = mutation({
  args: {
    sectionId: v.id("sections"),
    toolId: v.id("tools"),
  },
  returns: v.id("selectedTools"),
  handler: async (ctx, args) => {
    await assertSectionOwner(ctx, args.sectionId);
    return await ctx.db.insert("selectedTools", {
      sectionId: args.sectionId,
      toolId: args.toolId,
    });
  },
});

/**
 * Remove a tool from a section
 */
export const removeToolFromSection = mutation({
  args: {
    selectedToolId: v.id("selectedTools"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const selected = await ctx.db.get(args.selectedToolId);
    if (!selected) return null;
    await assertSectionOwner(ctx, selected.sectionId);
    await ctx.db.delete(args.selectedToolId);
    return null;
  },
});

/**
 * Toggle a tool's pinned status
 */
export const togglePinnedTool = mutation({
  args: {
    sectionId: v.id("sections"),
    toolId: v.id("tools"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await assertSectionOwner(ctx, args.sectionId);
    // Check if tool is already pinned
    const existing = await ctx.db
      .query("pinnedTools")
      .withIndex("by_sectionId", (q) => q.eq("sectionId", args.sectionId))
      .filter((q) => q.eq(q.field("toolId"), args.toolId))
      .first();

    if (existing) {
      // Unpin it
      await ctx.db.delete(existing._id);
    } else {
      // Pin it
      await ctx.db.insert("pinnedTools", {
        sectionId: args.sectionId,
        toolId: args.toolId,
      });
    }

    return null;
  },
});

// How many tools per section are pinned automatically as they're added.
const AUTO_PIN_COUNT = 5;

/**
 * Update selected tools for a section. Replaces the entire set, preserving
 * the incoming array order via the `order` field. Newly added tools are
 * auto-pinned (up to AUTO_PIN_COUNT total per section) so the card looks
 * populated by default, and pins for removed tools are cleaned up.
 */
export const updateSectionTools = mutation({
  args: {
    sectionId: v.id("sections"),
    toolIds: v.array(v.id("tools")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await assertSectionOwner(ctx, args.sectionId);
    const existingTools = await ctx.db
      .query("selectedTools")
      .withIndex("by_sectionId", (q) => q.eq("sectionId", args.sectionId))
      .collect();
    const oldToolIds = new Set(existingTools.map((t) => t.toolId));

    // Replace the selected set, storing array position as `order`.
    for (const tool of existingTools) {
      await ctx.db.delete(tool._id);
    }
    for (let i = 0; i < args.toolIds.length; i++) {
      await ctx.db.insert("selectedTools", {
        sectionId: args.sectionId,
        toolId: args.toolIds[i],
        order: i,
      });
    }

    // Reconcile pins: drop pins for tools no longer selected.
    const newToolIds = new Set(args.toolIds);
    const pins = await ctx.db
      .query("pinnedTools")
      .withIndex("by_sectionId", (q) => q.eq("sectionId", args.sectionId))
      .collect();
    const pinnedSet = new Set<string>();
    for (const pin of pins) {
      if (!newToolIds.has(pin.toolId)) {
        await ctx.db.delete(pin._id);
      } else {
        pinnedSet.add(pin.toolId);
      }
    }

    // Auto-pin newly added tools (in order) until the section reaches
    // AUTO_PIN_COUNT pins. Tools already present keep their pin state, so
    // explicit unpins are respected.
    let pinnedCount = pinnedSet.size;
    for (const toolId of args.toolIds) {
      if (pinnedCount >= AUTO_PIN_COUNT) break;
      if (oldToolIds.has(toolId) || pinnedSet.has(toolId)) continue;
      await ctx.db.insert("pinnedTools", {
        sectionId: args.sectionId,
        toolId,
      });
      pinnedSet.add(toolId);
      pinnedCount++;
    }

    return null;
  },
});

/**
 * Move a tool from one section to another (drag & drop across sections),
 * inserting at `targetIndex` in the destination. The tool's global category
 * is untouched — placement in a stack is the user's call (React can live in
 * Backend if they want). A pin travels with the tool when the destination
 * has room; the source pin is always cleaned up.
 */
export const moveToolToSection = mutation({
  args: {
    toolId: v.id("tools"),
    fromSectionId: v.id("sections"),
    toSectionId: v.id("sections"),
    targetIndex: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.fromSectionId === args.toSectionId) return null;
    await assertSectionOwner(ctx, args.fromSectionId);
    const from = await ctx.db.get(args.fromSectionId);
    const to = await ctx.db.get(args.toSectionId);
    if (!from || !to) throw new Error("Section not found");
    if (from.stackId !== to.stackId) {
      throw new Error("Sections belong to different stacks");
    }

    const fromRows = await ctx.db
      .query("selectedTools")
      .withIndex("by_sectionId", (q) => q.eq("sectionId", args.fromSectionId))
      .collect();
    const moving = fromRows.find((r) => r.toolId === args.toolId);
    if (!moving) return null;
    await ctx.db.delete(moving._id);

    const fromPins = await ctx.db
      .query("pinnedTools")
      .withIndex("by_sectionId", (q) => q.eq("sectionId", args.fromSectionId))
      .collect();
    const srcPin = fromPins.find((p) => p.toolId === args.toolId);
    if (srcPin) await ctx.db.delete(srcPin._id);

    const toRows = await ctx.db
      .query("selectedTools")
      .withIndex("by_sectionId", (q) => q.eq("sectionId", args.toSectionId))
      .collect();
    // Already in the destination? The delete above deduped; nothing to add.
    if (toRows.some((r) => r.toolId === args.toolId)) return null;
    toRows.sort(
      (a, b) => (a.order ?? a._creationTime) - (b.order ?? b._creationTime)
    );

    const idx = Math.max(0, Math.min(args.targetIndex, toRows.length));
    const ordered = [
      ...toRows.slice(0, idx).map((r) => r.toolId),
      args.toolId,
      ...toRows.slice(idx).map((r) => r.toolId),
    ];
    for (let i = 0; i < ordered.length; i++) {
      const existing = toRows.find((r) => r.toolId === ordered[i]);
      if (existing) {
        if (existing.order !== i) await ctx.db.patch(existing._id, { order: i });
      } else {
        await ctx.db.insert("selectedTools", {
          sectionId: args.toSectionId,
          toolId: args.toolId,
          order: i,
        });
      }
    }

    if (srcPin) {
      const toPins = await ctx.db
        .query("pinnedTools")
        .withIndex("by_sectionId", (q) => q.eq("sectionId", args.toSectionId))
        .collect();
      if (
        toPins.length < AUTO_PIN_COUNT &&
        !toPins.some((p) => p.toolId === args.toolId)
      ) {
        await ctx.db.insert("pinnedTools", {
          sectionId: args.toSectionId,
          toolId: args.toolId,
        });
      }
    }
    return null;
  },
});

/**
 * Reorder the tools within a section. `orderedToolIds` is the full set of
 * the section's tool ids in their new order.
 */
export const reorderSectionTools = mutation({
  args: {
    sectionId: v.id("sections"),
    orderedToolIds: v.array(v.id("tools")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await assertSectionOwner(ctx, args.sectionId);
    const existing = await ctx.db
      .query("selectedTools")
      .withIndex("by_sectionId", (q) => q.eq("sectionId", args.sectionId))
      .collect();
    const byToolId = new Map(existing.map((st) => [st.toolId, st]));

    for (let i = 0; i < args.orderedToolIds.length; i++) {
      const st = byToolId.get(args.orderedToolIds[i]);
      if (st && st.order !== i) {
        await ctx.db.patch(st._id, { order: i });
      }
    }

    return null;
  },
});
