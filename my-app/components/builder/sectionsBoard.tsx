"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  closestCenter,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
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
  onReorder: (
    sectionId: Id<"sections">,
    toolIds: Id<"tools">[]
  ) => Promise<void>;
  onMove: (
    toolId: Id<"tools">,
    fromSectionId: Id<"sections">,
    toSectionId: Id<"sections">,
    targetIndex: number
  ) => Promise<void>;
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
  // Rows do NOT transfer between sections mid-drag. Our sections stack
  // vertically, so a live transfer shifts every section below it, which
  // changes what's under the pointer without it moving — collision then
  // re-decides, transfers back, and the nested update loop crashes React
  // (error #185). Instead: highlight the target while dragging (isOver on
  // the section droppable), and perform the move ONCE at drop.
  const boardRef = useRef(board);
  boardRef.current = board;

  useEffect(() => {
    if (!draggingRef.current) setBoard(buildBoard(sections));
  }, [sections]);

  /**
   * Pointer-first collision, stable because the board's layout never
   * changes during a drag. Hovering a non-empty section narrows to its
   * closest row so within-section sorting still feels precise.
   */
  const collisionStrategy: CollisionDetection = useCallback((args) => {
    const pointerHits = pointerWithin(args);
    const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args);
    let overId = getFirstCollision(hits, "id");
    if (overId == null) return [];

    const containerItems = boardRef.current[overId as string];
    if (containerItems && containerItems.length > 0) {
      const closest = closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (c) => c.id !== overId && containerItems.some((t) => t.toolId === c.id)
        ),
      });
      if (closest.length > 0) overId = closest[0].id;
    }
    return [{ id: overId }];
  }, []);

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

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    draggingRef.current = false;
    setActiveTool(null);
    const origin = originRef.current;
    originRef.current = null;

    if (!origin || !over) return;
    // The board is untouched during the drag, so the drop target comes
    // straight from `over`: either a section container or a row in one.
    const target = findContainer(over.id);
    if (!target) return;

    if (target === origin) {
      // Same section: a plain reorder.
      if (active.id === over.id) return;
      const items = board[origin];
      const oldIndex = items.findIndex((t) => t.toolId === active.id);
      const newIndex = items.findIndex((t) => t.toolId === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const next = arrayMove(items, oldIndex, newIndex);
      setBoard((prev) => ({ ...prev, [origin]: next }));
      onReorder(
        origin as Id<"sections">,
        next.map((t) => t.toolId)
      ).catch(() => setBoard(buildBoard(sections)));
      return;
    }

    // Cross-section: transfer once, at drop.
    const moving = board[origin].find((t) => t.toolId === active.id);
    if (!moving) return;
    let insertAt: number;
    if (board[over.id as string]) {
      // Dropped on the section body itself (e.g. an empty section).
      insertAt = board[target].length;
    } else {
      const overIndex = board[target].findIndex((t) => t.toolId === over.id);
      const isBelowOverItem =
        active.rect.current.translated &&
        active.rect.current.translated.top > over.rect.top + over.rect.height;
      insertAt =
        overIndex === -1
          ? board[target].length
          : overIndex + (isBelowOverItem ? 1 : 0);
    }
    setBoard((prev) => ({
      ...prev,
      [origin]: prev[origin].filter((t) => t.toolId !== active.id),
      [target]: [
        ...prev[target].slice(0, insertAt),
        moving,
        ...prev[target].slice(insertAt),
      ],
    }));
    onMove(
      active.id as Id<"tools">,
      origin as Id<"sections">,
      target as Id<"sections">,
      insertAt
    ).catch(() => setBoard(buildBoard(sections)));
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
      collisionDetection={collisionStrategy}
      onDragStart={handleDragStart}
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
