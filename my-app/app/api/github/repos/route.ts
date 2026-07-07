import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const runtime = "nodejs";

/**
 * List the signed-in user's GitHub repos using the OAuth token Clerk holds
 * from "Sign in with GitHub". No separate OAuth app needed — this lights up
 * once the GitHub connection (with repo read scope) is enabled in Clerk.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  let token: string | undefined;
  try {
    const client = await clerkClient();
    const tokens = await client.users.getUserOauthAccessToken(
      userId,
      "oauth_github"
    );
    token = tokens.data?.[0]?.token;
  } catch {
    token = undefined;
  }
  if (!token) {
    return NextResponse.json({ error: "github_not_connected" }, { status: 409 });
  }

  const res = await fetch(
    "https://api.github.com/user/repos?sort=pushed&per_page=30",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "superstacks-app",
      },
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!res.ok) {
    return NextResponse.json({ error: "github_error" }, { status: 502 });
  }

  const repos = (await res.json()) as Array<{
    full_name: string;
    name: string;
    private: boolean;
    pushed_at: string;
  }>;

  return NextResponse.json({
    repos: repos.map((r) => ({
      fullName: r.full_name,
      name: r.name,
      private: r.private,
      pushedAt: r.pushed_at,
    })),
  });
}
