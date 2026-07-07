"use client";

// Interactive overlay for the lid theme: one transparent proxy per sticker,
// at the EXACT geometry the art renders (same getStickerLayout output, same
// stickerLeft/stickerTop mapping from lib/card/render.ts — never local math).
// The layer lives inside the ScaledCard stage, i.e. in the unscaled 1200x630
// coordinate space, so proxy positions are 1x px; only pointer deltas need
// dividing by the stage scale.

import { useRef } from "react";
import {
  LID_W,
  LID_H,
  LidSticker,
  OVERFLOW_STICKER_ID,
  stickerLeft,
  stickerTop,
  stickerXFromLeft,
  stickerYFromTop,
} from "@/lib/card/render";

interface DragState {
  toolId: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  /** Sticker's top-left in 1x card px at pointerdown */
  startLeft: number;
  startTop: number;
  /** Latest normalized position (what onDragEnd persists) */
  lastX: number;
  lastY: number;
  /** True once the pointer travels past DRAG_THRESHOLD px — a real drag */
  moved: boolean;
}

/** A tap that traveled less than this (screen px) counts as a click, not a
 *  drag — so a slightly-jittery double-tap still toggles the mode. */
const DRAG_THRESHOLD = 6;
/** Two taps within this window (ms) on the same sticker = a double-tap. */
const DOUBLE_TAP_MS = 300;

export default function StickerDragLayer({
  stickers,
  scale,
  onDragMove,
  onDragEnd,
  onCycleMode,
}: {
  stickers: LidSticker[];
  /** ScaledCard stage scale: on-screen px per 1x card px */
  scale: number;
  /** Live (optimistic) position update while dragging — normalized 0..1 */
  onDragMove: (toolId: string, x: number, y: number) => void;
  /** Final position on release — normalized 0..1, ready to persist */
  onDragEnd: (toolId: string, x: number, y: number) => void;
  /** Double-click / double-tap a sticker: cycle its display mode */
  onCycleMode: (toolId: string) => void;
}) {
  const drag = useRef<DragState | null>(null);
  // Last completed tap (no drag): used to detect a double-tap across two
  // separate pointer cycles, works for both mouse and touch.
  const lastTap = useRef<{ toolId: string; time: number } | null>(null);

  return (
    <div
      data-testid="sticker-drag-layer"
      className="absolute left-0 top-0"
      style={{ width: LID_W, height: LID_H, pointerEvents: "none" }}
    >
      {stickers.map((s) => {
        // The "+N MORE" pill is synthetic (no tools row to persist against),
        // so it stays put — only real tool stickers are draggable/cyclable.
        const draggable = s.toolId !== OVERFLOW_STICKER_ID;
        return (
          <div
            key={s.toolId}
            data-sticker-proxy={s.toolId}
            role={draggable ? "button" : undefined}
            aria-label={
              draggable
                ? `Drag the ${s.name} sticker, or double-click to toggle logo and name`
                : undefined
            }
            className={
              draggable
                ? "cursor-grab touch-none select-none active:cursor-grabbing hover:[outline:4px_dashed_rgba(255,247,238,0.55)] active:[outline:4px_dashed_rgba(255,247,238,0.85)]"
                : undefined
            }
            style={{
              position: "absolute",
              left: stickerLeft(s.x, s.w),
              top: stickerTop(s.y, s.h),
              width: s.w,
              height: s.h,
              transform: `rotate(${s.rotation}deg)`,
              borderRadius:
                s.shape === "circle"
                  ? s.w
                  : s.shape === "pill"
                    ? s.h
                    : s.w * 0.22,
              outlineOffset: 5,
              pointerEvents: draggable ? "auto" : "none",
            }}
            onPointerDown={
              draggable
                ? (e) => {
                    e.preventDefault();
                    // Synthetic pointer ids (tests) have no active pointer —
                    // capture is an enhancement, not a requirement.
                    try {
                      e.currentTarget.setPointerCapture(e.pointerId);
                    } catch {
                      /* noop */
                    }
                    drag.current = {
                      toolId: s.toolId,
                      pointerId: e.pointerId,
                      startClientX: e.clientX,
                      startClientY: e.clientY,
                      startLeft: stickerLeft(s.x, s.w),
                      startTop: stickerTop(s.y, s.h),
                      lastX: s.x,
                      lastY: s.y,
                      moved: false,
                    };
                  }
                : undefined
            }
            onPointerMove={
              draggable
                ? (e) => {
                    const d = drag.current;
                    if (!d || d.toolId !== s.toolId) return;
                    const dxPx = e.clientX - d.startClientX;
                    const dyPx = e.clientY - d.startClientY;
                    // A tiny jitter under the threshold is still a tap — don't
                    // start moving the sticker or it'd break the double-tap.
                    if (
                      !d.moved &&
                      Math.hypot(dxPx, dyPx) < DRAG_THRESHOLD
                    ) {
                      return;
                    }
                    const left = d.startLeft + dxPx / scale;
                    const top = d.startTop + dyPx / scale;
                    // stickerXFromLeft/stickerYFromTop clamp to 0..1, so the
                    // sticker can never leave the lid.
                    d.lastX = stickerXFromLeft(left, s.w);
                    d.lastY = stickerYFromTop(top, s.h);
                    d.moved = true;
                    onDragMove(s.toolId, d.lastX, d.lastY);
                  }
                : undefined
            }
            onPointerUp={
              draggable
                ? (e) => {
                    const d = drag.current;
                    if (!d || d.toolId !== s.toolId) return;
                    drag.current = null;
                    try {
                      e.currentTarget.releasePointerCapture(d.pointerId);
                    } catch {
                      /* noop */
                    }
                    if (d.moved) {
                      // A real drag: persist the new position, and clear any
                      // pending tap so a drag never completes a double-tap.
                      lastTap.current = null;
                      onDragEnd(s.toolId, d.lastX, d.lastY);
                      return;
                    }
                    // A tap (no drag). If the previous tap on THIS sticker was
                    // recent, it's a double-tap — cycle the mode.
                    const now =
                      typeof performance !== "undefined"
                        ? performance.now()
                        : Date.now();
                    const prev = lastTap.current;
                    if (
                      prev &&
                      prev.toolId === s.toolId &&
                      now - prev.time < DOUBLE_TAP_MS
                    ) {
                      lastTap.current = null;
                      onCycleMode(s.toolId);
                    } else {
                      lastTap.current = { toolId: s.toolId, time: now };
                    }
                  }
                : undefined
            }
            onPointerCancel={
              draggable
                ? () => {
                    const d = drag.current;
                    if (!d) return;
                    drag.current = null;
                    if (d.moved) {
                      lastTap.current = null;
                      onDragEnd(d.toolId, d.lastX, d.lastY);
                    }
                  }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
