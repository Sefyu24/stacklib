// Curated tool catalog, ported from the Superstack Builder design. Powers the
// universal search: a query matches across all categories, and each hit knows
// which section it belongs to. `slug` is a Simple Icons slug used for the logo
// (https://cdn.simpleicons.org/<slug>); custom tools fall back to Brandfetch.

export type CatalogCategory = "frontend" | "backend" | "ide" | "ai" | "other";

export interface CatalogTool {
  name: string;
  slug: string;
  category: CatalogCategory;
}

const RAW: Record<CatalogCategory, [string, string][]> = {
  frontend: [
    ["React", "react"],
    ["Next.js", "nextdotjs"],
    ["Vue.js", "vuedotjs"],
    ["Svelte", "svelte"],
    ["Angular", "angular"],
    ["Astro", "astro"],
    ["Remix", "remix"],
    ["SolidJS", "solid"],
    ["Nuxt", "nuxt"],
    ["Tailwind CSS", "tailwindcss"],
    ["shadcn/ui", "shadcnui"],
    ["Vite", "vite"],
  ],
  backend: [
    ["Node.js", "nodedotjs"],
    ["Convex", "convex"],
    ["Supabase", "supabase"],
    ["Firebase", "firebase"],
    ["PostgreSQL", "postgresql"],
    ["Express", "express"],
    ["Django", "django"],
    ["Redis", "redis"],
    ["Go", "go"],
    ["Bun", "bun"],
    ["Prisma", "prisma"],
  ],
  ide: [
    ["VS Code", "vscode"],
    ["Cursor", "cursor"],
    ["Neovim", "neovim"],
    ["Zed", "zedindustries"],
    ["WebStorm", "webstorm"],
    ["Vim", "vim"],
    ["Xcode", "xcode"],
  ],
  ai: [
    ["Claude", "claude"],
    ["ChatGPT", "openai"],
    ["GitHub Copilot", "githubcopilot"],
    ["v0", "v0"],
    ["Ollama", "ollama"],
    ["Perplexity", "perplexity"],
    ["Midjourney", "midjourney"],
  ],
  other: [
    ["GitHub", "github"],
    ["Vercel", "vercel"],
    ["Docker", "docker"],
    ["Figma", "figma"],
    ["Stripe", "stripe"],
    ["Linear", "linear"],
    ["Notion", "notion"],
    ["Railway", "railway"],
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
  RAW[category].map(([name, slug]) => ({ name, slug, category }))
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
