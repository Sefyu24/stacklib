import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-2 px-4 py-4 sm:px-9">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex size-[26px] items-center justify-center rounded-lg bg-primary text-[15px] font-black text-primary-foreground">
            S
          </span>
          <span className="font-mono text-[12px] font-bold tracking-[0.18em] text-foreground sm:text-[13px] sm:tracking-[0.22em]">
            SUPERSTACK
          </span>
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
