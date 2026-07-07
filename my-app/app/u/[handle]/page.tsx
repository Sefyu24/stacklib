import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";

const getPublicProfile = cache(async (rawHandle: string) => {
  let handle = rawHandle;
  try {
    handle = decodeURIComponent(rawHandle);
  } catch {
    // keep the raw value
  }
  handle = handle.replace(/^@/, "");
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  try {
    return await convex.query(api.profiles.getPublicProfile, { handle });
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const data = await getPublicProfile(handle);
  if (!data) return { title: "Superstacks" };
  const title = `${data.profile.displayName} (@${data.profile.handle}) · Superstacks`;
  const description =
    data.profile.tagline ??
    `${data.profile.displayName}'s tech stacks on Superstacks.`;
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

const THEME_LABELS: Record<string, string> = {
  minimal: "Minimal",
  bento: "Bento",
  terminal: "Terminal",
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const data = await getPublicProfile(handle);
  if (!data) notFound();

  const { profile, stacks } = data;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <div className="flex flex-col gap-10">
        {/* ============ IDENTITY ============ */}
        <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-7">
          {profile.githubUsername ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://github.com/${profile.githubUsername}.png?size=160`}
              alt={`${profile.displayName}'s avatar`}
              width={96}
              height={96}
              className="size-24 shrink-0 rounded-full border-[1.5px] border-foreground bg-secondary object-cover shadow-[0_4px_0_var(--foreground)]"
            />
          ) : (
            <div
              aria-hidden
              className="flex size-24 shrink-0 items-center justify-center rounded-full border-[1.5px] border-foreground bg-secondary text-[36px] font-black text-foreground shadow-[0_4px_0_var(--foreground)]"
            >
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Superstacks profile
            </p>
            <h1 className="mt-1 text-[32px] font-black leading-tight tracking-[-0.02em] text-foreground sm:text-[40px]">
              {profile.displayName}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-mono text-[12.5px] font-semibold tracking-[0.04em] text-[#8A7B63]">
                @{profile.handle}
              </span>
              {profile.githubUsername && (
                <a
                  href={`https://github.com/${profile.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[12.5px] font-semibold tracking-[0.04em] text-primary hover:underline"
                >
                  github.com/{profile.githubUsername}
                </a>
              )}
            </div>
            {profile.tagline && (
              <p className="mt-2 text-[16px] text-[#8A7B63]">
                {profile.tagline}
              </p>
            )}
          </div>
        </header>

        {profile.bio && (
          <p className="max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">
            {profile.bio}
          </p>
        )}

        {/* ============ PUBLIC CARDS ============ */}
        <section>
          <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A7B63]">
            Stacks · {stacks.length}
          </p>

          {stacks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-[18px] border-[1.5px] border-dashed border-[#E0D5BE] bg-card px-6 py-12 text-center">
              <p className="text-[16px] font-black tracking-[-0.02em] text-foreground">
                Nothing public yet
              </p>
              <p className="text-[14px] text-[#8A7B63]">
                {profile.displayName} hasn&apos;t shared any stack cards.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {stacks.map((stack) => (
                <Link
                  key={stack.id}
                  href={`/s/${stack.id}`}
                  className="group flex flex-col gap-3 rounded-[18px] border-[1.5px] border-foreground bg-card p-3.5 shadow-[0_4px_0_var(--foreground)] transition-transform hover:-translate-y-0.5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/card/${stack.id}`}
                    alt={`Stack card: ${stack.name}`}
                    loading="lazy"
                    width={1200}
                    height={630}
                    className="w-full rounded-lg border border-border"
                  />
                  <div className="px-1 pb-1">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A7B63]">
                      {THEME_LABELS[stack.cardTheme ?? "minimal"] ?? "Minimal"}
                    </span>
                    <p className="mt-0.5 truncate text-[16px] font-black tracking-[-0.02em] text-foreground group-hover:text-primary">
                      {stack.name}
                    </p>
                    {stack.subtitle && (
                      <p className="truncate text-[13px] text-[#8A7B63]">
                        {stack.subtitle}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ============ CTA ============ */}
        <div className="flex flex-col items-center gap-3 rounded-[18px] border-[1.5px] border-foreground bg-card p-8 text-center shadow-[0_4px_0_var(--foreground)]">
          <p className="text-lg font-black tracking-[-0.02em] text-foreground">
            Build your own stack card
          </p>
          <p className="text-sm text-[#8A7B63]">
            Takes about a minute, logos included.
          </p>
          <Link href="/stack">
            <Button variant="brand">Start on Superstacks</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
