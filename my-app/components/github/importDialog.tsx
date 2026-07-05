"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LogoFramework from "@/app/stack/logo-framework";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GithubIcon,
  Loading03Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FunctionReturnType } from "convex/server";
import { Id } from "@/convex/_generated/dataModel";
import type { DetectedTool } from "@/lib/github/tool-map";

type StackData = FunctionReturnType<typeof api.stacks.getStack>;
type Section = StackData["sections"][number];

interface DetectResponse {
  repo: { fullName: string; description: string | null };
  tools: DetectedTool[];
}

export default function GithubImportDialog({
  sections,
}: {
  sections: Section[];
}) {
  const [open, setOpen] = useState(false);
  const [repoInput, setRepoInput] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectResponse | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);

  const getOrCreateTool = useMutation(api.tools.getOrCreateTool);
  const updateSectionTools = useMutation(api.stacks.updateSectionTools);

  const reset = () => {
    setRepoInput("");
    setError(null);
    setResult(null);
    setExcluded(new Set());
    setDone(false);
  };

  const detect = async () => {
    if (!repoInput.trim()) return;
    setIsDetecting(true);
    setError(null);
    setResult(null);
    setDone(false);
    try {
      const res = await fetch(
        `/api/github/detect?repo=${encodeURIComponent(repoInput.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Detection failed");
      }
      setResult(data as DetectResponse);
      setExcluded(new Set());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't analyze that repository"
      );
    } finally {
      setIsDetecting(false);
    }
  };

  const toggleTool = (name: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const importSelected = async () => {
    if (!result) return;
    const chosen = result.tools.filter((t) => !excluded.has(t.name));
    if (chosen.length === 0) return;

    setIsImporting(true);
    setError(null);
    try {
      // Upsert every chosen tool, then merge IDs into the matching sections
      const created = await Promise.all(
        chosen.map((tool) =>
          getOrCreateTool({
            name: tool.name,
            domain: tool.domain,
            logoUrl: tool.logoUrl,
            category: tool.category,
          })
        )
      );

      const byCategory = new Map<string, Id<"tools">[]>();
      created.forEach((tool, i) => {
        const category = chosen[i].category;
        byCategory.set(category, [...(byCategory.get(category) ?? []), tool._id]);
      });

      for (const [category, newIds] of byCategory) {
        const section = sections.find((s) => s.sectionType === category);
        if (!section) continue;
        const existingIds = section.selectedTools.map((st) => st.toolId);
        const merged = [...new Set([...existingIds, ...newIds])];
        await updateSectionTools({ sectionId: section._id, toolIds: merged });
      }

      setDone(true);
    } catch (err) {
      console.error("Import failed:", err);
      setError("Something went wrong while importing. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = result
    ? result.tools.length - excluded.size
    : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <HugeiconsIcon icon={GithubIcon} className="h-4 w-4" /> Import from GitHub
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import your stack from GitHub</DialogTitle>
          <DialogDescription>
            Paste a public repository and we&apos;ll detect the tools it uses
            from its manifests.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="owner/repo or github.com URL"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void detect();
            }}
            disabled={isDetecting}
          />
          <Button
            onClick={() => void detect()}
            disabled={isDetecting || !repoInput.trim()}
            className="bg-[#ed6809] text-white hover:bg-[#d55e08]"
          >
            {isDetecting ? (
              <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />
            ) : (
              "Detect"
            )}
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {result.repo.fullName}
              </span>
              {result.tools.length === 0
                ? " — no recognizable tools found in this repo's manifests."
                : ` — found ${result.tools.length} tool${
                    result.tools.length === 1 ? "" : "s"
                  }. Tap to exclude any you don't want.`}
            </p>

            <div className="flex flex-wrap gap-2">
              {result.tools.map((tool) => {
                const isExcluded = excluded.has(tool.name);
                return (
                  <button
                    key={tool.name}
                    type="button"
                    onClick={() => toggleTool(tool.name)}
                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                      isExcluded
                        ? "border-dashed opacity-40"
                        : "border-[#ed6809]/50 bg-[#fdf1e7]"
                    }`}
                  >
                    <LogoFramework
                      url={tool.domain}
                      name={tool.name}
                      src={tool.logoUrl}
                    />
                    {tool.name}
                  </button>
                );
              })}
            </div>

            {result.tools.length > 0 && (
              <Button
                onClick={() => void importSelected()}
                disabled={isImporting || selectedCount === 0 || done}
                className="bg-[#1a1a1a] text-white hover:bg-[#333]"
              >
                {done ? (
                  <>
                    <HugeiconsIcon icon={Tick01Icon} className="h-4 w-4" /> Added to your stack
                  </>
                ) : isImporting ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" /> Importing...
                  </>
                ) : (
                  `Add ${selectedCount} tool${selectedCount === 1 ? "" : "s"}`
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
