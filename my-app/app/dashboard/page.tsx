import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/dashboardShell";

export const metadata: Metadata = {
  title: "Dashboard — Superstack",
  description: "Manage your Superstack profile and stack cards.",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  return <DashboardShell />;
}
