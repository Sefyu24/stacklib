"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
 *
 * The height is set explicitly from the measured width (not CSS aspect-ratio)
 * and we re-measure across a few animation frames — inside a Dialog that
 * animates open (iOS Safari especially), a single layout-effect read can land
 * before the portal has its final width, which left the card rendered at ~1x
 * and cropped. Retrying until the width settles fixes that.
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

    const measure = () => {
      const w = el.clientWidth;
      // w === 0 means the stage is hidden or not yet laid out — keep the last
      // real width instead of collapsing the card.
      if (w > 0) setWidth((prev) => (prev !== w ? w : prev));
    };

    measure();
    // Re-measure across a few frames to catch the dialog's open animation
    // settling on its final width (portal mount timing on iOS Safari).
    let raf = 0;
    let tries = 0;
    const tick = () => {
      measure();
      if (++tries < 8) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  // Belt-and-suspenders: one more measure after paint in case the observer
  // and rAF both missed the settled width.
  useEffect(() => {
    const el = stageRef.current;
    if (el && el.clientWidth > 0 && el.clientWidth !== width) {
      setWidth(el.clientWidth);
    }
  });

  const scale = width > 0 ? width / CARD_WIDTH : 0;

  return (
    <div
      ref={stageRef}
      className="w-full overflow-hidden"
      // Explicit height from the measured width — never rely on CSS
      // aspect-ratio here (it mis-sized inside the animated dialog on iOS).
      style={{ height: width > 0 ? width * (CARD_HEIGHT / CARD_WIDTH) : 0 }}
    >
      {width > 0 && (
        <div
          style={{
            position: "relative",
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {render(scale)}
        </div>
      )}
    </div>
  );
}
