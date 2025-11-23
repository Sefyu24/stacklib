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
  }).index("by_category", ["category"]),

  stacks: defineTable({
    name: v.string(),
    userId: v.optional(v.string()),
    projectURL: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

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
