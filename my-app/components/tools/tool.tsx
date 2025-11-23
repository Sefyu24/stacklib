"use client";

import { useState, useRef, useEffect } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import LogoFramework from "@/app/stack/logo-framework";
import { X, ChevronDown, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Doc, Id } from "@/convex/_generated/dataModel";

// Use Convex Doc type for tools
type Tool = Doc<"tools">;

interface ToolSelectorProps {
  availableTools: Tool[];
  selectedTools: Tool[];
  onToolsChange: (tools: Tool[]) => void;
  placeholder?: string;
  selectedLabel?: string;
  showLabel?: boolean;
  keyPrefix?: string;
}

export default function ToolSelector({
  availableTools,
  selectedTools,
  onToolsChange,
  placeholder = "Search tools...",
  selectedLabel = "Selected Tools",
  showLabel = true,
  keyPrefix = "default",
}: ToolSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (toolId: Id<"tools">) => {
    const tool = availableTools.find((t) => t._id === toolId);
    if (tool && !selectedTools.find((t) => t._id === toolId)) {
      onToolsChange([...selectedTools, tool]);
      setSearchQuery("");
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleAddCustom = () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    // Check if already selected
    const alreadySelected = selectedTools.find(
      (t) => t.name.toLowerCase() === trimmedQuery.toLowerCase()
    );
    if (alreadySelected) {
      setSearchQuery("");
      setIsOpen(false);
      return;
    }

    // Create custom tool object (with temporary ID)
    const customTool: Tool = {
      _id: `custom-${trimmedQuery
        .toLowerCase()
        .replace(/\s+/g, "-")}` as Id<"tools">,
      _creationTime: 0,
      name: trimmedQuery,
      url: "", // Empty URL for custom entries
      category: "other",
    };

    onToolsChange([...selectedTools, customTool]);
    setSearchQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleRemove = (toolId: Id<"tools">) => {
    onToolsChange(selectedTools.filter((t) => t._id !== toolId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Calculate total options dynamically
    const totalOptions = (showAddCustom ? 1 : 0) + filteredTools.length;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev < totalOptions - 1 ? prev + 1 : 0;
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : totalOptions - 1;
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        // Select highlighted item
        if (showAddCustom && highlightedIndex === 0) {
          handleAddCustom();
        } else {
          const toolIndex = showAddCustom
            ? highlightedIndex - 1
            : highlightedIndex;
          if (filteredTools[toolIndex]) {
            handleSelect(filteredTools[toolIndex]._id);
          }
        }
      } else if (searchQuery.trim()) {
        // If no item is highlighted, use the old behavior
        const exactMatch = filteredTools.find(
          (t) => t.name.toLowerCase() === searchQuery.trim().toLowerCase()
        );
        if (exactMatch) {
          handleSelect(exactMatch._id);
        } else {
          handleAddCustom();
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const availableToolsList = availableTools.filter(
    (t) => !selectedTools.find((st) => st._id === t._id)
  );

  // Filter tools based on search query
  const filteredTools = availableToolsList.filter((tool) =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if we should show "Add custom" option
  const showAddCustom =
    searchQuery.trim() &&
    !filteredTools.find(
      (t) => t.name.toLowerCase() === searchQuery.trim().toLowerCase()
    ) &&
    !selectedTools.find(
      (t) => t.name.toLowerCase() === searchQuery.trim().toLowerCase()
    );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {showLabel && <Label>Choose your tool</Label>}

      <div className="relative">
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsOpen(true);
              setHighlightedIndex(-1);
            }}
          />
          <InputGroupAddon align="inline-end">
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </InputGroupAddon>
        </InputGroup>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="fixed z-50 mt-1 rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95"
          >
            <div className="max-h-[300px] overflow-y-auto p-1">
              {showAddCustom && (
                <div
                  key="add-custom-tool"
                  onClick={handleAddCustom}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                    "hover:bg-accent hover:text-accent-foreground",
                    "transition-colors border-b",
                    highlightedIndex === 0 && "bg-accent text-accent-foreground"
                  )}
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate font-medium">
                    Add &quot;{searchQuery.trim()}&quot;
                  </span>
                </div>
              )}
              {filteredTools.length === 0 && !showAddCustom && (
                <div
                  key="no-tools-message"
                  className="px-2 py-1.5 text-sm text-muted-foreground"
                >
                  {searchQuery
                    ? "No tools found"
                    : availableToolsList.length === 0
                    ? "All tools selected"
                    : "Start typing to search..."}
                </div>
              )}
              {filteredTools.map((tool, index) => {
                const itemIndex = showAddCustom ? index + 1 : index;
                return (
                  <div
                    key={`${keyPrefix}-dropdown-${tool._id}`}
                    onClick={() => handleSelect(tool._id)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                      "hover:bg-accent hover:text-accent-foreground",
                      "transition-colors",
                      highlightedIndex === itemIndex &&
                        "bg-accent text-accent-foreground"
                    )}
                  >
                    <LogoFramework url={tool.url} name={tool.name} />
                    <span className="truncate">{tool.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedTools.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {selectedLabel} ({selectedTools.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedTools.map((tool) => (
              <div
                key={`${keyPrefix}-${tool._id}`}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm",
                  "hover:bg-accent transition-colors"
                )}
              >
                <LogoFramework url={tool.url} name={tool.name} />
                <span className="font-medium">{tool.name}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-4 w-4 rounded-full hover:bg-destructive/20 hover:text-destructive"
                  onClick={() => handleRemove(tool._id)}
                  aria-label={`Remove ${tool.name}`}
                >
                  <X className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
