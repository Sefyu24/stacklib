"use client";

// Tool picker for the browse feed. Users search the curated catalog and pick
// one or more tools; the picks show as removable chips. A shadcn ToggleGroup
// switches the match mode between "All" (stacks containing every selected
// tool) and "Any" (at least one). Purely presentational — filter state lives
// in the parent BrowseFeed, which re-queries the public feed on change.

import { HugeiconsIcon } from "@hugeicons/react";
import {
  FilterIcon,
  Cancel01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import LogoFramework from "@/app/stack/logo-framework";
import { CATALOG, CATEGORY_LABELS, CatalogTool } from "@/lib/catalog";

export type MatchMode = "all" | "any";

interface BrowseFilterProps {
  /** Catalog tool names currently selected (original casing). */
  selected: string[];
  onToggle: (name: string) => void;
  onRemove: (name: string) => void;
  onClear: () => void;
  matchMode: MatchMode;
  onMatchModeChange: (mode: MatchMode) => void;
}

export default function BrowseFilter({
  selected,
  onToggle,
  onRemove,
  onClear,
  matchMode,
  onMatchModeChange,
}: BrowseFilterProps) {
  const selectedSet = new Set(selected.map((n) => n.toLowerCase()));
  const hasSelection = selected.length > 0;

  // Resolve chip logos from the catalog so removable chips show the same
  // letter-tile/logo as the picker rows.
  const catalogByName = new Map(
    CATALOG.map((t) => [t.name.toLowerCase(), t] as const)
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-[10px] border-[1.5px] border-input bg-card px-3.5 font-bold text-[13.5px] text-foreground shadow-[0_2px_0_var(--border)] outline-none transition-[transform,box-shadow] duration-[120ms] ease-out hover:bg-secondary active:translate-y-[1px] active:shadow-[0_1px_0_var(--border)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <HugeiconsIcon
                icon={FilterIcon}
                className="size-4 text-[#8A7B63]"
              />
              Filter by tool
              {hasSelection && (
                <span
                  className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-[10px] font-bold text-primary-foreground"
                  aria-hidden
                >
                  {selected.length}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[280px] overflow-hidden rounded-xl border border-border p-0 shadow-[0_12px_32px_rgba(60,40,10,0.14)]"
          >
            <Command
              className="bg-popover"
              // Filter the curated catalog by name; cmdk's default filter
              // matches on the value we pass (name + category label).
            >
              <CommandInput
                placeholder="Search tools: React, Convex…"
                className="text-[14px]"
              />
              <CommandList className="max-h-[280px]">
                <CommandEmpty className="px-3 py-6 text-[13px] text-[#8A7B63]">
                  No tools match that.
                </CommandEmpty>
                {CATALOG.map((tool: CatalogTool) => {
                  const isSel = selectedSet.has(tool.name.toLowerCase());
                  return (
                    <CommandItem
                      key={`${tool.category}-${tool.name}`}
                      value={`${tool.name} ${CATEGORY_LABELS[tool.category]}`}
                      onSelect={() => onToggle(tool.name)}
                      className="gap-2.5 rounded-lg py-2"
                    >
                      <LogoFramework name={tool.name} slug={tool.slug} />
                      <span className="text-[13.5px] font-semibold text-foreground">
                        {tool.name}
                      </span>
                      <span className="ml-auto flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                          {CATEGORY_LABELS[tool.category]}
                        </span>
                        {isSel && (
                          <HugeiconsIcon
                            icon={Tick02Icon}
                            className="size-4 text-primary"
                          />
                        )}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Match mode — only meaningful with 2+ tools, but kept visible so the
            control doesn't jump around. */}
        <ToggleGroup
          type="single"
          value={matchMode}
          onValueChange={(v) => {
            if (v === "all" || v === "any") onMatchModeChange(v);
          }}
          variant="outline"
          size="sm"
          className="h-9"
          aria-label="Match mode"
        >
          <ToggleGroupItem
            value="all"
            aria-label="Match all selected tools"
            className="h-9 px-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            All
          </ToggleGroupItem>
          <ToggleGroupItem
            value="any"
            aria-label="Match any selected tool"
            className="h-9 px-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Any
          </ToggleGroupItem>
        </ToggleGroup>

        {hasSelection && (
          <button
            type="button"
            onClick={onClear}
            className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A7B63] underline-offset-4 hover:text-primary hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Selected tool chips */}
      {hasSelection && (
        <div className="flex flex-wrap items-center gap-2">
          {selected.map((name) => {
            const tool = catalogByName.get(name.toLowerCase());
            return (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#F0DCC2] bg-[#FFF8F0] py-1 pl-2 pr-1.5 text-[12px] font-semibold text-foreground"
              >
                <LogoFramework name={name} slug={tool?.slug} size={15} />
                {name}
                <button
                  type="button"
                  onClick={() => onRemove(name)}
                  aria-label={`Remove ${name}`}
                  className="flex size-4 items-center justify-center rounded-full text-[#8A7B63] transition-colors hover:bg-[#F0DCC2] hover:text-foreground"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
