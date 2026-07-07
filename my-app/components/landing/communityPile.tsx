"use client";

// Landing "Steal ideas from other builders" section — the loose-pile design
// borrowed from components/browse/stackPile.tsx. Each sample stack is a rotated
// pile of section-cards that FANS OPEN on hover (desktop, fine pointer) and on
// TAP (mobile — the card toggles open/closed, it is NOT always extended). Every
// card also carries an explicit Hugeicons stack-glyph toggle button. Reduced-
// motion users get the open column with no animation (see .commpile rules in
// app/globals.css). Tool logos are self-hosted Brandfetch PNGs
// (/hero-icons/<slug>.png) layered over a letter tile, so a missing slug shows
// the letter — never an empty box, never a CDN call.

import type { CSSProperties } from "react";
import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Layers01Icon } from "@hugeicons/core-free-icons";
import { Logomark } from "@/components/brand/logo";

interface PileTool {
  name: string;
  slug: string;
}

interface PileSection {
  name: string;
  sectionType: string;
  count: number;
  tools: PileTool[];
}

interface PileStack {
  initial: string;
  avatarBg: string;
  handle: string;
  meta: string;
  quote: string;
  sections: PileSection[];
}

// Reuses the section's existing sample copy (maker.mia indie SaaS, dev.theo
// full-stack) plus kai.learns (student) — now expanded into pile sections.
const SAMPLES: PileStack[] = [
  {
    initial: "M",
    avatarBg: "var(--primary)",
    handle: "maker.mia",
    meta: "indie SaaS · 9 tools",
    quote: "“Boring stack, fast shipping. Everything talks to everything.”",
    sections: [
      {
        name: "Frontend",
        sectionType: "frontend",
        count: 3,
        tools: [
          { name: "Next.js", slug: "nextdotjs" },
          { name: "Tailwind", slug: "tailwindcss" },
          { name: "React", slug: "react" },
        ],
      },
      {
        name: "Backend",
        sectionType: "backend",
        count: 3,
        tools: [
          { name: "Supabase", slug: "supabase" },
          { name: "Postgres", slug: "postgresql" },
          { name: "Node.js", slug: "nodedotjs" },
        ],
      },
      {
        name: "Other",
        sectionType: "other",
        count: 3,
        tools: [
          { name: "Stripe", slug: "stripe" },
          { name: "Vercel", slug: "vercel" },
          { name: "Linear", slug: "linear" },
        ],
      },
    ],
  },
  {
    initial: "D",
    avatarBg: "var(--foreground)",
    handle: "dev.theo",
    meta: "full-stack · 11 tools",
    quote: "“Zero JS frameworks on the backend. Go + Postgres forever.”",
    sections: [
      {
        name: "Frontend",
        sectionType: "frontend",
        count: 2,
        tools: [
          { name: "Svelte", slug: "svelte" },
          { name: "Vue.js", slug: "vuedotjs" },
        ],
      },
      {
        name: "Backend",
        sectionType: "backend",
        count: 3,
        tools: [
          { name: "Go", slug: "go" },
          { name: "Postgres", slug: "postgresql" },
          { name: "Docker", slug: "docker" },
        ],
      },
      {
        name: "IDE",
        sectionType: "ide",
        count: 2,
        tools: [
          { name: "VS Code", slug: "vscode" },
          { name: "GitHub", slug: "github" },
        ],
      },
    ],
  },
  {
    initial: "K",
    avatarBg: "#5BA35B",
    handle: "kai.learns",
    meta: "student · 7 tools",
    quote:
      "“First stack card for my portfolio — recruiters actually clicked it.”",
    sections: [
      {
        name: "Frontend",
        sectionType: "frontend",
        count: 2,
        tools: [
          { name: "React", slug: "react" },
          { name: "Tailwind", slug: "tailwindcss" },
        ],
      },
      {
        name: "Backend",
        sectionType: "backend",
        count: 2,
        tools: [
          { name: "Firebase", slug: "firebase" },
          { name: "Node.js", slug: "nodedotjs" },
        ],
      },
      {
        name: "AI",
        sectionType: "ai",
        count: 3,
        tools: [
          { name: "Claude", slug: "claude" },
          { name: "Copilot", slug: "githubcopilot" },
          { name: "Cursor", slug: "cursor" },
        ],
      },
    ],
  },
];

// Per-sectionType oklch hues, matched to the browse pile design.
const SECTION_HUES: Record<string, number> = {
  frontend: 55,
  backend: 150,
  ide: 245,
  ai: 305,
  other: 85,
};

const LAYER_HEIGHT = 92; // px per section card
const CLOSED_STEP = 7; // px the pile fans down per layer when closed
const OPEN_STEP = 102; // px per layer when extended (92 + 10 gap)
const CLOSED_ALLOWANCE = 25; // rotation + hard-shadow bounding-box slack

function closedHeight(n: number) {
  return LAYER_HEIGHT + (n - 1) * CLOSED_STEP + CLOSED_ALLOWANCE;
}
function openHeight(n: number) {
  return n * OPEN_STEP - 8;
}
function tossAngle(i: number, n: number) {
  if (n <= 1) return -3;
  return -6 + (12 * i) / (n - 1);
}

// Self-hosted Brandfetch logo layered over a warm letter tile. A missing PNG
// (404) simply reveals the letter behind it — no empty box, no CDN request.
function ToolLogo({ name, slug, size }: { name: string; slug: string; size: number }) {
  return (
    <span
      className="relative inline-block flex-none"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="absolute inset-0 flex items-center justify-center rounded-[28%] bg-[#F3E8D6] font-extrabold text-[#A0713C]"
        style={{ fontSize: size * 0.5 }}
      >
        {name[0]?.toUpperCase()}
      </span>
      <span
        className="absolute inset-0 bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/hero-icons/${slug}.png')` }}
      />
    </span>
  );
}

function SectionLayer({
  section,
  index,
  total,
}: {
  section: PileSection;
  index: number;
  total: number;
}) {
  const hue = SECTION_HUES[section.sectionType] ?? SECTION_HUES.other;
  const ink = `oklch(0.52 0.12 ${hue})`;
  const bg = `oklch(0.958 0.02 ${hue})`;
  const letter = (section.name[0] || "?").toUpperCase();

  return (
    <div
      className="commpile-layer overflow-hidden"
      style={
        {
          "--closed-top": `${index * CLOSED_STEP}px`,
          "--open-top": `${index * OPEN_STEP}px`,
          "--angle": `${tossAngle(index, total)}deg`,
          "--open-delay": `${index * 45}ms`,
          "--close-delay": `${(total - 1 - index) * 35}ms`,
          height: LAYER_HEIGHT,
          background: bg,
          border: "1.5px solid #1C1712",
          borderRadius: 13,
          boxShadow: "0 3px 0 #1C1712",
          padding: "11px 13px",
        } as CSSProperties
      }
    >
      <div className="flex items-center gap-2">
        <span
          className="flex flex-none items-center justify-center font-mono font-bold"
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            background: ink,
            color: "#FFF7EE",
            fontSize: 10,
          }}
        >
          {letter}
        </span>
        <span
          className="truncate font-mono font-bold uppercase"
          style={{ fontSize: 9.5, letterSpacing: "0.2em", color: ink }}
        >
          {section.name}
        </span>
        <span
          className="ml-auto whitespace-nowrap font-mono"
          style={{ fontSize: 9.5, color: "rgba(28,23,18,.45)" }}
        >
          · {section.count}
        </span>
      </div>

      <div className="flex" style={{ gap: 16, marginTop: 9 }}>
        {section.tools.map((tool) => (
          <div
            key={tool.name}
            className="flex min-w-0 flex-col items-center"
            style={{ gap: 3 }}
          >
            <ToolLogo name={tool.name} slug={tool.slug} size={22} />
            <span
              className="max-w-[56px] truncate font-bold"
              style={{ fontSize: 8.5, color: "#4A4136" }}
            >
              {tool.name}
            </span>
          </div>
        ))}
      </div>

      {/* Playing-card corner mark */}
      <span
        className="absolute font-mono font-bold"
        style={{
          right: 10,
          bottom: 7,
          transform: "rotate(180deg)",
          fontSize: 10,
          color: ink,
          opacity: 0.4,
        }}
        aria-hidden
      >
        {letter}
      </span>
    </div>
  );
}

function PileCard({ stack }: { stack: PileStack }) {
  const [open, setOpen] = useState(false);
  const n = stack.sections.length;

  return (
    <div
      data-open={open}
      className="commpile-card group rounded-[18px] border-[1.5px] border-foreground bg-[#FBF7F0] p-3.5 shadow-[0_5px_0_var(--foreground)] transition-shadow duration-200 hover:shadow-[0_7px_0_var(--foreground)]"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] font-black"
          style={{ background: stack.avatarBg, color: "#FFF7EE", fontSize: 15 }}
          aria-hidden
        >
          {stack.initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14.5px] font-extrabold text-foreground">
            {stack.handle}
          </div>
          <div
            className="truncate font-mono"
            style={{ fontSize: 10, color: "#B4A78E" }}
          >
            {stack.meta}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Collapse stack" : "Expand stack"}
          className="flex flex-none items-center justify-center rounded-[9px] border border-[#E0D5BE] bg-card text-[#8A7B63] transition-colors hover:border-primary hover:text-primary group-data-[open=true]:border-primary group-data-[open=true]:bg-[#FEF3E7] group-data-[open=true]:text-primary"
          style={{ width: 30, height: 30 }}
        >
          <HugeiconsIcon icon={Layers01Icon} size={16} strokeWidth={2} />
        </button>
      </div>

      {/* The pile */}
      <div
        className="commpile"
        style={
          {
            "--closed-h": `${closedHeight(n)}px`,
            "--open-h": `${openHeight(n)}px`,
          } as CSSProperties
        }
      >
        {/* DOM order reversed so the first section paints on top of the closed
            pile; absolute `top` (from the original index) still orders the open
            column first-to-last. */}
        {stack.sections
          .map((section, i) => (
            <SectionLayer
              key={`${section.sectionType}-${i}`}
              section={section}
              index={i}
              total={n}
            />
          ))
          .reverse()}
      </div>

      {/* Quote + footer */}
      <span className="mt-1 block text-[12.5px] leading-relaxed text-[#8A7B63]">
        {stack.quote}
      </span>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#EDE4D2] pt-2.5">
        <span
          className="truncate font-mono"
          style={{ fontSize: 9, color: "#B4A78E" }}
        >
          superstacks.dev/{stack.handle}
        </span>
        <Logomark size={14} className="flex-none" />
      </div>
    </div>
  );
}

export default function CommunityPile() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {SAMPLES.map((stack) => (
        <PileCard key={stack.handle} stack={stack} />
      ))}
    </div>
  );
}
