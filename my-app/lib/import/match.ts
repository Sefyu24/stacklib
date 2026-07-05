// Deterministic package → tool matching. Zero AI: dependency names are
// looked up in the curated allowlist; anything unrecognized is ignored
// (utility libraries aren't "tools", and the user reviews every suggestion
// anyway). Server-only because enrichment may call the Brandfetch search API.

import {
  NPM_TOOL_MAP,
  PYTHON_TOOL_MAP,
  FILE_TOOL_MAP,
  DetectedTool,
} from "@/lib/github/tool-map";
import { findCatalogTool } from "@/lib/catalog";
import type { PackageRef, Suggestion } from "./types";

const MAP_BY_ECOSYSTEM: Record<string, Record<string, DetectedTool>> = {
  npm: NPM_TOOL_MAP,
  python: PYTHON_TOOL_MAP,
};

/** Match package refs + root file names against the allowlist. Pure. */
export function matchPackages(
  refs: PackageRef[],
  rootFileNames: string[] = []
): Suggestion[] {
  const detected: Suggestion[] = [];

  for (const ref of refs) {
    const tool = MAP_BY_ECOSYSTEM[ref.ecosystem]?.[ref.name];
    if (tool) detected.push(tool);
  }
  for (const file of rootFileNames) {
    const tool = FILE_TOOL_MAP[file.toLowerCase()];
    if (tool) detected.push(tool);
  }

  // Dedup by tool name
  const seen = new Set<string>();
  return detected.filter((t) => {
    if (seen.has(t.name)) return false;
    seen.add(t.name);
    return true;
  });
}

/**
 * Attach icons. Catalog slug first (free Simple Icons), Brandfetch search
 * only for the remainder — exact-domain matches only.
 */
export async function enrichSuggestions(
  tools: Suggestion[]
): Promise<Suggestion[]> {
  return Promise.all(
    tools.map(async (tool) => {
      const catalogHit = findCatalogTool(tool.name);
      if (catalogHit) return { ...tool, iconSlug: catalogHit.slug };
      const logoUrl = await brandfetchIcon(tool);
      return logoUrl ? { ...tool, logoUrl } : tool;
    })
  );
}

async function brandfetchIcon(tool: Suggestion): Promise<string | null> {
  const clientId = process.env.BRANDFETCH_CLIENT_ID;
  if (!clientId) return null;
  try {
    const res = await fetch(
      `https://api.brandfetch.io/v2/search/${encodeURIComponent(tool.name)}?c=${clientId}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    const brands = (await res.json()) as Array<{
      domain?: string;
      icon?: string | null;
    }>;
    return brands.find((b) => b.domain === tool.domain && b.icon)?.icon ?? null;
  } catch {
    return null;
  }
}
