import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  // 1 — Fetch brand details
  const bfRes = await fetch(
    "https://api.brandfetch.io/v2/brands/supabase.com",
    {
      headers: {
        Authorization: `Bearer ${process.env.BRANDFETCH_API_KEY}`,
      },
      cache: "no-store",
    }
  );

  const brand = await bfRes.json();

  // 2 — Choose SVG format
  const svgFormat = brand.logos[0]?.formats.find(
    (f: any) => f.format === "svg"
  );

  if (!svgFormat) {
    throw new Error("No SVG found");
  }

  // 3 — Fetch raw SVG markup
  const svgText = await fetch(svgFormat.src).then((r) => r.text());

  // 4 — Convert to Base64
  const svgBase64 = Buffer.from(svgText).toString("base64");

  const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

  // 5 — Render OG image
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "white",
          color: "black",
          padding: "40px",
        }}
      >
        <img
          src={dataUrl}
          width={200}
          height={200}
          style={{ objectFit: "contain" }}
        />

        <div style={{ fontSize: 60, fontWeight: "bold", marginTop: 40 }}>
          Supabase
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
