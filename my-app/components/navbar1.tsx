"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Logomark, Wordmark } from "./brand/logo";

export default function Navbar() {
  const pathname = usePathname();
  // The landing page renders its own floating pill nav.
  if (pathname === "/") return null;
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-2 px-4 py-4 sm:px-9">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Logomark size={26} />
          <Wordmark size={19} />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/stack" className="hidden sm:block">
            <Button variant="ghost">My stack</Button>
          </Link>
          <SignedOut>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="sm:h-9 sm:px-4">
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
