"use client";

// Client shell for the browse feed. Owns the tool-filter state and live-queries
// the public feed via convex/react so filtering updates without a page reload.
// The server page (app/browse/page.tsx) keeps the heading + CTA and mounts this
// with an initial server-rendered feed so there's content on first paint.

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import StackPile, { type StackPileStack } from "@/components/browse/stackPile";
import BrowseFilter, { type MatchMode } from "@/components/browse/browseFilter";

const FEED_LIMIT = 36;

// Normalize a raw stack (server or client shape) into what StackPile expects,
// defaulting the pile fields so an older deployed query shape never crashes.
function normalize(stack: {
  id: string;
  name: string;
  subtitle?: string;
  authorName?: string;
  handle?: string;
  avatarUrl?: string;
  toolCount?: number;
  sections?: StackPileStack["sections"];
}): StackPileStack {
  return {
    id: stack.id,
    name: stack.name,
    subtitle: stack.subtitle,
    authorName: stack.authorName,
    handle: stack.handle,
    avatarUrl: stack.avatarUrl,
    toolCount: stack.toolCount ?? 0,
    sections: stack.sections ?? [],
  };
}

export default function BrowseFeed({
  initialStacks,
}: {
  initialStacks: StackPileStack[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [matchMode, setMatchMode] = useState<MatchMode>("all");

  const toolFilter = useMemo(
    () => selected.map((n) => n.toLowerCase()),
    [selected]
  );
  const isFiltering = toolFilter.length > 0;

  // Skip the live query entirely until the user filters — the server already
  // rendered the default feed, so there's nothing to fetch on first paint.
  const filtered = useQuery(
    api.discover.listPublicStacks,
    isFiltering
      ? { limit: FEED_LIMIT, toolFilter, matchMode }
      : "skip"
  );

  const toggle = (name: string) =>
    setSelected((prev) =>
      prev.some((n) => n.toLowerCase() === name.toLowerCase())
        ? prev.filter((n) => n.toLowerCase() !== name.toLowerCase())
        : [...prev, name]
    );
  const remove = (name: string) =>
    setSelected((prev) =>
      prev.filter((n) => n.toLowerCase() !== name.toLowerCase())
    );
  const clear = () => setSelected([]);

  // While a filtered query is in flight, `filtered` is undefined — keep the
  // last-known list visible so the grid doesn't flash empty.
  const loading = isFiltering && filtered === undefined;
  const stacks: StackPileStack[] = isFiltering
    ? (filtered ?? []).map(normalize)
    : initialStacks;

  return (
    <div className="flex flex-col gap-7">
      <BrowseFilter
        selected={selected}
        onToggle={toggle}
        onRemove={remove}
        onClear={clear}
        matchMode={matchMode}
        onMatchModeChange={setMatchMode}
      />

      {loading ? (
        <div className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-dashed border-[#E0D5BE] px-6 py-10">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#B4A78E]">
            Filtering…
          </span>
        </div>
      ) : stacks.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border-[1.5px] border-dashed border-[#E0D5BE] px-6 py-10">
          {isFiltering ? (
            <>
              <p className="text-[15px] text-[#8A7B63]">
                No public stacks use those tools yet.
              </p>
              <p className="text-[13.5px] text-[#B4A78E]">
                Try “Any” to widen the match, or remove a tool.
              </p>
            </>
          ) : (
            <>
              <p className="text-[15px] text-[#8A7B63]">
                No public stacks yet — yours could be the first one here.
              </p>
              <p className="text-[13.5px] text-[#B4A78E]">
                Build a card, then flip it to public from your dashboard.
              </p>
            </>
          )}
        </div>
      ) : (
        // Piles rotate slightly when closed — the grid must never clip them, so
        // items keep overflow visible and generous gaps.
        <div className="grid grid-cols-1 items-start gap-7 overflow-visible md:grid-cols-2 xl:grid-cols-3">
          {stacks.map((stack) => (
            <StackPile key={stack.id} stack={stack} />
          ))}
        </div>
      )}
    </div>
  );
}
