"use client";

import ToolSelector from "../tools/tool";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { FunctionReturnType } from "convex/server";
import { useQuery } from "convex/react";

// Infer the exact type from the getStack query return type
type StackData = FunctionReturnType<typeof api.stacks.getStack>;
type Section = StackData["sections"][number];

interface SectionCompProps {
  section: Section;
  onToolsChange?: (toolIds: Id<"tools">[]) => void;
  onTogglePin?: (toolId: Id<"tools">) => void;
}

export default function SectionComp({
  section,
  onToolsChange,
  onTogglePin,
}: SectionCompProps) {
  // Fetch all available tools for this section's category
  const availableTools = useQuery(
    api.stacks.getToolsByCategory,
    { category: section.sectionType as any }
  );

  // Extract just the tool objects from selectedTools
  const selectedTools = section.selectedTools.map((st) => st.tool);

  return (
    <div className="space-y-4">
      <ToolSelector
        availableTools={availableTools || []}
        selectedTools={selectedTools}
        onToolsChange={(tools) => {
          const toolIds = tools.map((t) => t._id);
          onToolsChange?.(toolIds);
        }}
        keyPrefix={`section-${section._id}`}
      />
    </div>
  );
}
