"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
  ArrowDown01Icon,
  PlusSignIcon,
  Tick02Icon,
  Delete02Icon,
  Layers01Icon,
} from "@hugeicons/core-free-icons";
import { convexErrorMessage } from "@/components/dashboard/profileSection";

interface CardSwitcherProps {
  /** The stack currently open in the builder. */
  currentStackId: Id<"stacks">;
  /** The current stack's name (from getStack) — the trigger label. */
  currentName: string;
}

/**
 * Signed-in card switcher for the builder header. Lists the user's cards
 * (getMyStacks), lets them jump between /stack/<id>, spin up a fresh card,
 * or delete the open one (with an AlertDialog confirm). Only rendered for
 * signed-in users — guests own a single card, so the parent hides this.
 */
export default function CardSwitcher({
  currentStackId,
  currentName,
}: CardSwitcherProps) {
  const router = useRouter();
  const { user } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const ownerId = user?.id;

  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const stacks = useQuery(
    api.profiles.getMyStacks,
    ownerId && isAuthenticated ? { ownerId } : "skip"
  );

  const createStack = useMutation(api.stacks.createStack);
  const deleteStack = useMutation(api.stacks.deleteStack);

  async function handleNewCard() {
    if (!ownerId || busy) return;
    setBusy(true);
    try {
      const newId = await createStack({ name: "New card", userId: ownerId });
      setOpen(false);
      router.push(`/stack/${newId}`);
    } catch (err) {
      toast.error(
        convexErrorMessage(err, "Couldn't create a card. Please try again.")
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (busy) return;
    setBusy(true);
    try {
      await deleteStack({ stackId: currentStackId });
      toast.success("Card deleted");
      setConfirmDelete(false);
      setOpen(false);
      router.push("/stack");
    } catch (err) {
      toast.error(
        convexErrorMessage(err, "Couldn't delete this card. Please try again.")
      );
    } finally {
      setBusy(false);
    }
  }

  const list = stacks ?? [];

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            aria-label="Switch card"
            className="max-w-[220px] gap-2"
          >
            <HugeiconsIcon
              icon={Layers01Icon}
              className="size-3.5 flex-none text-[#8A7B63]"
            />
            <span className="truncate font-bold">{currentName}</span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              className="size-3.5 flex-none text-[#8A7B63]"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[260px] p-0">
          <Command>
            <CommandList>
              <CommandEmpty>No cards yet.</CommandEmpty>
              <CommandGroup
                heading="Your cards"
                className="[&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[9.5px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-[#B4A78E]"
              >
                {list.map((s) => {
                  const isCurrent = s.id === currentStackId;
                  return (
                    <CommandItem
                      key={s.id}
                      value={`${s.name}-${s.id}`}
                      onSelect={() => {
                        setOpen(false);
                        if (!isCurrent) router.push(`/stack/${s.id}`);
                      }}
                      className="gap-2.5 rounded-lg py-2"
                    >
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        className={`size-4 flex-none ${
                          isCurrent ? "text-primary" : "text-transparent"
                        }`}
                      />
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-foreground">
                        {s.name}
                      </span>
                      {s.isPublic && (
                        <span className="ml-auto font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-primary">
                          Public
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  value="new-card"
                  disabled={busy}
                  onSelect={handleNewCard}
                  className="gap-2.5 rounded-lg py-2"
                >
                  <HugeiconsIcon
                    icon={PlusSignIcon}
                    className="size-4 flex-none text-primary"
                  />
                  <span className="text-[13.5px] font-semibold text-foreground">
                    New card
                  </span>
                </CommandItem>
                <CommandItem
                  value="delete-card"
                  disabled={busy}
                  onSelect={() => {
                    setOpen(false);
                    setConfirmDelete(true);
                  }}
                  className="gap-2.5 rounded-lg py-2 text-destructive data-[selected=true]:text-destructive"
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    className="size-4 flex-none"
                  />
                  <span className="text-[13.5px] font-semibold">
                    Delete this card
                  </span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this card?</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${currentName}" and everything on it will be permanently removed. This can't be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                // Keep the dialog mounted while the mutation runs; we close
                // it ourselves on success and navigate away.
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
    </>
  );
}
