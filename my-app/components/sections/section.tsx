"use client";

import ToolSelector from "../tools/tool";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { FunctionReturnType } from "convex/server";

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
}: SectionCompProps) {
  // Extract just the tool objects from selectedTools
  const selectedTools = section.selectedTools.map((st) => st.tool);

  return (
    <div className="space-y-4">
      <ToolSelector
        selectedTools={selectedTools}
        category={section.sectionType}
        onToolsChange={(tools) => {
          const toolIds = tools.map((t) => t._id);
          onToolsChange?.(toolIds);
        }}
        keyPrefix={`section-${section._id}`}
      />
    </div>
  );
}
