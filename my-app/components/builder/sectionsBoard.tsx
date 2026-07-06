"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import SectionBlock from "@/components/builder/sectionBlock";
import { SortableTool, ToolRowView } from "@/components/sections/sortableToolList";
import { api } from "@/convex/_generated/api";
import { FunctionReturnType } from "convex/server";
import { Id } from "@/convex/_generated/dataModel";
import {
  getSectionDisplay,
  DisplaySectionInput,
  SECTION_CARD_CAP,
} from "@/lib/card/display";
import { CatalogTool } from "@/lib/catalog";

type StackData = FunctionReturnType<typeof api.stacks.getStack>;
type Section = StackData["sections"][number];

type Board = Record<string, SortableTool[]>;

function buildBoard(sections: Section[]): Board {
  const board: Board = {};
  for (const section of sections) {
    const pinnedIds = new Set(section.pinnedTools.map((p) => p.toolId));
    const display = getSectionDisplay(
      section as unknown as DisplaySectionInput,
      SECTION_CARD_CAP
    );
    const onCardKeys = new Set(display.tools.map((t) => t.toolId));
    const overflows = section.selectedTools.length > SECTION_CARD_CAP;
    board[section._id] = section.selectedTools.map((st) => ({
      toolId: st.toolId,
      name: st.tool.name,
      url: st.tool.url,
      logoUrl: st.tool.logoUrl,
      iconSlug: st.tool.iconSlug,
      pinned: pinnedIds.has(st.toolId),
      onCard: onCardKeys.has(st.toolId) && overflows,
    }));
  }
  return board;
}

interface SectionsBoardProps {
  sections: Section[];
  onAddCatalog: (tool: CatalogTool) => void;
  onReorder: (sectionId: Id<"sections">, toolIds: Id<"tools">[]) => void;
  onMove: (
    toolId: Id<"tools">,
    fromSectionId: Id<"sections">,
    toSectionId: Id<"sections">,
    targetIndex: number
  ) => void;
  onTogglePin: (sectionId: Id<"sections">, toolId: Id<"tools">) => void;
  onRemove: (sectionId: Id<"sections">, toolId: Id<"tools">) => void;
}

/**
 * All sections under ONE DndContext, so rows sort within a section and can
 * be dropped into any other section — the user decides where a tool lives,
 * even if that's React in Backend. Board state is optimistic during drags;
 * the server (reorder / move mutations) reconciles after drop.
 */
export default function SectionsBoard({
  sections,
  onAddCatalog,
  onReorder,
  onMove,
  onTogglePin,
  onRemove,
}: SectionsBoardProps) {
  const [board, setBoard] = useState<Board>(() => buildBoard(sections));
  const [activeTool, setActiveTool] = useState<SortableTool | null>(null);
  // Where the active row started, for the end-of-drag mutation.
  const originRef = useRef<string | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!draggingRef.current) setBoard(buildBoard(sections));
  }, [sections]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContainer = (id: UniqueIdentifier): string | undefined => {
    if (board[id as string]) return id as string;
    return Object.keys(board).find((key) =>
      board[key].some((t) => t.toolId === id)
    );
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    const container = findContainer(active.id);
    if (!container) return;
    draggingRef.current = true;
    originRef.current = container;
    setActiveTool(
      board[container].find((t) => t.toolId === active.id) ?? null
    );
  };

  // Cross-section moves happen live in local state so the row visually
  // leaves one list and joins the other while dragging.
  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const from = findContainer(active.id);
    const to = findContainer(over.id);
    if (!from || !to || from === to) return;
    setBoard((prev) => {
      const moving = prev[from].find((t) => t.toolId === active.id);
      if (!moving) return prev;
      const overIndex = prev[to].findIndex((t) => t.toolId === over.id);
      const insertAt = overIndex === -1 ? prev[to].length : overIndex;
      return {
        ...prev,
        [from]: prev[from].filter((t) => t.toolId !== active.id),
        [to]: [
          ...prev[to].slice(0, insertAt),
          moving,
          ...prev[to].slice(insertAt),
        ],
      };
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    draggingRef.current = false;
    setActiveTool(null);
    const origin = originRef.current;
    originRef.current = null;

    const container = findContainer(active.id);
    if (!origin || !container) return;

    if (container === origin) {
      // Same section: a plain reorder.
      if (!over || active.id === over.id) return;
      const items = board[container];
      const oldIndex = items.findIndex((t) => t.toolId === active.id);
      const newIndex = items.findIndex((t) => t.toolId === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const next = arrayMove(items, oldIndex, newIndex);
      setBoard((prev) => ({ ...prev, [container]: next }));
      onReorder(
        container as Id<"sections">,
        next.map((t) => t.toolId)
      );
      return;
    }

    // Cross-section: local state already reflects the move (handleDragOver);
    // persist it at the position it landed.
    const index = board[container].findIndex((t) => t.toolId === active.id);
    onMove(
      active.id as Id<"tools">,
      origin as Id<"sections">,
      container as Id<"sections">,
      index === -1 ? board[container].length : index
    );
  };

  const handleDragCancel = () => {
    draggingRef.current = false;
    setActiveTool(null);
    originRef.current = null;
    setBoard(buildBoard(sections));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col gap-[26px]">
        {sections.map((section) => (
          <SectionBlock
            key={section._id}
            section={section}
            tools={board[section._id] ?? []}
            onAddCatalog={onAddCatalog}
            onTogglePin={(toolId) => onTogglePin(section._id, toolId)}
            onRemove={(toolId) => onRemove(section._id, toolId)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTool ? <ToolRowView tool={activeTool} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
