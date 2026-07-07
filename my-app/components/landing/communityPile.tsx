"use client";

// Landing "Steal ideas from other builders" section — the loose-pile design
// borrowed from components/browse/stackPile.tsx. Each stack is a rotated pile
// of section-cards that FANS OPEN on hover (desktop, fine pointer) and on TAP /
// CLICK anywhere on the card (mobile + desktop — the whole card is a toggle, it
// is NOT always extended). An explicit Hugeicons stack-glyph button remains as a
// visible affordance. The card is keyboard-operable (role=button, Enter/Space
// toggle). Inner links (@handle -> the person's real X profile) stopPropagation
// so they don't also fire the toggle. Reduced-motion users get the open column
// with no animation (see .commpile rules in app/globals.css).
//
// The three stacks below are REAL, publicly-known stacks of public developers.
// Taglines are factual descriptions of their public work — NOT invented quotes.
//
// Tool logos are self-hosted Brandfetch PNGs (/hero-icons/<slug>.png) layered
// over a letter tile, so a missing slug (e.g. tmux, html5) shows the letter —
// never an empty box, never a CDN call.

import type { CSSProperties, KeyboardEvent } from "react";
import { useState } from "react";
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
  // Self-hosted X profile photo (public/community/<handle>.jpg).
  avatar: string;
  // Display handle including the leading "@" (e.g. "@levelsio").
  handle: string;
  // Real name shown as the primary label.
  name: string;
  meta: string;
  // Factual tagline describing their public work, not a first-person quote.
  tagline: string;
  sections: PileSection[];
}

// Three real public developer stacks. Tool slugs map to /hero-icons/<slug>.png;
// slugs without a self-hosted PNG (tmux, html5) fall back to the letter tile.
const SAMPLES: PileStack[] = [
  {
    initial: "P",
    avatarBg: "var(--primary)",
    avatar: "/community/levelsio.jpg",
    handle: "@levelsio",
    name: "Pieter Levels",
    meta: "solo maker · 9 tools",
    tagline: "Ships solo, one PHP file, no frameworks.",
    sections: [
      {
        name: "Frontend",
        sectionType: "frontend",
        count: 3,
        tools: [
          { name: "HTML", slug: "html5" },
          { name: "jQuery", slug: "jquery" },
          { name: "Tailwind", slug: "tailwindcss" },
        ],
      },
      {
        name: "Backend",
        sectionType: "backend",
        count: 2,
        tools: [
          { name: "PHP", slug: "php" },
          { name: "SQLite", slug: "sqlite" },
        ],
      },
      {
        name: "Other",
        sectionType: "other",
        count: 4,
        tools: [
          { name: "DigitalOcean", slug: "digitalocean" },
          { name: "Nginx", slug: "nginx" },
          { name: "Cloudflare", slug: "cloudflare" },
          { name: "Stripe", slug: "stripe" },
        ],
      },
    ],
  },
  {
    initial: "T",
    avatarBg: "var(--foreground)",
    avatar: "/community/theo.jpg",
    handle: "@theo",
    name: "Theo Browne",
    meta: "full-stack · 8 tools",
    tagline: "Made the T3 stack. Full-stack TypeScript, all the way down.",
    sections: [
      {
        name: "Frontend",
        sectionType: "frontend",
        count: 4,
        tools: [
          { name: "Next.js", slug: "nextdotjs" },
          { name: "React", slug: "react" },
          { name: "Tailwind", slug: "tailwindcss" },
          { name: "TypeScript", slug: "typescript" },
        ],
      },
      {
        name: "Backend",
        sectionType: "backend",
        count: 3,
        tools: [
          { name: "tRPC", slug: "trpc" },
          { name: "Prisma", slug: "prisma" },
          { name: "PlanetScale", slug: "planetscale" },
        ],
      },
      {
        name: "Other",
        sectionType: "other",
        count: 1,
        tools: [{ name: "Vercel", slug: "vercel" }],
      },
    ],
  },
  {
    initial: "P",
    avatarBg: "#5BA35B",
    avatar: "/community/theprimeagen.jpg",
    handle: "@ThePrimeagen",
    name: "ThePrimeagen",
    meta: "terminal-driven · 6 tools",
    tagline: "Lives in Neovim and tmux. Writes Rust and Go, built Harpoon.",
    sections: [
      {
        name: "IDE",
        sectionType: "ide",
        count: 2,
        tools: [
          { name: "Neovim", slug: "neovim" },
          { name: "tmux", slug: "tmux" },
        ],
      },
      {
        name: "Backend",
        sectionType: "backend",
        count: 3,
        tools: [
          { name: "Rust", slug: "rust" },
          { name: "Go", slug: "go" },
          { name: "TypeScript", slug: "typescript" },
        ],
      },
      {
        name: "Other",
        sectionType: "other",
        count: 1,
        tools: [{ name: "Git", slug: "git" }],
      },
    ],
  },
];

// Per-sectionType oklch hues, matched to the browse pile design.
const SECTION_HUES: Record<string, number> = {
  frontend: 55,
  backend: 150,
  deploy: 245,
  payments: 305,
  editor: 245,
  languages: 305,
  tools: 85,
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

// Real X (Twitter) profile URL from a display handle like "@levelsio".
function xProfileUrl(handle: string) {
  return `https://x.com/${handle.replace(/^@/, "")}`;
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
  const toggle = () => setOpen((v) => !v);

  // Enter / Space toggle the card, matching native button semantics. Space is
  // suppressed to stop the page from scrolling, then toggles.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div
      data-open={open}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-label={`${stack.name} stack, ${open ? "collapse" : "expand"}`}
      onClick={toggle}
      onKeyDown={onKeyDown}
      className="commpile-card group cursor-pointer rounded-[18px] border-[1.5px] border-foreground bg-[#FBF7F0] p-3.5 shadow-[0_5px_0_var(--foreground)] transition-shadow duration-200 hover:shadow-[0_7px_0_var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F1E8]"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stack.avatar}
          alt={`${stack.name} on X`}
          width={36}
          height={36}
          loading="lazy"
          className="h-9 w-9 flex-none rounded-[10px] border border-[#E6DCC8] object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14.5px] font-extrabold text-foreground">
            {stack.name}
          </div>
          {/* @handle links to the person's real X profile. stopPropagation so
              following the link never also toggles the pile. */}
          <a
            href={xProfileUrl(stack.handle)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="block truncate font-mono transition-colors hover:text-primary hover:underline"
            style={{ fontSize: 10, color: "#B4A78E" }}
          >
            {stack.handle} · {stack.meta}
          </a>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          tabIndex={-1}
          aria-hidden
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

      {/* Tagline + footer */}
      <span className="mt-1 block text-[12.5px] leading-relaxed text-[#8A7B63]">
        {stack.tagline}
      </span>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#EDE4D2] pt-2.5">
        <span
          className="truncate font-mono"
          style={{ fontSize: 9, color: "#B4A78E" }}
        >
          superstacks.dev/{stack.handle.replace(/^@/, "")}
        </span>
        <Logomark size={14} className="flex-none" />
      </div>
    </div>
  );
}

export default function CommunityPile() {
  return (
    <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {SAMPLES.map((stack) => (
        <PileCard key={stack.handle} stack={stack} />
      ))}
    </div>
  );
}
