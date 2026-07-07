"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { FunctionReturnType } from "convex/server";
import { Id } from "@/convex/_generated/dataModel";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GithubIcon,
  NewTwitterIcon,
  ShuffleIcon,
} from "@hugeicons/core-free-icons";
import { DisplaySectionInput } from "@/lib/card/display";
import {
  buildCardRenderData,
  CardThemeKey,
  getLidEdition,
  getStickerLayout,
  LID_EDITIONS,
  LidEdition,
  OVERFLOW_STICKER_ID,
} from "@/lib/card/render";
import { toolLogoUrl } from "@/lib/logo";
import { CardArt, PREVIEW_CARD_FONTS } from "@/components/card/cardArt";
import ScaledCard from "@/components/card/scaledCard";
import StickerDragLayer from "@/components/card/stickerDragLayer";
import SharePreviewDialog from "@/components/card/sharePreviewDialog";

type StackData = FunctionReturnType<typeof api.stacks.getStack>;

export type { CardThemeKey } from "@/lib/card/render";
const THEMES: CardThemeKey[] = ["minimal", "terminal", "lid"];
const EDITION_LABELS: Record<LidEdition, string> = {
  apple: "Apple",
  microsoft: "Microsoft",
  linux: "Linux",
};

export default function StackCardPreview({
  stack,
  stackId,
  onSetTheme,
}: {
  stack: StackData;
  stackId: Id<"stacks">;
  onSetTheme: (theme: CardThemeKey) => void;
}) {
  // Guests can preview, copy the link, and share on X freely, but the PNG
  // download is gated behind sign-in to drive onboarding. Read auth state
  // internally so the call site needs no new props.
  const { isSignedIn } = useUser();
  const [gateOpen, setGateOpen] = useState(false);

  // Server-synced local state, adjusted during render (not in an effect):
  // when another session changes the stack, the new server value wins; local
  // interaction updates render instantly and the mutation catches up.
  const [theme, setTheme] = useState<CardThemeKey>(
    (stack.cardTheme as CardThemeKey) ?? "minimal"
  );
  const [prevServerTheme, setPrevServerTheme] = useState(stack.cardTheme);
  if (stack.cardTheme !== prevServerTheme) {
    setPrevServerTheme(stack.cardTheme);
    if (stack.cardTheme) setTheme(stack.cardTheme as CardThemeKey);
  }

  const setLidOptionsMutation = useMutation(api.stacks.setLidOptions);
  const setStickerPositionMutation = useMutation(api.stacks.setStickerPosition);
  const setStickerModeMutation = useMutation(api.stacks.setStickerMode);

  // Lid state, optimistic-first: local values render immediately, the
  // mutations persist them, and the query round-trip settles on the same
  // numbers (all layout math is deterministic, so no flicker either way).
  const [edition, setEdition] = useState<LidEdition>(
    getLidEdition(stack.lidEdition)
  );
  const [prevServerEdition, setPrevServerEdition] = useState(stack.lidEdition);
  if (stack.lidEdition !== prevServerEdition) {
    setPrevServerEdition(stack.lidEdition);
    if (stack.lidEdition) setEdition(getLidEdition(stack.lidEdition));
  }

  const [localSeed, setLocalSeed] = useState<number | null>(null);
  // null = mirror the server; an object = full local snapshot (drag/shuffle
  // in flight). Snapshots always start from the server map, so nothing is
  // lost while the mutations catch up.
  const [localPositions, setLocalPositions] = useState<Record<
    string,
    { x: number; y: number }
  > | null>(null);
  // Same optimistic pattern for per-sticker display modes: local override
  // renders instantly, setStickerMode persists, and the query round-trip
  // settles on the same map.
  const [localModes, setLocalModes] = useState<Record<string, string> | null>(
    null
  );

  const seed = localSeed ?? stack.stickerSeed ?? 1;
  const positions = useMemo(
    () => localPositions ?? stack.stickerPositions ?? {},
    [localPositions, stack.stickerPositions]
  );
  const modes = useMemo(
    () => localModes ?? stack.stickerModes ?? {},
    [localModes, stack.stickerModes]
  );

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
          lidEdition: edition,
          stickerSeed: seed,
          stickerPositions: positions,
          stickerModes: modes,
        },
        // png:true skips expiring Brandfetch URLs, exactly like the PNG
        // route, so both fall back to the same letter-tiles.
        (t) => toolLogoUrl(t, { png: true }),
        stack.authorAvatarUrl || null
      ),
    [stack, theme, edition, seed, positions, modes]
  );

  const isLid = theme === "lid";
  // Same layout the art just rendered — the drag proxies sit exactly on the
  // painted stickers because both consume getStickerLayout + the shared
  // stickerLeft/stickerTop mapping.
  const stickers = useMemo(
    () => (isLid ? getStickerLayout(data) : []),
    [isLid, data]
  );

  const handleTheme = (v: string) => {
    if (!v) return;
    const t = v as CardThemeKey;
    setTheme(t);
    onSetTheme(t);
  };

  const handleEdition = (v: string) => {
    if (!v) return;
    const e = v as LidEdition;
    setEdition(e);
    setLidOptionsMutation({ stackId, lidEdition: e }).catch(() =>
      toast.error("Couldn't save the edition")
    );
  };

  const handleDragMove = useCallback(
    (toolId: string, x: number, y: number) => {
      setLocalPositions((prev) => ({
        ...(prev ?? stack.stickerPositions ?? {}),
        [toolId]: { x, y },
      }));
    },
    [stack.stickerPositions]
  );

  const handleDragEnd = useCallback(
    (toolId: string, x: number, y: number) => {
      setLocalPositions((prev) => ({
        ...(prev ?? stack.stickerPositions ?? {}),
        [toolId]: { x, y },
      }));
      setStickerPositionMutation({
        stackId,
        toolId: toolId as Id<"tools">,
        x,
        y,
      }).catch(() => toast.error("Couldn't save the sticker position"));
    },
    [stack.stickerPositions, stackId, setStickerPositionMutation]
  );

  // Double-click / double-tap cycles a sticker's display mode
  // logo -> both -> name -> logo. The starting point is whatever the sticker
  // currently renders as (resolved layout mode), so the cycle always advances
  // from what the user sees, defaults included.
  const handleCycleMode = useCallback(
    (toolId: string) => {
      const NEXT: Record<string, "logo" | "both" | "name"> = {
        logo: "both",
        both: "name",
        name: "logo",
      };
      const current = stickers.find((s) => s.toolId === toolId)?.mode ?? "logo";
      const next = NEXT[current] ?? "logo";
      setLocalModes((prev) => ({
        ...(prev ?? stack.stickerModes ?? {}),
        [toolId]: next,
      }));
      setStickerModeMutation({ stackId, toolId, mode: next }).catch(() =>
        toast.error("Couldn't save the sticker style")
      );
    },
    [stickers, stack.stickerModes, stackId, setStickerModeMutation]
  );

  // Shuffle = new seed + every sticker re-anchored to the NEW default
  // scatter. Stored positions take precedence over the seed, so the re-write
  // is what makes the shuffle stick for previously-dragged stickers — and
  // since the scatter is deterministic, persisting the defaults changes
  // nothing visually.
  const shuffle = () => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const newSeed = buf[0] >>> 0;
    const defaults = getStickerLayout({
      ...data,
      stickerSeed: newSeed,
      stickerPositions: {},
    });
    const next: Record<string, { x: number; y: number }> = {};
    for (const s of defaults) {
      if (s.toolId === OVERFLOW_STICKER_ID) continue;
      next[s.toolId] = { x: s.x, y: s.y };
    }
    setLocalSeed(newSeed);
    setLocalPositions(next);
    Promise.all([
      setLidOptionsMutation({ stackId, stickerSeed: newSeed }),
      ...Object.entries(next).map(([toolId, p]) =>
        setStickerPositionMutation({
          stackId,
          toolId: toolId as Id<"tools">,
          x: p.x,
          y: p.y,
        })
      ),
    ]).catch(() => toast.error("Couldn't save the shuffle"));
  };

  const shareUrl = () => `${window.location.origin}/s/${stackId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      toast.success("Share link copied to clipboard");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  // Open X's composer with the share link prefilled — X unfurls the card
  // from the link's OG tags once it loads. On iOS this deep-links to the app.
  const shareOnX = () => {
    const text =
      stack.name && stack.name !== "My Tech Stack"
        ? stack.name
        : "My tech stack";
    const url = `https://x.com/intent/post?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(shareUrl())}`;
    window.open(url, "_blank", "noopener,noreferrer");
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

  // Guests get the sign-in gate instead of a download; signed-in users
  // download exactly as before. (isSignedIn is undefined until Clerk loads —
  // only gate once we know for sure the user is signed out.)
  const handleDownloadClick = () => {
    if (isSignedIn === false) {
      setGateOpen(true);
      return;
    }
    downloadPng();
  };

  return (
    <div className="flex flex-col gap-3.5 lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A7B63]">
          Live preview
        </span>
        <div className="flex items-center gap-2">
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
          <SharePreviewDialog data={data} onShareOnX={shareOnX} />
        </div>
      </div>

      {isLid && (
        <div className="flex items-center justify-between gap-3">
          <ToggleGroup
            type="single"
            value={edition}
            onValueChange={handleEdition}
            aria-label="Lid edition"
            className="gap-1 rounded-[9px] bg-[#EDE4D2] p-[2px]"
          >
            {LID_EDITIONS.map((e) => (
              <ToggleGroupItem
                key={e}
                value={e}
                aria-label={EDITION_LABELS[e]}
                className="rounded-[7px] px-2.5 py-1 font-mono text-[10.5px] font-semibold text-[#8A7B63] data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-[0_1px_3px_rgba(60,40,10,0.15)]"
              >
                {EDITION_LABELS[e]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={shuffle}
            aria-label="Shuffle stickers"
            title="Shuffle the stickers"
            data-testid="shuffle-stickers"
          >
            <HugeiconsIcon icon={ShuffleIcon} className="size-4" />
          </Button>
        </div>
      )}

      <ScaledCard
        render={(scale) => (
          <>
            <CardArt data={data} fonts={PREVIEW_CARD_FONTS} />
            {isLid && stickers.length > 0 && (
              <StickerDragLayer
                stickers={stickers}
                scale={scale}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onCycleMode={handleCycleMode}
              />
            )}
          </>
        )}
      />

      {isLid && stickers.length > 0 && (
        <p className="-mt-1 text-center text-[12px] text-[#B4A78E]">
          drag the stickers to rearrange · double-tap to toggle logo / name
        </p>
      )}

      <p className="text-[12.5px] leading-relaxed text-[#8A7B63]">
        This is exactly how your card unfurls when shared. Pinned tools show
        first; each section fits 5 on the card.
      </p>
      <div className="flex flex-col gap-2.5">
        <Button variant="brand" className="w-full gap-2" onClick={shareOnX}>
          <HugeiconsIcon icon={NewTwitterIcon} className="size-4" />
          Share on X
        </Button>
        <div className="flex gap-2.5">
          <Button variant="outline" className="flex-1" onClick={copyLink}>
            Copy link
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDownloadClick}
          >
            Download PNG
          </Button>
        </div>
      </div>

      {/* Guest download gate — frames signing in as the way to save & share
          your card, and starts GitHub sign-in in a Clerk modal so the user
          isn't navigated away. After signing in they can click Download
          again and the PNG saves. */}
      <Dialog open={gateOpen} onOpenChange={setGateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[19px] font-black tracking-[-0.02em]">
              Save &amp; share your card
            </DialogTitle>
            <DialogDescription className="text-[13.5px] leading-relaxed text-[#6B5D46]">
              Sign in with GitHub to download your card as a PNG. Copying the
              link and sharing on X stay free for everyone.
            </DialogDescription>
          </DialogHeader>
          <SignInButton mode="modal" forceRedirectUrl="/stack">
            <Button variant="brand" className="w-full gap-2">
              <HugeiconsIcon icon={GithubIcon} className="size-4" />
              Continue with GitHub
            </Button>
          </SignInButton>
        </DialogContent>
      </Dialog>
    </div>
  );
}
