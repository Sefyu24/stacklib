"use client";

// Auto-provisions a profile so superstacks.dev/<handle> works for everyone,
// with no form to hunt down. GitHub sign-ins get their username as the handle
// silently; Google/email sign-ins (no natural handle) get a one-time "claim
// your URL" dialog, prefilled from their name. Mounted once in the layout.

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { convexErrorMessage } from "@/components/dashboard/profileSection";

/** Best-effort handle base from any string (name, email local part). */
function slugify(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/@/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (s.length >= 3 ? s : "user").slice(0, 20).replace(/-+$/g, "");
}

export default function ProfileGate() {
  const { user, isLoaded } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const ownerId = user?.id;

  const profile = useQuery(
    api.profiles.getMyProfile,
    ownerId && isAuthenticated ? { ownerId } : "skip"
  );
  const ensureAuto = useMutation(api.profiles.ensureProfileAuto);
  const upsertProfile = useMutation(api.profiles.upsertProfile);

  const attempted = useRef(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [handle, setHandle] = useState("");
  const [saving, setSaving] = useState(false);

  const githubUsername =
    user?.externalAccounts.find((a) => a.provider === "github")?.username ??
    null;
  const emailLocal =
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ?? "";
  const displayName = user?.fullName || githubUsername || emailLocal || "";

  // Decide once per load: auto-create for GitHub, prompt otherwise.
  useEffect(() => {
    if (!isLoaded || !isAuthenticated || !ownerId) return;
    if (profile === undefined) return; // still loading
    if (profile !== null) return; // already has one
    if (attempted.current) return;
    attempted.current = true;

    if (githubUsername) {
      ensureAuto({
        ownerId,
        displayName: displayName || githubUsername,
        preferredHandle: githubUsername,
        githubUsername,
      }).catch(() => {
        attempted.current = false; // let it retry on a later render
      });
    } else {
      setHandle(slugify(displayName || emailLocal || "user"));
      setClaimOpen(true);
    }
  }, [
    isLoaded,
    isAuthenticated,
    ownerId,
    profile,
    githubUsername,
    displayName,
    emailLocal,
    ensureAuto,
  ]);

  // Live availability check for the claim input.
  const existing = useQuery(
    api.profiles.getProfileByHandle,
    claimOpen && handle.length >= 3 ? { handle } : "skip"
  );
  const taken = !!existing && existing.ownerId !== ownerId;
  const valid = /^[a-z0-9-]{3,20}$/.test(handle);

  const claim = async () => {
    if (!ownerId || !valid || taken) return;
    setSaving(true);
    try {
      await upsertProfile({
        ownerId,
        handle,
        displayName: displayName || handle,
        githubUsername: githubUsername ?? undefined,
      });
      toast.success(`Your page is live at superstacks.dev/${handle}`);
      setClaimOpen(false);
    } catch (err) {
      toast.error(convexErrorMessage(err, "Couldn't claim that handle."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-black tracking-[-0.02em]">
            Claim your page
          </DialogTitle>
          <DialogDescription className="text-[13.5px] leading-relaxed text-[#6B5D46]">
            Pick the URL where your stacks live. You can change it later in your
            dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="flex items-center overflow-hidden rounded-[10px] border border-input bg-white focus-within:border-primary">
            <span className="whitespace-nowrap py-2.5 pl-3 font-mono text-[13px] text-[#8A7B63]">
              superstacks.dev/
            </span>
            <Input
              value={handle}
              autoFocus
              onChange={(e) =>
                setHandle(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && valid && !taken && !saving) claim();
              }}
              placeholder="your-handle"
              className="border-0 bg-transparent px-1 font-mono text-[13px] shadow-none focus-visible:ring-0"
            />
          </div>
          <p className="min-h-[16px] font-mono text-[10.5px] uppercase tracking-[0.14em]">
            {handle.length < 3 ? (
              <span className="text-[#B4A78E]">3–20 chars · a–z 0–9 -</span>
            ) : taken ? (
              <span className="text-[#C0532B]">@{handle} is taken</span>
            ) : valid ? (
              <span className="text-[#5BA35B]">@{handle} is available</span>
            ) : (
              <span className="text-[#B4A78E]">a–z 0–9 - only</span>
            )}
          </p>
        </div>

        <Button
          variant="brand"
          className="w-full"
          onClick={claim}
          disabled={!valid || taken || saving || existing === undefined}
        >
          {saving ? "Claiming…" : "Claim my page"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
