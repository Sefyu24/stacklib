import { NextRequest, NextResponse } from "next/server";
import { parseManifests } from "@/lib/import/parsers";
import { matchPackages, enrichSuggestions } from "@/lib/import/match";

export const runtime = "nodejs";

const MAX_MANIFEST_BYTES = 512 * 1024;

/**
 * Zero-auth import: the client sends a pasted/dropped manifest (web-dev v1:
 * package.json) and gets back reviewed-before-pinned tool suggestions.
 * Deterministic allowlist matching — no AI involved.
 */
export async function POST(request: NextRequest) {
  let body: { fileName?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fileName = (body.fileName || "package.json").trim();
  const content = body.content ?? "";
  if (!content.trim()) {
    return NextResponse.json(
      { error: "Paste a package.json first" },
      { status: 400 }
    );
  }
  if (content.length > MAX_MANIFEST_BYTES) {
    return NextResponse.json(
      { error: "That file is too large to be a manifest" },
      { status: 413 }
    );
  }

  const refs = parseManifests([{ name: fileName, content }]);
  if (refs.length === 0) {
    return NextResponse.json(
      {
        error:
          "Couldn't read any dependencies. Is that a valid package.json?",
      },
      { status: 422 }
    );
  }

  const tools = await enrichSuggestions(matchPackages(refs));
  return NextResponse.json({ tools, scanned: refs.length });
}
