"use client";
import { Subsection, Tool } from "@/lib/stack/structure";
import { Button } from "../ui/button";
import { useState } from "react";
import ToolSelector from "../tools/tool";
import { Trash } from "lucide-react";

interface SubsectionCompProps extends Subsection {
  onDelete?: (subsectionId: string) => void;
}

export default function SubsectionComp({
  id,
  name,
  tools,
  onDelete,
}: SubsectionCompProps) {
  const [selectedTools, setSelectedTools] = useState<Tool[]>(tools ?? []);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-semibold">{name}</h3>
        {onDelete && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(id)}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash className="size-4" />
          </Button>
        )}
      </div>
      <div>
        <ToolSelector
          availableTools={tools ?? []}
          selectedTools={selectedTools}
          onToolsChange={setSelectedTools}
        />
      </div>
    </div>
  );
}
