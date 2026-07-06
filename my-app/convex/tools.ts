import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";
import { internal } from "./_generated/api";

const toolDoc = v.object({
  _id: v.id("tools"),
  _creationTime: v.number(),
  name: v.string(),
  url: v.string(),
  category: v.string(),
  toolUrl: v.optional(v.string()),
  toolDescription: v.optional(v.string()),
  logoUrl: v.optional(v.string()),
  iconSlug: v.optional(v.string()),
});

/**
 * A logo is "durable" when it lives in our own Convex storage (or any
 * non-Brandfetch host). Brandfetch search-result URLs carry expiring
 * tokens and must be re-captured by the enrichment action.
 */
function hasDurableLogo(tool: { logoUrl?: string }): boolean {
  return Boolean(tool.logoUrl && !tool.logoUrl.includes("cdn.brandfetch.io"));
}

/**
 * Upsert a tool by name. This is how Brandfetch results and custom entries
 * become real `tools` documents with real IDs — the card renderer and the
 * section mutations only ever see IDs that exist in the database.
 * Tools without a durable logo get queued for Brandfetch enrichment.
 */
export const getOrCreateTool = mutation({
  args: {
    name: v.string(),
    domain: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    iconSlug: v.optional(v.string()),
    category: v.union(
      v.literal("frontend"),
      v.literal("backend"),
      v.literal("ide"),
      v.literal("ai"),
      v.literal("other")
    ),
  },
  returns: toolDoc,
  handler: async (ctx, args) => {
    const name = args.name.trim();

    const existing = await ctx.db
      .query("tools")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();

    let toolId;
    if (existing) {
      // Backfill domain/logo/slug captured at add time if we didn't have them
      const patch: { url?: string; logoUrl?: string; iconSlug?: string } = {};
      if (!existing.url && args.domain) patch.url = args.domain;
      if (!existing.logoUrl && args.logoUrl) patch.logoUrl = args.logoUrl;
      if (!existing.iconSlug && args.iconSlug) patch.iconSlug = args.iconSlug;
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch);
      }
      toolId = existing._id;
    } else {
      toolId = await ctx.db.insert("tools", {
        name,
        url: args.domain ?? "",
        category: args.category,
        logoUrl: args.logoUrl,
        iconSlug: args.iconSlug,
      });
    }

    const tool = await ctx.db.get(toolId);
    if (!tool) throw new Error("Tool not found after upsert");

    if (!hasDurableLogo(tool)) {
      await ctx.scheduler.runAfter(0, internal.logoActions.enrichToolLogo, {
        toolId,
      });
    }

    return tool;
  },
});

export const getToolInternal = internalQuery({
  args: { toolId: v.id("tools") },
  returns: v.union(toolDoc, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.toolId);
  },
});

export const listToolsInternal = internalQuery({
  args: {},
  returns: v.array(toolDoc),
  handler: async (ctx) => {
    return await ctx.db.query("tools").collect();
  },
});

/**
 * Admin repair: point a tool at the right brand domain and re-run logo
 * capture (fixes fuzzy-search mismatches like "drizzle" → a cooking blog).
 * Run with: npx convex run tools:repairToolLogo '{"toolId":"...","domain":"..."}'
 */
export const repairToolLogo = internalMutation({
  args: {
    toolId: v.id("tools"),
    domain: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.toolId, {
      url: args.domain,
      logoUrl: undefined,
    });
    await ctx.scheduler.runAfter(0, internal.logoActions.enrichToolLogo, {
      toolId: args.toolId,
    });
    return null;
  },
});

export const patchToolLogo = internalMutation({
  args: {
    toolId: v.id("tools"),
    logoUrl: v.string(),
    url: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const patch: { logoUrl: string; url?: string } = { logoUrl: args.logoUrl };
    if (args.url) {
      const existing = await ctx.db.get(args.toolId);
      if (existing && !existing.url) patch.url = args.url;
    }
    await ctx.db.patch(args.toolId, patch);
    return null;
  },
});
