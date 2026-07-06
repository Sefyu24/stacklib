"use client";

import { useDroppable } from "@dnd-kit/core";
import SortableToolList, {
  SortableTool,
} from "@/components/sections/sortableToolList";
import { api } from "@/convex/_generated/api";
import { FunctionReturnType } from "convex/server";
import { Id } from "@/convex/_generated/dataModel";
import {
  SUGGESTIONS,
  findCatalogTool,
  CatalogCategory,
  CatalogTool,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";

type StackData = FunctionReturnType<typeof api.stacks.getStack>;
type Section = StackData["sections"][number];

interface SectionBlockProps {
  section: Section;
  /** Rows come from the board's optimistic state, not the server section. */
  tools: SortableTool[];
  onAddCatalog: (tool: CatalogTool) => void;
  onTogglePin: (toolId: Id<"tools">) => void;
  onRemove: (toolId: Id<"tools">) => void;
}

export default function SectionBlock({
  section,
  tools,
  onAddCatalog,
  onTogglePin,
  onRemove,
}: SectionBlockProps) {
  const category = section.sectionType as CatalogCategory;
  const count = tools.length;
  const pinnedCount = tools.filter((t) => t.pinned).length;

  // The whole section body is a drop target so tools can land here even
  // when the section is empty.
  const { setNodeRef, isOver } = useDroppable({ id: section._id });

  const countLabel =
    count === 0
      ? "empty"
      : `${count} ${count === 1 ? "tool" : "tools"}${
          pinnedCount ? ` · ${pinnedCount} pinned` : ""
        } · drag to reorder`;

  const selectedNames = new Set(tools.map((t) => t.name.toLowerCase()));
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

      <div
        ref={setNodeRef}
        className={cn(
          "rounded-[12px] transition-shadow",
          isOver && "shadow-[0_0_0_2px_var(--primary)]"
        )}
      >
        {count > 0 ? (
          <SortableToolList
            tools={tools}
            onTogglePin={onTogglePin}
            onRemove={onRemove}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-2 rounded-[10px] border-[1.5px] border-dashed border-[#E0D5BE] px-3.5 py-3">
            <span className="text-[12.5px] text-[#B4A78E]">
              {isOver ? "Drop it here" : "Popular:"}
            </span>
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
    </div>
  );
}
