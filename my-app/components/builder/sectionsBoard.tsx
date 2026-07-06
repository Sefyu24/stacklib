"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MeasuringStrategy,
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
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  // Where the active row started, for the end-of-drag mutation.
  const originRef = useRef<string | null>(null);
  const draggingRef = useRef(false);
  // Canonical dnd-kit multi-container guards: without them, moving a row
  // into another section collapses the origin list, collision detection
  // flips back, and onDragOver oscillates until React hits its update
  // depth limit (error #185).
  const boardRef = useRef(board);
  boardRef.current = board;
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMoved = useRef(false);

  useEffect(() => {
    if (!draggingRef.current) setBoard(buildBoard(sections));
  }, [sections]);

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMoved.current = false;
    });
  }, [board]);

  /**
   * Pointer-first collision: after a row transfers to the section under the
   * pointer, the pointer is still inside that section, so the choice is
   * stable frame-to-frame. When hovering a non-empty section, pick the
   * closest row inside it; while layout is settling after a transfer, stick
   * with the last target instead of re-deciding.
   */
  const collisionStrategy: CollisionDetection = useCallback(
    (args) => {
      const pointerHits = pointerWithin(args);
      const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args);
      let overId = getFirstCollision(hits, "id");

      if (overId != null) {
        const containerItems = boardRef.current[overId as string];
        if (containerItems) {
          // Over a section container: narrow to its closest row, if any.
          if (containerItems.length > 0) {
            const closest = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (c) =>
                  c.id !== overId &&
                  containerItems.some((t) => t.toolId === c.id)
              ),
            });
            if (closest.length > 0) overId = closest[0].id;
          }
        }
        lastOverId.current = overId;
        return [{ id: overId }];
      }

      if (recentlyMoved.current && activeId) {
        lastOverId.current = activeId;
      }
      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [activeId]
  );

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
    lastOverId.current = null;
    setActiveId(active.id);
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
      let insertAt: number;
      if (prev[over.id as string]) {
        // Dropped over the section body itself (e.g. an empty section).
        insertAt = prev[to].length;
      } else {
        const overIndex = prev[to].findIndex((t) => t.toolId === over.id);
        const isBelowOverItem =
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;
        insertAt =
          overIndex === -1
            ? prev[to].length
            : overIndex + (isBelowOverItem ? 1 : 0);
      }
      recentlyMoved.current = true;
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
    setActiveId(null);
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
      ).catch(() => setBoard(buildBoard(sections)));
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
    ).catch(() => setBoard(buildBoard(sections)));
  };

  const handleDragCancel = () => {
    draggingRef.current = false;
    setActiveTool(null);
    setActiveId(null);
    originRef.current = null;
    setBoard(buildBoard(sections));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionStrategy}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
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
