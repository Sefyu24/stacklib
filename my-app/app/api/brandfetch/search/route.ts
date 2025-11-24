import { NextRequest, NextResponse } from "next/server";

export interface BrandfetchBrand {
  icon: string | null;
  name: string | null;
  domain: string;
  claimed: boolean;
  brandId: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name");

  if (!name || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Name parameter is required" },
      { status: 400 }
    );
  }

  const clientId = process.env.BRANDFETCH_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "BRANDFETCH_CLIENT_ID is not configured" },
      { status: 500 }
    );
  }

  try {
    const url = `https://api.brandfetch.io/v2/search/${encodeURIComponent(
      name.trim()
    )}?c=${clientId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Brandfetch API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch brands", details: errorText },
        { status: response.status }
      );
    }

    const data: BrandfetchBrand[] = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching from Brandfetch:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch brands",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

