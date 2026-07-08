"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import {
  CardArt,
  CARD_WIDTH,
  CARD_HEIGHT,
  PREVIEW_CARD_FONTS,
} from "@/components/card/cardArt";
import {
  buildCardRenderData,
  CardRenderData,
  CardStackInput,
} from "@/lib/card/render";
import { DisplaySectionInput } from "@/lib/card/display";
import { toolLogoUrl } from "@/lib/logo";

/**
 * All three hero cards share the real 1200x630 footprint, scaled down —
 * they ARE the product's CardArt, so the hero can never drift from the
 * actual share cards.
 */
// Base footprint = the FRONT card's real on-screen size. Rendering the front
// at scale 1 (native) keeps its text crisp for reading; the back cards are the
// same art scaled DOWN (always sharp). Front is ~2x a back card. Sized so the
// whole front card stays visible between the headline and the viewport edge —
// readability needs every section on screen, so we don't let it clip.
const CARD_W = 700;
const CARD_H = Math.round((CARD_W * CARD_HEIGHT) / CARD_WIDTH); // true 1.9:1

// Sample stack (maker.mia — 11 tools, 4 sections) driving all three themes.
// Logos are the REAL Brandfetch marks (captured from Convex storage),
// self-hosted in public/hero-icons so the static landing renders ~30 at
// once without any runtime dependency — same brand logos as real cards.
const T = (name: string, slug: string) => ({
  toolId: slug,
  tool: { name, url: "", logoUrl: `/hero-icons/${slug}.png` },
});
const section = (
  name: string,
  sectionType: string,
  tools: ReturnType<typeof T>[]
): DisplaySectionInput => ({
  name,
  sectionType,
  selectedTools: tools,
  pinnedTools: tools.map((t) => ({ toolId: t.toolId })),
});
const SAMPLE_SECTIONS: DisplaySectionInput[] = [
  section("Frontend", "frontend", [
    T("React", "react"),
    T("Tailwind", "tailwindcss"),
    T("Vite", "vite"),
  ]),
  section("Backend", "backend", [T("Convex", "convex"), T("Node.js", "nodedotjs")]),
  section("AI", "ai", [
    T("Claude", "claude"),
    T("Copilot", "githubcopilot"),
    T("v0", "v0"),
  ]),
  section("Other", "other", [
    T("Figma", "figma"),
    T("Vercel", "vercel"),
    T("Linear", "linear"),
  ]),
];

// The lid scatters every tool as a sticker, so 11 crowds/overlaps at hero
// size — a leaner 8-tool set spreads cleanly across the lid.
const LID_SECTIONS: DisplaySectionInput[] = [
  section("Frontend", "frontend", [T("React", "react"), T("Tailwind", "tailwindcss")]),
  section("Backend", "backend", [T("Convex", "convex"), T("Node.js", "nodedotjs")]),
  section("AI", "ai", [T("Claude", "claude"), T("v0", "v0")]),
  section("Other", "other", [T("Figma", "figma"), T("Vercel", "vercel")]),
];

const sampleStack = (
  cardTheme: string,
  lidEdition?: string,
  sections: DisplaySectionInput[] = SAMPLE_SECTIONS
): CardStackInput => ({
  name: "maker.mia",
  sections,
  cardTheme,
  authorName: "maker.mia",
  authorHandle: "maker.mia",
  lidEdition,
  stickerSeed: 5,
});

const resolveLogo = (t: {
  iconSlug?: string;
  logoUrl?: string;
  url?: string;
}) => toolLogoUrl(t);

const CARDS: { key: string; label: string; data: CardRenderData }[] = [
  {
    key: "minimal",
    label: "Minimal card",
    data: buildCardRenderData(sampleStack("minimal"), resolveLogo),
  },
  {
    key: "terminal",
    label: "Terminal card",
    data: buildCardRenderData(sampleStack("terminal"), resolveLogo),
  },
  {
    key: "lid",
    label: "Lid card",
    data: buildCardRenderData(
      sampleStack("lid", "apple", LID_SECTIONS),
      resolveLogo
    ),
  },
];

/** The real CardArt, rendered small at the hero footprint. */
function HeroCard({ data }: { data: CardRenderData }) {
  const screen = (
    <div
      className="overflow-hidden rounded-[16px]"
      style={{ width: CARD_W, height: CARD_H }}
    >
      <CardArt data={data} fonts={PREVIEW_CARD_FONTS} scale={CARD_W / CARD_WIDTH} />
    </div>
  );

  return (
    <div className="overflow-hidden rounded-[18px] shadow-[0_16px_38px_rgba(60,40,10,0.18)]">
      {screen}
    </div>
  );
}

/**
 * Desktop slots for the circular shuffle. Everything lives in `transform`
 * (relative to the container center) so slot changes glide instead of snap.
 * Slot 0 = front card; 1 = upper right; 2 = upper left.
 */
const SLOTS = [
  // Front: full size, near-flat, nudged right so the big card clears the
  // headline on its left. Slot 1/2: the same card scaled to ~half, peeking
  // out behind the front's top corners. The 850ms transform transition makes
  // the incoming card grow and the outgoing one shrink as they swap.
  { x: 40, y: 24, rot: -1.5, scale: 1, z: 30, dim: 1 },
  { x: 300, y: -140, rot: 6, scale: 0.54, z: 20, dim: 0.86 },
  { x: -230, y: -140, rot: -7, scale: 0.54, z: 10, dim: 0.85 },
];

const FLOAT = [
  "floaty 6s ease-in-out infinite",
  "floaty 8s ease-in-out 0.8s infinite",
  "floaty 7s ease-in-out 0.4s infinite",
];

const EASE = "cubic-bezier(0.34, 1.2, 0.4, 1)";

// Room above/below the card so the float drift + shadow never clip.
const STAGE_H = CARD_H + 90;

/**
 * Hero art. Desktop: three cards in a floating composition; arrows rotate
 * which card sits in front, moving all three around in a circle.
 * Mobile: a calm sliding one-card carousel with the same arrows.
 */
export default function HeroCards() {
  // idx = which card currently occupies the front slot.
  const [idx, setIdx] = useState(0);
  const step = (d: number) =>
    setIdx((i) => (i + d + CARDS.length) % CARDS.length);

  // Mobile: shrink the fixed-size card art to whatever width is available,
  // so nothing ever crops and neighboring slides can't bleed into view.
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth;
      // w === 0 means the mobile branch is display:none (desktop) — keep the
      // last real scale instead of collapsing the cards to nothing.
      if (w > 0) setScale(Math.min(1, w / (CARD_W + 16)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      {/* Desktop composition — circular shuffle */}
      <div className="hidden flex-col items-center gap-5 lg:flex">
        <div className="relative w-full" style={{ height: STAGE_H + 150 }}>
          {CARDS.map((card, i) => {
            const slot = SLOTS[(i - idx + CARDS.length) % CARDS.length];
            return (
              <div
                key={card.key}
                className="absolute left-1/2 top-1/2 transition-[transform,filter] duration-[850ms] will-change-transform"
                style={{
                  zIndex: slot.z,
                  transitionTimingFunction: EASE,
                  transform: `translate(calc(-50% + ${slot.x}px), calc(-50% + ${slot.y}px)) rotate(${slot.rot}deg) scale(${slot.scale})`,
                  filter:
                    slot.dim < 1 ? "brightness(0.97) saturate(0.94)" : "none",
                }}
              >
                <div style={{ animation: FLOAT[i] }}>
                  <HeroCard data={card.data} />
                </div>
              </div>
            );
          })}
        </div>
        <Controls idx={idx} step={step} setIdx={setIdx} />
      </div>

      {/* Mobile carousel — calm slide; cards scale down to fit the viewport */}
      <div className="flex w-full flex-col items-center gap-3 lg:hidden">
        <div ref={stageRef} className="w-full overflow-hidden">
          <div
            className="flex items-center transition-transform duration-700 will-change-transform"
            style={{
              height: STAGE_H * scale,
              transitionTimingFunction: EASE,
              transform: `translateX(-${idx * 100}%)`,
            }}
          >
            {CARDS.map((card, i) => (
              <div
                key={card.key}
                className="flex w-full flex-none justify-center transition-opacity duration-700"
                style={{ opacity: i === idx ? 1 : 0.35 }}
              >
                <div style={{ transform: `scale(${scale})` }}>
                  <div style={{ animation: FLOAT[i] }}>
                    <HeroCard data={card.data} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Controls idx={idx} step={step} setIdx={setIdx} />
      </div>
    </>
  );
}

function ArrowButton({ dir, step }: { dir: number; step: (d: number) => void }) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="flex-none rounded-full"
      onClick={() => step(dir)}
      aria-label={dir < 0 ? "Previous card style" : "Next card style"}
    >
      <HugeiconsIcon
        icon={dir < 0 ? ArrowLeft01Icon : ArrowRight01Icon}
        className="size-4"
      />
    </Button>
  );
}

function Dots({ idx, setIdx }: { idx: number; setIdx: (i: number) => void }) {
  return (
    <div className="flex items-center gap-2" role="tablist" aria-label="Card styles">
      {CARDS.map((c, i) => (
        <button
          key={c.key}
          type="button"
          role="tab"
          aria-selected={i === idx}
          aria-label={c.label}
          onClick={() => setIdx(i)}
          className={`size-2 cursor-pointer rounded-full transition-colors ${
            i === idx ? "bg-primary" : "bg-[#E0D5BE] hover:bg-[#C9BCA2]"
          }`}
        />
      ))}
    </div>
  );
}

function Controls({
  idx,
  step,
  setIdx,
}: {
  idx: number;
  step: (d: number) => void;
  setIdx: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <ArrowButton dir={-1} step={step} />
      <Dots idx={idx} setIdx={setIdx} />
      <ArrowButton dir={1} step={step} />
    </div>
  );
}
