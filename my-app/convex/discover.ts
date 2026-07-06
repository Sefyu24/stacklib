import { v } from "convex/values";
import { query } from "./_generated/server";
import { isGuestId } from "./authz";

/**
 * The public discovery feed: newest public stacks, each with just enough
 * author identity to render a browse card. Private stacks never appear —
 * the index only matches isPublic === true.
 */
export const listPublicStacks = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      id: v.id("stacks"),
      name: v.string(),
      subtitle: v.optional(v.string()),
      cardTheme: v.optional(v.string()),
      authorName: v.optional(v.string()),
      handle: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 24, 1), 60);
    const stacks = await ctx.db
      .query("stacks")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(limit);

    return Promise.all(
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
        return {
          id: stack._id,
          name: stack.name,
          subtitle: stack.subtitle || undefined,
          cardTheme: stack.cardTheme,
          authorName: stack.authorName || profileName,
          handle,
        };
      })
    );
  },
});
