// Curated tool catalog, ported from the Superstacks Builder design. Powers the
// universal search: a query matches across all categories, and each hit knows
// which section it belongs to. `slug` is a legacy icon slug kept on the shape;
// logos resolve through lib/logo.ts (Brandfetch-only), and tools with no
// durable logo render the warm letter-tile fallback.

export type CatalogCategory = "frontend" | "backend" | "ide" | "ai" | "other";

export interface CatalogTool {
  name: string;
  slug: string;
  domain: string;
  category: CatalogCategory;
}

// Each entry is [name, simpleIconsSlug, brandfetchDomain]. The domain is the
// tool's canonical primary domain, used to resolve the correct Brandfetch
// brand page (and therefore the right logo).
const RAW: Record<CatalogCategory, [string, string, string][]> = {
  frontend: [
    ["React", "react", "react.dev"],
    ["Next.js", "nextdotjs", "nextjs.org"],
    ["Vue.js", "vuedotjs", "vuejs.org"],
    ["Svelte", "svelte", "svelte.dev"],
    ["Angular", "angular", "angular.dev"],
    ["Astro", "astro", "astro.build"],
    ["Remix", "remix", "remix.run"],
    ["SolidJS", "solid", "solidjs.com"],
    ["Nuxt", "nuxt", "nuxt.com"],
    ["Tailwind CSS", "tailwindcss", "tailwindcss.com"],
    ["shadcn/ui", "shadcnui", "ui.shadcn.com"],
    ["Vite", "vite", "vitejs.dev"],
  ],
  backend: [
    ["Node.js", "nodedotjs", "nodejs.org"],
    ["Convex", "convex", "convex.dev"],
    ["Supabase", "supabase", "supabase.com"],
    ["Firebase", "firebase", "firebase.google.com"],
    ["PostgreSQL", "postgresql", "postgresql.org"],
    ["Express", "express", "expressjs.com"],
    ["Django", "django", "djangoproject.com"],
    ["Redis", "redis", "redis.io"],
    ["Go", "go", "go.dev"],
    ["Bun", "bun", "bun.sh"],
    ["Prisma", "prisma", "prisma.io"],
  ],
  ide: [
    // vscode.dev is the domain Brandfetch keys the VS Code brand to
    // (code.visualstudio.com has no entry and the root resolves to the
    // purple Visual Studio brand instead).
    ["VS Code", "vscode", "vscode.dev"],
    ["Cursor", "cursor", "cursor.com"],
    ["Neovim", "neovim", "neovim.io"],
    ["Zed", "zedindustries", "zed.dev"],
    ["WebStorm", "webstorm", "jetbrains.com"],
    ["Vim", "vim", "vim.org"],
    ["Xcode", "xcode", "developer.apple.com"],
  ],
  ai: [
    ["Claude", "claude", "claude.ai"],
    ["ChatGPT", "openai", "openai.com"],
    ["GitHub Copilot", "githubcopilot", "github.com"],
    ["v0", "v0", "v0.dev"],
    ["Ollama", "ollama", "ollama.com"],
    ["Perplexity", "perplexity", "perplexity.ai"],
    ["Midjourney", "midjourney", "midjourney.com"],
  ],
  other: [
    ["GitHub", "github", "github.com"],
    ["Vercel", "vercel", "vercel.com"],
    ["Docker", "docker", "docker.com"],
    ["Figma", "figma", "figma.com"],
    ["Stripe", "stripe", "stripe.com"],
    ["Linear", "linear", "linear.app"],
    ["Notion", "notion", "notion.so"],
    ["Railway", "railway", "railway.app"],
  ],
};

export const CATEGORY_LABELS: Record<CatalogCategory, string> = {
  frontend: "Frontend",
  backend: "Backend",
  ide: "IDE",
  ai: "AI",
  other: "Other",
};

export const CATEGORY_ORDER: CatalogCategory[] = [
  "frontend",
  "backend",
  "ide",
  "ai",
  "other",
];

export const CATALOG: CatalogTool[] = CATEGORY_ORDER.flatMap((category) =>
  RAW[category].map(([name, slug, domain]) => ({ name, slug, domain, category }))
);

export const SUGGESTIONS: Record<CatalogCategory, string[]> = {
  frontend: ["React", "Next.js", "Tailwind CSS"],
  backend: ["Convex", "Supabase", "Node.js"],
  ide: ["Cursor", "VS Code", "Zed"],
  ai: ["Claude", "ChatGPT", "GitHub Copilot"],
  other: ["Vercel", "GitHub", "Figma"],
};

export function findCatalogTool(name: string): CatalogTool | undefined {
  const n = name.trim().toLowerCase();
  return CATALOG.find((t) => t.name.toLowerCase() === n);
}

export function searchCatalog(query: string, limit = 8): CatalogTool[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return CATALOG.filter((t) => t.name.toLowerCase().includes(q)).slice(0, limit);
}
