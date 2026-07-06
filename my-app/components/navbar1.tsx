"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Logomark, Wordmark } from "./brand/logo";

// Primary nav destinations. Rendered as small ghost buttons on mobile and
// regular ones from `sm` up, with the active route bolded in ink.
const NAV_LINKS = [
  { href: "/browse", label: "Browse" },
  { href: "/stack", label: "My stack" },
];

export default function Navbar() {
  const pathname = usePathname();
  // The landing page renders its own floating pill nav.
  if (pathname === "/") return null;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  // Matches the landing pill's tone: muted warm brown for idle links,
  // bold ink for the page you're on.
  const linkClass = (href: string) =>
    isActive(href) ? "font-bold text-foreground" : "font-medium text-[#6B5D46]";

  return (
    // Height comes from --navbar-h (app/globals.css) — the single source of
    // truth shared with anything that pins itself under this sticky header
    // (e.g. the dashboard sidebar). Don't reintroduce hardcoded px offsets.
    <header className="sticky top-0 z-40 h-[var(--navbar-h)] border-b border-border bg-background">
      <div className="mx-auto flex h-full max-w-[1240px] items-center justify-between gap-2 px-4 sm:px-9">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Logomark size={26} />
          {/* Hidden on the narrowest screens so Browse / My stack fit. */}
          <Wordmark size={19} className="hidden min-[420px]:inline" />
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-2">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
            >
              <Button
                variant="ghost"
                size="sm"
                className={`px-2.5 sm:h-9 sm:px-4 ${linkClass(href)}`}
              >
                {label}
              </Button>
            </Link>
          ))}
          <SignedIn>
            <Link
              href="/dashboard"
              aria-current={isActive("/dashboard") ? "page" : undefined}
            >
              <Button
                variant="ghost"
                size="sm"
                className={`px-2.5 sm:h-9 sm:px-4 ${linkClass("/dashboard")}`}
              >
                Dashboard
              </Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="px-2.5 sm:h-9 sm:px-4">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="brand" size="sm" className="sm:h-9 sm:px-4">
                Sign up
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
