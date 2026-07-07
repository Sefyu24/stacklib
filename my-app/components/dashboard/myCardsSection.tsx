"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PaintBoardIcon,
  Share01Icon,
  PlusSignIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { convexErrorMessage } from "@/components/dashboard/profileSection";

const THEME_LABELS: Record<string, string> = {
  minimal: "Minimal",
  bento: "Bento",
  terminal: "Terminal",
};

export default function MyCardsSection() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const ownerId = user?.id;
  const { isAuthenticated } = useConvexAuth();

  const stacks = useQuery(
    api.profiles.getMyStacks,
    ownerId && isAuthenticated ? { ownerId } : "skip"
  );

  const createStack = useMutation(api.stacks.createStack);
  const deleteStack = useMutation(api.stacks.deleteStack);

  // The card queued up for deletion (drives the confirm dialog).
  const [pendingDelete, setPendingDelete] = useState<{
    id: Id<"stacks">;
    name: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  // Optimistic toggle: patch the local getMyStacks result immediately so the
  // switch flips without waiting on the server round-trip.
  const setVisibility = useMutation(
    api.profiles.setStackVisibility
  ).withOptimisticUpdate((localStore, args) => {
    if (!ownerId) return;
    const current = localStore.getQuery(api.profiles.getMyStacks, { ownerId });
    if (current) {
      localStore.setQuery(
        api.profiles.getMyStacks,
        { ownerId },
        current.map((stack) =>
          stack.id === args.stackId
            ? { ...stack, isPublic: args.isPublic }
            : stack
        )
      );
    }
  });

  async function handleToggle(stackId: Id<"stacks">, isPublic: boolean) {
    try {
      await setVisibility({ stackId, isPublic });
      toast.success(
        isPublic ? "Card is now on your public profile" : "Card hidden from your profile"
      );
    } catch (err) {
      toast.error(
        convexErrorMessage(err, "Couldn't update visibility. Please try again.")
      );
    }
  }

  async function handleNewCard() {
    if (!ownerId || busy) return;
    setBusy(true);
    try {
      const newId = await createStack({ name: "New card", userId: ownerId });
      router.push(`/stack/${newId}`);
    } catch (err) {
      toast.error(
        convexErrorMessage(err, "Couldn't create a card. Please try again.")
      );
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete || busy) return;
    setBusy(true);
    try {
      await deleteStack({ stackId: pendingDelete.id });
      toast.success("Card deleted");
      setPendingDelete(null);
    } catch (err) {
      toast.error(
        convexErrorMessage(err, "Couldn't delete this card. Please try again.")
      );
    } finally {
      setBusy(false);
    }
  }

  if (!isLoaded || (ownerId && stacks === undefined)) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            Dashboard
          </p>
          <h1 className="mt-1 text-[28px] font-black tracking-[-0.02em] text-foreground sm:text-[34px]">
            My cards
          </h1>
          <p className="mt-1 text-[15px] text-[#8A7B63]">
            Flip a card public to feature it on your profile page.
          </p>
        </div>
        <Button
          variant="brand"
          size="sm"
          onClick={handleNewCard}
          disabled={busy}
        >
          <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
          New card
        </Button>
      </div>

      {!stacks || stacks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[18px] border-[1.5px] border-dashed border-[#E0D5BE] bg-card px-6 py-12 text-center">
          <p className="text-[16px] font-black tracking-[-0.02em] text-foreground">
            No cards yet
          </p>
          <p className="text-[14px] text-[#8A7B63]">
            Build your first stack card — it takes about a minute.
          </p>
          <Button
            variant="brand"
            size="sm"
            onClick={handleNewCard}
            disabled={busy}
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
            New card
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {stacks.map((stack) => (
            <div
              key={stack.id}
              className="flex flex-col gap-4 rounded-[18px] border-[1.5px] border-foreground bg-card p-4 shadow-[0_4px_0_var(--foreground)] sm:flex-row sm:items-center sm:p-5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/card/${stack.id}`}
                alt={`Card for ${stack.name}`}
                loading="lazy"
                width={240}
                height={126}
                className="w-full shrink-0 rounded-lg border border-border sm:w-[240px]"
              />

              <div className="min-w-0 flex-1">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A7B63]">
                  {THEME_LABELS[stack.cardTheme ?? "minimal"] ?? "Minimal"}
                </span>
                <p className="mt-0.5 truncate text-[18px] font-black tracking-[-0.02em] text-foreground">
                  {stack.name}
                </p>
                {stack.subtitle && (
                  <p className="truncate text-[13.5px] text-[#8A7B63]">
                    {stack.subtitle}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link href={`/stack/${stack.id}`}>
                    <Button variant="outline" size="sm">
                      <HugeiconsIcon icon={PaintBoardIcon} className="size-3.5" />
                      Open in builder
                    </Button>
                  </Link>
                  <Link href={`/s/${stack.id}`}>
                    <Button variant="ghost" size="sm">
                      <HugeiconsIcon icon={Share01Icon} className="size-3.5" />
                      Share page
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() =>
                      setPendingDelete({ id: stack.id, name: stack.name })
                    }
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:flex-col sm:items-end">
                <Switch
                  id={`visibility-${stack.id}`}
                  checked={stack.isPublic}
                  onCheckedChange={(checked) => handleToggle(stack.id, checked)}
                />
                <Label
                  htmlFor={`visibility-${stack.id}`}
                  className={`font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${
                    stack.isPublic ? "text-primary" : "text-[#8A7B63]"
                  }`}
                >
                  {stack.isPublic ? "Public" : "Hidden"}
                </Label>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this card?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `"${pendingDelete.name}" and everything on it will be permanently removed. This can't be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete card
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
