import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { findCatalogTool } from "../lib/catalog";

/**
 * Brandfetch logo capture. Search-result icon URLs expire (tokenized),
 * so we download the PNG immediately while the token is fresh and store
 * the bytes in Convex file storage — a permanent URL we own.
 *
 * Query precision matters: name search is fuzzy (e.g. "drizzle" returns a
 * cooking blog first), so we try, in order: the curated catalog domain,
 * the tool's stored domain, its registrable root domain, and only then
 * the name — and a name query must match the hit's brand name exactly.
 */

type SearchHit = {
  brandId?: string;
  name?: string | null;
  domain?: string | null;
  icon?: string | null;
};

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]/g, "");

function rootDomain(domain: string): string {
  const parts = domain.split(".").filter(Boolean);
  return parts.length <= 2 ? domain : parts.slice(-2).join(".");
}

async function searchBrandfetch(query: string): Promise<SearchHit[]> {
  const clientId = process.env.BRANDFETCH_CLIENT_ID;
  if (!clientId) throw new Error("BRANDFETCH_CLIENT_ID is not set on the deployment");
  const res = await fetch(
    `https://api.brandfetch.io/v2/search/${encodeURIComponent(query)}?c=${clientId}`
  );
  if (!res.ok) return [];
  const hits = (await res.json()) as SearchHit[];
  return Array.isArray(hits) ? hits : [];
}

function pickHit(
  hits: SearchHit[],
  query: string,
  toolName: string
): SearchHit | null {
  const isDomainQuery = query.includes(".");
  if (isDomainQuery) {
    return (
      hits.find((h) => h.domain === query) ??
      hits.find((h) => h.domain && rootDomain(h.domain) === rootDomain(query)) ??
      hits[0] ??
      null
    );
  }
  // Name queries are fuzzy — only trust an exact brand-name match.
  return hits.find((h) => h.name && normalize(h.name) === normalize(toolName)) ?? null;
}

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

async function downloadPng(iconUrl: string): Promise<ArrayBuffer | null> {
  const pngUrl = iconUrl.replace(/\.webp(\?|$)/, ".png$1");
  try {
    const res = await fetch(pngUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const head = new Uint8Array(buf.slice(0, 4));
    if (!PNG_MAGIC.every((b, i) => head[i] === b)) return null;
    return buf;
  } catch {
    return null;
  }
}

async function resolveAndStore(
  ctx: { storage: { store(blob: Blob): Promise<string>; getUrl(id: string): Promise<string | null> } },
  tool: { name: string; url: string }
): Promise<{ logoUrl: string; domain?: string } | null> {
  const candidates: string[] = [];
  const catalogDomain = findCatalogTool(tool.name)?.domain;
  if (catalogDomain) candidates.push(catalogDomain);
  if (tool.url) {
    candidates.push(tool.url);
    const root = rootDomain(tool.url);
    if (root !== tool.url) candidates.push(root);
  }
  candidates.push(tool.name);

  const seen = new Set<string>();
  for (const query of candidates) {
    const q = query.trim().toLowerCase();
    if (!q || seen.has(q)) continue;
    seen.add(q);

    const hits = await searchBrandfetch(q);
    const hit = pickHit(hits, q, tool.name);
    if (!hit?.icon) continue;

    const png = await downloadPng(hit.icon);
    if (!png) continue;

    const storageId = await ctx.storage.store(
      new Blob([png], { type: "image/png" })
    );
    const url = await ctx.storage.getUrl(storageId);
    if (!url) continue;
    return { logoUrl: url, domain: hit.domain ?? undefined };
  }
  return null;
}

/** Capture a durable logo for one tool (scheduled from getOrCreateTool). */
export const enrichToolLogo = internalAction({
  args: { toolId: v.id("tools") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tool = await ctx.runQuery(internal.tools.getToolInternal, {
      toolId: args.toolId,
    });
    if (!tool) return null;
    if (tool.logoUrl && !tool.logoUrl.includes("cdn.brandfetch.io")) {
      return null; // already durable
    }

    const resolved = await resolveAndStore(ctx, tool);
    if (resolved) {
      await ctx.runMutation(internal.tools.patchToolLogo, {
        toolId: args.toolId,
        logoUrl: resolved.logoUrl,
        url: resolved.domain,
      });
    }
    return null;
  },
});

/**
 * One-shot backfill over the whole tools table: re-captures every missing
 * or expired (tokenized cdn.brandfetch.io) logo into Convex storage.
 * Run with: npx convex run logoActions:backfillToolLogos
 */
export const backfillToolLogos = internalAction({
  args: {},
  returns: v.object({ enriched: v.number(), skipped: v.number(), misses: v.array(v.string()) }),
  handler: async (ctx) => {
    const tools = await ctx.runQuery(internal.tools.listToolsInternal, {});
    let enriched = 0;
    let skipped = 0;
    const misses: string[] = [];
    for (const tool of tools) {
      if (tool.logoUrl && !tool.logoUrl.includes("cdn.brandfetch.io")) {
        skipped++;
        continue;
      }
      const resolved = await resolveAndStore(ctx, tool);
      if (resolved) {
        await ctx.runMutation(internal.tools.patchToolLogo, {
          toolId: tool._id,
          logoUrl: resolved.logoUrl,
          url: resolved.domain,
        });
        enriched++;
      } else {
        misses.push(tool.name);
      }
      // Be polite to the search API.
      await new Promise((r) => setTimeout(r, 150));
    }
    return { enriched, skipped, misses };
  },
});
