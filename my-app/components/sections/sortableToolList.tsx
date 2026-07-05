"use client";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
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
  onReorder: (orderedToolIds: Id<"tools">[]) => void;
  onTogglePin: (toolId: Id<"tools">) => void;
  onRemove: (toolId: Id<"tools">) => void;
}

export default function SortableToolList({
  tools,
  onReorder,
  onTogglePin,
  onRemove,
}: SortableToolListProps) {
  // Local order for snappy drag; re-synced whenever server data changes.
  const [items, setItems] = useState<SortableTool[]>(tools);
  useEffect(() => setItems(tools), [tools]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((t) => t.toolId === active.id);
    const newIndex = items.findIndex((t) => t.toolId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    onReorder(next.map((t) => t.toolId));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((t) => t.toolId)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col gap-[7px]">
          {items.map((tool) => (
            <SortableRow
              key={tool.toolId}
              tool={tool}
              onTogglePin={() => onTogglePin(tool.toolId)}
              onRemove={() => onRemove(tool.toolId)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  tool,
  onTogglePin,
  onRemove,
}: {
  tool: SortableTool;
  onTogglePin: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tool.toolId });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-[11px] rounded-[10px] border px-3 py-[9px]",
        tool.pinned
          ? "border-[#F2CFA6] bg-[#FEF3E7]"
          : "border-border bg-card",
        isDragging && "z-10 shadow-md"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-[#C9BCA2] hover:text-[#A0713C] active:cursor-grabbing"
        aria-label={`Drag ${tool.name}`}
        {...attributes}
        {...listeners}
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} className="h-[14px] w-[14px]" />
      </button>

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
        aria-label={`Remove ${tool.name}`}
        className="size-7 rounded-lg text-[#B4A78E] hover:bg-[#F8E0D8] hover:text-destructive"
      >
        <HugeiconsIcon icon={Cancel01Icon} className="h-[13px] w-[13px]" />
      </Button>
    </li>
  );
}
