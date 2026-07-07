"use client";

// "How it unfurls" dialog: the real card art, framed like an X post — fake
// tweet shell (avatar, name, handle, one placeholder line), the card at
// dialog width (1200:630 kept by ScaledCard), and a link-card footer bar.

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowExpand01Icon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardRenderData } from "@/lib/card/render";
import { CardArt, PREVIEW_CARD_FONTS } from "@/components/card/cardArt";
import ScaledCard from "@/components/card/scaledCard";

export default function SharePreviewDialog({ data }: { data: CardRenderData }) {
  const displayName = data.authorName || data.stackName;
  const handle = data.handleText ? `@${data.handleText}` : "@superstacks";
  const showAvatarImg = data.showAvatar !== false && data.avatarSrc;

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
      <DialogContent className="max-h-[92vh] gap-4 overflow-y-auto border-[#E8DFCE] bg-[#F6F1E8] p-4 sm:max-w-[min(90vw,1040px)] sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A7B63]">
            Share preview
          </DialogTitle>
        </DialogHeader>

        {/* fake tweet shell */}
        <div className="rounded-[18px] border border-[#E8DFCE] bg-[#FFFDF8] p-4 shadow-[0_1px_3px_rgba(60,40,10,0.06)] sm:p-5">
          <div className="flex items-center gap-3">
            {showAvatarImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.avatarSrc!}
                alt=""
                className="size-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-[#F3E8D6] text-[17px] font-extrabold text-[#A0713C]">
                {displayName[0]?.toUpperCase() ?? "S"}
              </div>
            )}
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[15px] font-bold text-foreground">
                {displayName}
              </span>
              <span className="truncate text-[13.5px] text-[#8A7B63]">
                {handle}
              </span>
            </div>
          </div>

          <p className="mt-3 text-[15px] text-foreground">
            just shipped my stack &rarr;
          </p>

          {/* the link card: real art + domain bar */}
          <div className="mt-3 overflow-hidden rounded-[16px] border border-[#E8DFCE]">
            <ScaledCard
              render={() => <CardArt data={data} fonts={PREVIEW_CARD_FONTS} />}
            />
            <div className="border-t border-[#E8DFCE] bg-[#F9F4EA] px-4 py-2.5 text-[13px] font-medium text-[#8A7B63]">
              superstacks.dev
            </div>
          </div>
        </div>

        <p className="text-center text-[12.5px] leading-relaxed text-[#8A7B63]">
          This is how your card unfurls when the link is shared on X.
        </p>
      </DialogContent>
    </Dialog>
  );
}
