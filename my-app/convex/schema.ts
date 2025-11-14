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
  })
    .index("by_stackId", ["stackId"])
    .index("by_stackId_and_sectionType", ["stackId", "sectionType"]),

  subsections: defineTable({
    sectionId: v.id("sections"),
    name: v.string(),
  }).index("by_sectionId", ["sectionId"]),

  selectedTools: defineTable({
    sectionId: v.id("sections"),
    toolId: v.id("tools"),
    subsectionId: v.optional(v.id("subsections")),
  })
    .index("by_sectionId", ["sectionId"])
    .index("by_subsectionId", ["subsectionId"])
    .index("by_toolId", ["toolId"]),

  pinnedTools: defineTable({
    sectionId: v.id("sections"),
    toolId: v.id("tools"),
  })
    .index("by_sectionId", ["sectionId"])
    .index("by_toolId", ["toolId"]),
});
