import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Section } from "@/lib/stack/structure";
import { Toggle } from "../ui/toggle";
import { Pin } from "lucide-react";
import { SectionType } from "@/lib/stack/structure";

// Criterias

{
  /*
    1. List all tools of each section
    2. Condition: Pin up to 5 tools for each section 
    3. If section has less than 5 tools: Pin them automatically and let user remove if want
    4. 
    */
}

interface PinnedToolsProps {
  sections: Section[];
  onToggleUpdate: (
    sectionId: SectionType,
    toolId: string,
    subsectionId?: string
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
              <div key={section.id} className="m-4">
                <h3 className="font-semibold mb-2">{section.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {section.selectedTools?.map((tool) => {
                    // Check if this specific instance is pinned (match both id and subsectionId)
                    const isPinned = section.pinned.some(
                      (t) =>
                        t.id === tool.id && t.subsectionId === tool.subsectionId
                    );

                    // Create unique key using subsectionId context
                    const uniqueKey = tool.subsectionId
                      ? `${tool.subsectionId}-${tool.id}`
                      : `section-${tool.id}`;

                    return (
                      <Toggle
                        key={uniqueKey}
                        aria-label="Toggle tool"
                        size={"default"}
                        variant={"outline"}
                        pressed={isPinned}
                        onPressedChange={() =>
                          onToggleUpdate(section.id, tool.id, tool.subsectionId)
                        }
                        className="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-blue-500 data-[state=on]:*:[svg]:stroke-blue-500"
                      >
                        <Pin /> {tool.name}
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
