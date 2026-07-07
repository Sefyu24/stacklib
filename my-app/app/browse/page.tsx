import type { Metadata } from "next";
import Link from "next/link";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import BrowseFeed from "@/components/browse/browseFeed";
import type { StackPileStack } from "@/components/browse/stackPile";

export const metadata: Metadata = {
  title: "Browse stacks · Superstacks",
  description:
    "Discover public tech stacks from indie hackers, teams, and students. See what they ship with.",
};

// The feed changes as people publish; keep it fresh but cacheable.
export const revalidate = 60;

async function getFeed(): Promise<StackPileStack[]> {
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  try {
    const stacks = await convex.query(api.discover.listPublicStacks, {
      limit: 36,
    });
    // The deployed query can lag this code (functions are pushed
    // separately) — default the pile fields so the page never crashes on
    // the old shape.
    return stacks.map((stack) => ({
      ...stack,
      toolCount: stack.toolCount ?? 0,
      sections: stack.sections ?? [],
    }));
  } catch {
    return [];
  }
}

export default async function BrowsePage() {
  const stacks = await getFeed();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-9">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1.5 font-mono text-[10.5px] font-bold tracking-[0.2em] text-[#8A7B63]">
              DISCOVER
            </div>
            <h1 className="text-[32px] font-black tracking-[-0.02em]">
              Browse stacks
            </h1>
            <p className="mt-1 max-w-[52ch] text-[15px] leading-relaxed text-[#8A7B63]">
              Public cards from the community. See what people ship with,
              then remix it into your own.
            </p>
          </div>
          <Link href="/stack">
            <Button variant="brand">Build your stack</Button>
          </Link>
        </div>

        {/* Filter + grid live in a client component so filtering is live. */}
        <BrowseFeed initialStacks={stacks} />
      </div>
    </main>
  );
}
