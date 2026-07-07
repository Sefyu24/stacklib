"use client";

import { useState, useEffect } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import StackBuilder from "@/components/builder/stackBuilder";

const GUEST_KEY = "superstack_guest_id";

/**
 * The default builder entry point (no id in the URL). Bootstraps the
 * signed-in user's default stack (or the guest's single card) via
 * getOrCreateStack — existing users land straight on their current card —
 * then renders the shared builder for it. Specific cards live at
 * /stack/[stackId].
 */
export default function StackPage() {
  const { user, isLoaded } = useUser();
  // Convex authenticates its socket after Clerk loads; acting as the
  // signed-in user before the handshake would fail the ownership checks.
  const { isAuthenticated } = useConvexAuth();
  const [stackId, setStackId] = useState<Id<"stacks"> | null>(null);

  const getOrCreateStack = useMutation(api.stacks.getOrCreateStack);
  const adoptGuestStack = useMutation(api.stacks.adoptGuestStack);

  useEffect(() => {
    if (!isLoaded) return;
    if (user && !isAuthenticated) return;
    let cancelled = false;
    (async () => {
      let ownerId: string;
      if (user) {
        const guestId = localStorage.getItem(GUEST_KEY);
        if (guestId) {
          await adoptGuestStack({ guestId, userId: user.id });
          localStorage.removeItem(GUEST_KEY);
        }
        ownerId = user.id;
      } else {
        let guestId = localStorage.getItem(GUEST_KEY);
        if (!guestId) {
          guestId = `guest_${crypto.randomUUID()}`;
          localStorage.setItem(GUEST_KEY, guestId);
        }
        ownerId = guestId;
      }
      const id = await getOrCreateStack({ ownerId });
      if (!cancelled) setStackId(id);
    })().catch((err) => console.error("Error loading stack:", err));
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isAuthenticated, user?.id, adoptGuestStack, getOrCreateStack, user]);

  if (!stackId) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading your stack…</p>
        </div>
      </div>
    );
  }

  return <StackBuilder stackId={stackId} />;
}
