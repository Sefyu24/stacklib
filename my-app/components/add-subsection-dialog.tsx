"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ToolSelector from "@/components/tools/tool";
import { Tool, SectionType } from "@/lib/stack/structure";

interface AddSubsectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: SectionType;
  onSectionChange: (section: SectionType) => void;
  subsectionName: string;
  onSubsectionNameChange: (name: string) => void;
  selectedTools: Tool[];
  onSelectedToolsChange: (tools: Tool[]) => void;
  availableTools: Tool[];
  onSubmit: () => void;
}

export default function AddSubsectionDialog({
  open,
  onOpenChange,
  section,
  onSectionChange,
  subsectionName,
  onSubsectionNameChange,
  selectedTools,
  onSelectedToolsChange,
  availableTools,
  onSubmit,
}: AddSubsectionDialogProps) {
  function handleCancel() {
    onOpenChange(false);
    onSubsectionNameChange("");
    onSelectedToolsChange([]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <Plus className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Subsection</DialogTitle>
          <DialogDescription>
            Select a section, enter a name for your subsection and add tools to
            it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="section-select">Section</Label>
            <Select value={section} onValueChange={onSectionChange}>
              <SelectTrigger id="section-select">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frontend">Frontend</SelectItem>
                <SelectItem value="backend">Backend</SelectItem>
                <SelectItem value="ide">IDE</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subsection-name">Subsection Name</Label>
            <Input
              id="subsection-name"
              placeholder="e.g., State Management"
              value={subsectionName}
              onChange={(e) => onSubsectionNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <ToolSelector
              availableTools={availableTools}
              selectedTools={selectedTools}
              onToolsChange={onSelectedToolsChange}
              keyPrefix="add-subsection-dialog"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!subsectionName.trim()}>
            Create Subsection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
