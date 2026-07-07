import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Playground from "@/components/landing/playground";
import HeroCards from "@/components/landing/heroCards";
import { Logomark, Wordmark } from "@/components/brand/logo";

// Design-exact inline glyphs (server-safe; the design ships these SVG paths)
function DragDots() {
  return (
    <svg width="9" height="13" viewBox="0 0 10 16" fill="#C9BCA2" aria-hidden>
      <circle cx="3" cy="3" r="1.4" />
      <circle cx="7" cy="3" r="1.4" />
      <circle cx="3" cy="8" r="1.4" />
      <circle cx="7" cy="8" r="1.4" />
      <circle cx="3" cy="13" r="1.4" />
      <circle cx="7" cy="13" r="1.4" />
    </svg>
  );
}

const PIN_PATH =
  "M16 3a1 1 0 0 1 .95.68l.54 1.62 2.21 2.21 1.62.54a1 1 0 0 1 .39 1.66l-4.24 4.24-.7 4.25a1 1 0 0 1-1.7.54L12 15.7l-4.95 4.95a1 1 0 0 1-1.41-1.41L10.59 14.3 6.5 10.24a1 1 0 0 1 .54-1.7l4.25-.7L15.53 3.6A1 1 0 0 1 16 3Z";

const si = (slug: string) => `https://cdn.simpleicons.org/${slug}`;

function Icon({ slug, size }: { slug: string; size: number }) {
  return (
    <span
      className="inline-block bg-contain bg-center bg-no-repeat"
      style={{ width: size, height: size, backgroundImage: `url('${si(slug)}')` }}
      aria-hidden
    />
  );
}

function MiniChip({ slug, label }: { slug: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-[5px] rounded-md border border-[#F0DCC2] bg-[#FFF8F0] px-2 py-[3px] text-[10.5px] font-semibold">
      <Icon slug={slug} size={12} />
      {label}
    </span>
  );
}

function CommunityChip({ slug, label }: { slug: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-[5px] rounded-md border border-[#EDE4D2] bg-[#F9F4EA] px-[9px] py-1 text-[11px] font-semibold">
      <Icon slug={slug} size={12} />
      {label}
    </span>
  );
}

function TrafficLights() {
  return (
    <>
      <span className="size-2 rounded-full bg-[#E5533C]" />
      <span className="size-2 rounded-full bg-[#E5A93C]" />
      <span className="size-2 rounded-full bg-[#5BA35B]" />
    </>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ===== NAV (floating pill) ===== */}
      <header className="fixed left-1/2 top-6 z-50 flex w-[min(92%,720px)] -translate-x-1/2 items-center justify-between gap-4 rounded-full border border-[#E4DAC6] bg-[#FFFDF8]/70 py-2.5 pl-[22px] pr-3 shadow-[0_8px_24px_rgba(60,40,10,0.08)] backdrop-blur-xl">
        <Link href="/" className="flex flex-none items-center gap-[9px]">
          <Logomark size={24} />
          <Wordmark size={18} />
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          <a
            href="#playground"
            className="rounded-full px-3 py-[7px] text-[13px] font-semibold text-[#6B5D46] hover:bg-secondary hover:text-foreground"
          >
            Try it
          </a>
          <Link
            href="/browse"
            className="rounded-full px-3 py-[7px] text-[13px] font-semibold text-[#6B5D46] hover:bg-secondary hover:text-foreground"
          >
            Browse stacks
          </Link>
          <a
            href="#tools"
            className="rounded-full px-3 py-[7px] text-[13px] font-semibold text-[#6B5D46] hover:bg-secondary hover:text-foreground"
          >
            Tools
          </a>
        </nav>
        <div className="flex flex-none items-center gap-2">
          <SignedOut>
            <Link
              href="/login"
              className="rounded-full border border-input bg-card px-4 py-2 text-[13px] font-semibold hover:bg-secondary"
            >
              Login
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <Link
            href="/stack"
            className="rounded-full border border-primary bg-primary px-4 py-2 text-[13px] font-bold text-primary-foreground hover:bg-[var(--primary-hover)]"
          >
            Create your card
          </Link>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-12 px-6 pb-24 pt-[130px] sm:px-10 sm:pt-[150px] lg:grid-cols-2">
        <div className="flex flex-col items-start gap-[26px]">
          <span className="rounded-full border border-[#F2CFA6] bg-accent px-3.5 py-1.5 font-mono text-[11px] font-semibold tracking-[0.16em] text-primary">
            SHOW OFF YOUR STACK
          </span>
          <h1 className="text-balance text-[44px] font-black leading-[1.02] tracking-[-0.03em] sm:text-6xl">
            Your tech stack, ready to share.
          </h1>
          <p className="max-w-[44ch] text-pretty text-[17px] leading-relaxed text-[#6B5D46]">
            Turn the tools you use into a beautiful card. Import from GitHub,
            customize it, and post it anywhere — X, LinkedIn, your README.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/stack"
              className="rounded-xl border border-primary bg-primary px-[26px] py-3.5 text-[15px] font-extrabold text-primary-foreground shadow-[0_3px_0_var(--primary-shadow)] hover:bg-[var(--primary-hover)]"
            >
              Create your card — it&apos;s free
            </Link>
            <a
              href="#playground"
              className="rounded-xl border border-input bg-card px-[22px] py-3.5 text-[15px] font-bold hover:bg-secondary"
            >
              Try it below ↓
            </a>
          </div>
          <span className="font-mono text-[11.5px] text-[#B4A78E]">
            superstacks.dev/<span className="text-primary">you</span>
          </span>
        </div>

        <HeroCards />
      </section>

      {/* ===== PLAYGROUND ===== */}
      <section
        id="playground"
        className="border-t border-border bg-card px-6 py-[88px] sm:px-10"
      >
        <div className="mx-auto max-w-[1080px]">
          <div className="mb-11 flex flex-col items-center gap-3 text-center">
            <span className="font-mono text-[11px] font-semibold tracking-[0.2em] text-primary">
              TRY IT — NO SIGNUP
            </span>
            <h2 className="text-[30px] font-black tracking-[-0.025em] sm:text-[38px]">
              Build one right now.
            </h2>
            <p className="max-w-[52ch] text-pretty text-[15.5px] leading-relaxed text-[#6B5D46]">
              Search a tool, tap to add it, watch your card come together. We
              file every tool into the right section automatically.
            </p>
          </div>
          <Playground />
        </div>
      </section>

      {/* ===== COMMUNITY ===== */}
      <section
        id="community"
        className="border-t border-border px-6 py-[88px] sm:px-10"
      >
        <div className="mx-auto max-w-[1080px]">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-3">
              <span className="font-mono text-[11px] font-semibold tracking-[0.2em] text-primary">
                COMMUNITY
              </span>
              <h2 className="text-[30px] font-black tracking-[-0.025em] sm:text-[38px]">
                Steal ideas from other builders.
              </h2>
              <p className="max-w-[52ch] text-pretty text-[15.5px] leading-relaxed text-[#6B5D46]">
                Browse public stacks from indie hackers, teams, and students.
                See what they ship with — then remix it into your own card.
              </p>
            </div>
            <Link
              href="/browse"
              className="flex-none rounded-[11px] border border-input bg-card px-[22px] py-3 text-sm font-bold hover:bg-secondary"
            >
              Browse all stacks →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                initial: "M",
                bg: "bg-primary",
                handle: "maker.mia",
                meta: "indie SaaS · 9 tools",
                chips: [
                  ["nextdotjs", "Next.js"],
                  ["supabase", "Supabase"],
                  ["stripe", "Stripe"],
                ],
                more: "+6",
                quote:
                  "“Boring stack, fast shipping. Everything talks to everything.”",
              },
              {
                initial: "D",
                bg: "bg-foreground",
                handle: "dev.theo",
                meta: "full-stack · 11 tools",
                chips: [
                  ["svelte", "Svelte"],
                  ["go", "Go"],
                  ["postgresql", "Postgres"],
                ],
                more: "+8",
                quote: "“Zero JS frameworks on the backend. Go + Postgres forever.”",
              },
              {
                initial: "K",
                bg: "bg-[#5BA35B]",
                handle: "kai.learns",
                meta: "student · 7 tools",
                chips: [
                  ["react", "React"],
                  ["firebase", "Firebase"],
                  ["claude", "Claude"],
                ],
                more: "+4",
                quote:
                  "“First stack card for my portfolio — recruiters actually clicked it.”",
              },
            ].map((card) => (
              <div
                key={card.handle}
                className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-[22px] transition-colors hover:border-primary"
              >
                <div className="flex items-center gap-[11px]">
                  <span
                    className={`flex size-9 items-center justify-center rounded-[10px] text-[15px] font-black text-primary-foreground ${card.bg}`}
                  >
                    {card.initial}
                  </span>
                  <span className="flex flex-col gap-px">
                    <span className="text-[14.5px] font-extrabold">
                      {card.handle}
                    </span>
                    <span className="font-mono text-[10px] text-[#B4A78E]">
                      {card.meta}
                    </span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {card.chips.map(([slug, label]) => (
                    <CommunityChip key={slug} slug={slug} label={label} />
                  ))}
                  <span className="font-mono text-[10px] text-[#B4A78E]">
                    {card.more}
                  </span>
                </div>
                <span className="text-[12.5px] leading-relaxed text-[#8A7B63]">
                  {card.quote}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TOOLS LOGO WALL ===== */}
      <section
        id="tools"
        className="border-t border-border bg-card px-6 py-[88px] text-center sm:px-10"
      >
        <div className="mx-auto flex max-w-[920px] flex-col items-center gap-3.5">
          <span className="font-mono text-[11px] font-semibold tracking-[0.2em] text-primary">
            2,000+ TOOLS
          </span>
          <h2 className="text-[30px] font-black tracking-[-0.025em] sm:text-[38px]">
            Works with your favorite tools.
          </h2>
          <p className="max-w-[50ch] text-pretty text-[15.5px] leading-relaxed text-[#6B5D46]">
            Every logo, auto-fetched. If we don&apos;t have it, add it as a
            custom tool in one keystroke.
          </p>
          <div className="my-8 flex max-w-[820px] flex-wrap justify-center gap-7 sm:gap-9">
            {[
              "react",
              "nextdotjs",
              "vuedotjs",
              "svelte",
              "tailwindcss",
              "nodedotjs",
              "supabase",
              "firebase",
              "postgresql",
              "docker",
              "github",
              "vercel",
              "figma",
              "stripe",
              "openai",
              "claude",
              "linear",
              "notion",
            ].map((slug) => (
              <Icon key={slug} slug={slug} size={40} />
            ))}
          </div>
          <Link
            href="/stack"
            className="rounded-[11px] border border-foreground bg-foreground px-6 py-[13px] text-sm font-bold text-background hover:bg-foreground/85"
          >
            Create your stack →
          </Link>
        </div>
      </section>

      {/* ===== STEPS ===== */}
      <section className="border-t border-border px-6 py-[88px] sm:px-10">
        <div className="mx-auto max-w-[1000px]">
          <div className="mb-14 flex flex-col items-center gap-3 text-center">
            <span className="font-mono text-[11px] font-semibold tracking-[0.2em] text-primary">
              HOW IT WORKS
            </span>
            <h2 className="text-[30px] font-black tracking-[-0.025em] sm:text-[38px]">
              Three steps. That&apos;s the whole app.
            </h2>
          </div>

          <div className="flex flex-col">
            {/* step 1 */}
            <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-7 py-[26px] lg:grid-cols-[56px_minmax(0,1fr)_380px]">
              <div className="flex flex-col items-center self-stretch">
                <span className="flex size-10 flex-none items-center justify-center rounded-full border-[1.5px] border-foreground bg-card text-base font-black">
                  1
                </span>
                <span className="w-[1.5px] flex-1 bg-[#E0D5BE]" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[22px] font-extrabold tracking-[-0.015em]">
                  Add your tools — or link a GitHub repo
                </h3>
                <p className="text-pretty text-[14.5px] leading-relaxed text-[#6B5D46]">
                  Search and add tools by hand, or paste a repo and we detect
                  your stack from the code.
                </p>
              </div>
              <div className="col-span-2 overflow-hidden rounded-[14px] border-[1.5px] border-foreground bg-[#16110B] shadow-[0_3px_0_var(--foreground)] lg:col-span-1">
                <div className="flex items-center gap-1.5 border-b border-[#2C2418] px-[13px] py-[9px]">
                  <TrafficLights />
                </div>
                <div className="px-4 py-3.5 font-mono text-[11px] leading-[2]">
                  <div className="text-[#C9BCA2]">
                    <span className="text-[#5BA35B]">$</span> superstacks import{" "}
                    <span className="text-[#F0E6D2]">github.com/you/app</span>
                  </div>
                  <div className="text-[#8A7B63]">scanning package.json…</div>
                  <div className="text-[#5BA35B]">✓ 12 tools detected</div>
                </div>
              </div>
            </div>
            {/* step 2 */}
            <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-7 py-[26px] lg:grid-cols-[56px_minmax(0,1fr)_380px]">
              <div className="flex flex-col items-center self-stretch">
                <span className="w-[1.5px] flex-1 bg-[#E0D5BE]" />
                <span className="flex size-10 flex-none items-center justify-center rounded-full border-[1.5px] border-foreground bg-card text-base font-black">
                  2
                </span>
                <span className="w-[1.5px] flex-1 bg-[#E0D5BE]" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[22px] font-extrabold tracking-[-0.015em]">
                  Customize it
                </h3>
                <p className="text-pretty text-[14.5px] leading-relaxed text-[#6B5D46]">
                  Pin favorites, drag to reorder, pick a card style — minimal,
                  bento, or terminal.
                </p>
              </div>
              <div className="col-span-2 flex flex-col gap-[7px] lg:col-span-1">
                <div className="flex items-center gap-2.5 rounded-[10px] border border-[#F2CFA6] bg-[#FEF3E7] px-[13px] py-[9px]">
                  <DragDots />
                  <Icon slug="react" size={18} />
                  <span className="text-[13px] font-semibold">React</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="#EC5B13"
                    className="ml-auto"
                    aria-hidden
                  >
                    <path d={PIN_PATH} />
                  </svg>
                </div>
                <div className="flex items-center gap-2.5 rounded-[10px] border border-border bg-card px-[13px] py-[9px]">
                  <DragDots />
                  <Icon slug="convex" size={18} />
                  <span className="text-[13px] font-semibold">Convex</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C9BCA2"
                    strokeWidth="1.8"
                    className="ml-auto"
                    aria-hidden
                  >
                    <path d={PIN_PATH} />
                  </svg>
                </div>
                <div className="mt-[3px] flex justify-end gap-[5px]">
                  <span className="rounded-[7px] bg-foreground px-2.5 py-1 font-mono text-[10px] text-background">
                    minimal
                  </span>
                  <span className="rounded-[7px] border border-[#E0D5BE] px-2.5 py-1 font-mono text-[10px] text-[#8A7B63]">
                    bento
                  </span>
                  <span className="rounded-[7px] border border-[#E0D5BE] px-2.5 py-1 font-mono text-[10px] text-[#8A7B63]">
                    terminal
                  </span>
                </div>
              </div>
            </div>
            {/* step 3 */}
            <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-7 py-[26px] lg:grid-cols-[56px_minmax(0,1fr)_380px]">
              <div className="flex flex-col items-center self-stretch">
                <span className="w-[1.5px] flex-1 bg-[#E0D5BE]" />
                <span className="flex size-10 flex-none items-center justify-center rounded-full border-[1.5px] border-primary bg-primary text-base font-black text-primary-foreground">
                  3
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[22px] font-extrabold tracking-[-0.015em]">
                  Just share it
                </h3>
                <p className="text-pretty text-[14.5px] leading-relaxed text-[#6B5D46]">
                  One link. It unfurls as your card on X, LinkedIn, Discord —
                  anywhere links go.
                </p>
              </div>
              <div className="col-span-2 flex flex-col items-center gap-2.5 lg:col-span-1">
                <div className="flex items-center gap-[9px] rounded-full border-[1.5px] border-foreground bg-card px-4 py-[11px] shadow-[0_3px_0_var(--foreground)]">
                  <span className="font-mono text-xs font-semibold">
                    superstacks.dev/you
                  </span>
                  <span className="font-mono text-[9.5px] font-bold text-[#5BA35B]">
                    ✓ copied
                  </span>
                </div>
                <span className="text-[11.5px] text-[#B4A78E]">
                  unfurls as a full-res card, everywhere
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER CTA (split card) ===== */}
      <section className="border-t border-border px-6 pb-[100px] pt-[88px] sm:px-10">
        <div className="mx-auto grid max-w-[1080px] grid-cols-1 items-stretch overflow-hidden rounded-[22px] border-[1.5px] border-foreground bg-card shadow-[0_6px_0_var(--foreground)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="flex flex-col justify-center gap-5 p-8 sm:py-14 sm:pl-[52px] sm:pr-6">
            <h2 className="text-balance text-[32px] font-black leading-[1.05] tracking-[-0.03em] sm:text-[40px]">
              Your stack deserves a better screenshot.
            </h2>
            <p className="max-w-[38ch] text-pretty text-[15px] leading-relaxed text-[#6B5D46]">
              Build it once, share it everywhere. Your card stays in sync as
              your stack evolves.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/stack"
                className="rounded-xl border border-primary bg-primary px-[26px] py-3.5 text-[15px] font-extrabold text-primary-foreground shadow-[0_3px_0_var(--primary-shadow)] hover:bg-[var(--primary-hover)]"
              >
                Create your card
              </Link>
              <a
                href="#playground"
                className="rounded-xl border border-input bg-card px-[22px] py-3.5 text-[15px] font-bold hover:bg-secondary"
              >
                Try the playground
              </a>
            </div>
            <span className="font-mono text-[11px] text-[#B4A78E]">
              free · no signup needed to try
            </span>
          </div>
          <div className="relative min-h-[380px] overflow-hidden border-t-[1.5px] border-foreground bg-[#F3E8D6] lg:border-l-[1.5px] lg:border-t-0">
            <div
              className="absolute -left-[46px] -bottom-[30px] h-[200px] w-[200px] rotate-[8deg] opacity-85"
              style={{
                background:
                  "repeating-linear-gradient(45deg,#EC5B13 0 10px,transparent 10px 22px)",
              }}
            />
            <div className="absolute -right-10 -top-10 size-40 rounded-full border-[1.5px] border-dashed border-[#D9A16B]" />
            <div className="absolute left-1/2 top-1/2 w-[330px] -translate-x-1/2 -translate-y-1/2 rotate-[-3deg] rounded-[18px] border-[1.5px] border-foreground bg-[#FBF7F0] p-[9px] shadow-[0_6px_0_var(--foreground),0_22px_44px_rgba(60,40,10,0.2)]">
              <div className="rounded-[11px] border border-[#EDE4D2] bg-card px-5 pb-3 pt-[18px]">
                <div className="flex items-baseline justify-end">
                  <span className="font-mono text-[9px] text-[#B4A78E]">
                    7 tools · 5 pinned
                  </span>
                </div>
                <div className="mb-3 mt-[7px] text-xl font-black tracking-[-0.02em]">
                  My Tech Stack
                </div>
                <div className="flex flex-col gap-[9px]">
                  <div>
                    <div className="mb-1 font-mono text-[7.5px] font-bold tracking-[0.2em] text-[#B4A78E]">
                      FRONTEND
                    </div>
                    <div className="flex flex-wrap gap-[5px]">
                      <MiniChip slug="react" label="React" />
                      <MiniChip slug="tailwindcss" label="Tailwind" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 font-mono text-[7.5px] font-bold tracking-[0.2em] text-[#B4A78E]">
                      BACKEND
                    </div>
                    <div className="flex flex-wrap gap-[5px]">
                      <MiniChip slug="convex" label="Convex" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 font-mono text-[7.5px] font-bold tracking-[0.2em] text-[#B4A78E]">
                      AI
                    </div>
                    <div className="flex flex-wrap gap-[5px]">
                      <MiniChip slug="claude" label="Claude" />
                      <MiniChip slug="githubcopilot" label="Copilot" />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[#EDE4D2] pt-[9px]">
                  <span className="font-mono text-[8.5px] text-[#B4A78E]">
                    superstacks.dev/you
                  </span>
                  <Logomark size={13} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="flex flex-wrap items-center justify-between gap-4 bg-foreground px-6 py-[26px] text-[#B4A78E] sm:px-10">
        <div className="flex items-center gap-[9px]">
          <Logomark size={20} />
          <Wordmark size={16} color="#F0E6D2" />
        </div>
        <div className="flex gap-[22px] text-[12.5px]">
          <a href="#playground" className="hover:text-[#F0E6D2]">
            Try it
          </a>
          <a href="#community" className="hover:text-[#F0E6D2]">
            Browse stacks
          </a>
          <a href="#tools" className="hover:text-[#F0E6D2]">
            Tools
          </a>
        </div>
        <span className="font-mono text-[10.5px]">© 2026 superstacks</span>
      </footer>
    </main>
  );
}
