"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import GithubCard from "@/components/dashboard/githubCard";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link01Icon } from "@hugeicons/core-free-icons";

/** Pull the human-readable message out of a Convex server error. */
export function convexErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    const match = err.message.match(/Uncaught Error: (.*?)(?:\n| at )/);
    if (match) return match[1].trim();
  }
  return fallback;
}

export default function ProfileSection() {
  const { user, isLoaded } = useUser();
  const ownerId = user?.id;
  const { isAuthenticated } = useConvexAuth();

  const profile = useQuery(
    api.profiles.getMyProfile,
    ownerId && isAuthenticated ? { ownerId } : "skip"
  );
  const upsertProfile = useMutation(api.profiles.upsertProfile);

  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [tagline, setTagline] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  // Seed the form once the profile loads (and re-seed if it changes server-side).
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setHandle(profile.handle);
      setTagline(profile.tagline ?? "");
      setBio(profile.bio ?? "");
    } else if (profile === null && user) {
      // No profile yet — prefill sensible defaults from Clerk.
      setDisplayName((prev) => prev || user.fullName || "");
      setHandle(
        (prev) =>
          prev ||
          (user.username ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "")
      );
    }
  }, [profile, user]);

  async function handleSave() {
    if (!ownerId) return;
    setSaving(true);
    try {
      await upsertProfile({
        ownerId,
        handle,
        displayName,
        tagline,
        bio,
      });
      toast.success("Profile saved");
    } catch (err) {
      toast.error(
        convexErrorMessage(err, "Couldn't save your profile. Please try again.")
      );
    } finally {
      setSaving(false);
    }
  }

  if (!isLoaded || (ownerId && profile === undefined)) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          Dashboard
        </p>
        <h1 className="mt-1 text-[28px] font-black tracking-[-0.02em] text-foreground sm:text-[34px]">
          Your profile
        </h1>
        <p className="mt-1 text-[15px] text-[#8A7B63]">
          This is how you show up on your public Superstacks page.
        </p>
      </div>

      <div className="rounded-[18px] border-[1.5px] border-foreground bg-card p-5 shadow-[0_4px_0_var(--foreground)] sm:p-7">
        <div className="mb-6 flex items-center gap-4">
          <Avatar className="size-16 border-[1.5px] border-foreground">
            <AvatarImage src={user?.imageUrl} alt={displayName || "Avatar"} />
            <AvatarFallback className="bg-secondary font-black text-foreground">
              {(displayName || user?.fullName || "?").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-black tracking-[-0.02em] text-foreground">
              {displayName || user?.fullName || "Unnamed"}
            </p>
            <p className="text-[13px] text-[#8A7B63]">
              Avatar comes from your account picture.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-display-name">Display name</Label>
            <Input
              id="profile-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ada Lovelace"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-handle">Handle</Label>
            <Input
              id="profile-handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              placeholder="ada"
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#B4A78E]">
              @{handle || "your-handle"} · 3–20 chars, a–z 0–9 -
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Label htmlFor="profile-tagline">Tagline</Label>
          <Input
            id="profile-tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="A short one-liner about what you build"
          />
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Label htmlFor="profile-bio">Bio</Label>
          <Textarea
            id="profile-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people a little more about you and your stack."
            rows={4}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="brand"
            onClick={handleSave}
            disabled={saving || !displayName.trim() || !handle.trim()}
          >
            {saving ? "Saving…" : "Save profile"}
          </Button>

          {profile && (
            <Link
              href={`/${profile.handle}`}
              className="flex items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-primary hover:underline"
            >
              <HugeiconsIcon icon={Link01Icon} className="size-3.5" />
              /{profile.handle}
            </Link>
          )}
        </div>
      </div>

      <GithubCard />
    </div>
  );
}
