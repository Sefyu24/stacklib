"use client";

import { useState, useRef, useEffect } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import LogoFramework from "@/app/stack/logo-framework";
import { Tool } from "@/lib/stack/structure";
import { X, ChevronDown, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface ToolSelectorProps {
  availableTools: Tool[];
  selectedTools: Tool[];
  onToolsChange: (tools: Tool[]) => void;
  placeholder?: string;
  selectedLabel?: string;
  showLabel?: boolean;
}

export default function ToolSelector({
  availableTools,
  selectedTools,
  onToolsChange,
  placeholder = "Search tools...",
  selectedLabel = "Selected Tools",
  showLabel = true,
}: ToolSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (toolId: string) => {
    const tool = availableTools.find((t) => t.id === toolId);
    if (tool && !selectedTools.find((t) => t.id === toolId)) {
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

    // Create custom tool object
    const customTool: Tool = {
      id: `custom-${trimmedQuery.toLowerCase().replace(/\s+/g, "-")}`,
      name: trimmedQuery,
      url: "", // Empty URL for custom entries, LogoFramework can handle this
    };

    onToolsChange([...selectedTools, customTool]);
    setSearchQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleRemove = (toolId: string) => {
    onToolsChange(selectedTools.filter((t) => t.id !== toolId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      // If there's an exact match, select it; otherwise add custom
      const exactMatch = filteredTools.find(
        (t) => t.name.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (exactMatch) {
        handleSelect(exactMatch.id);
      } else {
        handleAddCustom();
      }
    }
  };

  const availableToolsList = availableTools.filter(
    (t) => !selectedTools.find((st) => st.id === t.id)
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
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
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
            className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95"
          >
            <div className="max-h-[300px] overflow-y-auto p-1">
              {showAddCustom && (
                <div
                  onClick={handleAddCustom}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                    "hover:bg-accent hover:text-accent-foreground",
                    "transition-colors border-b"
                  )}
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate font-medium">
                    Add &quot;{searchQuery.trim()}&quot;
                  </span>
                </div>
              )}
              {filteredTools.length === 0 && !showAddCustom ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {searchQuery
                    ? "No tools found"
                    : availableToolsList.length === 0
                    ? "All tools selected"
                    : "Start typing to search..."}
                </div>
              ) : (
                filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => handleSelect(tool.id)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                      "hover:bg-accent hover:text-accent-foreground",
                      "transition-colors"
                    )}
                  >
                    <LogoFramework url={tool.url} name={tool.name} />
                    <span className="truncate">{tool.name}</span>
                  </div>
                ))
              )}
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
                key={tool.id}
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
                  onClick={() => handleRemove(tool.id)}
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
