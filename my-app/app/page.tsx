import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="bg-background">
      <section className="mx-auto flex min-h-[calc(100vh-65px)] max-w-3xl flex-col items-center justify-center gap-6 px-6 py-20 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary text-3xl font-black text-primary-foreground shadow-[0_3px_0_var(--primary-shadow)]">
          S
        </span>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
          superstack.app
        </p>
        <h1 className="text-balance text-5xl font-black tracking-tight text-foreground sm:text-6xl">
          Your tech stack, one beautiful card
        </h1>
        <p className="max-w-xl text-pretty text-lg text-muted-foreground">
          Search once — we file each tool in the right section. Pin your
          favorites, pick a card style, and share a link that unfurls into a
          clean image everywhere you post it.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/stack">
            <Button size="lg" variant="brand">
              Build my stack
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="outline">
              Create an account
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          No account needed to start — sign in with Google or GitHub when you
          want to keep your stack.
        </p>
      </section>
    </main>
  );
}
