"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Logomark, Wordmark } from "./brand/logo";

// Primary nav destinations. Inline from `sm` up; collapsed into a menu sheet
// on mobile so the bar never overflows or clips the avatar.
const NAV_LINKS = [
  { href: "/browse", label: "Browse", auth: false },
  { href: "/stack", label: "My stack", auth: false },
  { href: "/dashboard", label: "Dashboard", auth: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
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
    // truth shared with anything that pins itself under this sticky header.
    <header className="sticky top-0 z-40 h-[var(--navbar-h)] border-b border-border bg-background">
      <div className="mx-auto flex h-full max-w-[1240px] items-center justify-between gap-2 px-4 sm:px-9">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Logomark size={26} />
          <Wordmark size={19} className="hidden min-[380px]:inline" />
        </Link>

        {/* Desktop / tablet: inline links */}
        <nav className="hidden items-center gap-2 sm:flex">
          <SignedIn>
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-9 px-4 ${linkClass(href)}`}
                >
                  {label}
                </Button>
              </Link>
            ))}
            <UserButton />
          </SignedIn>
          <SignedOut>
            {NAV_LINKS.filter((l) => !l.auth).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-9 px-4 ${linkClass(href)}`}
                >
                  {label}
                </Button>
              </Link>
            ))}
            <Link href="/login">
              <Button variant="ghost" size="sm" className="h-9 px-4">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="brand" size="sm" className="h-9 px-4">
                Sign up
              </Button>
            </Link>
          </SignedOut>
        </nav>

        {/* Mobile: avatar (if signed in) + a menu sheet */}
        <div className="flex items-center gap-2 sm:hidden">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-full"
                aria-label="Open menu"
              >
                <HugeiconsIcon icon={Menu01Icon} className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] max-w-[300px] bg-background p-0">
              <SheetTitle className="flex items-center gap-2.5 border-b border-border px-5 py-4">
                <Logomark size={24} />
                <Wordmark size={18} />
              </SheetTitle>
              <nav className="flex flex-col gap-1 p-3">
                <SignedIn>
                  {NAV_LINKS.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={isActive(href) ? "page" : undefined}
                      className={`rounded-lg px-3 py-2.5 text-[15px] ${
                        isActive(href)
                          ? "bg-secondary font-bold text-foreground"
                          : "font-medium text-[#6B5D46] hover:bg-secondary"
                      }`}
                    >
                      {label}
                    </Link>
                  ))}
                </SignedIn>
                <SignedOut>
                  {NAV_LINKS.filter((l) => !l.auth).map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-[#6B5D46] hover:bg-secondary"
                    >
                      {label}
                    </Link>
                  ))}
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    <Button variant="outline" className="mt-2 w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMenuOpen(false)}>
                    <Button variant="brand" className="w-full">
                      Sign up
                    </Button>
                  </Link>
                </SignedOut>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
