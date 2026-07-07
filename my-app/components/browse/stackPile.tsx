"use client";

// Browse feed card — the approved "1c Loose pile" design. Each stack's
// sections are cards tossed on the table (closed rotated pile) that snap
// into a tidy column on hover (desktop) or on TAP (touch — the whole card
// toggles open/closed, same interaction as the landing community pile; the
// Layers button is the visible affordance and "OPEN" navigates). Desktop
// click still goes straight to the stack page. Reduced-motion users always
// get the extended column (see the .stackpile rules in app/globals.css).

import type { CSSProperties, KeyboardEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Layers01Icon } from "@hugeicons/core-free-icons";
import { Logomark } from "@/components/brand/logo";
import LogoFramework from "@/app/stack/logo-framework";

export interface StackPileTool {
  name: string;
  logoUrl?: string;
  iconSlug?: string;
}

export interface StackPileSection {
  name: string;
  sectionType: string;
  /** Total selected tools in the section (badge count). */
  count: number;
  /** Up to 4 display tools — same pinned-first pick as the share card. */
  tools: StackPileTool[];
}

export interface StackPileStack {
  id: string;
  name: string;
  subtitle?: string;
  authorName?: string;
  handle?: string;
  avatarUrl?: string;
  toolCount: number;
  sections: StackPileSection[];
}

// Per-sectionType oklch hues from the approved design.
const SECTION_HUES: Record<string, number> = {
  frontend: 55,
  backend: 150,
  ide: 245,
  ai: 305,
  other: 85,
};

const LAYER_HEIGHT = 90; // px, fixed per design
const CLOSED_STEP = 7; // px the pile fans down per layer when closed
const OPEN_STEP = 100; // px per layer when extended (90 + 10 gap)
// Closed pile rotation allowance: a ±6° layer at ~330px wide grows its
// bounding box by w·sin6° ≈ 34px (≈17px above + below) plus the 3px hard
// shadow → 25px total, which reproduces the spec's 136px at 4 sections.
const CLOSED_ALLOWANCE = 25;

function closedHeight(n: number) {
  return LAYER_HEIGHT + (n - 1) * CLOSED_STEP + CLOSED_ALLOWANCE;
}

function openHeight(n: number) {
  // Last layer bottom = (n-1)*100 + 90 = n*100 - 10; +2px of the 3px hard
  // shadow kept in-flow → n*100 - 8 (the spec's 392px at 4 sections).
  return n * OPEN_STEP - 8;
}

// Closed-pile toss angles, spread symmetrically between -6° and +6° so any
// section count keeps the spec's silhouette (4 sections → -6/-2/+2/+6).
function tossAngle(i: number, n: number) {
  if (n <= 1) return -3;
  return -6 + (12 * i) / (n - 1);
}

function SectionLayer({
  section,
  index,
  total,
}: {
  section: StackPileSection;
  index: number;
  total: number;
}) {
  const hue = SECTION_HUES[section.sectionType] ?? SECTION_HUES.other;
  const ink = `oklch(0.52 0.12 ${hue})`;
  const bg = `oklch(0.958 0.02 ${hue})`;
  const letter = (section.name[0] || "?").toUpperCase();

  return (
    <div
      className="stackpile-layer overflow-hidden"
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
            <LogoFramework
              name={tool.name}
              slug={tool.iconSlug}
              src={tool.logoUrl}
              size={22}
            />
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

export default function StackPile({ stack }: { stack: StackPileStack }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const n = stack.sections.length;
  const initial = (stack.authorName || stack.name)[0]?.toUpperCase() || "S";
  const toolsLabel = `${stack.toolCount} ${stack.toolCount === 1 ? "tool" : "tools"}`;
  const metaLine = stack.subtitle
    ? `${toolsLabel} · ${stack.subtitle}`
    : toolsLabel;

  const navigate = () => router.push(`/s/${stack.id}`);
  const toggle = () => setOpen((v) => !v);
  // Fine pointers fan the pile on hover, so a click means "open the stack".
  // Coarse pointers (touch) have no hover — there, tapping the card IS the
  // fan toggle (same as the landing pile) and OPEN / the footer navigate.
  const onCardClick = () => {
    const fine = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;
    if (fine) navigate();
    else toggle();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Only act on the card itself — Enter on the inner @handle link
    // bubbles here and must keep its own destination.
    if (e.key === "Enter" && e.target === e.currentTarget) {
      e.preventDefault();
      navigate();
    }
  };

  return (
    <div
      data-open={open}
      role="link"
      tabIndex={0}
      aria-label={`${stack.name}, ${toolsLabel}`}
      onClick={onCardClick}
      onKeyDown={onKeyDown}
      className="stackpile-card group cursor-pointer rounded-[18px] border-[1.5px] border-foreground bg-[#FBF7F0] p-3.5 shadow-[0_5px_0_var(--foreground)] outline-none transition-shadow duration-200 hover:shadow-[0_7px_0_var(--foreground)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        {stack.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stack.avatarUrl}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 flex-none rounded-[10px] border border-[#EDE4D2] object-cover"
          />
        ) : (
          <span
            className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-primary font-black"
            style={{ color: "#FFF7EE", fontSize: 14 }}
            aria-hidden
          >
            {initial}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-black tracking-[-0.01em] text-foreground">
            {stack.name}
          </div>
          <div
            className="truncate font-mono"
            style={{ fontSize: 9.5, color: "#B4A78E" }}
          >
            {metaLine}
          </div>
        </div>
        <span
          className="stackpile-hint flex-none items-center rounded-full font-mono font-bold"
          style={{
            fontSize: 8.5,
            letterSpacing: "0.14em",
            color: "#8A7B63",
            border: "1px dashed #D6C9AF",
            padding: "4px 9px",
          }}
          aria-hidden
        >
          HOVER ▾
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          aria-expanded={open}
          aria-label={open ? "Stack the sections" : "Fan out the sections"}
          className="flex flex-none cursor-pointer items-center justify-center rounded-[9px] border border-[#E0D5BE] bg-card text-[#8A7B63] transition-colors hover:border-primary hover:text-primary group-data-[open=true]:border-primary group-data-[open=true]:bg-[#FEF3E7] group-data-[open=true]:text-primary"
          style={{ width: 30, height: 30 }}
        >
          <HugeiconsIcon icon={Layers01Icon} size={16} strokeWidth={2} />
        </button>
      </div>

      {/* The pile */}
      {n === 0 ? (
        <div
          className="mt-5 flex items-center justify-center rounded-[13px] border-[1.5px] border-dashed border-[#D6C9AF]"
          style={{ height: LAYER_HEIGHT }}
        >
          <span
            className="font-mono font-bold"
            style={{ fontSize: 9.5, letterSpacing: "0.14em", color: "#B4A78E" }}
          >
            STILL BREWING
          </span>
        </div>
      ) : (
        <div
          className="stackpile"
          style={
            {
              "--closed-h": `${closedHeight(n)}px`,
              "--open-h": `${openHeight(n)}px`,
            } as CSSProperties
          }
        >
          {/* DOM order reversed so the first section paints on top of the
              collapsed pile; absolute `top` (from the original index) still
              orders the open column first-to-last. */}
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
      )}

      {/* Footer. OPEN is the touch path to the stack page (tapping the card
          toggles the pile there); on desktop it duplicates the card click. */}
      <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-[#EDE4D2] pt-2.5">
        {stack.handle ? (
          <Link
            href={`/u/${stack.handle}`}
            onClick={(e) => e.stopPropagation()}
            className="truncate font-mono text-[9px] text-[#B4A78E] hover:text-primary"
          >
            superstacks.dev/{stack.handle}
          </Link>
        ) : (
          <Link
            href={`/s/${stack.id}`}
            onClick={(e) => e.stopPropagation()}
            className="truncate font-mono text-[9px] text-[#B4A78E] hover:text-primary"
          >
            superstacks.dev/{stack.id}
          </Link>
        )}
        <div className="flex flex-none items-center gap-2.5">
          <Link
            href={`/s/${stack.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-mono font-bold text-primary hover:underline"
            style={{ fontSize: 9, letterSpacing: "0.14em" }}
          >
            OPEN →
          </Link>
          <Logomark size={14} className="flex-none" />
        </div>
      </div>
    </div>
  );
}
