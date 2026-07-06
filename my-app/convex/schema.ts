import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tools: defineTable({
    name: v.string(),
    url: v.string(),
    category: v.union(
      v.literal("frontend"),
      v.literal("backend"),
      v.literal("ide"),
      v.literal("ai"),
      v.literal("other")
    ),
    toolUrl: v.optional(v.string()),
    toolDescription: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    // Simple Icons slug (https://cdn.simpleicons.org/<slug>); preferred over
    // logoUrl when present. Brandfetch logoUrl is the fallback.
    iconSlug: v.optional(v.string()),
  })
    .index("by_category", ["category"])
    .index("by_name", ["name"]),

  stacks: defineTable({
    name: v.string(),
    userId: v.optional(v.string()),
    projectURL: v.optional(v.string()),
    // Pre-configured card style: "minimal" | "bento" | "terminal".
    cardTheme: v.optional(v.string()),
    showWatermark: v.optional(v.boolean()),
    // Optional one-line tagline rendered under the title on the card.
    subtitle: v.optional(v.string()),
    // Optional profile identity rendered on the card.
    authorName: v.optional(v.string()),
    authorHandle: v.optional(v.string()),
    authorAvatarUrl: v.optional(v.string()),
    showAvatar: v.optional(v.boolean()),
    // Whether the stack appears on the owner's public profile.
    // Missing is treated as false (private).
    isPublic: v.optional(v.boolean()),
  }).index("by_userId", ["userId"]),

  profiles: defineTable({
    // Clerk user id (profiles are only for signed-in users, never guests).
    ownerId: v.string(),
    // Lowercase URL handle: 3-20 chars, /^[a-z0-9-]+$/.
    handle: v.string(),
    displayName: v.string(),
    // Short one-line description shown under the name.
    tagline: v.optional(v.string()),
    bio: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_handle", ["handle"]),

  sections: defineTable({
    stackId: v.id("stacks"),
    sectionType: v.union(
      v.literal("frontend"),
      v.literal("backend"),
      v.literal("ide"),
      v.literal("ai"),
      v.literal("other")
    ),
    name: v.string(),
    order: v.number(),
  })
    .index("by_stackId", ["stackId"])
    .index("by_stackId_and_sectionType", ["stackId", "sectionType"]),

  selectedTools: defineTable({
    sectionId: v.id("sections"),
    toolId: v.id("tools"),
    // Position within the section; controls order on the card.
    order: v.optional(v.number()),
  })
    .index("by_sectionId", ["sectionId"])
    .index("by_toolId", ["toolId"])
    .index("by_sectionId_and_toolId", ["sectionId", "toolId"]),

  pinnedTools: defineTable({
    sectionId: v.id("sections"),
    toolId: v.id("tools"),
  })
    .index("by_sectionId", ["sectionId"])
    .index("by_toolId", ["toolId"]),
});
