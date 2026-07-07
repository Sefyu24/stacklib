"use client";

// "How it unfurls" dialog: the real card art, framed like an X post — fake
// tweet shell (avatar, name, handle, one placeholder line), the card at
// dialog width (1200:630 kept by ScaledCard), and a link-card footer bar.

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowExpand01Icon,
  NewTwitterIcon,
} from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardRenderData } from "@/lib/card/render";
import { Id } from "@/convex/_generated/dataModel";

export default function SharePreviewDialog({
  data,
  stackId,
  theme,
  edition,
  seed,
  onShareOnX,
}: {
  data: CardRenderData;
  stackId: Id<"stacks">;
  // The live preview's current theme/edition/seed, so the dialog renders the
  // card the user is looking at right now (not the stale edge-cached PNG).
  theme: string;
  edition: string;
  seed: number;
  onShareOnX: () => void;
}) {
  const displayName = data.authorName || data.stackName;
  const handle = data.handleText ? `@${data.handleText}` : "@superstacks";
  const showAvatarImg = data.showAvatar !== false && data.avatarSrc;
  // Forward the current preview state as query overrides; the changing values
  // also bust the OG route's edge cache when the user switches theme/shuffles.
  const cardSrc = `/api/card/${stackId}?scale=2&theme=${encodeURIComponent(
    theme
  )}&edition=${encodeURIComponent(edition)}&seed=${seed}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Preview how the card unfurls when shared"
          title="Preview the share unfurl"
          data-testid="expand-preview"
        >
          <HugeiconsIcon icon={ArrowExpand01Icon} className="size-4" />
        </Button>
      </DialogTrigger>
      {/* Constrained to a real tweet column width so it reads like an actual
          X post on every screen (a full-bleed card felt oversized on phones). */}
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] gap-4 overflow-y-auto border-[#E8DFCE] bg-[#F6F1E8] p-4 sm:max-w-[456px] sm:p-5">
        <DialogHeader>
          <DialogTitle className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A7B63]">
            Share preview
          </DialogTitle>
        </DialogHeader>

        {/* fake tweet shell */}
        <div className="rounded-[18px] border border-[#E8DFCE] bg-[#FFFDF8] p-3.5 shadow-[0_1px_3px_rgba(60,40,10,0.06)]">
          <div className="flex items-center gap-2.5">
            {showAvatarImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.avatarSrc!}
                alt=""
                className="size-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full bg-[#F3E8D6] text-[15px] font-extrabold text-[#A0713C]">
                {displayName[0]?.toUpperCase() ?? "S"}
              </div>
            )}
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[14px] font-bold text-foreground">
                {displayName}
              </span>
              <span className="truncate text-[12.5px] text-[#8A7B63]">
                {handle}
              </span>
            </div>
          </div>

          <p className="mt-2.5 text-[14px] text-foreground">
            just shipped my stack &rarr;
          </p>

          {/* The link card: the ACTUAL share PNG (exactly what X unfurls),
              not an in-browser re-render — bulletproof sizing, no scaling
              math that can misfire inside the animated dialog. */}
          <div className="mt-2.5 overflow-hidden rounded-[14px] border border-[#E8DFCE]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardSrc}
              alt={`${data.stackName} card preview`}
              width={1200}
              height={630}
              className="block aspect-[1200/630] w-full bg-[#F6F1E8] object-cover"
            />
            <div className="border-t border-[#E8DFCE] bg-[#F9F4EA] px-3.5 py-2 text-[12px] font-medium text-[#8A7B63]">
              superstacks.dev
            </div>
          </div>
        </div>

        <Button variant="brand" className="w-full gap-2" onClick={onShareOnX}>
          <HugeiconsIcon icon={NewTwitterIcon} className="size-4" />
          Share on X
        </Button>
      </DialogContent>
    </Dialog>
  );
}
