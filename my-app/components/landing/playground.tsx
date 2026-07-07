"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  searchCatalog,
  findCatalogTool,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CatalogTool,
} from "@/lib/catalog";
import { Logomark, Wordmark } from "@/components/brand/logo";

// Self-hosted Brandfetch PNGs (public/hero-icons/<slug>.png). Catalog tools
// surfaced by SEARCH may have no file here — ToolIcon layers this image over a
// letter tile, so a missing PNG simply reveals the letter (never a CDN call).
const si = (slug: string) => `/hero-icons/${slug}.png`;

const POPULAR = [
  "React",
  "Next.js",
  "Tailwind CSS",
  "Svelte",
  "Convex",
  "Supabase",
  "Node.js",
  "Cursor",
  "VS Code",
  "Claude",
  "ChatGPT",
  "Vercel",
  "Figma",
  "Docker",
]
  .map(findCatalogTool)
  .filter((t): t is CatalogTool => Boolean(t));

const INITIAL_PICKS = ["React", "Convex", "Claude"]
  .map(findCatalogTool)
  .filter((t): t is CatalogTool => Boolean(t));

function ToolIcon({
  tool,
  size,
}: {
  tool: { name: string; slug: string };
  size: number;
}) {
  return (
    <span
      className="relative flex-none"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="absolute inset-0 flex items-center justify-center rounded-[26%] bg-[#F3E8D6] font-extrabold text-[#A0713C]"
        style={{ fontSize: size * 0.5 }}
      >
        {tool.name[0]?.toUpperCase()}
      </span>
      {tool.slug && (
        <span
          className="absolute inset-0 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${si(tool.slug)}')` }}
        />
      )}
    </span>
  );
}

/**
 * The "try it — no signup" section: pick tools, watch the card build itself.
 * Purely local state; the real builder takes over from /stack.
 */
export default function Playground() {
  const [query, setQuery] = useState("");
  const [picks, setPicks] = useState<CatalogTool[]>(INITIAL_PICKS);
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const pickKeys = new Set(picks.map((p) => p.name.toLowerCase()));
  const results = searchCatalog(query, 6).filter(
    (t) => !pickKeys.has(t.name.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (tool: CatalogTool) => {
    setPicks((prev) => {
      const key = tool.name.toLowerCase();
      if (prev.some((p) => p.name.toLowerCase() === key)) {
        return prev.filter((p) => p.name.toLowerCase() !== key);
      }
      return [...prev, tool];
    });
    setQuery("");
    setOpen(false);
  };

  const cardSections = CATEGORY_ORDER.map((cat) => ({
    cat,
    name: CATEGORY_LABELS[cat].toUpperCase(),
    tools: picks.filter((p) => p.category === cat),
  })).filter((s) => s.tools.length > 0);

  const statLabel = `${picks.length} ${picks.length === 1 ? "tool" : "tools"}`;

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* picker */}
      <div className="flex flex-col gap-5">
        <div ref={ref} className="relative">
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
              placeholder="Search any tool: Svelte, Supabase, Zed…"
              className="h-12 text-[15px]"
            />
            {open && query.trim().length >= 1 && results.length > 0 && (
              <CommandList className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-xl border border-border bg-popover p-1.5 shadow-[0_12px_32px_rgba(60,40,10,0.14)]">
                {results.map((r) => (
                  <CommandItem
                    key={`${r.category}-${r.name}`}
                    value={`${r.category}-${r.name}`}
                    onSelect={() => toggle(r)}
                    className="gap-2.5 rounded-lg py-2"
                  >
                    <ToolIcon tool={r} size={20} />
                    <span className="text-[13.5px] font-semibold">{r.name}</span>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-[#B4A78E]">
                      {CATEGORY_LABELS[r.category]}
                    </span>
                  </CommandItem>
                ))}
              </CommandList>
            )}
          </Command>
        </div>

        <div>
          <div className="mb-2.5 font-mono text-[10.5px] font-bold tracking-[0.18em] text-[#8A7B63]">
            POPULAR PICKS
          </div>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map((p) => {
              const on = pickKeys.has(p.name.toLowerCase());
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => toggle(p)}
                  aria-pressed={on}
                  className={`flex cursor-pointer items-center gap-[7px] rounded-full border-[1.5px] px-3.5 py-2 text-[13px] font-semibold text-foreground transition-colors ${
                    on
                      ? "border-primary bg-[#FEF3E7]"
                      : "border-[#E0D5BE] bg-card hover:border-primary/60"
                  }`}
                >
                  <ToolIcon tool={p} size={15} />
                  {p.name}
                  <span
                    className={`font-extrabold ${on ? "text-[#B4A78E]" : "text-primary"}`}
                  >
                    {on ? "×" : "+"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-dashed border-[#E0D5BE] px-4 py-3.5">
          <span className="text-[13px] leading-relaxed text-[#8A7B63]">
            Like what you see?{" "}
            <Link
              href="/stack"
              className="font-bold text-primary hover:underline"
            >
              Open the full builder →
            </Link>{" "}
            pin favorites, drag to reorder, import from GitHub.
          </span>
        </div>
      </div>

      {/* live card */}
      <div className="flex flex-col gap-3">
        <span className="font-mono text-[10.5px] font-bold tracking-[0.2em] text-[#8A7B63]">
          YOUR CARD
        </span>
        <div className="rounded-[18px] border-[1.5px] border-foreground bg-[#FBF7F0] p-[9px] shadow-[0_4px_0_var(--foreground)]">
          <div className="rounded-[11px] border border-[#EDE4D2] bg-card px-[22px] pb-3.5 pt-5">
            <div className="flex items-baseline justify-end">
              <span className="font-mono text-[9.5px] text-[#B4A78E]">
                {statLabel}
              </span>
            </div>
            <div className="mb-3 mt-[7px] text-[21px] font-black tracking-[-0.02em]">
              Your Tech Stack
            </div>
            {picks.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {cardSections.map((cs) => (
                  <div key={cs.cat}>
                    <div className="mb-1 font-mono text-[8px] font-bold tracking-[0.2em] text-[#B4A78E]">
                      {cs.name}
                    </div>
                    <div className="flex flex-wrap gap-[5px]">
                      {cs.tools.map((ct) => (
                        <span
                          key={ct.name}
                          className="inline-flex items-center gap-[5px] rounded-md border border-[#F0DCC2] bg-[#FFF8F0] px-[9px] py-1 text-[11px] font-semibold"
                        >
                          <ToolIcon tool={ct} size={12} />
                          {ct.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-[22px] text-center text-[12.5px] text-[#B4A78E]">
                Add a tool to see it here ✦
              </div>
            )}
            <div className="mt-3.5 flex items-center justify-between border-t border-[#EDE4D2] pt-[9px]">
              <span className="font-mono text-[9px] text-[#B4A78E]">
                powered by superstacks.dev
              </span>
              <Logomark size={13} />
            </div>
          </div>
        </div>
        <Link
          href="/stack"
          className="rounded-[10px] border border-primary bg-primary p-3 text-center text-[13.5px] font-bold text-primary-foreground hover:bg-[var(--primary-hover)]"
        >
          Keep this card and customize it
        </Link>
      </div>
    </div>
  );
}
