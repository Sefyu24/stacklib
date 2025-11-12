"use client";

import { Section, Tool } from "@/lib/stack/structure";
import ToolSelector from "../tools/tool";
import SubsectionComp from "../subsections/subsection";
import { useState } from "react";

interface SectionCompProps extends Section {
  onDeleteSubsection?: (subsectionId: string) => void;
}

export default function SectionComp({
  subsections,
  tools,
  onDeleteSubsection,
}: SectionCompProps) {
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);
  return (
    <div>
      <div>
        {!subsections || subsections.length === 0 ? (
          <div className="grid gap-4">
            <ToolSelector
              availableTools={tools ?? []}
              selectedTools={selectedTools}
              onToolsChange={setSelectedTools}
            />
            {/* Remove the "List of tools" section - ToolSelector already shows selected tools */}
          </div>
        ) : (
          subsections?.map((subsection) => (
            <SubsectionComp
              id={subsection.id}
              name={subsection.name}
              tools={subsection.tools}
              key={subsection.id}
              onDelete={onDeleteSubsection}
            />
          ))
        )}
      </div>
    </div>
  );
}
