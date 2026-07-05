"use client";

import SortableToolList, {
  SortableTool,
} from "@/components/sections/sortableToolList";
import { api } from "@/convex/_generated/api";
import { FunctionReturnType } from "convex/server";
import { Id } from "@/convex/_generated/dataModel";
import {
  getSectionDisplay,
  DisplaySectionInput,
  SECTION_CARD_CAP,
} from "@/lib/card/display";
import {
  SUGGESTIONS,
  findCatalogTool,
  CatalogCategory,
  CatalogTool,
} from "@/lib/catalog";

type StackData = FunctionReturnType<typeof api.stacks.getStack>;
type Section = StackData["sections"][number];

interface SectionBlockProps {
  section: Section;
  onAddCatalog: (tool: CatalogTool) => void;
  onReorder: (toolIds: Id<"tools">[]) => void;
  onTogglePin: (toolId: Id<"tools">) => void;
  onRemove: (toolId: Id<"tools">) => void;
}

export default function SectionBlock({
  section,
  onAddCatalog,
  onReorder,
  onTogglePin,
  onRemove,
}: SectionBlockProps) {
  const category = section.sectionType as CatalogCategory;
  const pinnedIds = new Set(section.pinnedTools.map((p) => p.toolId));
  const pinnedCount = section.pinnedTools.length;
  const count = section.selectedTools.length;

  // Which tools actually make the card, to drive the "ON CARD" badge.
  const display = getSectionDisplay(
    section as unknown as DisplaySectionInput,
    SECTION_CARD_CAP
  );
  const onCardKeys = new Set(display.tools.map((t) => t.toolId));
  const overflows = count > SECTION_CARD_CAP;

  const tools: SortableTool[] = section.selectedTools.map((st) => ({
    toolId: st.toolId,
    name: st.tool.name,
    url: st.tool.url,
    logoUrl: st.tool.logoUrl,
    iconSlug: st.tool.iconSlug,
    pinned: pinnedIds.has(st.toolId),
    onCard: onCardKeys.has(st.toolId) && overflows,
  }));

  const countLabel =
    count === 0
      ? "empty"
      : `${count} ${count === 1 ? "tool" : "tools"}${
          pinnedCount ? ` · ${pinnedCount} pinned` : ""
        } · drag to reorder`;

  const selectedNames = new Set(
    section.selectedTools.map((st) => st.tool.name.toLowerCase())
  );
  const suggestions = SUGGESTIONS[category]
    .filter((n) => !selectedNames.has(n.toLowerCase()))
    .map((n) => findCatalogTool(n))
    .filter((t): t is CatalogTool => Boolean(t));

  return (
    <div>
      <div className="mb-2.5 flex items-baseline gap-2.5">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">
          {section.name}
        </span>
        <span className="font-mono text-[10.5px] text-[#B4A78E]">
          {countLabel}
        </span>
        <span className="h-px flex-1 self-center bg-[#EDE4D2]" />
      </div>

      {count > 0 ? (
        <SortableToolList
          tools={tools}
          onReorder={onReorder}
          onTogglePin={onTogglePin}
          onRemove={onRemove}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-2 rounded-[10px] border-[1.5px] border-dashed border-[#E0D5BE] px-3.5 py-3">
          <span className="text-[12.5px] text-[#B4A78E]">Popular:</span>
          {suggestions.map((sug) => (
            <button
              key={sug.name}
              type="button"
              onClick={() => onAddCatalog(sug)}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E0D5BE] bg-card px-[11px] py-[5px] text-[12.5px] font-semibold text-[#6B5D46] transition-colors hover:border-primary hover:text-primary"
            >
              <span className="font-extrabold text-primary">+</span>
              {sug.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
