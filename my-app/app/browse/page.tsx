import type { Metadata } from "next";
import Link from "next/link";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Browse stacks — Superstack",
  description:
    "Discover public tech stacks from indie hackers, teams, and students. See what they ship with.",
};

// The feed changes as people publish; keep it fresh but cacheable.
export const revalidate = 60;

async function getFeed() {
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  try {
    return await convex.query(api.discover.listPublicStacks, { limit: 36 });
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
              Public cards from the community — see what people ship with,
              then remix it into your own.
            </p>
          </div>
          <Link href="/stack">
            <Button variant="brand">Build your stack</Button>
          </Link>
        </div>

        {stacks.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl border-[1.5px] border-dashed border-[#E0D5BE] px-6 py-10">
            <p className="text-[15px] text-[#8A7B63]">
              No public stacks yet — yours could be the first one here.
            </p>
            <p className="text-[13.5px] text-[#B4A78E]">
              Build a card, then flip it to public from your dashboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stacks.map((stack) => (
              <div
                key={stack.id}
                className="group flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-3.5 transition-colors hover:border-primary"
              >
                <Link href={`/s/${stack.id}`} className="block overflow-hidden rounded-xl border border-[#EDE4D2]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/card/${stack.id}`}
                    alt={`${stack.name} card`}
                    width={600}
                    height={315}
                    loading="lazy"
                    className="aspect-[1200/630] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </Link>
                <div className="flex items-baseline justify-between gap-3 px-1 pb-1">
                  <div className="min-w-0">
                    <Link
                      href={`/s/${stack.id}`}
                      className="block truncate text-[15px] font-extrabold text-foreground hover:text-primary"
                    >
                      {stack.name}
                    </Link>
                    {stack.subtitle && (
                      <p className="truncate text-[12.5px] text-[#8A7B63]">
                        {stack.subtitle}
                      </p>
                    )}
                  </div>
                  {stack.handle ? (
                    <Link
                      href={`/u/${stack.handle}`}
                      className="flex-none font-mono text-[11px] text-[#B4A78E] hover:text-primary"
                    >
                      @{stack.handle}
                    </Link>
                  ) : stack.authorName ? (
                    <span className="flex-none font-mono text-[11px] text-[#B4A78E]">
                      {stack.authorName}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
