"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SectionComp from "@/components/sections/section";
import { useState } from "react";
import {
  Section,
  Tool,
  SectionType,
  sections as defaultSections,
} from "@/lib/stack/structure";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import AddSubsectionDialog from "@/components/add-subsection-dialog";
import PinnedTools from "@/components/pinnedComps/pinnedTools";

export default function Stackshare() {
  // Initialize sections with selectedTools
  const [sections, setSections] = useState<Section[]>(defaultSections);

  const [openSections, setOpenSections] = useState<string[]>(["frontend"]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogSection, setDialogSection] = useState<SectionType>("frontend");
  const [newSubsectionName, setNewSubsectionName] = useState("");
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);

  function getSectionById(sectionId: SectionType): Section | undefined {
    return sections.find((s) => s.id === sectionId);
  }

  function updateSection(
    sectionId: SectionType,
    updater: (section: Section) => Section
  ) {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === sectionId ? updater(section) : section
      )
    );
  }

  function handleToolsChange(sectionId: SectionType, subsectionId?: string) {
    return (newTools: Tool[]) => {
      updateSection(sectionId, (section) => {
        // Remove tools for this section/subsection context
        const otherTools = section.selectedTools.filter((t) => {
          if (subsectionId) {
            return t.subsectionId !== subsectionId;
          } else {
            return t.subsectionId !== undefined;
          }
        });

        // Add new tools with proper subsectionId
        const updatedTools = newTools.map((t) => ({
          ...t,
          subsectionId,
        }));

        return {
          ...section,
          selectedTools: [...otherTools, ...updatedTools],
        };
      });
    };
  }

  function addSubSection() {
    if (!newSubsectionName.trim()) return;

    const newSubsectionId = `subsection-${Date.now()}`;

    updateSection(dialogSection, (section) => {
      const newSubsection = {
        id: newSubsectionId,
        name: newSubsectionName.trim(),
      };

      // Add selected tools with subsectionId
      const toolsWithSubsectionId = selectedTools.map((tool) => ({
        ...tool,
        subsectionId: newSubsectionId,
      }));

      return {
        ...section,
        subsections: [...(section.subsections || []), newSubsection],
        selectedTools: [...section.selectedTools, ...toolsWithSubsectionId],
      };
    });

    setNewSubsectionName("");
    setSelectedTools([]);
    setIsDialogOpen(false);
  }

  function removeSubSection(sectionId: SectionType, subsectionId: string) {
    updateSection(sectionId, (section) => ({
      ...section,
      subsections:
        section.subsections?.filter((sub) => sub.id !== subsectionId) || [],
      selectedTools: section.selectedTools.filter(
        (t) => t.subsectionId !== subsectionId
      ),
    }));
  }

  function handleAccordionChange(value: string[]) {
    setOpenSections(value);
  }

  function onToggle(
    sectionId: SectionType,
    toolId: string,
    subsectionId?: string
  ) {
    updateSection(sectionId, (section) => {
      // Find the specific tool instance based on both toolId and subsectionId
      const tool = section.selectedTools.find(
        (t) => t.id === toolId && t.subsectionId === subsectionId
      );
      if (!tool) return section;

      // Check if this specific instance is pinned (match both id and subsectionId)
      const isPinned = section.pinned.some(
        (t) => t.id === tool.id && t.subsectionId === subsectionId
      );

      const updatedPinned = isPinned
        ? section.pinned.filter(
            (t) => !(t.id === toolId && t.subsectionId === subsectionId)
          )
        : [...section.pinned, tool];

      return {
        ...section,
        pinned: updatedPinned,
      };
    });
  }

  return (
    <div className="m-8 justify-center ">
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
              availableTools={getSectionById(dialogSection)?.tools || []}
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
                    selectedTools={section.selectedTools}
                    subsections={section.subsections}
                    onDeleteSubsection={(id) =>
                      removeSubSection(section.id, id)
                    }
                    onToolsChange={(tools, subsectionId) =>
                      handleToolsChange(section.id, subsectionId)(tools)
                    }
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <PinnedTools sections={sections} onToggleUpdate={onToggle} />
    </div>
  );
}
