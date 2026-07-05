"use client";

import { useEffect, useRef, useState } from "react";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import LogoFramework from "@/app/stack/logo-framework";
import {
  searchCatalog,
  CATEGORY_LABELS,
  CatalogTool,
} from "@/lib/catalog";

interface UniversalSearchProps {
  selectedNames: string[];
  onAddCatalog: (tool: CatalogTool) => void;
  onAddCustom: (name: string) => void;
}

/**
 * One search field for every section. Matches a query against the curated
 * catalog and files the chosen tool into its category automatically; anything
 * not in the catalog can be added as a custom tool.
 */
export default function UniversalSearch({
  selectedNames,
  onAddCatalog,
  onAddCustom,
}: UniversalSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = new Set(selectedNames.map((n) => n.toLowerCase()));
  const results = searchCatalog(query).filter(
    (t) => !selected.has(t.name.toLowerCase())
  );
  const q = query.trim();
  const showCustom =
    q.length >= 2 && results.length === 0 && !selected.has(q.toLowerCase());

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const reset = () => {
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative mb-7">
      <Command
        shouldFilter={false}
        className="overflow-visible rounded-xl border-[1.5px] border-input bg-white focus-within:border-primary [&_[data-slot=command-input-wrapper]]:border-0 [&_[data-slot=command-input-wrapper]]:px-4"
      >
        <CommandInput
          value={query}
          onValueChange={(v) => {
            setQuery(v);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setOpen(true);
          }}
          placeholder="Add a tool — React, Convex, Cursor…"
          className="h-11 text-[14.5px]"
        />
        {open && q.length >= 1 && (results.length > 0 || showCustom) && (
          <CommandList className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-72 rounded-xl border border-border bg-popover p-1.5 shadow-[0_12px_32px_rgba(60,40,10,0.14)]">
            {results.map((r) => (
              <CommandItem
                key={`${r.category}-${r.name}`}
                value={`${r.category}-${r.name}`}
                onSelect={() => {
                  onAddCatalog(r);
                  reset();
                }}
                className="gap-2.5 rounded-lg py-2"
              >
                <LogoFramework name={r.name} slug={r.slug} />
                <span className="text-[13.5px] font-semibold text-foreground">
                  {r.name}
                </span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {CATEGORY_LABELS[r.category]}
                </span>
              </CommandItem>
            ))}
            {showCustom && (
              <CommandItem
                value={`custom-${q}`}
                onSelect={() => {
                  onAddCustom(q);
                  reset();
                }}
                className="gap-2.5 rounded-lg py-2"
              >
                <span className="flex size-5 items-center justify-center rounded-[5px] border-[1.5px] border-dashed border-[#D9A16B] text-[13px] font-extrabold text-primary">
                  +
                </span>
                <span className="text-[13.5px] font-semibold text-foreground">
                  Add “{q}” as a custom tool
                </span>
              </CommandItem>
            )}
          </CommandList>
        )}
      </Command>
    </div>
  );
}
