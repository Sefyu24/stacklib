"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SectionComp from "@/components/sections/section";
import { frontendTools } from "@/lib/stack/frontend-tools";
import { backendTools } from "@/lib/stack/backend-tools";
import { ideTools } from "@/lib/stack/ide-tools";
import { aiTools } from "@/lib/stack/ai-tools";
import { otherTools } from "@/lib/stack/other-tools";
import { useState, useMemo } from "react";
import { Subsection, Tool, SectionType, Section } from "@/lib/stack/structure";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import AddSubsectionDialog from "@/components/add-subsection-dialog";

export default function Stackshare() {
  const sections: Section[] = [
    {
      id: "frontend",
      name: "Frontend",
      tools: frontendTools,
      pinned: [],
    },
    {
      id: "backend",
      name: "Backend",
      tools: backendTools,
      pinned: [],
    },
    {
      id: "ide",
      name: "IDE",
      tools: ideTools,
      pinned: [],
    },
    {
      id: "ai",
      name: "AI",
      tools: aiTools,
      pinned: [],
    },
    {
      id: "other",
      name: "Other",
      tools: otherTools,
      pinned: [],
    },
  ];
  const [subsections, setSubsections] = useState<
    Record<SectionType, Subsection[]>
  >({
    frontend: [],
    backend: [],
    ide: [],
    ai: [],
    other: [],
  });

  const [openSections, setOpenSections] = useState<string[]>(["frontend"]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogSection, setDialogSection] = useState<SectionType>("frontend");
  const [newSubsectionName, setNewSubsectionName] = useState("");
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);

  function getToolsForSection(section: SectionType): Tool[] {
    return sections.find((s) => s.id === section)?.tools ?? [];
  }

  function getSubsectionsForSection(section: SectionType): Subsection[] {
    return subsections[section] ?? [];
  }

  function setSubsectionsForSection(
    section: SectionType,
    newSubsections: Subsection[]
  ) {
    setSubsections((prev) => ({
      ...prev,
      [section]: newSubsections,
    }));
  }

  function addSubSection() {
    if (!newSubsectionName.trim()) return;

    const newSubsection: Subsection = {
      id: `subsection-${Date.now()}`,
      name: newSubsectionName.trim(),
      tools: selectedTools,
    };

    const currentSubsections = getSubsectionsForSection(dialogSection);
    setSubsectionsForSection(dialogSection, [
      ...currentSubsections,
      newSubsection,
    ]);
    setNewSubsectionName("");
    setSelectedTools([]);
    setIsDialogOpen(false);
  }

  function removeSubSection(section: SectionType, subsectionId: string) {
    const currentSubsections = getSubsectionsForSection(section);
    setSubsectionsForSection(
      section,
      currentSubsections.filter((subsection) => subsection.id !== subsectionId)
    );
  }

  function handleAccordionChange(value: string[]) {
    setOpenSections(value);
  }
  return (
    <div className="m-8 flex justify-center ">
      <Card className="p-6 border-4 max-w-4xl w-full">
        <CardTitle className="">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
            {" "}
            Your stack
          </h1>
        </CardTitle>
        <CardHeader>Give us more information about your stack</CardHeader>
        <CardDescription>
          You can add sections and other stuff in here. Feel free to share
          whatever you want about your stack.
        </CardDescription>
        <CardContent className="space-y-4">
          <div className="flex justify-end gap-4 items-center mb-6">
            <p>Add a subsection</p>
            <AddSubsectionDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              section={dialogSection}
              onSectionChange={(value) =>
                setDialogSection(value as SectionType)
              }
              subsectionName={newSubsectionName}
              onSubsectionNameChange={setNewSubsectionName}
              selectedTools={selectedTools}
              onSelectedToolsChange={setSelectedTools}
              availableTools={getToolsForSection(dialogSection)}
              onSubmit={addSubSection}
            />
          </div>

          <Accordion
            type="multiple"
            value={openSections}
            onValueChange={handleAccordionChange}
            className="space-y-4"
          >
            {sections.map((section) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="text-xl font-semibold p-2">
                  {section.name}
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <SectionComp
                    id={section.id}
                    name={section.name}
                    tools={section.tools}
                    subsections={getSubsectionsForSection(section.id)}
                    onDeleteSubsection={(id) =>
                      removeSubSection(section.id, id)
                    }
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
