import { v } from "convex/values";
import { mutation } from "./_generated/server";

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
 * Upsert a tool by name. This is how Brandfetch results and custom entries
 * become real `tools` documents with real IDs — the card renderer and the
 * section mutations only ever see IDs that exist in the database.
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

    if (existing) {
      // Backfill domain/logo/slug captured at add time if we didn't have them
      const patch: { url?: string; logoUrl?: string; iconSlug?: string } = {};
      if (!existing.url && args.domain) patch.url = args.domain;
      if (!existing.logoUrl && args.logoUrl) patch.logoUrl = args.logoUrl;
      if (!existing.iconSlug && args.iconSlug) patch.iconSlug = args.iconSlug;
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch);
      }
      const updated = await ctx.db.get(existing._id);
      if (!updated) throw new Error("Tool disappeared during upsert");
      return updated;
    }

    const id = await ctx.db.insert("tools", {
      name,
      url: args.domain ?? "",
      category: args.category,
      logoUrl: args.logoUrl,
      iconSlug: args.iconSlug,
    });
    const created = await ctx.db.get(id);
    if (!created) throw new Error("Tool not found after insert");
    return created;
  },
});
