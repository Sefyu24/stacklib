import { permanentRedirect } from "next/navigation";

// Profiles now live at the bare superstacks.dev/<handle> (what the cards
// print). Keep /u/<handle> working for older links by redirecting.
export default async function LegacyProfileRedirect({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  permanentRedirect(`/${encodeURIComponent(handle)}`);
}
