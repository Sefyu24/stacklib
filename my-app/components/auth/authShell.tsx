import Link from "next/link";
import { Logomark, Wordmark } from "@/components/brand/logo";

/**
 * Branded shell around the Clerk auth cards (login/signup): warm cream page,
 * logo lockup, font-black headline, one muted subtitle, and a single faint
 * logomark watermark clipped into the corner — the page's one flourish.
 */
export function AuthShell({
  headline,
  subtitle,
  footer,
  children,
}: {
  headline: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-[calc(100svh-var(--navbar-h))] flex-col items-center justify-center overflow-hidden bg-background px-6 py-14 text-foreground sm:py-16">
      {/* Faint oversized logomark drifting off the corner (watermark variant). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-16 select-none opacity-[0.06] sm:-bottom-32 sm:-right-10"
      >
        <Logomark size={420} />
      </div>

      <div className="relative flex w-full max-w-[420px] flex-col items-center gap-9">
        <div className="flex flex-col items-center gap-6 text-center">
          <Link href="/" className="flex items-center gap-2.5">
            <Logomark size={28} />
            <Wordmark size={20} />
          </Link>
          <div className="flex flex-col items-center gap-2.5">
            <h1 className="text-balance text-[30px] font-black leading-[1.05] tracking-[-0.025em] sm:text-[34px]">
              {headline}
            </h1>
            <p className="max-w-[38ch] text-pretty text-[15px] leading-relaxed text-[#8A7B63]">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex w-full justify-center">{children}</div>

        <span className="text-center font-mono text-[11px] text-[#B4A78E]">
          {footer}
        </span>
      </div>
    </main>
  );
}
