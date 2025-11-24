"use client";

import { useState, useRef, useEffect } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import LogoFramework from "@/app/stack/logo-framework";
import { X, ChevronDown, Search, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Doc, Id } from "@/convex/_generated/dataModel";

// Use Convex Doc type for tools
type Tool = Doc<"tools">;

type ToolCategory = "frontend" | "backend" | "ide" | "ai" | "other";

interface BrandfetchBrand {
  icon: string | null;
  name: string | null;
  domain: string;
  claimed: boolean;
  brandId: string;
}

interface ToolSelectorProps {
  selectedTools: Tool[];
  onToolsChange: (tools: Tool[]) => void;
  placeholder?: string;
  selectedLabel?: string;
  showLabel?: boolean;
  keyPrefix?: string;
  category?: ToolCategory;
}

export default function ToolSelector({
  selectedTools,
  onToolsChange,
  placeholder = "Search tools...",
  selectedLabel = "Selected Tools",
  showLabel = true,
  keyPrefix = "default",
  category = "other",
}: ToolSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchResults, setSearchResults] = useState<BrandfetchBrand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search Brandfetch API with debouncing
  useEffect(() => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Don't search if query is too short or empty
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsLoading(false);
      setSearchError(null);
      return;
    }

    setIsLoading(true);
    setSearchError(null);

    // Debounce the API call
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/brandfetch/search?name=${encodeURIComponent(searchQuery.trim())}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to search brands");
        }

        const data: BrandfetchBrand[] = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Error searching brands:", error);
        setSearchError(
          error instanceof Error ? error.message : "Failed to search brands"
        );
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 400); // 400ms debounce

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectBrand = (brand: BrandfetchBrand) => {
    // Check if already selected
    const alreadySelected = selectedTools.find(
      (t) => t.name.toLowerCase() === (brand.name || "").toLowerCase()
    );
    if (alreadySelected) {
      setSearchQuery("");
      setIsOpen(false);
      return;
    }

    // Create tool object from Brandfetch result
    const tool: Tool = {
      _id: `brandfetch-${brand.brandId}` as Id<"tools">,
      _creationTime: Date.now(),
      name: brand.name || brand.domain,
      url: brand.domain,
      category: category || "other",
    };

    onToolsChange([...selectedTools, tool]);
    setSearchQuery("");
    setIsOpen(false);
    setSearchResults([]);
    inputRef.current?.blur();
  };

  const handleSelect = (brand: BrandfetchBrand) => {
    handleSelectBrand(brand);
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
      _creationTime: Date.now(),
      name: trimmedQuery,
      url: "", // Empty URL for custom entries
      category: category || "other",
    };

    onToolsChange([...selectedTools, customTool]);
    setSearchQuery("");
    setIsOpen(false);
    setSearchResults([]);
    inputRef.current?.blur();
  };

  const handleRemove = (toolId: Id<"tools">) => {
    onToolsChange(selectedTools.filter((t) => t._id !== toolId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Calculate total options dynamically
    const totalOptions = (showAddCustom ? 1 : 0) + searchResults.length;

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
          const brandIndex = showAddCustom
            ? highlightedIndex - 1
            : highlightedIndex;
          if (searchResults[brandIndex]) {
            handleSelect(searchResults[brandIndex]);
          }
        }
      } else if (searchQuery.trim() && searchResults.length > 0) {
        // If no item is highlighted, select the first result
        handleSelect(searchResults[0]);
      } else if (searchQuery.trim()) {
        // If no results, add as custom
        handleAddCustom();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    }
  };

  // Filter out already selected brands from search results
  const filteredResults = searchResults.filter(
    (brand) =>
      !selectedTools.find(
        (t) =>
          t.name.toLowerCase() === (brand.name || brand.domain).toLowerCase()
      )
  );

  // Check if we should show "Add custom" option
  const showAddCustom =
    searchQuery.trim() &&
    searchQuery.trim().length >= 2 &&
    !isLoading &&
    filteredResults.length === 0 &&
    !searchError &&
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
              {isLoading && (
                <div className="flex items-center justify-center gap-2 px-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching brands...</span>
                </div>
              )}

              {searchError && !isLoading && (
                <div className="px-2 py-1.5 text-sm text-destructive">
                  {searchError}
                </div>
              )}

              {!isLoading && !searchError && searchQuery.trim().length < 2 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  Start typing to search brands...
                </div>
              )}

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

              {!isLoading &&
                !searchError &&
                filteredResults.length === 0 &&
                !showAddCustom &&
                searchQuery.trim().length >= 2 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No brands found. Try a different search term.
                  </div>
                )}

              {filteredResults.map((brand, index) => {
                const itemIndex = showAddCustom ? index + 1 : index;
                const brandName = brand.name || brand.domain;
                return (
                  <div
                    key={`${keyPrefix}-dropdown-${brand.brandId}`}
                    onClick={() => handleSelect(brand)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                      "hover:bg-accent hover:text-accent-foreground",
                      "transition-colors",
                      highlightedIndex === itemIndex &&
                        "bg-accent text-accent-foreground"
                    )}
                  >
                    <LogoFramework url={brand.domain} name={brandName} />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-medium">{brandName}</span>
                      {brand.domain && brand.name && (
                        <span className="truncate text-xs text-muted-foreground">
                          {brand.domain}
                        </span>
                      )}
                    </div>
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
