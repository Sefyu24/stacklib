"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { Logomark, Wordmark } from "@/components/brand/logo";

const si = (slug: string) => `https://cdn.simpleicons.org/${slug}`;

/**
 * All three hero cards share one footprint so the carousel feels uniform.
 * Landscape, like the real 1200x630 share cards.
 */
const CARD_W = 340;
const CARD_H = 225;

function Icon({ slug, size }: { slug: string; size: number }) {
  return (
    <span
      className="inline-block bg-contain bg-center bg-no-repeat"
      style={{ width: size, height: size, backgroundImage: `url('${si(slug)}')` }}
      aria-hidden
    />
  );
}

function MiniChip({ slug, label }: { slug: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-[4px] rounded-md border border-[#F0DCC2] bg-[#FFF8F0] px-1.5 py-[2px] text-[9.5px] font-semibold">
      <Icon slug={slug} size={11} />
      {label}
    </span>
  );
}

function TerminalMini() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border-[1.5px] border-foreground bg-[#16110B] shadow-[0_4px_0_var(--foreground)]"
      style={{ width: CARD_W, height: CARD_H }}
    >
      <div className="flex items-center gap-1.5 border-b border-[#2C2418] px-3.5 py-2">
        <span className="size-2 rounded-full bg-[#E5533C]" />
        <span className="size-2 rounded-full bg-[#E5A93C]" />
        <span className="size-2 rounded-full bg-[#5BA35B]" />
      </div>
      <div className="flex flex-1 flex-col justify-center px-4 font-mono text-[10.5px] leading-[1.95]">
        <div className="text-[#C9BCA2]">
          <span className="text-primary">~</span>{" "}
          <span className="text-[#5BA35B]">$</span> superstacks show
        </div>
        <div>
          <span className="text-primary">frontend</span>
          <span className="text-[#4A3F2E]"> › </span>
          <span className="text-[#F0E6D2]">React · Tailwind</span>
        </div>
        <div>
          <span className="text-primary">backend</span>
          <span className="text-[#4A3F2E]"> › </span>
          <span className="text-[#F0E6D2]">Convex</span>
        </div>
        <div>
          <span className="text-primary">ai</span>
          <span className="text-[#4A3F2E]"> › </span>
          <span className="text-[#F0E6D2]">Claude · v0</span>
        </div>
        <div>
          <span className="text-primary">deploy</span>
          <span className="text-[#4A3F2E]"> › </span>
          <span className="text-[#F0E6D2]">Vercel</span>
        </div>
        <div className="text-[#5BA35B]">✓ 6 tools · 4 pinned</div>
        <div className="text-[#6B5D46]">
          powered by superstacks.dev
          <span className="ml-[5px] inline-block h-[11px] w-1.5 -translate-y-px animate-[blink_1.1s_step-end_infinite] bg-primary align-middle" />
        </div>
      </div>
    </div>
  );
}

const BENTO_COLUMNS: { label: string; tools: [string, string][] }[] = [
  {
    label: "FRONTEND",
    tools: [
      ["svelte", "Svelte"],
      ["vite", "Vite"],
    ],
  },
  {
    label: "BACKEND",
    tools: [
      ["supabase", "Supabase"],
      ["vercel", "Vercel"],
    ],
  },
  {
    label: "AI",
    tools: [
      ["claude", "Claude"],
      ["openai", "ChatGPT"],
    ],
  },
];

function BentoMini() {
  return (
    <div
      className="flex flex-col rounded-2xl border-[1.5px] border-foreground bg-[#F3E8D6] p-3 shadow-[0_4px_0_var(--foreground)]"
      style={{ width: CARD_W, height: CARD_H }}
    >
      <div className="mb-1 flex items-baseline justify-end">
        <span className="font-mono text-[8.5px] text-[#A0713C]">6 tools</span>
      </div>
      <div className="mb-2 text-[15px] font-black tracking-[-0.02em]">
        sara ships
      </div>
      {/* Sections as equal-height columns — same shape as the real bento card */}
      <div className="grid flex-1 grid-cols-3 gap-2">
        {BENTO_COLUMNS.map((col) => (
          <div
            key={col.label}
            className="flex flex-col rounded-[10px] border border-[#E4D5BB] bg-card p-1.5"
          >
            <div className="mb-1 text-center font-mono text-[7px] font-bold tracking-[0.16em] text-[#A0713C]">
              {col.label}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              {col.tools.map(([slug, label]) => (
                <div
                  key={slug}
                  className="flex flex-1 flex-col items-center justify-center gap-[4px] rounded-[8px] border border-[#EDE4D2] bg-[#FFF8F0] px-1 py-1"
                >
                  <Icon slug={slug} size={15} />
                  <span className="text-[8px] font-bold">{label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 text-center font-mono text-[7.5px] text-[#A0713C]">
        powered by superstacks.dev
      </div>
    </div>
  );
}

function MinimalMini() {
  return (
    <div
      className="flex max-w-full flex-col rounded-[18px] border-[1.5px] border-foreground bg-[#FBF7F0] p-[9px] shadow-[0_4px_0_var(--foreground)]"
      style={{ width: CARD_W, height: CARD_H }}
    >
      <div className="flex flex-1 flex-col rounded-[11px] border border-[#EDE4D2] bg-card px-4 pb-2 pt-2.5">
        <div className="flex items-baseline justify-end">
          <span className="font-mono text-[8.5px] text-[#B4A78E]">
            7 tools · 5 pinned
          </span>
        </div>
        <div className="mb-1.5 mt-1 text-[16px] font-black tracking-[-0.02em]">
          My Tech Stack
        </div>
        <div className="flex flex-1 flex-col justify-center gap-[6px]">
          <div>
            <div className="mb-0.5 font-mono text-[7.5px] font-bold tracking-[0.2em] text-[#B4A78E]">
              FRONTEND
            </div>
            <div className="flex flex-wrap gap-[5px]">
              <MiniChip slug="react" label="React" />
              <MiniChip slug="shadcnui" label="shadcn/ui" />
              <MiniChip slug="tailwindcss" label="Tailwind" />
            </div>
          </div>
          <div>
            <div className="mb-0.5 font-mono text-[7.5px] font-bold tracking-[0.2em] text-[#B4A78E]">
              BACKEND
            </div>
            <div className="flex flex-wrap gap-[5px]">
              <MiniChip slug="convex" label="Convex" />
              <MiniChip slug="nodedotjs" label="Node.js" />
            </div>
          </div>
          <div>
            <div className="mb-0.5 font-mono text-[7.5px] font-bold tracking-[0.2em] text-[#B4A78E]">
              AI
            </div>
            <div className="flex flex-wrap gap-[5px]">
              <MiniChip slug="claude" label="Claude" />
              <MiniChip slug="githubcopilot" label="Copilot" />
            </div>
          </div>
        </div>
        <div className="mt-1.5 flex items-center justify-between border-t border-[#EDE4D2] pt-1.5">
          <span className="font-mono text-[8px] text-[#B4A78E]">
            powered by superstacks.dev
          </span>
          <Logomark size={13} />
        </div>
      </div>
    </div>
  );
}

const CARDS = [
  { key: "minimal", label: "Minimal card", node: <MinimalMini /> },
  { key: "bento", label: "Bento card", node: <BentoMini /> },
  { key: "terminal", label: "Terminal card", node: <TerminalMini /> },
];

/**
 * Desktop slots for the circular shuffle. Everything lives in `transform`
 * (relative to the container center) so slot changes glide instead of snap.
 * Slot 0 = front card; 1 = upper right; 2 = upper left.
 */
const SLOTS = [
  { x: 0, y: 55, rot: -1, scale: 1.04, z: 30, dim: 1 },
  { x: 135, y: -105, rot: 5, scale: 0.9, z: 20, dim: 0.92 },
  { x: -135, y: -105, rot: -6, scale: 0.9, z: 10, dim: 0.92 },
];

const FLOAT = [
  "floaty 6s ease-in-out infinite",
  "floaty 8s ease-in-out 0.8s infinite",
  "floaty 7s ease-in-out 0.4s infinite",
];

const EASE = "cubic-bezier(0.34, 1.2, 0.4, 1)";

// Room above/below the card so the float drift + chunky shadow never clip.
const STAGE_H = CARD_H + 64;

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
        <div className="relative w-full" style={{ height: STAGE_H + 130 }}>
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
                <div style={{ animation: FLOAT[i] }}>{card.node}</div>
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
                  <div style={{ animation: FLOAT[i] }}>{card.node}</div>
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
