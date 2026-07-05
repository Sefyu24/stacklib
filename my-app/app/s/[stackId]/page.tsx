import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import StackView from "@/components/share/stackView";

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
  const title = stack ? `${stack.name} — Superstack` : "Superstack";
  const description = "A tech stack built and shared with Superstack.";
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
              Start on Superstack
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
