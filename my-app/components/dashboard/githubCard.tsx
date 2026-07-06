"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  GithubIcon,
} from "@hugeicons/core-free-icons";
import { convexErrorMessage } from "@/components/dashboard/profileSection";

/**
 * Lets a user who signed in with email/Google attach their GitHub account
 * (via Clerk external accounts) and save the username onto their profile.
 */
export default function GithubCard() {
  const { user } = useUser();
  const ownerId = user?.id;

  const profile = useQuery(
    api.profiles.getMyProfile,
    ownerId ? { ownerId } : "skip"
  );
  const upsertProfile = useMutation(api.profiles.upsertProfile);

  const [linking, setLinking] = useState(false);
  const [saving, setSaving] = useState(false);

  const githubAccount = user?.externalAccounts.find(
    (account) => account.provider === "github"
  );
  const githubUsername = githubAccount?.username ?? null;
  const savedToProfile =
    !!profile?.githubUsername &&
    !!githubUsername &&
    profile.githubUsername === githubUsername;

  async function handleLink() {
    if (!user) return;
    setLinking(true);
    try {
      const externalAccount = await user.createExternalAccount({
        strategy: "oauth_github",
        redirectUrl: window.location.href,
      });
      const url =
        externalAccount.verification?.externalVerificationRedirectURL;
      if (!url) {
        throw new Error("Missing verification redirect URL");
      }
      window.location.href = url.toString();
    } catch {
      setLinking(false);
      toast.error(
        "Couldn't start the GitHub connection. It may need to be enabled in the Clerk dashboard (SSO connections → GitHub)."
      );
    }
  }

  async function handleSaveToProfile() {
    if (!ownerId || !profile || !githubUsername) return;
    setSaving(true);
    try {
      await upsertProfile({
        ownerId,
        handle: profile.handle,
        displayName: profile.displayName,
        githubUsername,
      });
      toast.success(`GitHub @${githubUsername} saved to your profile`);
    } catch (err) {
      toast.error(
        convexErrorMessage(err, "Couldn't save GitHub to your profile.")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[18px] border-[1.5px] border-foreground bg-card p-5 shadow-[0_4px_0_var(--foreground)] sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-foreground bg-secondary">
            <HugeiconsIcon icon={GithubIcon} className="size-5 text-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[16px] font-black tracking-[-0.02em] text-foreground">
              GitHub
            </p>
            {githubUsername ? (
              <p className="flex items-center gap-1.5 text-[13px] text-[#8A7B63]">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="size-3.5 text-primary"
                />
                Connected as{" "}
                <span className="font-mono text-[12px] font-semibold text-foreground">
                  @{githubUsername}
                </span>
              </p>
            ) : (
              <p className="text-[13px] text-[#8A7B63]">
                Attach GitHub to show it on your public profile.
              </p>
            )}
          </div>
        </div>

        {githubUsername ? (
          savedToProfile ? (
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A7B63]">
              On profile
            </span>
          ) : (
            <Button
              variant="brand"
              size="sm"
              onClick={handleSaveToProfile}
              disabled={saving || !profile}
            >
              {saving ? "Saving…" : "Save to profile"}
            </Button>
          )
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLink}
            disabled={linking}
          >
            {linking ? "Opening GitHub…" : "Link GitHub"}
          </Button>
        )}
      </div>

      {githubUsername && !profile && (
        <p className="mt-3 text-[13px] text-[#8A7B63]">
          Save your profile above first, then you can add GitHub to it.
        </p>
      )}
    </div>
  );
}
