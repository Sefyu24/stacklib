"use client";

import { Section, Tool } from "@/lib/stack/structure";
import ToolSelector from "../tools/tool";
import SubsectionComp from "../subsections/subsection";
import { Separator } from "@/components/ui/separator";

interface SectionCompProps extends Omit<Section, "pinned"> {
  onDeleteSubsection?: (subsectionId: string) => void;
  onToolsChange?: (tools: Tool[], subsectionId?: string) => void;
}

export default function SectionComp({
  subsections,
  tools,
  selectedTools,
  onDeleteSubsection,
  onToolsChange,
}: SectionCompProps) {
  // Filter tools that belong directly to the section (no subsectionId)
  const sectionLevelTools = selectedTools.filter((t) => !t.subsectionId);

  return (
    <div className="space-y-6">
      {/* Section-level tools - shown at root level */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            General Tools
          </span>
          <Separator className="flex-1" />
        </div>
        <div className="grid gap-4">
          <ToolSelector
            availableTools={tools ?? []}
            selectedTools={sectionLevelTools}
            onToolsChange={(tools) => onToolsChange?.(tools)}
            keyPrefix="section-general"
          />
        </div>
      </div>

      {/* Show subsections if they exist - with clear visual hierarchy */}
      {subsections && subsections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Subsections
            </span>
            <Separator className="flex-1" />
          </div>
          <div className="ml-4 space-y-4 border-l-2 border-muted pl-4">
            {subsections.map((subsection) => {
              // Filter tools for this specific subsection
              const subsectionTools = selectedTools.filter(
                (t) => t.subsectionId === subsection.id
              );
              return (
                <SubsectionComp
                  id={subsection.id}
                  name={subsection.name}
                  tools={subsectionTools}
                  key={subsection.id}
                  onDelete={onDeleteSubsection}
                  onToolsChange={(tools) =>
                    onToolsChange?.(tools, subsection.id)
                  }
                  availableTools={tools ?? []}
                  keyPrefix={`subsection-${subsection.id}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
