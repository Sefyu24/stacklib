"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Layers01Icon,
  PaintBoardIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { Logomark, Wordmark } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import ProfileSection from "@/components/dashboard/profileSection";
import MyCardsSection from "@/components/dashboard/myCardsSection";

type DashboardSection = "profile" | "cards";

const NAV_ITEMS: {
  id: DashboardSection;
  label: string;
  icon: typeof UserIcon;
}[] = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "cards", label: "My cards", icon: Layers01Icon },
];

export default function DashboardShell() {
  const [section, setSection] = useState<DashboardSection>("profile");

  return (
    <SidebarProvider className="min-h-[calc(100svh-70px)]">
      {/* Desktop sidebar — plain (non-floating) so it sits below the navbar */}
      <Sidebar
        collapsible="none"
        className="sticky top-[69px] hidden h-[calc(100svh-69px)] self-start border-r border-border md:flex"
      >
        <SidebarHeader className="px-4 pb-2 pt-5">
          <Link href="/" className="flex items-center gap-2">
            <Logomark size={22} />
            <Wordmark size={16} />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A7B63]">
              Dashboard
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={section === item.id}
                      onClick={() => setSection(item.id)}
                      className="font-semibold data-[active=true]:font-bold"
                    >
                      <HugeiconsIcon icon={item.icon} className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="px-2 pb-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="font-semibold">
                <Link href="/stack">
                  <HugeiconsIcon icon={PaintBoardIcon} className="size-4" />
                  <span>Open builder</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background">
        {/* Mobile section switcher */}
        <div className="flex gap-2 border-b border-border px-4 py-3 md:hidden">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`flex items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                section === item.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground"
              }`}
            >
              <HugeiconsIcon icon={item.icon} className="size-3.5" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="mx-auto w-full max-w-[860px] px-4 py-8 sm:px-8 sm:py-10">
          {section === "profile" ? <ProfileSection /> : <MyCardsSection />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
