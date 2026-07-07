"use client";

import { use } from "react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import StackBuilder from "@/components/builder/stackBuilder";
import StackNotFoundBoundary from "@/components/builder/stackNotFoundBoundary";

/**
 * Builder for a specific card. Ownership is enforced server-side: getStack
 * throws for a missing or non-owned stack, which the error boundary catches
 * and renders as a friendly "card not found" state.
 */
export default function StackByIdPage({
  params,
}: {
  params: Promise<{ stackId: string }>;
}) {
  const { stackId } = use(params);

  return (
    <StackNotFoundBoundary fallback={<CardNotFound />}>
      <StackBuilder stackId={stackId as Id<"stacks">} />
    </StackNotFoundBoundary>
  );
}

function CardNotFound() {
  return (
    <main className="bg-background">
      <div className="mx-auto flex min-h-[60vh] max-w-[560px] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          Card not found
        </p>
        <h1 className="text-[26px] font-black tracking-[-0.02em] text-foreground sm:text-[32px]">
          We couldn&apos;t open this card.
        </h1>
        <p className="text-[15px] leading-relaxed text-[#6B5D46]">
          It may have been deleted, or it belongs to someone else. Head back to
          your builder to keep going.
        </p>
        <Link href="/stack">
          <Button variant="brand">Back to my builder</Button>
        </Link>
      </div>
    </main>
  );
}
