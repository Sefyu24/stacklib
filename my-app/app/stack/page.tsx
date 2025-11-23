"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SectionComp from "@/components/sections/section";
import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PinnedTools from "@/components/pinnedComps/pinnedTools";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function Stackshare() {
  // Store the stackId in state once created
  const [stackId, setStackId] = useState<Id<"stacks"> | null>(null);

  // Get mutations
  const createStackMutation = useMutation(api.stacks.createStack);
  const updateToolsMutation = useMutation(api.stacks.updateSectionTools);
  const togglePinnedMutation = useMutation(api.stacks.togglePinnedTool);

  // Fetch the stack - use a dummy ID initially that will be replaced
  // The key fix: don't use conditional queries, always query but handle null stackId
  const stack = useQuery(api.stacks.getStack, stackId ? { stackId } : "skip");

  // Create a stack on mount if we don't have one
  useEffect(() => {
    if (!stackId) {
      createStackMutation({
        name: "My Tech Stack",
        userId: "demo-user",
      })
        .then((newStackId) => {
          console.log("Created stack:", newStackId);
          setStackId(newStackId);
        })
        .catch((err) => {
          console.error("Error creating stack:", err);
        });
    }
  }, []); // Only run once on mount

  // UI state
  const [openSections, setOpenSections] = useState<string[]>(["frontend"]);

  // Show loading while creating/fetching stack
  if (!stackId || stack === undefined) {
    return (
      <div className="m-8 flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading your stack...</p>
          <p className="text-sm text-gray-500 mt-2">
            {!stackId ? "Creating stack..." : "Fetching data..."}
          </p>
        </div>
      </div>
    );
  }

  async function handleToolsChange(
    sectionId: Id<"sections">,
    toolIds: Id<"tools">[]
  ) {
    try {
      await updateToolsMutation({
        sectionId,
        toolIds,
      });
    } catch (err) {
      console.error("Error updating tools:", err);
    }
  }

  async function handleTogglePin(
    sectionId: Id<"sections">,
    toolId: Id<"tools">
  ) {
    try {
      await togglePinnedMutation({
        sectionId,
        toolId,
      });
    } catch (err) {
      console.error("Error toggling pin:", err);
    }
  }

  return (
    <div className="m-8 justify-center">
      <Card className="p-6 border-4 max-w-4xl w-full">
        <CardTitle>
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
            {stack.name}
          </h1>
        </CardTitle>
        <CardHeader>Give us more information about your stack</CardHeader>
        <CardDescription>
          You can add sections and other stuff in here. Feel free to share
          whatever you want about your stack.
        </CardDescription>
        <CardContent className="space-y-4">
          <Accordion
            type="multiple"
            value={openSections}
            onValueChange={setOpenSections}
            className="space-y-4"
          >
            {stack.sections.map((section) => (
              <AccordionItem key={section._id} value={section.sectionType}>
                <AccordionTrigger className="text-xl font-semibold p-2">
                  {section.name}
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <SectionComp
                    section={section}
                    onToolsChange={(toolIds) =>
                      handleToolsChange(section._id, toolIds)
                    }
                    onTogglePin={(toolId) =>
                      handleTogglePin(section._id, toolId)
                    }
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <PinnedTools sections={stack.sections} onToggleUpdate={handleTogglePin} />
    </div>
  );
}
