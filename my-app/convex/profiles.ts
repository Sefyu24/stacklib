import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { assertCanActAs, canActAs } from "./authz";

// ============================================
// VALIDATORS / HELPERS
// ============================================

const profileFields = {
  _id: v.id("profiles"),
  _creationTime: v.number(),
  ownerId: v.string(),
  handle: v.string(),
  displayName: v.string(),
  tagline: v.optional(v.string()),
  bio: v.optional(v.string()),
  githubUsername: v.optional(v.string()),
};

const HANDLE_REGEX = /^[a-z0-9-]+$/;

/** Normalize + validate a handle; throws a readable error when invalid. */
function validateHandle(raw: string): string {
  const handle = raw.trim().toLowerCase().replace(/^@/, "");
  if (handle.length < 3 || handle.length > 20) {
    throw new Error("Handle must be between 3 and 20 characters.");
  }
  if (!HANDLE_REGEX.test(handle)) {
    throw new Error(
      "Handle can only contain lowercase letters, numbers, and hyphens."
    );
  }
  return handle;
}

// ============================================
// QUERIES
// ============================================

/**
 * Get the signed-in user's profile (ownerId is their Clerk user id).
 * Returns null when they haven't created one yet.
 */
export const getMyProfile = query({
  args: { ownerId: v.string() },
  returns: v.union(v.object(profileFields), v.null()),
  handler: async (ctx, args) => {
    if (!(await canActAs(ctx, args.ownerId))) return null;
    return await ctx.db
      .query("profiles")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();
  },
});

/**
 * Look up a profile by its public handle.
 */
export const getProfileByHandle = query({
  args: { handle: v.string() },
  returns: v.union(v.object(profileFields), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) =>
        q.eq("handle", args.handle.trim().toLowerCase())
      )
      .first();
  },
});

/**
 * All stacks owned by the given owner, trimmed down for the dashboard's
 * "My cards" list.
 */
export const getMyStacks = query({
  args: { ownerId: v.string() },
  returns: v.array(
    v.object({
      id: v.id("stacks"),
      name: v.string(),
      cardTheme: v.optional(v.string()),
      isPublic: v.boolean(),
      subtitle: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    // Never enumerate someone else's (possibly private) stacks.
    if (!(await canActAs(ctx, args.ownerId))) return [];
    const stacks = await ctx.db
      .query("stacks")
      .withIndex("by_userId", (q) => q.eq("userId", args.ownerId))
      .collect();
    return stacks.map((stack) => ({
      id: stack._id,
      name: stack.name,
      cardTheme: stack.cardTheme,
      // Missing isPublic means private.
      isPublic: stack.isPublic ?? false,
      subtitle: stack.subtitle,
    }));
  },
});

/**
 * Public profile page payload: the profile plus ONLY its public stacks.
 * Private stacks are filtered server-side and never leave the backend.
 */
export const getPublicProfile = query({
  args: { handle: v.string() },
  returns: v.union(
    v.object({
      profile: v.object(profileFields),
      stacks: v.array(
        v.object({
          id: v.id("stacks"),
          name: v.string(),
          cardTheme: v.optional(v.string()),
          subtitle: v.optional(v.string()),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) =>
        q.eq("handle", args.handle.trim().toLowerCase())
      )
      .first();
    if (!profile) return null;

    const stacks = await ctx.db
      .query("stacks")
      .withIndex("by_userId", (q) => q.eq("userId", profile.ownerId))
      .collect();

    return {
      profile,
      stacks: stacks
        .filter((stack) => stack.isPublic === true)
        .map((stack) => ({
          id: stack._id,
          name: stack.name,
          cardTheme: stack.cardTheme,
          subtitle: stack.subtitle,
        })),
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Create or update the caller's profile. Validates the handle (lowercase,
 * 3-20 chars, letters/numbers/hyphens) and enforces uniqueness via the
 * by_handle index. Optional fields are only patched when provided.
 */
export const upsertProfile = mutation({
  args: {
    ownerId: v.string(),
    handle: v.string(),
    displayName: v.string(),
    tagline: v.optional(v.string()),
    bio: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
  },
  returns: v.id("profiles"),
  handler: async (ctx, args) => {
    // Profiles are a signed-in feature: the caller's JWT must match
    // ownerId exactly (guest keys can't own a public profile).
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== args.ownerId) {
      throw new Error("Not authorized");
    }
    const handle = validateHandle(args.handle);
    const displayName = args.displayName.trim();
    if (!displayName) {
      throw new Error("Display name can't be empty.");
    }

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();

    // Handle uniqueness: someone else must not already own it.
    const taken = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle))
      .first();
    if (taken && taken.ownerId !== args.ownerId) {
      throw new Error(`@${handle} is already taken — try another handle.`);
    }

    if (existing) {
      const patch: {
        handle: string;
        displayName: string;
        tagline?: string;
        bio?: string;
        githubUsername?: string;
      } = { handle, displayName };
      if (args.tagline !== undefined) patch.tagline = args.tagline.trim();
      if (args.bio !== undefined) patch.bio = args.bio.trim();
      if (args.githubUsername !== undefined)
        patch.githubUsername = args.githubUsername.trim();
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("profiles", {
      ownerId: args.ownerId,
      handle,
      displayName,
      tagline: args.tagline?.trim(),
      bio: args.bio?.trim(),
      githubUsername: args.githubUsername?.trim(),
    });
  },
});

/**
 * Toggle whether a stack shows up on the owner's public profile.
 */
export const setStackVisibility = mutation({
  args: {
    stackId: v.id("stacks"),
    isPublic: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId);
    if (!stack) {
      throw new Error("Stack not found");
    }
    await assertCanActAs(ctx, stack.userId);
    await ctx.db.patch(args.stackId, { isPublic: args.isPublic });
    return null;
  },
});
