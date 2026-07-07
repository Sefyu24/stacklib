"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { FunctionReturnType } from "convex/server";
import { Id } from "@/convex/_generated/dataModel";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { DisplaySectionInput } from "@/lib/card/display";
import { buildCardRenderData, CardThemeKey } from "@/lib/card/render";
import { toolLogoUrl } from "@/lib/logo";
import {
  CardArt,
  CARD_WIDTH,
  CARD_HEIGHT,
  PREVIEW_CARD_FONTS,
} from "@/components/card/cardArt";

type StackData = FunctionReturnType<typeof api.stacks.getStack>;

export type { CardThemeKey } from "@/lib/card/render";
const THEMES: CardThemeKey[] = ["minimal", "lid", "terminal"];

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

  // The preview renders the SAME 1200x630 art the PNG route rasterizes —
  // same assembly, same components — just resolved to plain logo URLs and
  // scaled down to fit the column. It cannot drift from the download.
  const data = useMemo(
    () =>
      buildCardRenderData(
        {
          name: stack.name,
          subtitle: stack.subtitle,
          sections: stack.sections as unknown as DisplaySectionInput[],
          cardTheme: theme,
          showWatermark: stack.showWatermark,
          showAvatar: stack.showAvatar,
          authorName: stack.authorName,
          authorHandle: stack.authorHandle,
        },
        // png:true skips expiring Brandfetch URLs, exactly like the PNG
        // route, so both fall back to the same letter-tiles.
        (t) => toolLogoUrl(t, { png: true }),
        stack.authorAvatarUrl || null
      ),
    [stack, theme]
  );

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
      // scale=2 → 2400x1260 so the PNG stays sharp on retina screens and
      // social zoom; t busts the browser HTTP cache so the download always
      // reflects the current stack (the OG route is edge-cacheable).
      const res = await fetch(`/api/card/${stackId}?scale=2&t=${Date.now()}`, {
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

      <ScaledCard>
        <CardArt data={data} fonts={PREVIEW_CARD_FONTS} />
      </ScaledCard>

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

/**
 * Scale-to-fit stage: the card art is a fixed 1200x630 design, so we measure
 * the available width and shrink the whole thing with a transform — the
 * preview shows the exact pixels of the PNG at every container size.
 */
function ScaledCard({ children }: { children: React.ReactNode }) {
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
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            transform: `scale(${width / CARD_WIDTH})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
