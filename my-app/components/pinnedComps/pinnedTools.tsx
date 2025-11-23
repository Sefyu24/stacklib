import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Toggle } from "../ui/toggle";
import { Pin } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { FunctionReturnType } from "convex/server";

// Infer types from the getStack query
type StackData = FunctionReturnType<typeof api.stacks.getStack>;
type Section = StackData["sections"][number];

interface PinnedToolsProps {
  sections: Section[];
  onToggleUpdate: (
    sectionId: Id<"sections">,
    toolId: Id<"tools">
  ) => void;
}

export default function PinnedTools({
  sections,
  onToggleUpdate,
}: PinnedToolsProps) {
  return (
    <div className="m-4">
      <p>Return pinned tools</p>
      <div>
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Pinned Tools</CardTitle>
            <CardDescription>Your most frequently used tools</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Here are each sections</p>
            {sections.map((section) => (
              <div key={section._id} className="m-4">
                <h3 className="font-semibold mb-2">{section.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {section.selectedTools?.map((selectedTool) => {
                    // Check if this tool is pinned
                    const isPinned = section.pinnedTools?.some(
                      (pt) => pt.toolId === selectedTool.toolId
                    );

                    // Create unique key
                    const uniqueKey = selectedTool.subsectionId
                      ? `${selectedTool.subsectionId}-${selectedTool.toolId}`
                      : `section-${selectedTool.toolId}`;

                    return (
                      <Toggle
                        key={uniqueKey}
                        aria-label="Toggle tool"
                        size={"default"}
                        variant={"outline"}
                        pressed={isPinned}
                        onPressedChange={() =>
                          onToggleUpdate(section._id, selectedTool.toolId)
                        }
                        className="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-blue-500 data-[state=on]:*:[svg]:stroke-blue-500"
                      >
                        <Pin /> {selectedTool.tool.name}
                      </Toggle>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>{/* Optional footer actions */}</CardFooter>
        </Card>
      </div>
    </div>
  );
}
