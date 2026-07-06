"use client";

import type {
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  TouchEvent,
} from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import LogoFramework from "@/app/stack/logo-framework";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DragDropVerticalIcon,
  PinIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

export interface SortableTool {
  toolId: Id<"tools">;
  name: string;
  url: string;
  logoUrl?: string;
  iconSlug?: string;
  pinned: boolean;
  onCard: boolean;
}

interface SortableToolListProps {
  tools: SortableTool[];
  onTogglePin: (toolId: Id<"tools">) => void;
  onRemove: (toolId: Id<"tools">) => void;
}

/**
 * One section's rows inside the board-wide DndContext (see sectionsBoard).
 * Rows sort within the section and can be dragged into other sections.
 * Sortable ids are toolIds — the universal search prevents the same tool
 * name from being added to two sections, so they're unique board-wide.
 */
export default function SortableToolList({
  tools,
  onTogglePin,
  onRemove,
}: SortableToolListProps) {
  return (
    <SortableContext
      items={tools.map((t) => t.toolId)}
      strategy={verticalListSortingStrategy}
    >
      <ul className="flex flex-col gap-[7px]">
        {tools.map((tool) => (
          <SortableRow
            key={tool.toolId}
            id={tool.toolId}
            tool={tool}
            onTogglePin={() => onTogglePin(tool.toolId)}
            onRemove={() => onRemove(tool.toolId)}
          />
        ))}
      </ul>
    </SortableContext>
  );
}

function SortableRow({
  id,
  tool,
  onTogglePin,
  onRemove,
}: {
  id: string;
  tool: SortableTool;
  onTogglePin: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    // The WHOLE row is the drag handle — grab it anywhere. The pin/remove
    // buttons opt out by stopping activator events (see ToolRowView).
    // touch-manipulation (not touch-none) keeps page scrolling alive on
    // mobile; the TouchSensor's long-press delay handles drag activation.
    <li
      ref={(node) => {
        setNodeRef(node);
        setActivatorNodeRef(node);
      }}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "cursor-grab touch-manipulation select-none active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
      {...attributes}
      {...listeners}
    >
      <ToolRowView tool={tool} onTogglePin={onTogglePin} onRemove={onRemove} />
    </li>
  );
}

/**
 * Keep a press on pin/remove from ever activating a row drag: stop the
 * sensor activator events (mousedown/touchstart/keydown + pointerdown for
 * safety) from bubbling to the row. Clicks still fire on the buttons.
 */
const stopDragActivation = {
  onPointerDown: (e: PointerEvent) => e.stopPropagation(),
  onMouseDown: (e: MouseEvent) => e.stopPropagation(),
  onTouchStart: (e: TouchEvent) => e.stopPropagation(),
  onKeyDown: (e: KeyboardEvent) => e.stopPropagation(),
};

/**
 * The row itself, presentation-only — shared by the sortable rows and the
 * DragOverlay clone that follows the pointer across sections.
 */
export function ToolRowView({
  tool,
  onTogglePin,
  onRemove,
  overlay,
}: {
  tool: SortableTool;
  onTogglePin?: () => void;
  onRemove?: () => void;
  overlay?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-[11px] rounded-[10px] border px-3 py-[9px]",
        tool.pinned
          ? "border-[#F2CFA6] bg-[#FEF3E7]"
          : "border-border bg-card",
        overlay && "shadow-[0_8px_24px_rgba(60,40,10,0.25)]"
      )}
    >
      {/* Purely visual affordance — the whole row is the drag handle. */}
      <span aria-hidden className="text-[#C9BCA2]">
        <HugeiconsIcon icon={DragDropVerticalIcon} className="h-[14px] w-[14px]" />
      </span>

      <LogoFramework
        name={tool.name}
        slug={tool.iconSlug}
        src={tool.logoUrl}
        url={tool.url || undefined}
        size={22}
      />
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-foreground">
        {tool.name}
      </span>

      {tool.onCard && (
        <span className="shrink-0 rounded-[5px] bg-[#FCEBDA] px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.1em] text-[#D97B3E]">
          ON CARD
        </span>
      )}

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onTogglePin}
        {...stopDragActivation}
        aria-label={
          tool.pinned ? `Unpin ${tool.name} from card` : `Pin ${tool.name} to card`
        }
        aria-pressed={tool.pinned}
        className={cn(
          "size-7 rounded-lg hover:bg-[#F8E9D8]",
          tool.pinned ? "text-primary" : "text-[#C9BCA2]"
        )}
      >
        <HugeiconsIcon
          icon={PinIcon}
          className="h-[15px] w-[15px]"
          style={tool.pinned ? { fill: "var(--primary)" } : undefined}
        />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        {...stopDragActivation}
        aria-label={`Remove ${tool.name}`}
        className="size-7 rounded-lg text-[#B4A78E] hover:bg-[#F8E0D8] hover:text-destructive"
      >
        <HugeiconsIcon icon={Cancel01Icon} className="h-[13px] w-[13px]" />
      </Button>
    </div>
  );
}
