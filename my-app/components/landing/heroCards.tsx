"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

const si = (slug: string) => `https://cdn.simpleicons.org/${slug}`;

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
    <span className="inline-flex items-center gap-[5px] rounded-md border border-[#F0DCC2] bg-[#FFF8F0] px-2 py-[3px] text-[10.5px] font-semibold">
      <Icon slug={slug} size={12} />
      {label}
    </span>
  );
}

function TerminalMini() {
  return (
    <div className="w-[290px] overflow-hidden rounded-2xl border-[1.5px] border-foreground bg-[#16110B] shadow-[0_4px_0_var(--foreground)]">
      <div className="flex items-center gap-1.5 border-b border-[#2C2418] px-3.5 py-2.5">
        <span className="size-2 rounded-full bg-[#E5533C]" />
        <span className="size-2 rounded-full bg-[#E5A93C]" />
        <span className="size-2 rounded-full bg-[#5BA35B]" />
      </div>
      <div className="px-4 py-3.5 font-mono text-[10.5px] leading-[2]">
        <div className="text-[#C9BCA2]">
          <span className="text-primary">~</span>{" "}
          <span className="text-[#5BA35B]">$</span> superstack show
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
        <div className="text-[#5BA35B]">✓ 6 tools · 4 pinned</div>
        <div className="text-[#6B5D46]">
          superstack.app
          <span className="ml-[5px] inline-block h-[11px] w-1.5 -translate-y-px animate-[blink_1.1s_step-end_infinite] bg-primary align-middle" />
        </div>
      </div>
    </div>
  );
}

function BentoMini() {
  return (
    <div className="w-[250px] rounded-2xl border-[1.5px] border-foreground bg-[#F3E8D6] p-4 shadow-[0_4px_0_var(--foreground)]">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[8px] font-bold tracking-[0.22em] text-primary">
          SUPERSTACK
        </span>
        <span className="font-mono text-[8px] text-[#A0713C]">6 tools</span>
      </div>
      <div className="mb-2.5 text-[15px] font-black tracking-[-0.02em]">
        sara ships
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          ["svelte", "Svelte"],
          ["supabase", "Supabase"],
          ["vite", "Vite"],
          ["figma", "Figma"],
          ["vercel", "Vercel"],
          ["claude", "Claude"],
        ].map(([slug, label]) => (
          <div
            key={slug}
            className="flex flex-col items-center gap-[5px] rounded-[9px] border border-[#E4D5BB] bg-card px-1 pb-2 pt-2.5"
          >
            <Icon slug={slug} size={20} />
            <span className="text-[8.5px] font-bold">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-[9px] text-center font-mono text-[7.5px] text-[#A0713C]">
        superstack.app
      </div>
    </div>
  );
}

function MinimalMini() {
  return (
    <div className="w-[330px] max-w-full rounded-[18px] border-[1.5px] border-foreground bg-[#FBF7F0] p-[9px] shadow-[0_6px_0_var(--foreground),0_24px_48px_rgba(60,40,10,0.18)]">
      <div className="rounded-[11px] border border-[#EDE4D2] bg-card px-5 pb-3 pt-[18px]">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[9px] font-bold tracking-[0.24em] text-primary">
            SUPERSTACK
          </span>
          <span className="font-mono text-[9px] text-[#B4A78E]">
            7 tools · 5 pinned
          </span>
        </div>
        <div className="mb-3 mt-[7px] text-xl font-black tracking-[-0.02em]">
          My Tech Stack
        </div>
        <div className="flex flex-col gap-[9px]">
          <div>
            <div className="mb-1 font-mono text-[7.5px] font-bold tracking-[0.2em] text-[#B4A78E]">
              FRONTEND
            </div>
            <div className="flex flex-wrap gap-[5px]">
              <MiniChip slug="react" label="React" />
              <MiniChip slug="shadcnui" label="shadcn/ui" />
              <MiniChip slug="tailwindcss" label="Tailwind" />
            </div>
          </div>
          <div>
            <div className="mb-1 font-mono text-[7.5px] font-bold tracking-[0.2em] text-[#B4A78E]">
              BACKEND
            </div>
            <div className="flex flex-wrap gap-[5px]">
              <MiniChip slug="convex" label="Convex" />
              <MiniChip slug="nodedotjs" label="Node.js" />
            </div>
          </div>
          <div>
            <div className="mb-1 font-mono text-[7.5px] font-bold tracking-[0.2em] text-[#B4A78E]">
              AI
            </div>
            <div className="flex flex-wrap gap-[5px]">
              <MiniChip slug="claude" label="Claude" />
              <MiniChip slug="githubcopilot" label="Copilot" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[#EDE4D2] pt-[9px]">
          <span className="font-mono text-[8.5px] text-[#B4A78E]">
            superstack.app
          </span>
          <span className="flex size-[13px] items-center justify-center rounded bg-primary text-[7px] font-black text-primary-foreground">
            S
          </span>
        </div>
      </div>
    </div>
  );
}

const CARDS = [
  { key: "minimal", label: "Minimal card", node: <MinimalMini />, rot: "-1deg" },
  { key: "bento", label: "Bento card", node: <BentoMini />, rot: "3deg" },
  { key: "terminal", label: "Terminal card", node: <TerminalMini />, rot: "-3deg" },
];

/**
 * Hero art. Desktop: the three cards floating in a loose composition.
 * Mobile: one card at a time with arrows, so the art survives small screens.
 */
export default function HeroCards() {
  const [idx, setIdx] = useState(0);
  const step = (d: number) =>
    setIdx((i) => (i + d + CARDS.length) % CARDS.length);
  const current = CARDS[idx];

  return (
    <>
      {/* Desktop composition */}
      <div className="relative hidden h-[520px] lg:block">
        <div
          className="absolute -left-2.5 top-9"
          style={
            {
              "--rot": "-6deg",
              animation: "floaty 7s ease-in-out infinite",
            } as React.CSSProperties
          }
        >
          <TerminalMini />
        </div>
        <div
          className="absolute -right-1.5 top-0"
          style={
            {
              "--rot": "5deg",
              animation: "floaty 8s ease-in-out 0.8s infinite",
            } as React.CSSProperties
          }
        >
          <BentoMini />
        </div>
        <div
          className="absolute left-[70px] top-[150px]"
          style={
            {
              "--rot": "-1deg",
              animation: "floaty 6s ease-in-out 0.4s infinite",
            } as React.CSSProperties
          }
        >
          <MinimalMini />
        </div>
      </div>

      {/* Mobile carousel */}
      <div className="flex flex-col items-center gap-4 lg:hidden">
        <div className="flex min-h-[360px] w-full items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="flex-none rounded-full"
            onClick={() => step(-1)}
            aria-label="Previous card style"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          </Button>
          <div
            key={current.key}
            className="flex flex-1 justify-center"
            style={
              {
                "--rot": current.rot,
                animation: "floaty 6s ease-in-out infinite",
              } as React.CSSProperties
            }
          >
            {current.node}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="flex-none rounded-full"
            onClick={() => step(1)}
            aria-label="Next card style"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
          </Button>
        </div>
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
      </div>
    </>
  );
}
