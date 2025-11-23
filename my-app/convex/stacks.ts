import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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
        tool: v.object({
          _id: v.id("tools"),
          _creationTime: v.number(),
          name: v.string(),
          url: v.string(),
          category: v.string(),
          toolUrl: v.optional(v.string()),
          toolDescription: v.optional(v.string()),
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

        const selectedTools = await Promise.all(
          selectedToolsRaw.map(async (st) => {
            const tool = await ctx.db.get(st.toolId);
            if (!tool) throw new Error("Tool not found");
            return {
              _id: st._id,
              _creationTime: st._creationTime,
              toolId: st.toolId,
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
 * Add a tool to a section
 */
export const addToolToSection = mutation({
  args: {
    sectionId: v.id("sections"),
    toolId: v.id("tools"),
  },
  returns: v.id("selectedTools"),
  handler: async (ctx, args) => {
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

/**
 * Update selected tools for a section
 * This replaces the entire set of tools for a given section
 */
export const updateSectionTools = mutation({
  args: {
    sectionId: v.id("sections"),
    toolIds: v.array(v.id("tools")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get existing selected tools for this section
    const existingTools = await ctx.db
      .query("selectedTools")
      .withIndex("by_sectionId", (q) => q.eq("sectionId", args.sectionId))
      .collect();

    // Delete existing tools
    for (const tool of existingTools) {
      await ctx.db.delete(tool._id);
    }

    // Insert new tools
    for (const toolId of args.toolIds) {
      await ctx.db.insert("selectedTools", {
        sectionId: args.sectionId,
        toolId,
      });
    }

    return null;
  },
});
