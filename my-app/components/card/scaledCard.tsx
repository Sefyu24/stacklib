"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { CARD_WIDTH, CARD_HEIGHT } from "@/components/card/cardArt";

/**
 * Scale-to-fit stage: the card art is a fixed 1200x630 design, so we measure
 * the available width and shrink the whole thing with a transform — the
 * preview shows the exact pixels of the PNG at every container size.
 *
 * `render` receives the current stage scale (on-screen px per 1x card px) so
 * overlays (the lid sticker drag layer) can convert pointer deltas back into
 * card-space coordinates. Everything rendered inside lives in the unscaled
 * 1200x630 coordinate space.
 */
export default function ScaledCard({
  render,
}: {
  render: (scale: number) => React.ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth;
      // w === 0 means the stage is hidden (display:none breakpoints) — keep
      // the last real width instead of collapsing the card to nothing.
      if (w > 0) setWidth(w);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={stageRef}
      className="w-full overflow-hidden"
      style={{ aspectRatio: `${CARD_WIDTH} / ${CARD_HEIGHT}` }}
    >
      {width > 0 && (
        <div
          style={{
            position: "relative",
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            transform: `scale(${width / CARD_WIDTH})`,
            transformOrigin: "top left",
          }}
        >
          {render(width / CARD_WIDTH)}
        </div>
      )}
    </div>
  );
}
