import { NextRequest, NextResponse } from "next/server";
import {
  NPM_TOOL_MAP,
  PYTHON_TOOL_MAP,
  LANGUAGE_TOOL_MAP,
  FILE_TOOL_MAP,
  DetectedTool,
} from "@/lib/github/tool-map";

export const runtime = "nodejs";

const GITHUB_API = "https://api.github.com";

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "superstack-app",
  };
  // Optional: raises the rate limit from 60 to 5000 req/h
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

/** Accepts "owner/repo" or any github.com/owner/repo URL form. */
function parseRepoParam(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(
    /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#]|$)/i
  );
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2] };
  const plainMatch = trimmed.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (plainMatch) return { owner: plainMatch[1], repo: plainMatch[2] };
  return null;
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: githubHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Fetch a file's text content from the repo root via the contents API. */
async function fetchFileText(
  owner: string,
  repo: string,
  filePath: string
): Promise<string | null> {
  const data = (await fetchJson(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}`
  )) as { content?: string; encoding?: string } | null;
  if (!data?.content || data.encoding !== "base64") return null;
  try {
    return Buffer.from(data.content, "base64").toString("utf8");
  } catch {
    return null;
  }
}

function detectFromPackageJson(text: string): DetectedTool[] {
  try {
    const pkg = JSON.parse(text) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = Object.keys({
      ...pkg.dependencies,
      ...pkg.devDependencies,
    });
    return deps.flatMap((dep) => NPM_TOOL_MAP[dep] ?? []);
  } catch {
    return [];
  }
}

function detectFromRequirements(text: string): DetectedTool[] {
  return text
    .split("\n")
    .map((line) => line.split(/[=<>!~\[;#\s]/)[0].trim().toLowerCase())
    .filter(Boolean)
    .flatMap((name) => PYTHON_TOOL_MAP[name] ?? []);
}

async function attachLogo(tool: DetectedTool): Promise<DetectedTool> {
  const clientId = process.env.BRANDFETCH_CLIENT_ID;
  if (!clientId) return tool;
  try {
    const res = await fetch(
      `https://api.brandfetch.io/v2/search/${encodeURIComponent(
        tool.name
      )}?c=${clientId}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return tool;
    const brands = (await res.json()) as Array<{
      domain?: string;
      icon?: string | null;
    }>;
    const match = brands.find((b) => b.domain === tool.domain && b.icon);
    return match?.icon ? { ...tool, logoUrl: match.icon } : tool;
  } catch {
    return tool;
  }
}

function detectFromPyproject(text: string): DetectedTool[] {
  // Crude but effective: look for known package names as words
  return Object.entries(PYTHON_TOOL_MAP).flatMap(([pkg, tool]) =>
    new RegExp(`["'\\s]${pkg}[\\s"'=<>~!\\[]`, "i").test(text) ? [tool] : []
  );
}

export async function GET(request: NextRequest) {
  const repoParam = request.nextUrl.searchParams.get("repo");
  if (!repoParam) {
    return NextResponse.json(
      { error: "repo parameter is required" },
      { status: 400 }
    );
  }

  const parsed = parseRepoParam(repoParam);
  if (!parsed) {
    return NextResponse.json(
      { error: "Enter a GitHub repo like owner/name or a github.com URL" },
      { status: 400 }
    );
  }
  const { owner, repo } = parsed;

  const repoInfo = (await fetchJson(`${GITHUB_API}/repos/${owner}/${repo}`)) as {
    full_name?: string;
    description?: string | null;
    language?: string | null;
    private?: boolean;
  } | null;
  if (!repoInfo?.full_name) {
    return NextResponse.json(
      {
        error:
          "Couldn't find that repository. Make sure it exists and is public.",
      },
      { status: 404 }
    );
  }

  const rootListing = (await fetchJson(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/`
  )) as Array<{ name?: string; type?: string }> | null;
  const rootFiles = new Set(
    (rootListing ?? [])
      .filter((f) => f.type === "file" && f.name)
      .map((f) => f.name!.toLowerCase())
  );

  const detected: DetectedTool[] = [];

  // 1. Primary language
  if (repoInfo.language && LANGUAGE_TOOL_MAP[repoInfo.language]) {
    detected.push(LANGUAGE_TOOL_MAP[repoInfo.language]);
  }

  // 2. File-presence signals
  for (const [file, tool] of Object.entries(FILE_TOOL_MAP)) {
    if (rootFiles.has(file)) detected.push(tool);
  }

  // 3. Manifest contents (fetched in parallel)
  const manifestJobs: Promise<DetectedTool[]>[] = [];
  if (rootFiles.has("package.json")) {
    manifestJobs.push(
      fetchFileText(owner, repo, "package.json").then((t) =>
        t ? detectFromPackageJson(t) : []
      )
    );
  }
  if (rootFiles.has("requirements.txt")) {
    manifestJobs.push(
      fetchFileText(owner, repo, "requirements.txt").then((t) =>
        t ? detectFromRequirements(t) : []
      )
    );
  }
  if (rootFiles.has("pyproject.toml")) {
    manifestJobs.push(
      fetchFileText(owner, repo, "pyproject.toml").then((t) =>
        t ? detectFromPyproject(t) : []
      )
    );
  }
  const manifestResults = await Promise.allSettled(manifestJobs);
  for (const result of manifestResults) {
    if (result.status === "fulfilled") detected.push(...result.value);
  }

  // Dedup by tool name
  const seen = new Set<string>();
  const deduped = detected.filter((tool) => {
    if (seen.has(tool.name)) return false;
    seen.add(tool.name);
    return true;
  });

  // Attach Brandfetch icons so imported tools render logos on the card.
  // Only an exact domain match is trusted; anything else keeps no logo.
  const tools = await Promise.all(deduped.map(attachLogo));

  return NextResponse.json({
    repo: {
      fullName: repoInfo.full_name,
      description: repoInfo.description ?? null,
    },
    tools,
  });
}
