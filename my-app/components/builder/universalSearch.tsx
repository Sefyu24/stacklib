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
  CATEGORY_ORDER,
  CatalogCategory,
  CatalogTool,
} from "@/lib/catalog";

/** A pick that didn't come from the catalog: a Brandfetch brand or plain text. */
export interface BrandPick {
  name: string;
  domain?: string;
  logoUrl?: string;
}

interface WebHit {
  name: string | null;
  domain: string;
  icon: string | null;
}

interface UniversalSearchProps {
  selectedNames: string[];
  onAddCatalog: (tool: CatalogTool) => void;
  onAddBrand: (brand: BrandPick, category: CatalogCategory) => void;
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Brandfetch's `name` is sometimes the site owner ("Andrew Sherman" for
 * drizzle.team), which would become the tool's name on the card. Trust it
 * only when it plausibly relates to the domain or the user's query;
 * otherwise derive a clean name from the domain itself.
 */
function brandDisplayName(hit: WebHit, query: string): string {
  const fromDomain = () => {
    const label = hit.domain.split(".")[0] ?? hit.domain;
    return label.charAt(0).toUpperCase() + label.slice(1);
  };
  if (!hit.name) return fromDomain();
  const name = normalize(hit.name);
  const label = normalize(hit.domain.split(".")[0] ?? "");
  const q = normalize(query);
  if (
    (q.length >= 2 && (name.includes(q) || q.includes(name))) ||
    (label && (name.includes(label) || label.includes(name)))
  ) {
    return hit.name;
  }
  return fromDomain();
}

/**
 * One search field for every section. Matches the curated catalog first and
 * files those automatically; everything else is searchable live on Brandfetch
 * (name + domain shown so the user picks the right brand themselves), with a
 * plain-text row as the final fallback. Non-catalog picks choose a section.
 */
export default function UniversalSearch({
  selectedNames,
  onAddCatalog,
  onAddBrand,
}: UniversalSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [webHits, setWebHits] = useState<WebHit[]>([]);
  const [webLoading, setWebLoading] = useState(false);
  // Set once the user picks a non-catalog tool; the dropdown then asks
  // which section it belongs to.
  const [pending, setPending] = useState<BrandPick | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const selected = new Set(selectedNames.map((n) => n.toLowerCase()));
  const results = searchCatalog(query).filter(
    (t) => !selected.has(t.name.toLowerCase())
  );
  const q = query.trim();

  // Live Brandfetch search, debounced. Results render with their domain so
  // a fuzzy hit (e.g. "drizzle" → a cooking blog) is visible, not silent.
  useEffect(() => {
    if (q.length < 2) {
      setWebHits([]);
      setWebLoading(false);
      return;
    }
    const ctl = new AbortController();
    setWebLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/brandfetch/search?name=${encodeURIComponent(q)}`,
          { signal: ctl.signal }
        );
        const brands = res.ok ? await res.json() : [];
        setWebHits(
          Array.isArray(brands)
            ? (brands as WebHit[]).filter((b) => b.domain).slice(0, 5)
            : []
        );
        setWebLoading(false);
      } catch {
        if (!ctl.signal.aborted) setWebLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      ctl.abort();
    };
  }, [q]);

  const catalogNames = new Set(results.map((r) => normalize(r.name)));
  const web = webHits
    .map((h) => ({ ...h, displayName: brandDisplayName(h, q) }))
    .filter(
      (h) =>
        !catalogNames.has(normalize(h.displayName)) &&
        !selected.has(h.displayName.toLowerCase())
    );
  const showCustom = q.length >= 2 && !selected.has(q.toLowerCase());
  const hasRows = results.length > 0 || web.length > 0 || showCustom || webLoading;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setPending(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const reset = () => {
    setQuery("");
    setOpen(false);
    setPending(null);
    setWebHits([]);
  };

  const eyebrow =
    "px-2 pb-1 pt-2 font-mono text-[9.5px] font-bold tracking-[0.18em] text-[#B4A78E]";

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
            setPending(null);
          }}
          onFocus={() => {
            if (query.trim()) setOpen(true);
          }}
          placeholder="Add a tool — React, Convex, Cursor…"
          className="h-11 text-[14.5px]"
        />
        {open && q.length >= 1 && (hasRows || pending) && (
          <CommandList className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-80 rounded-xl border border-border bg-popover p-1.5 shadow-[0_12px_32px_rgba(60,40,10,0.14)]">
            {pending ? (
              <>
                <div className={eyebrow}>
                  ADD “{pending.name.toUpperCase()}” TO…
                </div>
                {CATEGORY_ORDER.map((cat) => (
                  <CommandItem
                    key={cat}
                    value={`section-${cat}`}
                    onSelect={() => {
                      onAddBrand(pending, cat);
                      reset();
                    }}
                    className="gap-2.5 rounded-lg py-2 text-[13.5px] font-semibold text-foreground"
                  >
                    {CATEGORY_LABELS[cat]}
                  </CommandItem>
                ))}
              </>
            ) : (
              <>
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
                {(web.length > 0 || webLoading) && (
                  <div className={eyebrow}>FROM THE WEB</div>
                )}
                {web.map((h) => (
                  <CommandItem
                    key={`web-${h.domain}`}
                    value={`web-${h.domain}`}
                    onSelect={() =>
                      setPending({
                        name: h.displayName,
                        domain: h.domain,
                        logoUrl: h.icon ?? undefined,
                      })
                    }
                    className="gap-2.5 rounded-lg py-2"
                  >
                    <LogoFramework name={h.displayName} src={h.icon} />
                    <span className="text-[13.5px] font-semibold text-foreground">
                      {h.displayName}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                      {h.domain}
                    </span>
                  </CommandItem>
                ))}
                {webLoading && web.length === 0 && (
                  <div className="px-2 py-2 text-[12.5px] text-muted-foreground">
                    Searching the web…
                  </div>
                )}
                {showCustom && (
                  <CommandItem
                    value={`custom-${q}`}
                    onSelect={() => setPending({ name: q })}
                    className="gap-2.5 rounded-lg py-2"
                  >
                    <span className="flex size-5 items-center justify-center rounded-[5px] border-[1.5px] border-dashed border-[#D9A16B] text-[13px] font-extrabold text-primary">
                      +
                    </span>
                    <span className="text-[13.5px] font-semibold text-foreground">
                      Add “{q}” as a plain text tool
                    </span>
                  </CommandItem>
                )}
              </>
            )}
          </CommandList>
        )}
      </Command>
    </div>
  );
}
