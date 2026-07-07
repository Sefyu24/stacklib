import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ConvexHttpClient } from "convex/browser";
import { HugeiconsIcon } from "@hugeicons/react";
import { GithubIcon, LinkSquare02Icon } from "@hugeicons/core-free-icons";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import StackView from "@/components/share/stackView";

// A github.com link gets the GitHub mark; anything else gets a generic link
// glyph and a "Project link" label.
function isGithubUrl(url: string): boolean {
  try {
    return new URL(url).hostname.replace(/^www\./, "") === "github.com";
  } catch {
    return false;
  }
}

// Show the host as the link's visible text (github.com/owner/repo → the path),
// falling back to the raw string if it isn't a parseable URL.
function repoLinkLabel(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "");
    return `${u.hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return url;
  }
}

const getStack = cache(async (stackId: string) => {
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  try {
    return await convex.query(api.stacks.getStack, {
      stackId: stackId as Id<"stacks">,
    });
  } catch {
    return null;
  }
});

function siteUrl() {
  return process.env.SITE_URL ?? "http://localhost:3000";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stackId: string }>;
}): Promise<Metadata> {
  const { stackId } = await params;
  const stack = await getStack(stackId);
  const title = stack ? `${stack.name} — Superstacks` : "Superstacks";
  const description = "A tech stack built and shared with Superstacks.";
  const cardUrl = `${siteUrl()}/api/card/${stackId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: cardUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [cardUrl],
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ stackId: string }>;
}) {
  const { stackId } = await params;
  const stack = await getStack(stackId);
  if (!stack) notFound();

  const description = stack.description?.trim();
  const repoUrl = stack.projectURL?.trim();
  const repoIsGithub = repoUrl ? isGithubUrl(repoUrl) : false;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-[#ed6809]">
            Shared stack
          </p>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-balance">
            {stack.name}
          </h1>
        </div>

        {/* The actual social card, as it appears when the link unfurls */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/card/${stackId}`}
          alt={`Social card for ${stack.name}`}
          className="w-full rounded-xl border shadow-md"
          width={1200}
          height={630}
        />

        {/* The "visit on the web" details the card image never shows:
            a longer description and the project repo link. */}
        {(description || repoUrl) && (
          <div className="flex flex-col gap-4">
            {description && (
              <p className="max-w-[65ch] whitespace-pre-line text-[16px] leading-relaxed text-[#4A4136]">
                {description}
              </p>
            )}
            {repoUrl && (
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-[10px] border-[1.5px] border-input bg-card px-3.5 py-2 text-[13.5px] font-bold text-foreground shadow-[0_2px_0_var(--border)] transition-[transform,box-shadow] duration-[120ms] ease-out hover:bg-secondary active:translate-y-[1px] active:shadow-[0_1px_0_var(--border)]"
              >
                <HugeiconsIcon
                  icon={repoIsGithub ? GithubIcon : LinkSquare02Icon}
                  className="size-[18px] text-[#8A7B63]"
                />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A7B63]">
                  {repoIsGithub ? "Repo" : "Project"}
                </span>
                <span className="truncate text-primary">
                  {repoLinkLabel(repoUrl)}
                </span>
              </a>
            )}
          </div>
        )}

        <StackView sections={stack.sections} />

        <div className="flex flex-col items-center gap-3 rounded-xl bg-[#f9f6ef] p-8 text-center">
          <p className="text-lg font-semibold text-[#1a1a1a]">
            Build your own stack card
          </p>
          <p className="text-sm text-[#8a7d70]">
            Takes about a minute — logos included.
          </p>
          <Link href="/stack">
            <Button className="bg-[#ed6809] text-white hover:bg-[#d55e08]">
              Start on Superstacks
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
