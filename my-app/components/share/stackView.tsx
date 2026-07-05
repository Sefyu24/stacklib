"use client";

import LogoFramework from "@/app/stack/logo-framework";
import { api } from "@/convex/_generated/api";
import { FunctionReturnType } from "convex/server";
import { HugeiconsIcon } from "@hugeicons/react";
import { PinIcon } from "@hugeicons/core-free-icons";

type StackData = FunctionReturnType<typeof api.stacks.getStack>;
type Section = StackData["sections"][number];

/**
 * Read-only stack listing for the public share page.
 */
export default function StackView({ sections }: { sections: Section[] }) {
  const nonEmpty = sections.filter((s) => s.selectedTools.length > 0);

  if (nonEmpty.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        This stack doesn&apos;t have any tools yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {nonEmpty.map((section) => {
        const pinnedIds = new Set(section.pinnedTools.map((p) => p.toolId));
        return (
          <div key={section._id}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#8a7d70]">
              {section.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              {section.selectedTools.map((st) => (
                <span
                  key={st._id}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium ${
                    pinnedIds.has(st.toolId)
                      ? "border-[#ed6809]/50 bg-[#fdf1e7]"
                      : "bg-card"
                  }`}
                >
                  <LogoFramework
                    name={st.tool.name}
                    slug={st.tool.iconSlug}
                    src={st.tool.logoUrl}
                    url={st.tool.url || undefined}
                  />
                  {st.tool.name}
                  {pinnedIds.has(st.toolId) && (
                    <HugeiconsIcon
                      icon={PinIcon}
                      className="h-3.5 w-3.5 text-[#ed6809]"
                    />
                  )}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
