"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { FunctionReturnType } from "convex/server";
import { Id } from "@/convex/_generated/dataModel";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import LogoFramework from "@/app/stack/logo-framework";
import {
  getCardSections,
  getCardStats,
  DisplaySectionInput,
  DisplaySection,
} from "@/lib/card/display";

type StackData = FunctionReturnType<typeof api.stacks.getStack>;

export type CardThemeKey = "minimal" | "bento" | "terminal";
const THEMES: CardThemeKey[] = ["minimal", "bento", "terminal"];

export default function StackCardPreview({
  stack,
  stackId,
  onSetTheme,
}: {
  stack: StackData;
  stackId: Id<"stacks">;
  onSetTheme: (theme: CardThemeKey) => void;
}) {
  const [theme, setTheme] = useState<CardThemeKey>(
    (stack.cardTheme as CardThemeKey) ?? "minimal"
  );
  useEffect(() => {
    if (stack.cardTheme) setTheme(stack.cardTheme as CardThemeKey);
  }, [stack.cardTheme]);

  const sections = getCardSections(
    stack.sections as unknown as DisplaySectionInput[]
  );
  const stats = getCardStats(
    stack.sections as unknown as DisplaySectionInput[]
  );
  const statLabel = stats.label;
  const overflow = stats.overflow;
  // Until user profiles ship, the share page is the "see everything" target.
  const moreHref = `/s/${stackId}`;
  const showWatermark = stack.showWatermark ?? true;
  const isEmpty = sections.length === 0;

  const handleTheme = (v: string) => {
    if (!v) return;
    const t = v as CardThemeKey;
    setTheme(t);
    onSetTheme(t);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/s/${stackId}`
      );
      toast.success("Share link copied to clipboard");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const downloadPng = async () => {
    try {
      // Bust the browser HTTP cache so the download always reflects the
      // current stack (the OG route is edge-cacheable for sharing).
      const res = await fetch(`/api/card/${stackId}?t=${Date.now()}`, {
        cache: "no-store",
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${stack.name.replace(/\s+/g, "-").toLowerCase()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Card exported as PNG");
    } catch {
      toast.error("Couldn't export the card");
    }
  };

  return (
    <div className="flex flex-col gap-3.5 lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A7B63]">
          Live preview
        </span>
        <ToggleGroup
          type="single"
          value={theme}
          onValueChange={handleTheme}
          className="gap-1 rounded-[10px] bg-[#EDE4D2] p-[3px]"
        >
          {THEMES.map((t) => (
            <ToggleGroupItem
              key={t}
              value={t}
              aria-label={t}
              className="rounded-lg px-[13px] py-1.5 font-mono text-[11px] font-semibold text-[#8A7B63] data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-[0_1px_3px_rgba(60,40,10,0.15)]"
            >
              {t}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {theme === "minimal" && (
        <CardMinimal
          stackName={stack.name}
          statLabel={statLabel}
          sections={sections}
          showWatermark={showWatermark}
          isEmpty={isEmpty}
          overflow={overflow}
          moreHref={moreHref}
          subtitle={stack.subtitle || undefined}
        />
      )}
      {theme === "bento" && (
        <CardBento
          stackName={stack.name}
          statLabel={statLabel}
          sections={sections}
          showWatermark={showWatermark}
          isEmpty={isEmpty}
          overflow={overflow}
          moreHref={moreHref}
          subtitle={stack.subtitle || undefined}
        />
      )}
      {theme === "terminal" && (
        <CardTerminal
          stackName={stack.name}
          statLabel={statLabel}
          sections={sections}
          showWatermark={showWatermark}
          isEmpty={isEmpty}
          overflow={overflow}
          moreHref={moreHref}
          subtitle={stack.subtitle || undefined}
        />
      )}

      <p className="text-[12.5px] leading-relaxed text-[#8A7B63]">
        This is exactly how your card unfurls when shared. Pinned tools show
        first; each section fits 5 on the card.
      </p>
      <div className="flex gap-2.5">
        <Button variant="brand" className="flex-1" onClick={copyLink}>
          Copy share link
        </Button>
        <Button variant="outline" className="flex-1" onClick={downloadPng}>
          Download PNG
        </Button>
      </div>
    </div>
  );
}

interface CardProps {
  stackName: string;
  statLabel: string;
  sections: DisplaySection[];
  showWatermark: boolean;
  isEmpty: boolean;
  /** Tools that didn't fit on the card */
  overflow: number;
  /** Where "+K more" points (full profile / share page) */
  moreHref: string;
  /** Optional one-line tagline rendered under the title */
  subtitle?: string;
}

function MoreChip({
  overflow,
  moreHref,
  className,
}: {
  overflow: number;
  moreHref: string;
  className?: string;
}) {
  if (overflow <= 0) return null;
  return (
    <a
      href={moreHref}
      className={
        "inline-flex w-fit items-center rounded-[7px] border border-dashed border-[#D9A16B] px-[9px] py-1 text-[11.5px] font-semibold text-primary hover:bg-[#FDF1E6] " +
        (className ?? "")
      }
    >
      +{overflow} more
    </a>
  );
}

function EmptyNote() {
  return (
    <div className="flex flex-col items-center gap-1 py-8 text-center">
      <span className="text-[15px] font-bold text-foreground">
        This stack is still brewing
      </span>
      <span className="text-[12px] text-[#B4A78E]">
        Add tools to see your card
      </span>
    </div>
  );
}

function CardMinimal({
  stackName,
  statLabel,
  sections,
  showWatermark,
  isEmpty,
  overflow,
  moreHref,
  subtitle,
}: CardProps) {
  return (
    <div className="rounded-[18px] border-[1.5px] border-foreground bg-[#FBF7F0] p-2.5 shadow-[0_4px_0_var(--foreground)]">
      <div className="rounded-xl border border-[#EDE4D2] bg-card px-6 pb-4 pt-[22px]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
            SUPERSTACK
          </span>
          <span className="font-mono text-[10px] text-[#B4A78E]">
            {statLabel}
          </span>
        </div>
        <div className="my-2 mb-3.5 text-[24px] font-black tracking-[-0.02em]">
          {stackName}
        </div>
        {subtitle && (
          <div className="-mt-2 mb-3 text-[12px] font-medium text-[#8A7B63]">
            {subtitle}
          </div>
        )}
        {isEmpty ? (
          <EmptyNote />
        ) : (
          <div className="flex flex-col gap-[11px]">
            {sections.map((cs) => (
              <div key={cs.sectionType}>
                <div className="mb-[5px] font-mono text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#B4A78E]">
                  {cs.name}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cs.tools.map((ct) => (
                    <span
                      key={ct.toolId}
                      className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#F0DCC2] bg-[#FFF8F0] px-[9px] py-1 text-[11.5px] font-semibold text-foreground"
                    >
                      <LogoFramework
                        name={ct.name}
                        slug={ct.iconSlug}
                        src={ct.logoUrl}
                        url={ct.url || undefined}
                        size={13}
                      />
                      {ct.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <MoreChip overflow={overflow} moreHref={moreHref} />
          </div>
        )}
        {showWatermark && (
          <div className="mt-4 flex items-center justify-between border-t border-[#EDE4D2] pt-2.5">
            <span className="font-mono text-[9.5px] text-[#B4A78E]">
              superstack.app
            </span>
            <span className="flex size-3.5 items-center justify-center rounded bg-primary text-[8px] font-black text-primary-foreground">
              S
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CardBento({
  stackName,
  statLabel,
  sections,
  showWatermark,
  isEmpty,
  overflow,
  moreHref,
  subtitle,
}: CardProps) {
  // Grouped by category: one label per section, tiles below, and the grid
  // grows vertically — no flat 9-cell cap, so no tool is ever dropped.
  return (
    <div className="rounded-[18px] border-[1.5px] border-foreground bg-[#F3E8D6] px-[22px] pb-4 pt-[22px] shadow-[0_4px_0_var(--foreground)]">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
          SUPERSTACK
        </span>
        <span className="font-mono text-[10px] text-[#A0713C]">
          {statLabel}
        </span>
      </div>
      <div className="mb-3.5 text-[24px] font-black tracking-[-0.02em]">
        {stackName}
      </div>
      {subtitle && (
        <div className="-mt-2 mb-3 text-[12px] font-medium text-[#8A7B63]">
          {subtitle}
        </div>
      )}
      {isEmpty ? (
        <EmptyNote />
      ) : (
        <div className="flex flex-col gap-3">
          {sections.map((cs) => (
            <div key={cs.sectionType}>
              <div className="mb-1.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#A0713C]">
                {cs.name}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {cs.tools.map((bt) => (
                  <div
                    key={bt.toolId}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-[#E4D5BB] bg-card px-2.5 py-2"
                  >
                    <LogoFramework
                      name={bt.name}
                      slug={bt.iconSlug}
                      src={bt.logoUrl}
                      url={bt.url || undefined}
                      size={22}
                    />
                    <span className="truncate text-[11px] font-bold text-foreground">
                      {bt.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <MoreChip overflow={overflow} moreHref={moreHref} />
        </div>
      )}
      {showWatermark && (
        <div className="mt-3 flex justify-center">
          <span className="font-mono text-[9.5px] text-[#A0713C]">
            superstack.app
          </span>
        </div>
      )}
    </div>
  );
}

function CardTerminal({
  stackName,
  statLabel,
  sections,
  showWatermark,
  isEmpty,
  overflow,
  subtitle,
}: CardProps) {
  const terminalTitle = `${stackName.toLowerCase().replace(/\s+/g, "-")}.sh`;
  return (
    <div className="overflow-hidden rounded-[18px] border-[1.5px] border-foreground bg-[#16110B] shadow-[0_4px_0_var(--foreground)]">
      <div className="flex items-center gap-1.5 border-b border-[#2C2418] px-4 py-[11px]">
        <span className="size-[9px] rounded-full bg-[#E5533C]" />
        <span className="size-[9px] rounded-full bg-[#E5A93C]" />
        <span className="size-[9px] rounded-full bg-[#5BA35B]" />
        <span className="ml-auto font-mono text-[9.5px] text-[#6B5D46]">
          {terminalTitle}
        </span>
      </div>
      <div className="px-5 pb-4 pt-[18px] font-mono text-[12px] leading-[2]">
        <div className="text-[#C9BCA2]">
          <span className="text-primary">~</span>{" "}
          <span className="text-[#5BA35B]">$</span> superstack show{" "}
          <span className="text-[#8A7B63]">--pinned</span>
        </div>
        {subtitle && <div className="text-[#6B5D46]"># {subtitle}</div>}
        {isEmpty ? (
          <div className="text-[#6B5D46]">
            # no tools yet — add some to build your stack
          </div>
        ) : (
          <>
            {sections.map((cs) => (
              <div key={cs.sectionType}>
                <span className="text-primary">
                  {cs.sectionType.padEnd(8)}
                </span>
                <span className="text-[#4A3F2E]"> › </span>
                <span className="text-[#F0E6D2]">
                  {cs.tools.map((t) => t.name).join(" · ")}
                </span>
              </div>
            ))}
            <div className="text-[#5BA35B]">✓ {statLabel}</div>
            {overflow > 0 && (
              <div className="text-[#6B5D46]"># +{overflow} more on superstack.app</div>
            )}
          </>
        )}
        {showWatermark && (
          <div className="text-[#6B5D46]">
            superstack.app
            <span className="ml-1.5 inline-block h-[13px] w-[7px] animate-[blink_1.1s_step-end_infinite] bg-primary align-[-2px]" />
          </div>
        )}
      </div>
    </div>
  );
}
